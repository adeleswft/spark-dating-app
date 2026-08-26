-- Spark Dating App - Database Schema
-- Generated from Drizzle ORM schema

-- Enums
CREATE TYPE gender AS ENUM ('male', 'female', 'non-binary', 'other');
CREATE TYPE swipe_direction AS ENUM ('left', 'right', 'super');
CREATE TYPE verification_type AS ENUM ('phone', 'photo', 'id', 'identity');
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE match_status AS ENUM ('active', 'archived');
CREATE TYPE subscription_tier AS ENUM ('free', 'plus', 'elite');
CREATE TYPE moderation_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE moderation_action AS ENUM ('warn', 'restrict', 'suspend', 'ban');
CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin');

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  name VARCHAR(100) NOT NULL,
  dob VARCHAR(10) NOT NULL,
  gender gender NOT NULL,
  bio TEXT,
  photos TEXT[] DEFAULT '{}',
  location JSONB,
  role user_role DEFAULT 'user',
  verified BOOLEAN DEFAULT false,
  photo_verified BOOLEAN DEFAULT false,
  id_verified BOOLEAN DEFAULT false,
  banned BOOLEAN DEFAULT FALSE,
  banned_at TIMESTAMPTZ,
  ban_reason VARCHAR(255),
  suspended BOOLEAN DEFAULT FALSE,
  suspended_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Preferences
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  min_age INTEGER DEFAULT 18,
  max_age INTEGER DEFAULT 50,
  max_distance INTEGER DEFAULT 50,
  gender_preference TEXT[] DEFAULT '{}',
  relationship_goals VARCHAR(20) DEFAULT 'unsure',
  incognito BOOLEAN DEFAULT FALSE,
  show_online_status BOOLEAN DEFAULT TRUE,
  show_distance BOOLEAN DEFAULT TRUE,
  show_last_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Interests
CREATE TABLE user_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  interest VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Embeddings (for AI matching)
CREATE TABLE user_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id),
  embedding JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Swipes
CREATE TABLE swipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swiper_id UUID NOT NULL REFERENCES users(id),
  swiped_id UUID NOT NULL REFERENCES users(id),
  direction swipe_direction NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matches
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id UUID NOT NULL REFERENCES users(id),
  user_b_id UUID NOT NULL REFERENCES users(id),
  ai_breakdown TEXT,
  status match_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id),
  sender_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verifications
CREATE TABLE verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  type verification_type NOT NULL,
  status verification_status DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verification Attempts
CREATE TABLE verification_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  type verification_type NOT NULL,
  status verification_status DEFAULT 'pending',
  face_match_score REAL,
  id_extract_data JSONB,
  reviewed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  tier subscription_tier DEFAULT 'free',
  platform VARCHAR(10),
  receipt TEXT,
  original_transaction_id VARCHAR(255),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Boosts
CREATE TABLE boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Reports
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id),
  reported_id UUID NOT NULL REFERENCES users(id),
  reason VARCHAR(50) NOT NULL,
  description TEXT,
  severity moderation_severity,
  status VARCHAR(20) DEFAULT 'pending',
  ai_triage_score REAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Moderation Actions
CREATE TABLE moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id),
  moderator_id UUID REFERENCES users(id),
  action moderation_action NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blocked Users
CREATE TABLE blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES users(id),
  blocked_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Device Fingerprints
CREATE TABLE device_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  device_id VARCHAR(255) NOT NULL,
  ip VARCHAR(45),
  platform VARCHAR(20),
  is_vpn BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Push Notification Tokens
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  token TEXT NOT NULL,
  platform VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_dob ON users(dob);
CREATE INDEX idx_swipes_swiper ON swipes(swiper_id);
CREATE INDEX idx_swipes_swiped ON swipes(swiped_id);
CREATE INDEX idx_matches_users ON matches(user_a_id, user_b_id);
CREATE INDEX idx_messages_match ON messages(match_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_user_interests_user ON user_interests(user_id);
CREATE INDEX idx_blocked_users_blocker ON blocked_users(blocker_id);
CREATE INDEX idx_push_tokens_user ON push_tokens(user_id);
CREATE INDEX idx_push_tokens_token ON push_tokens(token);
