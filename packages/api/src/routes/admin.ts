import { Hono } from 'hono';
import { db } from '../db';
import { users, matches, swipes, messages, subscriptions, reports, moderationActions, userInterests, userPreferences, pushTokens } from '../db/schema';
import { eq, sql, desc, count, and, gte } from 'drizzle-orm';
import { sanitizeUser } from '../db/sanitize';
import { superAdminMiddleware } from '../middleware/admin';
import { invalidateBanCache } from '../middleware/auth';

const app = new Hono();

function getAdminId(c: any): string {
  return c.get('adminId') as string;
}

function getAdminRole(c: any): string {
  return c.get('adminRole') as string;
}

// ─── Admin Management (super_admin only) ────────────────────────
app.get('/admins', superAdminMiddleware, async (c) => {
  const admins = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      lastActiveAt: users.lastActiveAt,
    })
    .from(users)
    .where(sql`${users.role} != 'user'`)
    .orderBy(desc(users.createdAt));

  return c.json({
    admins: admins.map((a) => ({
      id: a.id,
      name: a.name,
      email: a.email,
      role: a.role,
      createdAt: a.createdAt,
      lastActiveAt: a.lastActiveAt,
    })),
  });
});

app.post('/admins/promote', superAdminMiddleware, async (c) => {
  const body = await c.req.json() as { userId: string; role?: string };
  const targetRole = body.role === 'super_admin' ? 'super_admin' : 'admin';

  const [user] = await db.select().from(users).where(eq(users.id, body.userId)).limit(1);
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  if (user.role === 'super_admin') {
    return c.json({ error: 'Cannot promote an existing super admin' }, 400);
  }

  await db.update(users).set({ role: targetRole as any }).where(eq(users.id, body.userId));

  return c.json({
    success: true,
    user: { id: user.id, name: user.name, email: user.email, role: targetRole },
  });
});

app.post('/admins/demote', superAdminMiddleware, async (c) => {
  const body = await c.req.json() as { userId: string };

  const [user] = await db.select().from(users).where(eq(users.id, body.userId)).limit(1);
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  const callerId = getAdminId(c);
  if (user.id === callerId) {
    return c.json({ error: 'Cannot demote yourself' }, 400);
  }

  if (user.role === 'user') {
    return c.json({ error: 'User is not an admin' }, 400);
  }

  await db.update(users).set({ role: 'user' }).where(eq(users.id, body.userId));

  return c.json({
    success: true,
    user: { id: user.id, name: user.name, email: user.email, role: 'user' },
  });
});

// ─── Current admin info ─────────────────────────────────────────
app.get('/me', async (c) => {
  const adminId = getAdminId(c);
  const role = getAdminRole(c);
  const [user] = await db.select().from(users).where(eq(users.id, adminId)).limit(1);

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  return c.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role,
    isAdmin: role !== 'user',
  });
});

