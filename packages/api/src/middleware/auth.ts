import { Context, Next } from 'hono';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'spark-dev-secret-key');

// Cache to avoid DB lookup on every request (5 minute TTL)
const banCache = new Map<string, { banned: boolean; suspended: boolean; checkedAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    c.set('userId', payload.userId);

    // Check if user is banned or suspended (with cache)
    const cached = banCache.get(payload.userId);
    const now = Date.now();
    if (!cached || now - cached.checkedAt > CACHE_TTL_MS) {
      const [user] = await db.select({ banned: users.banned, suspended: users.suspended })
        .from(users).where(eq(users.id, payload.userId)).limit(1);
      banCache.set(payload.userId, {
        banned: !!user?.banned,
        suspended: !!user?.suspended,
        checkedAt: now,
      });
    }

    const status = banCache.get(payload.userId)!;
    if (status.banned) {
      return c.json({ error: 'Account has been banned' }, 403);
    }
    if (status.suspended) {
      return c.json({ error: 'Account is suspended' }, 403);
    }

    await next();
  } catch {
    return c.json({ error: 'Invalid token' }, 401);
  }
};

/**
 * Invalidate the ban cache for a specific user.
 * Call this after banning or suspending a user.
 */
export function invalidateBanCache(userId: string) {
  banCache.delete(userId);
}

export const optionalAuthMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization');
  
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
      c.set('userId', payload.userId);
    } catch {
      // Token invalid, continue without auth
    }
  }
  
  await next();
};
