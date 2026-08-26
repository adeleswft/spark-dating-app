import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/auth';
import { useOnboardingStore } from '../stores/onboarding';

export default function Index() {
  const { isAuthenticated } = useAuthStore();
  const { isComplete: onboardingComplete } = useOnboardingStore();

  // Not authenticated → auth flow
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // Authenticated but hasn't completed onboarding → onboarding flow
  if (!onboardingComplete) {
    return <Redirect href="/(onboarding)/welcome" />;
  }

  // Authenticated and onboarding complete → main app
  return <Redirect href="/(tabs)/discover" />;
}
