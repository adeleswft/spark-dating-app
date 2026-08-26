/**
 * Integration tests for profile discovery, swipes, and match creation.
 * Requires PostgreSQL — tests skip automatically if DB is unavailable.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createTestApp, createTestUser, cleanupTestData, isDbAvailable } from './helper';
import { db } from '../db';
import { swipes, matches } from '../db/schema';

const app = createTestApp();
const skip = !(await isDbAvailable());

let userA: Awaited<ReturnType<typeof createTestUser>>;
let userB: Awaited<ReturnType<typeof createTestUser>>;

beforeAll(async () => {
  if (skip) return;
  await cleanupTestData();
  userA = await createTestUser({ name: 'Alice', email: 'alice@test.com' });
  userB = await createTestUser({ name: 'Bob', email: 'bob@test.com' });
});

afterAll(async () => {
  if (skip) return;
  await cleanupTestData();
});

beforeEach(async () => {
  if (skip) return;
  await db.delete(matches);
  await db.delete(swipes);
});

describe.skipIf(skip)('POST /profiles (discovery)', () => {
  it('should return other users as discovery profiles', async () => {
    const res = await app.request('/profiles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userA.token}`,
      },
      body: JSON.stringify({ minAge: 18, maxAge: 50, maxDistance: 100, genderPreference: [] }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.profiles).toBeDefined();
    expect(Array.isArray(data.profiles)).toBe(true);
    const selfIds = data.profiles.map((p: any) => p.id);
    expect(selfIds).not.toContain(userA.user.id);
  });

  it('should exclude already-swiped profiles', async () => {
    await db.insert(swipes).values({
      swiperId: userA.user.id,
      swipedId: userB.user.id,
      direction: 'right',
    });

    const res = await app.request('/profiles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userA.token}`,
      },
      body: JSON.stringify({ minAge: 18, maxAge: 50, maxDistance: 100, genderPreference: [] }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    const profileIds = data.profiles.map((p: any) => p.id);
    expect(profileIds).not.toContain(userB.user.id);
  });

  it('should require authentication', async () => {
    const res = await app.request('/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(401);
  });
});

describe.skipIf(skip)('POST /swipes', () => {
  it('should record a swipe', async () => {
    const res = await app.request('/swipes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userA.token}`,
      },
      body: JSON.stringify({ targetId: userB.user.id, direction: 'right' }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.swipe).toBeDefined();
    expect(data.isMatch).toBe(false);
  });

  it('should create a match on mutual right swipe', async () => {
    await db.insert(swipes).values({
      swiperId: userB.user.id,
      swipedId: userA.user.id,
      direction: 'right',
    });

    const res = await app.request('/swipes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userA.token}`,
      },
      body: JSON.stringify({ targetId: userB.user.id, direction: 'right' }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.isMatch).toBe(true);
    expect(data.match).toBeDefined();
    expect(data.match.userAId).toBe(userA.user.id);
    expect(data.match.userBId).toBe(userB.user.id);
  });

  it('should not match on left swipe', async () => {
    await db.insert(swipes).values({
      swiperId: userB.user.id,
      swipedId: userA.user.id,
      direction: 'right',
    });

    const res = await app.request('/swipes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userA.token}`,
      },
      body: JSON.stringify({ targetId: userB.user.id, direction: 'left' }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.isMatch).toBe(false);
  });

  it('should require targetId', async () => {
    const res = await app.request('/swipes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userA.token}`,
      },
      body: JSON.stringify({ direction: 'right' }),
    });

    expect(res.status).toBe(400);
  });
});

describe.skipIf(skip)('GET /matches', () => {
  it('should return user matches', async () => {
    await db.insert(swipes).values([
      { swiperId: userA.user.id, swipedId: userB.user.id, direction: 'right' },
      { swiperId: userB.user.id, swipedId: userA.user.id, direction: 'right' },
    ]);
    await db.insert(matches).values({
      userAId: userA.user.id,
      userBId: userB.user.id,
      aiBreakdown: 'Test match',
    });

    const res = await app.request('/matches', {
      method: 'GET',
      headers: { Authorization: `Bearer ${userA.token}` },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.matches).toBeDefined();
    expect(data.matches.length).toBe(1);
    expect(data.matches[0].otherUser).toBeDefined();
    expect(data.matches[0].otherUser.name).toBe('Bob');
    expect(data.matches[0].otherUser.passwordHash).toBeUndefined();
  });

  it('should return empty when no matches', async () => {
    const res = await app.request('/matches', {
      method: 'GET',
      headers: { Authorization: `Bearer ${userA.token}` },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.matches.length).toBe(0);
  });
});
