/**
 * Stripe payment routes.
 *
 * Handles checkout session creation, subscription management,
 * and payment status queries.
 */

import { Hono } from 'hono';
import { db } from '../db';
import { subscriptions } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import {
  createCheckoutSession,
  createPaymentSession,
  getSubscriptionStatus,
  cancelSubscription,
  isStripeConfigured,
  getPublishableKey,
} from '../services/stripe';

export const stripeRoutes = new Hono();

// ── Configuration ─────────────────────────────────────────────────

/**
 * GET /stripe/config
 * Get Stripe configuration for the client.
 */
stripeRoutes.get('/config', (c) => {
  return c.json({
    configured: isStripeConfigured(),
    publishableKey: getPublishableKey(),
  });
});

// ── Checkout Sessions ─────────────────────────────────────────────

/**
 * POST /stripe/checkout/subscription
 * Create a Stripe Checkout session for a subscription.
 */
stripeRoutes.post('/checkout/subscription', async (c: any) => {
  const userId = c.get('userId');
  const { tier, interval } = await c.req.json();

  if (!tier || !['plus', 'elite'].includes(tier)) {
    return c.json({ error: 'Invalid tier. Must be "plus" or "elite"' }, 400);
  }

  if (!interval || !['monthly', 'yearly'].includes(interval)) {
    return c.json({ error: 'Invalid interval. Must be "monthly" or "yearly"' }, 400);
  }

  // Get user email from the database
  const user = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  });

  // For now, use a placeholder email — in production, get from auth
  const email = `${userId}@spark.dating`;

  const baseUrl = process.env.APP_URL || 'https://spark.dating';
  const successUrl = `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${baseUrl}/subscription/cancel`;

  try {
    const session = await createCheckoutSession(
      userId,
      email,
      tier as 'plus' | 'elite',
      interval as 'monthly' | 'yearly',
      successUrl,
      cancelUrl,
    );

    return c.json({
      sessionId: session.sessionId,
      url: session.url,
      mode: session.mode,
    });
  } catch (err: any) {
    console.error('[Stripe] Failed to create checkout session:', err);
    return c.json({ error: 'Failed to create checkout session' }, 500);
  }
});

/**
 * POST /stripe/checkout/payment
 * Create a Stripe Checkout session for a one-time payment (e.g., boost).
 */
stripeRoutes.post('/checkout/payment', async (c: any) => {
  const userId = c.get('userId');
  const { productId, amount, currency } = await c.req.json();

  if (!productId) {
    return c.json({ error: 'productId is required' }, 400);
  }

  if (!amount || amount <= 0) {
    return c.json({ error: 'Valid amount is required' }, 400);
  }

  const email = `${userId}@spark.dating`;
  const baseUrl = process.env.APP_URL || 'https://spark.dating';
  const successUrl = `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${baseUrl}/payment/cancel`;

  try {
    const session = await createPaymentSession(
      userId,
      email,
      productId,
      amount,
      currency || 'usd',
      successUrl,
      cancelUrl,
    );

    return c.json({
      sessionId: session.sessionId,
      url: session.url,
      mode: session.mode,
    });
  } catch (err: any) {
    console.error('[Stripe] Failed to create payment session:', err);
    return c.json({ error: 'Failed to create payment session' }, 500);
  }
});

// ── Subscription Management ───────────────────────────────────────

/**
 * GET /stripe/subscription
 * Get the current subscription status.
 */
stripeRoutes.get('/subscription', async (c: any) => {
  const userId = c.get('userId');

  // Check local database first
  const localSub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
    orderBy: (s, { desc }) => [desc(s.createdAt)],
  });

  // If we have a Stripe subscription, check with Stripe directly
  if (localSub?.platform === 'stripe' && localSub?.receipt) {
    const status = await getSubscriptionStatus(userId);
    return c.json({
      subscription: {
        ...localSub,
        isActive: status.active,
        cancelAtPeriodEnd: status.cancelAtPeriodEnd,
        stripeStatus: status.status,
      },
    });
  }

  // Fall back to local database
  const isActive = localSub?.expiresAt
    ? new Date(localSub.expiresAt) > new Date()
    : false;

  return c.json({
    subscription: localSub
      ? { ...localSub, isActive }
      : { tier: 'free', expiresAt: null, isActive: false },
  });
});

/**
 * POST /stripe/subscription/cancel
 * Cancel the current subscription.
 */
stripeRoutes.post('/subscription/cancel', async (c: any) => {
  const userId = c.get('userId');
  const { immediate } = await c.req.json().catch(() => ({})) as { immediate?: boolean };

  const result = await cancelSubscription(userId, immediate);

  // Also update local database
  if (result.success) {
    await db
      .update(subscriptions)
      .set({
        expiresAt: immediate ? new Date() : undefined,
      })
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.platform, 'stripe'),
        ),
      );
  }

  return c.json(result);
});

/**
 * GET /stripe/portal
 * Create a Stripe Billing Portal session for self-service management.
 */
stripeRoutes.get('/portal', async (c: any) => {
  const userId = c.get('userId');
  const baseUrl = process.env.APP_URL || 'https://spark.dating';

  // Check Stripe is configured
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return c.json({ url: `${baseUrl}/subscription/manage`, message: 'Billing portal — configure STRIPE_SECRET_KEY to enable' });
  }

  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(key, { apiVersion: '2024-12-18.acacia' as any });

  // Find the Stripe customer for this user
  const customers = await stripe.customers.list({ limit: 100 });
  const customer = customers.data.find((c) => c.metadata?.userId === userId);

  if (!customer) {
    return c.json({ error: 'No billing account found' }, 404);
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customer.id,
    return_url: `${baseUrl}/subscription/manage`,
  });

  return c.json({ url: session.url });
});
