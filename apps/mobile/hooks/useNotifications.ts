import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'expo-router';
import {
  registerForPushNotifications,
  addNotificationResponseListener,
  addNotificationReceivedListener,
  notifyMatch,
  notifySuperLike,
  notifyNewMessage,
} from '../services/notifications';
import { useNotificationsStore } from '../stores/notifications';
import { useAuthStore } from '../stores/auth';
import type { NotificationType } from '../stores/notifications';

/**
 * Hook that manages push notification registration, foreground handlers,
 * and notification tap navigation.
 */
export function useNotificationsSetup() {
  const router = useRouter();
  const { addNotification } = useNotificationsStore();
  const responseListener = useRef<ReturnType<typeof addNotificationResponseListener>>();
  const receivedListener = useRef<ReturnType<typeof addNotificationReceivedListener>>();

  useEffect(() => {
    // Register for push notifications (sends token to server if authenticated)
    registerForPushNotifications();

    // Re-register when auth state changes (app restart / rehydration)
    const unsubscribe = useAuthStore.subscribe((state, prevState) => {
      if (state.isAuthenticated && !prevState.isAuthenticated) {
        // User just logged in — register push token
        registerForPushNotifications();
      }
    });

    // Listen for notifications received in foreground
    receivedListener.current = addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data;
      const type = (data?.type as NotificationType) || 'system';

      addNotification({
        type,
        title: notification.request.content.title || 'Spark',
        body: notification.request.content.body || '',
        data: data as Record<string, string>,
      });
    });

    // Listen for notification taps — deep link to the right screen
    responseListener.current = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;
      const type = data?.type;

      switch (type) {
        case 'message':
          // Navigate to messages tab; the chat screen will be opened from the match list
          router.push('/(tabs)/messages');
          break;
        case 'match':
          // Navigate to messages tab to see the new match
          router.push('/(tabs)/messages');
          break;
        case 'super_like':
        case 'like':
          router.push('/(tabs)/discover');
          break;
        case 'boost':
          router.push('/(tabs)/discover');
          break;
        default:
          router.push('/(tabs)/discover');
          break;
      }
    });

    return () => {
      unsubscribe();
      if (responseListener.current) {
        responseListener.current.remove();
      }
      if (receivedListener.current) {
        receivedListener.current.remove();
      }
    };
  }, []);
}

/**
 * Hook that provides notification trigger functions.
 * Use these to show notifications when events happen.
 */
export function useNotificationActions() {
  const { addNotification } = useNotificationsStore();

  const onMatch = useCallback(
    async (matchedName: string, matchId: string) => {
      addNotification({
        type: 'match',
        title: "It's a Match! 💕",
        body: `You and ${matchedName} liked each other! Send a message to start chatting.`,
        data: { matchId, matchedName },
      });
      await notifyMatch(matchedName, matchId);
    },
    [addNotification]
  );

  const onSuperLike = useCallback(
    async (superLikedByName: string, profileId: string) => {
      addNotification({
        type: 'super_like',
        title: '⭐ You Got a Super Like!',
        body: `${superLikedByName} Super Liked you! They really want to connect.`,
        data: { profileId, superLikedByName },
      });
      await notifySuperLike(superLikedByName, profileId);
    },
    [addNotification]
  );

  const onNewMessage = useCallback(
    async (senderName: string, matchId: string, content: string) => {
      const preview = content.length > 60 ? content.substring(0, 60) + '...' : content;
      addNotification({
        type: 'message',
        title: senderName,
        body: preview,
        data: { matchId, senderName },
      });
      await notifyNewMessage(senderName, matchId, content);
    },
    [addNotification]
  );

  const onLike = useCallback(
    async (likedByName: string, profileId: string) => {
      addNotification({
        type: 'like',
        title: 'Someone liked you! ❤️',
        body: `${likedByName} liked your profile. Check it out!`,
        data: { profileId, likedByName },
      });
    },
    [addNotification]
  );

  return { onMatch, onSuperLike, onNewMessage, onLike };
}
