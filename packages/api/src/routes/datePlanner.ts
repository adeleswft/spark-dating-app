import { Hono } from 'hono';
import { db } from '../db';
import { users, userInterests, matches } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export const datePlannerRoutes = new Hono();

// Date idea templates mapped to interest categories
const DATE_IDEAS = [
  {
    title: 'Coffee & Book Swap',
    description: 'Grab coffee at a cozy café and bring a book to swap. Perfect for sparking deep conversation in a relaxed setting.',
    emoji: '☕',
    category: 'Casual',
    budget: '$',
    duration: '1-2 hours',
    location: 'Local café',
    tags: ['Coffee', 'Books', 'Conversation'],
  },
  {
    title: 'Sunset Hike',
    description: 'Find a scenic trail and catch the sunset together. Nature creates the best backdrop for meaningful talks.',
    emoji: '🥾',
    category: 'Adventure',
    budget: 'Free',
    duration: '2-3 hours',
    location: 'Nearest trail',
    tags: ['Hiking', 'Nature', 'Photography'],
  },
  {
    title: 'Cooking Challenge',
    description: "Pick a random recipe and cook it together. The mess is half the fun — and you get to eat the results!",
    emoji: '🍳',
    category: 'Creative',
    budget: '$$',
    duration: '2-3 hours',
    location: "Someone's kitchen",
    tags: ['Cooking', 'Food', 'Competition'],
  },
  {
    title: 'Museum & Coffee',
    description: 'Explore a local museum, then debrief over coffee. Art gives you endless things to talk about.',
    emoji: '🎨',
    category: 'Culture',
    budget: '$$',
    duration: '3-4 hours',
    location: 'Art museum',
    tags: ['Art', 'Culture', 'Coffee'],
  },
  {
    title: 'Farmers Market Brunch',
    description: 'Wander through a farmers market, sample everything, then find a spot for brunch.',
    emoji: '🥐',
    category: 'Foodie',
    budget: '$$',
    duration: '2-3 hours',
    location: 'Farmers market',
    tags: ['Food', 'Farmers Market', 'Brunch'],
  },
  {
    title: 'Board Game Night',
    description: 'Hit up a board game café or bring your favorites. Friendly competition reveals personality fast.',
    emoji: '🎲',
    category: 'Fun',
    budget: '$',
    duration: '2-3 hours',
    location: 'Board game café',
    tags: ['Games', 'Competition', 'Indoor'],
  },
  {
    title: 'Live Music Night',
    description: 'Check local venues for live music. Great vibes, easy conversation, and shared energy.',
    emoji: '🎵',
    category: 'Nightlife',
    budget: '$$',
    duration: '3-4 hours',
    location: 'Local venue',
    tags: ['Music', 'Nightlife', 'Concerts'],
  },
  {
    title: 'Beach Day',
    description: 'Pack snacks, bring a frisbee, and enjoy the sun. Simple, classic, and always a good time.',
    emoji: '🏖️',
    category: 'Outdoor',
    budget: 'Free',
    duration: '4+ hours',
    location: 'Nearest beach',
    tags: ['Beach', 'Outdoor', 'Relaxation'],
  },
  {
    title: 'Thrift Store Challenge',
    description: 'Set a $10 budget and find the best outfit for each other. Guaranteed laughs.',
    emoji: '👗',
    category: 'Creative',
    budget: '$',
    duration: '1-2 hours',
    location: 'Thrift store',
    tags: ['Fashion', 'Challenge', 'Shopping'],
  },
  {
    title: 'Stargazing',
    description: 'Drive somewhere dark, bring blankets, and look up. The universe makes everything feel more intimate.',
    emoji: '🌌',
    category: 'Romantic',
    budget: 'Free',
    duration: '2-3 hours',
    location: 'Open field',
    tags: ['Nature', 'Romantic', 'Night'],
  },
  {
    title: 'Rock Climbing',
    description: 'Hit an indoor climbing gym — teamwork, trust, and a killer endorphin rush.',
    emoji: '🧗',
    category: 'Adventure',
    budget: '$$',
    duration: '2-3 hours',
    location: 'Climbing gym',
    tags: ['Fitness', 'Adventure', 'Teamwork'],
  },
  {
    title: 'Pottery Class',
    description: 'Take a pottery class together. Something about working with your hands brings out authentic connection.',
    emoji: '🏺',
    category: 'Creative',
    budget: '$$',
    duration: '2-3 hours',
    location: 'Art studio',
    tags: ['Art', 'Creative', 'Hands-on'],
  },
  {
    title: 'Picnic in the Park',
    description: 'Pack a basket with favorite snacks, bring a blanket, and enjoy the afternoon outdoors.',
    emoji: '🧺',
    category: 'Casual',
    budget: '$',
    duration: '2-3 hours',
    location: 'Local park',
    tags: ['Outdoor', 'Food', 'Relaxation'],
  },
  {
    title: 'Escape Room',
    description: 'Work together to solve puzzles and escape. Nothing reveals compatibility like pressure-testing your teamwork.',
    emoji: '🔐',
    category: 'Fun',
    budget: '$$',
    duration: '1-2 hours',
    location: 'Escape room venue',
    tags: ['Puzzle', 'Teamwork', 'Indoor'],
  },
  {
    title: 'Bookstore Browse',
    description: 'Wander a bookstore, pick books for each other, and discuss what you found.',
    emoji: '📚',
    category: 'Casual',
    budget: '$',
    duration: '1-2 hours',
    location: 'Local bookstore',
    tags: ['Books', 'Conversation', 'Relaxation'],
  },
];

