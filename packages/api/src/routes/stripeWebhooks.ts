/**
 * Stripe webhook endpoint.
 *
 * Receives payment events from Stripe and updates subscription state.
 * This route must be mounted WITHOUT auth middleware — Stripe calls it directly.
 */

import { Hono } from 'hono';
import { db } from '../db';
import { subscriptions, boosts } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import {
  constructWebhookEvent,
  handleWebhookEvent,
  isStripeConfigured,
  getPublishableKey,
} from '../services/stripe';
import type Stripe from 'stripe';

export const stripeWebhookRoutes = new Hono();

// ── Webhook Endpoint ──────────────────────────────────────────────

/**
 * POST /stripe/webhooks
 *
 * Stripe sends events to this endpoint. We verify the signature
 * and process the event.
 *
 * Important: This endpoint must NOT have auth middleware.
 * Stripe calls it directly with its own signature.
 */
stripeWebhookRoutes.post('/', async (c) => {
  try {
    const body = await c.req.text();
    const signature = c.req.header('stripe-signature') || '';

    if (!body) {
      return c.json({ error: 'Empty body' }, 400);
    }

    // Verify and parse the event
    const event = constructWebhookEvent(body, signature);

    if (!event) {
      console.error('[Stripe Webhook] Failed to verify event');
      return c.json({ error: 'Invalid signature' }, 400);
    }

    console.log(`[Stripe Webhook] Received: ${event.type} (${event.id})`);

    // Process the event
    await processStripeEvent(event);

    return c.json({ received: true });
  } catch (err: any) {
    console.error('[Stripe Webhook] Error:', err);
    return c.json({ error: 'Webhook handler failed' }, 500);
  }
});

// ── Event Processing ──────────────────────────────────────────────

async function processStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const tier = session.metadata?.tier;

      if (!userId || !tier) {
        console.log('[Stripe] Checkout completed without metadata, skipping');
        return;
      }

      // The subscription is created by the next event (customer.subscription.created)
      // We just log it here
      console.log(`[Stripe] Checkout session completed for user ${userId}, tier ${tier}`);
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      const tier = subscription.metadata?.tier || 'plus';

      if (!userId) {
        console.log('[Stripe] Subscription event without userId, skipping');
        return;
      }

      const isActive = subscription.status === 'active' || subscription.status === 'trialing';
      const expiresAt = new Date((subscription as any).current_period_end * 1000);

      // Find existing subscription
      const existingSub = await db.query.subscriptions.findFirst({
        where: and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.platform, 'stripe'),
        ),
      });

      if (existingSub) {
        // Update existing
        await db
          .update(subscriptions)
          .set({
            tier: tier as any,
            expiresAt,
            receipt: subscription.id,
          })
          .where(eq(subscriptions.id, existingSub.id));
      } else {
        // Create new
        await db.insert(subscriptions).values({
          userId,
          tier: tier as any,
          platform: 'stripe',
          receipt: subscription.id,
          originalTransactionId: subscription.id,
          expiresAt,
        });
      }

      // Grant boosts for new subscriptions
      if (event.type === 'customer.subscription.created') {
        if (tier === 'plus') {
          await db.insert(boosts).values({
            userId,
            activatedAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          });
        } else if (tier === 'elite') {
          for (let i = 0; i < 3; i++) {
            await db.insert(boosts).values({
              userId,
              activatedAt: new Date(),
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            });
          }
        }
      }

      console.log(`[Stripe] Subscription ${event.type}: user ${userId}, tier ${tier}, active ${isActive}`);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;

      if (!userId) return;

      // Mark subscription as expired
      await db
        .update(subscriptions)
        .set({ expiresAt: new Date() })
        .where(
          and(
            eq(subscriptions.userId, userId),
            eq(subscriptions.platform, 'stripe'),
            eq(subscriptions.receipt, subscription.id),
          ),
        );

      console.log(`[Stripe] Subscription deleted: user ${userId}`);
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as any;
      const subscriptionId = invoice.subscription;

      if (typeof subscriptionId === 'string') {
        // Payment succeeded — the subscription is still active
        console.log(`[Stripe] Payment succeeded for subscription ${subscriptionId}`);
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as any;
      const subscriptionId = invoice.subscription;

      if (typeof subscriptionId === 'string') {
        // Payment failed — the subscription may enter grace period
        console.log(`[Stripe] Payment failed for subscription ${subscriptionId}`);
      }
      break;
    }

    case 'charge.refunded': {
      const charge = event.data.object as any;
      const invoiceId = charge.invoice;

      if (typeof invoiceId === 'string') {
        // Refund issued — find the subscription and expire it
        console.log(`[Stripe] Refund issued for charge ${charge.id}`);
      }
      break;
    }

    default:
      console.log(`[Stripe] Unhandled event: ${event.type}`);
  }
}

// ── Utility Endpoints ─────────────────────────────────────────────

/**
 * GET /stripe/webhooks/health
 * Check if Stripe webhooks are configured.
 */
stripeWebhookRoutes.get('/health', (c) => {
  return c.json({
    configured: isStripeConfigured(),
    publishableKey: getPublishableKey() ? '***' : '',
  });
});
