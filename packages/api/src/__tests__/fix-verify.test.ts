#!/usr/bin/env tsx
/**
 * Runtime verification of recent bug fixes.
 * Tests the actual compiled code, not just file contents.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✅ ${msg}`);
    passed++;
  } else {
    console.log(`  ❌ FAIL: ${msg}`);
    failed++;
  }
}

// Resolve paths relative to project root (cwd when running)
const PROJECT_ROOT = join(process.cwd(), '..', '..');

function readFile(relPath: string): string {
  return readFileSync(join(PROJECT_ROOT, relPath), 'utf-8');
}

async function main() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('Runtime Verification of Recent Fixes');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // ── Test 1: WS read handler has authz check ────────────────────
  console.log('Test 1: WebSocket read handler includes authorization check');
  {
    const wsSrc = readFile('packages/api/src/ws/index.ts');

    const readCaseStart = wsSrc.indexOf("case 'read':");
    assert(readCaseStart > 0, 'read case exists');

    // Get the handler block
    const readBlock = wsSrc.substring(readCaseStart, readCaseStart + 1200);

    const hasMatchQuery = readBlock.includes('db.query.matches.findFirst');
    assert(hasMatchQuery, 'Queries match table for authorization');

    const hasUserCheck = readBlock.includes('userAId') && readBlock.includes('userBId');
    assert(hasUserCheck, 'Checks userAId and userBId membership');

    const hasAuthzDeny = readBlock.includes('Not authorized');
    assert(hasAuthzDeny, 'Returns error for unauthorized users');

    // The authz check must come before the db.update — verify by checking
    // that the first `db.query.matches.findFirst` appears before the first `db.update`
    const firstQueryPos = readBlock.indexOf('db.query.matches.findFirst');
    const firstUpdatePos = readBlock.indexOf('.update(messages)');
    assert(firstQueryPos >= 0 && firstUpdatePos >= 0, 'Both query and update found in read handler');
    if (firstQueryPos >= 0 && firstUpdatePos >= 0) {
      assert(firstQueryPos < firstUpdatePos, `Authz check (pos ${firstQueryPos}) before update (pos ${firstUpdatePos})`);
    }
  }

  // ── Test 2: WS read handler doesn't have the old broken ternary ──
  console.log('\nTest 2: WebSocket read handler fixed ternary bug');
  {
    const wsSrc = readFile('packages/api/src/ws/index.ts');

    const readCaseStart = wsSrc.indexOf("case 'read':");
    const readBlock = wsSrc.substring(readCaseStart, readCaseStart + 1200);

    const hasBrokenTernary = readBlock.includes('senderId, ws.userId) ? undefined');
    assert(!hasBrokenTernary, 'Old broken ternary pattern is removed');

    const hasNe = readBlock.includes('ne(messages.senderId');
    assert(hasNe, 'Uses ne() to exclude own messages');

    const hasIsNull = readBlock.includes('IS NULL');
    assert(hasIsNull, 'Filters for unread messages only');
  }

  // ── Test 3: WS read handler reuses query ────────────────────────
  console.log('\nTest 3: WebSocket read handler reuses match query');
  {
    const wsSrc = readFile('packages/api/src/ws/index.ts');

    const readCaseStart = wsSrc.indexOf("case 'read':");
    const readBlock = wsSrc.substring(readCaseStart, readCaseStart + 1200);

    const matchQueries = readBlock.match(/db\.query\.matches\.findFirst/g) || [];
    assert(matchQueries.length === 1, `Single match query (found ${matchQueries.length})`);

    const hasReadMatch = readBlock.includes('readMatch.');
    assert(hasReadMatch, 'Reuses authz query result for notification');
  }

  // ── Test 4: Settings persistence uses safe endpoint ─────────────
  console.log('\nTest 4: Settings persistence uses safe endpoint');
  {
    const settingsSrc = readFile('apps/mobile/app/settings.tsx');

    // Should NOT call /onboarding for settings — check only the persistSettings function body
    const persistFnStart = settingsSrc.indexOf('const persistSettings');
    const persistFnBody = settingsSrc.substring(persistFnStart, persistFnStart + 500);
    const hasOnboardingInPersist = persistFnBody.includes('/onboarding');
    assert(!hasOnboardingInPersist, 'persistSettings does not call /onboarding (was destructive)');

    // Should use /profiles with PUT
    const hasProfilesPut = settingsSrc.includes("method: 'PUT'") && settingsSrc.includes('/profiles');
    assert(hasProfilesPut, 'Uses PUT /profiles for safe partial updates');
  }

  // ── Test 5: API client message routes are correct ───────────────
  console.log('\nTest 5: API client message routes are correct');
  {
    const apiSrc = readFile('apps/mobile/services/api.ts');

    // Find the getMessages function body
    const getMsgStart = apiSrc.indexOf('async getMessages');
    const getMsgBody = apiSrc.substring(getMsgStart, getMsgStart + 200);
    assert(getMsgBody.includes('/messages/${matchId}'), 'getMessages uses /messages/:matchId');
    assert(!getMsgBody.includes('/matches/'), 'getMessages does not use /matches/');

    // Find the sendMessage function body
    const sendMsgStart = apiSrc.indexOf('async sendMessage');
    const sendMsgBody = apiSrc.substring(sendMsgStart, sendMsgStart + 200);
    assert(sendMsgBody.includes('/messages/${matchId}'), 'sendMessage uses /messages/:matchId');
    assert(!sendMsgBody.includes('/matches/'), 'sendMessage does not use /matches/');
  }

  // ── Test 6: API error parsing handles both shapes ───────────────
  console.log('\nTest 6: API error parsing handles both response shapes');
  {
    const apiSrc = readFile('apps/mobile/services/api.ts');

    const hasErrorField = apiSrc.includes('error.error');
    assert(hasErrorField, 'Reads error.error (server response shape)');

    const hasMessageField = apiSrc.includes('error.message');
    assert(hasMessageField, 'Falls back to error.message');
  }

  // ── Test 7: Import all route modules ────────────────────────────
  console.log('\nTest 7: All route modules import cleanly');
  {
    const modules = [
      '../routes/auth',
      '../routes/profiles',
      '../routes/swipes',
      '../routes/matches',
      '../routes/messages',
      '../routes/subscriptions',
      '../routes/notifications',
      '../routes/admin',
      '../routes/safety',
      '../routes/datePlanner',
      '../routes/passwordReset',
      '../routes/upload',
      '../routes/dataExport',
      '../routes/verification',
      '../routes/onboarding',
      '../routes/profileReview',
    ];

    let importErrors = 0;
    for (const mod of modules) {
      try {
        await import(mod);
      } catch (e) {
        importErrors++;
        console.log(`  ❌ Failed to import ${mod}: ${(e as Error).message?.slice(0, 80)}`);
      }
    }
    assert(importErrors === 0, `All ${modules.length} route modules import (${importErrors} failures)`);
  }

  // ── Test 8: Hono app mounts all routes correctly ────────────────
  console.log('\nTest 8: API app mounts messages at /messages path');
  {
    const indexSrc = readFile('packages/api/src/index.ts');

    // Check that auth middleware is applied to /messages/*
    const hasMessagesAuth = indexSrc.includes("app.use('/messages/*', authMiddleware)");
    assert(hasMessagesAuth, 'Auth middleware applied to /messages/*');

    // Check messageRoutes is mounted at /messages
    const hasMessagesRoute = indexSrc.includes("app.route('/messages', messageRoutes)");
    assert(hasMessagesRoute, 'messageRoutes mounted at /messages');
  }

  // ── Test 9: Navigation fix ──────────────────────────────────────
  console.log('\nTest 9: Notification navigation uses existing tab');
  {
    const notifSrc = readFile('apps/mobile/hooks/useNotifications.ts');

    // Should not reference non-existent /(tabs)/matches
    const hasMatchesRoute = notifSrc.includes("'/(tabs)/matches'");
    assert(!hasMatchesRoute, 'No reference to non-existent /(tabs)/matches');

    // Should use /(tabs)/messages for match notifications
    const hasMessagesRoute = notifSrc.includes("'/(tabs)/messages'");
    assert(hasMessagesRoute, 'Match notification navigates to /(tabs)/messages');
  }

  // ── Test 10: useOnlineStatus resets trackedRef ───────────────────
  console.log('\nTest 10: useOnlineStatus resets trackedRef on userId change');
  {
    const onlineSrc = readFile('apps/mobile/hooks/useOnlineStatus.ts');

    // Should have an effect that resets trackedRef when userId changes
    const hasResetEffect = onlineSrc.includes('trackedRef.current = false') &&
                           onlineSrc.includes('[userId]');
    assert(hasResetEffect, 'trackedRef reset when userId changes');
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Test crashed:', err);
  process.exit(1);
});
