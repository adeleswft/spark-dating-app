import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useOnboardingStore } from '../../stores/onboarding';
import OnboardingProgress from '../../components/OnboardingProgress';

const GENDER_OPTIONS = [
  { value: 'male', label: 'Men' },
  { value: 'female', label: 'Women' },
  { value: 'non-binary', label: 'Non-Binary' },
  { value: 'other', label: 'Other' },
];

const RELATIONSHIP_GOALS = [
  { value: 'serious', label: 'Serious Relationship', emoji: '💍', desc: 'Looking for long-term commitment' },
  { value: 'casual', label: 'Casual Dating', emoji: '🎉', desc: 'Open to meeting new people' },
  { value: 'friends', label: 'New Friends', emoji: '🤝', desc: 'Looking for friendship first' },
  { value: 'unsure', label: 'Not Sure Yet', emoji: '🤷', desc: 'Going with the flow' },
];

function Stepper({ value, min, max, onChange, label }: { value: number; min: number; max: number; onChange: (v: number) => void; label: string }) {
  return (
    <View style={styles.stepperRow}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <TouchableOpacity style={[styles.stepperButton, value <= min && styles.stepperButtonDisabled]} onPress={() => value > min && onChange(value - 1)} disabled={value <= min}>
        <MaterialCommunityIcons name="minus" size={20} color={value <= min ? '#333' : '#00E676'} />
      </TouchableOpacity>
      <Text style={styles.stepperValue}>{value}</Text>
      <TouchableOpacity style={[styles.stepperButton, value >= max && styles.stepperButtonDisabled]} onPress={() => value < max && onChange(value + 1)} disabled={value >= max}>
        <MaterialCommunityIcons name="plus" size={20} color={value >= max ? '#333' : '#00E676'} />
      </TouchableOpacity>
    </View>
  );
}

export default function PreferencesScreen() {
  const router = useRouter();
  const { minAge, maxAge, maxDistance, genderPreference, relationshipGoals, setPreferences } = useOnboardingStore();

  const toggleGenderPref = (gender: 'male' | 'female' | 'non-binary' | 'other') => {
    setPreferences({
      genderPreference: genderPreference.includes(gender) ? genderPreference.filter((g) => g !== gender) : [...genderPreference, gender],
    });
  };

  return (
    <View style={styles.container}>
      <OnboardingProgress currentStep={3} totalSteps={4} title="Set Your Preferences" />
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text variant="bodyLarge" style={styles.description}>Help our AI find the best matches for you.</Text>
        <Surface style={styles.sectionCard} elevation={0}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Age Range</Text>
          <Stepper label="Min" value={minAge} min={18} max={maxAge - 1} onChange={(v) => setPreferences({ minAge: v })} />
          <Stepper label="Max" value={maxAge} min={minAge + 1} max={80} onChange={(v) => setPreferences({ maxAge: v })} />
        </Surface>
        <Surface style={styles.sectionCard} elevation={0}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Maximum Distance</Text>
          <Stepper label="Miles" value={maxDistance} min={1} max={100} onChange={(v) => setPreferences({ maxDistance: v })} />
        </Surface>
        <Surface style={styles.sectionCard} elevation={0}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Show Me</Text>
          <Text variant="bodySmall" style={styles.sectionHint}>Select all that apply</Text>
          <View style={styles.genderGrid}>
            {GENDER_OPTIONS.map((option) => {
              const isSelected = genderPreference.includes(option.value as any);
              return (
                <Button key={option.value} mode={isSelected ? 'contained' : 'outlined'} onPress={() => toggleGenderPref(option.value as any)} style={[styles.genderButton, isSelected && styles.genderButtonActive]} labelStyle={[styles.genderButtonLabel, isSelected && styles.genderButtonLabelActive]}>
                  {option.label}
                </Button>
              );
            })}
          </View>
        </Surface>
        <Surface style={styles.sectionCard} elevation={0}>
          <Text variant="titleMedium" style={styles.sectionTitle}>What Are You Looking For?</Text>
          <View style={styles.goalsList}>
            {RELATIONSHIP_GOALS.map((goal) => {
              const isSelected = relationshipGoals === goal.value;
              return (
                <Button key={goal.value} mode={isSelected ? 'contained' : 'outlined'} onPress={() => setPreferences({ relationshipGoals: goal.value as any })} style={[styles.goalButton, isSelected && styles.goalButtonActive]} contentStyle={styles.goalButtonContent} labelStyle={[styles.goalButtonLabel, isSelected && styles.goalButtonLabelActive]} icon={() => <Text style={styles.goalEmoji}>{goal.emoji}</Text>}>
                  {goal.label}
                </Button>
              );
            })}
          </View>
        </Surface>
      </ScrollView>
      <View style={styles.footer}>
        <Button mode="outlined" onPress={() => router.back()} style={styles.backButton} textColor="#A0A0A0">Back</Button>
        <Button mode="contained" onPress={() => router.push('/(onboarding)/complete')} style={styles.nextButton} labelStyle={styles.nextButtonLabel}>Finish Setup</Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  content: { flex: 1 },
  contentContainer: { paddingHorizontal: 24, paddingBottom: 16 },
  description: { color: '#A0A0A0', textAlign: 'center', marginBottom: 16 },
  sectionCard: { padding: 16, borderRadius: 16, marginBottom: 12, backgroundColor: '#141414' },
  sectionTitle: { fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  sectionHint: { color: '#555', marginBottom: 8 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 16 },
  stepperLabel: { width: 40, color: '#A0A0A0', fontWeight: '500' },
  stepperButton: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: '#00E676', justifyContent: 'center', alignItems: 'center' },
  stepperButtonDisabled: { borderColor: '#333' },
  stepperValue: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', minWidth: 40, textAlign: 'center' },
  genderGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  genderButton: { flex: 1, minWidth: 120, borderRadius: 12, borderColor: '#2A2A2A' },
  genderButtonActive: { backgroundColor: '#00E676' },
  genderButtonLabel: { fontSize: 13, color: '#A0A0A0' },
  genderButtonLabelActive: { color: '#000' },
  goalsList: { gap: 8, marginTop: 8 },
  goalButton: { borderRadius: 12, justifyContent: 'flex-start', borderColor: '#2A2A2A' },
  goalButtonActive: { backgroundColor: '#00E676' },
  goalButtonContent: { justifyContent: 'flex-start', paddingVertical: 4 },
  goalButtonLabel: { fontSize: 14, flex: 1, color: '#A0A0A0' },
  goalButtonLabelActive: { color: '#000' },
  goalEmoji: { fontSize: 20 },
  footer: { flexDirection: 'row', paddingHorizontal: 24, paddingBottom: 40, paddingTop: 8, gap: 12 },
  backButton: { flex: 1, borderRadius: 30, borderColor: '#2A2A2A' },
  nextButton: { flex: 2, backgroundColor: '#00E676', borderRadius: 30 },
  nextButtonLabel: { color: '#000', fontWeight: 'bold' },
});
