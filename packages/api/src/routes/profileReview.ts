import { Hono } from 'hono';
import { db } from '../db';
import { users, userInterests } from '../db/schema';
import { eq } from 'drizzle-orm';

export const profileReviewRoutes = new Hono();

// Photo analysis categories
const PHOTO_CRITERIA = [
  { id: 'main_photo', label: 'Main Photo', description: 'Clear, well-lit headshot or upper body photo', weight: 25 },
  { id: 'full_body', label: 'Full Body Photo', description: 'At least one full-length photo', weight: 15 },
  { id: 'activity', label: 'Activity Photo', description: 'Photo showing you doing something you enjoy', weight: 15 },
  { id: 'social', label: 'Social Photo', description: 'Photo with friends or at an event', weight: 10 },
  { id: 'variety', label: 'Photo Variety', description: 'Different settings, outfits, and moods', weight: 15 },
  { id: 'count', label: 'Photo Count', description: '4+ photos give matches more to connect with', weight: 20 },
];

// Bio analysis criteria
const BIO_CRITERIA = [
  { id: 'length', label: 'Bio Length', description: 'Optimal length is 100-250 characters', weight: 20 },
  { id: 'personality', label: 'Shows Personality', description: 'Includes humor, interests, or unique traits', weight: 25 },
  { id: 'conversation', label: 'Conversation Starter', description: 'Something easy to ask about or respond to', weight: 25 },
  { id: 'positivity', label: 'Positive Tone', description: 'Upbeat and inviting rather than negative or list-based', weight: 15 },
  { id: 'specificity', label: 'Specific Details', description: 'Specific interests over generic statements', weight: 15 },
];

// Profile completeness fields
const COMPLETENESS_FIELDS = [
  { id: 'name', label: 'Name', required: true },
  { id: 'photos', label: 'Photos (2+)', required: true },
  { id: 'bio', label: 'Bio', required: true },
  { id: 'interests', label: 'Interests (3+)', required: true },
  { id: 'dob', label: 'Date of Birth', required: true },
  { id: 'gender', label: 'Gender', required: true },
  { id: 'location', label: 'Location', required: false },
];

interface PhotoAnalysis {
  criteria: typeof PHOTO_CRITERIA;
  scores: Record<string, number>;
  tips: string[];
  overallScore: number;
}

interface BioAnalysis {
  criteria: typeof BIO_CRITERIA;
  scores: Record<string, number>;
  tips: string[];
  suggestions: string[];
  overallScore: number;
}

interface CompletenessAnalysis {
  fields: Array<{ id: string; label: string; filled: boolean; required: boolean }>;
  score: number;
  missingRequired: string[];
}

interface ProfileReview {
  overallScore: number;
  grade: string;
  completeness: CompletenessAnalysis;
  photoAnalysis: PhotoAnalysis;
  bioAnalysis: BioAnalysis;
  interestAnalysis: {
    count: number;
    coverage: string;
    suggestions: string[];
  };
  topImprovements: string[];
  estimatedBoost: number;
}

function analyzePhotos(photoCount: number, bio: string, interests: string[]): PhotoAnalysis {
  const scores: Record<string, number> = {};

  // Simulate photo analysis based on available info
  scores['main_photo'] = photoCount >= 1 ? 85 + Math.floor(Math.random() * 15) : 0;
  scores['full_body'] = photoCount >= 2 ? 70 + Math.floor(Math.random() * 25) : 0;
  scores['activity'] = photoCount >= 3 ? 65 + Math.floor(Math.random() * 30) : 10;
  scores['social'] = photoCount >= 4 ? 60 + Math.floor(Math.random() * 35) : 15;
  scores['variety'] = photoCount >= 3 ? 55 + Math.floor(Math.random() * 40) : 20;
  scores['count'] = Math.min(100, photoCount * 25);

  const tips: string[] = [];
  if (photoCount < 2) tips.push('Add at least 2 photos — profiles with 1 photo get 75% fewer matches');
  if (photoCount < 4) tips.push('Add more photos (4+) to increase your match rate by up to 40%');
  if (scores['activity'] < 50) tips.push('Add a photo of you doing an activity you love — activity photos get 30% more likes');
  if (scores['social'] < 40) tips.push('A group photo with friends shows you have a social life');
  if (scores['variety'] < 50) tips.push('Use different settings, lighting, and outfits across your photos');
  tips.push('Smile naturally — genuine smiles get 20% more right swipes');
  tips.push('Avoid sunglasses in your main photo — eyes create connection');

  const overallScore = Math.round(
    PHOTO_CRITERIA.reduce((sum, c) => sum + (scores[c.id] || 0) * (c.weight / 100), 0)
  );

  return { criteria: PHOTO_CRITERIA, scores, tips, overallScore };
}

