#!/usr/bin/env node

/**
 * Asset Generator for Play Store Submission
 * 
 * Converts SVGs to PNGs and generates screenshots from HTML mockups.
 * 
 * Prerequisites:
 *   npm install puppeteer
 * 
 * Usage:
 *   node generate-assets.js
 */

const fs = require('fs');
const path = require('path');

const STORE_DIR = __dirname;
const OUTPUT_DIR = path.join(STORE_DIR, 'generated');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('🎨 Spark Dating — Play Store Asset Generator\n');

// ── SVG to PNG conversion ─────────────────────────────────────────

const svgAssets = [
  { file: 'feature-graphic.svg', width: 1024, height: 500 },
  { file: 'icon.svg', width: 512, height: 512 },
  { file: 'adaptive-icon-foreground.svg', width: 1024, height: 1024 },
  { file: 'notification-icon.svg', width: 96, height: 96 },
];

console.log('📋 SVG Assets:');
svgAssets.forEach(a => {
  console.log(`   - ${a.file} → ${a.file.replace('.svg', '.png')} (${a.width}x${a.height})`);
});

// ── Screenshot HTML files ─────────────────────────────────────────

const screenshots = [
  { file: 'screenshots/screenshot-1-discovery.html', name: '01-discovery' },
  { file: 'screenshots/screenshot-2-match.html', name: '02-match' },
  { file: 'screenshots/screenshot-3-chat.html', name: '03-chat' },
  { file: 'screenshots/screenshot-4-compatibility.html', name: '04-compatibility' },
  { file: 'screenshots/screenshot-5-verification.html', name: '05-verification' },
  { file: 'screenshots/screenshot-6-plans.html', name: '06-plans' },
];

console.log('\n📱 Screenshots:');
screenshots.forEach(s => {
  console.log(`   - ${s.file} → ${s.name}.png (1080x1920)`);
});

// ── Store Listing Text ────────────────────────────────────────────

const storeListing = {
  title: 'Spark — AI-Powered Dating',
  shortDescription: 'AI-powered dating that finds your perfect match based on deep compatibility.',
  fullDescription: `Spark uses AI to find your perfect match based on deep compatibility — not just photos. Real connections, powered by real intelligence.

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

Download Spark free and start connecting.`,
  category: 'Dating',
  contentRating: 'Mature 17+',
  contactEmail: 'support@spark.dating',
  privacyPolicyUrl: 'https://spark.dating/privacy',
  website: 'https://spark.dating',
};

console.log('\n📝 Store Listing:');
console.log(`   Title: ${storeListing.title}`);
console.log(`   Short: ${storeListing.shortDescription.substring(0, 60)}...`);
console.log(`   Category: ${storeListing.category}`);
console.log(`   Rating: ${storeListing.contentRating}`);

// ── Data Safety Form ──────────────────────────────────────────────

const dataSafety = {
  dataCollected: [
    'Name', 'Email', 'Date of birth', 'Gender',
    'Photos (user-uploaded)', 'Location (approximate)',
    'Device identifiers', 'Usage data',
  ],
  dataShared: 'No data sold to third parties',
  securityPractices: [
    'Data encrypted in transit (TLS)',
    'Data encrypted at rest',
    'Users can request data deletion',
    'Independent security review',
  ],
};

console.log('\n🔒 Data Safety:');
console.log(`   Collected: ${dataSafety.dataCollected.length} data types`);
console.log(`   Shared: ${dataSafety.dataShared}`);

// ── Instructions ──────────────────────────────────────────────────

console.log('\n' + '═'.repeat(60));
console.log('📋 HOW TO GENERATE PNG ASSETS');
console.log('═'.repeat(60));

console.log(`
1. Install Puppeteer (one-time):
   cd apps/mobile/store-listing
   npm install puppeteer

2. Run this script:
   node generate-assets.js

3. PNGs will be in: generated/
   - feature-graphic.png (1024x500)
   - icon.png (512x512)
   - adaptive-icon-foreground.png (1024x1024)
   - notification-icon.png (96x96)
   - 01-discovery.png (1080x1920)
   - 02-match.png (1080x1920)
   - 03-chat.png (1080x1920)
   - 04-compatibility.png (1080x1920)
   - 05-verification.png (1080x1920)
   - 06-plans.png (1080x1920)

4. Upload to Play Console:
   - Go to https://play.google.com/console
   - Select your app → Store listing
   - Upload icon, feature graphic, and screenshots
   - Fill in title, descriptions, and data safety form
`);

// ── Puppeteer conversion (if available) ───────────────────────────

async function generateWithPuppeteer() {
  let puppeteer;
  try {
    puppeteer = require('puppeteer');
  } catch {
    console.log('⚠️  Puppeteer not installed. Install with: npm install puppeteer');
    console.log('   Then re-run this script.\n');
    return;
  }

  console.log('🚀 Generating PNGs with Puppeteer...\n');

  const browser = await puppeteer.launch({ headless: 'new' });

  // Generate SVG → PNG
  for (const asset of svgAssets) {
    const svgPath = path.join(STORE_DIR, asset.file);
    const pngPath = path.join(OUTPUT_DIR, asset.file.replace('.svg', '.png'));

    if (!fs.existsSync(svgPath)) {
      console.log(`   ⚠️  ${asset.file} not found, skipping`);
      continue;
    }

    const page = await browser.newPage();
    await page.setViewport({ width: asset.width, height: asset.height });

    const svgContent = fs.readFileSync(svgPath, 'utf-8');
    const html = `<!DOCTYPE html><html><head><style>*{margin:0;padding:0;}body{width:${asset.width}px;height:${asset.height}px;}</style></head><body>${svgContent}</body></html>`;

    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.screenshot({ path: pngPath, clip: { x: 0, y: 0, width: asset.width, height: asset.height } });
    await page.close();

    console.log(`   ✅ ${asset.file} → ${path.basename(pngPath)}`);
  }

  // Generate HTML → PNG (screenshots)
  for (const shot of screenshots) {
    const htmlPath = path.join(STORE_DIR, shot.file);
    const pngPath = path.join(OUTPUT_DIR, `${shot.name}.png`);

    if (!fs.existsSync(htmlPath)) {
      console.log(`   ⚠️  ${shot.file} not found, skipping`);
      continue;
    }

    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1920 });

    const fileUrl = 'file://' + htmlPath.replace(/\\/g, '/');
    await page.goto(fileUrl, { waitUntil: 'networkidle0' });
    await page.screenshot({ path: pngPath, clip: { x: 0, y: 0, width: 1080, height: 1920 } });
    await page.close();

    console.log(`   ✅ ${shot.file} → ${shot.name}.png`);
  }

  await browser.close();
  console.log('\n✅ All assets generated in: generated/\n');
}

// Run if puppeteer is available
generateWithPuppeteer().catch(() => {});
