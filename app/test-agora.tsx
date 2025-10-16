import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { agoraService } from '@/services/agoraService';

export default function TestAgoraScreen() {
  const [channelName, setChannelName] = useState('test-room-' + Date.now());
  const [uid, setUid] = useState('12345');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testTokenGeneration = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      console.log('[Test] Testing token generation...', { channelName, uid });

      const response = await agoraService.getRTCToken(channelName, parseInt(uid));

      console.log('[Test] Response:', response);

      if (response.success && response.token) {
        setResult({
          success: true,
          token: response.token,
          tokenLength: response.token.length,
          expireAt: response.expireAt,
          channel: response.channel,
          uid: response.uid,
          appId: response.appId,
        });
      } else {
        setError(response.error || 'Unknown error');
      }
    } catch (err: any) {
      console.error('[Test] Error:', err);
      setError(err.message || 'Failed to generate token');
    } finally {
      setLoading(false);
    }
  };

  const testDirectAPI = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const baseUrl = process.env.EXPO_PUBLIC_API_URL || '';
      const url = `${baseUrl}/api/agora/rtc-token?channel=${channelName}&uid=${uid}`;

      console.log('[Test] Testing direct API call:', url);

      const response = await fetch(url);
      const data = await response.json();

      console.log('[Test] Direct API response:', data);

      if (response.ok) {
        setResult(data);
      } else {
        setError(JSON.stringify(data));
      }
    } catch (err: any) {
      console.error('[Test] Direct API error:', err);
      setError(err.message || 'Failed to call API');
    } finally {
      setLoading(false);
    }
  };

  const testHealthCheck = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const baseUrl = process.env.EXPO_PUBLIC_API_URL || '';
      const url = `${baseUrl}/api/health`;

      console.log('[Test] Testing health check:', url);

      const response = await fetch(url);
      const data = await response.json();

      console.log('[Test] Health check response:', data);

      setResult(data);
    } catch (err: any) {
      console.error('[Test] Health check error:', err);
      setError(err.message || 'Failed to check health');
    } finally {
      setLoading(false);
    }
  };

  const testAgoraCredentials = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const baseUrl = process.env.EXPO_PUBLIC_API_URL || '';
      const url = `${baseUrl}/api/test-agora`;

      console.log('[Test] Testing Agora credentials:', url);

      const response = await fetch(url);
      const data = await response.json();

      console.log('[Test] Credentials response:', data);

      setResult(data);
    } catch (err: any) {
      console.error('[Test] Credentials error:', err);
      setError(err.message || 'Failed to check credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Agora Test',
          headerStyle: { backgroundColor: '#0B0B10' },
          headerTintColor: '#FFFFFF',
        }}
      />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuration</Text>
          <Text style={styles.infoText}>
            API URL: {process.env.EXPO_PUBLIC_API_URL || 'Not set'}
          </Text>
          <Text style={styles.infoText}>
            App ID: {process.env.EXPO_PUBLIC_AGORA_APP_ID || 'Not set'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Parameters</Text>
          
          <Text style={styles.label}>Channel Name:</Text>
          <TextInput
            style={styles.input}
            value={channelName}
            onChangeText={setChannelName}
            placeholder="Enter channel name"
            placeholderTextColor="#6B7280"
          />

          <Text style={styles.label}>UID:</Text>
          <TextInput
            style={styles.input}
            value={uid}
            onChangeText={setUid}
            placeholder="Enter UID"
            placeholderTextColor="#6B7280"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tests</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={testHealthCheck}
            disabled={loading}
          >
            <Text style={styles.buttonText}>1. Test Health Check</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={testAgoraCredentials}
            disabled={loading}
          >
            <Text style={styles.buttonText}>2. Test Agora Credentials</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={testDirectAPI}
            disabled={loading}
          >
            <Text style={styles.buttonText}>3. Test Direct API Call</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={testTokenGeneration}
            disabled={loading}
          >
            <Text style={styles.buttonText}>4. Test Token Generation (Service)</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Testing...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Error:</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {result && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>Result:</Text>
            <ScrollView horizontal>
              <Text style={styles.resultText}>{JSON.stringify(result, null, 2)}</Text>
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B10',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
    fontFamily: 'monospace' as const,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'monospace' as const,
  },
  button: {
    backgroundColor: '#374151',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    backgroundColor: '#7F1D1D',
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FCA5A5',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#FEE2E2',
    fontFamily: 'monospace' as const,
  },
  resultContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#10B981',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 12,
    color: '#D1D5DB',
    fontFamily: 'monospace' as const,
  },
});
