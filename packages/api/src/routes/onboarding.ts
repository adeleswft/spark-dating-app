import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db';
import { users, userInterests, userPreferences } from '../db/schema';
import { eq } from 'drizzle-orm';

export const onboardingRoutes = new Hono();

/**
 * POST /onboarding — Save full onboarding profile.
 * Called once when user completes the onboarding flow.
 */
onboardingRoutes.post(
  '/',
  zValidator(
    'json',
    z.object({
      photos: z.array(z.string()).optional().default([]),
      bio: z.string().optional().default(''),
      interests: z.array(z.string()).optional().default([]),
      name: z.string().optional(),
      dob: z.string().optional(),
      gender: z.enum(['male', 'female', 'non-binary', 'other']).optional(),
      preferences: z
        .object({
          minAge: z.number().min(18).max(80).optional().default(18),
          maxAge: z.number().min(18).max(80).optional().default(50),
          maxDistance: z.number().min(1).max(100).optional().default(50),
          genderPreference: z
            .array(z.enum(['male', 'female', 'non-binary', 'other']))
            .optional()
            .default([]),
          relationshipGoals: z
            .enum(['casual', 'serious', 'friends', 'unsure'])
            .optional()
            .default('unsure'),
        })
        .optional()
        .default({}),
    })
  ),
  async (c) => {
    const userId = (c as any).get('userId');
    const body = c.req.valid('json');

    const { photos, bio, interests, name, dob, gender, preferences } = body;

    // Update user profile fields
    const userUpdates: Record<string, any> = { updatedAt: new Date() };
    if (photos.length > 0) userUpdates.photos = photos;
    if (bio) userUpdates.bio = bio;
    if (name) userUpdates.name = name;
    if (dob) userUpdates.dob = dob;
    if (gender) userUpdates.gender = gender;

    if (Object.keys(userUpdates).length > 1) {
      await db.update(users).set(userUpdates).where(eq(users.id, userId));
    }

    // Replace interests
    // Delete existing interests
    await db.delete(userInterests).where(eq(userInterests.userId, userId));

    // Insert new interests
    if (interests.length > 0) {
      await db.insert(userInterests).values(
        interests.map((interest) => ({
          userId,
          interest,
        }))
      );
    }

    // Replace preferences
    // Delete existing preferences
    await db.delete(userPreferences).where(eq(userPreferences.userId, userId));

    // Insert new preferences
    await db.insert(userPreferences).values({
      userId,
      minAge: preferences.minAge,
      maxAge: preferences.maxAge,
      maxDistance: preferences.maxDistance,
      genderPreference: preferences.genderPreference,
      relationshipGoals: preferences.relationshipGoals,
    });

    return c.json({
      success: true,
      message: 'Onboarding profile saved',
      profile: {
        photos: photos.length,
        bio: bio.length > 0,
        interests: interests.length,
        preferences: true,
      },
    });
  }
);
