import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';

export default function PhoneVerifyScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const codeInputRef = useRef<any>(null);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendCode = async () => {
    if (!phone || phone.length < 10) return;
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setCodeSent(true);
      setCountdown(60);
      codeInputRef.current?.focus();
    } catch (error) {
      console.error('Failed to send code:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!code || code.length !== 6) return;
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.replace('/(tabs)/discover');
    } catch (error) {
      console.error('Verification failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.inner}>
        <Text variant="headlineLarge" style={styles.title}>📱 Verify Your Phone</Text>
        <Text variant="bodyLarge" style={styles.subtitle}>We'll send you a verification code to keep your account secure.</Text>

        {!codeSent ? (
          <>
            <TextInput label="Phone Number" value={phone} onChangeText={setPhone} mode="outlined" keyboardType="phone-pad" placeholder="+1 (555) 123-4567" placeholderTextColor="#555" style={styles.input} outlineColor="#2A2A2A" activeOutlineColor="#00E676" theme={{ colors: { onSurfaceVariant: '#A0A0A0' } }} />
            <Button mode="contained" onPress={handleSendCode} loading={loading} disabled={loading || phone.length < 10} style={styles.button} labelStyle={styles.buttonLabel}>Send Verification Code</Button>
          </>
        ) : (
          <>
            <Text variant="bodyMedium" style={styles.codeSentText}>A 6-digit code was sent to {phone}</Text>
            <TextInput ref={codeInputRef} label="Verification Code" value={code} onChangeText={setCode} mode="outlined" keyboardType="number-pad" maxLength={6} placeholderTextColor="#555" style={styles.input} outlineColor="#2A2A2A" activeOutlineColor="#00E676" theme={{ colors: { onSurfaceVariant: '#A0A0A0' } }} />
            <Button mode="contained" onPress={handleVerify} loading={loading} disabled={loading || code.length !== 6} style={styles.button} labelStyle={styles.buttonLabel}>Verify Code</Button>
            {countdown > 0 ? (
              <Text variant="bodySmall" style={styles.countdownText}>Resend code in {countdown}s</Text>
            ) : (
              <Button mode="text" onPress={handleSendCode} style={styles.resendButton} textColor="#00E676">Resend Code</Button>
            )}
          </>
        )}

        <Button mode="text" onPress={() => router.replace('/(tabs)/discover')} style={styles.skipButton} textColor="#555">Skip for now</Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  title: { textAlign: 'center', marginBottom: 8, fontWeight: 'bold', color: '#00E676' },
  subtitle: { textAlign: 'center', marginBottom: 32, color: '#A0A0A0', paddingHorizontal: 16 },
  codeSentText: { textAlign: 'center', marginBottom: 16, color: '#FFF' },
  input: { marginBottom: 16, backgroundColor: '#141414' },
  button: { marginTop: 8, paddingVertical: 6, backgroundColor: '#00E676' },
  buttonLabel: { color: '#000', fontWeight: 'bold' },
  countdownText: { textAlign: 'center', marginTop: 16, color: '#555' },
  resendButton: { marginTop: 8 },
  skipButton: { marginTop: 24 },
});
