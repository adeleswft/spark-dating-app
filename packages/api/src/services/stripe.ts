/**
 * Stripe payment processing service.
 *
 * Handles checkout sessions, subscription management, and webhook verification.
 * Falls back to mock mode when STRIPE_SECRET_KEY is not configured.
 */

import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

function getStripe(): Stripe | null {
  if (stripeClient) return stripeClient;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.log('[Stripe] No STRIPE_SECRET_KEY configured — running in mock mode');
    return null;
  }

  stripeClient = new Stripe(key, {
    apiVersion: '2024-12-18.acacia' as any,
    typescript: true,
  });

  return stripeClient;
}

// ── Types ─────────────────────────────────────────────────────────

export interface CheckoutSessionResult {
  sessionId: string;
  url: string;
  mode: 'subscription' | 'payment';
}

export interface SubscriptionStatusResult {
  active: boolean;
  subscriptionId: string | null;
  status: string;
  currentPeriodEnd: number | null;
  plan: string;
  cancelAtPeriodEnd: boolean;
}

// ── Price ID Mapping ──────────────────────────────────────────────

const PRICE_MAP: Record<string, { monthly: string; yearly: string }> = {
  plus: {
    monthly: process.env.STRIPE_PRICE_PLUS_MONTHLY || 'price_plus_monthly',
    yearly: process.env.STRIPE_PRICE_PLUS_YEARLY || 'price_plus_yearly',
  },
  elite: {
    monthly: process.env.STRIPE_PRICE_ELITE_MONTHLY || 'price_elite_monthly',
    yearly: process.env.STRIPE_PRICE_ELITE_YEARLY || 'price_elite_yearly',
  },
};

// ── Checkout Sessions ─────────────────────────────────────────────

/**
 * Create a Stripe Checkout session for subscription purchase.
 */
export async function createCheckoutSession(
  userId: string,
  email: string,
  tier: 'plus' | 'elite',
  interval: 'monthly' | 'yearly',
  successUrl: string,
  cancelUrl: string,
): Promise<CheckoutSessionResult> {
  const stripe = getStripe();

  if (!stripe) {
    // Mock mode — return a fake session
    const mockSessionId = `cs_mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return {
      sessionId: mockSessionId,
      url: `${successUrl}?session_id=${mockSessionId}&mock=true`,
      mode: 'subscription',
    };
  }

  const priceId = PRICE_MAP[tier]?.[interval];
  if (!priceId) {
    throw new Error(`No price configured for ${tier} ${interval}`);
  }

  // Find or create Stripe customer
  const customer = await findOrCreateCustomer(stripe, userId, email);

  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      tier,
      interval,
    },
    subscription_data: {
      metadata: {
        userId,
        tier,
      },
      trial_period_days: tier === 'elite' ? 7 : undefined,
    },
    allow_promotion_codes: true,
  });

  return {
    sessionId: session.id,
    url: session.url!,
    mode: 'subscription',
  };
}

/**
 * Create a Stripe Checkout session for one-time payment (e.g., boost purchase).
 */
export async function createPaymentSession(
  userId: string,
  email: string,
  productId: string,
  amount: number,
  currency: string,
  successUrl: string,
  cancelUrl: string,
): Promise<CheckoutSessionResult> {
  const stripe = getStripe();

  if (!stripe) {
    const mockSessionId = `cs_mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return {
      sessionId: mockSessionId,
      url: `${successUrl}?session_id=${mockSessionId}&mock=true`,
      mode: 'payment',
    };
  }

  const customer = await findOrCreateCustomer(stripe, userId, email);

  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: productId,
            metadata: { productId },
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      productId,
      type: 'one_time',
    },
  });

  return {
    sessionId: session.id,
    url: session.url!,
    mode: 'payment',
  };
}

// ── Subscription Management ───────────────────────────────────────

/**
 * Get the current subscription status for a Stripe customer.
 */
