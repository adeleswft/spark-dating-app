import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useAuthStore } from '../stores/auth';

// Configure notification behavior (wrapped in try/catch for safety)
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch (e) {
  console.warn('[Notifications] Failed to set handler:', e);
}

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Register for push notifications and send token to server.
 * Returns the Expo push token string.
 */
export async function registerForPushNotifications(): Promise<string | null> {
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
      lightColor: '#00E676',
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
}

/**
 * Unregister push token from server (call on logout).
 */
export async function unregisterPushToken(): Promise<void> {
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
  handler: (notification: Notifications.Notification) => void,
) {
  return Notifications.addNotificationReceivedListener(handler);
}

/**
 * Listen for notification taps (responses).
 * Returns a subscription that can be removed with .remove().
 */
export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void,
) {
  return Notifications.addNotificationResponseReceivedListener(handler);
}

/**
 * Clear all notifications
 */
export async function clearAllNotifications() {
  await Notifications.dismissAllNotificationsAsync();
  await Notifications.setBadgeCountAsync(0);
}

/**
 * Send a local notification immediately.
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>,
) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data: data || {}, sound: true },
    trigger: null,
  });
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
