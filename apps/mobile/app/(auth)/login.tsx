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
      {/* Warm radial glow behind logo */}
      <View style={styles.glowOuter}>
        <View style={styles.glowInner} />
      </View>

      <View style={styles.header}>
        <Text style={styles.logo}>🔥</Text>
        <Text style={styles.brandName}>Spark</Text>
        <Text style={styles.welcome}>Welcome back</Text>
        <Text style={styles.subtitle}>Where real connections ignite</Text>
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
          outlineColor="#3D3545"
          activeOutlineColor="#E84855"
          theme={{ colors: { onSurfaceVariant: '#8A7E90' } }}
        />
        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          mode="outlined"
          secureTextEntry
          style={styles.input}
          outlineColor="#3D3545"
          activeOutlineColor="#E84855"
          theme={{ colors: { onSurfaceVariant: '#8A7E90' } }}
        />
        <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} style={{ alignSelf: 'flex-end', marginTop: -4 }}>
          <Text style={{ color: '#D4A574', fontSize: 13, fontWeight: '500' }}>Forgot Password?</Text>
        </TouchableOpacity>
        <Button
          mode="contained"
          onPress={handleLogin}
          loading={loading}
          disabled={loading || !email.trim() || !password.trim()}
          style={styles.loginButton}
          labelStyle={styles.loginButtonLabel}
          buttonColor="#E84855"
        >
          Sign In
        </Button>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.footerText}>
            Don't have an account?{' '}
            <Text style={styles.footerLink}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0B0E', justifyContent: 'center', paddingHorizontal: 32 },
  glowOuter: {
    position: 'absolute',
    top: '15%',
    alignSelf: 'center',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(232, 72, 85, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowInner: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(232, 72, 85, 0.08)',
  },
  header: { alignItems: 'center', marginBottom: 48 },
  logo: { fontSize: 48, marginBottom: 8 },
  brandName: { fontSize: 32, fontWeight: '800', color: '#E84855', letterSpacing: -0.5, marginBottom: 16 },
  welcome: { fontSize: 22, fontWeight: '700', color: '#F5EDE3' },
  subtitle: { fontSize: 14, color: '#8A7E90', marginTop: 6, letterSpacing: 0.3 },
  form: { gap: 14 },
  input: { backgroundColor: '#1A1620' },
  loginButton: { borderRadius: 30, paddingVertical: 4, marginTop: 8 },
  loginButtonLabel: { color: '#FFFFFF', fontWeight: '700', fontSize: 16, letterSpacing: 0.5 },
  footer: { alignItems: 'center', marginTop: 32 },
  footerText: { color: '#8A7E90', fontSize: 14 },
  footerLink: { color: '#E84855', fontWeight: '600' },
});