// ─── Dashboard KPIs ─────────────────────────────────────────────
app.get('/stats', async (c) => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Core KPIs
  const [totalUsers] = await db.select({ value: count() }).from(users);
  const [activeToday] = await db
    .select({ value: count() })
    .from(users)
    .where(gte(users.lastActiveAt, todayStart));
  const [matchesToday] = await db
    .select({ value: count() })
    .from(matches)
    .where(gte(matches.createdAt, todayStart));
  const [pendingReports] = await db
    .select({ value: count() })
    .from(reports)
    .where(eq(reports.status, 'pending'));

  // Subscription counts
  const subCounts = await db
    .select({ tier: subscriptions.tier, value: count() })
    .from(subscriptions)
    .groupBy(subscriptions.tier);

  // ── Revenue KPIs ───────────────────────────────────────────────
  // MRR calculation (estimated based on active subscriptions)
  const activeSubs = await db
    .select({ tier: subscriptions.tier, value: count() })
    .from(subscriptions)
    .where(sql`${subscriptions.expiresAt} > NOW()`)
    .groupBy(subscriptions.tier);

  const subRevenue: Record<string, number> = { plus: 5.99, elite: 10.99 };
  const mrr = activeSubs.reduce((sum, s) => sum + (s.value * (subRevenue[s.tier || 'free'] || 0)), 0);
  const arr = mrr * 12;

  // ── Funnel KPIs ────────────────────────────────────────────────
  const [totalSwipes] = await db.select({ value: count() }).from(swipes);
  const [totalMatches] = await db.select({ value: count() }).from(matches);
  const [swipesThisWeek] = await db
    .select({ value: count() })
    .from(swipes)
    .where(gte(swipes.createdAt, weekAgo));
  const [matchesThisWeek] = await db
    .select({ value: count() })
    .from(matches)
    .where(gte(matches.createdAt, weekAgo));

  const swipeToMatchRate = totalSwipes.value > 0
    ? Math.round((totalMatches.value / totalSwipes.value) * 100 * 10) / 10
    : 0;
  const weeklySwipeToMatchRate = swipesThisWeek.value > 0
    ? Math.round((matchesThisWeek.value / swipesThisWeek.value) * 100 * 10) / 10
    : 0;

  // ── Retention KPIs ─────────────────────────────────────────────
  const [activeLast7Days] = await db
    .select({ value: count() })
    .from(users)
    .where(gte(users.lastActiveAt, weekAgo));
  const [activeLast30Days] = await db
    .select({ value: count() })
    .from(users)
    .where(gte(users.lastActiveAt, thirtyDaysAgo));
  const [newUsersThisWeek] = await db
    .select({ value: count() })
    .from(users)
    .where(gte(users.createdAt, weekAgo));
  const [newUsersThisMonth] = await db
    .select({ value: count() })
    .from(users)
    .where(gte(users.createdAt, monthAgo));

  const retentionRate7Day = totalUsers.value > 0
    ? Math.round((activeLast7Days.value / totalUsers.value) * 100)
    : 0;
  const retentionRate30Day = totalUsers.value > 0
    ? Math.round((activeLast30Days.value / totalUsers.value) * 100)
    : 0;
  const conversionRate = totalUsers.value > 0
    ? Math.round(((activeSubs.reduce((s, sub) => s + sub.value, 0)) / totalUsers.value) * 100 * 10) / 10
    : 0;

  // ── Weekly charts ──────────────────────────────────────────────
  const weeklyActivity = await db.execute(sql`
    SELECT
      TO_CHAR(created_at, 'Dy') AS day,
      COUNT(*) AS count,
      'swipes' AS type
    FROM swipes
    WHERE created_at > NOW() - INTERVAL '7 days'
    GROUP BY day, type
    ORDER BY MIN(created_at)
  `);

  const weeklyMatches = await db.execute(sql`
    SELECT
      TO_CHAR(created_at, 'Dy') AS day,
      COUNT(*) AS count,
      'matches' AS type
    FROM matches
    WHERE created_at > NOW() - INTERVAL '7 days'
    GROUP BY day, type
    ORDER BY MIN(created_at)
  `);

  // ── Report metrics ─────────────────────────────────────────────
  const [resolvedReports] = await db
    .select({ value: count() })
    .from(reports)
    .where(eq(reports.status, 'resolved'));
  const totalReports = pendingReports.value + resolvedReports.value;
  const reportResolutionRate = totalReports > 0
    ? Math.round((resolvedReports.value / totalReports) * 100)
    : 0;

  return c.json({
    // Core
    totalUsers: totalUsers.value,
    activeToday: activeToday.value,
    matchesToday: matchesToday.value,
    pendingReports: pendingReports.value,
    subscriptions: subCounts.reduce((acc: Record<string, number>, r) => {
      acc[r.tier || 'free'] = r.value;
      return acc;
    }, {}),
    weeklyActivity: (weeklyActivity as any).rows ?? weeklyActivity,
    weeklyMatches: (weeklyMatches as any).rows ?? weeklyMatches,
    // Revenue
    mrr: Math.round(mrr * 100) / 100,
    arr: Math.round(arr * 100) / 100,
    activeSubscribers: activeSubs.reduce((s, sub) => s + sub.value, 0),
    conversionRate,
    // Funnel
    totalSwipes: totalUsers.value > 0 ? totalSwipes.value : 0,
    totalMatches: totalMatches.value,
    swipeToMatchRate,
    weeklySwipeToMatchRate,
    swipesThisWeek: swipesThisWeek.value,
    matchesThisWeek: matchesThisWeek.value,
    // Retention
    retentionRate7Day,
    retentionRate30Day,
    newUsersThisWeek: newUsersThisWeek.value,
    newUsersThisMonth: newUsersThisMonth.value,
    // Reports
    reportResolutionRate,
    totalReports,
    resolvedReports: resolvedReports.value,
  });
});

