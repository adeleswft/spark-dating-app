import { device, element, by } from 'detox';
import { tapByText, expectText } from './setup';

describe('Subscription & Purchase Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  // ── Subscription Screen ─────────────────────────────────────────

  describe('Subscription Screen', () => {
    beforeAll(async () => {
      // Navigate to profile then subscription
      // Tab bar: profile is typically the last tab
      await tapByText('Profile');
      // Scroll to find and tap subscription card
      await tapByText('Upgrade to Spark+');
    });

    it('should display subscription plans', async () => {
      await expectText('Choose Your Plan');
      await expectText('Free');
      await expectText('Spark+');
      await expectText('Spark Elite');
    });

    it('should show monthly pricing', async () => {
      await expectText('$5.99');
      await expectText('$10.99');
    });

    it('should show monthly/annual toggle', async () => {
      await expectText('Monthly');
      await expectText('Annual');
    });

    it('should show feature lists for each plan', async () => {
      await expectText('Unlimited matches');
      await expectText('Priority profile placement');
    });

    it('should show MOST POPULAR badge', async () => {
      await expectText('MOST POPULAR');
    });

    it('should show CURRENT badge on free plan', async () => {
      await expectText('CURRENT');
    });

    it('should toggle to annual billing', async () => {
      await tapByText('Annual');
      // Should show annual price and savings
      await expectText('SAVE 30%');
    });

    it('should toggle back to monthly', async () => {
      await tapByText('Monthly');
    });

    it('should show restore purchases button', async () => {
      await expectText('Restore Purchases');
    });

    it('should show terms disclaimer', async () => {
      await expectText('Subscriptions auto-renew');
      await expectText('All purchases are final');
    });

    it('should navigate back', async () => {
      const backBtn = element(by.type('TouchableOpacity')).atIndex(0);
      await backBtn.tap();
    });
  });

  // ── Boost Purchase Sheet ────────────────────────────────────────

  describe('Boost Purchase', () => {
    beforeAll(async () => {
      await tapByText('Profile');
    });

    it('should display boost count card', async () => {
      await expectText('Boosts');
    });

    it('should open boost purchase sheet on tap', async () => {
      await tapByText('Boosts');
      await expectText('Buy Boosts');
    });

    it('should show boost product options', async () => {
      await expectText('1 Boost');
      await expectText('5 Boosts');
      await expectText('10 Boosts');
    });

    it('should show pricing for each option', async () => {
      await expectText('$2.99');
      await expectText('$11.99');
      await expectText('$19.99');
    });

    it('should show savings labels', async () => {
      await expectText('Save 20%');
      await expectText('Save 33%');
    });

    it('should select middle tier by default', async () => {
      // 5 Boosts should be selected
      await expectText('Buy 5 Boosts');
    });

    it('should allow selecting different tier', async () => {
      await tapByText('10 Boosts');
      await expectText('Buy 10 Boosts');
    });

    it('should show cancel button', async () => {
      await expectText('Cancel');
    });

    it('should close on cancel', async () => {
      await tapByText('Cancel');
      await expectText('Boosts');
    });
  });

  // ── Super Like Purchase Sheet ───────────────────────────────────

  describe('Super Like Purchase', () => {
    it('should display super like count card', async () => {
      await expectText('Super Sparks');
    });

    it('should open super like purchase sheet on tap', async () => {
      await tapByText('Super Sparks');
      await expectText('Buy Super Sparks');
    });

    it('should show super like product options', async () => {
      await expectText('5 Super Sparks');
      await expectText('15 Super Sparks');
      await expectText('30 Super Sparks');
    });

    it('should show pricing', async () => {
      await expectText('$3.99');
      await expectText('$11.99');
      await expectText('$19.99');
    });

    it('should close on cancel', async () => {
      await tapByText('Cancel');
      await expectText('Super Sparks');
    });
  });

  // ── Dev Mode Controls ───────────────────────────────────────────

  describe('Dev Mode Controls', () => {
    it('should show dev mode banner', async () => {
      await expectText('Dev Mode');
    });

    it('should unlock Spark+ tier', async () => {
      await tapByText('Spark+');
      // Premium card should now show active
      await expectText('ACTIVE');
    });

    it('should unlock Elite tier', async () => {
      await tapByText('Elite');
    });

    it('should add boosts via dev button', async () => {
      await tapByText('+5 Boosts');
      // Boost count should increase
      await expectText('5');
    });

    it('should add super likes via dev button', async () => {
      await tapByText('+10 Sparks');
      await expectText('10');
    });
  });
});
