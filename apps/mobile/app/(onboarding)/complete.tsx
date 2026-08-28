import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useOnboardingStore } from '../../stores/onboarding';
import { useAuthStore } from '../../stores/auth';
import { uploadPhotos, isLocalUri } from '../../services/photoUpload';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

export default function CompleteScreen() {
  const router = useRouter();
  const { photos, bio, interests, minAge, maxAge, maxDistance, genderPreference, relationshipGoals } = useOnboardingStore();
  const { completeOnboarding } = useOnboardingStore();
  const { token } = useAuthStore();
  const [syncing, setSyncing] = useState(false);

  const syncToAPI = async () => {
    if (!token) return;
    try {
      setSyncing(true);

      // Upload local photos to the server
      const validPhotos = photos.filter(Boolean);
      const localPhotos = validPhotos.filter(isLocalUri);
      const remotePhotos = validPhotos.filter((p) => !isLocalUri(p));

      let uploadedUrls: string[] = [];
      if (localPhotos.length > 0) {
        const results = await uploadPhotos(localPhotos, token);
        uploadedUrls = results
          .filter((r) => r.success)
          .map((r) => r.url);
      }

      // Combine remote (already uploaded) + newly uploaded
      const allPhotoUrls = [...remotePhotos, ...uploadedUrls];

      const res = await fetch(`${API_URL}/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          photos: allPhotoUrls,
          bio,
          interests,
          preferences: { minAge, maxAge, maxDistance, genderPreference, relationshipGoals },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error('Onboarding sync failed:', data);
      }
    } catch (e) {
      console.error('Onboarding sync error:', e);
    } finally {
      setSyncing(false);
    }
  };

  const handleStart = async () => {
    await syncToAPI();
    completeOnboarding();
    router.replace('/(tabs)/discover');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.checkCircle}>
          <MaterialCommunityIcons name="check" size={48} color="#000" />
        </View>

        <Text style={styles.title}>You're All Set!</Text>
        <Text style={styles.subtitle}>
          Your profile is ready to go. Start swiping and meeting amazing people!
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{photos.length}</Text>
            <Text style={styles.statLabel}>Photos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{bio.length > 0 ? '✓' : '—'}</Text>
            <Text style={styles.statLabel}>Bio</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{interests.length}</Text>
            <Text style={styles.statLabel}>Interests</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={handleStart}
          style={styles.startButton}
          labelStyle={styles.startButtonLabel}
          icon="fire"
        >
          START SWIPING
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  checkCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#00E676',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#A0A0A0',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 32,
    gap: 24,
  },
  stat: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00E676',
  },
  statLabel: {
    fontSize: 12,
    color: '#A0A0A0',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#2A2A2A',
  },
  footer: {
    width: '100%',
    paddingBottom: 40,
  },
  startButton: {
    backgroundColor: '#00E676',
    borderRadius: 30,
    paddingVertical: 6,
  },
  startButtonLabel: {
    color: '#000',
    fontWeight: 'bold',
    letterSpacing: 1,
    fontSize: 16,
  },
});
