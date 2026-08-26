import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

interface Props {
  currentStep: number;
  totalSteps: number;
  title: string;
}

export default function OnboardingProgress({ currentStep, totalSteps, title }: Props) {
  const progress = (currentStep + 1) / totalSteps;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.stepText}>
        {currentStep + 1} of {totalSteps}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 24,
    backgroundColor: '#0A0A0A',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1C1C1C',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#00E676',
  },
  stepText: {
    fontSize: 12,
    color: '#A0A0A0',
    textAlign: 'center',
    marginTop: 8,
  },
});
