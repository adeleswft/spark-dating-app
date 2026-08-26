# Spark Dating — Play Store Deployment Guide

## Prerequisites

1. **Google Play Developer Account** ($25 one-time fee)
   - https://play.google.com/console/signup

2. **EAS CLI** installed globally
   ```bash
   npm install -g eas-cli
   ```

3. **Expo Account** (free)
   ```bash
   eas login
   ```

---

## Step 1: Configure EAS Build

### Link your project to EAS
```bash
cd apps/mobile
eas build:configure
```

This creates `eas.json` (already configured in this project).

### Set up Android build credentials

For the first build, EAS will generate a new keystore:
```bash
eas credentials
```

Select:
- Platform: Android
- Action: Set up a new keystore
- Keystore password: (generate a strong password)
- Key alias: spark-key
- Key password: (generate a strong password)

**⚠️ IMPORTANT**: Save these credentials securely! You cannot recover a lost keystore.

---

## Step 2: Create Production Build

### Build the AAB (Android App Bundle)
```bash
eas build --platform android --profile production
```

This will:
1. Build your app in the cloud
2. Generate a signed `.aab` file
3. Give you a build URL to download

The build typically takes 10-20 minutes.

---

## Step 3: Test the Build

### Download and test on a physical device
1. Go to the build URL from Step 2
2. Download the `.aab` file
3. Install on an Android device (use Google Play Internal Testing or adb)

### Test checklist:
- [ ] App launches correctly
- [ ] Splash screen shows with correct colors
- [ ] All screens navigate properly
- [ ] Camera permission works
- [ ] Location permission works
- [ ] Push notifications work
- [ ] Login/Register flow works
- [ ] Subscription flow works (test mode)

---

## Step 4: Prepare Store Listing

### Required assets (in `store-listing/` folder):
1. **Screenshots** (2-8 required):
   - Phone: 1080x1920 or 1080x2340
   - Take screenshots of key features

2. **Feature Graphic** (required):
   - 1024x500 PNG
   - Already generated as placeholder in `assets/`

3. **App Icon** (required):
   - 512x512 PNG (already generated as placeholder)

### Store listing text (copy from `store-listing/README.md`):
- App name: Spark — AI-Powered Dating
- Short description
- Full description
- Privacy policy URL

---

## Step 5: Submit to Play Store

### Option A: Manual submission
1. Go to https://play.google.com/console
2. Click "Create app"
3. Fill in store listing details
4. Upload screenshots and graphics
5. Set pricing (Free) and distribution countries
6. Complete content rating questionnaire
7. Complete data safety form
8. Upload the `.aab` file from EAS build
9. Submit for review

### Option B: EAS Submit (automated)
```bash
eas submit --platform android --profile production
```

This requires a Google Service Account:
1. Go to https://console.cloud.google.com
2. Create a project or use existing
3. Enable Google Play Developer API
4. Create a service account with Play Console permissions
5. Download the JSON key file
6. Save as `google-service-account.json` in the mobile app root
7. Run the submit command

---

## Step 6: Review Process

- **Initial review**: 1-7 days (usually 1-3 days)
- **Policy violations**: Check email for any issues
- **Staged rollout**: Start with 10% of users, increase gradually

---

## Production Checklist

### Pre-launch:
- [ ] All placeholder assets replaced with real designs
- [ ] Privacy policy URL is live and accessible
- [ ] Terms of service URL is live and accessible
- [ ] No debug/test code in production build
- [ ] API URLs point to production servers
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Analytics configured (if using)

### App Store:
- [ ] App name and description are compelling
- [ ] Screenshots show key features clearly
- [ ] Feature graphic is professional
- [ ] Content rating is accurate
- [ ] Data safety form is complete
- [ ] Target audience is set correctly

### Post-launch:
- [ ] Monitor crash reports
- [ ] Respond to user reviews
- [ ] Plan updates based on feedback
- [ ] Set up staged rollout (10% → 50% → 100%)

---

## Troubleshooting

### Build fails
- Check EAS build logs for errors
- Ensure all dependencies are installed
- Verify `app.json` configuration

### Keystore issues
- Never lose your keystore! Android requires the same keystore for all updates
- Use `eas credentials` to manage keystores
- Consider using EAS Managed credentials

### Rejected by Play Store
- Read the rejection reason carefully
- Common issues: privacy policy, content rating, data safety
- Fix issues and resubmit

---

## Environment Variables

For production builds, set these in EAS or `.env.production`:
```
EXPO_PUBLIC_API_URL=https://api.sparkdating.com
DATABASE_URL=postgres://...
JWT_SECRET=your-production-secret
```

---

## Next Steps After Launch

1. **Monitor**: Set up crash reporting and analytics
2. **Iterate**: Release updates based on user feedback
3. **Scale**: Optimize infrastructure for growing user base
4. **Expand**: Consider iOS App Store submission