// Map interests to relevant date categories
const INTEREST_TO_CATEGORIES: Record<string, string[]> = {
  'hiking': ['Adventure', 'Outdoor'],
  'nature': ['Adventure', 'Outdoor', 'Romantic'],
  'photography': ['Adventure', 'Culture'],
  'cooking': ['Foodie', 'Creative'],
  'food': ['Foodie'],
  'restaurants': ['Foodie', 'Casual'],
  'coffee': ['Casual', 'Culture'],
  'books': ['Casual'],
  'reading': ['Casual'],
  'art': ['Culture', 'Creative'],
  'music': ['Nightlife'],
  'concerts': ['Nightlife'],
  'gaming': ['Fun'],
  'games': ['Fun'],
  'fitness': ['Adventure'],
  'yoga': ['Adventure', 'Outdoor'],
  'meditation': ['Outdoor', 'Romantic'],
  'travel': ['Adventure', 'Outdoor'],
  'beach': ['Outdoor'],
  'dancing': ['Nightlife', 'Fun'],
  'movies': ['Fun', 'Casual'],
  'wine': ['Foodie', 'Romantic'],
  'crafts': ['Creative'],
  'fashion': ['Creative'],
  'technology': ['Fun', 'Creative'],
  'podcasts': ['Casual'],
  'dogs': ['Outdoor', 'Casual'],
  'cats': ['Casual'],
  'plants': ['Casual', 'Outdoor'],
  'sports': ['Adventure', 'Fun'],
};

// Calculate match score for a date idea based on user interests
function calculateMatchScore(
  dateIdea: typeof DATE_IDEAS[0],
  userInterests: string[],
  partnerInterests: string[] = []
): number {
  const allInterests = [...userInterests, ...partnerInterests].map((i) => i.toLowerCase());
  const dateTags = dateIdea.tags.map((t) => t.toLowerCase());
  const dateCategory = dateIdea.category.toLowerCase();

  let score = 60; // Base score

  // Boost for matching tags
  const tagMatches = dateTags.filter((tag) =>
    allInterests.some((interest) => interest.includes(tag) || tag.includes(interest))
  ).length;
  score += tagMatches * 8;

  // Boost for interest-to-category mapping
  const categoryBoosts = allInterests.flatMap(
    (interest) => INTEREST_TO_CATEGORIES[interest] || []
  ).filter((cat) => cat.toLowerCase() === dateCategory).length;
  score += categoryBoosts * 5;

  // Cap at 99
  return Math.min(99, score);
}

// GET /date-planner — Get date ideas personalized to the user
datePlannerRoutes.get('/', async (c: any) => {
  const userId = c.get('userId');

  // Fetch user interests
  const interests = await db.query.userInterests.findMany({
    where: eq(userInterests.userId, userId),
  });
  const userInterestNames = interests.map((i) => i.interest);

  // Score all date ideas
  const scoredDates = DATE_IDEAS.map((date) => ({
    ...date,
    id: `${date.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    matchScore: calculateMatchScore(date, userInterestNames),
  }));

  // Sort by match score
  scoredDates.sort((a, b) => b.matchScore - a.matchScore);

  return c.json({ dates: scoredDates });
});

// GET /date-planner/categories — Get available categories (static route before dynamic)
datePlannerRoutes.get('/meta/categories', async (c) => {
  const categories = [...new Set(DATE_IDEAS.map((d) => d.category))];
  const budgets = [...new Set(DATE_IDEAS.map((d) => d.budget))];

  return c.json({ categories, budgets });
});

// GET /date-planner/:matchId — Get date ideas for a specific match
datePlannerRoutes.get('/:matchId', async (c: any) => {
  const userId = c.get('userId');
  const matchId = c.req.param('matchId');

  // Verify the match exists and involves this user
  const match = await db.query.matches.findFirst({
    where: and(
      eq(matches.id, matchId),
    ),
  });

  if (!match) {
    return c.json({ error: 'Match not found' }, 404);
  }

  if (match.userAId !== userId && match.userBId !== userId) {
    return c.json({ error: 'Unauthorized' }, 403);
  }

  const partnerId = match.userAId === userId ? match.userBId : match.userAId;

  // Fetch both users' interests
  const [userInts, partnerInts] = await Promise.all([
    db.query.userInterests.findMany({ where: eq(userInterests.userId, userId) }),
    db.query.userInterests.findMany({ where: eq(userInterests.userId, partnerId) }),
  ]);

  const userInterestNames = userInts.map((i) => i.interest);
  const partnerInterestNames = partnerInts.map((i) => i.interest);

  // Score date ideas using both users' interests
  const scoredDates = DATE_IDEAS.map((date) => ({
    ...date,
    id: `${date.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    matchScore: calculateMatchScore(date, userInterestNames, partnerInterestNames),
  }));

  scoredDates.sort((a, b) => b.matchScore - a.matchScore);

  return c.json({ dates: scoredDates });
});


