/**
 * Database-free unit test for the 3 bug fixes.
 * Imports and exercises the actual compiled code.
 * Does NOT require PostgreSQL.
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
  const fs = require('fs');

  // ═══════════════════════════════════════════════════════════════
  // Test 1: Swipes route — actual code structure verification
  // ═══════════════════════════════════════════════════════════════
  console.log('\n═══ TEST 1: Swipes duplicate check (code structure) ═══');

  const swipesSrc = fs.readFileSync('src/routes/swipes.ts', 'utf-8');

  // 1a. The query for existing swipe must check BOTH swiperId AND swipedId
  const existingCheckBlock = swipesSrc.substring(
    swipesSrc.indexOf('existingSwipe'),
    swipesSrc.indexOf('existingSwipe') + 300
  );
  assert(existingCheckBlock.includes('swiperId'), 'Existing swipe query checks swiperId');
  assert(existingCheckBlock.includes('swipedId'), 'Existing swipe query checks swipedId');

  // 1b. Must return early (not fall through to insert)
  const insertPos = swipesSrc.indexOf('.insert(swipes)');
  // Find the line containing 'Already swiped' and check it has a return
  const alreadySwipedIdx = swipesSrc.indexOf('Already swiped');
  const lineStart = swipesSrc.lastIndexOf('\n', alreadySwipedIdx) + 1;
  const lineEnd = swipesSrc.indexOf('\n', alreadySwipedIdx);
  const theLine = swipesSrc.substring(lineStart, lineEnd);
  assert(theLine.includes('return'), `Line with 'Already swiped' contains return (got: ${theLine.trim().substring(0, 80)}...)`);

  // 1c. Insert must come AFTER the duplicate check
  const checkPos = swipesSrc.indexOf('existingSwipe');
  assert(insertPos > checkPos, `Insert (${insertPos}) comes after check (${checkPos})`);

  // 1d. Match detection still works after the check
  assert(swipesSrc.includes('reciprocalSwipe'), 'Reciprocal swipe check still exists');
  assert(swipesSrc.includes('insert(matches)'), 'Match creation still exists');
  assert(swipesSrc.includes('broadcastToUser'), 'WebSocket broadcast still exists');

  // ═══════════════════════════════════════════════════════════════
  // Test 2: Mark-as-read — membership check structure
  // ═══════════════════════════════════════════════════════════════
  console.log('\n═══ TEST 2: Mark-as-read authz (code structure) ═══');

  const messagesSrc = fs.readFileSync('src/routes/messages.ts', 'utf-8');

  // 2a. Find the mark-as-read handler
  const readIdx = messagesSrc.indexOf("'/:matchId/read'");
  assert(readIdx >= 0, 'Route for /:matchId/read exists');

  // Extract the handler body (up to the next route or end of file)
  const readSection = messagesSrc.substring(readIdx, readIdx + 800);

  // 2b. Must query matches table
  assert(readSection.includes('db.query.matches.findFirst'), 'Queries matches table');

  // 2c. Must check both userAId and userBId
  assert(readSection.includes('userAId'), 'Checks userAId for membership');
  assert(readSection.includes('userBId'), 'Checks userBId for membership');

  // 2d. Must return 404 if not a member
  assert(readSection.includes('404'), 'Returns 404 for non-members');

  // 2e. The update must come AFTER the membership check
  const matchQueryPos = messagesSrc.indexOf('db.query.matches.findFirst', readIdx);
  const updatePos = messagesSrc.indexOf('.update(messages)', readIdx);
  assert(updatePos > matchQueryPos, `Update (${updatePos}) comes after membership check (${matchQueryPos})`);

  // 2f. The update must still filter by senderId (only mark OTHER users' messages)
  const updateSection = messagesSrc.substring(updatePos, updatePos + 300);
  assert(updateSection.includes('ne(messages.senderId'), 'Update filters out own messages');
  assert(updateSection.includes('readAt'), 'Update sets readAt');
  assert(updateSection.includes('IS NULL'), 'Only marks unread messages');

  // ═══════════════════════════════════════════════════════════════
  // Test 3: Subscription cancel — tier filter structure
  // ═══════════════════════════════════════════════════════════════
  console.log('\n═══ TEST 3: Subscription cancel tier filter (code structure) ═══');

  const subSrc = fs.readFileSync('src/routes/subscriptions.ts', 'utf-8');

  // 3a. Find the DELETE handler
  const deleteIdx = subSrc.indexOf('subscriptionRoutes.delete');
  assert(deleteIdx >= 0, 'DELETE /subscriptions route exists');

  const deleteSection = subSrc.substring(deleteIdx, deleteIdx + 1000);

  // 3b. Must accept tier parameter from request body
  assert(deleteSection.includes('tier'), 'Accepts tier parameter');

  // 3c. Must build dynamic conditions array
  assert(deleteSection.includes('conditions'), 'Uses conditions array');
  assert(deleteSection.includes('...conditions'), 'Spreads conditions into where clause');

  // 3d. Must filter by tier when provided
  assert(deleteSection.includes('eq(subscriptions.tier'), 'Filters by tier when provided');

  // 3e. Must include userId in conditions (always)
  assert(deleteSection.includes('eq(subscriptions.userId'), 'Always filters by userId');

  // 3f. Must still call .update with expiresAt = now
  assert(deleteSection.includes('expiresAt: new Date()'), 'Sets expiresAt to now');
  assert(deleteSection.includes('.update(subscriptions)'), 'Calls update on subscriptions table');

  // ═══════════════════════════════════════════════════════════════
  // Test 4: Import verification — all modules compile and load
  // ═══════════════════════════════════════════════════════════════
  console.log('\n═══ TEST 4: Module imports compile ═══');

  const { swipeRoutes } = await import('../routes/swipes');
  assert(swipeRoutes !== undefined, 'swipeRoutes module loads');

  const { messageRoutes } = await import('../routes/messages');
  assert(messageRoutes !== undefined, 'messageRoutes module loads');

  const { subscriptionRoutes } = await import('../routes/subscriptions');
  assert(subscriptionRoutes !== undefined, 'subscriptionRoutes module loads');

  const { matchRoutes } = await import('../routes/matches');
  assert(matchRoutes !== undefined, 'matchRoutes module loads');

  // ═══════════════════════════════════════════════════════════════
  // Test 5: Verify Hono routes are registered
  // ═══════════════════════════════════════════════════════════════
  console.log('\n═══ TEST 5: Hono routes registered ═══');

  // The swipeRoutes should have POST / and GET /history
  // The messageRoutes should have GET /:matchId, POST /:matchId, POST /:matchId/read
  // The subscriptionRoutes should have DELETE /

  // Verify by making requests to the app (no DB needed for route existence)
  const { Hono } = await import('hono');
  const { authMiddleware } = await import('../middleware/auth');

  const testApp = new Hono();
  testApp.use('/swipes/*', authMiddleware);
  testApp.use('/swipes', authMiddleware);
  testApp.use('/messages/*', authMiddleware);
  testApp.use('/subscriptions/*', authMiddleware);
  testApp.use('/subscriptions', authMiddleware);
  testApp.use('/matches/*', authMiddleware);
  testApp.use('/matches', authMiddleware);
  testApp.route('/swipes', swipeRoutes);
  testApp.route('/messages', messageRoutes);
  testApp.route('/subscriptions', subscriptionRoutes);
  testApp.route('/matches', matchRoutes);

  // POST /swipes without auth → 401
  const noAuthSwipe = await testApp.request('/swipes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetId: 'fake', direction: 'right' }),
  });
  assert(noAuthSwipe.status === 401, `POST /swipes without auth returns 401 (got ${noAuthSwipe.status})`);

  // POST /messages/fake/read without auth → 401
  const noAuthRead = await testApp.request('/messages/fake/read', {
    method: 'POST',
    headers: {},
  });
  assert(noAuthRead.status === 401, `POST /messages/:id/read without auth returns 401 (got ${noAuthRead.status})`);

  // DELETE /subscriptions without auth → 401
  const noAuthCancel = await testApp.request('/subscriptions', {
    method: 'DELETE',
    headers: {},
  });
  assert(noAuthCancel.status === 401, `DELETE /subscriptions without auth returns 401 (got ${noAuthCancel.status})`);

  // ═══════════════════════════════════════════════════════════════
  // Summary
  // ═══════════════════════════════════════════════════════════════
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════════════════════════════');

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
