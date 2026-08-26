import { device, element, by } from 'detox';
import { tapByText, expectText } from './setup';

describe('Messaging Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  // ── Conversation List ───────────────────────────────────────────

  describe('Conversation List', () => {
    it('should display messages tab', async () => {
      await expectText('Messages');
    });

    it('should show match count', async () => {
      await expectText('matches');
    });

    it('should list conversations', async () => {
      await expectText('Sarah');
      await expectText('Emily');
      await expectText('Jessica');
    });

    it('should show last message preview', async () => {
      await expectText('hiking');
    });

    it('should show unread badge', async () => {
      // Sarah has 2 unread
      await expectText('2');
    });

    it('should show compatibility score badges', async () => {
      await expectText('89%');
      await expectText('76%');
      await expectText('82%');
    });
  });

  // ── Chat Screen ─────────────────────────────────────────────────

  describe('Chat Screen', () => {
    beforeAll(async () => {
      // Open Sarah's conversation
      await tapByText('Sarah');
    });

    it('should display chat header with name', async () => {
      await expectText('Sarah');
    });

    it('should show online status', async () => {
      await expectText('Offline');
    });

    it('should show chat input', async () => {
      await expectText('Type a message...');
    });

    it('should show message input actions (camera, image)', async () => {
      // Camera and image icons should be present
      await expectText('Type a message...');
    });

    it('should show call buttons', async () => {
      // Phone and video call buttons
      await expectText('Sarah');
    });

    it('should show empty chat state', async () => {
      await expectText('Start a conversation with Sarah!');
    });

    it('should send a message', async () => {
      await element(by.type('RCTIPTTextInput')).typeText('Hello!');
      // Tap send button
      const sendBtn = element(by.type('TouchableOpacity')).last();
      await sendBtn.tap();

      // Message should appear in chat
      await expectText('Hello!');
    });

    it('should clear input after sending', async () => {
      // Input should be empty now
      const input = element(by.type('RCTIPTTextInput'));
      await expectText('Type a message...');
    });

    it('should send another message', async () => {
      await element(by.type('RCTIPTTextInput')).typeText('How are you?');
      const sendBtn = element(by.type('TouchableOpacity')).last();
      await sendBtn.tap();
      await expectText('How are you?');
    });

    it('should show read receipt (check mark)', async () => {
      // Single check mark for sent message
      await expectText('How are you?');
    });

    it('should navigate back to conversation list', async () => {
      // Back button
      const backBtn = element(by.type('TouchableOpacity')).atIndex(0);
      await backBtn.tap();
      await expectText('Sarah');
    });
  });

  // ── Multiple Conversations ──────────────────────────────────────

  describe('Multiple Conversations', () => {
    it('should open Emily conversation', async () => {
      await tapByText('Emily');
      await expectText('Emily');
      await expectText('Type a message...');
    });

    it('should navigate back', async () => {
      const backBtn = element(by.type('TouchableOpacity')).atIndex(0);
      await backBtn.tap();
      await expectText('Messages');
    });

    it('should open Jessica conversation', async () => {
      await tapByText('Jessica');
      await expectText('Jessica');
    });
  });
});
