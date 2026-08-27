/**
 * Database seed script for Spark Dating App.
 * Creates demo users with profiles, interests, and preferences.
 *
 * Usage: npx tsx src/seed.ts
 */

import bcrypt from 'bcryptjs';
import { db } from './db';
import {
  users, userInterests, userPreferences, swipes, matches, subscriptions,
} from './db/schema';
import { eq } from 'drizzle-orm';

const DEMO_PASSWORD = 'password123';
const ADMIN_PASSWORD = 'admin123';

const ADMIN_USER = {
  name: 'Admin',
  email: 'admin@spark.dating',
  bio: 'Platform administrator',
  dob: '1990-01-01',
  gender: 'other' as const,
  photos: [] as string[],
  interests: [] as string[],
  role: 'super_admin' as const,
};

const DEMO_USERS = [
  {
    name: 'Sarah Chen',
    email: 'sarah@spark.demo',
    bio: 'Coffee enthusiast ☕ | Dog mom 🐕 | Weekend hiker 🥾 | Looking for someone to explore coffee shops with',
    dob: '1997-03-15',
    gender: 'female' as const,
    photos: [
      'https://picsum.photos/seed/sarah1/400/600',
      'https://picsum.photos/seed/sarah2/400/600',
      'https://picsum.photos/seed/sarah3/400/600',
    ],
    interests: ['Hiking', 'Coffee', 'Dogs', 'Photography', 'Travel', 'Yoga'],
    verified: true,
    photoVerified: true,
    location: { latitude: 37.7749, longitude: -122.4194 },
  },
  {
    name: 'Emily Rivera',
    email: 'emily@spark.demo',
    bio: 'Artist 🎨 | Foodie 🍕 | Book lover 📚 | I make the best pasta you\'ll never taste',
    dob: '1999-07-22',
    gender: 'female' as const,
    photos: [
      'https://picsum.photos/seed/emily1/400/600',
      'https://picsum.photos/seed/emily2/400/600',
    ],
    interests: ['Art', 'Cooking', 'Reading', 'Travel', 'Wine', 'Crafts'],
    verified: true,
    photoVerified: false,
    location: { latitude: 37.7849, longitude: -122.4094 },
  },
  {
    name: 'Jessica Park',
    email: 'jessica@spark.demo',
    bio: 'Yoga instructor 🧘 | Plant mom 🌿 | Travel addict ✈️ | Meditation daily',
    dob: '1996-11-08',
    gender: 'female' as const,
    photos: [
      'https://picsum.photos/seed/jessica1/400/600',
      'https://picsum.photos/seed/jessica2/400/600',
      'https://picsum.photos/seed/jessica3/400/600',
    ],
    interests: ['Yoga', 'Travel', 'Meditation', 'Plants', 'Nature', 'Beach'],
    verified: false,
    photoVerified: true,
    location: { latitude: 37.7649, longitude: -122.4294 },
  },
  {
    name: 'Mia Johnson',
    email: 'mia@spark.demo',
    bio: 'Software engineer by day 🖥️ | Amateur chef by night 🍳 | Cat person (sorry not sorry)',
    dob: '1998-05-30',
    gender: 'female' as const,
    photos: [
      'https://picsum.photos/seed/mia1/400/600',
      'https://picsum.photos/seed/mia2/400/600',
    ],
    interests: ['Technology', 'Cooking', 'Gaming', 'Podcasts', 'Cats', 'Movies'],
    verified: true,
    photoVerified: true,
    location: { latitude: 37.7549, longitude: -122.4394 },
  },
  {
    name: 'Luna Martinez',
    email: 'luna@spark.demo',
    bio: 'Musician 🎵 | Sunset chaser 🌅 | Dog person (obviously) 🐾 | Concerts every weekend',
    dob: '2000-01-12',
    gender: 'female' as const,
    photos: [
      'https://picsum.photos/seed/luna1/400/600',
      'https://picsum.photos/seed/luna2/400/600',
      'https://picsum.photos/seed/luna3/400/600',
    ],
    interests: ['Music', 'Photography', 'Dogs', 'Beach', 'Concerts', 'Dancing'],
    verified: false,
    photoVerified: false,
    location: { latitude: 37.7449, longitude: -122.4494 },
  },
  {
    name: 'Alex Thompson',
    email: 'alex@spark.demo',
    bio: 'Tech enthusiast 🚀 | Coffee lover ☕ | Weekend adventurer | Building cool things',
    dob: '1995-09-18',
    gender: 'male' as const,
    photos: [
      'https://picsum.photos/seed/alex1/400/600',
      'https://picsum.photos/seed/alex2/400/600',
    ],
    interests: ['Technology', 'Hiking', 'Coffee', 'Photography', 'Travel', 'Fitness'],
    verified: true,
    photoVerified: true,
    location: { latitude: 37.7749, longitude: -122.4194 },
  },
  {
    name: 'Marcus Lee',
    email: 'marcus@spark.demo',
    bio: 'Fitness coach 💪 | Foodie 🍔 | Dog dad 🐕 | Looking for a gym partner who likes pizza',
    dob: '1994-12-25',
    gender: 'male' as const,
    photos: [
      'https://picsum.photos/seed/marcus1/400/600',
      'https://picsum.photos/seed/marcus2/400/600',
      'https://picsum.photos/seed/marcus3/400/600',
    ],
    interests: ['Fitness', 'Sports', 'Dogs', 'Cooking', 'Gaming', 'Music'],
    verified: true,
    photoVerified: true,
    location: { latitude: 37.7849, longitude: -122.4094 },
  },
  {
    name: 'David Kim',
    email: 'david@spark.demo',
    bio: 'Photographer 📸 | Nature lover 🌲 | Audiophile 🎧 | Weekend camper',
    dob: '1997-06-10',
    gender: 'male' as const,
    photos: [
      'https://picsum.photos/seed/david1/400/600',
      'https://picsum.photos/seed/david2/400/600',
    ],
    interests: ['Photography', 'Nature', 'Music', 'Hiking', 'Travel', 'Art'],
    verified: false,
    photoVerified: true,
    location: { latitude: 37.7649, longitude: -122.4294 },
  },
  {
    name: 'Ryan O\'Brien',
    email: 'ryan@spark.demo',
    bio: 'Startup founder 🚀 | Board game nerd 🎲 | Aspiring chef 👨‍🍳 | Skiing > everything',
    dob: '1996-02-14',
    gender: 'male' as const,
    photos: [
      'https://picsum.photos/seed/ryan1/400/600',
      'https://picsum.photos/seed/ryan2/400/600',
    ],
    interests: ['Gaming', 'Cooking', 'Sports', 'Travel', 'Books', 'Wine'],
    verified: true,
    photoVerified: false,
    location: { latitude: 37.7549, longitude: -122.4394 },
  },
  {
    name: 'Jordan Taylor',
    email: 'jordan@spark.demo',
    bio: 'Musician 🎸 | Coffee snob ☕ | Plant parent 🌱 | Let\'s debate the best pizza in town 🍕',
    dob: '1998-08-20',
    gender: 'non-binary' as const,
    photos: [
      'https://picsum.photos/seed/jordan1/400/600',
      'https://picsum.photos/seed/jordan2/400/600',
      'https://picsum.photos/seed/jordan3/400/600',
    ],
    interests: ['Music', 'Coffee', 'Plants', 'Art', 'Cooking', 'Books'],
    verified: true,
    photoVerified: true,
    location: { latitude: 37.7449, longitude: -122.4494 },
  },
];

