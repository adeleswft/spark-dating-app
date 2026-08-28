/**
 * Messaging service using the Spark API + WebSocket.
 * Replaces the Supabase-only implementation with one that works
 * with the deployed API at EXPO_PUBLIC_API_URL.
 */

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

// Types
export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

export interface PresenceState {
  user_id: string;
  online_at: string;
  username?: string;
}

export interface TypingEvent {
  user_id: string;
  match_id: string;
  is_typing: boolean;
}

// ── WebSocket connection manager ──────────────────────────────────
let ws: WebSocket | null = null;
let wsToken: string | null = null;
let wsReconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let wsMessageHandlers: Array<(data: any) => void> = [];

function getWsUrl(token: string): string {
  const httpUrl = new URL(API_URL);
  const protocol = httpUrl.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${httpUrl.host}/ws?token=${token}`;
}

export function connectWebSocket(token: string) {
  if (ws && ws.readyState === WebSocket.OPEN && wsToken === token) return;

  wsToken = token;
  ws = new WebSocket(getWsUrl(token));

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      wsMessageHandlers.forEach((h) => h(data));
    } catch {}
  };

  ws.onclose = () => {
    // Reconnect after 3s
    if (wsReconnectTimeout) clearTimeout(wsReconnectTimeout);
    wsReconnectTimeout = setTimeout(() => {
      if (wsToken) connectWebSocket(wsToken);
    }, 3000);
  };

  ws.onerror = () => {
    ws?.close();
  };
}

export function disconnectWebSocket() {
  if (wsReconnectTimeout) clearTimeout(wsReconnectTimeout);
  wsToken = null;
  ws?.close();
  ws = null;
}

function sendWsMessage(data: any) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function addWsHandler(handler: (data: any) => void) {
  wsMessageHandlers.push(handler);
  return () => {
    wsMessageHandlers = wsMessageHandlers.filter((h) => h !== handler);
  };
}

// ── Message subscription via WebSocket ────────────────────────────
export function subscribeToMessages(
  matchId: string,
  onMessage: (message: Message) => void,
  onRead?: (messageIds: string[]) => void
): () => void {
  // Join the match room
  sendWsMessage({ type: 'join', matchId });

  const removeHandler = addWsHandler((data) => {
    if (data.type === 'message' && data.message?.matchId === matchId) {
      onMessage({
        id: data.message.id,
        match_id: data.message.matchId,
        sender_id: data.message.senderId,
        content: data.message.content,
        created_at: data.message.createdAt,
        read_at: null,
      });
    }
    if (data.type === 'read' && data.matchId === matchId && onRead) {
      onRead([]); // Signal that read state changed
    }
  });

  return () => {
    removeHandler();
  };
}

// ── Typing indicator via WebSocket ────────────────────────────────
export function createTypingChannel(
  matchId: string,
  userId: string
): {
  sendTyping: (isTyping: boolean) => void;
  onTyping: (callback: (event: TypingEvent) => void) => () => void;
  cleanup: () => void;
} {
  const typingCallbacks: Array<(event: TypingEvent) => void> = [];

  const removeHandler = addWsHandler((data) => {
    if (data.type === 'typing' && data.matchId === matchId) {
      const event: TypingEvent = {
        user_id: data.userId,
        match_id: data.matchId,
        is_typing: data.isTyping,
      };
      typingCallbacks.forEach((cb) => cb(event));
    }
  });

  return {
    sendTyping: (isTyping: boolean) => {
      sendWsMessage({ type: 'typing', matchId, isTyping });
    },
    onTyping: (callback: (event: TypingEvent) => void) => {
      typingCallbacks.push(callback);
      return () => {
        const idx = typingCallbacks.indexOf(callback);
        if (idx >= 0) typingCallbacks.splice(idx, 1);
      };
    },
    cleanup: () => {
      removeHandler();
      typingCallbacks.length = 0;
    },
  };
}

// ── Send a message via API ────────────────────────────────────────
export async function sendMessage(
  matchId: string,
  senderId: string,
  content: string
): Promise<Message | null> {
  try {
    // Try WebSocket first (real-time)
    sendWsMessage({ type: 'message', matchId, content });

    // Also send via API for persistence (WS handler saves to DB too,
    // but this ensures delivery if WS is disconnected)
    // We skip the HTTP call if WS is open — the WS handler saves to DB
    if (ws && ws.readyState === WebSocket.OPEN) {
      // WS handler saves to DB and broadcasts. Return a synthetic message
      // The actual DB message will arrive via the WS broadcast
      return {
        id: `pending-${Date.now()}`,
        match_id: matchId,
        sender_id: senderId,
        content,
        created_at: new Date().toISOString(),
        read_at: null,
      };
    }

    // Fallback: HTTP API
    const token = wsToken;
    const res = await fetch(`${API_URL}/messages/${matchId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ content }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.message || null;
  } catch {
    return null;
  }
}

// ── Mark messages as read via WS ─────────────────────────────────
export async function markMessagesRead(
  matchId: string,
  userId: string
): Promise<void> {
  sendWsMessage({ type: 'read', matchId });
}

// ── Fetch messages via API ────────────────────────────────────────
export async function fetchMessages(
  matchId: string,
  limit = 50
): Promise<Message[]> {
  try {
    const token = wsToken;
    const res = await fetch(`${API_URL}/messages/${matchId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!res.ok) return [];
    const data = await res.json();

    return (data.messages || []).map((m: any) => ({
      id: m.id,
      match_id: m.matchId,
      sender_id: m.senderId,
      content: m.content,
      created_at: m.createdAt,
      read_at: m.readAt,
    }));
  } catch {
    return [];
  }
}

// ── Presence: simplified (no Supabase presence) ──────────────────
export function trackPresence(userId: string, username: string): () => void {
  // Presence is tracked via WebSocket connections
  // No-op for now — the server tracks active connections
  return () => {};
}

export function subscribeToMatchPresence(
  matchId: string,
  otherUserId: string,
  onStatusChange: (isOnline: boolean, lastSeen?: string) => void
): () => void {
  // simplified — no Supabase presence
  onStatusChange(false);
  return () => {};
}
