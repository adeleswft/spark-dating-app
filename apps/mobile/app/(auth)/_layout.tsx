import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '../../stores/auth';
import { useOnboardingStore } from '../../stores/onboarding';

export default function AuthLayout() {
  const { isAuthenticated } = useAuthStore();
  const { isComplete: onboardingComplete } = useOnboardingStore();

  if (isAuthenticated && onboardingComplete) {
    return <Redirect href="/(tabs)/discover" />;
  }

  if (isAuthenticated && !onboardingComplete) {
    return <Redirect href="/(onboarding)/welcome" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="phone-verify" />
    </Stack>
  );
}