export async function getSubscriptionStatus(
  userId: string,
): Promise<SubscriptionStatusResult> {
  const stripe = getStripe();

  if (!stripe) {
    return {
      active: false,
      subscriptionId: null,
      status: 'inactive',
      currentPeriodEnd: null,
      plan: 'free',
      cancelAtPeriodEnd: false,
    };
  }

  // Find customer by userId metadata
  const customers = await stripe.customers.list({
    limit: 100,
  });

  // Find customer by userId in metadata
  const customer = customers.data.find(c => c.metadata?.userId === userId);

  if (!customer) {
    return {
      active: false,
      subscriptionId: null,
      status: 'inactive',
      currentPeriodEnd: null,
      plan: 'free',
      cancelAtPeriodEnd: false,
    };
  }

  // Get active subscriptions
  const subscriptions = await stripe.subscriptions.list({
    customer: customer.id,
    status: 'active',
    limit: 1,
  });

  if (subscriptions.data.length === 0) {
    return {
      active: false,
      subscriptionId: null,
      status: 'inactive',
      currentPeriodEnd: null,
      plan: 'free',
      cancelAtPeriodEnd: false,
    };
  }

  const sub = subscriptions.data[0];
  const tier = sub.metadata?.tier || 'plus';
  const periodEnd = (sub as any).current_period_end;

  return {
    active: sub.status === 'active',
    subscriptionId: sub.id,
    status: sub.status,
    currentPeriodEnd: periodEnd ? periodEnd * 1000 : null,
    plan: tier,
    cancelAtPeriodEnd: sub.cancel_at_period_end || false,
  };
}

/**
 * Cancel a Stripe subscription (at period end or immediately).
 */
export async function cancelSubscription(
  userId: string,
  immediate: boolean = false,
): Promise<{ success: boolean; message: string }> {
  const stripe = getStripe();

  if (!stripe) {
    return { success: true, message: 'Subscription cancelled (mock mode)' };
  }

  const customers = await stripe.customers.list({
    limit: 100,
  });

  const customer = customers.data.find(c => c.metadata?.userId === userId);
  if (!customer) {
    return { success: false, message: 'No Stripe customer found' };
  }

  const subscriptions = await stripe.subscriptions.list({
    customer: customer.id,
    status: 'active',
    limit: 1,
  });

  if (subscriptions.data.length === 0) {
    return { success: false, message: 'No active subscription found' };
  }

  const sub = subscriptions.data[0];

  if (immediate) {
    await stripe.subscriptions.cancel(sub.id);
    return { success: true, message: 'Subscription cancelled immediately' };
  } else {
    await stripe.subscriptions.update(sub.id, {
      cancel_at_period_end: true,
    });
    return {
      success: true,
      message: 'Subscription will cancel at the end of the billing period',
    };
  }
}

// ── Webhook Handling ──────────────────────────────────────────────

/**
 * Verify and parse a Stripe webhook event.
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
): Stripe.Event | null {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    console.log('[Stripe] Webhook verification skipped (no key/secret configured)');
    // In mock mode, parse the payload directly
    try {
      return JSON.parse(typeof payload === 'string' ? payload : payload.toString()) as Stripe.Event;
    } catch {
      return null;
    }
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err: any) {
    console.error(`[Stripe] Webhook signature verification failed: ${err.message}`);
    return null;
  }
}

/**
 * Process a verified Stripe webhook event.
 */
export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(`[Stripe] Checkout completed: ${session.id}`);
      // Subscription creation is handled by customer.subscription.created
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata.userId;
      const tier = subscription.metadata.tier || 'plus';

      console.log(`[Stripe] Subscription ${event.type}: ${subscription.id} for user ${userId}`);

      // The subscription route handler will process this
      // We emit a synthetic receipt validation result
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata.userId;

      console.log(`[Stripe] Subscription deleted: ${subscription.id} for user ${userId}`);
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      console.log(`[Stripe] Payment succeeded: ${invoice.id}`);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      console.log(`[Stripe] Payment failed: ${invoice.id}`);
      break;
    }

    default:
      console.log(`[Stripe] Unhandled event type: ${event.type}`);
  }
}

// ── Helpers ───────────────────────────────────────────────────────

async function findOrCreateCustomer(
  stripe: Stripe,
  userId: string,
  email: string,
): Promise<Stripe.Customer> {
  // Search by userId in metadata
  const existing = await stripe.customers.list({
    limit: 100,
  });

  const customer = existing.data.find(c => c.metadata?.userId === userId);
  if (customer) {
    return customer;
  }

  // Create new customer
  return stripe.customers.create({
    email,
    metadata: { userId },
  });
}

/**
 * Check if Stripe is configured (not in mock mode).
 */
export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

/**
 * Get the Stripe publishable key for client-side use.
 */
export function getPublishableKey(): string {
  return process.env.STRIPE_PUBLISHABLE_KEY || '';
}
