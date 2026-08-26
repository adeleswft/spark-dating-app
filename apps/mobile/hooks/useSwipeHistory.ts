import { useState, useCallback } from 'react';
import type { Profile } from '../components/SwipeCard';

interface SwipeEntry {
  profile: Profile;
  direction: 'left' | 'right' | 'super';
  timestamp: number;
}

interface UseSwipeHistoryReturn {
  history: SwipeEntry[];
  canRewind: boolean;
  recordSwipe: (profile: Profile, direction: 'left' | 'right' | 'super') => void;
  rewindLast: () => SwipeEntry | null;
  getHistory: () => SwipeEntry[];
  clearHistory: () => void;
}

const MAX_HISTORY = 30;

/**
 * Tracks swipe history and allows rewinding the last swipe.
 * In production, this would sync with the backend.
 */
export function useSwipeHistory(): UseSwipeHistoryReturn {
  const [history, setHistory] = useState<SwipeEntry[]>([]);

  const recordSwipe = useCallback((profile: Profile, direction: 'left' | 'right' | 'super') => {
    setHistory((prev) => {
      const newHistory = [
        { profile, direction, timestamp: Date.now() },
        ...prev,
      ];
      return newHistory.slice(0, MAX_HISTORY);
    });
  }, []);

  const rewindLast = useCallback((): SwipeEntry | null => {
    if (history.length === 0) return null;

    const lastSwipe = history[0];
    setHistory((prev) => prev.slice(1));
    return lastSwipe;
  }, [history]);

  const canRewind = history.length > 0;

  const getHistory = useCallback(() => history, [history]);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return { history, canRewind, recordSwipe, rewindLast, getHistory, clearHistory };
}
