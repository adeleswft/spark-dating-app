/**
 * Receipt validation service for Apple App Store and Google Play Store.
 *
 * In development (no credentials configured), falls back to mock validation
 * so the flow can be exercised end-to-end without real store credentials.
 */

const APPLE_VERIFY_URL = 'https://buy.itunes.apple.com/verifyReceipt';
const APPLE_SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt';
const GOOGLE_PLAY_API = 'https://androidpublisher.googleapis.com/androidpublisher/v3';

// ── Types ─────────────────────────────────────────────────────────

export interface ReceiptValidationResult {
  valid: boolean;
  platform: 'ios' | 'android';
  productId: string;
  transactionId: string;
  originalTransactionId: string;
  purchaseDate: number;
  expiresAt: number | null;
  isTrial: boolean;
  isCanceled: boolean;
  environment: 'production' | 'sandbox' | 'mock' | 'unknown';
  /** Raw receipt info for storage */
  receiptData: Record<string, any>;
  /** Human-readable error if invalid */
  error?: string;
}

interface AppleReceiptResponse {
  status: number;
  receipt?: {
    bundle_id: string;
    in_app: Array<{
      product_id: string;
      transaction_id: string;
      original_transaction_id: string;
      purchase_date_ms: string;
      expires_date_ms?: string;
      is_trial_period: string;
      cancellation_date?: string;
    }>;
  };
  latest_receipt_info?: Array<{
    product_id: string;
    transaction_id: string;
    original_transaction_id: string;
    purchase_date_ms: string;
    expires_date_ms?: string;
    is_trial_period: string;
    cancellation_date?: string;
  }>;
}

interface GooglePurchaseResponse {
  startTimeMillis: string;
  endTimeMillis: string;
  autoRenewing: boolean;
  priceCurrencyCode: string;
  priceAmountMicros: string;
  countryCode: string;
  paymentState: number; // 0=payment pending, 1=active, 2=free trial, 3=payment deferred
  cancellationTimeMillis?: string;
  orderId: string;
  packageName: string;
  purchaseType?: number; // 0=test, 1=promo, 2=reward
}

// ── Apple Validation ──────────────────────────────────────────────

