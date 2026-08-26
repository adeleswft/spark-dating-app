/**
 * Integration tests for auth routes.
 * Requires PostgreSQL — tests skip automatically if DB is unavailable.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createTestApp, createTestUser, cleanupTestData, isDbAvailable } from './helper';

const app = createTestApp();
const skip = !(await isDbAvailable());

describe.skipIf(skip)('POST /auth/register', () => {
  beforeAll(async () => { await cleanupTestData(); });
  afterAll(async () => { await cleanupTestData(); });
  beforeEach(async () => { await cleanupTestData(); });

  it('should register a new user', async () => {
    const res = await app.request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'New User',
        email: 'new@example.com',
        password: 'password123',
        dob: '1995-06-15',
        gender: 'female',
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user).toBeDefined();
    expect(data.token).toBeDefined();
    expect(data.user.name).toBe('New User');
    expect(data.user.email).toBe('new@example.com');
    expect(data.user.passwordHash).toBeUndefined();
    expect(data.user.password_hash).toBeUndefined();
  });

  it('should reject duplicate email', async () => {
    await createTestUser({ email: 'dupe@example.com' });

    const res = await app.request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Dupe User',
        email: 'dupe@example.com',
        password: 'password123',
      }),
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('already registered');
  });

  it('should reject short password', async () => {
    const res = await app.request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Short Pass',
        email: 'short@example.com',
        password: '12345',
      }),
    });

    expect(res.status).toBe(400);
  });

  it('should reject invalid email', async () => {
    const res = await app.request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bad Email',
        email: 'not-an-email',
        password: 'password123',
      }),
    });

    expect(res.status).toBe(400);
  });
});

describe.skipIf(skip)('POST /auth/login', () => {
  beforeAll(async () => { await cleanupTestData(); });
  afterAll(async () => { await cleanupTestData(); });
  beforeEach(async () => { await cleanupTestData(); });

  it('should login with valid credentials', async () => {
    await createTestUser({ email: 'login@example.com', password: 'mypassword' });

    const res = await app.request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'login@example.com',
        password: 'mypassword',
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user).toBeDefined();
    expect(data.token).toBeDefined();
    expect(data.user.email).toBe('login@example.com');
    expect(data.user.passwordHash).toBeUndefined();
  });

  it('should reject wrong password', async () => {
    await createTestUser({ email: 'wrong@example.com', password: 'correct' });

    const res = await app.request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'wrong@example.com',
        password: 'incorrect',
      }),
    });

    expect(res.status).toBe(401);
  });

  it('should reject non-existent email', async () => {
    const res = await app.request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nobody@example.com',
        password: 'password123',
      }),
    });

    expect(res.status).toBe(401);
  });
});

describe.skipIf(skip)('POST /auth/refresh', () => {
  beforeAll(async () => { await cleanupTestData(); });
  afterAll(async () => { await cleanupTestData(); });

  it('should refresh a valid token', async () => {
    const { token } = await createTestUser();

    const res = await app.request('/auth/refresh', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.token).toBeDefined();
  });

  it('should reject invalid token', async () => {
    const res = await app.request('/auth/refresh', {
      method: 'POST',
      headers: { Authorization: 'Bearer invalid-token' },
    });

    expect(res.status).toBe(401);
  });
});
