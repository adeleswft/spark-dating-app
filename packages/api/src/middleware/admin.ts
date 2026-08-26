import { Context, Next } from 'hono';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'spark-dev-secret-key');

type UserRole = 'user' | 'admin' | 'super_admin';

/**
 * Requires admin role (admin or super_admin).
 */
export const adminMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    const [user] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);

    if (!user || !user.role || user.role === 'user') {
      return c.json({ error: 'Forbidden — admin access required' }, 403);
    }

    c.set('userId', payload.userId);
    c.set('adminId', payload.userId);
    c.set('adminRole', user.role);
    await next();
  } catch {
    return c.json({ error: 'Invalid token' }, 401);
  }
};

/**
 * Requires super_admin role only.
 * Must be used AFTER adminMiddleware (which sets adminRole in context).
 * If called standalone (not behind adminMiddleware), it does its own auth.
 */
export const superAdminMiddleware = async (c: Context, next: Next) => {
  // If adminMiddleware already ran, check the cached role
  const existingRole = c.get('adminRole') as string | undefined;
  if (existingRole) {
    if (existingRole !== 'super_admin') {
      return c.json({ error: 'Forbidden — super admin access required' }, 403);
    }
    await next();
    return;
  }

  // Standalone: do full auth
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    const [user] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);

    if (!user || user.role !== 'super_admin') {
      return c.json({ error: 'Forbidden — super admin access required' }, 403);
    }

    c.set('userId', payload.userId);
    c.set('adminId', payload.userId);
    c.set('adminRole', user.role);
    await next();
  } catch {
    return c.json({ error: 'Invalid token' }, 401);
  }
};
