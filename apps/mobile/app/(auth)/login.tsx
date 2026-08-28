import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/auth';

export default function LoginScreen() {
  const router = useRouter();
  const { login, loading, error, clearError, isAuthenticated } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)/discover');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (error) {
      Alert.alert('Login Failed', error);
      clearError();
    }
  }, [error]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    const success = await login(email.trim(), password.trim());
    if (success) {
      router.replace('/(tabs)/discover');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>🔥 Spark</Text>
        <Text style={styles.welcome}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
          outlineColor="#2A2A2A"
          activeOutlineColor="#00E676"
          theme={{ colors: { onSurfaceVariant: '#A0A0A0' } }}
        />
        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          mode="outlined"
          secureTextEntry
          style={styles.input}
          outlineColor="#2A2A2A"
          activeOutlineColor="#00E676"
          theme={{ colors: { onSurfaceVariant: '#A0A0A0' } }}
        />
        <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} style={{ alignSelf: 'flex-end', marginTop: -8 }}>
          <Text style={{ color: '#00E676', fontSize: 13 }}>Forgot Password?</Text>
        </TouchableOpacity>
        <Button
          mode="contained"
          onPress={handleLogin}
          loading={loading}
          disabled={loading || !email.trim() || !password.trim()}
          style={styles.loginButton}
          labelStyle={styles.loginButtonLabel}
        >
          Sign In
        </Button>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.footerText}>
            Don't have an account? <Text style={styles.footerLink}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A', justifyContent: 'center', paddingHorizontal: 32 },
  header: { alignItems: 'center', marginBottom: 48 },
  logo: { fontSize: 36, fontWeight: 'bold', color: '#00E676', marginBottom: 16 },
  welcome: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  subtitle: { fontSize: 16, color: '#A0A0A0', marginTop: 4 },
  form: { gap: 16 },
  input: { backgroundColor: '#141414' },
  loginButton: { backgroundColor: '#00E676', borderRadius: 30, paddingVertical: 4, marginTop: 8 },
  loginButtonLabel: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  footer: { alignItems: 'center', marginTop: 32 },
  footerText: { color: '#A0A0A0', fontSize: 14 },
  footerLink: { color: '#00E676', fontWeight: '600' },
});
