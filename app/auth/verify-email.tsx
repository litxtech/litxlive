import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react-native';
import { router } from 'expo-router';
import { authService } from '@/services/auth';

export default function VerifyEmailScreen() {
  const [email, setEmail] = useState<string>('');
  const [isResending, setIsResending] = useState<boolean>(false);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadEmailFromStorage();
  }, []);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const loadEmailFromStorage = async () => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const raw = window.sessionStorage.getItem('signup_step1_v2');
        if (raw) {
          const data = JSON.parse(raw);
          const emailFromCreds = window.sessionStorage.getItem('signup_email');
          setEmail(emailFromCreds || data.email || '');
          return;
        }
      }
    } catch {}
    try {
      const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
      const raw = await AsyncStorage.getItem('signup_step1_v2');
      if (raw) {
        const data = JSON.parse(raw);
        const emailFromCreds = await AsyncStorage.getItem('signup_email');
        setEmail(emailFromCreds || data.email || '');
      }
    } catch {}
  };

  const handleResendEmail = async () => {
    if (!email) {
      setErrorMessage('Email address not found. Please sign up again.');
      return;
    }

    if (resendCooldown > 0) {
      return;
    }

    setIsResending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await authService.resendVerificationEmail(email);
      
      if (result.success) {
        setSuccessMessage('Verification email sent! Please check your inbox.');
        setResendCooldown(60);
      } else {
        setErrorMessage(result.message || 'Failed to resend email. Please try again.');
      }
    } catch {
      setErrorMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6a11cb', '#2575fc']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.card}>
            <View style={styles.iconContainer}>
              <Mail color="#6a11cb" size={64} />
            </View>

            <Text style={styles.title}>Check Your Email</Text>
            <Text style={styles.description}>
              We&apos;ve sent you a verification link. Please check your inbox and click the link to verify your account.
            </Text>

            <View style={styles.infoBox}>
              <CheckCircle color="#4caf50" size={20} />
              <Text style={styles.infoText}>
                Verification link sent successfully
              </Text>
            </View>

            {email && (
              <Text style={styles.emailText}>
                Sent to: <Text style={styles.emailBold}>{email}</Text>
              </Text>
            )}

            {successMessage && (
              <View style={styles.successBox}>
                <CheckCircle color="#4caf50" size={20} />
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            )}

            {errorMessage && (
              <View style={styles.errorBox}>
                <AlertCircle color="#f44336" size={20} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.resendButton,
                (isResending || resendCooldown > 0) && styles.resendButtonDisabled
              ]}
              onPress={handleResendEmail}
              disabled={isResending || resendCooldown > 0}
              testID="resendEmailButton"
            >
              {isResending ? (
                <ActivityIndicator color="#6a11cb" size="small" />
              ) : (
                <>
                  <RefreshCw color="#6a11cb" size={18} />
                  <Text style={styles.resendButtonText}>
                    {resendCooldown > 0 
                      ? `Resend in ${resendCooldown}s` 
                      : 'Resend Email'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.note}>
              Didn&apos;t receive the email? Check your spam folder or contact support.
            </Text>

            <TouchableOpacity
              style={styles.button}
              onPress={() => router.replace('/auth')}
              testID="backToSignInButton"
            >
              <LinearGradient
                colors={['#6a11cb', '#2575fc']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Back to Sign In</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f4ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 24,
    width: '100%',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: '500' as const,
  },
  emailText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  emailBold: {
    fontWeight: '600' as const,
    color: '#333',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginBottom: 16,
    width: '100%',
  },
  successText: {
    flex: 1,
    fontSize: 13,
    color: '#2e7d32',
    fontWeight: '500' as const,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginBottom: 16,
    width: '100%',
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#c62828',
    fontWeight: '500' as const,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#6a11cb',
  },
  resendButtonDisabled: {
    opacity: 0.5,
    borderColor: '#ccc',
  },
  resendButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#6a11cb',
  },
  note: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#6a11cb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: 'white',
  },
});
