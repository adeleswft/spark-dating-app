import { Hono } from 'hono';
import { db } from '../db';
import {
  users,
  userPreferences,
  userInterests,
  userEmbeddings,
  swipes,
  matches,
  messages,
  subscriptions,
  verifications,
  verificationAttempts,
  boosts,
  reports,
  moderationActions,
  blockedUsers,
  deviceFingerprints,
} from '../db/schema';
import { eq, or } from 'drizzle-orm';

export const dataExportRoutes = new Hono();

/**
 * GET /auth/export
 *
 * GDPR Article 20 — Right to Data Portability.
 * Returns ALL data associated with the authenticated user as a downloadable JSON file.
 *
 * Sensitive fields are stripped:
 *   - passwordHash (never exported)
 *   - AI embeddings (internal model data, not user data)
 *
 * Other users' PII is anonymized — only IDs and content the user authored
 * or received are included.
 */
dataExportRoutes.get('/export', async (c: any) => {
  const userId: string = c.get('userId');

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // ── 1. Core profile ──────────────────────────────────────────
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  const { passwordHash, ...profile } = user;

  // ── 2. Preferences & interests ───────────────────────────────
  const preferences = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId));

  const interests = await db
    .select()
    .from(userInterests)
    .where(eq(userInterests.userId, userId));

  // ── 3. Swipes (both directions) ─────────────────────────────
  const swipedByMe = await db
    .select()
    .from(swipes)
    .where(eq(swipes.swiperId, userId));

  const swipedOnMe = await db
    .select()
    .from(swipes)
    .where(eq(swipes.swipedId, userId));

  // ── 4. Matches ──────────────────────────────────────────────
  const userMatches = await db
    .select()
    .from(matches)
    .where(or(eq(matches.userAId, userId), eq(matches.userBId, userId)));

  // ── 5. Messages (in matches involving this user) ────────────
  const userMatchIds = userMatches.map((m) => m.id);
  const allMessages: Array<{
    id: string;
    matchId: string;
    senderId: string;
    content: string;
    readAt: Date | null;
    createdAt: Date | null;
  }> = [];

  // Query messages in batches to avoid overly large IN clauses
  for (let i = 0; i < userMatchIds.length; i += 50) {
    const batch = userMatchIds.slice(i, i + 50);
    for (const matchId of batch) {
      const matchMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.matchId, matchId));
      allMessages.push(...matchMessages);
    }
  }

  // ── 6. Subscriptions & purchases ────────────────────────────
  const subs = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId));

  const userBoosts = await db
    .select()
    .from(boosts)
    .where(eq(boosts.userId, userId));

  // ── 7. Verifications ────────────────────────────────────────
  const vers = await db
    .select()
    .from(verifications)
    .where(eq(verifications.userId, userId));

  const versAttempts = await db
    .select()
    .from(verificationAttempts)
    .where(eq(verificationAttempts.userId, userId));

  // ── 8. Reports (filed by user or about user) ────────────────
  const reportsFiled = await db
    .select()
    .from(reports)
    .where(eq(reports.reporterId, userId));

  const reportsAbout = await db
    .select()
    .from(reports)
    .where(eq(reports.reportedId, userId));

  // ── 9. Blocked users ────────────────────────────────────────
  const blockedByMe = await db
    .select()
    .from(blockedUsers)
    .where(eq(blockedUsers.blockerId, userId));

  const blockedMe = await db
    .select()
    .from(blockedUsers)
    .where(eq(blockedUsers.blockedId, userId));

  // ── 10. Device fingerprints ──────────────────────────────────
  const devices = await db
    .select()
    .from(deviceFingerprints)
    .where(eq(deviceFingerprints.userId, userId));

  // ── Build the export ─────────────────────────────────────────
  const exportData = {
    _meta: {
      exportDate: new Date().toISOString(),
      exportedBy: 'Spark Dating App',
      format: 'GDPR Data Portability Export (Article 20)',
      userId: userId,
      notes: [
        'passwordHash is excluded for security.',
        'AI embeddings are excluded (internal model data, not user data).',
        'Other users are identified by their IDs only — no PII is included.',
      ],
    },

    profile,

    preferences: preferences.map((p) => ({
      id: p.id,
      minAge: p.minAge,
      maxAge: p.maxAge,
      maxDistance: p.maxDistance,
      genderPreference: p.genderPreference,
      relationshipGoals: p.relationshipGoals,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })),

    interests: interests.map((i) => i.interest),

    swipes: {
      byYou: swipedByMe.map((s) => ({
        id: s.id,
        swipedUserId: s.swipedId,
        direction: s.direction,
        createdAt: s.createdAt,
      })),
      onYou: swipedOnMe.map((s) => ({
        id: s.id,
        swiperUserId: s.swiperId,
        direction: s.direction,
        createdAt: s.createdAt,
      })),
    },

    matches: userMatches.map((m) => ({
      id: m.id,
      otherUserId: m.userAId === userId ? m.userBId : m.userAId,
      status: m.status,
      createdAt: m.createdAt,
    })),

    messages: allMessages.map((msg) => ({
      id: msg.id,
      matchId: msg.matchId,
      sentByYou: msg.senderId === userId,
      content: msg.content,
      readAt: msg.readAt,
      createdAt: msg.createdAt,
    })),

    subscriptions: subs.map((s) => ({
      id: s.id,
      tier: s.tier,
      platform: s.platform,
      expiresAt: s.expiresAt,
      createdAt: s.createdAt,
    })),

    boosts: userBoosts.map((b) => ({
      id: b.id,
      activatedAt: b.activatedAt,
      expiresAt: b.expiresAt,
    })),

    verifications: vers.map((v) => ({
      id: v.id,
      type: v.type,
      status: v.status,
      verifiedAt: v.verifiedAt,
      expiresAt: v.expiresAt,
      createdAt: v.createdAt,
    })),

    verificationAttempts: versAttempts.map((va) => ({
      id: va.id,
      type: va.type,
      status: va.status,
      faceMatchScore: va.faceMatchScore,
      createdAt: va.createdAt,
    })),

    reports: {
      filedByYou: reportsFiled.map((r) => ({
        id: r.id,
        reportedUserId: r.reportedId,
        reason: r.reason,
        description: r.description,
        severity: r.severity,
        status: r.status,
        createdAt: r.createdAt,
      })),
      aboutYou: reportsAbout.map((r) => ({
        id: r.id,
        reporterUserId: r.reporterId,
        reason: r.reason,
        description: r.description,
        severity: r.severity,
        status: r.status,
        createdAt: r.createdAt,
      })),
    },

    blockedUsers: {
      blockedByYou: blockedByMe.map((b) => ({
        id: b.id,
        blockedUserId: b.blockedId,
        createdAt: b.createdAt,
      })),
      blockedYou: blockedMe.map((b) => ({
        id: b.id,
        blockerUserId: b.blockerId,
        createdAt: b.createdAt,
      })),
    },

    devices: devices.map((d) => ({
      id: d.id,
      deviceId: d.deviceId,
      platform: d.platform,
      isVpn: d.isVpn,
      createdAt: d.createdAt,
    })),
  };

  // Return as downloadable JSON file
  const json = JSON.stringify(exportData, null, 2);
  const filename = `spark-data-export-${userId.slice(0, 8)}-${Date.now()}.json`;

  return new Response(json, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
});
