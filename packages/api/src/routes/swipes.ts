import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db';
import { swipes, matches, users, userInterests } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { aiClient } from '../services/ai';
import { broadcastToUser } from '../ws';
import { sendPushNotification } from '../services/pushNotifications';
import { trackSwipe, trackMatchCreated } from '../services/analytics';

export const swipeRoutes = new Hono();

// Create a swipe
swipeRoutes.post(
  '/',
  zValidator(
    'json',
    z.object({
      profileId: z.string().uuid().optional(),
      targetId: z.string().uuid().optional(),
      direction: z.enum(['left', 'right', 'super']),
    })
  ),
  async (c) => {
    const userId = (c as any).get('userId');
    const body = c.req.valid('json');
    // Accept both targetId (mobile client) and profileId (API client)
    const profileId = body.profileId || body.targetId;
    if (!profileId) {
      return c.json({ error: 'profileId or targetId is required' }, 400);
    }
    const { direction } = body;

    // Check for existing swipe on this target (idempotency)
    const existingSwipe = await db.query.swipes.findFirst({
      where: and(
        eq(swipes.swiperId, userId),
        eq(swipes.swipedId, profileId),
      ),
    });

    if (existingSwipe) {
      return c.json({ error: 'Already swiped on this profile', swipe: existingSwipe, isMatch: false, match: null });
    }

    // Record the swipe
    const [newSwipe] = await db
      .insert(swipes)
      .values({
        swiperId: userId,
        swipedId: profileId,
        direction,
      })
      .returning();

    trackSwipe(userId, direction, false);

    // Check if this creates a match (both users swiped right)
    if (direction === 'right' || direction === 'super') {
      const reciprocalSwipe = await db.query.swipes.findFirst({
        where: and(
          eq(swipes.swiperId, profileId),
          eq(swipes.swipedId, userId),
        ),
      });

      // Only match if the other person swiped positively (right or super)
      const isReciprocalPositive = reciprocalSwipe && (reciprocalSwipe.direction === 'right' || reciprocalSwipe.direction === 'super');

      if (isReciprocalPositive) {
        // Fetch both users for AI explanation
        const userA = await db.query.users.findFirst({ where: eq(users.id, userId) });
        const userB = await db.query.users.findFirst({ where: eq(users.id, profileId) });
        const interestsA = await db.query.userInterests.findMany({ where: eq(userInterests.userId, userId) });
        const interestsB = await db.query.userInterests.findMany({ where: eq(userInterests.userId, profileId) });

        // Generate AI breakdown
        let aiBreakdown = 'You both swiped right on each other!';
        if (userA && userB) {
          const explanation = await aiClient.generateExplanation(
            { ...userA, interests: interestsA.map((i) => i.interest) },
            { ...userB, interests: interestsB.map((i) => i.interest) }
          );
          if (explanation) aiBreakdown = explanation;
        }

        // Create a match!
        const [newMatch] = await db
          .insert(matches)
          .values({
            userAId: userId,
            userBId: profileId,
            aiBreakdown,
          })
          .returning();

        // Notify both users via WebSocket + push notification
        const matchPayload = {
          id: newMatch.id,
          otherUser: userB
            ? { id: userB.id, name: userB.name, photos: userB.photos }
            : null,
          aiBreakdown,
          createdAt: newMatch.createdAt,
        };
        broadcastToUser(userId, 'match', { match: matchPayload });
        broadcastToUser(profileId, 'match', {
          match: {
            ...matchPayload,
            otherUser: userA
              ? { id: userA.id, name: userA.name, photos: userA.photos }
              : null,
          },
        });

        // Send push notifications for new match
        try {
          await sendPushNotification(userId, '🎉 New Match!', `You and ${userB?.name || 'someone'} liked each other!`, { type: 'match', matchId: newMatch.id });
          await sendPushNotification(profileId, '🎉 New Match!', `You and ${userA?.name || 'someone'} liked each other!`, { type: 'match', matchId: newMatch.id });
        } catch (e) {
          console.error('Failed to send push notifications:', e);
        }

        trackSwipe(userId, direction, true);
        trackMatchCreated(userId, newMatch.id);

        return c.json({
          swipe: newSwipe,
          match: newMatch,
          isMatch: true,
        });
      }
    }

    return c.json({ swipe: newSwipe, isMatch: false, match: null });
  }
);

// Get swipe history
swipeRoutes.get('/history', async (c) => {
  // TODO: Add auth middleware
  const userId = (c as any).get('userId');

  const swipeHistory = await db.query.swipes.findMany({
    where: eq(swipes.swiperId, userId),
    orderBy: (swipes, { desc }) => [desc(swipes.createdAt)],
    limit: 100,
  });

  return c.json({ swipes: swipeHistory });
});
