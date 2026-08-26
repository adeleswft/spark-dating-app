import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from './supabase';

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

// Message subscription
export function subscribeToMessages(
  matchId: string,
  onMessage: (message: Message) => void,
  onRead?: (messageIds: string[]) => void
): () => void {
  const channel = supabase
    .channel(`messages:${matchId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `match_id=eq.${matchId}`,
      },
      (payload: { new: Message }) => {
        onMessage(payload.new);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `match_id=eq.${matchId}`,
      },
      (payload: { new: Message }) => {
        if (payload.new.read_at && onRead) {
          onRead([payload.new.id]);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// Typing indicator broadcast
export function createTypingChannel(
  matchId: string,
  userId: string
): {
  sendTyping: (isTyping: boolean) => void;
  onTyping: (callback: (event: TypingEvent) => void) => () => void;
  cleanup: () => void;
} {
  const channel = supabase.channel(`typing:${matchId}`);

  const sendTyping = (isTyping: boolean) => {
    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        user_id: userId,
        match_id: matchId,
        is_typing: isTyping,
      } as TypingEvent,
    });
  };

  const onTyping = (callback: (event: TypingEvent) => void) => {
    const subscription = channel
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        const event = payload as TypingEvent;
        if (event.user_id !== userId) {
          callback(event);
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  return {
    sendTyping,
    onTyping,
    cleanup: () => {
      supabase.removeChannel(channel);
    },
  };
}

// Send a message
export async function sendMessage(
  matchId: string,
  senderId: string,
  content: string
): Promise<Message | null> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      match_id: matchId,
      sender_id: senderId,
      content,
    })
    .select()
    .single();

  if (error) {
    console.error('Error sending message:', error);
    return null;
  }

  return data;
}

// Mark messages as read
export async function markMessagesRead(
  matchId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('match_id', matchId)
    .neq('sender_id', userId)
    .is('read_at', null);

  if (error) {
    console.error('Error marking messages as read:', error);
  }
}

// Fetch messages for a match
export async function fetchMessages(
  matchId: string,
  limit = 50
): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }

  return data || [];
}

// Presence tracking
export function trackPresence(userId: string, username: string): () => void {
  // Track presence on a global channel so all subscribers can see it
  const channel = supabase.channel('online-users', {
    config: {
      presence: {
        key: userId,
      },
    },
  });

  channel
    .on('presence', { event: 'sync' }, () => {
      // Presence state available via channel.presenceState()
    })
    .subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        channel.track({
          user_id: userId,
          online_at: new Date().toISOString(),
          username,
        });
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}

// Subscribe to presence of a specific match
export function subscribeToMatchPresence(
  matchId: string,
  otherUserId: string,
  onStatusChange: (isOnline: boolean, lastSeen?: string) => void
): () => void {
  // Subscribe to the global online-users channel where all users track their presence
  const channel = supabase.channel('online-users');

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState() as Record<string, unknown[]>;
      const users = state[otherUserId] as PresenceState[] | undefined;
      const isOnline = !!users && users.length > 0;
      const lastSeen = users?.[0]?.online_at;
      onStatusChange(isOnline, lastSeen);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