async function seed() {
  console.log('🌱 Seeding Spark database...\n');

  // Check for existing users
  const existing = await db.query.users.findFirst();
  if (existing) {
    console.log('⚠️  Database already has users. Skipping seed.');
    return;
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  // Create admin user first
  const { interests: _adminInterests, ...adminFields } = ADMIN_USER;
  const [adminUser] = await db
    .insert(users)
    .values({
      ...adminFields,
      passwordHash: adminPasswordHash,
    })
    .returning();
  console.log(`  👑 Admin: ${adminUser.email} (password: ${ADMIN_PASSWORD})`);

  for (const userData of DEMO_USERS) {
    const { interests, ...userFields } = userData;

    const [user] = await db
      .insert(users)
      .values({
        ...userFields,
        passwordHash,
      })
      .returning();

    // Add interests
    if (interests.length > 0) {
      await db.insert(userInterests).values(
        interests.map((interest) => ({
          userId: user.id,
          interest,
        }))
      );
    }

    // Add default preferences
    await db.insert(userPreferences).values({
      userId: user.id,
      minAge: 18,
      maxAge: 50,
      maxDistance: 50,
      genderPreference: [],
      relationshipGoals: 'unsure',
    });

    console.log(`  ✅ ${user.name} (${user.email})`);
  }

  // Create some demo matches between users
  const allUsers = await db.query.users.findMany();
  const sarah = allUsers.find((u) => u.email === 'sarah@spark.demo');
  const alex = allUsers.find((u) => u.email === 'alex@spark.demo');
  const emily = allUsers.find((u) => u.email === 'emily@spark.demo');
  const marcus = allUsers.find((u) => u.email === 'marcus@spark.demo');

  if (sarah && alex) {
    await db.insert(matches).values({
      userAId: sarah.id,
      userBId: alex.id,
      aiBreakdown: 'You both love hiking and coffee! Great compatibility.',
    });
    console.log('  💕 Match: Sarah ↔ Alex');
  }

  if (emily && marcus) {
    await db.insert(matches).values({
      userAId: emily.id,
      userBId: marcus.id,
      aiBreakdown: 'Shared love for cooking and gaming.',
    });
    console.log('  💕 Match: Emily ↔ Marcus');
  }

  // Create some demo swipes
  if (sarah && alex) {
    await db.insert(swipes).values([
      { swiperId: sarah.id, swipedId: alex.id, direction: 'right' },
      { swiperId: alex.id, swipedId: sarah.id, direction: 'right' },
    ]);
  }

  // Create a demo subscription
  if (sarah) {
    const sarahId: string = sarah.id;
    await db.insert(subscriptions).values({
      userId: sarahId,
      tier: 'plus' as const,
      platform: 'ios',
      receipt: 'demo-receipt',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    console.log('  ⭐ Subscription: Sarah → Spark+');
  }

  console.log('\n🎉 Seed complete!');
  console.log(`\n👑 Admin login: ${ADMIN_USER.email} / ${ADMIN_PASSWORD}`);
  console.log(`📧 Demo login: any demo email + password: ${DEMO_PASSWORD}`);
  console.log(`\n🌐 Admin dashboard: /admin/login`);
}

seed()
  .then(() => {
    console.log('\n✅ Done. Exiting.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  });
