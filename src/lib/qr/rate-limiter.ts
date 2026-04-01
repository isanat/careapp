/**
 * Simple In-Memory Rate Limiter
 * Tracks request counts within sliding windows
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Check if request is within rate limit
 * @param key Unique identifier (e.g., userId, IP address)
 * @param limit Maximum requests allowed
 * @param windowMs Time window in milliseconds
 * @returns true if within limit, false if exceeded
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry) {
    // First request in this window
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return true;
  }

  if (now > entry.resetAt) {
    // Window expired, reset counter
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return true;
  }

  // Within window
  if (entry.count < limit) {
    entry.count++;
    return true;
  }

  return false;
}

/**
 * Get remaining requests in current window
 */
export function getRemainingRequests(
  key: string,
  limit: number,
  windowMs: number
): number {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry) {
    return limit;
  }

  if (now > entry.resetAt) {
    return limit;
  }

  return Math.max(0, limit - entry.count);
}

/**
 * Get reset time for the current window
 */
export function getResetTime(key: string): number | null {
  const entry = rateLimitStore.get(key);
  if (!entry) return null;
  return entry.resetAt;
}

/**
 * Cleanup expired entries (run periodically)
 */
export function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

// Cleanup every 5 minutes
setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
