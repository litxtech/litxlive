import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { authService } from '@/services/auth';
import { lumiService } from '@/services/lumiService';

export default function CredentialsScreen() {
  const { s } = useLocalSearchParams<{ s?: string }>();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasStep1, setHasStep1] = useState<boolean>(false);
  const [noDoubleSubmitPass, setNoDoubleSubmitPass] = useState<boolean>(true);
  const [dobPass, setDobPass] = useState<boolean>(false);
  const [agePass, setAgePass] = useState<boolean>(false);
  const [lumiWelcome, setLumiWelcome] = useState<string>('');

  const submitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const globalTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const validatePassword = useMemo(() => ({
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
  }), [password]);

  useEffect(() => {
    (async () => {
      try {
        lumiService.setContext('onboarding');
        const payload = await loadStep1Payload();
        if (!payload) {
          setErrorBanner('Session expired or data not found.');
          setTimeout(() => router.replace('/auth/signup'), 600);
          return;
        }
        setHasStep1(true);
        const age = computeAgeFromIso(payload.dob);
        setDobPass(Boolean(payload.dob));
        setAgePass(age !== null && age >= 18);
        
        const userName = `${payload.first_name} ${payload.last_name}`.trim();
        const welcome = await lumiService.getOnboardingWelcome(userName);
        setLumiWelcome(welcome);
        if (typeof s === 'string' && s.length > 0 && Platform.OS === 'web' && typeof window !== 'undefined' && window.crypto?.subtle) {
          const encoder = new TextEncoder();
          const data = encoder.encode(JSON.stringify(payload));
          const digest = await window.crypto.subtle.digest('SHA-256', data);
          const hashArray = Array.from(new Uint8Array(digest));
          const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          const expected = hashHex.slice(0, 16);
          if (expected !== s) {
            setErrorBanner('Session expired, please re-enter your information.');
            setTimeout(() => router.replace('/auth/signup'), 800);
          }
        }
      } catch (e) {
        setErrorBanner('Session expired, please re-enter your information.');
        setTimeout(() => router.replace('/auth/signup'), 800);
      }
    })();
  }, [s]);

  const onSubmitEmail = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setNoDoubleSubmitPass(false);
    if (submitTimerRef.current) clearTimeout(submitTimerRef.current);

    submitTimerRef.current = setTimeout(async () => {
      setErrorBanner(null);
      if (!email.includes('@')) {
        setErrorBanner('Please enter a valid email address');
        setIsSubmitting(false);
        setNoDoubleSubmitPass(true);
        return;
      }
      if (!validatePassword.length || !validatePassword.upper || !validatePassword.number) {
        setErrorBanner('Weak password. Use 8+ chars, 1 uppercase, 1 number.');
        setIsSubmitting(false);
        setNoDoubleSubmitPass(true);
        return;
      }

      setIsLoading(true);
      globalTimeoutRef.current = setTimeout(() => {
        setIsLoading(false);
        setIsSubmitting(false);
        setErrorBanner('Network timeout, please try again.');
        setNoDoubleSubmitPass(true);
      }, 8000);

      try {
        const displayName = await inferDisplayNameFromStep1();
        const res = await authService.signUpWithEmail(email, password, displayName);
        if (!res.success) {
          setErrorBanner(res.message || 'Signup failed');
          return;
        }
        try {
          if (typeof window !== 'undefined' && window.sessionStorage) {
            window.sessionStorage.setItem('signup_email', email);
          } else {
            const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
            await AsyncStorage.setItem('signup_email', email);
          }
        } catch {}
        setSuccessToast('Account created! Please verify your email.');
        router.replace('/auth/verify-email');
      } catch (e) {
        setErrorBanner('Connection error, please try again.');
      } finally {
        if (globalTimeoutRef.current) clearTimeout(globalTimeoutRef.current);
        setIsLoading(false);
        setIsSubmitting(false);
        setNoDoubleSubmitPass(true);
      }
    }, 600);
  };

  const onGoogle = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setNoDoubleSubmitPass(false);
    setErrorBanner(null);
    setSuccessToast(null);
    try {
      const res = await authService.signInWithGoogle();
      if (Platform.OS === 'web') {
        setSuccessToast('Redirecting to Google...');
        return;
      }
      if (!res.success) {
        if ((res.message || '').toLowerCase().includes('cancel')) {
          setErrorBanner('Google sign-in was canceled.');
        } else {
          setErrorBanner(res.message || 'Google authentication problem. Please try again.');
        }
        return;
      }
      router.replace('/(tabs)/home');
    } catch (e) {
      setErrorBanner('Google authentication problem. Please try again.');
    } finally {
      setIsSubmitting(false);
      setNoDoubleSubmitPass(true);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#6a11cb', '#2575fc']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.card}>
          <Text style={styles.title}>Set your credentials</Text>
          <Text style={styles.subtitle}>Secure your account</Text>
          
          {lumiWelcome && (
            <View style={styles.lumiWelcome}>
              <Text style={styles.lumiWelcomeText}>✨ {lumiWelcome}</Text>
            </View>
          )}

          {errorBanner && (
            <View style={styles.errorBanner} testID="errorBanner">
              <Text style={styles.errorBannerText}>{errorBanner}</Text>
            </View>
          )}
          {successToast && (
            <View style={styles.successToast} testID="successToast">
              <Text style={styles.successToastText}>{successToast}</Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Mail color="#888" size={20} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#888"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
              autoCorrect={false}
              testID="emailInput"
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock color="#888" size={20} />
            <TextInput
              style={styles.input}
              placeholder="Password (8+, 1 uppercase, 1 number)"
              placeholderTextColor="#888"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!isLoading}
              autoCorrect={false}
              testID="passwordInput"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton} disabled={isLoading}>
              {showPassword ? <EyeOff color="#888" size={20} /> : <Eye color="#888" size={20} />}
            </TouchableOpacity>
          </View>

          <View style={styles.passwordHints}>
            <Text style={[styles.hint, validatePassword.length && styles.hintOk]}>• 8+ chars</Text>
            <Text style={[styles.hint, validatePassword.upper && styles.hintOk]}>• Uppercase</Text>
            <Text style={[styles.hint, validatePassword.number && styles.hintOk]}>• Number</Text>
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={onSubmitEmail} disabled={isLoading || !hasStep1} testID="createWithEmail">
            <LinearGradient colors={['#6a11cb', '#2575fc']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtnInner}>
              {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.primaryText}>Create with Email</Text>}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.orRow}><View style={styles.orLine} /><Text style={styles.orText}>or</Text><View style={styles.orLine} /></View>

          <TouchableOpacity style={styles.googleBtn} onPress={onGoogle} testID="googleButton" disabled={isSubmitting}>
            <Image source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }} style={styles.googleIcon} resizeMode="contain" />
            <Text style={styles.googleText}>Continue with Google</Text>
          </TouchableOpacity>

          <View style={styles.smokeRow}>
            <View style={styles.smokeItem}>{dobPass ? <CheckCircle2 color="#2e7d32" /> : <XCircle color="#c62828" />}<Text style={styles.smokeText}>DOB filled</Text></View>
            <View style={styles.smokeItem}>{agePass ? <CheckCircle2 color="#2e7d32" /> : <XCircle color="#c62828" />}<Text style={styles.smokeText}>18+</Text></View>
            <View style={styles.smokeItem}>{noDoubleSubmitPass ? <CheckCircle2 color="#2e7d32" /> : <XCircle color="#c62828" />}<Text style={styles.smokeText}>No double submit</Text></View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

