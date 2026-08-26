import { useEffect, useState, useCallback, useRef } from 'react';
import { subscribeToMatchPresence, trackPresence } from '../services/realtimeMessages';

interface UseOnlineStatusOptions {
  userId: string;
  username: string;
  otherUserId?: string;
  matchId?: string;
}

interface UseOnlineStatusReturn {
  isOnline: boolean;
  lastSeen: string | null;
  trackMyPresence: () => void;
}

export function useOnlineStatus({
  userId,
  username,
  otherUserId,
  matchId,
}: UseOnlineStatusOptions): UseOnlineStatusReturn {
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const trackedRef = useRef(false);

  // Track my own presence
  // Reset trackedRef when userId changes (e.g., login/logout)
  useEffect(() => {
    trackedRef.current = false;
  }, [userId]);

  const trackMyPresence = useCallback(() => {
    if (trackedRef.current || !userId || !username) return;
    trackedRef.current = true;
    trackPresence(userId, username);
  }, [userId, username]);

  useEffect(() => {
    trackMyPresence();
  }, [trackMyPresence]);

  // Subscribe to other user's presence
  useEffect(() => {
    if (!otherUserId || !matchId) return;

    const unsubscribe = subscribeToMatchPresence(
      matchId,
      otherUserId,
      (online, lastSeenTime) => {
        setIsOnline(online);
        setLastSeen(lastSeenTime || null);
      }
    );

    return unsubscribe;
  }, [otherUserId, matchId]);

  return {
    isOnline,
    lastSeen,
    trackMyPresence,
  };
}
