/**
 * Client for the Spark AI Service (Python FastAPI).
 * Handles compatibility scoring, conversation starters, and content moderation.
 */

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

interface CompatibilityResult {
  score: number;
  factors: {
    vector_similarity: number;
    collaborative_filtering: number;
    preference_match: number;
    activity_recency: number;
    profile_quality: number;
  };
}

interface ModerationResult {
  is_safe: boolean;
  severity: string;
  flags: Record<string, boolean>;
  recommendation: string;
}

class AiClient {
  private baseUrl: string;
  private available: boolean;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.available = false;
  }

  /**
   * Check if the AI service is reachable.
   */
  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/`, { signal: AbortSignal.timeout(3000) });
      const data: any = await res.json();
      this.available = data.status === 'ok';
      return this.available;
    } catch {
      this.available = false;
      return false;
    }
  }

  isAvailable(): boolean {
    return this.available;
  }

  /**
   * Calculate compatibility between two user profiles.
   */
  async calculateCompatibility(
    userA: Record<string, any>,
    userB: Record<string, any>
  ): Promise<CompatibilityResult> {
    if (!this.available) {
      return this.fallbackCompatibility(userA, userB);
    }

    try {
      const res = await fetch(`${this.baseUrl}/matching/compatibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_a: userA, user_b: userB }),
        signal: AbortSignal.timeout(5000),
      });
      const data: any = await res.json();
      return data as CompatibilityResult;
    } catch {
      return this.fallbackCompatibility(userA, userB);
    }
  }

  /**
   * Get curated discovery profiles ranked by compatibility.
   */
  async discoverProfiles(
    user: Record<string, any>,
    candidates: Record<string, any>[],
    filters: Record<string, any> = {}
  ): Promise<Array<Record<string, any> & { compatibilityScore: number }>> {
    if (!this.available || candidates.length === 0) {
      return candidates.map((c) => ({ ...c, compatibilityScore: 50 }));
    }

    try {
      const res = await fetch(`${this.baseUrl}/matching/discover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, filters, candidates }),
        signal: AbortSignal.timeout(10000),
      });
      const data: any = await res.json();
      return data.profiles || candidates.map((c) => ({ ...c, compatibilityScore: 50 }));
    } catch {
      return candidates.map((c) => ({ ...c, compatibilityScore: 50 }));
    }
  }

  /**
   * Generate AI explanation of why two users are compatible.
   */
  async generateExplanation(
    userA: Record<string, any>,
    userB: Record<string, any>
  ): Promise<string> {
    if (!this.available) {
      return `You and ${userB.name || 'this person'} have some things in common!`;
    }

    try {
      const res = await fetch(`${this.baseUrl}/explanations/compatibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_a: userA, user_b: userB }),
        signal: AbortSignal.timeout(5000),
      });
      const data: any = await res.json();
      return data.explanation || `Great match!`;
    } catch {
      return `You and ${userB.name || 'this person'} have some things in common!`;
    }
  }

  /**
   * Generate conversation starters for a match.
   */
  async generateConversationStarters(
    userA: Record<string, any>,
    userB: Record<string, any>
  ): Promise<string[]> {
    if (!this.available) {
      return [
        `Hey ${userB.name || ''}! What are you passionate about?`,
        `I noticed we have some shared interests — want to chat about them?`,
        `What's the best thing that happened to you this week?`,
      ];
    }

    try {
      const res = await fetch(`${this.baseUrl}/explanations/conversation-starters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_a: userA, user_b: userB }),
        signal: AbortSignal.timeout(5000),
      });
      const data: any = await res.json();
      return data.starters || [];
    } catch {
      return [];
    }
  }

  /**
   * Moderate text content for safety.
   */
  async moderateText(text: string, context: string = 'general'): Promise<ModerationResult> {
    if (!this.available) {
      return { is_safe: true, severity: 'low', flags: {}, recommendation: 'No action needed' };
    }

    try {
      const res = await fetch(`${this.baseUrl}/moderation/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, context }),
        signal: AbortSignal.timeout(3000),
      });
      const data: any = await res.json();
      return data as ModerationResult;
    } catch {
      return { is_safe: true, severity: 'low', flags: {}, recommendation: 'No action needed' };
    }
  }

  /**
   * Fallback compatibility calculation when AI service is unavailable.
   * Uses simple interest overlap + profile completeness.
   */
  private fallbackCompatibility(
    userA: Record<string, any>,
    userB: Record<string, any>
  ): CompatibilityResult {
    const interestsA = new Set(userA.interests || []);
    const interestsB = new Set(userB.interests || []);
    const overlap = [...interestsA].filter((i) => interestsB.has(i)).length;
    const total = new Set([...interestsA, ...interestsB]).size;
    const vectorScore = total > 0 ? overlap / total : 0.5;

    const photosA = (userA.photos || []).length;
    const photosB = (userB.photos || []).length;
    const profileQuality = (Math.min(photosA, 4) / 4 + (userB.bio ? 0.5 : 0.2)) / 2;

    const score = Math.round(
      vectorScore * 0.35 * 100 +
      0.5 * 0.25 * 100 +
      0.6 * 0.20 * 100 +
      0.7 * 0.10 * 100 +
      profileQuality * 0.10 * 100
    );

    return {
      score: Math.min(99, Math.max(1, score)),
      factors: {
        vector_similarity: vectorScore,
        collaborative_filtering: 0.5,
        preference_match: 0.6,
        activity_recency: 0.7,
        profile_quality: profileQuality,
      },
    };
  }
}

export const aiClient = new AiClient(AI_SERVICE_URL);
