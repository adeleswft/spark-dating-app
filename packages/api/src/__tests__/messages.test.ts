/**
 * Integration tests for message routes.
 * Requires PostgreSQL — tests skip automatically if DB is unavailable.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createTestApp, createTestUser, cleanupTestData, isDbAvailable } from './helper';
import { db } from '../db';
import { matches, messages } from '../db/schema';
import { eq } from 'drizzle-orm';

const app = createTestApp();
const skip = !(await isDbAvailable());

let userA: Awaited<ReturnType<typeof createTestUser>>;
let userB: Awaited<ReturnType<typeof createTestUser>>;
let testMatch: any;

beforeAll(async () => {
  if (skip) return;
  await cleanupTestData();
  userA = await createTestUser({ name: 'Alice', email: 'alice-msg@test.com' });
  userB = await createTestUser({ name: 'Bob', email: 'bob-msg@test.com' });

  const [match] = await db
    .insert(matches)
    .values({
      userAId: userA.user.id,
      userBId: userB.user.id,
      aiBreakdown: 'Test match for messaging',
    })
    .returning();
  testMatch = match;
});

afterAll(async () => {
  if (skip) return;
  await cleanupTestData();
});

beforeEach(async () => {
  if (skip) return;
  await db.delete(messages);
});

describe.skipIf(skip)('GET /messages/:matchId', () => {
  it('should return messages for a match', async () => {
    await db.insert(messages).values([
      { matchId: testMatch.id, senderId: userA.user.id, content: 'Hello!' },
      { matchId: testMatch.id, senderId: userB.user.id, content: 'Hi there!' },
    ]);

    const res = await app.request(`/messages/${testMatch.id}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${userA.token}` },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.messages.length).toBe(2);
    expect(data.messages[0].content).toBe('Hello!');
    expect(data.messages[1].content).toBe('Hi there!');
  });

  it('should return empty array when no messages', async () => {
    const res = await app.request(`/messages/${testMatch.id}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${userA.token}` },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.messages.length).toBe(0);
  });

  it('should reject if user is not part of the match', async () => {
    const outsider = await createTestUser({ email: 'outsider@test.com' });

    const res = await app.request(`/messages/${testMatch.id}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${outsider.token}` },
    });

    expect(res.status).toBe(404);
  });
});

describe.skipIf(skip)('POST /messages/:matchId', () => {
  it('should send a message', async () => {
    const res = await app.request(`/messages/${testMatch.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userA.token}`,
      },
      body: JSON.stringify({ content: 'Test message!' }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message).toBeDefined();
    expect(data.message.content).toBe('Test message!');
    expect(data.message.senderId).toBe(userA.user.id);

    const dbMessages = await db.query.messages.findMany({
      where: eq(messages.matchId, testMatch.id),
    });
    expect(dbMessages.length).toBe(1);
    expect(dbMessages[0].content).toBe('Test message!');
  });

  it('should reject empty message', async () => {
    const res = await app.request(`/messages/${testMatch.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userA.token}`,
      },
      body: JSON.stringify({ content: '' }),
    });

    expect(res.status).toBe(400);
  });

  it('should allow both users to send messages', async () => {
    await app.request(`/messages/${testMatch.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userA.token}`,
      },
      body: JSON.stringify({ content: 'From Alice' }),
    });

    await app.request(`/messages/${testMatch.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userB.token}`,
      },
      body: JSON.stringify({ content: 'From Bob' }),
    });

    const dbMessages = await db.query.messages.findMany({
      where: eq(messages.matchId, testMatch.id),
    });
    expect(dbMessages.length).toBe(2);
  });
});
