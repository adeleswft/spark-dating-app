/**
 * Database seed script for Spark Dating API.
 * Run: npx tsx packages/api/src/db/seed.ts
 *
 * Creates realistic test users with interests, preferences, and some swipes/matches.
 */

import { db } from './index';
import {
  users,
  userPreferences,
  userInterests,
  swipes,
  matches,
  messages,
} from './schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

const SEED_PASSWORD = 'password123';

const TEST_USERS = [
  {
    name: 'Admin User',
    email: 'admin@spark.dating',
    dob: '1990-01-01',
    gender: 'other' as const,
    bio: 'Platform administrator',
    interests: ['Management'],
    photoVerified: true,
    idVerified: true,
    verified: true,
    role: 'super_admin' as const,
    photos: ['https://picsum.photos/seed/admin1/400/600'],
  },
  {
    name: 'Sarah Chen',
    email: 'sarah@example.com',
    dob: '1998-03-15',
    gender: 'female' as const,
    bio: 'Coffee enthusiast ☕ | Weekend hiker 🏔️ | Dog mom 🐕 | Looking for someone to explore farmers markets with',
    interests: ['Hiking', 'Coffee', 'Photography', 'Dogs', 'Cooking', 'Travel'],
    photoVerified: true,
    idVerified: true,
    verified: true,
    photos: [
      'https://picsum.photos/seed/sarah1/400/600',
      'https://picsum.photos/seed/sarah2/400/600',
      'https://picsum.photos/seed/sarah3/400/600',
    ],
  },
  {
    name: 'James Wilson',
    email: 'james@example.com',
    dob: '1995-07-22',
    gender: 'male' as const,
    bio: 'Software engineer by day, amateur chef by night 🍳 | Love live music and spontaneous road trips',
    interests: ['Cooking', 'Music', 'Travel', 'Technology', 'Photography', 'Running'],
    photoVerified: true,
    idVerified: false,
    verified: false,
    photos: [
      'https://picsum.photos/seed/james1/400/600',
      'https://picsum.photos/seed/james2/400/600',
    ],
  },
  {
    name: 'Emma Rodriguez',
    email: 'emma@example.com',
    dob: '2000-11-08',
    gender: 'female' as const,
    bio: 'Yoga instructor 🧘‍♀️ | Plant parent 🌿 | Sunset chaser | Let\'s grab a smoothie sometime',
    interests: ['Yoga', 'Fitness', 'Plants', 'Meditation', 'Nature', 'Art'],
    photoVerified: true,
    idVerified: true,
    verified: true,
    photos: [
      'https://picsum.photos/seed/emma1/400/600',
      'https://picsum.photos/seed/emma2/400/600',
      'https://picsum.photos/seed/emma3/400/600',
      'https://picsum.photos/seed/emma4/400/600',
    ],
  },
  {
    name: 'Michael Park',
    email: 'michael@example.com',
    dob: '1997-01-30',
    gender: 'male' as const,
    bio: 'Filmmaker 🎬 | Basketball player 🏀 | Record collector 🎵 | Always down for an adventure',
    interests: ['Film', 'Basketball', 'Music', 'Art', 'Hiking', 'Coffee'],
    photoVerified: false,
    idVerified: false,
    verified: false,
    photos: [
      'https://picsum.photos/seed/michael1/400/600',
    ],
  },
  {
    name: 'Aisha Patel',
    email: 'aisha@example.com',
    dob: '1999-05-12',
    gender: 'female' as const,
    bio: 'Medical student 🩺 | Bookworm 📚 | Amateur pottery maker 🏺 | Love deep conversations over chai',
    interests: ['Reading', 'Pottery', 'Tea', 'Science', 'Travel', 'Dogs'],
    photoVerified: true,
    idVerified: false,
    verified: false,
    photos: [
      'https://picsum.photos/seed/aisha1/400/600',
      'https://picsum.photos/seed/aisha2/400/600',
      'https://picsum.photos/seed/aisha3/400/600',
    ],
  },
  {
    name: 'David Kim',
    email: 'david@example.com',
    dob: '1996-09-18',
    gender: 'male' as const,
    bio: 'Graphic designer 🎨 | Surf enthusiast 🏄 | Trying to find the best taco in the city 🌮',
    interests: ['Design', 'Surfing', 'Food', 'Photography', 'Hiking', 'Travel'],
    photoVerified: true,
    idVerified: true,
    verified: true,
    photos: [
      'https://picsum.photos/seed/david1/400/600',
      'https://picsum.photos/seed/david2/400/600',
      'https://picsum.photos/seed/david3/400/600',
    ],
  },
  {
    name: 'Olivia Thompson',
    email: 'olivia@example.com',
    dob: '2001-02-25',
    gender: 'female' as const,
    bio: 'Dance teacher 💃 | Foodie 🍜 | Cat lover 🐈 | Looking for someone who loves spontaneous adventures',
    interests: ['Dancing', 'Food', 'Cats', 'Music', 'Travel', 'Art'],
    photoVerified: true,
    idVerified: true,
    verified: true,
    photos: [
      'https://picsum.photos/seed/olivia1/400/600',
      'https://picsum.photos/seed/olivia2/400/600',
      'https://picsum.photos/seed/olivia3/400/600',
      'https://picsum.photos/seed/olivia4/400/600',
    ],
  },
  {
    name: 'Alex Johnson',
    email: 'alex@example.com',
    dob: '1998-06-10',
    gender: 'other' as const,
    bio: 'Music producer 🎧 | Vinyl collector | Night owl 🌙 | Looking for creative souls',
    interests: ['Music', 'Art', 'Technology', 'Nightlife', 'Photography', 'Coffee'],
    photoVerified: true,
    idVerified: false,
    verified: false,
    photos: [
      'https://picsum.photos/seed/alex1/400/600',
      'https://picsum.photos/seed/alex2/400/600',
    ],
  },
];

