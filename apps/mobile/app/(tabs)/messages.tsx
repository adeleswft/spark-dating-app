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
  return <View style={[styles.onlineDot, { width: size, height: size, borderRadius: size / 2, backgroundColor: isOnline ? '#E84855' : '#3D3545', borderWidth: 2, borderColor: '#1A1620' }]} />;
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
      <MaterialCommunityIcons name={readAt ? 'check-all' : 'check'} size={14} color={readAt ? '#D4A574' : '#5A5060'} />
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
              <MaterialCommunityIcons name="fire" size={11} color="#FFF" />
              <Text style={styles.newMatchBadgeText}>NEW</Text>
            </View>
          ) : (
            <View style={styles.scoreBadge}>
              <MaterialCommunityIcons name="star" size={11} color="#D4A574" />
              <Text style={styles.scoreText}>{conversation.compatibilityScore}%</Text>
            </View>
          )}
        </View>
        <Text variant="bodySmall" style={[styles.lastMessage, isNewMatch && styles.lastMessageNew]} numberOfLines={1}>
          {isNewMatch ? 'Say something special ✨' : conversation.lastMessage || 'No messages yet'}
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

  const sortedConversations = [...conversations].sort((a, b) => {
    const aIsNew = a.isNew && !a.lastMessage;
    const bIsNew = b.isNew && !b.lastMessage;
    if (aIsNew && !bIsNew) return -1;
    if (!aIsNew && bIsNew) return 1;
    if (a.unread > 0 && b.unread === 0) return -1;
    if (a.unread === 0 && b.unread > 0) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

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
      // API unreachable
    } finally {
      setLoadingConversations(false);
    }
  }, [token]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  }, [fetchConversations]);

  useEffect(() => { if (messages.length > 0) setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100); }, [messages.length]);
  useEffect(() => { if (selectedConversation) markAsRead(); }, [selectedConversation, messages.length]);

  useEffect(() => {
    return () => { if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current); };
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
          <Text style={styles.title}>Messages</Text>
          <Text style={styles.subtitle}>{conversations.length} matches</Text>
        </View>
        <FlatList
          data={sortedConversations}
          renderItem={({ item }) => (
            <ConversationItem conversation={item} onPress={() => handleConversationSelect(item)} isOnline={false} />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.conversationsList}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E84855" colors={['#E84855']} />}
          ListEmptyComponent={!loadingConversations ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="message-text-outline" size={48} color="#3D3545" />
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
        <IconButton icon="arrow-left" size={24} onPress={() => setSelectedConversation(null)} style={styles.backButton} iconColor="#F5EDE3" />
        <TouchableOpacity style={styles.chatHeaderInfo} onPress={() => {}}>
          <ConversationAvatar photo={selectedConversation.photo} name={selectedConversation.name} size={38} />
          <View style={styles.chatHeaderText}>
            <View style={styles.chatNameRow}>
              <Text variant="titleMedium" style={styles.chatName}>{selectedConversation.name}</Text>
              <OnlineDot isOnline={isOnline} size={7} />
            </View>
            <Text variant="bodySmall" style={[styles.onlineStatus, { color: isOnline ? '#E84855' : '#5A5060' }]}>{isOnline ? 'Online now' : 'Offline'}</Text>
          </View>
        </TouchableOpacity>
        <IconButton icon="phone" size={20} onPress={() => {}} style={styles.headerAction} iconColor="#8A7E90" />
        <IconButton icon="video" size={20} onPress={() => {}} style={styles.headerAction} iconColor="#8A7E90" />
      </View>

      <FlatList ref={flatListRef} data={messages} renderItem={({ item }) => <MessageBubble message={item} isMine={item.sender_id === currentUserId} />} keyExtractor={(item) => item.id} contentContainerStyle={styles.messagesList} onRefresh={loadMore} refreshing={loading}
        ListHeaderComponent={hasMore ? <TouchableOpacity style={styles.loadMoreButton} onPress={loadMore}><Text style={styles.loadMoreText}>Load earlier messages</Text></TouchableOpacity> : null}
        ListEmptyComponent={!loading ? <View style={styles.emptyChat}><Text style={styles.emptyChatText}>Start a conversation with {selectedConversation.name} ✨</Text></View> : null}
      />
      {otherUserTyping && <TypingIndicator />}

      <View style={styles.inputContainer}>
        <IconButton icon="camera" size={20} onPress={() => {}} style={styles.inputAction} iconColor="#8A7E90" />
        <IconButton icon="image" size={20} onPress={() => {}} style={styles.inputAction} iconColor="#8A7E90" />
        <TextInput ref={inputRef} style={styles.textInput} placeholder="Say something..." placeholderTextColor="#5A5060" value={messageText} onChangeText={handleTextChange} multiline maxLength={2000} />
        <TouchableOpacity style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]} onPress={handleSend} disabled={!messageText.trim()}>
          <MaterialCommunityIcons name="send" size={18} color={messageText.trim() ? '#FFF' : '#5A5060'} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0B0E' },
  header: { paddingTop: 56, paddingBottom: 12, paddingHorizontal: 20 },
  title: { fontSize: 26, fontWeight: '800', color: '#F5EDE3', letterSpacing: -0.5 },
  subtitle: { color: '#5A5060', marginTop: 2, fontSize: 14 },
  conversationsList: { paddingHorizontal: 16, paddingTop: 8 },
  separator: { height: 1, backgroundColor: '#2A2530', marginLeft: 80 },
  conversationItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4 },
  conversationItemNew: { backgroundColor: 'rgba(232, 72, 85, 0.06)', borderRadius: 12 },
  avatarContainer: { position: 'relative' },
  avatarCircle: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#3D1520', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarImage: { width: 54, height: 54, borderRadius: 27 },
  avatarLetter: { fontSize: 20, fontWeight: '700', color: '#E84855' },
  onlineDotContainer: { position: 'absolute', backgroundColor: '#1A1620', borderRadius: 7, padding: 1 },
  onlineDot: {},
  conversationInfo: { flex: 1, marginLeft: 12 },
  conversationHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  conversationName: { fontWeight: '700', color: '#F5EDE3' },
  scoreBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3D1520', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, gap: 2 },
  scoreText: { fontSize: 11, fontWeight: '700', color: '#D4A574' },
  lastMessage: { color: '#8A7E90', marginTop: 3 },
  lastMessageNew: { color: '#E84855', fontStyle: 'italic' },
  newMatchBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E84855', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, gap: 2 },
  newMatchBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 },
  unreadBadge: { backgroundColor: '#E84855', borderRadius: 12, minWidth: 24, height: 24, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8 },
  unreadText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  chatContainer: { flex: 1, backgroundColor: '#0D0B0E' },
  chatHeader: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingBottom: 10, paddingHorizontal: 4, backgroundColor: '#1A1620', borderBottomWidth: 1, borderBottomColor: '#2A2530' },
  backButton: { margin: 0 },
  chatHeaderInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  chatHeaderText: { flex: 1 },
  chatNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chatName: { fontWeight: '700', color: '#F5EDE3' },
  onlineStatus: { color: '#E84855', fontSize: 12, marginTop: 1 },
  headerAction: { margin: 0 },
  messagesList: { paddingHorizontal: 16, paddingVertical: 8, flexGrow: 1 },
  messageRow: { marginBottom: 8 },
  messageRowLeft: { alignItems: 'flex-start' },
  messageRowRight: { alignItems: 'flex-end' },
  messageBubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  myMessage: { backgroundColor: '#E84855', borderBottomRightRadius: 4 },
  otherMessage: { backgroundColor: '#2A2530', borderBottomLeftRadius: 4 },
  messageText: { fontSize: 15, lineHeight: 20 },
  myMessageText: { color: '#FFFFFF' },
  otherMessageText: { color: '#F5EDE3' },
  messageFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 4 },
  timestamp: { fontSize: 10, color: 'rgba(245, 237, 227, 0.4)' },
  timestampMine: { color: 'rgba(255,255,255,0.6)' },
  readReceipt: { marginLeft: 2 },
  typingContainer: { paddingHorizontal: 20, paddingBottom: 4 },
  typingBubble: { backgroundColor: '#2A2530', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, borderBottomLeftRadius: 4, alignSelf: 'flex-start' },
  typingDotRow: { flexDirection: 'row', gap: 4 },
  typingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#5A5060' },
  typingDot1: {}, typingDot2: {}, typingDot3: {},
  loadMoreButton: { alignItems: 'center', paddingVertical: 12 },
  loadMoreText: { color: '#E84855', fontWeight: '600' },
  emptyChat: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyChatText: { color: '#5A5060', fontSize: 16, textAlign: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyStateTitle: { fontSize: 18, fontWeight: '700', color: '#F5EDE3' },
  emptyStateSubtitle: { fontSize: 14, color: '#5A5060', textAlign: 'center', paddingHorizontal: 40 },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 8, paddingBottom: Platform.OS === 'ios' ? 24 : 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#2A2530', backgroundColor: '#1A1620' },
  inputAction: { margin: 0, marginBottom: 4 },
  textInput: { flex: 1, backgroundColor: '#2A2530', borderRadius: 20, paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 10 : 8, marginHorizontal: 8, maxHeight: 100, fontSize: 15, color: '#F5EDE3' },
  sendButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E84855', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  sendButtonDisabled: { backgroundColor: '#2A2530' },
});
