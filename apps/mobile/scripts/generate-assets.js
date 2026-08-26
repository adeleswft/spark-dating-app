/**
 * Generate placeholder assets for Play Store submission.
 * Run: node scripts/generate-assets.js
 * 
 * For production, replace these with professionally designed assets.
 * Requirements: https://developer.android.com/distribute/google-play/resources/icon-design-specifications
 */

const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');

// Ensure assets directory exists
if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

/**
 * Generate a minimal valid PNG file.
 * Creates a 1x1 green pixel PNG as a placeholder.
 * For real assets, use a design tool or image generation library.
 */
function generatePlaceholderPNG(filename, width, height, description) {
  // Create a minimal SVG that can be converted
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#0A0A0A"/>
  <circle cx="${width/2}" cy="${height/2 - 20}" r="${Math.min(width, height) * 0.2}" fill="#00E676"/>
  <text x="${width/2}" y="${height/2 + Math.min(width, height) * 0.15}" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="${Math.min(width, height) * 0.08}" font-weight="bold">⚡</text>
  <text x="${width/2}" y="${height/2 + Math.min(width, height) * 0.3}" text-anchor="middle" fill="#00E676" font-family="Arial, sans-serif" font-size="${Math.min(width, height) * 0.06}" font-weight="bold">SPARK</text>
</svg>`;

  const filePath = path.join(ASSETS_DIR, filename);
  fs.writeFileSync(filePath, svg);
  console.log(`✅ Created ${filename} (${width}x${height}) — ${description}`);
  console.log(`   ⚠️  This is a placeholder SVG. Convert to PNG before publishing.`);
}

// Generate required assets
console.log('\n🔥 Spark Dating — Asset Generator\n');
console.log('Generating placeholder assets...\n');

generatePlaceholderPNG('icon.svg', 1024, 1024, 'App icon (convert to PNG)');
generatePlaceholderPNG('adaptive-icon.svg', 1024, 1024, 'Adaptive icon foreground (convert to PNG)');
generatePlaceholderPNG('splash-icon.svg', 200, 200, 'Splash screen icon (convert to PNG)');
generatePlaceholderPNG('notification-icon.svg', 96, 96, 'Notification icon (convert to PNG)');
generatePlaceholderPNG('feature-graphic.svg', 1024, 500, 'Play Store feature graphic (convert to PNG)');

console.log('\n📋 Next steps:');
console.log('1. Convert SVG files to PNG using a design tool (Figma, Canva, etc.)');
console.log('2. Replace placeholder designs with your actual branding');
console.log('3. Ensure adaptive icon foreground has transparent background');
console.log('4. Test icons on actual devices before publishing\n');

console.log('📊 Play Store Requirements:');
console.log('- App icon: 512x512 PNG (required)');
console.log('- Adaptive icon: 1024x1024 PNG foreground (required for Android)');
console.log('- Feature graphic: 1024x500 PNG (required)');
console.log('- Screenshots: 2-8 phone screenshots (required)');
console.log('- Notification icon: 96x96 PNG, white on transparent\n');
