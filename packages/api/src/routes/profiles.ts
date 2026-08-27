import { Hono } from 'hono';
import { db } from '../db';
import { users, userInterests, userPreferences, swipes, blockedUsers } from '../db/schema';
import { eq, ne, and, between, inArray, sql, notInArray, or } from 'drizzle-orm';
import { aiClient } from '../services/ai';
import { sanitizeUser, sanitizeUsers } from '../db/sanitize';

export const profileRoutes = new Hono();

// Get current user's profile
profileRoutes.get('/me', async (c) => {
  const userId = (c as any).get('userId');

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  // Fetch interests
  const interests = await db.query.userInterests.findMany({
    where: eq(userInterests.userId, userId),
  });

  // Fetch preferences
  const preferences = await db.query.userPreferences.findFirst({
    where: eq(userPreferences.userId, userId),
  });

  return c.json({
    user: sanitizeUser(user),
    interests: interests.map((i) => i.interest),
    preferences: preferences || null,
  });
});

// Get discovery profiles (for swiping)
profileRoutes.post('/', async (c) => {
  const userId = (c as any).get('userId');
  const body = await c.req.json();

  const { minAge = 18, maxAge = 50, maxDistance = 50, genderPreference = [] } = body;

  // Get IDs of profiles the user has already swiped on
  const swipedIds = await db.query.swipes.findMany({
    where: eq(swipes.swiperId, userId),
    columns: { swipedId: true },
  });
  const excludeIds = swipedIds.map((s) => s.swipedId);

  // Get blocked user IDs (both directions)
  const blockedByMe = await db.query.blockedUsers.findMany({
    where: eq(blockedUsers.blockerId, userId),
    columns: { blockedId: true },
  });
  const blockedMe = await db.query.blockedUsers.findMany({
    where: eq(blockedUsers.blockedId, userId),
    columns: { blockerId: true },
  });
  const blockedIds = [
    ...blockedByMe.map((b) => b.blockedId),
    ...blockedMe.map((b) => b.blockerId),
  ];

  // Get users who swiped right on the current user (for incognito bypass)
  const swipedOnMeRight = await db.query.swipes.findMany({
    where: and(
      eq(swipes.swipedId, userId),
      or(eq(swipes.direction, 'right'), eq(swipes.direction, 'super')),
    ),
    columns: { swiperId: true },
  });
  const swipedOnMeIds = new Set(swipedOnMeRight.map((s) => s.swiperId));

  // Calculate DOB boundaries
  const maxDob = new Date(Date.now() - minAge * 365.25 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  const minDob = new Date(Date.now() - maxAge * 365.25 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  // Build where conditions
  const conditions = [
    ne(users.id, userId),
    between(users.dob, minDob, maxDob),
    // Exclude banned/suspended users
    eq(users.banned, false),
    eq(users.suspended, false),
  ];

  if (genderPreference.length > 0) {
    conditions.push(inArray(users.gender, genderPreference as any));
  }

  // Exclude already-swiped users
  const allExcluded = [...new Set([...excludeIds, ...blockedIds])];
  if (allExcluded.length > 0) {
    conditions.push(notInArray(users.id, allExcluded));
  }

  // Fetch more than needed to account for incognito filtering
  const profiles = await db.query.users.findMany({
    where: and(...conditions),
    limit: 40,
  });

  // Batch-fetch preferences for incognito check
  const profileIds = profiles.map((p) => p.id);
  let incognitoIds = new Set<string>();
  if (profileIds.length > 0) {
    const profilePrefs = await db.query.userPreferences.findMany({
      where: inArray(userPreferences.userId, profileIds),
    });
    incognitoIds = new Set(
      profilePrefs
        .filter((p) => p.incognito === true)
        .map((p) => p.userId)
    );
  }

  // Final filter: exclude incognito users (unless they swiped on you)
  const visibleProfiles = profiles.filter((profile) => {
    if (incognitoIds.has(profile.id) && !swipedOnMeIds.has(profile.id)) {
      return false; // Incognito and hasn't swiped on you
    }
    return true;
  }).slice(0, 20); // Limit to 20 after filtering

  // Batch-fetch interests for all visible profiles (avoid N+1 queries)
  const allProfileInterests = visibleProfiles.length > 0
    ? await db.query.userInterests.findMany({
        where: inArray(userInterests.userId, visibleProfiles.map((p) => p.id)),
      })
    : [];
  const interestsByUser = new Map<string, string[]>();
  for (const pi of allProfileInterests) {
    const arr = interestsByUser.get(pi.userId) || [];
    arr.push(pi.interest);
    interestsByUser.set(pi.userId, arr);
  }

  const profilesWithInterests = visibleProfiles.map((profile) => ({
    ...profile,
    interests: interestsByUser.get(profile.id) || [],
  }));

  // Get current user for AI scoring
  const currentUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  const currentUserInterests = await db.query.userInterests.findMany({
    where: eq(userInterests.userId, userId),
  });

  const currentUserProfile = currentUser
    ? { ...currentUser, interests: currentUserInterests.map((i) => i.interest) }
    : null;

  // Score and rank with AI (or fallback)
  const scored = await Promise.all(
    profilesWithInterests.map(async (profile) => {
      let compatibilityScore = 50;

      if (currentUserProfile) {
        const result = await aiClient.calculateCompatibility(currentUserProfile, profile);
        compatibilityScore = result.score;
      }

      // Boost verified and active profiles
      if (profile.verified) compatibilityScore = Math.min(99, compatibilityScore + 5);
      if (profile.photoVerified) compatibilityScore = Math.min(99, compatibilityScore + 3);

      return { ...profile, compatibilityScore };
    })
  );

  // Sort by compatibility descending
  scored.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

  return c.json({ profiles: sanitizeUsers(scored) });
});

// Update profile
profileRoutes.put('/', async (c) => {
  const userId = (c as any).get('userId');
  const body = await c.req.json();

  const { name, bio, photos, location, settings } = body;

  // Update user profile fields
  const userUpdates: Record<string, any> = { updatedAt: new Date() };
  if (name) userUpdates.name = name;
  if (bio) userUpdates.bio = bio;
  if (photos) userUpdates.photos = photos;
  if (location) userUpdates.location = location;

  let updatedUser;
  if (Object.keys(userUpdates).length > 1) {
    const [result] = await db
      .update(users)
      .set(userUpdates)
      .where(eq(users.id, userId))
      .returning();
    updatedUser = result;
  }

  // Update privacy settings if provided
  if (settings && typeof settings === 'object') {
    const prefUpdates: Record<string, any> = { updatedAt: new Date() };
    if ('incognito' in settings) prefUpdates.incognito = settings.incognito;
    if ('showOnlineStatus' in settings) prefUpdates.showOnlineStatus = settings.showOnlineStatus;
    if ('showDistance' in settings) prefUpdates.showDistance = settings.showDistance;
    if ('showLastActive' in settings) prefUpdates.showLastActive = settings.showLastActive;

    if (Object.keys(prefUpdates).length > 1) {
      // Atomic upsert: insert or update on conflict
      // Uses a raw SQL upsert to avoid race conditions between
      // concurrent requests that both see no existing row
      await db
        .insert(userPreferences)
        .values({ userId, ...prefUpdates })
        .onConflictDoUpdate({
          target: userPreferences.userId,
          set: prefUpdates,
        });
    }
  }

  return c.json({ user: updatedUser || null });
});

// Upload photo
profileRoutes.post('/photos', async (c) => {
  const userId = (c as any).get('userId');

  const body = await c.req.parseBody();
  const photo = body['photo'] as File;

  if (!photo) {
    return c.json({ error: 'No photo provided' }, 400);
  }

  // Delegate to the upload route's logic — save to disk and return the URL
  const { randomUUID } = await import('crypto');
  const { writeFile, mkdir } = await import('fs/promises');
  const { join } = await import('path');

  const UPLOAD_DIR = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');
  await mkdir(UPLOAD_DIR, { recursive: true });

  const ext = photo.name?.split('.').pop() || 'jpg';
  const filename = `${randomUUID()}.${ext}`;
  const filepath = join(UPLOAD_DIR, filename);

  const arrayBuffer = await photo.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await writeFile(filepath, buffer);

  const baseUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 3001}`;
  const photoUrl = `${baseUrl}/uploads/${filename}`;

  // Use SQL array append to avoid race condition
  const [updatedUser] = await db
    .update(users)
    .set({
      photos: sql`array_append(COALESCE(${users.photos}, '{}'), ${photoUrl})`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  return c.json({ photoUrl, photos: updatedUser?.photos ?? [] });
});