async function validateAppleReceipt(
  receiptData: string,
  isProduction: boolean = false,
): Promise<ReceiptValidationResult> {
  const sharedSecret = process.env.APPLE_SHARED_SECRET;

  // Mock validation if no credentials (same as Google)
  if (!sharedSecret) {
    const productId = 'unknown';
    return mockValidate('ios', productId, receiptData);
  }

  // Try production first, fall back to sandbox if status 21007
  const urls = isProduction
    ? [APPLE_VERIFY_URL, APPLE_SANDBOX_URL]
    : [APPLE_SANDBOX_URL, APPLE_VERIFY_URL];

  for (const url of urls) {
    try {
      const body: Record<string, any> = {
        'receipt-data': receiptData,
        password: sharedSecret || '',
        'exclude-old-transactions': true,
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10_000),
      });

      const data = (await res.json()) as AppleReceiptResponse;

      // 21007 = receipt is sandbox, try next URL
      if (data.status === 21007 && url !== urls[urls.length - 1]) continue;

      // 0 = valid
      if (data.status !== 0) {
        return {
          valid: false,
          platform: 'ios',
          productId: '',
          transactionId: '',
          originalTransactionId: '',
          purchaseDate: 0,
          expiresAt: null,
          isTrial: false,
          isCanceled: false,
          environment: 'unknown',
          receiptData: { status: data.status },
          error: getAppleErrorMessage(data.status),
        };
      }

      // Extract the latest subscription transaction
      const latestReceipts = data.latest_receipt_info || data.receipt?.in_app || [];
      if (latestReceipts.length === 0) {
        return {
          valid: false,
          platform: 'ios',
          productId: '',
          transactionId: '',
          originalTransactionId: '',
          purchaseDate: 0,
          expiresAt: null,
          isTrial: false,
          isCanceled: false,
          environment: url === APPLE_SANDBOX_URL ? 'sandbox' : 'production',
          receiptData: data,
          error: 'No receipts found',
        };
      }

      // Get the most recent transaction
      const latest = latestReceipts.sort(
        (a, b) => parseInt(b.purchase_date_ms) - parseInt(a.purchase_date_ms),
      )[0];

      const expiresDateMs = latest.expires_date_ms
        ? parseInt(latest.expires_date_ms)
        : null;
      const now = Date.now();

      // Check if subscription has expired
      const isExpired = expiresDateMs !== null && expiresDateMs < now;
      const isCanceled = !!latest.cancellation_date;

      return {
        valid: !isExpired && !isCanceled,
        platform: 'ios',
        productId: latest.product_id,
        transactionId: latest.transaction_id,
        originalTransactionId: latest.original_transaction_id,
        purchaseDate: parseInt(latest.purchase_date_ms),
        expiresAt: expiresDateMs,
        isTrial: latest.is_trial_period === 'true',
        isCanceled,
        environment: url === APPLE_SANDBOX_URL ? 'sandbox' : 'production',
        receiptData: {
          status: data.status,
          latestReceipt: latest,
          bundleId: data.receipt?.bundle_id,
        },
      };
    } catch (err: any) {
      // If this was the last URL, return error
      if (url === urls[urls.length - 1]) {
        return {
          valid: false,
          platform: 'ios',
          productId: '',
          transactionId: '',
          originalTransactionId: '',
          purchaseDate: 0,
          expiresAt: null,
          isTrial: false,
          isCanceled: false,
          environment: 'unknown',
          receiptData: {},
          error: `Apple API error: ${err?.message || 'Unknown'}`,
        };
      }
    }
  }

  // Should never reach here, but TypeScript needs it
  return {
    valid: false,
    platform: 'ios',
    productId: '',
    transactionId: '',
    originalTransactionId: '',
    purchaseDate: 0,
    expiresAt: null,
    isTrial: false,
    isCanceled: false,
    environment: 'unknown',
    receiptData: {},
    error: 'Validation failed',
  };
}

function getAppleErrorMessage(status: number): string {
  const errors: Record<number, string> = {
    21000: 'The request to the App Store was not valid',
    21002: 'The data in the receipt-data property was malformed',
    21003: 'The receipt could not be authenticated',
    21004: 'Shared secret is not configured',
    21005: 'The receipt server was unavailable',
    21006: 'The receipt is valid but has expired',
    21007: 'This receipt is from the sandbox environment',
    21008: 'This receipt is from the production environment',
    21010: 'This receipt could not be authorized',
  };
  return errors[status] || `Apple error status ${status}`;
}

// ── Google Validation ─────────────────────────────────────────────

