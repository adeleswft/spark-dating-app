# 🔥 Spark — AI-Powered Dating App

A full-stack dating platform that uses AI to match people on deep compatibility — not just photos.

## 🏗️ Architecture

```
spark/
├── apps/
│   ├── mobile/              # Expo React Native app (28 screens)
│   │   ├── app/             # File-based routing (auth, onboarding, tabs)
│   │   ├── services/        # API client, WebSocket, push notifications, photo upload
│   │   ├── stores/          # Zustand state (auth, onboarding, IAP, notifications)
│   │   ├── hooks/           # Custom hooks (realtime messages, notifications)
│   │   └── e2e/             # Detox end-to-end tests
│   └── web/                 # Next.js landing page + admin dashboard (14 pages)
│       └── app/
│           ├── admin/       # Dashboard, users, reports, analytics, payments, team
│           ├── privacy/     # Privacy Policy
│           ├── terms/       # Terms of Service
│           ├── norefund/    # No Refund Policy
│           ├── guidelines/  # Community Guidelines
│           └── status/      # System health monitoring
├── packages/
│   ├── api/                 # Hono REST API + WebSocket server (13 route modules)
│   │   ├── src/routes/      # auth, profiles, swipes, matches, messages, admin, upload...
│   │   ├── src/middleware/   # JWT auth, admin auth, rate limiting
│   │   ├── src/services/    # AI client, push notifications, moderation, analytics
│   │   ├── src/db/          # Drizzle ORM schema, migrations, seed
│   │   └── src/ws/          # WebSocket server (real-time messaging)
│   ├── ai/                  # Python FastAPI AI service
│   │   └── src/
│   │       ├── matching/    # AI compatibility scoring engine
│   │       ├── embeddings/  # Vector embedding generator
│   │       ├── explanations/# AI match explanation generator
│   │       └── moderation/  # Content moderation (scam/harassment detection)
│   └── shared/              # Shared TypeScript types & constants
├── docker-compose.yml       # PostgreSQL + Redis
├── start-api.js             # API launcher script
└── .env.example             # Environment variables template
```

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start database
docker-compose up -d

# 3. Configure environment
cp .env.example .env
# Edit .env with your settings

# 4. Seed the database
npx tsx packages/api/src/db/seed.ts

# 5. Start the API (port 3001)
node start-api.js

# 6. Start the AI service (port 8000)
cd packages/ai && pip install -r requirements.txt && uvicorn src.main:app --reload

# 7. Start the mobile app
cd apps/mobile && npx expo start

# 8. Start the web app
cd apps/web && npx next dev
```

**Admin login:** `admin@spark.dating` / `admin123`

## 📱 Features

### User-Facing
- **AI-Powered Matching** — Compatibility scoring across 5 dimensions (interests, lifestyle, values, location, preferences)
- **Smart Discovery** — AI-ranked profiles with compatibility percentages
- **Real-Time Messaging** — WebSocket-powered chat with typing indicators and read receipts
- **Push Notifications** — Match, message, and super like notifications
- **Photo Upload** — Camera/gallery photo picker with server-side storage
- **Multi-Step Onboarding** — Photos → Bio → Interests → Preferences
- **Profile Editing** — Update name, bio, photos, and interests
- **Verification System** — Photo verification, ID verification with AI analysis
- **Subscription Plans** — Free, Spark+ ($5.99/mo), Spark Elite ($10.99/mo)
- **In-App Purchases** — React Native IAP with server-side sync
- **Password Reset** — Token-based flow with email verification

### Admin Dashboard
- **Real-Time Dashboard** — KPIs, weekly activity charts, subscription breakdown
- **User Management** — Search, filter, view details, ban/suspend users
- **Reports System** — Review user reports with severity/status filtering
- **Payments** — View all subscription records with tier breakdown
- **Analytics** — User growth, match/message stats, verification rates
- **Team Management** — Super admins can promote/demote other admins
- **Role-Based Access** — User → Admin → Super Admin hierarchy
- **Login with Auth Guard** — JWT-based admin authentication

### Safety & Moderation
- **AI Content Moderation** — Real-time message scanning for scams and harassment
- **Pattern Matching** — Regex-based detection as fallback when AI is offline
- **Message Blocking** — Critical-severity messages blocked before delivery
- **Report System** — Users can report; admins review with severity levels

### Platform
- **REST API** — 13 route modules with JWT auth and rate limiting
- **WebSocket Server** — Real-time messaging, typing indicators, match broadcasts
- **Push Notifications** — Expo push notifications via shared service
- **Photo Upload** — Multipart file upload with UUID naming
- **Analytics Tracking** — Event buffering with predefined event helpers
- **Admin Role System** — `user`, `admin`, `super_admin` with middleware gating

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | Expo SDK 52+, React Native, Expo Router, Zustand, React Native Paper |
| Web | Next.js, React |
| API | Node.js, Hono, Drizzle ORM, PostgreSQL, WebSocket (ws) |
| AI | Python, FastAPI, OpenAI GPT-4o-mini, scikit-learn |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Notifications | Expo Push Notifications |
| Payments | React Native IAP |

## 🧪 Testing

```bash
# API tests (requires Docker/Postgres)
cd packages/api && npx vitest run

# API tests (skip if no DB — runs pattern checks only)
cd packages/api && npx vitest run

# Mobile e2e tests (requires Detox + simulator)
cd apps/mobile && npx detox test

# TypeScript checks
cd packages/api && npx tsc --noEmit
cd apps/mobile && npx tsc --noEmit
cd apps/web && npx next build
```

## 🚢 Deployment

### Play Store
```bash
cd apps/mobile
eas login
eas build -p android --profile production
eas submit -p android --profile production
```

See `apps/mobile/DEPLOY.md` for full deployment guide.

### API Server
```bash
# Docker
docker-compose up -d
node start-api.js

# Or with PM2
pm2 start start-api.js --name spark-api
```

## 📊 Database Schema

Key tables: `users`, `user_preferences`, `user_interests`, `swipes`, `matches`, `messages`, `subscriptions`, `verifications`, `reports`, `moderation_actions`

See `packages/api/src/db/schema.ts` for full schema.

## 📄 Legal Pages

- [Privacy Policy](/privacy) — Data collection, AI processing, user rights
- [Terms of Service](/terms) — Eligibility, conduct, subscriptions, liability
- [No Refund Policy](/norefund) — All sales final, cancellation instructions
- [Community Guidelines](/guidelines) — Authenticity, respect, safety, enforcement
- [System Status](/status) — Real-time service health monitoring

## 📝 License

MIT
