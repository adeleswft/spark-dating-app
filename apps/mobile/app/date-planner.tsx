import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Button, Surface, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay, interpolate, Extrapolation } from 'react-native-reanimated';
import { useAuthStore } from '../stores/auth';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

interface DateIdea {
  id: string;
  title: string;
  description: string;
  emoji: string;
  category: string;
  budget: 'Free' | '$' | '$$' | '$$$';
  duration: string;
  location: string;
  matchScore: number;
  tags: string[];
}

const SAMPLE_DATES: DateIdea[] = [
  { id: '1', title: 'Coffee & Book Swap', description: "Grab coffee at a cozy café and bring a book to swap. Perfect for sparking deep conversation in a relaxed setting.", emoji: '☕', category: 'Casual', budget: '$', duration: '1-2 hours', location: 'Local café', matchScore: 94, tags: ['Coffee', 'Books', 'Conversation'] },
  { id: '2', title: 'Sunset Hike', description: "Find a scenic trail and catch the sunset together. Nature creates the best backdrop for meaningful talks.", emoji: '🥾', category: 'Adventure', budget: 'Free', duration: '2-3 hours', location: 'Nearest trail', matchScore: 91, tags: ['Hiking', 'Nature', 'Photography'] },
  { id: '3', title: 'Cooking Challenge', description: "Pick a random recipe and cook it together. The mess is half the fun — and you get to eat the results!", emoji: '🍳', category: 'Creative', budget: '$$', duration: '2-3 hours', location: "Someone's kitchen", matchScore: 88, tags: ['Cooking', 'Food', 'Competition'] },
  { id: '4', title: 'Museum & Coffee', description: "Explore a local museum, then debrief over coffee. Art gives you endless things to talk about.", emoji: '🎨', category: 'Culture', budget: '$$', duration: '3-4 hours', location: 'Art museum', matchScore: 85, tags: ['Art', 'Culture', 'Coffee'] },
  { id: '5', title: 'Farmers Market Brunch', description: "Wander through a farmers market, sample everything, then find a spot for brunch.", emoji: '🥐', category: 'Foodie', budget: '$$', duration: '2-3 hours', location: 'Farmers market', matchScore: 87, tags: ['Food', 'Farmers Market', 'Brunch'] },
  { id: '6', title: 'Board Game Night', description: "Hit up a board game café or bring your favorites. Friendly competition reveals personality fast.", emoji: '🎲', category: 'Fun', budget: '$', duration: '2-3 hours', location: 'Board game café', matchScore: 82, tags: ['Games', 'Competition', 'Indoor'] },
  { id: '7', title: 'Live Music Night', description: "Check local venues for live music. Great vibes, easy conversation, and shared energy.", emoji: '🎵', category: 'Nightlife', budget: '$$', duration: '3-4 hours', location: 'Local venue', matchScore: 89, tags: ['Music', 'Nightlife', 'Concerts'] },
  { id: '8', title: 'Beach Day', description: "Pack snacks, bring a frisbee, and enjoy the sun. Simple, classic, and always a good time.", emoji: '🏖️', category: 'Outdoor', budget: 'Free', duration: '4+ hours', location: 'Nearest beach', matchScore: 90, tags: ['Beach', 'Outdoor', 'Relaxation'] },
  { id: '9', title: 'Thrift Store Challenge', description: "Set a $10 budget and find the best outfit for each other. Guaranteed laughs.", emoji: '👗', category: 'Creative', budget: '$', duration: '1-2 hours', location: 'Thrift store', matchScore: 86, tags: ['Fashion', 'Challenge', 'Shopping'] },
  { id: '10', title: 'Stargazing', description: "Drive somewhere dark, bring blankets, and look up. The universe makes everything feel more intimate.", emoji: '🌌', category: 'Romantic', budget: 'Free', duration: '2-3 hours', location: 'Open field', matchScore: 93, tags: ['Nature', 'Romantic', 'Night'] },
];

const CATEGORIES = ['All', 'Casual', 'Adventure', 'Foodie', 'Culture', 'Creative', 'Fun', 'Nightlife', 'Romantic'];
const BUDGETS = ['All', '$', '$$', '$$$'];

