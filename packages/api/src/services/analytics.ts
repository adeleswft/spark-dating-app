/**
 * Lightweight analytics tracking service.
 * Tracks key events for product insights.
 * In production, replace with a real analytics provider (Mixpanel, Amplitude, PostHog).
 */

interface AnalyticsEvent {
  event: string;
  userId?: string;
  properties?: Record<string, any>;
  timestamp: string;
}

// In-memory event buffer (production: send to analytics provider)
const eventBuffer: AnalyticsEvent[] = [];
const FLUSH_INTERVAL = 30_000; // 30 seconds

/**
 * Track an analytics event.
 */
export function trackEvent(
  event: string,
  userId?: string,
  properties?: Record<string, any>,
): void {
  eventBuffer.push({
    event,
    userId,
    properties,
    timestamp: new Date().toISOString(),
  });

  // Log in development
  if (process.env.NODE_ENV !== 'production') {
    console.log(`📊 [Analytics] ${event}`, userId ? `(user: ${userId.substring(0, 8)}...)` : '', properties || '');
  }

  // Auto-flush when buffer is large
  if (eventBuffer.length >= 50) {
    flushEvents();
  }
}

/**
 * Flush buffered events to the analytics provider.
 */
async function flushEvents(): Promise<void> {
  if (eventBuffer.length === 0) return;

  const events = eventBuffer.splice(0, eventBuffer.length);

  // In production, send to analytics provider:
  // await fetch('https://analytics.spark.dating/events', {
  //   method: 'POST',
  //   body: JSON.stringify({ events }),
  // });

  if (process.env.NODE_ENV !== 'production') {
    console.log(`📊 [Analytics] Flushed ${events.length} events`);
  }
}

// Periodic flush
setInterval(flushEvents, FLUSH_INTERVAL);

// ─── Predefined event helpers ─────────────────────────────────

export function trackUserRegistered(userId: string, method: string = 'email') {
  trackEvent('user_registered', userId, { method });
}

export function trackUserLogin(userId: string) {
  trackEvent('user_login', userId);
}

export function trackOnboardingCompleted(userId: string, photoCount: number, interestCount: number) {
  trackEvent('onboarding_completed', userId, { photoCount, interestCount });
}

export function trackSwipe(userId: string, direction: string, isMatch: boolean) {
  trackEvent('swipe', userId, { direction, isMatch });
}

export function trackMatchCreated(userId: string, matchId: string) {
  trackEvent('match_created', userId, { matchId });
}

export function trackMessageSent(userId: string, matchId: string, moderationSeverity: string) {
  trackEvent('message_sent', userId, { matchId, moderationSeverity });
}

export function trackSubscriptionCreated(userId: string, tier: string, platform: string) {
  trackEvent('subscription_created', userId, { tier, platform });
}

export function trackVerificationAttempt(userId: string, type: string) {
  trackEvent('verification_attempt', userId, { type });
}

export function trackProfileView(viewerId: string, profileId: string) {
  trackEvent('profile_view', viewerId, { profileId });
}
