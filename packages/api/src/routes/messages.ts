import { Hono } from 'hono';
import { db } from '../db';
import { messages, matches, users } from '../db/schema';
import { eq, ne, and, sql } from 'drizzle-orm';
import { broadcastToUser } from '../ws';
import { sendPushNotification } from '../services/pushNotifications';
import { moderateMessage } from '../services/moderation';
import { trackMessageSent } from '../services/analytics';

export const messageRoutes = new Hono();

// Get messages for a match
messageRoutes.get('/:matchId', async (c) => {
  // TODO: Add auth middleware
  const userId = (c as any).get('userId');
  const matchId = c.req.param('matchId');

  // Verify match exists and user is part of it
  const match = await db.query.matches.findFirst({
    where: eq(matches.id, matchId),
  });

  if (!match || (match.userAId !== userId && match.userBId !== userId)) {
    return c.json({ error: 'Match not found' }, 404);
  }

  const matchMessages = await db.query.messages.findMany({
    where: eq(messages.matchId, matchId),
    orderBy: (messages, { asc }) => [asc(messages.createdAt)],
  });

  return c.json({ messages: matchMessages });
});

// Send a message
messageRoutes.post('/:matchId', async (c) => {
  // TODO: Add auth middleware
  const userId = (c as any).get('userId');
  const matchId = c.req.param('matchId');
  const { content } = await c.req.json();

  // Verify match exists and user is part of it
  const match = await db.query.matches.findFirst({
    where: eq(matches.id, matchId),
  });

  if (!match || (match.userAId !== userId && match.userBId !== userId)) {
    return c.json({ error: 'Match not found' }, 404);
  }

  if (!content || content.trim().length === 0) {
    return c.json({ error: 'Message content is required' }, 400);
  }

  // Content moderation
  let moderationResult;
  try {
    moderationResult = await moderateMessage(content.trim());
  } catch {
    moderationResult = { is_safe: true, severity: 'low', flags: {} };
  }

  // Block critical severity messages
  if (moderationResult.severity === 'critical') {
    return c.json({
      error: 'Message blocked by safety filters',
      moderation: {
        severity: moderationResult.severity,
        reason: moderationResult.recommendation,
      },
    }, 403);
  }

  const [newMessage] = await db
    .insert(messages)
    .values({
      matchId,
      senderId: userId,
      content: content.trim(),
    })
    .returning();

  // Broadcast via WebSocket to the other user
  const recipientId = match.userAId === userId ? match.userBId : match.userAId;
  broadcastToUser(recipientId, 'message', {
    matchId,
    message: newMessage,
  });

  // Send push notification
  try {
    const [sender] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    await sendPushNotification(
      recipientId,
      sender?.name || 'New Message',
      content.trim().substring(0, 100),
      { type: 'message', matchId },
    );
  } catch (e) {
    console.error('Failed to send push notification:', e);
  }

  trackMessageSent(userId, matchId, moderationResult.severity);

  return c.json({
    message: newMessage,
    moderation: {
      is_safe: moderationResult.is_safe,
      severity: moderationResult.severity,
      flagged: !moderationResult.is_safe,
    },
  });
});

// Mark messages as read
messageRoutes.post('/:matchId/read', async (c) => {
  const userId = (c as any).get('userId');
  const matchId = c.req.param('matchId');

  // Verify match exists and user is part of it
  const match = await db.query.matches.findFirst({
    where: eq(matches.id, matchId),
  });

  if (!match || (match.userAId !== userId && match.userBId !== userId)) {
    return c.json({ error: 'Match not found' }, 404);
  }

  // Mark only messages from OTHER users as read (not your own)
  await db
    .update(messages)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(messages.matchId, matchId),
        ne(messages.senderId, userId),
        sql`${messages.readAt} IS NULL`
      )
    );

  return c.json({ success: true });
});
