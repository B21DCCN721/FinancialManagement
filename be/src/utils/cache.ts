import type Redis from "ioredis"
import crypto from "crypto"

/**
 * Build a cache key from parts, hashing long query-param objects.
 */
export function buildCacheKey(...parts: (string | number | object)[]): string {
  return parts
    .map((p) =>
      typeof p === "object" ? crypto.createHash("md5").update(JSON.stringify(p)).digest("hex") : String(p)
    )
    .join(":")
}

/**
 * Get and parse a cached value from Redis.
 * Returns null on cache miss or parse error.
 */
export async function getCache<T>(redis: Redis, key: string): Promise<T | null> {
  try {
    const value = await redis.get(key)
    if (!value) return null
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

/**
 * Serialize and set a value in Redis with TTL (seconds).
 */
export async function setCache(
  redis: Redis,
  key: string,
  data: unknown,
  ttlSeconds: number
): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(data), "EX", ttlSeconds)
  } catch {
    // Non-fatal – cache miss on next request is acceptable
  }
}

/**
 * Delete specific cache keys.
 */
export async function deleteCache(redis: Redis, ...keys: string[]): Promise<void> {
  if (keys.length === 0) return
  try {
    await redis.del(...keys)
  } catch {
    // Non-fatal
  }
}

/**
 * Delete all cache keys matching a pattern (uses SCAN for safety).
 */
export async function invalidateCachePattern(redis: Redis, pattern: string): Promise<void> {
  try {
    let cursor = "0"
    do {
      const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100)
      cursor = nextCursor
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } while (cursor !== "0")
  } catch {
    // Non-fatal
  }
}

// ---  TTL constants (seconds) ---
export const TTL = {
  SHORT: 120,    // 2 min  – transactions list
  MEDIUM: 300,   // 5 min  – budgets, goals, user profile
  LONG: 600,     // 10 min – categories, reports
} as const
