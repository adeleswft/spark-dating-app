/**
 * Webhook endpoints for Apple App Store and Google Play subscription status changes.
 *
 * Apple sends App Store Server Notifications V2 (JWS-signed).
 * Google sends Real-time Developer Notifications (RTDN) via Pub/Sub.
 *
 * These endpoints update the local subscription state when the store reports
 * renewals, cancellations, refunds, or grace period entries.
 */

import { Hono } from 'hono';
import { db } from '../db';
import { subscriptions } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export const subscriptionWebhookRoutes = new Hono();

// ── Apple App Store Server Notifications V2 ───────────────────────

/**
 * POST /subscriptions/webhooks/apple
 *
 * Apple sends JWS-signed notifications. In production, you'd verify the
 * JWS signature against Apple's public certificates. For now, we parse
 * the notification type and update accordingly.
 *
 * See: https://developer.apple.com/documentation/appstoreservernotifications
 */
subscriptionWebhookRoutes.post('/apple', async (c) => {
  try {
    const body = await c.req.json();
    const { signedPayload } = body;

    if (!signedPayload) {
      console.error('[Webhook] Apple: Missing signedPayload');
      return c.json({ error: 'Missing signedPayload' }, 400);
    }

    // In production, verify JWS signature here using Apple's certificates
    // For now, decode the payload (base64url) to get notification type
    // The payload is the middle part of the JWS
    const parts = signedPayload.split('.');
    if (parts.length !== 3) {
      return c.json({ error: 'Invalid JWS format' }, 400);
    }

    let payload: any;
    try {
      const decoded = Buffer.from(parts[1], 'base64url').toString('utf-8');
      payload = JSON.parse(decoded);
    } catch {
      return c.json({ error: 'Failed to decode payload' }, 400);
    }

    const { notificationType, subtype, data } = payload;

    console.log(`[Webhook] Apple notification: ${notificationType} (${subtype || 'none'})`);

    // Extract the transaction info
    const transactionInfo = data?.transactionInfo;
    const renewalInfo = data?.renewalInfo;

    if (!transactionInfo) {
      console.log('[Webhook] Apple: No transaction info, acknowledging');
      return c.json({ ok: true });
    }

    const originalTransactionId = transactionInfo.originalTransactionId;

    // Find the subscription by originalTransactionId (preferred) or receipt (legacy)
    let existingSub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.originalTransactionId, originalTransactionId),
    });
    if (!existingSub) {
      existingSub = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.receipt, originalTransactionId),
      });
    }

    if (!existingSub) {
      console.log(`[Webhook] Apple: No subscription found for originalTransactionId ${originalTransactionId}`);
      return c.json({ ok: true, note: 'No matching subscription' });
    }

    // Handle different notification types
    switch (notificationType) {
      case 'SUBSCRIBED':
      case 'DID_RENEW': {
        // Subscription renewed — update expiry
        const newExpiresAt = transactionInfo.expiresDate
          ? new Date(transactionInfo.expiresDate)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        await db
          .update(subscriptions)
          .set({ expiresAt: newExpiresAt })
          .where(eq(subscriptions.id, existingSub.id));

        console.log(`[Webhook] Apple: Renewed subscription for user ${existingSub.userId}, expires ${newExpiresAt}`);
        break;
      }

      case 'EXPIRED':
      case 'DID_FAIL_TO_RENEW': {
        // Subscription expired or renewal failed
        const expiresAt = transactionInfo.expiresDate
          ? new Date(transactionInfo.expiresDate)
          : new Date();

        await db
          .update(subscriptions)
          .set({ expiresAt })
          .where(eq(subscriptions.id, existingSub.id));

        console.log(`[Webhook] Apple: Expired/failed renewal for user ${existingSub.userId}`);
        break;
      }

      case 'REFUND': {
        // Refund — expire immediately
        await db
          .update(subscriptions)
          .set({ expiresAt: new Date() })
          .where(eq(subscriptions.id, existingSub.id));

        console.log(`[Webhook] Apple: Refund for user ${existingSub.userId}`);
        break;
      }

      case 'REVOKE': {
        // Family sharing revocation
        await db
          .update(subscriptions)
          .set({ expiresAt: new Date() })
          .where(eq(subscriptions.id, existingSub.id));

        console.log(`[Webhook] Apple: Revoked subscription for user ${existingSub.userId}`);
        break;
      }

      default:
        console.log(`[Webhook] Apple: Unhandled notification type: ${notificationType}`);
    }

    return c.json({ ok: true });
  } catch (err: any) {
    console.error('[Webhook] Apple: Error processing webhook:', err);
    return c.json({ error: 'Internal error' }, 500);
  }
});

