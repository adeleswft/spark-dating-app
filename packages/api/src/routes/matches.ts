import { Hono } from 'hono';
import { db } from '../db';
import { matches, users, messages } from '../db/schema';
import { eq, or, desc, and, ne, sql } from 'drizzle-orm';
import { sanitizeUser } from '../db/sanitize';

export const matchRoutes = new Hono();

// Get conversations (matches with last message + unread count)
matchRoutes.get('/conversations', async (c: any) => {
  const userId = c.get('userId');

  const userMatches = await db.query.matches.findMany({
    where: or(eq(matches.userAId, userId), eq(matches.userBId, userId)),
    orderBy: (m, { desc }) => [desc(m.createdAt)],
  });

  const conversations = await Promise.all(
    userMatches.map(async (match) => {
      const otherUserId = match.userAId === userId ? match.userBId : match.userAId;

      // Fetch other user
      const otherUser = await db.query.users.findFirst({
        where: eq(users.id, otherUserId),
      });

      // Fetch last message
      const [lastMsg] = await db
        .select()
        .from(messages)
        .where(eq(messages.matchId, match.id))
        .orderBy(desc(messages.createdAt))
        .limit(1);

      // Count unread messages (from the other user, not yet read)
      const [unreadResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(messages)
        .where(
          and(
            eq(messages.matchId, match.id),
            ne(messages.senderId, userId),
            sql`${messages.readAt} IS NULL`
          )
        );

      const safeUser = sanitizeUser(otherUser);

      return {
        id: match.id,
        otherUserId,
        name: safeUser?.name || 'Unknown',
        photo: safeUser?.photos?.[0] || '',
        lastMessage: lastMsg?.content || '',
        compatibilityScore: 85, // Placeholder — would come from AI matching
        isNew: !lastMsg, // No messages yet = new match
        unread: unreadResult?.count || 0,
        createdAt: match.createdAt,
      };
    })
  );

  return c.json({ conversations });
});

// Get all matches
matchRoutes.get('/', async (c) => {
  const userId = (c as any).get('userId');

  const userMatches = await db.query.matches.findMany({
    where: or(
      eq(matches.userAId, userId),
      eq(matches.userBId, userId)
    ),
    orderBy: (matches, { desc }) => [desc(matches.createdAt)],
  });

  // Fetch user details separately
  const transformedMatches = await Promise.all(
    userMatches.map(async (match) => {
      const otherUserId = match.userAId === userId ? match.userBId : match.userAId;
      const otherUser = await db.query.users.findFirst({
        where: eq(users.id, otherUserId),
      });
      const safeUser = sanitizeUser(otherUser);
      return {
        id: match.id,
        otherUser: safeUser
          ? {
              id: safeUser.id,
              name: safeUser.name,
              photos: safeUser.photos,
              verified: safeUser.verified,
              photoVerified: safeUser.photoVerified,
            }
          : null,
        aiBreakdown: match.aiBreakdown,
        createdAt: match.createdAt,
      };
    })
  );

  return c.json({ matches: transformedMatches });
});

// Get a specific match
matchRoutes.get('/:id', async (c) => {
  const userId = (c as any).get('userId');
  const matchId = c.req.param('id');

  const match = await db.query.matches.findFirst({
    where: eq(matches.id, matchId),
  });

  if (!match) {
    return c.json({ error: 'Match not found' }, 404);
  }

  if (match.userAId !== userId && match.userBId !== userId) {
    return c.json({ error: 'Unauthorized' }, 403);
  }

  const otherUserId = match.userAId === userId ? match.userBId : match.userAId;
  const otherUser = await db.query.users.findFirst({
    where: eq(users.id, otherUserId),
  });

  const safeUser = sanitizeUser(otherUser);
  return c.json({
    match: {
      id: match.id,
      otherUser: safeUser
        ? {
            id: safeUser.id,
            name: safeUser.name,
            photos: safeUser.photos,
            bio: safeUser.bio,
            verified: safeUser.verified,
            photoVerified: safeUser.photoVerified,
            idVerified: safeUser.idVerified,
          }
        : null,
      aiBreakdown: match.aiBreakdown,
      createdAt: match.createdAt,
    },
  });
});

// NOTE: Message listing and sending are handled by routes/messages.ts
// (GET /messages/:matchId and POST /messages/:matchId)
// Do NOT add message endpoints here — they would shadow the real routes.
