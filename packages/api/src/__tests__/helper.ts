/**
 * Test helper for API integration tests.
 * Creates a Hono app instance and provides utilities for generating JWT tokens.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import {
  users,
  userInterests,
  userPreferences,
  userEmbeddings,
  swipes,
  matches,
  messages,
  subscriptions,
  verifications,
  reports,
  boosts,
  blockedUsers,
  deviceFingerprints,
  verificationAttempts,
  moderationActions,
  pushTokens,
} from '../db/schema';
import { authRoutes } from '../routes/auth';
import { profileRoutes } from '../routes/profiles';
import { swipeRoutes } from '../routes/swipes';
import { matchRoutes } from '../routes/matches';
import { messageRoutes } from '../routes/messages';
import { onboardingRoutes } from '../routes/onboarding';
import { authMiddleware } from '../middleware/auth';
import { apiRateLimit } from '../middleware/rateLimit';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

/**
 * Check if the database is available.
 */
export async function isDbAvailable(): Promise<boolean> {
  try {
    await db.execute('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

/**
 * Create a test app with all routes mounted.
 */
export function createTestApp(): Hono {
  const app = new Hono();

  // Middleware
  app.use('*', cors());
  app.use('*', apiRateLimit);

  // Public routes
  app.route('/auth', authRoutes);

  // Protected routes
  app.use('/profiles/*', authMiddleware);
  app.use('/profiles', authMiddleware);
  app.use('/swipes/*', authMiddleware);
  app.use('/swipes', authMiddleware);
  app.use('/matches/*', authMiddleware);
  app.use('/matches', authMiddleware);
  app.use('/messages/*', authMiddleware);
  app.use('/onboarding/*', authMiddleware);
  app.use('/onboarding', authMiddleware);

  app.route('/profiles', profileRoutes);
  app.route('/swipes', swipeRoutes);
  app.route('/matches', matchRoutes);
  app.route('/messages', messageRoutes);
  app.route('/onboarding', onboardingRoutes);

  return app;
}

/**
 * Generate a JWT token for a test user.
 */
export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });
}

/**
 * Create a test user and return their data + token.
 */
export async function createTestUser(overrides: Partial<{
  name: string;
  email: string;
  password: string;
  dob: string;
  gender: 'male' | 'female' | 'non-binary' | 'other';
}> = {}) {
  const defaults = {
    name: 'Test User',
    email: `test-${Date.now()}@example.com`,
    password: 'password123',
    dob: '1995-06-15',
    gender: 'other' as const,
  };

  const data = { ...defaults, ...overrides };
  const passwordHash = await bcrypt.hash(data.password, 10);

  const [user] = await db
    .insert(users)
    .values({
      name: data.name,
      email: data.email,
      passwordHash,
      dob: data.dob,
      gender: data.gender,
    })
    .returning();

  const token = generateToken(user.id);

  return { user, token, password: data.password };
}

/**
 * Clean up test data.
 */
export async function cleanupTestData() {
  // Delete in FK-safe order: children before parents
  await db.delete(moderationActions);
  await db.delete(messages);
  await db.delete(matches);
  await db.delete(swipes);
  await db.delete(userInterests);
  await db.delete(userPreferences);
  await db.delete(userEmbeddings);
  await db.delete(subscriptions);
  await db.delete(verifications);
  await db.delete(reports);
  await db.delete(boosts);
  await db.delete(blockedUsers);
  await db.delete(deviceFingerprints);
  await db.delete(verificationAttempts);
  await db.delete(pushTokens);
  await db.delete(users);
}
