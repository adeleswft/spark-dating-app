import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useOnboardingStore, ALL_INTERESTS, INTEREST_CATEGORY_MAP } from '../../stores/onboarding';
import OnboardingProgress from '../../components/OnboardingProgress';

const ALL_CATEGORIES = Object.keys(INTEREST_CATEGORY_MAP);

export default function InterestsScreen() {
  const router = useRouter();
  const { interests, toggleInterest } = useOnboardingStore();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const canProceed = interests.length >= 3;

  const filteredInterests = search
    ? ALL_INTERESTS.filter((i) => i.toLowerCase().includes(search.toLowerCase()))
    : selectedCategory
    ? INTEREST_CATEGORY_MAP[selectedCategory] || []
    : ALL_INTERESTS;

  return (
    <View style={styles.container}>
      <OnboardingProgress currentStep={2} totalSteps={4} title="Interests" />
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color="#555" />
          <TextInput placeholder="Search" value={search} onChangeText={setSearch} style={styles.searchInput} underlineColor="transparent" activeUnderlineColor="transparent" placeholderTextColor="#555" theme={{ colors: { onSurfaceVariant: '#A0A0A0' } }} />
          {search ? <TouchableOpacity onPress={() => setSearch('')}><MaterialCommunityIcons name="close-circle" size={18} color="#555" /></TouchableOpacity> : null}
        </View>
      </View>
      {!search && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
          <TouchableOpacity style={[styles.categoryTab, !selectedCategory && styles.categoryTabActive]} onPress={() => setSelectedCategory(null)}>
            <Text style={[styles.categoryTabText, !selectedCategory && styles.categoryTabTextActive]}>All</Text>
          </TouchableOpacity>
          {ALL_CATEGORIES.map((cat) => (
            <TouchableOpacity key={cat} style={[styles.categoryTab, selectedCategory === cat && styles.categoryTabActive]} onPress={() => setSelectedCategory(cat)}>
              <Text style={[styles.categoryTabText, selectedCategory === cat && styles.categoryTabTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      <View style={styles.countBar}>
        <Text style={styles.countText}>{interests.length} selected{interests.length < 3 ? ` · ${3 - interests.length} more needed` : ''}</Text>
      </View>
      <ScrollView style={styles.chipsScroll} contentContainerStyle={styles.chipsContainer}>
        {filteredInterests.map((interest) => {
          const isSelected = interests.includes(interest);
          return (
            <TouchableOpacity key={interest} onPress={() => toggleInterest(interest)} activeOpacity={0.7} style={[styles.chip, isSelected && styles.chipSelected]}>
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{interest}</Text>
              {isSelected && <MaterialCommunityIcons name="check" size={14} color="#000" />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      {interests.length > 0 && (
        <View style={styles.selectedStrip}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {interests.map((interest) => (
              <TouchableOpacity key={interest} onPress={() => toggleInterest(interest)}>
                <View style={styles.selectedChip}>
                  <Text style={styles.selectedChipText}>{interest}</Text>
                  <MaterialCommunityIcons name="close" size={12} color="#00E676" />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      <View style={styles.footer}>
        <Button mode="contained" onPress={() => router.push('/(onboarding)/preferences')} disabled={!canProceed} style={[styles.nextButton, !canProceed && styles.nextButtonDisabled]} labelStyle={styles.nextButtonLabel}>CONTINUE</Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  searchContainer: { paddingHorizontal: 24, marginBottom: 8 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#141414', borderRadius: 12, paddingHorizontal: 12, height: 44 },
  searchInput: { flex: 1, backgroundColor: 'transparent', fontSize: 15, minHeight: 0, paddingVertical: 0, color: '#FFF' },
  categories: { paddingHorizontal: 24, gap: 8, paddingBottom: 8 },
  categoryTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1C1C1C' },
  categoryTabActive: { backgroundColor: '#00E676' },
  categoryTabText: { fontSize: 13, color: '#A0A0A0', fontWeight: '500' },
  categoryTabTextActive: { color: '#000' },
  countBar: { paddingHorizontal: 24, paddingVertical: 6 },
  countText: { fontSize: 13, color: '#555' },
  chipsScroll: { flex: 1 },
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 24, paddingBottom: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, backgroundColor: '#1C1C1C', gap: 6 },
  chipSelected: { backgroundColor: '#00E676' },
  chipText: { fontSize: 14, color: '#E0E0E0' },
  chipTextSelected: { color: '#000', fontWeight: '500' },
  selectedStrip: { paddingHorizontal: 24, paddingVertical: 8, maxHeight: 48 },
  selectedChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#1B3A2A', marginRight: 8, gap: 4 },
  selectedChipText: { fontSize: 12, color: '#00E676', fontWeight: '500' },
  footer: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 8 },
  nextButton: { backgroundColor: '#00E676', borderRadius: 30, paddingVertical: 4 },
  nextButtonDisabled: { backgroundColor: '#2A2A2A' },
  nextButtonLabel: { color: '#000', fontWeight: 'bold', letterSpacing: 1, fontSize: 15 },
});
