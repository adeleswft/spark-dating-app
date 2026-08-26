import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { registerPushToken, unregisterPushToken, sendPushNotification } from '../services/pushNotifications';

export const notificationRoutes = new Hono();

// Register a push token
notificationRoutes.post(
  '/register',
  zValidator(
    'json',
    z.object({
      token: z.string(),
      platform: z.enum(['ios', 'android', 'web']),
    })
  ),
  async (c) => {
    const userId = (c as any).get('userId');
    const { token, platform } = c.req.valid('json');

    const tokenCount = await registerPushToken(userId, token, platform);
    return c.json({ success: true, tokenCount });
  }
);

// Unregister a push token
notificationRoutes.post('/unregister', async (c) => {    const userId = (c as any).get('userId');
    const { token } = await c.req.json();

    await unregisterPushToken(userId, token);
    return c.json({ success: true });
});

// Send a push notification (internal use)
notificationRoutes.post(
  '/send',
  zValidator(
    'json',
    z.object({
      userId: z.string(),
      title: z.string(),
      body: z.string(),
      data: z.record(z.string()).optional(),
    })
  ),
  async (c) => {
    const { userId, title, body, data } = c.req.valid('json');
    const result = await sendPushNotification(userId, title, body, data);
    return c.json(result);
  }
);

// Get notification preferences (placeholder)
notificationRoutes.get('/preferences', async (c) => {
  return c.json({
    preferences: {
      matches: true,
      messages: true,
      superLikes: true,
      likes: true,
      boosts: true,
      system: true,
    },
  });
});

// Update notification preferences (placeholder)
notificationRoutes.put('/preferences', async (c) => {
  const preferences = await c.req.json();
  return c.json({ success: true, preferences });
});
