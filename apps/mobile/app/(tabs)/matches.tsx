import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/auth';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

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
            // Map API format to screen format
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
        {item.photo ? (
          <View style={styles.photoCircle}>
            <Text style={styles.photoLetter}>{item.name[0]}</Text>
          </View>
        ) : (
          <View style={styles.photoCircle}>
            <Text style={styles.photoLetter}>{item.name[0]}</Text>
          </View>
        )}
        {item.isNew && <View style={styles.newBadge} />}
      </View>
      <View style={styles.matchInfo}>
        <Text variant="titleMedium" style={styles.name}>{item.name}</Text>
        <Text variant="bodySmall" style={styles.lastMessage} numberOfLines={1}>{item.lastMessage}</Text>
      </View>
      <View style={styles.scoreBadge}>
        <MaterialCommunityIcons name="star" size={14} color="#00E676" />
        <Text style={styles.scoreText}>{item.compatibilityScore}%</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>Matches</Text>
        <Text variant="bodyLarge" style={styles.subtitle}>{matches.length} matches</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#00E676" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={matches}
          renderItem={renderMatch}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="account-group-outline" size={64} color="#333" />
              <Text style={styles.emptyTitle}>No matches yet</Text>
              <Text style={styles.emptySubtitle}>Start swiping to find your match!</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20, backgroundColor: '#0A0A0A' },
  title: { fontWeight: 'bold', color: '#FFFFFF' },
  subtitle: { color: '#A0A0A0', marginTop: 4 },
  list: { padding: 16 },
  matchItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#141414', borderRadius: 16, padding: 12, marginBottom: 12 },
  photoContainer: { position: 'relative' },
  photoCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#1B3A2A', justifyContent: 'center', alignItems: 'center' },
  photoLetter: { fontSize: 24, fontWeight: 'bold', color: '#00E676' },
  newBadge: { position: 'absolute', top: 0, right: 0, width: 16, height: 16, borderRadius: 8, backgroundColor: '#00E676', borderWidth: 2, borderColor: '#141414' },
  matchInfo: { flex: 1, marginLeft: 12 },
  name: { fontWeight: 'bold', color: '#FFFFFF' },
  lastMessage: { color: '#A0A0A0', marginTop: 4 },
  scoreBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1B3A2A', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  scoreText: { fontSize: 12, fontWeight: 'bold', color: '#00E676' },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#A0A0A0', marginTop: 8 },
});
