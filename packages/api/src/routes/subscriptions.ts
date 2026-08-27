import { Hono } from 'hono';
import { db } from '../db';
import { subscriptions, boosts } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { validateReceipt, productToTier } from '../services/receiptValidation';

export const subscriptionRoutes = new Hono();

// Get available plans
subscriptionRoutes.get('/plans', async (c) => {
  const plans = [
    {
      id: 'free',
      name: 'Free',
      tier: 'free',
      price: 0,
      interval: 'month',
      features: [
        '10 curated matches per day',
        'Basic profile',
        'Messaging with matches',
        'Standard filters',
      ],
    },
    {
      id: 'plus-monthly',
      name: 'Spark+',
      tier: 'plus',
      price: 5.99,
      interval: 'month',
      features: [
        'Unlimited matches',
        'See compatibility scores',
        'Advanced filters',
        '1 weekly boost',
        '5 Super Sparks per day',
      ],
    },
    {
      id: 'plus-annual',
      name: 'Spark+',
      tier: 'plus',
      price: 50.39,
      interval: 'year',
      features: [
        'Everything in Spark+ Monthly',
        '30% savings',
        'Priority support',
      ],
    },
    {
      id: 'elite-monthly',
      name: 'Spark Elite',
      tier: 'elite',
      price: 10.99,
      interval: 'month',
      features: [
        'Everything in Spark+',
        'Priority profile placement',
        'Incognito mode',
        'AI date planner',
        'Message before matching',
        '3 weekly boosts',
        'Unlimited Super Sparks',
      ],
    },
    {
      id: 'elite-annual',
      name: 'Spark Elite',
      tier: 'elite',
      price: 92.39,
      interval: 'year',
      features: [
        'Everything in Spark Elite Monthly',
        '30% savings',
        'VIP support',
        'Early access to new features',
      ],
    },
  ];

  return c.json({ plans });
});

// Subscribe to a plan
subscriptionRoutes.post('/', async (c: any) => {
  const userId = c.get('userId');
  const { planId, receipt, platform: clientPlatform } = await c.req.json();

  if (!planId) {
    return c.json({ error: 'planId is required' }, 400);
  }

  // Free plan doesn't need receipt validation
  const tier = productToTier(planId);
  if (tier === 'free') {
    return c.json({ error: 'Cannot subscribe to free plan via this endpoint' }, 400);
  }

  if (!receipt) {
    return c.json({ error: 'Receipt data is required' }, 400);
  }

  // Validate the receipt with the platform store
  const platform = (clientPlatform as 'ios' | 'android') || 'ios';
  const validation = await validateReceipt(platform, receipt, {
    packageName: 'com.spark.dating',
    productId: planId,
  });

  if (!validation.valid) {
    console.error(`[Subscription] Receipt validation failed for user ${userId}:`, validation.error);
    return c.json({
      error: 'Receipt validation failed',
      details: validation.error,
    }, 402);
  }

  // Verify the receipt matches the claimed product
  if (validation.productId && validation.productId !== planId) {
    console.error(`[Subscription] Product mismatch: claimed ${planId}, receipt has ${validation.productId}`);
    return c.json({
      error: 'Product mismatch',
      details: 'The receipt does not match the requested subscription plan',
    }, 402);
  }

  // Check for existing active subscription with the same original transaction ID
  const existingSub = await db.query.subscriptions.findFirst({
    where: and(
      eq(subscriptions.userId, userId),
      eq(subscriptions.tier, tier),
    ),
    orderBy: (s, { desc }) => [desc(s.createdAt)],
  });

  // If same original transaction, this is a renewal — update expiry
  // If different, it's a new subscription
  const expiresAt = validation.expiresAt ? new Date(validation.expiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  let subscription;
  let isNewSubscription = false;
  if (existingSub && existingSub.receipt === receipt) {
    // Same receipt — just update expiry
    [subscription] = await db
      .update(subscriptions)
      .set({ expiresAt, receipt })
      .where(eq(subscriptions.id, existingSub.id))
      .returning();
  } else {
    // New subscription
    [subscription] = await db
      .insert(subscriptions)
      .values({
        userId,
        tier,
        platform,
        receipt,
        originalTransactionId: validation.originalTransactionId || null,
        expiresAt,
      })
      .returning();
    isNewSubscription = true;
  }

  // Grant subscription benefits only on new subscriptions (not renewals)
  if (isNewSubscription && tier === 'plus') {
    // Plus: 1 boost + 5 super likes on subscribe
    await db.insert(boosts).values({
      userId,
      activatedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
  } else if (isNewSubscription && tier === 'elite') {
    // Elite: 3 boosts + unlimited super likes on subscribe
    for (let i = 0; i < 3; i++) {
      await db.insert(boosts).values({
        userId,
        activatedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    }
  }

  console.log(`[Subscription] User ${userId} subscribed to ${tier} (${platform}, env: ${validation.environment})`);

  return c.json({
    subscription,
    validation: {
      environment: validation.environment,
      expiresAt: validation.expiresAt,
      isTrial: validation.isTrial,
    },
    message: 'Successfully subscribed!',
  });
});

// Get current subscription
subscriptionRoutes.get('/', async (c: any) => {
  const userId = c.get('userId');

  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
    orderBy: (s, { desc }) => [desc(s.createdAt)],
  });

  if (!subscription) {
    return c.json({
      tier: 'free',
      expiresAt: null,
      isActive: true,
    });
  }

  // Check if subscription is still active
  const isActive = subscription.expiresAt
    ? new Date(subscription.expiresAt) > new Date()
    : true;

  return c.json({
    subscription: {
      ...subscription,
      isActive,
    },
  });
});

// Cancel subscription
subscriptionRoutes.delete('/', async (c: any) => {
  const userId = c.get('userId');
  const { tier } = await c.req.json().catch(() => ({})) as { tier?: string };

  // Build the where clause: cancel only the active subscription (optionally filtered by tier)
  const conditions: any[] = [eq(subscriptions.userId, userId)];
  if (tier && tier !== 'free') {
    conditions.push(eq(subscriptions.tier, tier as any));
  }

  // Mark as expired immediately
  // In production, this would also call App Store/Play Store APIs to cancel
  await db
    .update(subscriptions)
    .set({ expiresAt: new Date() })
    .where(
      and(...conditions),
    );

  return c.json({ message: 'Subscription cancelled. Your premium access has ended.' });
});