async function loadStep1Payload(): Promise<{ first_name: string; last_name: string; dob: string; country_iso2: string; city_name: string; lang: string } | null> {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const raw = window.sessionStorage.getItem('signup_step1_v2');
      if (raw) return JSON.parse(raw) as any;
    }
  } catch {}
  try {
    const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
    const raw = await AsyncStorage.getItem('signup_step1_v2');
    return raw ? (JSON.parse(raw) as any) : null;
  } catch {
    return null;
  }
}

async function inferDisplayNameFromStep1(): Promise<string> {
  const payload = await loadStep1Payload();
  if (!payload) return 'User';
  const first = payload.first_name ?? '';
  const last = payload.last_name ?? '';
  return `${first} ${last}`.trim() || 'User';
}

function computeAgeFromIso(iso: string): number | null {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(iso)) return null;
  const [yyyy, mm, dd] = iso.split('-').map((v) => parseInt(v, 10));
  const dobUTC = Date.UTC(yyyy, mm - 1, dd, 12, 0, 0);
  if (Number.isNaN(dobUTC)) return null;
  const now = new Date();
  const nowUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12, 0, 0);
  return Math.floor((nowUTC - dobUTC) / (365.2425 * 24 * 60 * 60 * 1000));
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, padding: 20 },
  card: { backgroundColor: 'rgba(255,255,255,0.98)', borderRadius: 20, padding: 20, gap: 14 },
  title: { fontSize: 22, fontWeight: '700' as const, color: '#222' },
  subtitle: { fontSize: 14, color: '#666' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', borderRadius: 14, paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 16 : 14, gap: 12, borderWidth: 2, borderColor: '#e9ecef' },
  input: { flex: 1, fontSize: 16, color: '#333' },
  eyeButton: { padding: 4 },
  passwordHints: { flexDirection: 'row', gap: 12 },
  hint: { fontSize: 12, color: '#999' },
  hintOk: { color: '#2e7d32' },
  primaryBtn: { borderRadius: 14, overflow: 'hidden' },
  primaryBtnInner: { paddingVertical: 16, alignItems: 'center' },
  primaryText: { color: 'white', fontSize: 16, fontWeight: '600' as const },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 4 },
  orLine: { flex: 1, height: 1, backgroundColor: '#e0e0e0' },
  orText: { color: '#666' },
  googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: 'white', borderRadius: 14, borderWidth: 2, borderColor: '#e9ecef', paddingVertical: 14 },
  googleIcon: { width: 18, height: 18 },
  googleText: { color: '#333', fontSize: 15, fontWeight: '600' as const },
  errorBanner: { backgroundColor: '#ffebee', borderColor: '#f44336', borderWidth: 1, padding: 12, borderRadius: 10 },
  errorBannerText: { color: '#c62828', textAlign: 'center' },
  successToast: { backgroundColor: '#e8f5e9', borderColor: '#66bb6a', borderWidth: 1, padding: 12, borderRadius: 10 },
  successToastText: { color: '#2e7d32', textAlign: 'center' },
  smokeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  smokeItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  smokeText: { fontSize: 12, color: '#555' },
  lumiWelcome: { backgroundColor: '#f3e5f5', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#9B51E0' },
  lumiWelcomeText: { fontSize: 14, color: '#6a11cb', lineHeight: 20 },
});