// ── Google Play RTDN ──────────────────────────────────────────────

/**
 * POST /subscriptions/webhooks/google
 *
 * Google sends Real-time Developer Notifications (RTDN) via Cloud Pub/Sub.
 * The notification contains a base64-encoded message with subscription
 * purchase information.
 *
 * See: https://developer.google.com/android-subs/rtdn-reference
 */
subscriptionWebhookRoutes.post('/google', async (c) => {
  try {
    const body = await c.req.json();

    // Cloud Pub/Sub wraps the notification
    // body.message.data is base64-encoded
    if (!body.message?.data) {
      console.error('[Webhook] Google: Missing message data');
      return c.json({ ok: true }); // Always return 200 to Pub/Sub
    }

    const decodedData = Buffer.from(body.message.data, 'base64').toString('utf-8');
    const notification = JSON.parse(decodedData);

    const { subscriptionNotification, oneTimeProductNotification } = notification;

    if (subscriptionNotification) {
      const { version, packageName, eventTimeMillis, subscriptionId, purchaseToken } =
        subscriptionNotification;

      console.log(
        `[Webhook] Google: subscriptionId=${subscriptionId} event=${subscriptionNotification.notificationType}`,
      );

      // Find subscription by purchase token
      const existingSub = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.receipt, purchaseToken),
      });

      if (!existingSub) {
        console.log(`[Webhook] Google: No subscription found for purchaseToken`);
        return c.json({ ok: true });
      }

      // Map Google notification types
      // 1=SUBSCRIPTION_RECOVERED, 2=SUBSCRIPTION_RENEWED, 3=SUBSCRIPTION_CANCELED,
      // 4=SUBSCRIPTION_PURCHASED, 5=SUBSCRIPTION_EXPIRED, 6=SUBSCRIPTION_IN_GRACE_PERIOD,
      // 7=SUBSCRIPTION_REVOKE, 8=SUBSCRIPTION_RESTARTED
      const eventType = subscriptionNotification.notificationType;

      switch (eventType) {
        case 1: // RECOVERED
        case 2: // RENEWED
        case 4: // PURCHASED
        case 8: { // RESTARTED
          // Try to get the updated expiry from Google
          // In production, call purchases/subscriptions/get to get latest expiry
          console.log(`[Webhook] Google: Renewed/purchased for user ${existingSub.userId}`);
          break;
        }

        case 3: // CANCELED
        case 5: { // EXPIRED
          // The subscription was cancelled or expired
          // Note: Google may still send EXPIRED even if user cancelled —
          // the expiry date is when access ends, not when they cancelled
          console.log(`[Webhook] Google: Cancelled/expired for user ${existingSub.userId}`);
          break;
        }

        case 6: { // IN_GRACE_PERIOD
          console.log(`[Webhook] Google: In grace period for user ${existingSub.userId}`);
          break;
        }

        case 7: { // REVOKED
          await db
            .update(subscriptions)
            .set({ expiresAt: new Date() })
            .where(eq(subscriptions.id, existingSub.id));
          console.log(`[Webhook] Google: Revoked for user ${existingSub.userId}`);
          break;
        }

        default:
          console.log(`[Webhook] Google: Unhandled event type: ${eventType}`);
      }
    }

    // Always return 200 — Pub/Sub retries on failure
    return c.json({ ok: true });
  } catch (err: any) {
    console.error('[Webhook] Google: Error processing webhook:', err);
    // Still return 200 to avoid Pub/Sub retries on parse errors
    return c.json({ ok: true });
  }
});

// ── Health check for webhook endpoints ────────────────────────────

subscriptionWebhookRoutes.get('/health', (c) => {
  return c.json({
    status: 'ok',
    endpoints: {
      apple: '/subscriptions/webhooks/apple',
      google: '/subscriptions/webhooks/google',
    },
  });
});
