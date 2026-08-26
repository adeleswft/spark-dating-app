import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useOnboardingStore } from '../../stores/onboarding';
import OnboardingProgress from '../../components/OnboardingProgress';

const GENDER_OPTIONS = [
  { value: 'male', label: 'Man', icon: 'gender-male' },
  { value: 'female', label: 'Woman', icon: 'gender-female' },
  { value: 'non-binary', label: 'Non-binary', icon: 'gender-transgender' },
];

export default function BioScreen() {
  const router = useRouter();
  const { name, bio, dob, gender, setName, setBio, setDob, setGender } = useOnboardingStore();
  const [localName, setLocalName] = useState(name);
  const [localBio, setLocalBio] = useState(bio);
  const [localDob, setLocalDob] = useState(dob);
  const [localGender, setLocalGender] = useState<string>(gender || '');

  const handleContinue = () => {
    if (!localName.trim()) { Alert.alert('Name required', 'Enter your first name.'); return; }
    if (!localDob.trim()) { Alert.alert('Date of birth required', 'Enter your date of birth.'); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(localDob)) { Alert.alert('Invalid date', 'Use format YYYY-MM-DD (e.g., 1995-06-15).'); return; }
    const birthDate = new Date(localDob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    if (age < 18) { Alert.alert('Age requirement', 'You must be 18+ to use Spark.'); return; }
    if (!localGender) { Alert.alert('Gender required', 'Select your gender.'); return; }
    setName(localName.trim());
    setBio(localBio.trim());
    setDob(localDob.trim());
    setGender(localGender as any);
    router.push('/(onboarding)/interests');
  };

  return (
    <View style={styles.container}>
      <OnboardingProgress currentStep={1} totalSteps={4} title="About You" />
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Name</Text>
          <TextInput value={localName} onChangeText={setLocalName} mode="outlined" maxLength={50} style={styles.input} placeholder="Your first name" placeholderTextColor="#555" outlineColor="#2A2A2A" activeOutlineColor="#00E676" theme={{ colors: { onSurfaceVariant: '#A0A0A0' } }} />
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Date of Birth</Text>
          <TextInput value={localDob} onChangeText={setLocalDob} mode="outlined" placeholder="YYYY-MM-DD" style={styles.input} keyboardType="numbers-and-punctuation" placeholderTextColor="#555" outlineColor="#2A2A2A" activeOutlineColor="#00E676" theme={{ colors: { onSurfaceVariant: '#A0A0A0' } }} />
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>I am a</Text>
          <View style={styles.genderRow}>
            {GENDER_OPTIONS.map((option) => {
              const isSelected = localGender === option.value;
              return (
                <TouchableOpacity key={option.value} style={[styles.genderOption, isSelected && styles.genderOptionActive]} onPress={() => setLocalGender(option.value)} activeOpacity={0.7}>
                  <MaterialCommunityIcons name={option.icon as any} size={20} color={isSelected ? '#000' : '#A0A0A0'} />
                  <Text style={[styles.genderLabel, isSelected && styles.genderLabelActive]}>{option.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        <View style={styles.fieldGroup}>
          <View style={styles.bioHeader}>
            <Text style={styles.label}>About me</Text>
            <Text style={styles.charCount}>{localBio.length}/500</Text>
          </View>
          <TextInput value={localBio} onChangeText={(text) => text.length <= 500 && setLocalBio(text)} mode="outlined" multiline numberOfLines={5} maxLength={500} style={styles.bioInput} placeholder="Write something about yourself..." placeholderTextColor="#555" outlineColor="#2A2A2A" activeOutlineColor="#00E676" theme={{ colors: { onSurfaceVariant: '#A0A0A0' } }} />
          {localBio.length < 50 && localBio.length > 0 && (
            <Text style={styles.bioHint}>Add at least {50 - localBio.length} more characters for a better profile</Text>
          )}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Button mode="contained" onPress={handleContinue} style={styles.nextButton} labelStyle={styles.nextButtonLabel}>CONTINUE</Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  content: { flex: 1 },
  contentContainer: { paddingHorizontal: 24, paddingBottom: 16 },
  fieldGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#FFFFFF', marginBottom: 8 },
  input: { backgroundColor: '#141414' },
  genderRow: { flexDirection: 'row', gap: 10 },
  genderOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: '#1C1C1C', gap: 6 },
  genderOptionActive: { backgroundColor: '#00E676' },
  genderLabel: { fontSize: 14, fontWeight: '500', color: '#A0A0A0' },
  genderLabelActive: { color: '#000' },
  bioHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  charCount: { fontSize: 12, color: '#555' },
  bioInput: { backgroundColor: '#141414', minHeight: 120 },
  bioHint: { fontSize: 12, color: '#00E676', marginTop: 4 },
  footer: { paddingHorizontal: 24, paddingBottom: 40 },
  nextButton: { backgroundColor: '#00E676', borderRadius: 30, paddingVertical: 4 },
  nextButtonLabel: { color: '#000', fontWeight: 'bold', letterSpacing: 1, fontSize: 15 },
});
