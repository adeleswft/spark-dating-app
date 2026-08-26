import { device, element, by } from 'detox';

/**
 * Global setup for E2E tests.
 * Called before each test suite.
 */
beforeAll(async () => {
  // Increase launch timeout for CI
  await device.launchApp({
    newInstance: true,
    permissions: {
      notifications: 'YES',
      camera: 'YES',
      photos: 'YES',
    },
  });
});

/**
 * Helper: wait for and tap an element by text.
 */
export async function tapByText(text: string, timeout = 8000) {
  await waitFor(element(by.text(text)))
    .toBeVisible()
    .withTimeout(timeout);
  await element(by.text(text)).tap();
}

/**
 * Helper: wait for and type into a text field with placeholder text.
 */
export async function typeInField(placeholder: string, text: string, timeout = 8000) {
  await waitFor(element(by.text(placeholder)).or(element(by.label(placeholder))))
    .toBeVisible()
    .withTimeout(timeout);
  // Try by placeholder first, fall back to label
  try {
    await element(by.type('RCTIPTTextInput').and(by.label(placeholder))).typeText(text);
  } catch {
    await element(by.label(placeholder)).typeText(text);
  }
}

/**
 * Helper: expect text to be visible.
 */
export async function expectText(text: string, timeout = 8000) {
  await waitFor(element(by.text(text)))
    .toBeVisible()
    .withTimeout(timeout);
}

/**
 * Helper: expect text NOT to be visible.
 */
export async function expectNotText(text: string, timeout = 3000) {
  await waitFor(element(by.text(text)))
    .not.toBeVisible()
    .withTimeout(timeout);
}

/**
 * Helper: swipe screen in a direction.
 */
export async function swipeScreen(direction: 'up' | 'down' | 'left' | 'right') {
  await element(by.id('root-scroll-view'))
    .swipe(direction, 'fast');
}

/**
 * Helper: wait for the app to be idle (animations, async operations).
 */
export async function waitForIdle() {
  await new Promise((resolve) => setTimeout(resolve, 1000));
}
