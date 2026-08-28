import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { API_URL } from '../../services/config';

type Step = 'email' | 'reset';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestReset = async () => {
    if (!email.trim()) {
      Alert.alert('Email required', 'Enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/password-reset/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      // In development, the API returns the token directly
      if (data.resetToken) {
        setResetToken(data.resetToken);
        setStep('reset');
        Alert.alert('Reset Token', `Development mode: ${data.resetToken.substring(0, 8)}...`);
      } else {
        Alert.alert('Check your email', 'If an account exists with this email, you\'ll receive a reset link.');
        router.back();
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to request reset');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim()) {
      Alert.alert('Password required', 'Enter a new password.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Too short', 'Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/password-reset/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, newPassword: newPassword.trim() }),
      });

      const data = await res.json();

      if (data.success) {
        Alert.alert('Success', 'Your password has been reset. Please log in.', [
          { text: 'OK', onPress: () => router.replace('/(auth)/login') },
        ]);
      } else {
        Alert.alert('Error', data.error || 'Failed to reset password');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="lock-reset" size={48} color="#00E676" />
          <Text style={styles.title}>
            {step === 'email' ? 'Forgot Password' : 'New Password'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 'email'
              ? 'Enter your email and we\'ll send you a reset link.'
              : 'Enter your new password below.'}
          </Text>
        </View>

        {step === 'email' ? (
          <View style={styles.form}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              label="Email"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              outlineColor="#2A2A2A"
              activeOutlineColor="#00E676"
              theme={{ colors: { onSurfaceVariant: '#A0A0A0' } }}
            />
            <Button
              mode="contained"
              onPress={handleRequestReset}
              loading={loading}
              disabled={loading}
              style={styles.primaryButton}
              labelStyle={styles.primaryButtonLabel}
            >
              Send Reset Link
            </Button>
          </View>
        ) : (
          <View style={styles.form}>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              mode="outlined"
              label="New Password"
              placeholder="At least 8 characters"
              secureTextEntry
              style={styles.input}
              outlineColor="#2A2A2A"
              activeOutlineColor="#00E676"
              theme={{ colors: { onSurfaceVariant: '#A0A0A0' } }}
            />
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              mode="outlined"
              label="Confirm Password"
              placeholder="Re-enter password"
              secureTextEntry
              style={styles.input}
              outlineColor="#2A2A2A"
              activeOutlineColor="#00E676"
              theme={{ colors: { onSurfaceVariant: '#A0A0A0' } }}
            />
            <Button
              mode="contained"
              onPress={handleResetPassword}
              loading={loading}
              disabled={loading}
              style={styles.primaryButton}
              labelStyle={styles.primaryButtonLabel}
            >
              Reset Password
            </Button>
          </View>
        )}

        <Button
          mode="text"
          onPress={() => router.back()}
          textColor="#A0A0A0"
          style={styles.backButton}
        >
          Back to Login
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  scrollContent: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginTop: 16, marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#A0A0A0', textAlign: 'center', lineHeight: 20 },
  form: { gap: 16 },
  input: { backgroundColor: '#141414' },
  primaryButton: { backgroundColor: '#00E676', borderRadius: 30, paddingVertical: 4, marginTop: 8 },
  primaryButtonLabel: { color: '#000', fontWeight: 'bold', letterSpacing: 0.5 },
  backButton: { marginTop: 24, alignSelf: 'center' },
});
