import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Text, IconButton, Avatar, Surface, Button, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/auth';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

interface BlockedUser {
  id: string;
  blockedId: string;
  name: string;
  photo: string;
  blockedAt: string;
}

export default function BlockedUsersScreen() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlocked();
  }, []);

  const fetchBlocked = async () => {
    try {
      const res = await fetch(`${API_URL}/safety/blocked`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setBlockedUsers(data.blockedUsers || []);
      }
    } catch {
      // Stay empty
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = (user: BlockedUser) => {
    Alert.alert(
      'Unblock User',
      `Are you sure you want to unblock ${user.name}? They will be able to see your profile again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: async () => {
            try {
              await fetch(`${API_URL}/safety/block/${user.blockedId}`, {
                method: 'DELETE',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
              });
              setBlockedUsers((prev) => prev.filter((u) => u.id !== user.id));
            } catch {
              Alert.alert('Error', 'Failed to unblock user.');
            }
          },
        },
      ]
    );
  };

  const renderBlockedUser = ({ item }: { item: BlockedUser }) => (
    <View style={styles.userItem}>
      <Avatar.Image size={56} source={{ uri: item.photo }} />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.blockReason}>Blocked</Text>
        <Text style={styles.blockDate}>{item.blockedAt}</Text>
      </View>
      <TouchableOpacity
        style={styles.unblockButton}
        onPress={() => handleUnblock(item)}
        activeOpacity={0.7}
      >
        <Text style={styles.unblockText}>Unblock</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton icon="arrow-left" size={24} onPress={() => router.back()} />
        <Text variant="titleLarge" style={styles.headerTitle}>
          Blocked Users
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#00E676" style={{ marginTop: 40 }} />
      ) : blockedUsers.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="account-check" size={64} color="#ddd" />
          <Text style={styles.emptyTitle}>No blocked users</Text>
          <Text style={styles.emptySubtitle}>
            When you block someone, they won't be able to see your profile, send you messages, or find you in search.
          </Text>
        </View>
      ) : (
        <FlatList
          data={blockedUsers}
          renderItem={renderBlockedUser}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
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
  headerTitle: {
    fontWeight: 'bold',
    color: '#FFF',
  },
  list: {
    padding: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    gap: 14,
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  blockReason: {
    fontSize: 13,
    color: '#555',
  },
  blockDate: {
    fontSize: 12,
    color: '#555',
  },
  unblockButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#00E676',
  },
  unblockText: {
    color: '#00E676',
    fontSize: 13,
    fontWeight: '600',
  },
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
});
