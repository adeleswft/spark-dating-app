/**
 * Headless tests for the GDPR data export feature.
 * Verifies the route file exists, has correct structure, and exports all expected data sections.
 */

const fs = require('fs');

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
// Test 1: dataExport.ts exists and has correct structure
// ═══════════════════════════════════════════════════════════════
console.log('\nTest 1: dataExport.ts structure...');

const content = fs.readFileSync('src/routes/dataExport.ts', 'utf-8');

assert(content.includes('export const dataExportRoutes'), 'Exports dataExportRoutes');
assert(content.includes("get('/export'"), 'Has GET /export endpoint');
assert(content.includes("c.get('userId')"), 'Reads userId from auth context');

// ═══════════════════════════════════════════════════════════════
// Test 2: Queries all relevant tables
// ═══════════════════════════════════════════════════════════════
console.log('\nTest 2: Queries all relevant tables...');

const tables = [
  'users',
  'userPreferences',
  'userInterests',
  'swipes',
  'matches',
  'messages',
  'subscriptions',
  'boosts',
  'verifications',
  'verificationAttempts',
  'reports',
  'blockedUsers',
  'deviceFingerprints',
];

const missingTables = tables.filter((t) => !content.includes(t));
assert(
  missingTables.length === 0,
  `All tables queried (missing: ${missingTables.join(', ') || 'none'})`,
);

// ═══════════════════════════════════════════════════════════════
// Test 3: Strips sensitive fields from export
// ═══════════════════════════════════════════════════════════════
console.log('\nTest 3: Strips sensitive fields...');

assert(content.includes('passwordHash'), 'References passwordHash (to strip it)');
// The profile is destructured to strip passwordHash: `const { passwordHash, ...profile } = user`
assert(
  content.includes('{ passwordHash, ...profile }'),
  'Destructures passwordHash out of user object',
);
// The export block should not include passwordHash as a property (only in _meta notes)
const exportBlock = content.substring(content.indexOf('const exportData'));
// Should NOT have `passwordHash:` as a property key (only in notes string is OK)
assert(
  !exportBlock.match(/passwordHash\s*:/),
  'passwordHash is NOT a property in exportData',
);
// embedding should not appear as a property key in exportData
assert(
  !exportBlock.match(/\bembedding\s*:/),
  'embedding is NOT a property in exportData',
);

// ═══════════════════════════════════════════════════════════════
// Test 4: Export includes all expected sections
// ═══════════════════════════════════════════════════════════════
console.log('\nTest 4: Export includes all sections...');

const expectedSections = [
  '_meta',
  'profile',
  'preferences',
  'interests',
  'swipes',
  'matches',
  'messages',
  'subscriptions',
  'boosts',
  'verifications',
  'verificationAttempts',
  'reports',
  'blockedUsers',
  'devices',
];

// profile uses shorthand syntax: `profile,` not `profile:`
const missingSections = expectedSections.filter((s) => {
  if (s === 'profile') return !exportBlock.includes('profile,');
  return !exportBlock.includes(`${s}:`);
});
assert(
  missingSections.length === 0,
  `All sections present (missing: ${missingSections.join(', ') || 'none'})`,
);

// ═══════════════════════════════════════════════════════════════
// Test 5: Export metadata is GDPR-compliant
// ═══════════════════════════════════════════════════════════════
console.log('\nTest 5: GDPR metadata...');

assert(exportBlock.includes('GDPR'), 'Mentions GDPR');
assert(exportBlock.includes('exportDate'), 'Includes export timestamp');
assert(exportBlock.includes('userId'), 'Includes userId in metadata');
assert(
  exportBlock.includes('passwordHash is excluded'),
  'Notes that passwordHash is excluded',
);

// ═══════════════════════════════════════════════════════════════
// Test 6: Response is a downloadable JSON file
// ═══════════════════════════════════════════════════════════════
console.log('\nTest 6: Downloadable file response...');

assert(content.includes('Content-Disposition'), 'Sets Content-Disposition header');
assert(content.includes('attachment'), 'Content-Disposition is attachment');
assert(content.includes('Content-Type'), 'Sets Content-Type');
assert(content.includes('application/json'), 'Content-Type is application/json');
assert(content.includes('Cache-Control'), 'Sets Cache-Control');
assert(content.includes('no-store'), 'Cache-Control is no-store');

// ═══════════════════════════════════════════════════════════════
// Test 7: Messages query uses batching
// ═══════════════════════════════════════════════════════════════
console.log('\nTest 7: Messages query batching...');

assert(content.includes('batch'), 'Uses batching for messages query');
assert(content.includes('slice'), 'Uses slice for batch windows');

// ═══════════════════════════════════════════════════════════════
// Test 8: Route is registered in index.ts
// ═══════════════════════════════════════════════════════════════
console.log('\nTest 8: Route registered in index.ts...');

const indexContent = fs.readFileSync('src/index.ts', 'utf-8');

assert(
  indexContent.includes("import { dataExportRoutes } from './routes/dataExport'"),
  'dataExportRoutes imported in index.ts',
);
assert(
  indexContent.includes("app.use('/auth/export', authMiddleware)"),
  'Auth middleware applied to /auth/export',
);
assert(
  indexContent.includes("app.route('/auth', dataExportRoutes)"),
  'dataExportRoutes mounted in index.ts',
);

// ═══════════════════════════════════════════════════════════════
// Test 9: Mobile settings has download data button
// ═══════════════════════════════════════════════════════════════
console.log('\nTest 9: Mobile settings has Download My Data...');

const settingsContent = fs.readFileSync('../../apps/mobile/app/settings.tsx', 'utf-8');

assert(
  settingsContent.includes('handleDownloadData'),
  'Settings has handleDownloadData function',
);
assert(
  settingsContent.includes('Download My Data'),
  'Settings has "Download My Data" label',
);
assert(
  settingsContent.includes('/auth/export'),
  'Calls /auth/export endpoint',
);
assert(
  settingsContent.includes('expo-file-system'),
  'Uses expo-file-system to save file',
);

// ═══════════════════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════════════════
console.log('\n═══════════════════════════════════════════════════════════════');
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('═══════════════════════════════════════════════════════════════');

if (failed > 0) {
  process.exit(1);
}
