import React from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Text, IconButton, Surface, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useNotificationsStore, AppNotification } from '../stores/notifications';

const NOTIFICATION_ICONS: Record<string, { name: string; color: string; bg: string }> = {
  match: { name: 'heart', color: '#00E676', bg: '#1B3A2A' },
  message: { name: 'chat', color: '#2196F3', bg: '#E3F2FD' },
  super_like: { name: 'star', color: '#6C63FF', bg: '#EDE7F6' },
  like: { name: 'heart', color: '#00E676', bg: '#1B3A2A' },
  boost: { name: 'lightning-bolt', color: '#FF9800', bg: '#FFF3E0' },
  system: { name: 'information', color: '#555', bg: '#F5F5F5' },
};

function NotificationItem({
  notification,
  onPress,
  onLongPress,
}: {
  notification: AppNotification;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const iconInfo = NOTIFICATION_ICONS[notification.type] || NOTIFICATION_ICONS.system;
  const timeAgo = getTimeAgo(notification.createdAt);

  return (
    <TouchableOpacity
      style={[styles.notificationItem, !notification.read && styles.notificationUnread]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconInfo.bg }]}>
        <MaterialCommunityIcons name={iconInfo.name as any} size={22} color={iconInfo.color} />
      </View>

      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text
            style={[styles.notificationTitle, !notification.read && styles.unreadTitle]}
            numberOfLines={1}
          >
            {notification.title}
          </Text>
          <Text style={styles.notificationTime}>{timeAgo}</Text>
        </View>
        <Text style={styles.notificationBody} numberOfLines={2}>
          {notification.body}
        </Text>
      </View>

      {!notification.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

function getTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } =
    useNotificationsStore();

  const handleNotificationPress = (notification: AppNotification) => {
    markAsRead(notification.id);

    // Navigate based on type
    switch (notification.type) {
      case 'match':
      case 'message':
        if (notification.data?.matchId) {
          router.push('/(tabs)/messages');
        }
        break;
      case 'like':
      case 'super_like':
        router.push('/(tabs)/discover');
        break;
      default:
        break;
    }
  };

  const renderNotification = ({ item }: { item: AppNotification }) => (
    <NotificationItem
      notification={item}
      onPress={() => handleNotificationPress(item)}
      onLongPress={() => markAsRead(item.id)}
    />
  );

  // Group notifications: "New" (unread) and "Earlier" (read)
  const unreadNotifications = notifications.filter((n) => !n.read);
  const readNotifications = notifications.filter((n) => n.read);

  const sections = [
    ...(unreadNotifications.length > 0
      ? [{ title: 'New', data: unreadNotifications }]
      : []),
    ...(readNotifications.length > 0
      ? [{ title: 'Earlier', data: readNotifications }]
      : []),
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton icon="arrow-left" size={24} onPress={() => router.back()} />
        <View style={styles.headerCenter}>
          <Text variant="titleLarge" style={styles.headerTitle}>
            Notifications
          </Text>
          {unreadCount > 0 && (
            <Text style={styles.headerBadge}>{unreadCount}</Text>
          )}
        </View>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markReadText}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="bell-outline" size={64} color="#ddd" />
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptySubtitle}>
            When you get matches, messages, or super likes, you'll see them here
          </Text>
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(item) => item.title}
          renderItem={({ item: section }) => (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {section.title === 'New' && (
                  <Text style={styles.sectionCount}>{section.data.length}</Text>
                )}
              </View>
              {section.data.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onPress={() => handleNotificationPress(notification)}
                  onLongPress={() => markAsRead(notification.id)}
                />
              ))}
            </View>
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {notifications.length > 0 && (
        <View style={styles.footer}>
          <Button
            mode="outlined"
            onPress={clearAll}
            style={styles.clearButton}
            textColor="#999"
          >
            Clear All
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 8,
    backgroundColor: '#141414',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerBadge: {
    backgroundColor: '#00E676',
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  markReadText: {
    color: '#00E676',
    fontSize: 13,
    fontWeight: '500',
    marginRight: 12,
  },
  list: {
    paddingBottom: 20,
  },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCount: {
    backgroundColor: '#00E676',
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },

  // Notification item
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  notificationUnread: {
    backgroundColor: '#1B3A2A',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
    gap: 2,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationTitle: {
    fontSize: 15,
    color: '#FFF',
    flex: 1,
  },
  unreadTitle: {
    fontWeight: 'bold',
  },
  notificationTime: {
    fontSize: 12,
    color: '#555',
  },
  notificationBody: {
    fontSize: 13,
    color: '#A0A0A0',
    lineHeight: 18,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00E676',
  },

  // Empty
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 12,
    backgroundColor: '#141414',
    borderTopWidth: 1,
    borderTopColor: '#1C1C1C',
  },
  clearButton: {
    borderColor: '#ddd',
    borderRadius: 30,
  },
});
