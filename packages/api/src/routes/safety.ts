import { Hono } from 'hono';
import { db } from '../db';
import { blockedUsers, reports, users } from '../db/schema';
import { eq, and, or, desc } from 'drizzle-orm';

export const safetyRoutes = new Hono();

// ─── Block User ────────────────────────────────────────────────

/**
 * POST /safety/block — Block a user
 */
safetyRoutes.post('/block', async (c: any) => {
  const userId: string = c.get('userId');
  const { blockedId, reason } = await c.req.json() as { blockedId: string; reason?: string };

  if (!blockedId) {
    return c.json({ error: 'blockedId is required' }, 400);
  }

  if (blockedId === userId) {
    return c.json({ error: 'Cannot block yourself' }, 400);
  }

  // Check target user exists
  const [target] = await db.select({ id: users.id }).from(users).where(eq(users.id, blockedId)).limit(1);
  if (!target) {
    return c.json({ error: 'User not found' }, 404);
  }

  // Check if already blocked
  const [existing] = await db
    .select()
    .from(blockedUsers)
    .where(and(eq(blockedUsers.blockerId, userId), eq(blockedUsers.blockedId, blockedId)))
    .limit(1);

  if (existing) {
    return c.json({ success: true, message: 'User already blocked' });
  }

  const [block] = await db
    .insert(blockedUsers)
    .values({ blockerId: userId, blockedId })
    .returning();

  // Also create a report if reason provided
  if (reason) {
    await db.insert(reports).values({
      reporterId: userId,
      reportedId: blockedId,
      reason: 'blocked',
      description: reason,
      severity: 'medium',
    });
  }

  return c.json({ success: true, block });
});

/**
 * DELETE /safety/block/:blockedId — Unblock a user
 */
safetyRoutes.delete('/block/:blockedId', async (c: any) => {
  const userId: string = c.get('userId');
  const blockedId = c.req.param('blockedId');

  const [deleted] = await db
    .delete(blockedUsers)
    .where(and(eq(blockedUsers.blockerId, userId), eq(blockedUsers.blockedId, blockedId)))
    .returning();

  if (!deleted) {
    return c.json({ error: 'Block not found' }, 404);
  }

  return c.json({ success: true, message: 'User unblocked' });
});

/**
 * GET /safety/blocked — List blocked users
 */
safetyRoutes.get('/blocked', async (c: any) => {
  const userId: string = c.get('userId');

  const blocks = await db
    .select({
      id: blockedUsers.id,
      blockedId: blockedUsers.blockedId,
      createdAt: blockedUsers.createdAt,
    })
    .from(blockedUsers)
    .where(eq(blockedUsers.blockerId, userId))
    .orderBy(desc(blockedUsers.createdAt));

  // Fetch blocked user details
  const result = await Promise.all(
    blocks.map(async (block) => {
      const [user] = await db
        .select({ id: users.id, name: users.name, photos: users.photos })
        .from(users)
        .where(eq(users.id, block.blockedId))
        .limit(1);

      return {
        id: block.id,
        blockedId: block.blockedId,
        name: user?.name || 'Unknown',
        photo: user?.photos?.[0] || '',
        blockedAt: block.createdAt?.toISOString() || new Date().toISOString(),
      };
    })
  );

  return c.json({ blockedUsers: result });
});

// ─── Report User ───────────────────────────────────────────────

/**
 * POST /safety/report — Report a user
 */
safetyRoutes.post('/report', async (c: any) => {
  const userId: string = c.get('userId');
  const { reportedId, reason, description, severity } = await c.req.json() as {
    reportedId: string;
    reason: string;
    description?: string;
    severity?: string;
  };

  if (!reportedId || !reason) {
    return c.json({ error: 'reportedId and reason are required' }, 400);
  }

  if (reportedId === userId) {
    return c.json({ error: 'Cannot report yourself' }, 400);
  }

  // Check target user exists
  const [target] = await db.select({ id: users.id }).from(users).where(eq(users.id, reportedId)).limit(1);
  if (!target) {
    return c.json({ error: 'User not found' }, 404);
  }

  // Map reason IDs to severity levels
  const severityMap: Record<string, string> = {
    'fake-profile': 'high',
    'inappropriate': 'high',
    'harassment': 'critical',
    'spam': 'medium',
    'underage': 'critical',
    'offensive': 'high',
    'violence': 'critical',
    'other': 'low',
    'blocked': 'medium',
  };

  const [report] = await db
    .insert(reports)
    .values({
      reporterId: userId,
      reportedId,
      reason,
      description: description || null,
      severity: (severity || severityMap[reason] || 'low') as any,
      status: 'pending',
    })
    .returning();

  return c.json({ success: true, report });
});

/**
 * GET /safety/reports — List reports filed by this user
 */
safetyRoutes.get('/reports', async (c: any) => {
  const userId: string = c.get('userId');

  const userReports = await db
    .select()
    .from(reports)
    .where(eq(reports.reporterId, userId))
    .orderBy(desc(reports.createdAt));

  const result = userReports.map((r) => ({
    id: r.id,
    reportedId: r.reportedId,
    reason: r.reason,
    description: r.description,
    severity: r.severity,
    status: r.status,
    createdAt: r.createdAt?.toISOString(),
  }));

  return c.json({ reports: result });
});