function analyzeBio(bio: string): BioAnalysis {
  const scores: Record<string, number> = {};
  const tips: string[] = [];
  const suggestions: string[] = [];

  const len = bio.length;

  // Length analysis
  if (len === 0) {
    scores['length'] = 0;
    tips.push('Write a bio! Profiles with bios get 4x more matches');
  } else if (len < 50) {
    scores['length'] = 40;
    tips.push('Your bio is short — aim for 100-250 characters for optimal engagement');
  } else if (len >= 100 && len <= 250) {
    scores['length'] = 95;
  } else if (len > 250 && len <= 500) {
    scores['length'] = 80;
  } else {
    scores['length'] = 65;
    tips.push('Long bios can be overwhelming — try keeping it concise and punchy');
  }

  // Personality indicators
  const personalityIndicators = ['!', '😂', '🤣', '❤️', '✨', '🔥', 'interested in', 'love', 'passionate', 'obsessed'];
  const personalityScore = personalityIndicators.filter((p) => bio.toLowerCase().includes(p.toLowerCase())).length;
  scores['personality'] = Math.min(100, personalityScore * 20 + 20);

  if (scores['personality'] < 40) {
    tips.push('Add some personality — humor or enthusiasm makes you more approachable');
  }

  // Conversation starter detection
  const questionIndicators = ['?', 'ask me about', "let's", 'looking for', 'find someone', 'want to', 'dm me'];
  const convScore = questionIndicators.filter((q) => bio.toLowerCase().includes(q)).length;
  scores['conversation'] = Math.min(100, convScore * 30 + 30);

  if (scores['conversation'] < 50) {
    tips.push('End with something people can ask about — it makes starting a conversation easier');
  }

  // Positivity
  const negativeIndicators = ['no', "don't", 'not looking', 'waste', 'boring', 'tired', 'hate', 'annoying'];
  const negativeScore = negativeIndicators.filter((n) => bio.toLowerCase().includes(n)).length;
  scores['positivity'] = Math.max(20, 100 - negativeScore * 25);

  if (scores['positivity'] < 70) {
    tips.push('Keep it positive — upbeat bios get 3x more right swipes');
  }

  // Specificity
  const specificWords = bio.split(' ').filter((w) => w.length > 5).length;
  scores['specificity'] = Math.min(100, specificWords * 8 + 20);

  if (scores['specificity'] < 40) {
    tips.push('Be specific — "I love hiking in the Cascades" beats "I like outdoor stuff"');
  }

  // Generate suggestions based on analysis
  if (len === 0) {
    suggestions.push("Try: \"Dog dad 🐕 | Weekend hiker | Looking for someone to explore coffee shops with ☕\"");
    suggestions.push("Try: \"I make the best pasta you'll never taste 🍝 | Dog person looking for hiking buddy\"");
    suggestions.push("Try: \"Currently obsessed with [show/game/hobby] | Let's debate the best pizza in town 🍕\"");
  } else {
    if (!bio.includes('?')) {
      suggestions.push('Try ending with a question: "What\'s the last thing that made you laugh out loud?"');
    }
    if (!bio.match(/[^\w\s]/)) {
      suggestions.push('Add some emoji to make your bio more visually engaging ✨');
    }
    if (!bio.toLowerCase().match(/hobby|love|enjoy|passion|obsess|fan/)) {
      suggestions.push('Mention what you\'re passionate about — it gives matches something to connect over');
    }
  }

  const overallScore = Math.round(
    BIO_CRITERIA.reduce((sum, c) => sum + (scores[c.id] || 0) * (c.weight / 100), 0)
  );

  return { criteria: BIO_CRITERIA, scores, tips, suggestions, overallScore };
}

