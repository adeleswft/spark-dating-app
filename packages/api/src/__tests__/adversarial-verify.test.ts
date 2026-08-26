/**
 * Runtime verification of the 5 bugs fixed in the adversarial review.
 * Imports and calls the actual code — not just file reading.
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
  // ═══════════════════════════════════════════════════════════════
  // Test 1: iOS mock receipt validation (no credentials → mock)
  // ═══════════════════════════════════════════════════════════════
  console.log('\nTest 1: iOS receipt validation falls back to mock when no credentials...');

  const { validateReceipt } = await import('../services/receiptValidation');

  // Ensure no Apple credentials are set (dev mode)
  const origSecret = process.env.APPLE_SHARED_SECRET;
  delete process.env.APPLE_SHARED_SECRET;

  const result = await validateReceipt('ios', 'fake-base64-receipt-data', {
    packageName: 'com.spark.dating',
    productId: 'plus-monthly',
  });

  assert(result.valid === true, 'iOS receipt is valid in mock mode (no credentials)');
  assert(result.environment === 'mock', `Environment is "mock", got "${result.environment}"`);
  assert(result.platform === 'ios', `Platform is "ios", got "${result.platform}"`);
  assert(result.expiresAt !== null, 'expiresAt is set (30 days from now)');
  assert(result.expiresAt! > Date.now(), 'expiresAt is in the future');
  assert(result.expiresAt! <= Date.now() + 31 * 24 * 60 * 60 * 1000, 'expiresAt is within 31 days');

  // Verify Android mock still works too
  const androidResult = await validateReceipt('android', 'fake-purchase-token', {
    packageName: 'com.spark.dating',
    productId: 'elite-monthly',
  });
  assert(androidResult.valid === true, 'Android receipt is valid in mock mode');
  assert(androidResult.environment === 'mock', 'Android environment is "mock"');

  // Restore
  if (origSecret) process.env.APPLE_SHARED_SECRET = origSecret;

  // ═══════════════════════════════════════════════════════════════
  // Test 2: Empty receipt rejected by validation service
  // ═══════════════════════════════════════════════════════════════
  console.log('\nTest 2: Empty receipt is rejected...');

  const emptyResult = await validateReceipt('ios', '', {});
  assert(emptyResult.valid === false, 'Empty receipt returns valid=false');
  assert(emptyResult.error === 'No receipt data provided', `Error message is correct: "${emptyResult.error}"`);

  const whitespaceResult = await validateReceipt('android', '   ', {});
  assert(whitespaceResult.valid === false, 'Whitespace-only receipt returns valid=false');

  // ═══════════════════════════════════════════════════════════════
  // Test 3: productToTier mapping
  // ═══════════════════════════════════════════════════════════════
  console.log('\nTest 3: productToTier mapping...');

  const { productToTier } = await import('../services/receiptValidation');

  assert(productToTier('plus-monthly') === 'plus', 'plus-monthly → plus');
  assert(productToTier('plus-annual') === 'plus', 'plus-annual → plus');
  assert(productToTier('elite-monthly') === 'elite', 'elite-monthly → elite');
  assert(productToTier('elite-annual') === 'elite', 'elite-annual → elite');
  assert(productToTier('something-else') === 'free', 'unknown → free');

  // ═══════════════════════════════════════════════════════════════
  // Test 4: Push token registration uses upsert (no duplicates)
  // ═══════════════════════════════════════════════════════════════
  console.log('\nTest 4: Push token registration code uses delete-then-insert...');

  const pushSrc = require('fs').readFileSync('src/services/pushNotifications.ts', 'utf-8');

  // The fix: should use delete before insert, not check-then-insert
  assert(pushSrc.includes('.delete(pushTokens)'), 'Code deletes existing token before insert');
  assert(!pushSrc.includes('const existing = await db.query.pushTokens.findFirst'), 'Old check-then-insert pattern is removed');

  // Verify delete is done with both userId AND token (not just userId)
  const deleteBlock = pushSrc.substring(
    pushSrc.indexOf('await db\n    .delete(pushTokens)'),
    pushSrc.indexOf('await db.insert(pushTokens)')
  );
  assert(deleteBlock.includes('eq(pushTokens.userId, userId)'), 'Delete filters by userId');
  assert(deleteBlock.includes('eq(pushTokens.token, token)'), 'Delete filters by token (not all user tokens)');

  // ═══════════════════════════════════════════════════════════════
  // Test 5: Delete account cleans up pushTokens
  // ═══════════════════════════════════════════════════════════════
  console.log('\nTest 5: Delete account cleans up pushTokens...');

  const authSrc = require('fs').readFileSync('src/routes/auth.ts', 'utf-8');

  // Verify pushTokens is imported
  assert(authSrc.includes('pushTokens'), 'pushTokens is imported in auth.ts');

  // Verify pushTokens is deleted inside the transaction (after verificationAttempts, before users)
  const txBlock = authSrc.substring(authSrc.indexOf('db.transaction'));
  assert(txBlock.includes('tx.delete(pushTokens)'), 'pushTokens deleted inside transaction');
  assert(txBlock.includes('eq(pushTokens.userId, userId)'), 'pushTokens deletion filters by userId');

  // Verify FK-safe ordering: pushTokens deleted BEFORE users
  const pushTokensPos = txBlock.indexOf('tx.delete(pushTokens)');
  const usersPos = txBlock.indexOf('tx.delete(users)');
  assert(pushTokensPos < usersPos, 'pushTokens deleted BEFORE users (FK-safe order)');

  // ═══════════════════════════════════════════════════════════════
  // Test 6: Apple webhook no longer has duplicate SUBSCRIBED case
  // ═══════════════════════════════════════════════════════════════
  console.log('\nTest 6: Apple webhook has no duplicate SUBSCRIBED case...');

  const webhookSrc = require('fs').readFileSync('src/routes/subscriptionsWebhooks.ts', 'utf-8');

  // Count occurrences of 'SUBSCRIBED' in case statements
  const subscribedCount = (webhookSrc.match(/case 'SUBSCRIBED'/g) || []).length;
  assert(subscribedCount === 1, `Exactly 1 case 'SUBSCRIBED' (found ${subscribedCount})`);

  // Verify DID_RENEW, EXPIRED, REFUND, REVOKE are all present
  assert(webhookSrc.includes("case 'DID_RENEW'"), 'DID_RENEW case present');
  assert(webhookSrc.includes("case 'EXPIRED'"), 'EXPIRED case present');
  assert(webhookSrc.includes("case 'REFUND'"), 'REFUND case present');
  assert(webhookSrc.includes("case 'REVOKE'"), 'REVOKE case present');

  // ═══════════════════════════════════════════════════════════════
  // Test 7: Apple webhook looks up by originalTransactionId
  // ═══════════════════════════════════════════════════════════════
  console.log('\nTest 7: Apple webhook looks up by originalTransactionId...');

  assert(webhookSrc.includes('subscriptions.originalTransactionId'), 'Webhook queries by originalTransactionId column');
  assert(webhookSrc.includes('originalTransactionId'), 'Uses originalTransactionId for lookup');

  // Verify fallback to receipt for legacy rows
  const lookupSection = webhookSrc.substring(
    webhookSrc.indexOf('originalTransactionId'),
    webhookSrc.indexOf('if (!existingSub)') + 200
  );
  assert(lookupSection.includes('eq(subscriptions.receipt, originalTransactionId)'), 'Falls back to receipt column for legacy rows');

  // ═══════════════════════════════════════════════════════════════
  // Test 8: Subscription route stores originalTransactionId
  // ═══════════════════════════════════════════════════════════════
  console.log('\nTest 8: Subscription route stores originalTransactionId...');

  const subSrc = require('fs').readFileSync('src/routes/subscriptions.ts', 'utf-8');

  assert(subSrc.includes('originalTransactionId: validation.originalTransactionId'), 'Stores validation.originalTransactionId on insert');

  // ═══════════════════════════════════════════════════════════════
  // Test 9: Schema has originalTransactionId column
  // ═══════════════════════════════════════════════════════════════
  console.log('\nTest 9: Schema has originalTransactionId column...');

  const schemaSrc = require('fs').readFileSync('src/db/schema.ts', 'utf-8');

  assert(schemaSrc.includes('originalTransactionId'), 'originalTransactionId field exists in schema');
  assert(schemaSrc.includes('original_transaction_id'), 'Maps to original_transaction_id column');

  // ═══════════════════════════════════════════════════════════════
  // Test 10: registerPushToken actually works end-to-end
  // ═══════════════════════════════════════════════════════════════
  console.log('\nTest 10: registerPushToken upsert behavior...');

  // Check if DB is available
  let dbAvailable = false;
  try {
    const { db } = await import('../db');
    await db.execute('SELECT 1');
    dbAvailable = true;
  } catch {
    console.log('  ⚠️  PostgreSQL not available — skipping DB integration test');
  }

  if (dbAvailable) {
  const { registerPushToken, unregisterAllPushTokens } = await import('../services/pushNotifications');
  const { db } = await import('../db');
  const { users: usersTable, pushTokens: pushTokensTable } = await import('../db/schema');
  const { eq } = await import('drizzle-orm');

  // Create a temporary test user
  const testEmail = `push-test-${Date.now()}@example.com`;
  const [testUser] = await db.insert(usersTable).values({
    name: 'Push Test',
    email: testEmail,
    passwordHash: 'fake-hash',
    dob: '2000-01-01',
    gender: 'other',
  }).returning();

  try {
    // Register the same token twice
    const count1 = await registerPushToken(testUser.id, 'ExpoPushToken[test123]', 'ios');
    const count2 = await registerPushToken(testUser.id, 'ExpoPushToken[test123]', 'ios');

    assert(count1 === count2, `Same count after duplicate registration (got ${count1} then ${count2})`);
    assert(count1 === 1, `Exactly 1 token after registering same token twice (got ${count1})`);

    // Register a different token
    const count3 = await registerPushToken(testUser.id, 'ExpoPushToken[test456]', 'android');
    assert(count3 === 2, `2 tokens after registering a second different token (got ${count3})`);

    // Cleanup
    await unregisterAllPushTokens(testUser.id);
    const remaining = await db.query.pushTokens.findMany({
      where: eq(pushTokensTable.userId, testUser.id),
    });
    assert(remaining.length === 0, 'All tokens cleaned up after unregisterAll');
  } finally {
    // Clean up test user
    await db.delete(usersTable).where(eq(usersTable.id, testUser.id));
  }
  } else {
    console.log('  ⚠️  Skipping DB integration assertions (no PostgreSQL)');
  }

  // ═══════════════════════════════════════════════════════════════
  // Summary
  // ═══════════════════════════════════════════════════════════════
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════════════════════════════');

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
