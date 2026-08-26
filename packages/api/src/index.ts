import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import { authRoutes } from './routes/auth';
import { profileRoutes } from './routes/profiles';
import { swipeRoutes } from './routes/swipes';
import { matchRoutes } from './routes/matches';
import { messageRoutes } from './routes/messages';
import { verificationRoutes } from './routes/verification';
import { subscriptionRoutes } from './routes/subscriptions';
import { profileReviewRoutes } from './routes/profileReview';
import { notificationRoutes } from './routes/notifications';
import { onboardingRoutes } from './routes/onboarding';
import { passwordResetRoutes } from './routes/passwordReset';
import { adminRoutes } from './routes/admin';
import { uploadRoutes } from './routes/upload';
import { dataExportRoutes } from './routes/dataExport';
import { safetyRoutes } from './routes/safety';
import { datePlannerRoutes } from './routes/datePlanner';
import { subscriptionWebhookRoutes } from './routes/subscriptionsWebhooks';
import { stripeRoutes } from './routes/stripe';
import { stripeWebhookRoutes } from './routes/stripeWebhooks';
import { adminMiddleware } from './middleware/admin';
import { apiRateLimit, authRateLimit } from './middleware/rateLimit';
import { authMiddleware } from './middleware/auth';
import { setupWebSocket } from './ws';

const app = new Hono();

// Middleware
app.use('*', cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:8081'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use('*', logger());
app.use('*', apiRateLimit);

// Health check
app.get('/', (c) => {
  return c.json({ status: 'ok', message: 'Spark API is running' });
});

// Detailed health check
app.get('/health', async (c) => {
  const { aiClient } = await import('./services/ai');
  const aiHealthy = await aiClient.healthCheck();

  return c.json({
    status: 'ok',
    services: {
      api: true,
      ai: aiHealthy,
      aiUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
    },
    timestamp: new Date().toISOString(),
  });
});

// Routes — auth routes are public but rate-limited, everything else requires a token
app.use('/auth/login', authRateLimit);
app.use('/auth/register', authRateLimit);
app.use('/auth/verify-phone', authRateLimit);
app.route('/auth', authRoutes);
app.use('/auth/export', authMiddleware);
app.route('/auth', dataExportRoutes);
app.use('/password-reset/request', authRateLimit);
app.route('/password-reset', passwordResetRoutes);
app.use('/profiles/*', authMiddleware);
app.use('/profiles', authMiddleware);
app.use('/swipes/*', authMiddleware);
app.use('/swipes', authMiddleware);
app.use('/matches/*', authMiddleware);
app.use('/matches', authMiddleware);
app.use('/messages/*', authMiddleware);
app.use('/verification/*', authMiddleware);
app.use('/subscriptions/*', authMiddleware);
app.use('/profile-review/*', authMiddleware);
app.use('/date-planner/*', authMiddleware);
app.use('/date-planner', authMiddleware);
app.use('/notifications/*', authMiddleware);
app.use('/onboarding/*', authMiddleware);
app.use('/onboarding', authMiddleware);
app.route('/profiles', profileRoutes);
app.route('/swipes', swipeRoutes);
app.route('/matches', matchRoutes);
app.route('/messages', messageRoutes);
app.route('/verification', verificationRoutes);
app.route('/subscriptions', subscriptionRoutes);
app.route('/subscriptions/webhooks', subscriptionWebhookRoutes);
app.route('/profile-review', profileReviewRoutes);
app.route('/date-planner', datePlannerRoutes);
app.route('/notifications', notificationRoutes);
app.route('/onboarding', onboardingRoutes);

// Stripe routes — require auth (except webhooks)
app.use('/stripe/*', authMiddleware);
app.route('/stripe', stripeRoutes);

// Stripe webhooks — NO auth (Stripe calls directly)
app.post('/stripe/webhooks', async (c, next) => {
  // Bypass auth middleware for webhooks
  return stripeWebhookRoutes.fetch(c.req.raw, {}, {} as any);
});

// Safety routes — require auth
app.use('/safety/*', authMiddleware);
app.use('/safety', authMiddleware);
app.route('/safety', safetyRoutes);

// Upload routes — require auth
app.use('/upload/*', authMiddleware);
app.use('/upload', authMiddleware);
app.route('/upload', uploadRoutes);

// Serve uploaded files — require authentication
app.use('/uploads/*', authMiddleware);
app.get('/uploads/*', async (c) => {
  const { join, normalize } = await import('path');
  const { readFile, stat } = await import('fs/promises');

  // Extract filename after '/uploads/'
  const filename = c.req.path.slice(c.req.path.indexOf('/uploads/') + 9);
  if (!filename || filename.includes('..') || filename.includes('\0')) {
    return c.json({ error: 'Invalid filename' }, 400);
  }

  const uploadsDir = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');
  const filepath = normalize(join(uploadsDir, filename));

  // Prevent path traversal: resolved path must be inside uploads directory
  if (!filepath.startsWith(uploadsDir)) {
    return c.json({ error: 'Invalid filename' }, 400);
  }

  try {
    await stat(filepath);
    const data = await readFile(filepath);
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
      webp: 'image/webp', gif: 'image/gif',
    };
    return new Response(data, {
      headers: { 'Content-Type': mimeTypes[ext || ''] || 'application/octet-stream', 'Cache-Control': 'public, max-age=31536000' },
    });
  } catch {
    return c.json({ error: 'File not found' }, 404);
  }
});

// Admin routes — require admin privileges
app.use('/admin/*', adminMiddleware);
app.use('/admin', adminMiddleware);
app.route('/admin', adminRoutes);

// Error handling
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

const port = parseInt(process.env.PORT || '3000', 10);

const server = serve({
  fetch: app.fetch,
  port,
}, () => {
  console.log(`🔥 Spark API running on http://localhost:${port}`);
});

// Attach WebSocket server to the HTTP server
setupWebSocket(server);
