// User types
export interface User {
  id: string;
  email: string;
  phone: string;
  name: string;
  dob: string;
  gender: 'male' | 'female' | 'non-binary' | 'other';
  bio: string;
  photos: string[];
  location: {
    latitude: number;
    longitude: number;
  };
  verified: boolean;
  photoVerified: boolean;
  idVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  minAge: number;
  maxAge: number;
  maxDistance: number;
  genderPreference: ('male' | 'female' | 'non-binary' | 'other')[];
  relationshipGoals: 'casual' | 'serious' | 'friends' | 'unsure';
}

export interface UserProfile extends User {
  preferences: UserPreferences;
  interests: string[];
  compatibilityScore?: number;
  compatibilityReason?: string;
}

// Swipe types
export interface Swipe {
  id: string;
  swiperId: string;
  swipedId: string;
  direction: 'left' | 'right' | 'super';
  createdAt: string;
}

// Match types
export interface Match {
  id: string;
  userAId: string;
  userBId: string;
  userA: User;
  userB: User;
  aiBreakdown: string;
  status: 'active' | 'archived';
  createdAt: string;
}

// Message types
export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  content: string;
  readAt: string | null;
  createdAt: string;
}

// Verification types
export interface Verification {
  id: string;
  userId: string;
  type: 'phone' | 'photo' | 'id' | 'identity';
  status: 'pending' | 'approved' | 'rejected';
  verifiedAt: string | null;
  expiresAt: string | null;
  data: Record<string, any>;
}

// Subscription types
export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: 'free' | 'plus' | 'elite';
  price: number;
  interval: 'month' | 'year';
  features: string[];
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  tier: 'free' | 'plus' | 'elite';
  platform: 'ios' | 'android' | 'web';
  receipt: string;
  expiresAt: string;
  createdAt: string;
}

// AI types
export interface CompatibilityScore {
  score: number;
  reason: string;
  factors: {
    vectorSimilarity: number;
    collaborativeFiltering: number;
    preferenceMatch: number;
    activityRecency: number;
    profileQuality: number;
  };
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
