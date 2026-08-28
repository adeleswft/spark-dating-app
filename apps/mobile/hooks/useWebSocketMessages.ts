/**
 * Hook for real-time messaging using WebSocket.
 * Alternative to useRealtimeMessages (Supabase) — works with our custom API.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { wsClient, WSMessage } from '../services/websocket';
import { useAuthStore } from '../stores/auth';

interface Message {
  id: string;
  matchId: string;
  senderId: string;
  content: string;
  createdAt: string;
  readAt: string | null;
}

interface UseWebSocketMessagesOptions {
  matchId: string;
  enabled?: boolean;
}

interface UseWebSocketMessagesReturn {
  messages: Message[];
  loading: boolean;
  sendMessage: (content: string) => boolean;
  otherUserTyping: boolean;
  markAsRead: () => void;
  sendTyping: (isTyping: boolean) => void;
}

import { API_URL } from '../services/config';

export function useWebSocketMessages({
  matchId,
  enabled = true,
}: UseWebSocketMessagesOptions): UseWebSocketMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { token, user } = useAuthStore();
  const currentUserId = user?.id;

  // Connect WebSocket on mount
  useEffect(() => {
    if (!enabled || !token) return;

    wsClient.connect(token);

    return () => {
      // Don't disconnect on component unmount — keep connection alive
    };
  }, [token, enabled]);

  // Join match room and fetch initial messages
  useEffect(() => {
    if (!enabled || !matchId || !wsClient.isConnected()) return;

    wsClient.joinMatch(matchId);

    // Fetch existing messages via REST
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/messages/${matchId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.messages)) {
            setMessages(
              data.messages.map((m: any) => ({
                id: m.id,
                matchId: m.matchId || m.match_id,
                senderId: m.senderId || m.sender_id,
                content: m.content,
                createdAt: m.createdAt || m.created_at,
                readAt: m.readAt || m.read_at,
              }))
            );
          }
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [matchId, enabled, token]);

  // Subscribe to incoming messages
  useEffect(() => {
    if (!enabled || !matchId) return;

    const unsubMessage = wsClient.on('message', (msg: WSMessage) => {
      if (msg.matchId === matchId && msg.message) {
        const m = msg.message;
        setMessages((prev) => {
          if (prev.some((p) => p.id === m.id)) return prev;
          return [
            ...prev,
            {
              id: m.id,
              matchId: m.matchId,
              senderId: m.senderId,
              content: m.content,
              createdAt: m.createdAt,
              readAt: m.readAt || null,
            },
          ];
        });
      }
    });

    const unsubTyping = wsClient.on('typing', (msg: WSMessage) => {
      if (msg.matchId === matchId && msg.userId !== currentUserId) {
        setOtherUserTyping(!!msg.isTyping);

        if (msg.isTyping) {
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setOtherUserTyping(false), 3000);
        }
      }
    });

    const unsubRead = wsClient.on('read', (msg: WSMessage) => {
      if (msg.matchId === matchId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.senderId === currentUserId ? { ...m, readAt: new Date().toISOString() } : m
          )
        );
      }
    });

    return () => {
      unsubMessage();
      unsubTyping();
      unsubRead();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [matchId, enabled, currentUserId]);

  const sendMessage = useCallback(
    (content: string): boolean => {
      if (!content.trim() || !matchId) return false;
      wsClient.sendMessage(matchId, content);
      return true;
    },
    [matchId]
  );

  const markAsRead = useCallback(() => {
    if (matchId) wsClient.markRead(matchId);
  }, [matchId]);

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (matchId) wsClient.sendTyping(matchId, isTyping);
    },
    [matchId]
  );

  return {
    messages,
    loading,
    sendMessage,
    otherUserTyping,
    markAsRead,
    sendTyping,
  };
}
