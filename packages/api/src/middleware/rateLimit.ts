import { Context, Next } from 'hono';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyGenerator?: (c: Context) => string;
  message?: string;
}

// ── Redis client (lazy init) ────────────────────────────────────
let redisClient: any = null;
let redisAvailable = false;
let redisConnecting = false;
let redisLastFailedAt = 0;
const REDIS_RETRY_COOLDOWN_MS = 60_000; // Retry at most once per minute after failure

async function getRedis() {
  if (redisClient && redisAvailable) return redisClient;

  // If we had a failed connection, only retry after cooldown
  if (redisClient && !redisAvailable) {
    if (Date.now() - redisLastFailedAt < REDIS_RETRY_COOLDOWN_MS) return null;
    // Cooldown elapsed — clean up stale client and retry
    try { await redisClient.quit(); } catch { /* ignore */ }
    redisClient = null;
  }

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return null;

  // Prevent concurrent connection attempts
  if (redisConnecting) return null;
  redisConnecting = true;

  try {
    const { createClient } = await import('redis');
    redisClient = createClient({ url: redisUrl });
    redisClient.on('error', () => { redisAvailable = false; redisLastFailedAt = Date.now(); });
    redisClient.on('connect', () => { redisAvailable = true; });
    await redisClient.connect();
    redisAvailable = true;
    redisLastFailedAt = 0;
    console.log('✅ Rate limiter: connected to Redis');
    return redisClient;
  } catch {
    console.log('⚠️  Rate limiter: Redis unavailable, using in-memory fallback');
    redisClient = null;
    redisAvailable = false;
    redisLastFailedAt = Date.now();
    return null;
  } finally {
    redisConnecting = false;
  }
}

// ── In-memory fallback ──────────────────────────────────────────
interface MemEntry { count: number; resetAt: number; }
const memStore = new Map<string, MemEntry>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memStore) {
    if (now > entry.resetAt) memStore.delete(key);
  }
}, 60_000);

// ── Core rate limiter ───────────────────────────────────────────
export function rateLimit(options: RateLimitOptions) {
  const {
    windowMs = 60_000,
    max = 100,
    keyGenerator = defaultKeyGenerator,
    message = 'Too many requests. Please try again later.',
  } = options;

  return async (c: Context, next: Next) => {
    const key = `rl:${keyGenerator(c)}`;
    const windowSec = Math.ceil(windowMs / 1000);
    const now = Date.now();

    let count: number;
    let ttl: number;

    const redis = await getRedis();

    if (redis && redisAvailable) {
      // ── Redis: atomic INCR + EXPIRE ──────────────────────────
      count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, windowSec);
      }
      ttl = await redis.ttl(key);
      if (ttl < 0) ttl = windowSec;
    } else {
      // ── In-memory fallback ───────────────────────────────────
      let entry = memStore.get(key);
      if (!entry || now > entry.resetAt) {
        entry = { count: 0, resetAt: now + windowMs };
        memStore.set(key, entry);
      }
      entry.count++;
      count = entry.count;
      ttl = Math.ceil((entry.resetAt - now) / 1000);
    }

    const resetAt = now + ttl * 1000;

    // Set rate limit headers
    c.header('X-RateLimit-Limit', max.toString());
    c.header('X-RateLimit-Remaining', Math.max(0, max - count).toString());
    c.header('X-RateLimit-Reset', Math.ceil(resetAt / 1000).toString());

    if (count > max) {
      return c.json({
        error: message,
        retryAfter: ttl,
      }, 429);
    }

    await next();
  };
}

function defaultKeyGenerator(c: Context): string {
  const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
  const path = new URL(c.req.url).pathname;
  return `${ip}:${path}`;
}

// ── Pre-configured rate limiters ────────────────────────────────
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts. Please wait 15 minutes.',
});

export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
});

export const strictRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Rate limit exceeded for this endpoint.',
});