// POST /profile-review — Analyze a user's profile
profileReviewRoutes.post('/', async (c) => {
  // TODO: Add auth middleware
  const userId = (c as any).get('userId');

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  // Get interests
  const interests = await db.query.userInterests.findMany({
    where: eq(userInterests.userId, userId),
  });

  const interestNames = interests.map((i) => i.interest);
  const photoCount = user.photos?.length || 0;
  const bio = user.bio || '';

  // Analyze each component
  const completeness = analyzeCompleteness(user, interestNames);
  const photoAnalysis = analyzePhotos(photoCount, bio, interestNames);
  const bioAnalysis = analyzeBio(bio);
  const interestAnalysis = analyzeInterests(interestNames);

  // Calculate overall score
  const overallScore = Math.round(
    completeness.score * 0.3 +
    photoAnalysis.overallScore * 0.35 +
    bioAnalysis.overallScore * 0.2 +
    interestAnalysis.count >= 3 ? 15 : interestAnalysis.count * 5
  );

  // Grade
  let grade: string;
  if (overallScore >= 90) grade = 'A+';
  else if (overallScore >= 80) grade = 'A';
  else if (overallScore >= 70) grade = 'B+';
  else if (overallScore >= 60) grade = 'B';
  else if (overallScore >= 50) grade = 'C+';
  else if (overallScore >= 40) grade = 'C';
  else grade = 'D';

  // Top improvements
  const allTips = [
    ...photoAnalysis.tips.slice(0, 2),
    ...bioAnalysis.tips.slice(0, 2),
    ...interestAnalysis.suggestions.slice(0, 1),
  ].slice(0, 4);

  // Estimated boost from improvements
  const estimatedBoost = Math.min(50, Math.max(10, 100 - overallScore));

  const review: ProfileReview = {
    overallScore,
    grade,
    completeness,
    photoAnalysis,
    bioAnalysis,
    interestAnalysis,
    topImprovements: allTips,
    estimatedBoost,
  };

  return c.json({ review });
});

function analyzeCompleteness(
  user: any,
  interests: string[]
): CompletenessAnalysis {
  const fields = COMPLETENESS_FIELDS.map((f) => {
    let filled = false;
    switch (f.id) {
      case 'name': filled = !!user.name; break;
      case 'photos': filled = (user.photos?.length || 0) >= 2; break;
      case 'bio': filled = !!user.bio && user.bio.length > 10; break;
      case 'interests': filled = interests.length >= 3; break;
      case 'dob': filled = !!user.dob; break;
      case 'gender': filled = !!user.gender; break;
      case 'location': filled = !!user.location; break;
    }
    return { ...f, filled };
  });

  const requiredMissing = fields.filter((f) => f.required && !f.filled).map((f) => f.label);
  const filledCount = fields.filter((f) => f.filled).length;
  const score = Math.round((filledCount / fields.length) * 100);

  return { fields, score, missingRequired: requiredMissing };
}

function analyzeInterests(interests: string[]): {
  count: number;
  coverage: string;
  suggestions: string[];
} {
  const count = interests.length;
  let coverage = '';
  const suggestions: string[] = [];

  if (count === 0) {
    coverage = 'No interests selected';
    suggestions.push('Add at least 3 interests to help our AI find compatible matches');
    suggestions.push('Choose interests you\'re genuinely passionate about — they become conversation starters');
  } else if (count < 3) {
    coverage = 'Too few interests';
    suggestions.push('Add more interests (3+) to improve match accuracy');
  } else if (count < 6) {
    coverage = 'Good start';
    suggestions.push('Adding 6+ interests helps us find more nuanced compatibility');
  } else {
    coverage = 'Well covered';
    suggestions.push('Great interest selection! Consider updating them seasonally');
  }

  return { count, coverage, suggestions };
}

// GET /profile-review/tips — Get general profile tips
profileReviewRoutes.get('/tips', async (c) => {
  return c.json({
    tips: [
      {
        category: 'Photos',
        items: [
          'Use a clear, well-lit main photo with just you',
          'Show genuine smiles — they get 20% more likes',
          'Include at least one full-body photo',
          'Add a photo doing something you love',
          'Use recent photos (within the last year)',
          'Avoid heavy filters — authenticity wins',
        ],
      },
      {
        category: 'Bio',
        items: [
          'Keep it 100-250 characters for optimal engagement',
          'Show personality over listing facts',
          'End with something people can ask about',
          'Use emoji to break up text and add visual appeal',
          'Be positive — avoid "don\'t" or "no" statements',
          'Include a conversation starter or question',
        ],
      },
      {
        category: 'Interests',
        items: [
          'Select 5-8 interests for best match accuracy',
          'Mix popular and niche interests',
          'Be genuine — you might match on shared passions',
          'Update your interests as seasons change',
        ],
      },
      {
        category: 'General',
        items: [
          'Complete verification for a trust badge — increases matches by 30%',
          'Update your profile every few weeks to stay fresh in the algorithm',
          'Active users get priority in the discovery queue',
          'Respond to messages quickly — it signals you\'re engaged',
        ],
      },
    ],
  });
});
