// Lightweight in-memory rate limiter.
//
// NOTE: This is per-instance. On serverless (Vercel) each cold-started
// instance keeps its own counter, so under heavy scale you should move this
// to a shared store (e.g. Upstash Redis / @upstash/ratelimit). For an MVP and
// for blocking naive brute-force from a single IP, this is a solid first line.

interface Hit {
  count: number;
  resetAt: number;
}

const store = new Map<string, Hit>();

// Occasionally purge expired keys so the map doesn't grow unbounded.
let opsSincePurge = 0;
function maybePurge(now: number) {
  opsSincePurge += 1;
  if (opsSincePurge < 500) return;
  opsSincePurge = 0;
  for (const [key, hit] of Array.from(store.entries())) {
    if (hit.resetAt <= now) store.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Sliding fixed-window rate limit.
 * @param key      Unique bucket key (e.g. `login:<ip>`).
 * @param limit    Max allowed hits within the window.
 * @param windowMs Window size in milliseconds.
 */
export function rateLimit(key: string, limit = 10, windowMs = 60_000): RateLimitResult {
  const now = Date.now();
  maybePurge(now);

  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, retryAfterSeconds: 0 };
}

/** Best-effort client IP extraction from a request's proxy headers. */
export function ipFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}
