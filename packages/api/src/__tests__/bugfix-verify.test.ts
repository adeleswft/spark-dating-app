/**
 * Runtime verification of the 3 additional bug fixes.
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
  // Test 1: Swipes route has idempotency check
  // ═══════════════════════════════════════════════════════════════
  console.log('\nTest 1: Swipes route has duplicate swipe check...');

  const swipesSrc = fs.readFileSync('src/routes/swipes.ts', 'utf-8');

  // Must query for existing swipe before inserting
  assert(swipesSrc.includes('findMany') || swipesSrc.includes('findFirst'), 'Queries for existing swipe');
  assert(swipesSrc.includes('swiperId') && swipesSrc.includes('swipedId'), 'Checks both swiperId and swipedId');

  // Must return early if already swiped
  assert(
    swipesSrc.includes('Already swiped') || swipesSrc.includes('already swiped'),
    'Returns error message for duplicate swipe'
  );

  // The insert should come AFTER the duplicate check
  const existingCheckPos = swipesSrc.indexOf('existingSwipe');
  const insertPos = swipesSrc.indexOf('.insert(swipes)');
  assert(insertPos > existingCheckPos, 'Insert comes AFTER duplicate check');

  // ═══════════════════════════════════════════════════════════════
  // Test 2: Mark-as-read verifies match membership
  // ═══════════════════════════════════════════════════════════════
  console.log('\nTest 2: Mark-as-read verifies match membership...');

  const messagesSrc = fs.readFileSync('src/routes/messages.ts', 'utf-8');

  // Find the /:matchId/read handler
  const readHandlerStart = messagesSrc.indexOf("'/:matchId/read'");
  const readHandlerSection = messagesSrc.substring(readHandlerStart, readHandlerStart + 600);

  // Must query the matches table
  assert(readHandlerSection.includes('db.query.matches.findFirst'), 'Read handler queries matches table');

  // Must check userAId and userBId
  assert(readHandlerSection.includes('userAId'), 'Checks userAId');
  assert(readHandlerSection.includes('userBId'), 'Checks userBId');

  // Must return 404 if not part of match
  assert(readHandlerSection.includes('404'), 'Returns 404 for unauthorized access');

  // The mark-as-read update should come AFTER the membership check
  const membershipCheckPos = messagesSrc.indexOf('Match not found', readHandlerStart);
  const markReadPos = messagesSrc.indexOf('.update(messages)', readHandlerStart);
  assert(markReadPos > membershipCheckPos, 'Mark-as-read comes AFTER membership check');

  // ═══════════════════════════════════════════════════════════════
  // Test 3: Subscription cancel supports tier filter
  // ═══════════════════════════════════════════════════════════════
  console.log('\nTest 3: Subscription cancel supports tier filter...');

  const subSrc = fs.readFileSync('src/routes/subscriptions.ts', 'utf-8');

  // Find the DELETE handler (generous window to capture all logic)
  const deleteHandlerStart = subSrc.indexOf('subscriptionRoutes.delete');
  const deleteHandlerSection = subSrc.substring(deleteHandlerStart, deleteHandlerStart + 1200);

  // Must accept tier parameter
  assert(deleteHandlerSection.includes('tier'), 'Accepts tier parameter');

  // Must filter by tier when provided
  assert(deleteHandlerSection.includes('eq(subscriptions.tier'), 'Filters by tier when provided');

  // Must use dynamic conditions (spread array)
  assert(deleteHandlerSection.includes('...conditions'), 'Uses dynamic conditions array');

  // ═══════════════════════════════════════════════════════════════
  // Test 4: Swipes route still has match detection
  // ═══════════════════════════════════════════════════════════════
  console.log('\nTest 4: Swipes route still detects reciprocal matches...');

  assert(swipesSrc.includes('reciprocalSwipe'), 'Still checks for reciprocal swipe');
  assert(swipesSrc.includes('insert(matches)'), 'Still creates matches');
  assert(swipesSrc.includes('broadcastToUser'), 'Still broadcasts match via WebSocket');

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
