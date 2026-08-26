import { device, element, by } from 'detox';
import { tapByText, expectText } from './setup';

describe('Onboarding Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  // ── Welcome Screen ──────────────────────────────────────────────

  describe('Welcome Screen', () => {
    it('should display welcome screen with branding', async () => {
      await expectText('Welcome to');
      await expectText('⚡ Spark');
    });

    it('should display app features', async () => {
      await expectText('AI-Powered Matching');
    });

    it('should have a Get Started button', async () => {
      await tapByText('Get Started');
    });
  });

  // ── Photo Upload Screen ─────────────────────────────────────────

  describe('Photo Upload Screen', () => {
    it('should display photo upload screen', async () => {
      await expectText('Add Your Photos');
    });

    it('should show progress indicator', async () => {
      // OnboardingProgress should be visible
      await expectText('Step');
    });

    it('should show photo slots', async () => {
      // Should show at least one photo add button
      await expectText('0/9');
    });

    it('should show photo tips', async () => {
      await expectText('First photo should be a clear face shot');
    });

    it('should allow skipping to next step', async () => {
      await tapByText('Next');
    });
  });

  // ── Bio Screen ──────────────────────────────────────────────────

  describe('Bio Screen', () => {
    it('should display bio editor', async () => {
      await expectText('About You');
    });

    it('should show name input field', async () => {
      await expectText('Your Name');
    });

    it('should show bio text area', async () => {
      await expectText('Your Bio');
    });

    it('should show character count', async () => {
      await expectText('0/500');
    });

    it('should allow typing a name', async () => {
      await element(by.label('Your name')).typeText('Test User');
      await expectText('10/500');
    });

    it('should allow typing a bio', async () => {
      await element(by.label('Tell people about yourself...')).typeText('Tech enthusiast and coffee lover');
    });

    it('should navigate to next step', async () => {
      await tapByText('Next');
    });
  });

  // ── Interests Screen ────────────────────────────────────────────

  describe('Interests Screen', () => {
    it('should display interest picker', async () => {
      await expectText('Pick Your Interests');
    });

    it('should show interest categories', async () => {
      await expectText('Sports & Fitness');
      await expectText('Food & Drink');
      await expectText('Tech & Gaming');
    });

    it('should show max interests limit', async () => {
      await expectText('0/15');
    });

    it('should allow selecting interests', async () => {
      await tapByText('Hiking');
      await tapByText('Coffee');
      await tapByText('Photography');
      await expectText('3/15');
    });

    it('should allow deselecting interests', async () => {
      await tapByText('Hiking');
      await expectText('2/15');
      // Re-select
      await tapByText('Hiking');
      await expectText('3/15');
    });

    it('should navigate to next step', async () => {
      await tapByText('Next');
    });
  });

  // ── Preferences Screen ──────────────────────────────────────────

  describe('Preferences Screen', () => {
    it('should display preferences screen', async () => {
      await expectText('Your Preferences');
    });

    it('should show age range controls', async () => {
      await expectText('Age Range');
      await expectText('18');
      await expectText('50');
    });

    it('should show distance control', async () => {
      await expectText('Maximum Distance');
      await expectText('50 mi');
    });

    it('should show relationship goals', async () => {
      await expectText('Looking For');
      await expectText('Something Casual');
      await expectText('Serious Relationship');
    });

    it('should navigate to completion', async () => {
      await tapByText('Next');
    });
  });

  // ── Completion Screen ───────────────────────────────────────────

  describe('Completion Screen', () => {
    it('should display completion screen', async () => {
      await expectText("You're All Set!");
    });

    it('should show summary stats', async () => {
      await expectText('Photos');
      await expectText('Bio');
      await expectText('Interests');
    });

    it('should have start swiping button', async () => {
      await tapByText('START SWIPING');
    });

    it('should navigate to discover tab', async () => {
      await expectText('🔥 Spark');
      await expectText('2 miles away');
    });
  });
});
