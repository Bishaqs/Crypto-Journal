/**
 * Simple in-memory sliding window rate limiter.
 * Suitable for single-instance deployments. For multi-instance,
 * replace with Upstash Redis or similar.
 */

type RateLimitEntry = {
  timestamps: number[];
};

const store = new Map<string, RateLimitEntry>();

// Clean up stale entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  const cutoff = now - windowMs;
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}

type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetMs: number;
};

/**
 * Check if a request should be rate limited.
 *
 * @param key - Unique identifier (e.g., user ID)
 * @param maxRequests - Max requests allowed in the window
 * @param windowMs - Time window in milliseconds
 */
export function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  cleanup(windowMs);

  const now = Date.now();
  const cutoff = now - windowMs;

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove expired timestamps
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  if (entry.timestamps.length >= maxRequests) {
    const oldestInWindow = entry.timestamps[0];
    const resetMs = oldestInWindow + windowMs - now;
    return {
      success: false,
      remaining: 0,
      resetMs,
    };
  }

  entry.timestamps.push(now);
  return {
    success: true,
    remaining: maxRequests - entry.timestamps.length,
    resetMs: windowMs,
  };
}
