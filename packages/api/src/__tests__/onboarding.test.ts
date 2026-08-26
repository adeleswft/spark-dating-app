/**
 * Integration tests for onboarding route.
 * Requires PostgreSQL — tests skip automatically if DB is unavailable.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createTestApp, createTestUser, cleanupTestData, isDbAvailable } from './helper';
import { db } from '../db';
import { userInterests, userPreferences } from '../db/schema';
import { eq } from 'drizzle-orm';

const app = createTestApp();
const skip = !(await isDbAvailable());

describe.skipIf(skip)('POST /onboarding', () => {
  beforeAll(async () => { await cleanupTestData(); });
  afterAll(async () => { await cleanupTestData(); });
  beforeEach(async () => { await cleanupTestData(); });

  it('should save full onboarding profile', async () => {
    const { token } = await createTestUser();

    const res = await app.request('/onboarding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        bio: 'I love hiking and coffee!',
        interests: ['Hiking', 'Coffee', 'Photography'],
        preferences: {
          minAge: 21,
          maxAge: 35,
          maxDistance: 25,
          genderPreference: ['female'],
          relationshipGoals: 'serious',
        },
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.profile.interests).toBe(3);
    expect(data.profile.preferences).toBe(true);
  });

  it('should save interests to database', async () => {
    const { token, user } = await createTestUser();

    await app.request('/onboarding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ interests: ['Hiking', 'Coffee'] }),
    });

    const interests = await db.query.userInterests.findMany({
      where: eq(userInterests.userId, user.id),
    });

    expect(interests.length).toBe(2);
    expect(interests.map((i) => i.interest)).toContain('Hiking');
    expect(interests.map((i) => i.interest)).toContain('Coffee');
  });

  it('should save preferences to database', async () => {
    const { token, user } = await createTestUser();

    await app.request('/onboarding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        preferences: {
          minAge: 25,
          maxAge: 40,
          maxDistance: 30,
          genderPreference: ['male', 'female'],
          relationshipGoals: 'casual',
        },
      }),
    });

    const prefs = await db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, user.id),
    });

    expect(prefs).toBeDefined();
    expect(prefs!.minAge).toBe(25);
    expect(prefs!.maxAge).toBe(40);
    expect(prefs!.maxDistance).toBe(30);
    expect(prefs!.relationshipGoals).toBe('casual');
  });

  it('should replace interests on re-onboarding', async () => {
    const { token, user } = await createTestUser();

    await app.request('/onboarding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ interests: ['Hiking', 'Coffee'] }),
    });

    await app.request('/onboarding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ interests: ['Yoga', 'Travel', 'Art'] }),
    });

    const interests = await db.query.userInterests.findMany({
      where: eq(userInterests.userId, user.id),
    });

    expect(interests.length).toBe(3);
    expect(interests.map((i) => i.interest)).toContain('Yoga');
    expect(interests.map((i) => i.interest)).not.toContain('Hiking');
  });

  it('should require authentication', async () => {
    const res = await app.request('/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bio: 'test' }),
    });

    expect(res.status).toBe(401);
  });

  it('should save bio and photos', async () => {
    const { token } = await createTestUser();

    const res = await app.request('/onboarding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        bio: 'Hello world!',
        photos: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.profile.bio).toBe(true);
    expect(data.profile.photos).toBe(2);
  });
});