function DateCard({ date, index }: { date: DateIdea; index: number }) {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(index * 80, withSpring(1, { damping: 15, stiffness: 120 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value,
  }));

  return (
    <Animated.View style={[styles.dateCard, animatedStyle]}>
      <View style={styles.dateCardHeader}>
        <Text style={styles.dateEmoji}>{date.emoji}</Text>
        <View style={styles.dateMatchBadge}>
          <MaterialCommunityIcons name="star" size={12} color="#000" />
          <Text style={styles.dateMatchText}>{date.matchScore}%</Text>
        </View>
      </View>
      <Text style={styles.dateTitle}>{date.title}</Text>
      <Text style={styles.dateDescription}>{date.description}</Text>
      <View style={styles.dateMeta}>
        <View style={styles.dateMetaItem}>
          <MaterialCommunityIcons name="clock-outline" size={14} color="#555" />
          <Text style={styles.dateMetaText}>{date.duration}</Text>
        </View>
        <View style={styles.dateMetaItem}>
          <MaterialCommunityIcons name="map-marker" size={14} color="#555" />
          <Text style={styles.dateMetaText}>{date.location}</Text>
        </View>
        <View style={styles.dateMetaItem}>
          <Text style={styles.dateBudget}>{date.budget}</Text>
        </View>
      </View>
      <View style={styles.dateTags}>
        {date.tags.map((tag) => (
          <View key={tag} style={styles.dateTag}>
            <Text style={styles.dateTagText}>{tag}</Text>
          </View>
        ))}
      </View>
      <View style={styles.dateActions}>
        <Button mode="outlined" style={styles.dateActionButton} labelStyle={styles.dateActionLabel} textColor="#A0A0A0">Save for Later</Button>
        <Button mode="contained" style={[styles.dateActionButton, styles.dateActionPrimary]} labelStyle={[styles.dateActionLabel, { color: '#000' }]}>Suggest This</Button>
      </View>
    </Animated.View>
  );
}

export default function DatePlannerScreen() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedBudget, setSelectedBudget] = useState('All');
  const [dates, setDates] = useState<DateIdea[]>(SAMPLE_DATES);

  // Fetch date ideas from API
  useEffect(() => {
    let cancelled = false;
    const fetchDates = async () => {
      try {
        const res = await fetch(`${API_URL}/date-planner`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && Array.isArray(data.dates) && data.dates.length > 0) {
            setDates(data.dates);
          }
        }
      } catch {
        // API unreachable, use sample data
      }
    };
    fetchDates();
    return () => { cancelled = true; };
  }, [token]);

  const filteredDates = dates.filter((d) => {
    if (selectedCategory !== 'All' && d.category !== selectedCategory) return false;
    if (selectedBudget !== 'All' && d.budget !== selectedBudget) return false;
    return true;
  }).sort((a, b) => b.matchScore - a.matchScore);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" size={24} onPress={() => router.back()} iconColor="#FFF" />
        <View style={styles.headerCenter}>
          <Text variant="titleLarge" style={styles.headerTitle}>Date Planner</Text>
          <Text style={styles.headerSubtitle}>AI-suggested dates based on your interests</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Category filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.filterChip, selectedCategory === cat && styles.filterChipActive]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[styles.filterChipText, selectedCategory === cat && styles.filterChipTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Budget filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {BUDGETS.map((b) => (
          <TouchableOpacity
            key={b}
            style={[styles.budgetChip, selectedBudget === b && styles.budgetChipActive]}
            onPress={() => setSelectedBudget(b)}
          >
            <Text style={[styles.budgetChipText, selectedBudget === b && styles.budgetChipTextActive]}>{b === 'All' ? 'Any Budget' : b}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results */}
      <ScrollView style={styles.dateList} showsVerticalScrollIndicator={false}>
        <Text style={styles.resultCount}>{filteredDates.length} date ideas</Text>
        {filteredDates.map((date, i) => (
          <DateCard key={date.id} date={date} index={i} />
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingBottom: 12, backgroundColor: '#0A0A0A' },
  headerCenter: { flex: 1 },
  headerTitle: { fontWeight: 'bold', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 12, color: '#A0A0A0', marginTop: 2 },
  filters: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: '#1C1C1C' },
  filterChipActive: { backgroundColor: '#00E676' },
  filterChipText: { fontSize: 13, color: '#A0A0A0', fontWeight: '500' },
  filterChipTextActive: { color: '#000' },
  budgetChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: '#141414', borderWidth: 1, borderColor: '#2A2A2A' },
  budgetChipActive: { borderColor: '#00E676', backgroundColor: '#1B3A2A' },
  budgetChipText: { fontSize: 13, color: '#A0A0A0' },
  budgetChipTextActive: { color: '#00E676' },
  dateList: { flex: 1, paddingHorizontal: 16 },
  resultCount: { fontSize: 13, color: '#555', marginBottom: 12, marginLeft: 4 },
  dateCard: { backgroundColor: '#141414', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#1C1C1C' },
  dateCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  dateEmoji: { fontSize: 40 },
  dateMatchBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#00E676', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, gap: 4 },
  dateMatchText: { fontSize: 12, fontWeight: 'bold', color: '#000' },
  dateTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
  dateDescription: { fontSize: 14, color: '#A0A0A0', lineHeight: 20, marginBottom: 12 },
  dateMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  dateMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateMetaText: { fontSize: 12, color: '#555' },
  dateBudget: { fontSize: 14, fontWeight: 'bold', color: '#00E676' },
  dateTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  dateTag: { backgroundColor: '#1C1C1C', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  dateTagText: { fontSize: 11, color: '#A0A0A0' },
  dateActions: { flexDirection: 'row', gap: 8 },
  dateActionButton: { flex: 1, borderRadius: 20, borderColor: '#2A2A2A' },
  dateActionPrimary: { backgroundColor: '#00E676', borderColor: '#00E676' },
  dateActionLabel: { fontSize: 13, fontWeight: '600' },
});
