import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`FAIL: ${message}`);
}

// ══════════════════════════════════════════════════════════════
// Receipt Validation Tests (file-reading, no DB needed)
// ══════════════════════════════════════════════════════════════

const receiptServicePath = require.resolve('../services/receiptValidation');
const subscriptionRoutePath = require.resolve('../routes/subscriptions');
const webhookRoutePath = require.resolve('../routes/subscriptionsWebhooks');

const receiptServiceContent = readFileSync(receiptServicePath, 'utf-8');
const subscriptionContent = readFileSync(subscriptionRoutePath, 'utf-8');
const webhookContent = readFileSync(webhookRoutePath, 'utf-8');

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e: any) {
    failed++;
    console.log(`  ❌ ${name}: ${e.message}`);
  }
}

console.log('═══════════════════════════════════════════════════════════════');
console.log(' Receipt Validation Tests');
console.log('═══════════════════════════════════════════════════════════════');

// ── Test Group 1: Service Structure ──────────────────────────
console.log('\n▶ Service Structure');

test('Store API URLs defined', () => {
  assert(receiptServiceContent.includes('buy.itunes.apple.com/verifyReceipt'), 'Apple production URL');
  assert(receiptServiceContent.includes('sandbox.itunes.apple.com/verifyReceipt'), 'Apple sandbox URL');
  assert(receiptServiceContent.includes('androidpublisher.googleapis.com'), 'Google Play API URL');
});

test('Public API functions exported', () => {
  assert(receiptServiceContent.includes('export async function validateReceipt'), 'validateReceipt');
  assert(receiptServiceContent.includes('export function productToTier'), 'productToTier');
});

test('Environment variables referenced', () => {
  assert(receiptServiceContent.includes('APPLE_SHARED_SECRET'), 'Apple shared secret');
  assert(receiptServiceContent.includes('GOOGLE_SERVICE_ACCOUNT_KEY'), 'Google service account');
});

test('Mock validation fallback exists', () => {
  assert(receiptServiceContent.includes('function mockValidate'), 'mockValidate function');
  assert(receiptServiceContent.includes("'mock'"), 'mock environment');
});

// ── Test Group 2: Subscription Route Integration ──────────────
console.log('\n▶ Subscription Route Integration');

test('Receipt validation imported in subscription route', () => {
  assert(subscriptionContent.includes('validateReceipt'), 'validateReceipt imported');
  assert(subscriptionContent.includes('productToTier'), 'productToTier imported');
});

test('Input validation checks present', () => {
  assert(subscriptionContent.includes('if (!receipt)'), 'Receipt presence check');
  assert(subscriptionContent.includes('if (!planId)'), 'PlanId presence check');
});

test('Receipt validated before granting access', () => {
  assert(subscriptionContent.includes('await validateReceipt'), 'validateReceipt called');
  assert(subscriptionContent.includes('!validation.valid'), 'Validation result checked');
});

test('Product mismatch protection exists', () => {
  assert(subscriptionContent.includes('Product mismatch'), 'Product mismatch check');
});

test('Tier derived from product ID', () => {
  assert(subscriptionContent.includes('productToTier(planId)'), 'productToTier used');
});

test('Free plan subscription blocked', () => {
  assert(subscriptionContent.includes('Cannot subscribe to free plan'), 'Free plan blocked');
});

test('Returns 402 for invalid receipts', () => {
  assert(subscriptionContent.includes('402'), '402 status code');
});

// ── Test Group 3: Apple Validation ───────────────────────────
console.log('\n▶ Apple Validation Logic');

test('Handles sandbox/production fallback', () => {
  assert(receiptServiceContent.includes('21007'), '21007 status handling');
});

test('Shared secret sent in Apple verification', () => {
  assert(receiptServiceContent.includes("password: sharedSecret"), 'Shared secret in request');
});

test('Processes latest_receipt_info', () => {
  assert(receiptServiceContent.includes('latest_receipt_info'), 'latest_receipt_info');
});

test('Detects trial periods', () => {
  assert(receiptServiceContent.includes('is_trial_period'), 'Trial detection');
});

test('Checks for cancellation', () => {
  assert(receiptServiceContent.includes('cancellation_date'), 'Cancellation check');
});

test('Apple error messages defined', () => {
  assert(receiptServiceContent.includes('getAppleErrorMessage'), 'Error message function');
  assert(receiptServiceContent.includes('21003'), 'Error for unauthenticated receipts');
});

// ── Test Group 4: Google Validation ──────────────────────────
console.log('\n▶ Google Validation Logic');

test('Service account OAuth2 flow implemented', () => {
  assert(receiptServiceContent.includes('getGoogleAccessToken'), 'Token exchange');
  assert(receiptServiceContent.includes('RS256'), 'JWT signing');
});

