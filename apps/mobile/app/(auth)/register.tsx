import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/auth';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, loading: isLoading } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Invalid email';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    try {
      await register(name.trim(), email.trim(), password);
      router.replace('/(onboarding)/welcome');
    } catch (e: any) {
      Alert.alert('Registration Failed', e?.message || 'Something went wrong');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>⚡ Spark</Text>
          <Text style={styles.subtitle}>Create your account</Text>
        </View>

        {/* Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Name</Text>
          <View style={[styles.inputWrapper, errors.name && styles.inputError]}>
            <Ionicons name="person-outline" size={20} color="#A0A0A0" />
            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor="#666"
              value={name}
              onChangeText={(t) => { setName(t); setErrors((p) => ({ ...p, name: '' })); }}
              autoCapitalize="words"
            />
          </View>
          {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
        </View>

        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
            <Ionicons name="mail-outline" size={20} color="#A0A0A0" />
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#666"
              value={email}
              onChangeText={(t) => { setEmail(t); setErrors((p) => ({ ...p, email: '' })); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>
          {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
        </View>

        {/* Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
            <Ionicons name="lock-closed-outline" size={20} color="#A0A0A0" />
            <TextInput
              style={styles.input}
              placeholder="At least 8 characters"
              placeholderTextColor="#666"
              value={password}
              onChangeText={(t) => { setPassword(t); setErrors((p) => ({ ...p, password: '' })); }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#A0A0A0"
              />
            </TouchableOpacity>
          </View>
          {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
        </View>

        {/* Confirm Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm Password</Text>
          <View style={[styles.inputWrapper, errors.confirmPassword && styles.inputError]}>
            <Ionicons name="lock-closed-outline" size={20} color="#A0A0A0" />
            <TextInput
              style={styles.input}
              placeholder="Repeat your password"
              placeholderTextColor="#666"
              value={confirmPassword}
              onChangeText={(t) => { setConfirmPassword(t); setErrors((p) => ({ ...p, confirmPassword: '' })); }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
          </View>
          {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
        </View>

        {/* Register Button */}
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#0A0A0A" />
          ) : (
            <Text style={styles.buttonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        {/* Login Link */}
        <View style={styles.loginLink}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text style={styles.loginLinkText}>Sign In</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Terms */}
        <Text style={styles.terms}>
          By creating an account you agree to our{' '}
          <Text style={styles.termsLink}>Terms of Service</Text>,{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>, and{' '}
          <Text style={styles.termsLink}>No Refund Policy</Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  scroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logo: { fontSize: 42, fontWeight: '900', color: '#00E676' },
  subtitle: { fontSize: 16, color: '#A0A0A0', marginTop: 8 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#E0E0E0', marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1C',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    paddingHorizontal: 14,
    height: 52,
  },
  inputError: { borderColor: '#FF5252' },
  input: { flex: 1, marginLeft: 10, fontSize: 16, color: '#FFF' },
  errorText: { color: '#FF5252', fontSize: 12, marginTop: 4 },
  button: {
    backgroundColor: '#00E676',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#0A0A0A', fontSize: 16, fontWeight: '700' },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: { color: '#A0A0A0', fontSize: 14 },
  loginLinkText: { color: '#00E676', fontSize: 14, fontWeight: '600' },
  terms: { textAlign: 'center', color: '#666', fontSize: 12, marginTop: 16, lineHeight: 18 },
  termsLink: { color: '#00E676' },
});
