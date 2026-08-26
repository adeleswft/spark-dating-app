import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image, RefreshControl } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRealtimeMessages } from '../../hooks/useRealtimeMessages';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useAuthStore } from '../../stores/auth';
import { Message as MessageType } from '../../services/realtimeMessages';
import { useScreenshotPrevention } from '../../hooks/useScreenshotPrevention';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

interface Conversation {
  id: string;
  otherUserId: string;
  name: string;
  photo: string;
  lastMessage: string;
  compatibilityScore: number;
  isNew: boolean;
  unread: number;
  createdAt: string;
}

const SAMPLE_CONVERSATIONS: Conversation[] = [
  { id: 'match-1', otherUserId: 'user-sarah', name: 'Sarah', photo: 'https://picsum.photos/seed/sarah/200/200', lastMessage: 'Hey! I love hiking too! 🥾', compatibilityScore: 89, isNew: false, unread: 2, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'match-2', otherUserId: 'user-emily', name: 'Emily', photo: 'https://picsum.photos/seed/emily/200/200', lastMessage: 'That coffee shop sounds amazing!', compatibilityScore: 76, isNew: false, unread: 0, createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 'match-3', otherUserId: 'user-jessica', name: 'Jessica', photo: 'https://picsum.photos/seed/jessica/200/200', lastMessage: '', compatibilityScore: 82, isNew: true, unread: 0, createdAt: new Date(Date.now() - 1800000).toISOString() },
];

function OnlineDot({ isOnline, size = 12 }: { isOnline: boolean; size?: number }) {
  return <View style={[styles.onlineDot, { width: size, height: size, borderRadius: size / 2, backgroundColor: isOnline ? '#00E676' : '#333', borderWidth: 2, borderColor: '#141414' }]} />;
}

function TypingIndicator() {
  return (
    <View style={styles.typingContainer}>
      <View style={styles.typingBubble}>
        <View style={styles.typingDotRow}>
          <View style={[styles.typingDot, styles.typingDot1]} />
          <View style={[styles.typingDot, styles.typingDot2]} />
          <View style={[styles.typingDot, styles.typingDot3]} />
        </View>
      </View>
    </View>
  );
}

function ReadReceipt({ readAt, isMine }: { readAt: string | null; isMine: boolean }) {
  if (!isMine) return null;
  return (
    <View style={styles.readReceipt}>
      <MaterialCommunityIcons name={readAt ? 'check-all' : 'check'} size={14} color={readAt ? '#00E676' : '#555'} />
    </View>
  );
}

function ConversationAvatar({ photo, name, size = 56 }: { photo: string; name: string; size?: number }) {
  const hasPhoto = photo && photo.length > 0;
  return (
    <View style={[styles.avatarCircle, { width: size, height: size, borderRadius: size / 2 }]}>
      {hasPhoto ? (
        <Image source={{ uri: photo }} style={[styles.avatarImage, { width: size, height: size, borderRadius: size / 2 }]} />
      ) : (
        <Text style={[styles.avatarLetter, { fontSize: size * 0.4 }]}>{(name || '?')[0]}</Text>
      )}
    </View>
  );
}

