/**
 * Content moderation client.
 * Calls the Python AI service for message/bio analysis.
 * Falls back to basic pattern matching if the AI service is down.
 */

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

interface ModerationResult {
  is_safe: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  flags: Record<string, boolean>;
  recommendation: string;
}

// Basic pattern matching fallback
const SCAM_PATTERNS = [
  /crypto.*invest/i,
  /bitcoin.*profit/i,
  /wire.*transfer/i,
  /gift.*card/i,
  /military.*overseas/i,
  /oil.*rig/i,
  /inheritance.*million/i,
  /emergency.*money/i,
];

const HARASSMENT_PATTERNS = [
  /kill.*you/i,
  /find.*you/i,
  /rape/i,
];

function basicModeration(text: string): ModerationResult {
  const textLower = text.toLowerCase();

  const scamDetected = SCAM_PATTERNS.some((p) => p.test(textLower));
  const harassmentDetected = HARASSMENT_PATTERNS.some((p) => p.test(textLower));

  const severity = harassmentDetected ? 'critical' : scamDetected ? 'high' : 'low';

  return {
    is_safe: !scamDetected && !harassmentDetected,
    severity,
    flags: {
      scam_detected: scamDetected,
      harassment_detected: harassmentDetected,
    },
    recommendation:
      severity === 'critical'
        ? 'Immediate suspension and human review'
        : severity === 'high'
        ? 'Restrict account and review'
        : 'No action needed',
  };
}

/**
 * Analyze a message for safety concerns.
 * Tries the AI service first, falls back to pattern matching.
 */
export async function moderateMessage(
  message: string,
  context?: { recentMessages?: string[] },
): Promise<ModerationResult> {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/moderation/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message, context: 'message', extra: context }),
      signal: AbortSignal.timeout(3000), // 3s timeout
    });

    if (response.ok) {
      return (await response.json()) as ModerationResult;
    }
  } catch {
    // AI service down — fall back to basic moderation
  }

  return basicModeration(message);
}

/**
 * Analyze a bio for safety concerns.
 */
export async function moderateBio(bio: string): Promise<ModerationResult> {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/moderation/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: bio, context: 'bio' }),
      signal: AbortSignal.timeout(3000),
    });

    if (response.ok) {
      return (await response.json()) as ModerationResult;
    }
  } catch {
    // Fall back
  }

  return basicModeration(bio);
}