const DEFAULT_PREFERENCES = {
  minAge: 18,
  maxAge: 35,
  maxDistance: 50,
  genderPreference: [] as string[],
  relationshipGoals: 'serious',
};

async function seed() {
  console.log('🌱 Seeding database...\n');

  // Clear existing data (in reverse dependency order)
  console.log('🗑️  Clearing existing data...');
  await db.delete(messages);
  await db.delete(matches);
  await db.delete(swipes);
  await db.delete(userInterests);
  await db.delete(userPreferences);
  await db.delete(users);
  console.log('✅ Cleared\n');

  // Create users
  console.log('👤 Creating users...');
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const createdUsers = [];

  for (const userData of TEST_USERS) {
    const [user] = await db
      .insert(users)
      .values({
        name: userData.name,
        email: userData.email,
        passwordHash: userData.role ? adminPasswordHash : passwordHash,
        dob: userData.dob,
        gender: userData.gender,
        bio: userData.bio,
        photos: userData.photos,
        photoVerified: userData.photoVerified,
        idVerified: userData.idVerified,
        verified: userData.verified,
        ...(userData.role ? { role: userData.role } : {}),
        location: {
          latitude: 37.7749 + (Math.random() - 0.5) * 0.1,
          longitude: -122.4194 + (Math.random() - 0.5) * 0.1,
        },
      })
      .returning();

    createdUsers.push(user);
    console.log(`   ✅ ${user.name} (${user.email})`);
  }
  console.log('');

  // Create preferences
  console.log('⚙️  Creating preferences...');
  for (const user of createdUsers) {
    const genderPref =
      user.gender === 'male'
        ? ['female']
        : user.gender === 'female'
        ? ['male']
        : ['male', 'female', 'non-binary'];

    await db.insert(userPreferences).values({
      userId: user.id,
      ...DEFAULT_PREFERENCES,
      genderPreference: genderPref,
    });
  }
  console.log(`   ✅ ${createdUsers.length} preference sets\n`);

  // Create interests
  console.log('🏷️  Creating interests...');
  let interestCount = 0;
  for (const userData of TEST_USERS) {
    const user = createdUsers.find((u) => u.email === userData.email)!;
    for (const interest of userData.interests) {
      await db.insert(userInterests).values({
        userId: user.id,
        interest,
      });
      interestCount++;
    }
  }
  console.log(`   ✅ ${interestCount} interests\n`);

  // Create some swipes and matches
  console.log('💨 Creating swipes and matches...');

  // Sarah likes James (mutual → match)
  const sarah = createdUsers[0];
  const james = createdUsers[1];
  await db.insert(swipes).values({ swiperId: sarah.id, swipedId: james.id, direction: 'right' });
  await db.insert(swipes).values({ swiperId: james.id, swipedId: sarah.id, direction: 'right' });
  const [match1] = await db
    .insert(matches)
    .values({
      userAId: sarah.id,
      userBId: james.id,
      aiBreakdown: 'You both love photography and coffee! Great shared interests for date ideas.',
    })
    .returning();
  console.log(`   ✅ Match: ${sarah.name} ↔ ${james.name}`);

  // Emma likes David (mutual → match)
  const emma = createdUsers[2];
  const david = createdUsers[5];
  await db.insert(swipes).values({ swiperId: emma.id, swipedId: david.id, direction: 'right' });
  await db.insert(swipes).values({ swiperId: david.id, swipedId: emma.id, direction: 'right' });
  const [match2] = await db
    .insert(matches)
    .values({
      userAId: emma.id,
      userBId: david.id,
      aiBreakdown: 'Both of you are creative souls who love the outdoors. Hiking date anyone?',
    })
    .returning();
  console.log(`   ✅ Match: ${emma.name} ↔ ${david.name}`);

  // Some one-way swipes (no match)
  await db.insert(swipes).values({ swiperId: createdUsers[3].id, swipedId: sarah.id, direction: 'right' });
  await db.insert(swipes).values({ swiperId: createdUsers[4].id, swipedId: james.id, direction: 'right' });
  await db.insert(swipes).values({ swiperId: createdUsers[6].id, swipedId: david.id, direction: 'left' });
  await db.insert(swipes).values({ swiperId: sarah.id, swipedId: createdUsers[7].id, direction: 'right' });
  console.log('   ✅ Additional swipes recorded\n');

  // Create some messages
  console.log('💬 Creating messages...');
  if (match1) {
    const sampleMessages = [
      { senderId: james.id, content: 'Hey Sarah! I saw you love hiking — what\'s your favorite trail?' },
      { senderId: sarah.id, content: 'Hi James! I\'m obsessed with the Dipsea Trail. Have you done it?' },
      { senderId: james.id, content: 'Not yet but it\'s on my list! We should go together sometime 🏔️' },
      { senderId: sarah.id, content: 'I\'d love that! Also noticed you\'re a chef — what do you like to cook?' },
    ];
    for (const msg of sampleMessages) {
      await db.insert(messages).values({
        matchId: match1.id,
        ...msg,
      });
    }
    console.log(`   ✅ ${sampleMessages.length} messages in ${sarah.name} ↔ ${james.name}`);
  }

  if (match2) {
    const sampleMessages = [
      { senderId: david.id, content: 'Emma! Your plant collection is amazing 🌿' },
      { senderId: emma.id, content: 'Thanks David! I have about 40 plants now 😅' },
      { senderId: david.id, content: 'That\'s incredible. I kill everything I touch lol' },
      { senderId: emma.id, content: 'Haha I can teach you! Low-maintenance plants are a great start' },
    ];
    for (const msg of sampleMessages) {
      await db.insert(messages).values({
        matchId: match2.id,
        ...msg,
      });
    }
    console.log(`   ✅ ${sampleMessages.length} messages in ${emma.name} ↔ ${david.name}`);
  }

  console.log('\n🎉 Seed complete!\n');
  console.log('Admin account (password: admin123):');
  console.log('  admin@spark.dating');
  console.log('');
  console.log('Test accounts (password: password123):');
  console.log('─'.repeat(45));
  for (const u of TEST_USERS) {
    console.log(`  ${u.email.padEnd(28)} ${u.name}`);
  }
  console.log('');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