async function validateGoogleReceipt(
  packageName: string,
  productId: string,
  purchaseToken: string,
): Promise<ReceiptValidationResult> {
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  // Mock validation if no credentials
  if (!serviceAccountKey) {
    return mockValidate('android', productId, purchaseToken);
  }

  try {
    // Get OAuth2 access token using service account
    const accessToken = await getGoogleAccessToken(serviceAccountKey);

    // Verify subscription
    const url = `${GOOGLE_PLAY_API}/applications/${packageName}/purchases/subscriptions/${purchaseToken}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return {
        valid: false,
        platform: 'android',
        productId,
        transactionId: purchaseToken,
        originalTransactionId: purchaseToken,
        purchaseDate: 0,
        expiresAt: null,
        isTrial: false,
        isCanceled: false,
        environment: 'production',
        receiptData: { httpStatus: res.status, error: errorText },
        error: `Google Play API error: ${res.status}`,
      };
    }

    const data = (await res.json()) as GooglePurchaseResponse;

    const expiresAt = parseInt(data.endTimeMillis);
    const now = Date.now();
    const isCanceled = !!data.cancellationTimeMillis;

    return {
      valid: !isCanceled && expiresAt > now,
      platform: 'android',
      productId,
      transactionId: data.orderId,
      originalTransactionId: data.orderId,
      purchaseDate: parseInt(data.startTimeMillis),
      expiresAt,
      isTrial: data.paymentState === 2,
      isCanceled,
      environment: data.purchaseType === 0 ? 'sandbox' : 'production',
      receiptData: data,
    };
  } catch (err: any) {
    return {
      valid: false,
      platform: 'android',
      productId,
      transactionId: purchaseToken,
      originalTransactionId: purchaseToken,
      purchaseDate: 0,
      expiresAt: null,
      isTrial: false,
      isCanceled: false,
      environment: 'production',
      receiptData: {},
      error: `Google validation error: ${err?.message || 'Unknown'}`,
    };
  }
}

/**
 * Exchange a Google service account JWT for an OAuth2 access token.
 */
async function getGoogleAccessToken(serviceAccountKey: string): Promise<string> {
  // serviceAccountKey should be a JSON string of the service account credentials
  const credentials = JSON.parse(serviceAccountKey);

  // Create a JWT for Google OAuth2
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  // Sign with the private key
  const crypto = await import('crypto');
  const headerBase64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signingInput = `${headerBase64}.${payloadBase64}`;

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signingInput);
  const signature = sign.sign(credentials.private_key, 'base64url');
  const jwt = `${signingInput}.${signature}`;

  // Exchange JWT for access token
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error('Failed to get Google access token');
  }

  return data.access_token;
}

// ── Mock Validation ───────────────────────────────────────────────

function mockValidate(
  platform: 'ios' | 'android',
  productId: string,
  receiptOrToken: string,
): ReceiptValidationResult {
  // In dev mode, accept any receipt and grant 30 days
  const now = Date.now();
  const expiresAt = now + 30 * 24 * 60 * 60 * 1000;

  console.log(`[Receipt] Mock validation for ${platform}: ${productId}`);
  console.log(`[Receipt] Granting 30-day access (dev mode)`);

  return {
    valid: true,
    platform,
    productId,
    transactionId: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    originalTransactionId: `mock-orig-${Date.now()}`,
    purchaseDate: now,
    expiresAt,
    isTrial: false,
    isCanceled: false,
    environment: 'mock',
    receiptData: { mock: true },
  };
}

// ── Public API ────────────────────────────────────────────────────

/**
 * Validate a receipt from either platform.
 *
 * @param platform - 'ios' or 'android'
 * @param receiptData - The raw receipt data (base64 for iOS, purchase token for Android)
 * @param options - Platform-specific options (packageName, productId for Android)
 */
export async function validateReceipt(
  platform: 'ios' | 'android',
  receiptData: string,
  options: { packageName?: string; productId?: string } = {},
): Promise<ReceiptValidationResult> {
  if (!receiptData || receiptData.trim().length === 0) {
    return {
      valid: false,
      platform,
      productId: '',
      transactionId: '',
      originalTransactionId: '',
      purchaseDate: 0,
      expiresAt: null,
      isTrial: false,
      isCanceled: false,
      environment: 'unknown',
      receiptData: {},
      error: 'No receipt data provided',
    };
  }

  const isProduction = process.env.NODE_ENV === 'production';

  if (platform === 'ios') {
    return validateAppleReceipt(receiptData, isProduction);
  }

  if (platform === 'android') {
    const packageName = options.packageName || 'com.spark.dating';
    const productId = options.productId || '';
    return validateGoogleReceipt(packageName, productId, receiptData);
  }

  return {
    valid: false,
    platform,
    productId: '',
    transactionId: '',
    originalTransactionId: '',
    purchaseDate: 0,
    expiresAt: null,
    isTrial: false,
    isCanceled: false,
    environment: 'unknown',
    receiptData: {},
    error: `Unsupported platform: ${platform}`,
  };
}

/**
 * Map a product ID to our internal subscription tier.
 */
export function productToTier(productId: string): 'free' | 'plus' | 'elite' {
  if (productId.includes('elite')) return 'elite';
  if (productId.includes('plus')) return 'plus';
  return 'free';
}

/**
 * Determine platform from product ID prefix or explicit platform.
 */
export function detectPlatform(productId: string): 'ios' | 'android' {
  // Both iOS and Android use the same product ID format in our app
  // Platform is determined by what the client sends
  return 'ios'; // Default, overridden by client
}
