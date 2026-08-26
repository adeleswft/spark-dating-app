import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  real,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Enums
export const genderEnum = pgEnum('gender', ['male', 'female', 'non-binary', 'other']);
export const swipeDirectionEnum = pgEnum('swipe_direction', ['left', 'right', 'super']);
export const verificationTypeEnum = pgEnum('verification_type', ['phone', 'photo', 'id', 'identity']);
export const verificationStatusEnum = pgEnum('verification_status', ['pending', 'approved', 'rejected']);
export const matchStatusEnum = pgEnum('match_status', ['active', 'archived']);
export const subscriptionTierEnum = pgEnum('subscription_tier', ['free', 'plus', 'elite']);
export const moderationSeverityEnum = pgEnum('moderation_severity', ['low', 'medium', 'high', 'critical']);
export const moderationActionEnum = pgEnum('moderation_action', ['warn', 'restrict', 'suspend', 'ban']);
export const userRoleEnum = pgEnum('user_role', ['user', 'admin', 'super_admin']);

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  name: varchar('name', { length: 100 }).notNull(),
  dob: varchar('dob', { length: 10 }).notNull(),
  gender: genderEnum('gender').notNull(),
  bio: text('bio'),
  photos: text('photos').array().default([]),
  location: jsonb('location').$type<{ latitude: number; longitude: number }>(),
  role: userRoleEnum('role').default('user'),
  verified: boolean('verified').default(false),
  photoVerified: boolean('photo_verified').default(false),
  idVerified: boolean('id_verified').default(false),
  banned: boolean('banned').default(false),
  bannedAt: timestamp('banned_at'),
  banReason: varchar('ban_reason', { length: 255 }),
  suspended: boolean('suspended').default(false),
  suspendedAt: timestamp('suspended_at'),
  lastActiveAt: timestamp('last_active_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// User preferences
export const userPreferences = pgTable('user_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  minAge: integer('min_age').default(18),
  maxAge: integer('max_age').default(50),
  maxDistance: integer('max_distance').default(50),
  genderPreference: text('gender_preference').array().default([]),
  relationshipGoals: varchar('relationship_goals', { length: 20 }).default('unsure'),
  // Privacy settings
  incognito: boolean('incognito').default(false),
  showOnlineStatus: boolean('show_online_status').default(true),
  showDistance: boolean('show_distance').default(true),
  showLastActive: boolean('show_last_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// User interests
export const userInterests = pgTable('user_interests', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  interest: varchar('interest', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// User embeddings (for AI matching)
export const userEmbeddings = pgTable('user_embeddings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull().unique(),
  embedding: jsonb('embedding').$type<number[]>(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Swipes
export const swipes = pgTable('swipes', {
  id: uuid('id').primaryKey().defaultRandom(),
  swiperId: uuid('swiper_id').references(() => users.id).notNull(),
  swipedId: uuid('swiped_id').references(() => users.id).notNull(),
  direction: swipeDirectionEnum('direction').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Matches
export const matches = pgTable('matches', {
  id: uuid('id').primaryKey().defaultRandom(),
  userAId: uuid('user_a_id').references(() => users.id).notNull(),
  userBId: uuid('user_b_id').references(() => users.id).notNull(),
  aiBreakdown: text('ai_breakdown'),
  status: matchStatusEnum('status').default('active'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Messages
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  matchId: uuid('match_id').references(() => matches.id).notNull(),
  senderId: uuid('sender_id').references(() => users.id).notNull(),
  content: text('content').notNull(),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Verifications
export const verifications = pgTable('verifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  type: verificationTypeEnum('type').notNull(),
  status: verificationStatusEnum('status').default('pending'),
  verifiedAt: timestamp('verified_at'),
  expiresAt: timestamp('expires_at'),
  data: jsonb('data').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Verification attempts
export const verificationAttempts = pgTable('verification_attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  type: verificationTypeEnum('type').notNull(),
  status: verificationStatusEnum('status').default('pending'),
  faceMatchScore: real('face_match_score'),
  idExtractData: jsonb('id_extract_data').$type<Record<string, any>>(),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

// Subscriptions
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  tier: subscriptionTierEnum('tier').default('free'),
  platform: varchar('platform', { length: 10 }),
  receipt: text('receipt'),
  originalTransactionId: varchar('original_transaction_id', { length: 255 }),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Boosts
export const boosts = pgTable('boosts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  activatedAt: timestamp('activated_at').defaultNow(),
  expiresAt: timestamp('expires_at').notNull(),
});

// Reports
export const reports = pgTable('reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  reporterId: uuid('reporter_id').references(() => users.id).notNull(),
  reportedId: uuid('reported_id').references(() => users.id).notNull(),
  reason: varchar('reason', { length: 50 }).notNull(),
  description: text('description'),
  severity: moderationSeverityEnum('severity'),
  status: varchar('status', { length: 20 }).default('pending'),
  aiTriageScore: real('ai_triage_score'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Moderation actions
export const moderationActions = pgTable('moderation_actions', {
  id: uuid('id').primaryKey().defaultRandom(),
  reportId: uuid('report_id').references(() => reports.id).notNull(),
  moderatorId: uuid('moderator_id').references(() => users.id),
  action: moderationActionEnum('action').notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Blocked users
export const blockedUsers = pgTable('blocked_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  blockerId: uuid('blocker_id').references(() => users.id).notNull(),
  blockedId: uuid('blocked_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Device fingerprints
export const deviceFingerprints = pgTable('device_fingerprints', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  deviceId: varchar('device_id', { length: 255 }).notNull(),
  ip: varchar('ip', { length: 45 }),
  platform: varchar('platform', { length: 20 }),
  isVpn: boolean('is_vpn').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Push notification tokens
export const pushTokens = pgTable('push_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  token: text('token').notNull(),
  platform: varchar('platform', { length: 10 }).notNull(), // 'ios' | 'android' | 'web'
  createdAt: timestamp('created_at').defaultNow(),
  lastUsedAt: timestamp('last_used_at').defaultNow(),
});
