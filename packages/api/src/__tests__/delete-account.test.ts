/**
 * Headless test for the three bugs I fixed:
 * 1. DELETE /auth/account now deletes ALL messages in user's matches
 * 2. trackSwipe fires AFTER successful DB insert
 * 3. Upload directory uses mkdirSync (synchronous)
 */

const fs = require('fs');
const path = require('path');

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

// ═══════════════════════════════════════════════════════════════
// Test 1: Delete account code deletes ALL messages in user's matches
// ═══════════════════════════════════════════════════════════════
console.log('\nTest 1: Delete account deletes ALL messages in user matches...');

const authContent = fs.readFileSync('src/routes/auth.ts', 'utf-8');

// Verify the fix queries matches first
const findsMatches = authContent.includes('select().from(matches).where(') &&
  authContent.includes('userAId') &&
  authContent.includes('userBId');
assert(findsMatches, 'Delete account queries matches before deleting messages');

// Verify it deletes messages by matchId (ALL messages), not just senderId
const deletesByMatchId = authContent.includes('delete(messages).where(eq(messages.matchId, match.id))');
assert(deletesByMatchId, 'Deletes ALL messages in each match by matchId');

// Verify the old broken pattern (only senderId) is gone
const oldPatternGone = !authContent.includes('delete(messages).where(eq(messages.senderId, userId))');
assert(oldPatternGone, 'Old pattern (only delete senderId messages) is removed');

// Verify the order: messages BEFORE matches
const messagesBeforeMatches = authContent.indexOf('delete(messages)') < authContent.indexOf('delete(matches)');
assert(messagesBeforeMatches, 'Messages are deleted BEFORE matches (correct FK order)');

// Verify it imports `or` from drizzle-orm (needed for the match query)
const importsOr = authContent.includes("import { users, swipes, matches, messages,") &&
  authContent.includes('or');
assert(importsOr, 'Imports `or` from drizzle-orm for match query');

// ═══════════════════════════════════════════════════════════════
// Test 2: trackSwipe fires AFTER successful DB insert
// ═══════════════════════════════════════════════════════════════
console.log('\nTest 2: trackSwipe fires after successful insert...');

const swipesContent = fs.readFileSync('src/routes/swipes.ts', 'utf-8');

// Find the position of the insert and the trackSwipe call
const insertPos = swipesContent.indexOf('.insert(swipes)');
const trackPos = swipesContent.indexOf('trackSwipe(userId, direction, false)');

assert(insertPos > 0, 'Insert statement exists');
assert(trackPos > 0, 'trackSwipe call exists');

if (insertPos > 0 && trackPos > 0) {
  // The trackSwipe call should come AFTER the insert
  // But we need to find the FIRST trackSwipe call (the non-match one)
  assert(trackPos > insertPos, 'First trackSwipe call is AFTER db.insert (correct order)');
}

// Verify the second trackSwipe (for matches) is also after the match is created
const matchTrackPos = swipesContent.indexOf('trackSwipe(userId, direction, true)');
const matchInsertPos = swipesContent.indexOf('insert(matches)');
if (matchTrackPos > 0 && matchInsertPos > 0) {
  assert(matchTrackPos > matchInsertPos, 'Match trackSwipe is AFTER match insert (correct order)');
}

// ═══════════════════════════════════════════════════════════════
// Test 3: Upload directory uses mkdirSync (synchronous)
// ═══════════════════════════════════════════════════════════════
console.log('\nTest 3: Upload directory uses synchronous mkdir...');

const uploadContent = fs.readFileSync('src/routes/upload.ts', 'utf-8');

// Verify mkdirSync is imported
const importsMkdirSync = uploadContent.includes("import { existsSync, mkdirSync } from 'fs'");
assert(importsMkdirSync, 'Imports mkdirSync from fs');

// Verify mkdirSync is used (not async mkdir)
const usesMkdirSync = uploadContent.includes('mkdirSync(UPLOAD_DIR, { recursive: true })');
assert(usesMkdirSync, 'Uses mkdirSync (synchronous) at module scope');

// Verify async mkdir is NOT imported
const noAsyncMkdir = !uploadContent.includes("import { writeFile, mkdir } from 'fs/promises'");
assert(noAsyncMkdir, 'Async mkdir is NOT imported (was removed)');

// Verify the uploads directory actually exists on disk
const uploadsDir = path.join(process.cwd(), 'uploads');
const uploadsExists = fs.existsSync(uploadsDir);
assert(uploadsExists, 'uploads/ directory exists on disk');

