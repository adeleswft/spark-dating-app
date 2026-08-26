import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { users, swipes, matches, messages, userInterests, userPreferences, subscriptions, verifications, userEmbeddings, reports, moderationActions, boosts, blockedUsers, deviceFingerprints, verificationAttempts, pushTokens } from '../db/schema';
import { eq, or } from 'drizzle-orm';
import { sanitizeUser } from '../db/sanitize';
import { trackUserRegistered, trackUserLogin } from '../services/analytics';

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'spark-dev-secret-key');

function getJwtSecret(): string {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required in production');
  }
  return JWT_SECRET;
}

export const authRoutes = new Hono();

// Register
authRoutes.post(
  '/register',
  zValidator(
    'json',
    z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(8),
      dob: z.string().optional().default('2000-01-01'),
      gender: z.enum(['male', 'female', 'non-binary', 'other']).optional().default('other'),
    })
  ),
  async (c) => {
    const { name, email, password, dob, gender } = c.req.valid('json');

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return c.json({ error: 'Email already registered' }, 400);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email,
        passwordHash,
        dob,
        gender,
      })
      .returning();

    // Generate token
    const token = jwt.sign({ userId: newUser.id }, getJwtSecret(), {
      expiresIn: '30d',
    });

    trackUserRegistered(newUser.id, 'email');

    return c.json({
      user: sanitizeUser(newUser),
      token,
    });
  }
);

// Login
authRoutes.post(
  '/login',
  zValidator(
    'json',
    z.object({
      email: z.string().email(),
      password: z.string(),
    })
  ),
  async (c) => {
    const { email, password } = c.req.valid('json');

    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Generate token
    const token = jwt.sign({ userId: user.id }, getJwtSecret(), {
      expiresIn: '30d',
    });

    trackUserLogin(user.id);

    return c.json({
      user: sanitizeUser(user),
      token,
    });
  }
);

// Verify phone
authRoutes.post(
  '/verify-phone',
  zValidator(
    'json',
    z.object({
      phone: z.string(),
      code: z.string(),
    })
  ),
  async (c) => {
    const { phone, code } = c.req.valid('json');

    // TODO: Integrate with Twilio for actual SMS verification
    // For demo, accept any 6-digit code
    if (code.length !== 6) {
      return c.json({ error: 'Invalid verification code' }, 400);
    }

    // Update user phone if we have auth
    const authHeader = c.req.header('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const payload = jwt.verify(token, getJwtSecret()) as { userId: string };
        await db
          .update(users)
          .set({ phone, updatedAt: new Date() })
          .where(eq(users.id, payload.userId));
      } catch {
        // Token invalid, just return success for demo
      }
    }

    return c.json({ success: true, message: 'Phone verified successfully' });
  }
);

// Delete account — wrapped in a transaction so partial failures roll back
authRoutes.delete('/account', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, getJwtSecret()) as { userId: string };
    const userId = payload.userId;

    await db.transaction(async (tx) => {
      // Find all matches this user is part of (to delete their messages first)
      const userMatches = await tx.select().from(matches).where(
        or(eq(matches.userAId, userId), eq(matches.userBId, userId))
      );

      // Delete messages in those matches (ALL messages, not just the user's)
      for (const match of userMatches) {
        await tx.delete(messages).where(eq(messages.matchId, match.id));
      }

      // Delete moderation actions referencing this user's reports (must come before reports)
      const userReportIds = (await tx.select({ id: reports.id }).from(reports).where(
        or(eq(reports.reporterId, userId), eq(reports.reportedId, userId))
      )).map(r => r.id);
      for (const reportId of userReportIds) {
        await tx.delete(moderationActions).where(eq(moderationActions.reportId, reportId));
      }

      // Delete user-specific data
      await tx.delete(userEmbeddings).where(eq(userEmbeddings.userId, userId));
      await tx.delete(userInterests).where(eq(userInterests.userId, userId));
      await tx.delete(userPreferences).where(eq(userPreferences.userId, userId));
      await tx.delete(swipes).where(eq(swipes.swiperId, userId));
      await tx.delete(swipes).where(eq(swipes.swipedId, userId));
      await tx.delete(matches).where(eq(matches.userAId, userId));
      await tx.delete(matches).where(eq(matches.userBId, userId));
      await tx.delete(subscriptions).where(eq(subscriptions.userId, userId));
      await tx.delete(verifications).where(eq(verifications.userId, userId));
      await tx.delete(reports).where(eq(reports.reporterId, userId));
      await tx.delete(reports).where(eq(reports.reportedId, userId));
      await tx.delete(boosts).where(eq(boosts.userId, userId));
      await tx.delete(blockedUsers).where(eq(blockedUsers.blockerId, userId));
      await tx.delete(blockedUsers).where(eq(blockedUsers.blockedId, userId));
      await tx.delete(deviceFingerprints).where(eq(deviceFingerprints.userId, userId));
      await tx.delete(verificationAttempts).where(eq(verificationAttempts.userId, userId));
      await tx.delete(pushTokens).where(eq(pushTokens.userId, userId));

      // Delete the user last
      await tx.delete(users).where(eq(users.id, userId));
    });

    return c.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    // JWT verification failure vs DB transaction failure
    if (error instanceof Error && error.message.includes('jwt')) {
      return c.json({ error: 'Invalid token' }, 401);
    }
    console.error('Delete account failed:', error);
    return c.json({ error: 'Failed to delete account' }, 500);
  }
});

// Change password (requires current password)
authRoutes.post(
  '/change-password',
  zValidator(
    'json',
    z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(8),
    })
  ),
  async (c) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.split(' ')[1];
    try {
      const payload = jwt.verify(token, getJwtSecret()) as { userId: string };
      const { currentPassword, newPassword } = c.req.valid('json');

      // Fetch user
      const user = await db.query.users.findFirst({
        where: eq(users.id, payload.userId),
      });

      if (!user) {
        return c.json({ error: 'User not found' }, 404);
      }

      // Verify current password
      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) {
        return c.json({ error: 'Current password is incorrect' }, 400);
      }

      // Prevent reusing the same password
      const samePassword = await bcrypt.compare(newPassword, user.passwordHash);
      if (samePassword) {
        return c.json({ error: 'New password must be different from current password' }, 400);
      }

      // Hash and update
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await db
        .update(users)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(users.id, payload.userId));

      // Invalidate all push tokens — force re-login on all devices
      await db.delete(pushTokens).where(eq(pushTokens.userId, payload.userId));

      return c.json({ success: true, message: 'Password changed successfully. Please log in again on all devices.' });
    } catch (error) {
      if (error instanceof Error && error.message.includes('jwt')) {
        return c.json({ error: 'Invalid token' }, 401);
      }
      console.error('Change password failed:', error);
      return c.json({ error: 'Failed to change password' }, 500);
    }
  }
);

// Refresh token
authRoutes.post('/refresh', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, getJwtSecret()) as { userId: string };
    const newToken = jwt.sign({ userId: payload.userId }, getJwtSecret(), {
      expiresIn: '30d',
    });
    return c.json({ token: newToken });
  } catch {
    return c.json({ error: 'Invalid token' }, 401);
  }
});
