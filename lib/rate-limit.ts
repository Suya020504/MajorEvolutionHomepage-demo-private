/**
 * AI 호출 사용량 제한.
 *
 * 배포 주소가 공개라 누구나 AI 엔드포인트를 반복 호출할 수 있고, 요금은
 * 저장소 소유자의 키에서 나갑니다. 한 사람이 연달아 두드리는 상황을 막습니다.
 *
 * 한계: 카운터가 서버 인스턴스 메모리에 있습니다. 인스턴스가 여러 개로 늘어나면
 * 인스턴스마다 따로 셉니다. 정확한 상한이 필요하면 공유 저장소(예: KV)가 필요합니다.
 * 그 전까지의 안전장치로 인스턴스별 하루 총량도 함께 겁니다.
 */

export type RateLimitRule = {
  /** 창 길이(ms) */
  windowMs: number;
  /** 창 안에서 허용할 횟수 */
  max: number;
};

export const AI_RATE_LIMITS = {
  /** 연타 방지 */
  perMinute: { windowMs: 60_000, max: 8 } satisfies RateLimitRule,
  /** 한 사람이 하루에 쓸 수 있는 양 */
  perDay: { windowMs: 24 * 60 * 60_000, max: 60 } satisfies RateLimitRule,
  /** 인스턴스 전체 하루 총량. 분산 공격이나 IP 변경에 대한 최후 방어선 */
  globalPerDay: { windowMs: 24 * 60 * 60_000, max: 800 } satisfies RateLimitRule,
} as const;

type Counter = { count: number; resetAt: number };

const buckets = new Map<string, Counter>();

/** 오래된 카운터를 정리해 메모리가 무한히 늘지 않게 합니다. */
function sweep(now: number) {
  if (buckets.size < 5_000) return;
  for (const [key, counter] of buckets) {
    if (counter.resetAt <= now) buckets.delete(key);
  }
}

function hit(key: string, rule: RateLimitRule, now: number): { ok: boolean; retryAfterSec: number } {
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + rule.windowMs });
    return { ok: true, retryAfterSec: 0 };
  }
  if (current.count >= rule.max) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }
  current.count += 1;
  return { ok: true, retryAfterSec: 0 };
}

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSec: number; scope: "minute" | "day" | "global" };

/**
 * 클라이언트 식별자. 프록시 뒤에서는 x-forwarded-for의 첫 주소를 씁니다.
 * 개인정보를 저장하지 않도록 주소 자체는 카운터 키로만 쓰고 로그에 남기지 않습니다.
 */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function checkAiRateLimit(request: Request, now = Date.now()): RateLimitResult {
  sweep(now);
  const key = clientKey(request);

  const global = hit("global", AI_RATE_LIMITS.globalPerDay, now);
  if (!global.ok) return { allowed: false, retryAfterSec: global.retryAfterSec, scope: "global" };

  const minute = hit(`m:${key}`, AI_RATE_LIMITS.perMinute, now);
  if (!minute.ok) return { allowed: false, retryAfterSec: minute.retryAfterSec, scope: "minute" };

  const day = hit(`d:${key}`, AI_RATE_LIMITS.perDay, now);
  if (!day.ok) return { allowed: false, retryAfterSec: day.retryAfterSec, scope: "day" };

  return { allowed: true };
}

const MESSAGE: Record<"minute" | "day" | "global", string> = {
  minute: "요청이 너무 빠릅니다. 잠시 후 다시 시도해 주세요.",
  day: "오늘 사용할 수 있는 AI 요청을 모두 썼습니다. 내일 다시 이용해 주세요.",
  global: "지금은 AI 요청이 많아 잠시 제한하고 있습니다. 잠시 후 다시 시도해 주세요.",
};

export function rateLimitMessage(scope: "minute" | "day" | "global"): string {
  return MESSAGE[scope];
}

/** 테스트에서 카운터를 비웁니다. */
export function resetRateLimits() {
  buckets.clear();
}