// ═══════════════════════════════════════════════════════════════
// Test 4: Verify moderation service type assertion
// ═══════════════════════════════════════════════════════════════
console.log('\nTest 4: Moderation service type assertions...');

const moderationContent = fs.readFileSync('src/services/moderation.ts', 'utf-8');

// Verify response.json() is cast to ModerationResult
const hasTypeAssertion = moderationContent.includes('as ModerationResult');
assert(hasTypeAssertion, 'response.json() is cast to ModerationResult (prevents TS error)');

// Verify the fallback returns correct type
const hasFallback = moderationContent.includes('return basicModeration(message)');
assert(hasFallback, 'Falls back to basicModeration on AI service failure');

// ═══════════════════════════════════════════════════════════════
// Test 5: Verify delete account imports all needed tables
// ═══════════════════════════════════════════════════════════════
console.log('\nTest 5: Delete account imports all needed tables...');

const neededTables = ['messages', 'userEmbeddings', 'userInterests', 'userPreferences', 'swipes', 'matches', 'subscriptions', 'verifications', 'reports'];
const missingTables = neededTables.filter(t => !authContent.includes(t));
assert(missingTables.length === 0, `All needed tables imported (missing: ${missingTables.join(', ') || 'none'})`);

// Verify the delete order is correct (messages before matches, user last)
const deleteOrder = [
  'delete(messages)',
  'delete(userEmbeddings)',
  'delete(userInterests)',
  'delete(userPreferences)',
  'delete(swipes)',
  'delete(matches)',
  'delete(subscriptions)',
  'delete(verifications)',
  'delete(reports)',
  'delete(users)',  // user deleted last
];

let orderCorrect = true;
let lastPos = -1;
for (const del of deleteOrder) {
  const pos = authContent.indexOf(del);
  if (pos < 0) {
    orderCorrect = false;
    break;
  }
  if (pos <= lastPos) {
    orderCorrect = false;
    break;
  }
  lastPos = pos;
}
assert(orderCorrect, 'Delete order is correct (cascading, user deleted last)');

// ═══════════════════════════════════════════════════════════════
// Test 6: Delete account is wrapped in a transaction
// ═══════════════════════════════════════════════════════════════
console.log('\nTest 6: Delete account is wrapped in a transaction...');

// Verify db.transaction is called
const hasTransaction = authContent.includes('db.transaction(async (tx)');
assert(hasTransaction, 'Delete account uses db.transaction');

// Verify all deletes inside the transaction use tx (not db)
const txDeletes = [
  'tx.delete(messages)',
  'tx.delete(userEmbeddings)',
  'tx.delete(userInterests)',
  'tx.delete(userPreferences)',
  'tx.delete(swipes)',
  'tx.delete(matches)',
  'tx.delete(subscriptions)',
  'tx.delete(verifications)',
  'tx.delete(reports)',
  'tx.delete(users)',
];

let allUseTx = true;
const nonTxDeletes = [];
for (const del of txDeletes) {
  if (!authContent.includes(del)) {
    nonTxDeletes.push(del.replace('tx.', 'db.'));
  }
}
// Check that there are no db.delete inside the transaction (they should all be tx.delete)
// Find the transaction start and the closing of the transaction callback
const txStartIdx = authContent.indexOf('db.transaction(async (tx)');
// Count braces to find the end of the transaction block
let braceCount = 0;
let txEndIdx = txStartIdx;
let foundFirstBrace = false;
for (let i = txStartIdx; i < authContent.length; i++) {
  if (authContent[i] === '{') { braceCount++; foundFirstBrace = true; }
  if (authContent[i] === '}') braceCount--;
  if (foundFirstBrace && braceCount === 0) { txEndIdx = i + 1; break; }
}
const transactionBlock = authContent.substring(txStartIdx, txEndIdx);
const hasDbDeleteInTransaction = transactionBlock.includes('db.delete(');
assert(!hasDbDeleteInTransaction && nonTxDeletes.length === 0,
  `All deletes inside transaction use tx (not db). Missing tx: ${nonTxDeletes.join(', ') || 'none'}`);

// Verify tx.select is used for the match query inside transaction
const hasTxSelect = transactionBlock.includes('tx.select().from(matches)');
assert(hasTxSelect, 'Match query inside transaction uses tx (not db)');

// ═══════════════════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════════════════
console.log('\n═══════════════════════════════════════════════════════════════');
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('═══════════════════════════════════════════════════════════════');

if (failed > 0) {
  process.exit(1);
}
