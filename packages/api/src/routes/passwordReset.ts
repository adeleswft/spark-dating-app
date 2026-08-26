import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { users, pushTokens } from '../db/schema';
import { eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { sendPasswordResetEmail } from '../services/email';

// In-memory reset tokens (production: use database or Redis)
const resetTokens = new Map<string, { userId: string; expiresAt: number }>();

// Clean up expired tokens every 10 minutes
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [token, data] of resetTokens) {
    if (now > data.expiresAt) resetTokens.delete(token);
  }
}, 10 * 60 * 1000);
process.on('SIGTERM', () => clearInterval(cleanupInterval));
process.on('SIGINT', () => clearInterval(cleanupInterval));

export const passwordResetRoutes = new Hono();

/**
 * POST /password-reset/request
 * Request a password reset. Sends a reset link via email.
 */
passwordResetRoutes.post(
  '/request',
  zValidator('json', z.object({ email: z.string().email() })),
  async (c) => {
    const { email } = c.req.valid('json');

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    // Always return success to prevent email enumeration
    if (!user) {
      return c.json({ success: true, message: 'If an account exists, a reset link has been sent.' });
    }

    // Generate reset token
    const token = randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

    resetTokens.set(token, { userId: user.id, expiresAt });

    // Send password reset email
    try {
      await sendPasswordResetEmail(email, token, user.name);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      // Still return success to prevent email enumeration
    }

    return c.json({
      success: true,
      message: 'If an account exists, a reset link has been sent.',
    });
  }
);

/**
 * POST /password-reset/confirm
 * Confirm password reset with token and new password.
 */
passwordResetRoutes.post(
  '/confirm',
  zValidator(
    'json',
    z.object({
      token: z.string(),
      newPassword: z.string().min(8),
    })
  ),
  async (c) => {
    const { token, newPassword } = c.req.valid('json');

    const resetData = resetTokens.get(token);

    if (!resetData) {
      return c.json({ error: 'Invalid or expired reset token' }, 400);
    }

    if (Date.now() > resetData.expiresAt) {
      resetTokens.delete(token);
      return c.json({ error: 'Reset token has expired' }, 400);
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, resetData.userId));

    // Invalidate all push tokens — old devices can no longer receive notifications
    await db.delete(pushTokens).where(eq(pushTokens.userId, resetData.userId));

    // Invalidate the token
    resetTokens.delete(token);

    return c.json({ success: true, message: 'Password has been reset successfully' });
  }
);
