/**
 * 사용량 카운터 저장소.
 *
 * 기본은 인스턴스 메모리입니다. 서버가 여러 개로 늘어나면 인스턴스마다 따로 세므로
 * 엄밀한 상한이 아닙니다. 공유 저장소 환경변수가 있으면 그쪽을 씁니다.
 *
 * 켜는 법: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN 두 개만 설정하면 됩니다.
 * SDK 없이 REST로만 호출하므로 의존성이 늘지 않습니다.
 */

export type CounterHit = {
  /** 이번 요청까지 포함한 창 안 누적 횟수 */
  count: number;
  /** 창이 끝날 때까지 남은 초 */
  resetInSec: number;
};

export interface RateLimitStore {
  readonly kind: "memory" | "redis";
  /** key의 카운터를 1 올리고 현재 값을 돌려줍니다. 창이 지났으면 새로 시작합니다. */
  increment(key: string, windowMs: number, now: number): Promise<CounterHit>;
  /** 테스트용. 메모리 저장소에서만 의미가 있습니다. */
  reset(): void;
}

// ── 메모리 ────────────────────────────────────────────────────
type Counter = { count: number; resetAt: number };

class MemoryStore implements RateLimitStore {
  readonly kind = "memory" as const;
  private buckets = new Map<string, Counter>();

  private sweep(now: number) {
    if (this.buckets.size < 5_000) return;
    for (const [key, counter] of this.buckets) {
      if (counter.resetAt <= now) this.buckets.delete(key);
    }
  }

  async increment(key: string, windowMs: number, now: number): Promise<CounterHit> {
    this.sweep(now);
    const current = this.buckets.get(key);
    if (!current || current.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + windowMs });
      return { count: 1, resetInSec: Math.ceil(windowMs / 1000) };
    }
    current.count += 1;
    return { count: current.count, resetInSec: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }

  reset() {
    this.buckets.clear();
  }
}

// ── Upstash Redis (REST) ──────────────────────────────────────
/**
 * INCR로 올리고, 처음 만들어진 키에만 EXPIRE를 겁니다.
 * 파이프라인 한 번으로 끝내 왕복을 늘리지 않습니다.
 */
class RedisStore implements RateLimitStore {
  readonly kind = "redis" as const;
  constructor(private url: string, private token: string) {}

  async increment(key: string, windowMs: number, now: number): Promise<CounterHit> {
    const seconds = Math.ceil(windowMs / 1000);
    const namespaced = `nyp:rl:${key}`;
    const response = await fetch(`${this.url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["INCR", namespaced],
        ["TTL", namespaced],
      ]),
      cache: "no-store",
      signal: AbortSignal.timeout(2_000),
    });
    if (!response.ok) throw new Error(`upstash ${response.status}`);
    const payload = await response.json() as Array<{ result?: number; error?: string }>;
    const count = Number(payload?.[0]?.result ?? 0);
    let ttl = Number(payload?.[1]?.result ?? -1);

    // 새로 만들어진 키(TTL 없음)에만 만료를 겁니다.
    if (ttl < 0) {
      await fetch(`${this.url}/expire/${encodeURIComponent(namespaced)}/${seconds}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(2_000),
      }).catch(() => {});
      ttl = seconds;
    }
    return { count: count || 1, resetInSec: Math.max(1, ttl) };
  }

  reset() {
    // 공유 저장소는 비우지 않습니다.
  }
}

let cached: RateLimitStore | null = null;

export function getRateLimitStore(): RateLimitStore {
  if (cached) return cached;
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  cached = url && token ? new RedisStore(url.replace(/\/$/, ""), token) : new MemoryStore();
  return cached;
}

/** 테스트에서 저장소를 갈아끼웁니다. */
export function setRateLimitStore(store: RateLimitStore | null) {
  cached = store;
}
