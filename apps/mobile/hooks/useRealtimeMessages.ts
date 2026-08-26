import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';
import {
  subscribeToMessages,
  sendMessage as sendMsg,
  markMessagesRead,
  fetchMessages,
  createTypingChannel,
  Message,
  TypingEvent,
} from '../services/realtimeMessages';

interface UseRealtimeMessagesOptions {
  matchId: string;
  userId: string;
  enabled?: boolean;
}

interface UseRealtimeMessagesReturn {
  messages: Message[];
  loading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<boolean>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  otherUserTyping: boolean;
  markAsRead: () => Promise<void>;
  sendTyping: (isTyping: boolean) => void;
}

export function useRealtimeMessages({
  matchId,
  userId,
  enabled = true,
}: UseRealtimeMessagesOptions): UseRealtimeMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingChannelRef = useRef<ReturnType<typeof createTypingChannel> | null>(null);

  // Fetch initial messages
  useEffect(() => {
    if (!enabled || !matchId) return;

    // Clear old messages immediately when switching conversations
    setMessages([]);
    setError(null);
    setOtherUserTyping(false);
    let cancelled = false;

    const loadMessages = async () => {
      try {
        setLoading(true);
        const data = await fetchMessages(matchId);
        if (!cancelled) {
          setMessages(data);
          setHasMore(data.length >= 50);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to load messages');
          setLoading(false);
        }
      }
    };

    loadMessages();

    return () => {
      cancelled = true;
    };
  }, [matchId, enabled]);

  // Subscribe to new messages
  useEffect(() => {
    if (!enabled || !matchId) return;

    const unsubscribe = subscribeToMessages(
      matchId,
      (newMessage) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });
      },
      (readIds) => {
        setMessages((prev) =>
          prev.map((m) =>
            readIds.includes(m.id) ? { ...m, read_at: new Date().toISOString() } : m
          )
        );
      }
    );

    return unsubscribe;
  }, [matchId, enabled]);

  // Typing indicator
  useEffect(() => {
    if (!enabled || !matchId || !userId) return;

    const typingChannel = createTypingChannel(matchId, userId);
    typingChannelRef.current = typingChannel;

    typingChannel.onTyping((event: TypingEvent) => {
      setOtherUserTyping(event.is_typing);

      if (event.is_typing) {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setOtherUserTyping(false);
        }, 3000);
      }
    });

    return () => {
      typingChannel.cleanup();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [matchId, userId, enabled]);

  const sendMessage = useCallback(
    async (content: string): Promise<boolean> => {
      if (!content.trim() || !matchId || !userId) return false;

      typingChannelRef.current?.sendTyping(false);

      const result = await sendMsg(matchId, userId, content);
      return !!result;
    },
    [matchId, userId]
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || loading || !matchId) return;

    try {
      const oldestMessage = messages[0];
      if (!oldestMessage) return;

      const { data, error: fetchError } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .lt('created_at', oldestMessage.created_at)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;

      if (data && data.length > 0) {
        setMessages((prev) => [...data.reverse(), ...prev]);
        setHasMore(data.length >= 50);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error loading more messages:', err);
    }
  }, [hasMore, loading, messages, matchId]);

  const markAsRead = useCallback(async () => {
    if (!matchId || !userId) return;
    await markMessagesRead(matchId, userId);
  }, [matchId, userId]);

  const sendTyping = useCallback((isTyping: boolean) => {
    typingChannelRef.current?.sendTyping(isTyping);
  }, []);

  return {
    messages,
    loading,
    error,
    sendMessage,
    loadMore,
    hasMore,
    otherUserTyping,
    markAsRead,
    sendTyping,
  };
}
