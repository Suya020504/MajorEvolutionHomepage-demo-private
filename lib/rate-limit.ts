import { getRateLimitStore } from "@/lib/rate-limit-store";

/**
 * AI 호출 사용량 제한.
 *
 * 배포 주소가 공개라 누구나 AI 엔드포인트를 반복 호출할 수 있고, 요금은
 * 저장소 소유자의 키에서 나갑니다. 한 사람이 연달아 두드리는 상황을 막습니다.
 *
 * 카운터는 lib/rate-limit-store가 관리합니다. 공유 저장소 환경변수가 없으면
 * 인스턴스 메모리로 동작하므로, 서버가 여러 개면 인스턴스마다 따로 셉니다.
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
  /** 전체 하루 총량. 분산 요청이나 IP 변경에 대한 최후 방어선 */
  globalPerDay: { windowMs: 24 * 60 * 60_000, max: 800 } satisfies RateLimitRule,
} as const;

export type RateLimitScope = "minute" | "day" | "global";

export type RateLimitResult =
  | { allowed: true; store: "memory" | "redis" }
  | { allowed: false; retryAfterSec: number; scope: RateLimitScope; store: "memory" | "redis" };

/**
 * 클라이언트 식별자. 프록시 뒤에서는 x-forwarded-for의 첫 주소를 씁니다.
 * 카운터 키로만 쓰고 로그에는 남기지 않습니다.
 */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function checkAiRateLimit(request: Request, now = Date.now()): Promise<RateLimitResult> {
  const store = getRateLimitStore();
  const key = clientKey(request);
  const checks: Array<{ scope: RateLimitScope; bucket: string; rule: RateLimitRule }> = [
    { scope: "global", bucket: "global", rule: AI_RATE_LIMITS.globalPerDay },
    { scope: "minute", bucket: `m:${key}`, rule: AI_RATE_LIMITS.perMinute },
    { scope: "day", bucket: `d:${key}`, rule: AI_RATE_LIMITS.perDay },
  ];

  try {
    for (const check of checks) {
      const hit = await store.increment(check.bucket, check.rule.windowMs, now);
      if (hit.count > check.rule.max) {
        return { allowed: false, retryAfterSec: hit.resetInSec, scope: check.scope, store: store.kind };
      }
    }
    return { allowed: true, store: store.kind };
  } catch (error) {
    /*
     * 공유 저장소가 답하지 않을 때 요청을 막지는 않습니다.
     * 제한은 비용을 줄이기 위한 장치지, 서비스를 멈추기 위한 것이 아닙니다.
     */
    console.warn("[ai] rate limit store unavailable", error instanceof Error ? error.name : "unknown");
    return { allowed: true, store: store.kind };
  }
}

const MESSAGE: Record<RateLimitScope, string> = {
  minute: "요청이 너무 빠릅니다. 잠시 후 다시 시도해 주세요.",
  day: "오늘 사용할 수 있는 AI 요청을 모두 썼습니다. 내일 다시 이용해 주세요.",
  global: "지금은 AI 요청이 많아 잠시 제한하고 있습니다. 잠시 후 다시 시도해 주세요.",
};

export function rateLimitMessage(scope: RateLimitScope): string {
  return MESSAGE[scope];
}
