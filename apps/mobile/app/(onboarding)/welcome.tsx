import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STEPS = [
  { icon: 'camera', label: 'Add your photos', desc: 'Show the real you' },
  { icon: 'text', label: 'Write your bio', desc: 'Tell us about yourself' },
  { icon: 'tag-heart', label: 'Pick your interests', desc: 'Find people like you' },
  { icon: 'tune-vertical', label: 'Set preferences', desc: 'Who do you want to meet?' },
];

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome to</Text>
        <Text style={styles.logo}>🔥 Spark</Text>
        <Text style={styles.subtitle}>
          Let's set up your profile so you can start meeting amazing people
        </Text>
      </View>

      <View style={styles.steps}>
        {STEPS.map((step, i) => (
          <View key={i} style={styles.stepRow}>
            <View style={styles.stepIcon}>
              <MaterialCommunityIcons name={step.icon as any} size={22} color="#00E676" />
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepLabel}>{step.label}</Text>
              <Text style={styles.stepDesc}>{step.desc}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#555" />
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={() => router.push('/(onboarding)/photos')}
          style={styles.startButton}
          labelStyle={styles.startButtonLabel}
        >
          Get Started
        </Button>
        <Button
          mode="text"
          onPress={() => router.push('/(tabs)')}
          textColor="#A0A0A0"
        >
          Skip for now
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  greeting: {
    fontSize: 16,
    color: '#A0A0A0',
    marginBottom: 8,
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#00E676',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#A0A0A0',
    textAlign: 'center',
    lineHeight: 24,
  },
  steps: {
    paddingHorizontal: 24,
    gap: 4,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderRadius: 14,
    padding: 16,
    gap: 14,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1B3A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepInfo: {
    flex: 1,
  },
  stepLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  stepDesc: {
    fontSize: 12,
    color: '#A0A0A0',
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 8,
  },
  startButton: {
    backgroundColor: '#00E676',
    borderRadius: 30,
    paddingVertical: 4,
  },
  startButtonLabel: {
    color: '#000000',
    fontWeight: 'bold',
    letterSpacing: 0.5,
    fontSize: 15,
  },
});