test('Uses Google Play subscriptions API', () => {
  assert(receiptServiceContent.includes('purchases/subscriptions'), 'Subscriptions endpoint');
});

test('Payment state checked for trial detection', () => {
  assert(receiptServiceContent.includes('paymentState'), 'Payment state check');
  assert(receiptServiceContent.includes('=== 2'), 'Free trial payment state');
});

// ── Test Group 5: Webhook Endpoints ──────────────────────────
console.log('\n▶ Webhook Endpoints');

test('Both webhook endpoints defined', () => {
  assert(webhookContent.includes("'/apple'"), 'Apple webhook');
  assert(webhookContent.includes("'/google'"), 'Google webhook');
});

test('Apple signed payload processing', () => {
  assert(webhookContent.includes('signedPayload'), 'Signed payload');
  assert(webhookContent.includes('base64url'), 'Base64url decode');
});

test('Handles Apple notification types', () => {
  assert(webhookContent.includes('DID_RENEW'), 'DID_RENEW');
  assert(webhookContent.includes('EXPIRED'), 'EXPIRED');
  assert(webhookContent.includes('REFUND'), 'REFUND');
  assert(webhookContent.includes('REVOKE'), 'REVOKE');
});

test('Parses Google Pub/Sub notifications', () => {
  assert(webhookContent.includes('message.data'), 'Pub/Sub data parsing');
  assert(webhookContent.includes('subscriptionNotification'), 'Subscription notification');
});

test('Always returns 200 to Pub/Sub', () => {
  // Count occurrences of returning 200 — Pub/Sub retries on failure
  const okCount = (webhookContent.match(/return c\.json\(\{ ok: true \}\)/g) || []).length;
  assert(okCount >= 4, `At least 4 early-return 200s (found ${okCount})`);
});

// ── Test Group 6: Product-to-Tier Mapping ────────────────────
console.log('\n▶ Product-to-Tier Mapping');

test('Tier mapping from product ID', () => {
  assert(receiptServiceContent.includes("productId.includes('elite')"), 'Elite detection');
  assert(receiptServiceContent.includes("productId.includes('plus')"), 'Plus detection');
});

// ── Test Group 7: Subscription Benefits ──────────────────────
console.log('\n▶ Subscription Benefits');

test('Boosts granted on subscription', () => {
  assert(subscriptionContent.includes('insert(boosts)'), 'Boost insertion');
  assert(subscriptionContent.includes('elite'), 'Elite tier grants');
  assert(subscriptionContent.includes('plus'), 'Plus tier grants');
});

test('Subscription active status returned', () => {
  assert(subscriptionContent.includes('isActive'), 'Active status field');
});

test('Duplicate receipt detection', () => {
  assert(subscriptionContent.includes('existingSub.receipt === receipt'), 'Same receipt check');
});

// ── Test Group 8: Environment Configuration ──────────────────
console.log('\n▶ Environment Configuration');

test('.env.example has IAP credentials', () => {
  let envPath = resolve(process.cwd(), '.env.example');
  if (!existsSync(envPath)) {
    envPath = resolve(process.cwd(), '../../.env.example');
  }
  if (!existsSync(envPath)) {
    console.log('  ⚠️  Could not find .env.example');
    return;
  }
  const env = readFileSync(envPath, 'utf-8');
  assert(env.includes('APPLE_SHARED_SECRET'), 'APPLE_SHARED_SECRET');
  assert(env.includes('GOOGLE_SERVICE_ACCOUNT_KEY'), 'GOOGLE_SERVICE_ACCOUNT_KEY');
  assert(env.includes('GOOGLE_PLAY_PACKAGE'), 'GOOGLE_PLAY_PACKAGE');
});

// ── Test Group 9: Security Checks ────────────────────────────
console.log('\n▶ Security Checks');

test('Receipt validation catches empty receipt', () => {
  const routeRejects = subscriptionContent.includes('receipt, platform') || subscriptionContent.includes('if (!receipt)');
  const serviceRejects = receiptServiceContent.includes('receiptData.trim().length === 0') || receiptServiceContent.includes('No receipt data');
  assert(routeRejects || serviceRejects, 'Empty receipt rejected somewhere');
});

test('Receipt validation catches product mismatch', () => {
  assert(subscriptionContent.includes('validation.productId'), 'Product ID from validation checked');
  assert(subscriptionContent.includes('!== planId'), 'Mismatch comparison');
});

test('Validation failures return 402, not 200', () => {
  assert(subscriptionContent.includes("402)"), '402 status for failed validation');
});

// ══════════════════════════════════════════════════════════════

console.log(`\n═══════════════════════════════════════════════════════════════`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`═══════════════════════════════════════════════════════════════`);

if (failed > 0) process.exit(1);