// ─── Users Management ───────────────────────────────────────────
app.get('/users', async (c) => {
  const search = c.req.query('search');
  const tier = c.req.query('tier');
  const role = c.req.query('role');
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = (page - 1) * limit;

  let whereClause = sql`1=1`;

  if (search) {
    whereClause = sql`${whereClause} AND (u.name ILIKE ${`%${search}%`} OR u.email ILIKE ${`%${search}%`})`;
  }

  if (tier && tier !== 'all') {
    whereClause = sql`${whereClause} AND u.id IN (
      SELECT user_id FROM subscriptions WHERE tier = ${tier}
    )`;
  }

  if (role && role !== 'all') {
    whereClause = sql`${whereClause} AND u.role = ${role}`;
  }

  const usersResult = await db.execute(sql`
    SELECT
      u.id, u.name, u.email, u.dob, u.verified, u.photo_verified, u.id_verified,
      u.role, u.created_at, u.last_active_at,
      (SELECT COUNT(*) FROM swipes s WHERE s.swiped_id = u.id OR s.swiper_id = u.id) AS swipe_count,
      (SELECT COUNT(*) FROM messages m WHERE m.sender_id = u.id) AS message_count,
      (SELECT tier FROM subscriptions WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) AS subscription_tier
    FROM users u
    WHERE ${whereClause}
    ORDER BY u.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `);

  const totalResult = await db.execute(sql`
    SELECT COUNT(*) AS total FROM users u WHERE ${whereClause}
  `);

  const userRows = ((usersResult as any).rows ?? Array.from(usersResult as any)) as any[];
  const totalRows = ((totalResult as any).rows ?? Array.from(totalResult as any)) as any[];

  return c.json({
    users: userRows.map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      dob: u.dob,
      verified: u.verified,
      photoVerified: u.photo_verified,
      idVerified: u.id_verified,
      role: u.role || 'user',
      createdAt: u.created_at,
      lastActiveAt: u.last_active_at,
      swipeCount: parseInt(u.swipe_count),
      messageCount: parseInt(u.message_count),
      subscriptionTier: u.subscription_tier || 'free',
    })),
    total: parseInt(totalRows[0]?.total || '0'),
    page,
    limit,
  });
});

app.get('/users/:id', async (c) => {
  const userId = c.req.param('id');

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  const interests = await db.select().from(userInterests).where(eq(userInterests.userId, userId));
  const [preferences] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
  const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).orderBy(desc(subscriptions.createdAt)).limit(1);
  const userReports = await db.select().from(reports).where(eq(reports.reportedId, userId));

  return c.json({
    ...sanitizeUser(user),
    interests: interests.map((i) => i.interest),
    preferences,
    subscription: subscription || { tier: 'free' },
    reports: userReports,
    reportCount: userReports.length,
  });
});

app.post('/users/:id/ban', async (c) => {
  const userId = c.req.param('id');
  const body = await c.req.json() as { reason?: string };

  // Mark user as banned
  await db.update(users).set({
    banned: true,
    bannedAt: new Date(),
    banReason: body.reason || 'Admin ban',
    updatedAt: new Date(),
  }).where(eq(users.id, userId));

  // Invalidate all push tokens — force logout on all devices
  await db.delete(pushTokens).where(eq(pushTokens.userId, userId));

  // Create audit report
  const [report] = await db.insert(reports).values({
    reporterId: getAdminId(c),
    reportedId: userId,
    reason: body.reason || 'Admin ban',
    severity: 'critical',
    status: 'resolved',
  }).returning();

  invalidateBanCache(userId);

  return c.json({ success: true, report });
});

app.post('/users/:id/suspend', async (c) => {
  const userId = c.req.param('id');
  const body = await c.req.json() as { reason?: string };

  // Mark user as suspended
  await db.update(users).set({
    suspended: true,
    suspendedAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(users.id, userId));

  // Invalidate all push tokens
  await db.delete(pushTokens).where(eq(pushTokens.userId, userId));

  // Create audit report
  const [report] = await db.insert(reports).values({
    reporterId: getAdminId(c),
    reportedId: userId,
    reason: body.reason || 'Admin suspension',
    severity: 'high',
    status: 'resolved',
  }).returning();

  invalidateBanCache(userId);

  return c.json({ success: true, report });
});

// ─── Payments ───────────────────────────────────────────────────
app.get('/payments', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = (page - 1) * limit;

  const paymentsResult = await db.execute(sql`
    SELECT
      s.id, s.tier, s.platform, s.receipt, s.created_at, s.expires_at,
      u.name AS user_name, u.email AS user_email
    FROM subscriptions s
    JOIN users u ON s.user_id = u.id
    ORDER BY s.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `);

  const totalResult = await db.execute(sql`SELECT COUNT(*) AS total FROM subscriptions`);

  const revenueStats = await db.execute(sql`
    SELECT
      COUNT(*) FILTER (WHERE tier = 'plus') AS plus_count,
      COUNT(*) FILTER (WHERE tier = 'elite') AS elite_count,
      COUNT(*) AS total_count
    FROM subscriptions
  `);

  const rows = ((paymentsResult as any).rows ?? Array.from(paymentsResult as any)) as any[];
  const statsRows = ((revenueStats as any).rows ?? Array.from(revenueStats as any)) as any[];
  const totalRows = ((totalResult as any).rows ?? Array.from(totalResult as any)) as any[];

  return c.json({
    transactions: rows.map((p: any) => ({
      id: p.id,
      userName: p.user_name,
      userEmail: p.user_email,
      tier: p.tier,
      platform: p.platform,
      createdAt: p.created_at,
      expiresAt: p.expires_at,
      hasReceipt: !!p.receipt,
    })),
    total: parseInt(totalRows[0]?.total || '0'),
    stats: {
      plusCount: parseInt(statsRows[0]?.plus_count || '0'),
      eliteCount: parseInt(statsRows[0]?.elite_count || '0'),
      totalCount: parseInt(statsRows[0]?.total_count || '0'),
    },
    page,
    limit,
  });
});

