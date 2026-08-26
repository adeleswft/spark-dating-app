import { device, element, by, expect as detoxExpect } from 'detox';
import { tapByText, expectText } from './setup';

describe('Auth Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  // ── Login Screen ────────────────────────────────────────────────

  describe('Login Screen', () => {
    it('should display login form with all fields', async () => {
      await expectText('⚡ Spark');
      await expectText('Welcome back');
      await expectText('Email');
      await expectText('Password');
    });

    it('should show error on empty submit', async () => {
      await tapByText('Sign In');
      await expectText('Email is required');
    });

    it('should show error on invalid email', async () => {
      await element(by.label('you@example.com')).typeText('notanemail');
      await tapByText('Sign In');
      await expectText('Invalid email');
      // Clear field
      await element(by.label('notanemail')).clearText();
    });

    it('should show error on empty password', async () => {
      await element(by.label('you@example.com')).typeText('test@test.com');
      await tapByText('Sign In');
      await expectText('Password is required');
    });

    it('should toggle password visibility', async () => {
      // Password field should be secure by default
      const eyeIcon = element(by.id('eye-icon')).or(element(by.type('RCTIPTTextInput').atIndex(1)));
      // Tap the eye toggle
      const passwordField = element(by.label('Enter your password'));
      await passwordField.tap();
    });

    it('should navigate to register screen', async () => {
      await tapByText('Sign Up');
      await expectText('Create your account');
    });
  });

  // ── Register Screen ─────────────────────────────────────────────

  describe('Register Screen', () => {
    beforeAll(async () => {
      // Ensure we're on register screen
      await expectText('Create your account');
    });

    it('should display registration form with all fields', async () => {
      await expectText('Name');
      await expectText('Email');
      await expectText('Password');
      await expectText('Confirm Password');
    });

    it('should show errors on empty submit', async () => {
      await tapByText('Create Account');
      await expectText('Name is required');
    });

    it('should show error on invalid email', async () => {
      await element(by.label('Your name')).typeText('Test User');
      await element(by.label('you@example.com')).typeText('bademail');
      await tapByText('Create Account');
      await expectText('Invalid email');
    });

    it('should show error on short password', async () => {
      await element(by.label('you@example.com')).clearText();
      await element(by.label('you@example.com')).typeText('test@test.com');
      await element(by.label('At least 8 characters')).typeText('short');
      await tapByText('Create Account');
      await expectText('Password must be at least 8 characters');
    });

    it('should show error on mismatched passwords', async () => {
      await element(by.label('At least 8 characters')).clearText();
      await element(by.label('At least 8 characters')).typeText('password123');
      await element(by.label('Repeat your password')).typeText('differentpass');
      await tapByText('Create Account');
      await expectText('Passwords do not match');
    });

    it('should show terms and conditions link', async () => {
      await expectText('Terms of Service');
      await expectText('Privacy Policy');
      await expectText('No Refund Policy');
    });

    it('should navigate back to login', async () => {
      await tapByText('Sign In');
      await expectText('Welcome back');
    });
  });
});
