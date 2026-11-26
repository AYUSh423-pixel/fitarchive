/**
 * Rate Limiting Utility
 * In-memory sliding window rate limiter for API routes
 * For production, consider Redis-based solution (Upstash, Vercel KV)
 */

interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  keyPrefix?: string;    // Prefix for the rate limit key
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  total: number;
}

// In-memory store (resets on deployment - fine for basic protection)
// For production scale, replace with Redis/KV
const store = new Map<string, { count: number; resetTime: number }>();

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of store.entries()) {
    if (value.resetTime < now) {
      store.delete(key);
    }
  }
}, 60 * 1000); // Every minute

export function createRateLimiter(config: RateLimitConfig) {
  const { windowMs, maxRequests, keyPrefix = 'rl' } = config;

  return function rateLimit(key: string): RateLimitResult {
    const fullKey = `${keyPrefix}:${key}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    const entry = store.get(fullKey);

    if (!entry || entry.resetTime < now) {
      // First request or window expired
      const resetTime = now + windowMs;
      store.set(fullKey, { count: 1, resetTime });
      return {
        success: true,
        remaining: maxRequests - 1,
        resetTime,
        total: maxRequests,
      };
    }

    if (entry.count >= maxRequests) {
      // Rate limited
      return {
        success: false,
        remaining: 0,
        resetTime: entry.resetTime,
        total: maxRequests,
      };
    }

    // Increment count
    entry.count++;
    store.set(fullKey, entry);
    return {
      success: true,
      remaining: maxRequests - entry.count,
      resetTime: entry.resetTime,
      total: maxRequests,
    };
  };
}

// Pre-configured limiters for common use cases
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 30,          // 30 attempts per 15 min (allows testing + real use)
  keyPrefix: 'auth',
});

export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,      // 1 minute
  maxRequests: 60,          // 60 requests per minute
  keyPrefix: 'api',
});

export const aiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,      // 1 minute
  maxRequests: 10,          // 10 AI requests per minute
  keyPrefix: 'ai',
});

export const strictRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,      // 1 minute
  maxRequests: 30,          // 30 requests per minute (allows normal browsing)
  keyPrefix: 'strict',
});

/**
 * Extract client identifier from request
 * Uses IP + User-Agent for basic fingerprinting
 */
export function getClientKey(req: Request): string {
  // In production behind proxy, use x-forwarded-for
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  const ua = req.headers.get('user-agent') || 'unknown';
  // Simple hash of IP + UA
  let hash = 0;
  const str = `${ip}:${ua}`;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Apply rate limit and return response if limited
 * Returns null if not limited, or NextResponse if limited
 */
export function applyRateLimit(
  req: Request,
  limiter: (key: string) => RateLimitResult,
  key?: string
): { success: boolean; headers: HeadersInit } | null {
  const clientKey = key || getClientKey(req);
  const result = limiter(clientKey);

  const headers: HeadersInit = {
    'X-RateLimit-Limit': result.total.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
  };

  if (!result.success) {
    headers['Retry-After'] = Math.ceil((result.resetTime - Date.now()) / 1000).toString();
    return { success: false, headers };
  }

  return { success: true, headers };
}