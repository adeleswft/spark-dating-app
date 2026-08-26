/**
 * Shared push notification service.
 * Persists tokens in the database so they survive server restarts.
 */

import { db } from '../db';
import { pushTokens } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function registerPushToken(userId: string, token: string, platform: string = 'ios'): Promise<number> {
  // Upsert: delete existing token for this user+token combo, then insert.
  // This avoids race conditions where two concurrent calls both see "no existing" and insert duplicates.
  await db
    .delete(pushTokens)
    .where(and(
      eq(pushTokens.userId, userId),
      eq(pushTokens.token, token),
    ));

  await db.insert(pushTokens).values({
    userId,
    token,
    platform,
    lastUsedAt: new Date(),
  });

  // Count total tokens for this user
  const allTokens = await db.query.pushTokens.findMany({
    where: eq(pushTokens.userId, userId),
  });

  return allTokens.length;
}

export async function unregisterPushToken(userId: string, token: string): Promise<void> {
  await db
    .delete(pushTokens)
    .where(
      and(
        eq(pushTokens.userId, userId),
        eq(pushTokens.token, token),
      ),
    );
}

export async function unregisterAllPushTokens(userId: string): Promise<void> {
  await db.delete(pushTokens).where(eq(pushTokens.userId, userId));
}

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<{ success: boolean; sent?: number; error?: string }> {
  // Fetch tokens from database
  const tokens = await db.query.pushTokens.findMany({
    where: eq(pushTokens.userId, userId),
  });

  if (tokens.length === 0) {
    return { success: false, error: 'No push tokens registered' };
  }

  const expoTokens = tokens.map((t) => t.token);

  const messages = expoTokens.map((token) => ({
    to: token,
    title,
    body,
    data: data || {},
    sound: true,
    badge: 1,
    ...(data?.type === 'message' && { channelId: 'spark-messages' }),
    ...(data?.type === 'match' && { channelId: 'spark-matches' }),
  }));

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });

    // Update lastUsedAt for all tokens
    for (const t of tokens) {
      await db
        .update(pushTokens)
        .set({ lastUsedAt: new Date() })
        .where(eq(pushTokens.id, t.id));
    }

    return { success: true, sent: tokens.length };
  } catch (error) {
    console.error('Failed to send push notifications:', error);
    return { success: false, error: 'Failed to send notifications' };
  }
}
