# Spark Dating — Play Store Listing

## Quick Start

1. Generate PNG assets: `node generate-assets.js`
2. Upload to Play Console → Store listing
3. Fill in text fields below

---

## Store Listing Text

### App Name (30 chars max)
```
Spark — AI-Powered Dating
```

### Short Description (80 chars max)
```
AI-powered dating that finds your perfect match based on deep compatibility.
```

### Full Description (4000 chars max)
```
Spark uses AI to find your perfect match based on deep compatibility — not just photos. Real connections, powered by real intelligence.

Why Spark?

🔍 AI Compatibility Scoring
Every match comes with a breakdown of why you click. Vector embeddings, collaborative filtering, and preference matching — all working together.

🛡️ Multi-Layer Verification
Phone, photo with liveness detection, and ID verification keep catfish out. Verified users get priority in discovery.

💬 AI Conversation Starters
Never stare at a blank chat again. Spark generates ice-breakers based on your shared interests and profile details.

❤️ Curated Daily Matches
Quality over quantity. Get 10–20 highly compatible matches per day instead of endless swiping.

📅 AI Date Planner
Spark suggests date ideas based on your mutual interests, location, and budget. Premium feature for Elite users.

⚡ AI-Powered Safety
Real-time message scanning detects scam patterns and harassment before they reach you.

Plans:
• Free — 10 curated matches/day, basic features
• Spark+ ($5.99/mo) — Unlimited matches, advanced filters, 5 Super Sparks/day
• Spark Elite ($10.99/mo) — Priority placement, incognito mode, AI Date Planner, unlimited Super Sparks

Download Spark free and start connecting.
```

### Category
```
Dating
```

### Contact Email
```
support@spark.dating
```

### Website
```
https://spark.dating
```

### Privacy Policy URL
```
https://spark.dating/privacy
```

---

## Graphics Assets (Upload to Play Console)

### App Icon (required)
- **icon.png** — 512x512 PNG
- Generated from: `icon.svg`

### Adaptive Icon (required)
- **adaptive-icon-foreground.png** — 1024x1024 PNG
- Background color: `#0D1F15` (set in app.json)
- Safe zone: center 66% (outer 17% clipped on each side)
- Generated from: `adaptive-icon-foreground.svg`

### Feature Graphic (required)
- **feature-graphic.png** — 1024x500 PNG
- Generated from: `feature-graphic.svg`

### Screenshots (required, 2-8 images)
- Size: 1080x1920 PNG (9:16 aspect ratio)

| # | File | Description |
|---|------|-------------|
| 1 | 01-discovery.png | Discovery/swipe interface with compatibility badge |
| 2 | 02-match.png | "It's a Match!" celebration screen |
| 3 | 03-chat.png | Chat with AI conversation starters |
| 4 | 04-compatibility.png | 5-dimension compatibility breakdown |
| 5 | 05-verification.png | Verification badges and trust indicators |
| 6 | 06-plans.png | Subscription plans comparison |

### Notification Icon
- **notification-icon.png** — 96x96 PNG, white on transparent
- Generated from: `notification-icon.svg`

---

## Content Rating (IARC)

### Category
Dating

### Age Rating
Mature 17+

### Content Descriptors
- Users can interact with strangers
- User-generated content (photos, messages)
- In-app purchases
- Location sharing

---

## Data Safety Form

### Data Collected
| Data Type | Purpose |
|-----------|----------|
| Name | Profile display |
| Email | Account authentication |
| Date of birth | Age verification |
| Gender | Matching preferences |
| Photos | Profile content |
| Location | Nearby matches |
| Device identifiers | Fraud prevention |
| Usage data | Analytics |

### Data Sharing
- ❌ No data sold to third parties
- ✅ Analytics via third-party SDK

### Security Practices
- ✅ Data encrypted in transit (TLS)
- ✅ Data encrypted at rest
- ✅ Users can request data deletion
- ✅ Independent security review

---

## Release Notes

### v1.0.0 (Initial Release)
```
• AI-powered compatibility matching across 5 dimensions
• Multi-layer verification (phone, photo, ID)
• Real-time messaging with AI conversation starters
• Curated daily matches (10-20 per day)
• AI Date Planner for premium users
• AI-powered safety and scam detection
• Subscription plans (Free, Spark+, Spark Elite)
• Push notifications for matches and messages
• Profile review and optimization tips
• Incognito mode for Elite users
```

---

## Asset Generation

### Prerequisites
```bash
cd apps/mobile/store-listing
npm install puppeteer
```

### Generate All Assets
```bash
node generate-assets.js
```

### Output
All PNGs will be in `generated/`:
- `feature-graphic.png` (1024x500)
- `icon.png` (512x512)
- `adaptive-icon-foreground.png` (1024x1024)
- `notification-icon.png` (96x96)
- `01-discovery.png` through `06-plans.png` (1080x1920)
