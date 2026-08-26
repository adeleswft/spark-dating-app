import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, MD3DarkTheme } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const queryClient = new QueryClient();

const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#00E676',
    primaryContainer: '#1B3A2A',
    secondary: '#00BFA5',
    secondaryContainer: '#1A3330',
    surface: '#141414',
    background: '#0A0A0A',
    error: '#FF5252',
    onPrimary: '#000000',
    onSurface: '#FFFFFF',
    onBackground: '#FFFFFF',
    outline: '#2A2A2A',
  },
};

export default function RootLayout() {
  return (
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
  );
}
