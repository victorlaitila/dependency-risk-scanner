import { Redis } from "@upstash/redis";
import type { ExplanationRequest } from "./ai-explanation-service.js";

/**
 * Redis client for caching AI explanations.
 * Initialized only if Upstash credentials are available.
 * If credentials are missing, all cache operations gracefully no-op.
 */
let redisClient: Redis | null | undefined;

function initializeRedis(): Redis | null {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) {
    return null;
  }

  try {
    const client = new Redis({
      url: redisUrl,
      token: redisToken,
    });
    return client;
  } catch (error) {
    console.warn(
      `Failed to initialize Redis client: ${error instanceof Error ? error.message : String(error)}`,
    );
    return null;
  }
}

// Lazy initialization
function getRedisClient(): Redis | null {
  if (redisClient === undefined) {
    redisClient = initializeRedis();
  }
  return redisClient;
}

/**
 * Generates a deterministic cache key for the explanation request.
 * Format: exp:<name>|<version>|<impactScore>|<dependentsCount>|<depth>
 * This key is stable and includes all inputs that affect the explanation.
 */
export function generateCacheKey(req: ExplanationRequest): string {
  const parts = [
    req.name,
    req.version,
    req.impactScore,
    req.dependentsCount,
    req.depth,
  ];
  return `exp:${parts.join("|")}`;
}

/**
 * Attempts to retrieve a cached explanation from Redis.
 * Returns null if Redis is unavailable or the key is not found.
 * Errors are logged but do not throw.
 */
export async function getCachedExplanation(cacheKey: string): Promise<string | null> {
  const client = getRedisClient();
  if (!client) {
    return null;
  }

  try {
    const cached = await client.get(cacheKey);
    if (typeof cached === "string") {
      return cached;
    }
    return null;
  } catch (error) {
    console.warn(
      `Cache retrieval failed for key ${cacheKey}: ${error instanceof Error ? error.message : String(error)}`,
    );
    return null;
  }
}

/**
 * Stores an explanation in Redis cache with a 24-hour TTL.
 * If Redis is unavailable, the write is skipped silently.
 * Errors are logged but do not throw.
 */
export async function setCachedExplanation(cacheKey: string, explanation: string): Promise<void> {
  const client = getRedisClient();
  if (!client) {
    return;
  }

  try {
    // Cache for 24 hours (86400 seconds)
    await client.set(cacheKey, explanation, { ex: 86400 });
  } catch (error) {
    console.warn(
      `Cache storage failed for key ${cacheKey}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
