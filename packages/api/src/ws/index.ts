/**
 * WebSocket server for real-time messaging.
 * Handles live message delivery, typing indicators, and read receipts.
 */

import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { messages, matches } from '../db/schema';
import { eq, and, ne, sql } from 'drizzle-orm';
import { moderateMessage } from '../services/moderation';

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'spark-dev-secret-key');

interface AuthenticatedSocket extends WebSocket {
  userId: string;
  matchId?: string;
  isAlive: boolean;
}

interface WsMessage {
  type: string;
  [key: string]: any;
}

// Track connected users: userId → Set<WebSocket>
const connections = new Map<string, Set<AuthenticatedSocket>>();

// Track typing status: `${matchId}:${userId}` → timeout
const typingTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function setupWebSocket(server: any) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', async (ws: AuthenticatedSocket, req: IncomingMessage) => {
    // Authenticate via query param token
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      ws.close(4001, 'Authentication required');
      return;
    }

    try {
      const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
      ws.userId = payload.userId;
      ws.isAlive = true;
    } catch {
      ws.close(4001, 'Invalid token');
      return;
    }

    // Register connection
    if (!connections.has(ws.userId)) {
      connections.set(ws.userId, new Set());
    }
    connections.get(ws.userId)!.add(ws);

    console.log(`🔌 User ${ws.userId} connected (${connections.get(ws.userId)!.size} connections)`);

    // Handle messages
    ws.on('message', async (data) => {
      try {
        const msg: WsMessage = JSON.parse(data.toString());
        await handleMessage(ws, msg);
      } catch (err) {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    // Handle disconnect
    ws.on('close', () => {
      const userConns = connections.get(ws.userId);
      if (userConns) {
        userConns.delete(ws);
        if (userConns.size === 0) {
          connections.delete(ws.userId);
        }
      }
      console.log(`🔌 User ${ws.userId} disconnected`);
    });

    // Handle pong for keepalive
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Send connection confirmation
    ws.send(JSON.stringify({
      type: 'connected',
      userId: ws.userId,
    }));
  });

  // Keepalive: ping all connections every 30s
  const keepalive = setInterval(() => {
    wss.clients.forEach((ws) => {
      const authWs = ws as AuthenticatedSocket;
      if (!authWs.isAlive) {
        authWs.terminate();
        return;
      }
      authWs.isAlive = false;
      authWs.ping();
    });
  }, 30_000);

  wss.on('close', () => clearInterval(keepalive));

  console.log('🔌 WebSocket server ready on /ws');
  return wss;
}

async function handleMessage(ws: AuthenticatedSocket, msg: WsMessage) {
  switch (msg.type) {
    case 'join': {
      // Join a match room to receive messages
      const matchId = msg.matchId;
      if (!matchId) {
        ws.send(JSON.stringify({ type: 'error', message: 'matchId required' }));
        return;
      }

      // Verify user is part of this match
      const match = await db.query.matches.findFirst({
        where: eq(matches.id, matchId),
      });

      if (!match || (match.userAId !== ws.userId && match.userBId !== ws.userId)) {
        ws.send(JSON.stringify({ type: 'error', message: 'Not authorized for this match' }));
        return;
      }

      ws.matchId = matchId;
      ws.send(JSON.stringify({ type: 'joined', matchId }));
      break;
    }

    case 'message': {
      const { matchId, content } = msg;
      if (!matchId || !content?.trim()) {
        ws.send(JSON.stringify({ type: 'error', message: 'matchId and content required' }));
        return;
      }

      // Verify match
      const match = await db.query.matches.findFirst({
        where: eq(matches.id, matchId),
      });

      if (!match || (match.userAId !== ws.userId && match.userBId !== ws.userId)) {
        ws.send(JSON.stringify({ type: 'error', message: 'Not authorized' }));
        return;
      }

      // Content moderation (same as HTTP route)
      try {
        const mod = await moderateMessage(content.trim());
        if (mod.severity === 'critical') {
          ws.send(JSON.stringify({ type: 'error', message: 'Message blocked by safety filters' }));
          return;
        }
      } catch {
        // If moderation service is down, allow the message
      }

      // Save message to DB
      const [newMessage] = await db
        .insert(messages)
        .values({
          matchId,
          senderId: ws.userId,
          content: content.trim(),
        })
        .returning();

      // Broadcast to both users in the match
      const otherUserId =
        match.userAId === ws.userId ? match.userBId : match.userAId;

      const payload = JSON.stringify({
        type: 'message',
        message: {
          id: newMessage.id,
          matchId: newMessage.matchId,
          senderId: newMessage.senderId,
          content: newMessage.content,
          createdAt: newMessage.createdAt,
        },
      });

      // Send to self (confirmation)
      ws.send(payload);

      // Send to other user
      sendToUser(otherUserId, payload);
      break;
    }

    case 'typing': {
      const { matchId: tid, isTyping } = msg;
      if (!tid) return;

      const match = await db.query.matches.findFirst({
        where: eq(matches.id, tid),
      });

      if (!match || (match.userAId !== ws.userId && match.userBId !== ws.userId)) {
        ws.send(JSON.stringify({ type: 'error', message: 'Not authorized' }));
        return;
      }

      const otherUserId =
        match.userAId === ws.userId ? match.userBId : match.userAId;

      // Send typing indicator to other user
      sendToUser(otherUserId, JSON.stringify({
        type: 'typing',
        matchId: tid,
        userId: ws.userId,
        isTyping: !!isTyping,
      }));
      break;
    }

    case 'read': {
      const { matchId: rid } = msg;
      if (!rid) return;

      // Verify user is part of this match (authorization check)
      const readMatch = await db.query.matches.findFirst({
        where: eq(matches.id, rid),
      });

      if (!readMatch || (readMatch.userAId !== ws.userId && readMatch.userBId !== ws.userId)) {
        ws.send(JSON.stringify({ type: 'error', message: 'Not authorized for this match' }));
        return;
      }

      // Mark messages from OTHER users as read (not your own)
      await db
        .update(messages)
        .set({ readAt: new Date() })
        .where(
          and(
            eq(messages.matchId, rid),
            ne(messages.senderId, ws.userId),
            sql`${messages.readAt} IS NULL`
          )
        );

      // Notify other user
      const otherUserId =
        readMatch.userAId === ws.userId ? readMatch.userBId : readMatch.userAId;

      sendToUser(otherUserId, JSON.stringify({
        type: 'read',
        matchId: rid,
        userId: ws.userId,
      }));
      break;
    }

    default:
      ws.send(JSON.stringify({ type: 'error', message: `Unknown type: ${msg.type}` }));
  }
}

function sendToUser(userId: string, payload: string) {
  const userConns = connections.get(userId);
  if (userConns) {
    userConns.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    });
  }
}

export function broadcastToUser(userId: string, type: string, data: any) {
  sendToUser(userId, JSON.stringify({ type, ...data }));
}
