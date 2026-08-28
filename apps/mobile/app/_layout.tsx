import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, MD3DarkTheme } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ErrorBoundary } from '../components/ErrorBoundary';

const queryClient = new QueryClient();

const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#E84855',
    primaryContainer: '#3D1520',
    secondary: '#6C3A8A',
    secondaryContainer: '#2A1838',
    surface: '#2A2530',
    surfaceVariant: '#1A1620',
    background: '#0D0B0E',
    error: '#FF5252',
    onPrimary: '#FFFFFF',
    onSurface: '#F5EDE3',
    onBackground: '#F5EDE3',
    outline: '#3D3545',
  },
};

export default function RootLayout() {
  return (
    <ErrorBoundary>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={theme}>
          <Stack>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="profile-review"
              options={{ headerShown: false, presentation: 'card' }}
            />
            <Stack.Screen
              name="notifications"
              options={{ headerShown: false, presentation: 'card' }}
            />
            <Stack.Screen
              name="settings"
              options={{ headerShown: false, presentation: 'card' }}
            />
            <Stack.Screen
              name="verification"
              options={{ headerShown: false, presentation: 'card' }}
            />
            <Stack.Screen
              name="blocked-users"
              options={{ headerShown: false, presentation: 'card' }}
            />
            <Stack.Screen
              name="edit-profile"
              options={{ headerShown: false, presentation: 'card' }}
            />
            <Stack.Screen
              name="date-planner"
              options={{ headerShown: false, presentation: 'card' }}
            />
            <Stack.Screen
              name="subscription"
              options={{ headerShown: false, presentation: 'card' }}
            />
            <Stack.Screen
              name="refund-policy"
              options={{ headerShown: false, presentation: 'card' }}
            />
          </Stack>
          <StatusBar style="light" />
        </PaperProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
    </ErrorBoundary>);
}
