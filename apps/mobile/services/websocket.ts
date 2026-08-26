/**
 * WebSocket client for real-time messaging.
 * Alternative to Supabase Realtime — connects directly to the API's WebSocket server.
 */

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
const WS_URL = API_URL.replace(/^http/, 'ws') + '/ws';

export interface WSMessage {
  type: string;
  [key: string]: any;
}

type MessageHandler = (msg: WSMessage) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private token: string | null = null;
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private isConnecting = false;

  /**
   * Connect to the WebSocket server.
   */
  connect(token: string): void {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) return;

    this.token = token;
    this.isConnecting = true;

    const url = `${WS_URL}?token=${encodeURIComponent(token)}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('🔌 WebSocket connected');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.emit({ type: 'connected' });
    };

    this.ws.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data);
        this.emit(msg);
      } catch (err) {
        console.error('WebSocket parse error:', err);
      }
    };

    this.ws.onclose = (event) => {
      console.log('🔌 WebSocket closed:', event.code, event.reason);
      this.isConnecting = false;

      if (event.code !== 4001 && this.reconnectAttempts < this.maxReconnectAttempts) {
        // Auto-reconnect with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        this.reconnectTimer = setTimeout(() => {
          this.reconnectAttempts++;
          if (this.token) this.connect(this.token);
        }, delay);
      }
    };

    this.ws.onerror = (error) => {
      console.error('🔌 WebSocket error:', error);
      this.isConnecting = false;
    };
  }

  /**
   * Disconnect from the WebSocket server.
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnect
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.token = null;
  }

  /**
   * Join a match room to receive live messages.
   */
  joinMatch(matchId: string): void {
    this.send({ type: 'join', matchId });
  }

  /**
   * Send a message in a match.
   */
  sendMessage(matchId: string, content: string): void {
    this.send({ type: 'message', matchId, content });
  }

  /**
   * Send typing indicator.
   */
  sendTyping(matchId: string, isTyping: boolean): void {
    this.send({ type: 'typing', matchId, isTyping });
  }

  /**
   * Mark messages as read.
   */
  markRead(matchId: string): void {
    this.send({ type: 'read', matchId });
  }

  /**
   * Subscribe to a message type.
   * Returns an unsubscribe function.
   */
  on(type: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);

    return () => {
      this.handlers.get(type)?.delete(handler);
    };
  }

  /**
   * Subscribe to all messages.
   * Returns an unsubscribe function.
   */
  onAny(handler: MessageHandler): () => void {
    return this.on('*', handler);
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private send(data: WSMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private emit(msg: WSMessage): void {
    // Emit to specific type handlers
    const typeHandlers = this.handlers.get(msg.type);
    if (typeHandlers) {
      typeHandlers.forEach((handler) => handler(msg));
    }

    // Emit to wildcard handlers
    const wildcardHandlers = this.handlers.get('*');
    if (wildcardHandlers) {
      wildcardHandlers.forEach((handler) => handler(msg));
    }
  }
}

// Singleton
export const wsClient = new WebSocketClient();
