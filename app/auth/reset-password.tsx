import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock, Eye, EyeOff } from 'lucide-react-native';
import { router } from 'expo-router';
import { authService } from '@/services/auth';

export default function ResetPasswordScreen() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.updatePassword(newPassword);

      if (response.success) {
        Alert.alert(
          'Success',
          'Password updated successfully',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(tabs)/home'),
            },
          ]
        );
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update password';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <LinearGradient
            colors={['#F04F8F', '#FF6B9D']}
            style={styles.logoContainer}
          >
            <Text style={styles.logo}>LITX</Text>
          </LinearGradient>
          <Text style={styles.subtitle}>Reset Password</Text>
          <Text style={styles.description}>Enter your new password</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Lock color="#888" size={20} />
            <TextInput
              style={styles.input}
              placeholder="New Password"
              placeholderTextColor="#888"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showPassword}
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeOff color="#888" size={20} />
              ) : (
                <Eye color="#888" size={20} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Lock color="#888" size={20} />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#888"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity
            style={styles.authButton}
            onPress={handleResetPassword}
            disabled={isLoading || !newPassword || !confirmPassword}
          >
            <LinearGradient
              colors={['#F04F8F', '#FF6B9D']}
              style={styles.authButtonGradient}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.authButtonText}>Update Password</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111315',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: 'white',
  },
  subtitle: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: 'white',
  },
  eyeButton: {
    padding: 4,
  },
  authButton: {
    marginTop: 16,
  },
  authButtonGradient: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  authButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: 'white',
  },
});
