import { device, element, by } from 'detox';
import { tapByText, expectText } from './setup';

describe('Profile & Settings Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  // ── Profile Screen ──────────────────────────────────────────────

  describe('Profile Screen', () => {
    beforeAll(async () => {
      await tapByText('Profile');
    });

    it('should display profile header', async () => {
      await expectText('Profile');
      await expectText('Edit');
    });

    it('should show user info', async () => {
      await expectText('Alex');
      await expectText('28');
      await expectText('Tech enthusiast');
    });

    it('should show interests section', async () => {
      await expectText('Interests');
      await expectText('Technology');
      await expectText('Hiking');
      await expectText('Coffee');
    });

    it('should show verification section', async () => {
      await expectText('Verification Status');
      await expectText('Phone Verified ✓');
      await expectText('Photo Verified');
    });

    it('should show AI Profile Review card', async () => {
      await expectText('AI Profile Review');
      await expectText('Get personalized tips');
    });

    it('should show AI Date Planner card', async () => {
      await expectText('AI Date Planner');
      await expectText('Get AI-suggested date ideas');
    });

    it('should show Sign Out button', async () => {
      await expectText('Sign Out');
    });

    it('should show version footer', async () => {
      await expectText('v1.0.0');
    });
  });

  // ── Edit Profile ────────────────────────────────────────────────

  describe('Edit Profile', () => {
    beforeAll(async () => {
      await tapByText('Edit');
    });

    it('should navigate to edit profile screen', async () => {
      await expectText('Edit Profile');
    });

    it('should show photo grid', async () => {
      await expectText('Photos');
    });

    it('should show bio editor option', async () => {
      await expectText('Bio');
    });

    it('should show interests editor option', async () => {
      await expectText('Interests');
    });

    it('should navigate back', async () => {
      const backBtn = element(by.type('TouchableOpacity')).atIndex(0);
      await backBtn.tap();
      await expectText('Profile');
    });
  });

  // ── Settings Navigation ─────────────────────────────────────────

  describe('Settings Navigation', () => {
    beforeAll(async () => {
      await tapByText('Settings');
    });

    it('should navigate to settings screen', async () => {
      await expectText('Settings');
    });

    it('should show account section', async () => {
      await expectText('Account');
    });

    it('should show notification preferences', async () => {
      await expectText('Notifications');
    });

    it('should show privacy section', async () => {
      await expectText('Privacy');
    });

    it('should show blocked users option', async () => {
      await expectText('Blocked Users');
    });

    it('should navigate to blocked users', async () => {
      await tapByText('Blocked Users');
      await expectText('Blocked Users');
    });

    it('should show empty state when no blocked users', async () => {
      await expectText('No blocked users');
    });

    it('should navigate back to settings', async () => {
      const backBtn = element(by.type('TouchableOpacity')).atIndex(0);
      await backBtn.tap();
      await expectText('Settings');
    });
  });

  // ── Verification Flow ───────────────────────────────────────────

  describe('Verification Navigation', () => {
    beforeAll(async () => {
      await tapByText('Profile');
      await tapByText('Photo Verified');
    });

    it('should navigate to verification screen', async () => {
      await expectText('Verification');
    });

    it('should show photo verification option', async () => {
      await expectText('Photo Verification');
    });

    it('should show ID verification option', async () => {
      await expectText('ID Verification');
    });

    it('should navigate back', async () => {
      const backBtn = element(by.type('TouchableOpacity')).atIndex(0);
      await backBtn.tap();
      await expectText('Profile');
    });
  });
});
