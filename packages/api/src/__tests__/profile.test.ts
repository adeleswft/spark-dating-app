/**
 * Integration tests for profile routes.
 * Requires PostgreSQL — tests skip automatically if DB is unavailable.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createTestApp, createTestUser, cleanupTestData, isDbAvailable } from './helper';

const app = createTestApp();
const skip = !(await isDbAvailable());

describe.skipIf(skip)('GET /profiles/me', () => {
  beforeAll(async () => { await cleanupTestData(); });
  afterAll(async () => { await cleanupTestData(); });
  beforeEach(async () => { await cleanupTestData(); });

  it('should return current user profile', async () => {
    const { token, user } = await createTestUser({ name: 'Test Me' });

    const res = await app.request('/profiles/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user).toBeDefined();
    expect(data.user.name).toBe('Test Me');
    expect(data.user.email).toBe(user.email);
    expect(data.user.passwordHash).toBeUndefined();
    expect(data.interests).toBeDefined();
    expect(Array.isArray(data.interests)).toBe(true);
  });

  it('should include interests after onboarding', async () => {
    const { token } = await createTestUser();

    await app.request('/onboarding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ interests: ['Hiking', 'Coffee'] }),
    });

    const res = await app.request('/profiles/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    expect(data.interests).toContain('Hiking');
    expect(data.interests).toContain('Coffee');
  });

  it('should require authentication', async () => {
    const res = await app.request('/profiles/me', { method: 'GET' });
    expect(res.status).toBe(401);
  });
});

describe.skipIf(skip)('PUT /profiles', () => {
  beforeAll(async () => { await cleanupTestData(); });
  afterAll(async () => { await cleanupTestData(); });
  beforeEach(async () => { await cleanupTestData(); });

  it('should update user profile', async () => {
    const { token } = await createTestUser();

    const res = await app.request('/profiles', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: 'Updated Name',
        bio: 'New bio!',
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user.name).toBe('Updated Name');
    expect(data.user.bio).toBe('New bio!');
  });
});
