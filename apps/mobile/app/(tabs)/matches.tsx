import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/auth';

import { API_URL } from '../../services/config';

interface Match {
  id: string;
  name: string;
  photo: string;
  lastMessage: string;
  compatibilityScore: number;
  isNew: boolean;
}

const SAMPLE_MATCHES: Match[] = [
  { id: 'match-1', name: 'Sarah', photo: 'https://picsum.photos/seed/sarah/200/200', lastMessage: 'Hey! I love hiking too! 🥾', compatibilityScore: 89, isNew: true },
  { id: 'match-2', name: 'Emily', photo: 'https://picsum.photos/seed/emily/200/200', lastMessage: 'That coffee shop sounds amazing!', compatibilityScore: 76, isNew: false },
  { id: 'match-3', name: 'Jessica', photo: 'https://picsum.photos/seed/jessica/200/200', lastMessage: 'Would love to check out that new restaurant!', compatibilityScore: 82, isNew: false },
];

export default function MatchesScreen() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [matches, setMatches] = useState<Match[]>(SAMPLE_MATCHES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchMatches = async () => {
      try {
        const res = await fetch(`${API_URL}/matches`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && Array.isArray(data.matches) && data.matches.length > 0) {
            const mapped = data.matches.map((m: any) => ({
              id: m.id,
              name: m.otherUser?.name || 'Unknown',
              photo: m.otherUser?.photos?.[0] || '',
              lastMessage: '',
              compatibilityScore: 85,
              isNew: true,
            }));
            setMatches(mapped);
          }
        }
      } catch {
        // Use sample data
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchMatches();
    return () => { cancelled = true; };
  }, [token]);

  const renderMatch = ({ item }: { item: Match }) => (
    <TouchableOpacity
      style={styles.matchItem}
      onPress={() => router.push({ pathname: '/(tabs)/messages', params: { conversationId: item.id } })}
      activeOpacity={0.7}
    >
      <View style={styles.photoContainer}>
        <View style={styles.photoCircle}>
          <Text style={styles.photoLetter}>{item.name[0]}</Text>
        </View>
        {item.isNew && <View style={styles.newBadge} />}
      </View>
      <View style={styles.matchInfo}>
        <Text variant="titleMedium" style={styles.name}>{item.name}</Text>
        <Text variant="bodySmall" style={styles.lastMessage} numberOfLines={1}>{item.lastMessage}</Text>
      </View>
      <View style={styles.scoreBadge}>
        <MaterialCommunityIcons name="star" size={13} color="#D4A574" />
        <Text style={styles.scoreText}>{item.compatibilityScore}%</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Matches</Text>
        <Text style={styles.subtitle}>{matches.length} connections</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#E84855" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={matches}
          renderItem={renderMatch}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="account-group-outline" size={56} color="#3D3545" />
              <Text style={styles.emptyTitle}>No matches yet</Text>
              <Text style={styles.emptySubtitle}>Start swiping to find your connection</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0B0E' },
  header: { paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20 },
  title: { fontSize: 26, fontWeight: '800', color: '#F5EDE3', letterSpacing: -0.5 },
  subtitle: { color: '#8A7E90', marginTop: 4, fontSize: 14 },
  list: { padding: 16 },
  matchItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2A2530', borderRadius: 16, padding: 12, marginBottom: 10 },
  photoContainer: { position: 'relative' },
  photoCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#3D1520', justifyContent: 'center', alignItems: 'center' },
  photoLetter: { fontSize: 22, fontWeight: '700', color: '#E84855' },
  newBadge: { position: 'absolute', top: 0, right: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: '#E84855', borderWidth: 2, borderColor: '#2A2530' },
  matchInfo: { flex: 1, marginLeft: 12 },
  name: { fontWeight: '700', color: '#F5EDE3' },
  lastMessage: { color: '#8A7E90', marginTop: 3 },
  scoreBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3D1520', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, gap: 3 },
  scoreText: { fontSize: 12, fontWeight: '700', color: '#D4A574' },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#F5EDE3', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#8A7E90', marginTop: 8 },
});
