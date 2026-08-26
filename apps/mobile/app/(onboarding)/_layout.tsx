import { Stack } from 'expo-router';
import { useOnboardingStore } from '../../stores/onboarding';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="photos" />
      <Stack.Screen name="bio" />
      <Stack.Screen name="interests" />
      <Stack.Screen name="preferences" />
      <Stack.Screen name="complete" />
    </Stack>
  );
}
