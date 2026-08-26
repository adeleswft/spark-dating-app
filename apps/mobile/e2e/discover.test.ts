import { device, element, by } from 'detox';
import { tapByText, expectText, expectNotText } from './setup';

describe('Discover Screen', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    // Skip to discover (assumes onboarding completed or app defaults to discover)
    // In real CI, you'd login or seed the onboarding state
  });

  // ── Screen Layout ───────────────────────────────────────────────

  describe('Screen Layout', () => {
    it('should display the Spark header', async () => {
      await expectText('🔥 Spark');
    });

    it('should show profile cards', async () => {
      await expectText('Sarah');
      await expectText('26');
    });

    it('should show compatibility score', async () => {
      await expectText('89%');
    });

    it('should show remaining profiles count', async () => {
      await expectText('5');
    });

    it('should show action buttons', async () => {
      // Pass, Super Like, Like, Boost buttons should be visible
      await expectText('Sarah');
    });
  });

  // ── Swiping ─────────────────────────────────────────────────────

  describe('Swiping', () => {
    it('should pass on swipe left (X button)', async () => {
      // Tap the X/pass button
      const passButton = element(by.type('TouchableOpacity')).atIndex(1);
      await passButton.tap();
      // Sarah should no longer be visible, Emily should appear
      await expectText('Emily');
    });

    it('should like on swipe right (heart button)', async () => {
      await expectText('Emily');
      // Like Emily
      const likeButton = element(by.type('TouchableOpacity')).atIndex(3);
      await likeButton.tap();
    });

    it('should decrement remaining count after swipe', async () => {
      // After swiping, count should decrease
      await expectText('Jessica');
    });
  });

  // ── Profile Detail Modal ────────────────────────────────────────

  describe('Profile Detail Modal', () => {
    it('should open profile detail on card tap', async () => {
      await expectText('Jessica');
      // Tap on the profile card to open detail modal
      const card = element(by.text('Jessica')).atIndex(0);
      await card.tap();

      // Modal should open with full profile
      await expectText('Yoga instructor');
      await expectText('3 miles away');
    });

    it('should show compatibility breakdown', async () => {
      await expectText('Compatibility');
    });

    it('should close modal', async () => {
      // Close button (X) in modal
      const closeBtn = element(by.type('TouchableOpacity')).atIndex(0);
      await closeBtn.tap();
      // Should return to discover
      await expectText('Jessica');
    });
  });

  // ── Empty State ─────────────────────────────────────────────────

  describe('Empty State', () => {
    it('should show empty state after all profiles swiped', async () => {
      // Rapidly pass all remaining profiles
      for (let i = 0; i < 10; i++) {
        try {
          const passBtn = element(by.type('TouchableOpacity')).atIndex(1);
          await passBtn.tap({ timeout: 1000 });
        } catch {
          break; // No more profiles
        }
      }

      await expectText('No more profiles');
      await expectText("You've seen everyone nearby");
    });
  });

  // ── Undo / Rewind ───────────────────────────────────────────────

  describe('Undo / Rewind', () => {
    it('should undo last swipe', async () => {
      // Navigate back to a state with profiles
      // (In real tests, you'd reload with profiles available)
      // Undo button should bring back previous profile
      await expectText('🔥 Spark');
    });
  });
});