function ConversationItem({ conversation, onPress, isOnline }: { conversation: Conversation; onPress: () => void; isOnline: boolean }) {
  const isNewMatch = conversation.isNew && !conversation.lastMessage;
  return (
    <TouchableOpacity
      style={[styles.conversationItem, isNewMatch && styles.conversationItemNew]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <ConversationAvatar photo={conversation.photo} name={conversation.name} />
        <View style={[styles.onlineDotContainer, { right: 0, bottom: 0 }]}>
          <OnlineDot isOnline={isOnline} size={14} />
        </View>
      </View>
      <View style={styles.conversationInfo}>
        <View style={styles.conversationHeader}>
          <Text variant="titleMedium" style={styles.conversationName}>{conversation.name}</Text>
          {isNewMatch ? (
            <View style={styles.newMatchBadge}>
              <MaterialCommunityIcons name="fire" size={12} color="#000" />
              <Text style={styles.newMatchBadgeText}>NEW</Text>
            </View>
          ) : (
            <View style={styles.scoreBadge}>
              <MaterialCommunityIcons name="star" size={12} color="#00E676" />
              <Text style={styles.scoreText}>{conversation.compatibilityScore}%</Text>
            </View>
          )}
        </View>
        <Text variant="bodySmall" style={[styles.lastMessage, isNewMatch && styles.lastMessageNew]} numberOfLines={1}>
          {isNewMatch ? 'Send the first message! 👋' : conversation.lastMessage || 'No messages yet'}
        </Text>
      </View>
      {conversation.unread > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>{conversation.unread > 99 ? '99+' : conversation.unread}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function MessageBubble({ message, isMine }: { message: MessageType; isMine: boolean }) {
  const time = new Date(message.created_at);
  return (
    <View style={[styles.messageRow, isMine ? styles.messageRowRight : styles.messageRowLeft]}>
      <View style={[styles.messageBubble, isMine ? styles.myMessage : styles.otherMessage]}>
        <Text style={[styles.messageText, isMine ? styles.myMessageText : styles.otherMessageText]}>{message.content}</Text>
        <View style={styles.messageFooter}>
          <Text style={[styles.timestamp, isMine && styles.timestampMine]}>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          <ReadReceipt readAt={message.read_at} isMine={isMine} />
        </View>
      </View>
    </View>
  );
}

export default function MessagesScreen() {
  const { user, token } = useAuthStore();
  // Prevent screenshots while viewing conversations/messages
  useScreenshotPrevention();
  const [conversations, setConversations] = useState<Conversation[]>(SAMPLE_CONVERSATIONS);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageText, setMessageText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentUserId = user?.id || 'demo-user';

  const { messages, loading, sendMessage, loadMore, hasMore, otherUserTyping, markAsRead, sendTyping } = useRealtimeMessages({ matchId: selectedConversation?.id || '', userId: currentUserId, enabled: !!selectedConversation });
  const { isOnline } = useOnlineStatus({ userId: currentUserId, username: user?.name || 'You', otherUserId: selectedConversation?.otherUserId || '', matchId: selectedConversation?.id || '' });

  // Sort conversations: unread first, then by date
  const sortedConversations = [...conversations].sort((a, b) => {
    // New matches (no messages) first
    const aIsNew = a.isNew && !a.lastMessage;
    const bIsNew = b.isNew && !b.lastMessage;
    if (aIsNew && !bIsNew) return -1;
    if (!aIsNew && bIsNew) return 1;
    // Then by unread count
    if (a.unread > 0 && b.unread === 0) return -1;
    if (a.unread === 0 && b.unread > 0) return 1;
    // Then by date
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Fetch conversations from API
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/matches/conversations`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.conversations)) {
          setConversations(data.conversations);
        }
      }
    } catch {
      // API unreachable — use sample data
    } finally {
      setLoadingConversations(false);
    }
  }, [token]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  }, [fetchConversations]);

  useEffect(() => { if (messages.length > 0) setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100); }, [messages.length]);
  useEffect(() => { if (selectedConversation) markAsRead(); }, [selectedConversation, messages.length]);

  // Clean up typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const handleSend = useCallback(async () => {
    if (!messageText.trim() || !selectedConversation) return;
    const success = await sendMessage(messageText.trim());
    if (success) { setMessageText(''); inputRef.current?.focus(); }
  }, [messageText, selectedConversation, sendMessage]);

  const handleTextChange = useCallback((text: string) => {
    setMessageText(text);
    if (text.length > 0) {
      sendTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => sendTyping(false), 3000);
    } else {
      sendTyping(false);
    }
  }, [sendTyping]);

  const handleConversationSelect = useCallback((conversation: Conversation) => { setSelectedConversation(conversation); }, []);

  if (!selectedConversation) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>Messages</Text>
          <Text variant="bodySmall" style={styles.subtitle}>{conversations.length} matches</Text>
        </View>
        <FlatList
          data={sortedConversations}
          renderItem={({ item }) => (
            <ConversationItem
              conversation={item}
              onPress={() => handleConversationSelect(item)}
              isOnline={false}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.conversationsList}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00E676" colors={['#00E676']} />}
          ListEmptyComponent={!loadingConversations ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="message-text-outline" size={48} color="#333" />
              <Text style={styles.emptyStateTitle}>No matches yet</Text>
              <Text style={styles.emptyStateSubtitle}>When you match with someone, you'll see them here</Text>
            </View>
          ) : null}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.chatContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={90}>
      <View style={styles.chatHeader}>
        <IconButton icon="arrow-left" size={24} onPress={() => setSelectedConversation(null)} style={styles.backButton} iconColor="#FFF" />
        <TouchableOpacity style={styles.chatHeaderInfo} onPress={() => {}}>
          <ConversationAvatar photo={selectedConversation.photo} name={selectedConversation.name} size={40} />
          <View style={styles.chatHeaderText}>
            <View style={styles.chatNameRow}>
              <Text variant="titleMedium" style={styles.chatName}>{selectedConversation.name}</Text>
              <OnlineDot isOnline={isOnline} size={8} />
            </View>
            <Text variant="bodySmall" style={[styles.onlineStatus, { color: isOnline ? '#00E676' : '#555' }]}>{isOnline ? 'Online now' : 'Offline'}</Text>
          </View>
        </TouchableOpacity>
        <IconButton icon="phone" size={22} onPress={() => {}} style={styles.headerAction} iconColor="#A0A0A0" />
        <IconButton icon="video" size={22} onPress={() => {}} style={styles.headerAction} iconColor="#A0A0A0" />
      </View>

      <FlatList ref={flatListRef} data={messages} renderItem={({ item }) => <MessageBubble message={item} isMine={item.sender_id === currentUserId} />} keyExtractor={(item) => item.id} contentContainerStyle={styles.messagesList} onRefresh={loadMore} refreshing={loading}
        ListHeaderComponent={hasMore ? <TouchableOpacity style={styles.loadMoreButton} onPress={loadMore}><Text style={styles.loadMoreText}>Load earlier messages</Text></TouchableOpacity> : null}
        ListEmptyComponent={!loading ? <View style={styles.emptyChat}><Text style={styles.emptyChatText}>Start a conversation with {selectedConversation.name}! 💬</Text></View> : null}
      />
      {otherUserTyping && <TypingIndicator />}

      <View style={styles.inputContainer}>
        <IconButton icon="camera" size={22} onPress={() => {}} style={styles.inputAction} iconColor="#A0A0A0" />
        <IconButton icon="image" size={22} onPress={() => {}} style={styles.inputAction} iconColor="#A0A0A0" />
        <TextInput ref={inputRef} style={styles.textInput} placeholder="Type a message..." placeholderTextColor="#555" value={messageText} onChangeText={handleTextChange} multiline maxLength={2000} />
        <TouchableOpacity style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]} onPress={handleSend} disabled={!messageText.trim()}>
          <MaterialCommunityIcons name="send" size={20} color={messageText.trim() ? '#000' : '#555'} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { paddingTop: 56, paddingBottom: 12, paddingHorizontal: 20, backgroundColor: '#0A0A0A' },
  title: { fontWeight: 'bold', color: '#FFFFFF' },
  subtitle: { color: '#555', marginTop: 2 },
  conversationsList: { paddingHorizontal: 16, paddingTop: 8 },
  separator: { height: 1, backgroundColor: '#1C1C1C', marginLeft: 80 },
  conversationItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4 },
  conversationItemNew: { backgroundColor: 'rgba(0, 230, 118, 0.05)', borderRadius: 12 },
  avatarContainer: { position: 'relative' },
  avatarCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#1B3A2A', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarImage: { width: 56, height: 56, borderRadius: 28 },
  avatarLetter: { fontSize: 22, fontWeight: 'bold', color: '#00E676' },
  onlineDotContainer: { position: 'absolute', backgroundColor: '#141414', borderRadius: 7, padding: 1 },
  onlineDot: {},
  conversationInfo: { flex: 1, marginLeft: 12 },
  conversationHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  conversationName: { fontWeight: 'bold', color: '#FFFFFF' },
  scoreBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1B3A2A', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, gap: 2 },
  scoreText: { fontSize: 11, fontWeight: 'bold', color: '#00E676' },
  lastMessage: { color: '#A0A0A0', marginTop: 4 },
  lastMessageNew: { color: '#00E676', fontStyle: 'italic' },
  newMatchBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#00E676', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, gap: 2 },
  newMatchBadgeText: { fontSize: 10, fontWeight: '800', color: '#000', letterSpacing: 0.5 },
  unreadBadge: { backgroundColor: '#00E676', borderRadius: 12, minWidth: 24, height: 24, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8 },
  unreadText: { color: '#000', fontWeight: 'bold', fontSize: 12 },
  chatContainer: { flex: 1, backgroundColor: '#0A0A0A' },
  chatHeader: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingBottom: 10, paddingHorizontal: 4, backgroundColor: '#141414', borderBottomWidth: 1, borderBottomColor: '#1C1C1C' },
  backButton: { margin: 0 },
  chatHeaderInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  chatAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1B3A2A', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  chatHeaderText: { flex: 1 },
  chatNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chatName: { fontWeight: 'bold', color: '#FFFFFF' },
  onlineStatus: { color: '#00E676', fontSize: 12, marginTop: 1 },
  headerAction: { margin: 0 },
  messagesList: { paddingHorizontal: 16, paddingVertical: 8, flexGrow: 1 },
  messageRow: { marginBottom: 8 },
  messageRowLeft: { alignItems: 'flex-start' },
  messageRowRight: { alignItems: 'flex-end' },
  messageBubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  myMessage: { backgroundColor: '#00E676', borderBottomRightRadius: 4 },
  otherMessage: { backgroundColor: '#1C1C1C', borderBottomLeftRadius: 4 },
  messageText: { fontSize: 15, lineHeight: 20 },
  myMessageText: { color: '#000' },
  otherMessageText: { color: '#FFFFFF' },
  messageFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 4 },
  timestamp: { fontSize: 10, color: 'rgba(255,255,255,0.5)' },
  timestampMine: { color: 'rgba(0,0,0,0.6)' },
  readReceipt: { marginLeft: 2 },
  typingContainer: { paddingHorizontal: 20, paddingBottom: 4 },
  typingBubble: { backgroundColor: '#1C1C1C', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, borderBottomLeftRadius: 4, alignSelf: 'flex-start' },
  typingDotRow: { flexDirection: 'row', gap: 4 },
  typingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#555' },
  typingDot1: {}, typingDot2: {}, typingDot3: {},
  loadMoreButton: { alignItems: 'center', paddingVertical: 12 },
  loadMoreText: { color: '#00E676', fontWeight: '500' },
  emptyChat: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyChatText: { color: '#555', fontSize: 16, textAlign: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyStateTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  emptyStateSubtitle: { fontSize: 14, color: '#555', textAlign: 'center', paddingHorizontal: 40 },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 8, paddingBottom: Platform.OS === 'ios' ? 24 : 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#1C1C1C', backgroundColor: '#141414' },
  inputAction: { margin: 0, marginBottom: 4 },
  textInput: { flex: 1, backgroundColor: '#1C1C1C', borderRadius: 20, paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 10 : 8, marginHorizontal: 8, maxHeight: 100, fontSize: 15, color: '#FFF' },
  sendButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#00E676', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  sendButtonDisabled: { backgroundColor: '#1C1C1C' },
});
