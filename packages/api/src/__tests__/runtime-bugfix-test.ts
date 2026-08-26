/**
 * Runtime integration test for the 3 bug fixes.
 * Boots the actual Hono app, creates test data via the DB,
 * and exercises the real route handlers end-to-end.
 */

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.log(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function main() {
  // ── Setup ───────────────────────────────────────────────────
  const { db } = await import('../db');
  const {
    users, swipes, matches, messages, subscriptions,
  } = await import('../db/schema');
  const { eq, and } = await import('drizzle-orm');
  const bcrypt = await import('bcryptjs');
  const jwt = await import('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

  // Check if DB is available
  let dbAvailable = false;
  try {
    await db.execute('SELECT 1');
    dbAvailable = true;
  } catch {
    console.log('⚠️  PostgreSQL not available — cannot run runtime integration tests');
    process.exit(0);
  }

  // ── Create test users ───────────────────────────────────────
  const email1 = `rt-test1-${Date.now()}@test.com`;
  const email2 = `rt-test2-${Date.now()}@test.com`;

  const pwHash = await bcrypt.hash('password123', 10);

  const [user1] = await db.insert(users).values({
    name: 'Alice', email: email1, passwordHash: pwHash, dob: '1995-01-01', gender: 'female',
  }).returning();

  const [user2] = await db.insert(users).values({
    name: 'Bob', email: email2, passwordHash: pwHash, dob: '1995-06-01', gender: 'male',
  }).returning();

  const token1 = jwt.sign({ userId: user1.id }, JWT_SECRET, { expiresIn: '1h' });
  const token2 = jwt.sign({ userId: user2.id }, JWT_SECRET, { expiresIn: '1h' });

  // Create a third user for isolation tests
  const email3 = `rt-test3-${Date.now()}@test.com`;
  const [user3] = await db.insert(users).values({
    name: 'Charlie', email: email3, passwordHash: pwHash, dob: '1993-03-03', gender: 'male',
  }).returning();

  try {
    // ── Build the real Hono app ────────────────────────────────
    const { Hono } = await import('hono');
    const { cors } = await import('hono/cors');
    const { swipeRoutes } = await import('../routes/swipes');
    const { messageRoutes } = await import('../routes/messages');
    const { matchRoutes } = await import('../routes/matches');
    const { subscriptionRoutes } = await import('../routes/subscriptions');
    const { authMiddleware } = await import('../middleware/auth');

    const app = new Hono();
    app.use('*', cors());
    app.use('/swipes/*', authMiddleware);
    app.use('/swipes', authMiddleware);
    app.use('/messages/*', authMiddleware);
    app.use('/matches/*', authMiddleware);
    app.use('/matches', authMiddleware);
    app.use('/subscriptions/*', authMiddleware);
    app.use('/subscriptions', authMiddleware);
    app.route('/swipes', swipeRoutes);
    app.route('/messages', messageRoutes);
    app.route('/matches', matchRoutes);
    app.route('/subscriptions', subscriptionRoutes);

    // ═══════════════════════════════════════════════════════════
    // TEST 1: Duplicate swipe prevention
    // ═══════════════════════════════════════════════════════════
    console.log('\n═══ TEST 1: Duplicate swipe prevention ═══');

    // First swipe — should succeed
    const res1 = await app.request('/swipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ targetId: user2.id, direction: 'right' }),
    });
    const data1 = await res1.json();
    assert(res1.status === 200, `First swipe returns 200 (got ${res1.status})`);
    assert(data1.isMatch === false, `First swipe is not a match (got isMatch=${data1.isMatch})`);
    assert(data1.swipe !== undefined, 'First swipe returns swipe record');

    // Second swipe on same target — should return error
    const res2 = await app.request('/swipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ targetId: user2.id, direction: 'right' }),
    });
    const data2 = await res2.json();
    assert(res2.status === 200, `Duplicate swipe returns 200 (got ${res2.status})`);
    assert(data2.error !== undefined, `Duplicate swipe returns error message`);
    assert(
      data2.error?.toLowerCase().includes('already swiped'),
      `Error says "already swiped" (got: "${data2.error}")`
    );
    assert(data2.swipe !== undefined, 'Returns the existing swipe record');

    // Count swipes in DB — should be exactly 1
    const swipeCount = await db.query.swipes.findMany({
      where: and(eq(swipes.swiperId, user1.id), eq(swipes.swipedId, user2.id)),
    });
    assert(swipeCount.length === 1, `Exactly 1 swipe in DB (got ${swipeCount.length})`);

    // Different direction on same target — also blocked (already swiped)
    const res3 = await app.request('/swipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ targetId: user2.id, direction: 'left' }),
    });
    const data3 = await res3.json();
    assert(data3.error !== undefined, 'Changing direction on same target is also blocked');

    // Swipe on a different user — should succeed
    const res4 = await app.request('/swipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ targetId: user3.id, direction: 'right' }),
    });
    const data4 = await res4.json();
    assert(res4.status === 200, `Swipe on different user succeeds (got ${res4.status})`);
    assert(data4.swipe !== undefined, 'Returns swipe record for different user');

    // ═══════════════════════════════════════════════════════════
    // TEST 2: Reciprocal swipe creates match (and no duplicate)
    // ═══════════════════════════════════════════════════════════
    console.log('\n═══ TEST 2: Reciprocal swipe creates match ═══');

    // user2 swipes right on user1 (reciprocal) — should create a match
    const res5 = await app.request('/swipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token2}` },
      body: JSON.stringify({ targetId: user1.id, direction: 'right' }),
    });
    const data5 = await res5.json();
    assert(res5.status === 200, `Reciprocal swipe returns 200 (got ${res5.status})`);
    assert(data5.isMatch === true, `Creates a match (got isMatch=${data5.isMatch})`);
    assert(data5.match !== null, 'Match object is not null');

    // user2 tries to swipe right on user1 again — should be blocked
    const res6 = await app.request('/swipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token2}` },
      body: JSON.stringify({ targetId: user1.id, direction: 'right' }),
    });
    const data6 = await res6.json();
    assert(data6.error !== undefined, 'Second swipe on same user blocked');
    assert(data6.isMatch === false, 'Second swipe does not trigger match');

    // Should be exactly 1 match between user1 and user2
    const matchCount = await db.query.matches.findMany({
      where: and(
        eq(matches.userAId, user1.id),
        eq(matches.userBId, user2.id),
      ),
    });
    assert(matchCount.length === 1, `Exactly 1 match in DB (got ${matchCount.length})`);

    const theMatch = matchCount[0];

    // ═══════════════════════════════════════════════════════════
    // TEST 3: Mark-as-read authorization
    // ═══════════════════════════════════════════════════════════
    console.log('\n═══ TEST 3: Mark-as-read authorization ═══');

    // user1 sends a message to the match
    const [msg1] = await db.insert(messages).values({
      matchId: theMatch.id,
      senderId: user1.id,
      content: 'Hello from Alice!',
    }).returning();

    // user3 (not part of the match) tries to mark messages as read
    const res7 = await app.request(`/messages/${theMatch.id}/read`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token3}` },
    });
    assert(res7.status === 404, `User3 gets 404 for unauthorized mark-as-read (got ${res7.status})`);

    // Verify the message is still unread
    const unreadCheck1 = await db.query.messages.findFirst({
      where: eq(messages.id, msg1.id),
    });
    assert(unreadCheck1!.readAt === null, 'Message still unread after unauthorized attempt');

    // user2 (part of the match) marks messages as read — should succeed
    const res8 = await app.request(`/messages/${theMatch.id}/read`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token2}` },
    });
    assert(res8.status === 200, `User2 can mark-as-read (got ${res8.status})`);

    // Verify the message is now read
    const unreadCheck2 = await db.query.messages.findFirst({
      where: eq(messages.id, msg1.id),
    });
    assert(unreadCheck2!.readAt !== null, 'Message readAt is set after authorized mark-as-read');

    // user1 (also part of the match) can also mark as read
    const res9 = await app.request(`/messages/${theMatch.id}/read`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token1}` },
    });
    assert(res9.status === 200, `User1 can also mark-as-read (got ${res9.status})`);

    // ═══════════════════════════════════════════════════════════
    // TEST 4: Subscription cancel tier filtering
    // ═══════════════════════════════════════════════════════════
    console.log('\n═══ TEST 4: Subscription cancel tier filtering ═══');

    // Create two subscriptions for user1 (plus and elite)
    const [subPlus] = await db.insert(subscriptions).values({
      userId: user1.id, tier: 'plus', platform: 'ios', receipt: 'plus-receipt-1',
      expiresAt: new Date(Date.now() + 30 * 86400000),
    }).returning();

    const [subElite] = await db.insert(subscriptions).values({
      userId: user1.id, tier: 'elite', platform: 'ios', receipt: 'elite-receipt-1',
      expiresAt: new Date(Date.now() + 30 * 86400000),
    }).returning();

    // Cancel only 'plus' tier
    const res10 = await app.request('/subscriptions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ tier: 'plus' }),
    });
    assert(res10.status === 200, `Cancel returns 200 (got ${res10.status})`);

    // Verify plus is expired, elite is still active
    const plusAfter = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.id, subPlus.id),
    });
    const eliteAfter = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.id, subElite.id),
    });

    assert(
      plusAfter!.expiresAt! <= new Date(),
      'Plus subscription is expired'
    );
    assert(
      eliteAfter!.expiresAt! > new Date(),
      'Elite subscription is still active'
    );

    // Now cancel elite too (no tier filter = cancel all)
    const res11 = await app.request('/subscriptions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
    });
    assert(res11.status === 200, `Cancel all returns 200 (got ${res11.status})`);

    const eliteFinal = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.id, subElite.id),
    });
    assert(
      eliteFinal!.expiresAt! <= new Date(),
      'Elite subscription is now also expired after cancel-all'
    );

    // ═══════════════════════════════════════════════════════════
    // Summary
    // ═══════════════════════════════════════════════════════════
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log(`Results: ${passed} passed, ${failed} failed`);
    console.log('═══════════════════════════════════════════════════════════════');

    if (failed > 0) process.exit(1);

  } finally {
    // ── Cleanup ──────────────────────────────────────────────
    await db.delete(messages).where(eq(messages.senderId, user1.id));
    await db.delete(messages).where(eq(messages.senderId, user2.id));
    await db.delete(matches).where(eq(matches.userAId, user1.id));
    await db.delete(matches).where(eq(matches.userAId, user2.id));
    await db.delete(swipes).where(eq(swipes.swiperId, user1.id));
    await db.delete(swipes).where(eq(swipes.swiperId, user2.id));
    await db.delete(swipes).where(eq(swipes.swiperId, user3.id));
    await db.delete(subscriptions).where(eq(subscriptions.userId, user1.id));
    await db.delete(users).where(eq(users.id, user1.id));
    await db.delete(users).where(eq(users.id, user2.id));
    await db.delete(users).where(eq(users.id, user3.id));
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
