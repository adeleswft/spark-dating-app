import { Platform } from 'react-native';
import { useAuthStore } from '../stores/auth';

// Lazy-load expo-notifications to avoid crash on web
let Notifications: any = null;
const isNative = Platform.OS !== 'web';
try {
  if (isNative) {
    Notifications = require('expo-notifications');
  }
} catch {
  // Web or unsupported platform — Notifications stays null
}

// Configure notification behavior (wrapped in try/catch for safety)
try {
  if (Notifications?.setNotificationHandler) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }
} catch (e) {
  console.warn('[Notifications] Failed to set handler:', e);
}

import { API_URL } from './config';

/**
 * Register for push notifications and send token to server.
 * Returns the Expo push token string.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Notifications) return null;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted');
      return null;
    }

    const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID || 'your-project-id';
    const { data: pushToken } = await Notifications.getExpoPushTokenAsync({ projectId });

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('matches', {
        name: 'New Matches',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#E84855',
      });

      await Notifications.setNotificationChannelAsync('messages', {
        name: 'Messages',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250],
      });
    }

    // Send token to server if user is authenticated
    try {
      const { token: authToken } = useAuthStore.getState();
      if (authToken && pushToken) {
        await fetch(`${API_URL}/notifications/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            token: pushToken,
            platform: Platform.OS as 'ios' | 'android',
          }),
        });
        console.log('[Push] Token registered with server');
      }
    } catch (err) {
      console.log('[Push] Failed to register token with server:', err);
    }

    return pushToken;
  } catch (err) {
    console.warn('[Notifications] registerForPushNotifications failed:', err);
    return null;
  }
}

/**
 * Unregister push token from server (call on logout).
 */
export async function unregisterPushToken(): Promise<void> {
  if (!Notifications) return;

  try {
    const { token: authToken } = useAuthStore.getState();
    const storedToken = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID || 'your-project-id',
    });
    if (authToken && storedToken?.data) {
      await fetch(`${API_URL}/notifications/unregister`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ token: storedToken.data }),
      });
      console.log('[Push] Token unregistered from server');
    }
  } catch (err) {
    console.log('[Push] Failed to unregister token:', err);
  }
}

/**
 * Listen for notifications received in the foreground.
 * Returns a subscription that can be removed with .remove().
 */
export function addNotificationReceivedListener(
  handler: (notification: any) => void,
) {
  if (!Notifications) return { remove: () => {} };
  return Notifications.addNotificationReceivedListener(handler);
}

/**
 * Listen for notification taps (responses).
 * Returns a subscription that can be removed with .remove().
 */
export function addNotificationResponseListener(
  handler: (response: any) => void,
) {
  if (!Notifications) return { remove: () => {} };
  return Notifications.addNotificationResponseReceivedListener(handler);
}

/**
 * Clear all notifications
 */
export async function clearAllNotifications() {
  if (!Notifications) return;
  try {
    await Notifications.dismissAllNotificationsAsync();
    await Notifications.setBadgeCountAsync(0);
  } catch {
    // ignore on web
  }
}

/**
 * Send a local notification immediately.
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>,
) {
  if (!Notifications) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data: data || {}, sound: true },
      trigger: null,
    });
  } catch {
    // ignore on web
  }
}

// ─── Convenience helpers used by useNotifications hook ──────────

export async function notifyMatch(matchedName: string, matchId: string) {
  await scheduleLocalNotification(
    "It's a Match! 💕",
    `You and ${matchedName} liked each other! Send a message to start chatting.`,
    { type: 'match', matchId, matchedName },
  );
}

export async function notifySuperLike(superLikedByName: string, profileId: string) {
  await scheduleLocalNotification(
    '⭐ You Got a Super Like!',
    `${superLikedByName} Super Liked you! They really want to connect.`,
    { type: 'super_like', profileId, superLikedByName },
  );
}

export async function notifyNewMessage(senderName: string, matchId: string, content: string) {
  const preview = content.length > 60 ? content.substring(0, 60) + '...' : content;
  await scheduleLocalNotification(
    senderName,
    preview,
    { type: 'message', matchId, senderName },
  );
}
