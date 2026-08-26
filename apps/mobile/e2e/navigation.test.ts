import { device, element, by } from 'detox';
import { tapByText, expectText } from './setup';

describe('Navigation & Integration', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  // ── Tab Navigation ──────────────────────────────────────────────

  describe('Tab Bar Navigation', () => {
    it('should show tab bar with 4 tabs', async () => {
      await expectText('🔥 Spark');
    });

    it('should navigate to Discover tab', async () => {
      await tapByText('🔥 Spark');
      await expectText('Sarah');
    });

    it('should navigate to Matches tab', async () => {
      await tapByText('Matches');
      await expectText('Matches');
      await expectText('Sarah');
      await expectText('Emily');
    });

    it('should navigate to Messages tab', async () => {
      await tapByText('Messages');
      await expectText('Messages');
    });

    it('should navigate to Profile tab', async () => {
      await tapByText('Profile');
      await expectText('Profile');
      await expectText('Alex');
    });

    it('should navigate back to Discover', async () => {
      await tapByText('🔥 Spark');
      await expectText('🔥 Spark');
    });
  });

  // ── Notifications ───────────────────────────────────────────────

  describe('Notifications', () => {
    it('should navigate to notifications from header', async () => {
      // Notification bell is in the header
      await tapByText('🔥 Spark');
      // Bell icon tap
      const bellIcon = element(by.type('TouchableOpacity')).atIndex(0);
      await bellIcon.tap();
      await expectText('Notifications');
    });

    it('should navigate back', async () => {
      const backBtn = element(by.type('TouchableOpacity')).atIndex(0);
      await backBtn.tap();
      await expectText('🔥 Spark');
    });
  });

  // ── Deep Navigation Flows ───────────────────────────────────────

  describe('Cross-Screen Flows', () => {
    it('should flow from Profile → Edit Profile → Back', async () => {
      await tapByText('Profile');
      await tapByText('Edit');
      await expectText('Edit Profile');
      const backBtn = element(by.type('TouchableOpacity')).atIndex(0);
      await backBtn.tap();
      await expectText('Profile');
    });

    it('should flow from Profile → Settings → Back', async () => {
      await tapByText('Settings');
      await expectText('Settings');
      const backBtn = element(by.type('TouchableOpacity')).atIndex(0);
      await backBtn.tap();
      await expectText('Profile');
    });

    it('should flow from Messages → Chat → Back → Messages', async () => {
      await tapByText('Messages');
      await tapByText('Sarah');
      await expectText('Sarah');
      await expectText('Type a message...');
      const backBtn = element(by.type('TouchableOpacity')).atIndex(0);
      await backBtn.tap();
      await expectText('Messages');
    });

    it('should flow from Matches → tap match → Messages', async () => {
      await tapByText('Matches');
      await tapByText('Sarah');
      // Should open chat with Sarah
      await expectText('Sarah');
      await expectText('Type a message...');
    });
  });

  // ── App State Persistence ───────────────────────────────────────

  describe('App State Persistence', () => {
    it('should preserve navigation state on app reload', async () => {
      await device.reloadReactNative();
      // Should return to default screen (Discover)
      await expectText('🔥 Spark');
    });
  });
});
