/**
 * Distributed rate limiter using Upstash Redis.
 * Falls back to in-memory if Upstash env vars are missing (dev mode).
 */
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetMs: number;
};

/* ---------- Upstash Redis client (singleton) ---------- */

const hasUpstash = !!(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

const redis = hasUpstash
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

/* ---------- Upstash rate limiters (cached per config) ---------- */

const limiters = new Map<string, Ratelimit>();

function getUpstashLimiter(maxRequests: number, windowMs: number): Ratelimit {
  const key = `${maxRequests}:${windowMs}`;
  let limiter = limiters.get(key);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(maxRequests, `${windowMs} ms`),
      prefix: "rl",
    });
    limiters.set(key, limiter);
  }
  return limiter;
}

/* ---------- In-memory fallback (dev / missing env vars) ---------- */

type InMemoryEntry = { timestamps: number[] };
const memStore = new Map<string, InMemoryEntry>();
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 5 * 60 * 1000;

function inMemoryRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    lastCleanup = now;
    const cutoff = now - windowMs;
    for (const [k, entry] of memStore) {
      entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
      if (entry.timestamps.length === 0) memStore.delete(k);
    }
  }

  const cutoff = now - windowMs;
  let entry = memStore.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    memStore.set(key, entry);
  }
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  if (entry.timestamps.length >= maxRequests) {
    const resetMs = entry.timestamps[0] + windowMs - now;
    return { success: false, remaining: 0, resetMs };
  }

  entry.timestamps.push(now);
  return {
    success: true,
    remaining: maxRequests - entry.timestamps.length,
    resetMs: windowMs,
  };
}

/* ---------- Public API ---------- */

/**
 * Check if a request should be rate limited.
 * Uses Upstash Redis in production, falls back to in-memory for dev.
 */
export async function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult> {
  if (!hasUpstash) {
    return inMemoryRateLimit(key, maxRequests, windowMs);
  }

  try {
    const limiter = getUpstashLimiter(maxRequests, windowMs);
    const result = await limiter.limit(key);
    return {
      success: result.success,
      remaining: result.remaining,
      resetMs: Math.max(0, result.reset - Date.now()),
    };
  } catch {
    // Redis unavailable — fall back to in-memory
    return inMemoryRateLimit(key, maxRequests, windowMs);
  }
}
