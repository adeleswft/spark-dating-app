// App constants
export const APP_NAME = 'Spark';
export const APP_VERSION = '1.0.0';

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    VERIFY_PHONE: '/auth/verify-phone',
    REFRESH_TOKEN: '/auth/refresh',
  },
  PROFILES: {
    GET: '/profiles',
    UPDATE: '/profiles',
    UPLOAD_PHOTO: '/profiles/photos',
  },
  SWIPES: {
    CREATE: '/swipes',
  },
  MATCHES: {
    LIST: '/matches',
    GET: '/matches/:id',
  },
  MESSAGES: {
    LIST: '/matches/:matchId/messages',
    SEND: '/matches/:matchId/messages',
  },
  VERIFICATION: {
    PHOTO_REQUEST: '/verification/photo',
    PHOTO_SUBMIT: '/verification/photo/submit',
    ID_REQUEST: '/verification/id',
    ID_SUBMIT: '/verification/id/submit',
  },
  SUBSCRIPTIONS: {
    PLANS: '/subscriptions/plans',
    CREATE: '/subscriptions',
    GET: '/subscriptions',
  },
} as const;

// Matching constants
export const MATCHING_WEIGHTS = {
  VECTOR_SIMILARITY: 0.35,
  COLLABORATIVE_FILTERING: 0.25,
  PREFERENCE_MATCH: 0.20,
  ACTIVITY_RECENCY: 0.10,
  PROFILE_QUALITY: 0.10,
} as const;

// Free tier limits
export const FREE_TIER = {
  DAILY_MATCHES: 10,
  SUPER_SPARKS_PER_DAY: 1,
  BOOSTS_PER_WEEK: 0,
} as const;

// Premium tier limits
export const PLUS_TIER = {
  DAILY_MATCHES: -1, // unlimited
  SUPER_SPARKS_PER_DAY: 5,
  BOOSTS_PER_WEEK: 1,
} as const;

export const ELITE_TIER = {
  DAILY_MATCHES: -1,
  SUPER_SPARKS_PER_DAY: -1,
  BOOSTS_PER_WEEK: 3,
} as const;

// Subscription pricing
export const SUBSCRIPTION_PRICING = {
  PLUS_MONTHLY: 5.99,
  PLUS_ANNUAL: 50.39, // 30% discount
  ELITE_MONTHLY: 10.99,
  ELITE_ANNUAL: 92.39, // 30% discount
} as const;

// IAP pricing
export const IAP_PRICING = {
  BOOST: 2.99,
  SUPER_SPARK: 1.49,
  REWIND: 0.99,
  AI_DATE_IDEAS: 1.99,
} as const;

// Verification tiers
export const VERIFICATION_TIERS = {
  PHONE: 'phone',
  PHOTO: 'photo',
  ID: 'id',
  IDENTITY: 'identity',
} as const;

// Moderation severity levels
export const MODERATION_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

// Theme colors — Greenish-Black
export const COLORS = {
  // Core
  PRIMARY: '#00E676',
  PRIMARY_CONTAINER: '#1B3A2A',
  SECONDARY: '#00BFA5',
  SECONDARY_CONTAINER: '#1A3330',

  // Feedback
  SUCCESS: '#00E676',
  WARNING: '#FFD600',
  ERROR: '#FF5252',

  // Backgrounds
  BACKGROUND: '#0A0A0A',
  SURFACE: '#141414',
  SURFACE_ELEVATED: '#1C1C1C',

  // Text
  TEXT_PRIMARY: '#FFFFFF',
  TEXT_SECONDARY: '#A0A0A0',
  TEXT_DISABLED: '#555555',

  // Accents
  ACCENT_GREEN: '#00E676',
  ACCENT_TEAL: '#00BFA5',
  ACCENT_LIME: '#76FF03',
  ACCENT_AMBER: '#FFD600',

  // Card / border
  BORDER: '#2A2A2A',
  BORDER_LIGHT: '#333333',
} as const;