// ─── Analytics ──────────────────────────────────────────────────
app.get('/analytics', async (c) => {
  const userGrowth = await db.execute(sql`
    SELECT
      TO_CHAR(created_at, 'YYYY-MM') AS month,
      COUNT(*) AS count
    FROM users
    GROUP BY month
    ORDER BY month
  `);

  const matchStats = await db.execute(sql`SELECT COUNT(*) AS total_matches FROM matches`);
  const messageStats = await db.execute(sql`SELECT COUNT(*) AS total_messages FROM messages`);

  const avgMessages = await db.execute(sql`
    SELECT match_id, COUNT(*) AS msg_count FROM messages GROUP BY match_id
  `);

  const avgMsgRows = ((avgMessages as any).rows ?? Array.from(avgMessages as any)) as any[];
  const avgMsgPerMatch = avgMsgRows.length > 0
    ? avgMsgRows.reduce((sum: number, r: any) => sum + parseInt(r.msg_count), 0) / avgMsgRows.length
    : 0;

  const subDist = await db.execute(sql`SELECT tier, COUNT(*) AS count FROM subscriptions GROUP BY tier`);
  const verifiedCount = await db.execute(sql`SELECT COUNT(*) FILTER (WHERE photo_verified = true) AS verified FROM users`);
  const totalUsersCount = await db.execute(sql`SELECT COUNT(*) AS total FROM users`);

  const matchRows = ((matchStats as any).rows ?? Array.from(matchStats as any)) as any[];
  const msgRows = ((messageStats as any).rows ?? Array.from(messageStats as any)) as any[];
  const subDistRows = ((subDist as any).rows ?? Array.from(subDist as any)) as any[];
  const verifiedRows = ((verifiedCount as any).rows ?? Array.from(verifiedCount as any)) as any[];
  const totalRows = ((totalUsersCount as any).rows ?? Array.from(totalUsersCount as any)) as any[];
  const growthRows = ((userGrowth as any).rows ?? Array.from(userGrowth as any)) as any[];

  return c.json({
    userGrowth: growthRows,
    totalMatches: parseInt(matchRows[0]?.total_matches || '0'),
    totalMessages: parseInt(msgRows[0]?.total_messages || '0'),
    avgMessagesPerMatch: Math.round(avgMsgPerMatch * 10) / 10,
    subscriptionDistribution: subDistRows,
    verificationRate: totalRows[0]?.total
      ? Math.round((parseInt(verifiedRows[0]?.verified || '0') / parseInt(totalRows[0].total)) * 100)
      : 0,
  });
});

// ─── Reports ────────────────────────────────────────────────────
app.get('/reports', async (c) => {
  const reportsResult = await db.execute(sql`
    SELECT
      r.id, r.reason, r.description, r.severity, r.status, r.ai_triage_score, r.created_at,
      reporter.name AS reporter_name,
      reported.name AS reported_name,
      reported.email AS reported_email
    FROM reports r
    JOIN users reporter ON r.reporter_id = reporter.id
    JOIN users reported ON r.reported_id = reported.id
    ORDER BY r.created_at DESC
  `);

  const reportRows = ((reportsResult as any).rows ?? Array.from(reportsResult as any)) as any[];

  return c.json({
    reports: reportRows.map((r: any) => ({
      id: r.id,
      reason: r.reason,
      description: r.description,
      severity: r.severity,
      status: r.status,
      aiTriageScore: r.ai_triage_score,
      reporterName: r.reporter_name,
      reportedName: r.reported_name,
      reportedEmail: r.reported_email,
      createdAt: r.created_at,
    })),
  });
});

app.post('/reports/:id/resolve', async (c) => {
  const reportId = c.req.param('id');
  const body = await c.req.json() as { action?: string; reason?: string };

  await db.update(reports).set({ status: 'resolved' }).where(eq(reports.id, reportId));

  if (body.action) {
    await db.insert(moderationActions).values({
      reportId,
      moderatorId: getAdminId(c),
      action: body.action as any,
      reason: body.reason,
    });
  }

  return c.json({ success: true });
});

// ─── Email Queue Status ──────────────────────────────────────────
app.get('/email-queue', async (c) => {
  try {
    const { getEmailQueueStatus } = await import('../services/email');
    const status = getEmailQueueStatus();
    return c.json(status);
  } catch {
    return c.json({ queueLength: 0, mode: 'unknown', oldestEmail: null });
  }
});

export const adminRoutes = app;
