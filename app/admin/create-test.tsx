import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CheckCircle, AlertTriangle, ArrowLeft, UserPlus } from 'lucide-react-native';
import { useAdmin } from '@/providers/AdminProvider';
import { trpc } from '@/lib/trpc';

export default function AdminCreateTestUser() {
  const router = useRouter();
  const { isAuthenticated, checkSession } = useAdmin();
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/admin');
    }
  }, [isAuthenticated, router]);

  const mutation = trpc.admin.users.createTest.useMutation();

  const runCreate = async () => {
    try {
      setStatus('running');
      setMessage('');
      console.log('[CreateTest] Sending request');
      const res = await mutation.mutateAsync({
        email: 'support@litxtech.com',
        password: 'Bavul2017?',
        unlimited: true,
        name: 'LITX QA',
        verifyEmail: true,
      });
      console.log('[CreateTest] Response:', res);
      setStatus('success');
      setMessage(`OK: ${res.message} (unique_id: ${res.uniqueId ?? 'n/a'})`);
    } catch (e: any) {
      console.error('[CreateTest] Error:', e);
      setStatus('error');
      setMessage(e?.message ?? 'Unknown error');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" onPress={() => router.back()} style={styles.backButton} testID="create-test-back">
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Test User</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.desc}>Creates a QA account with unlimited coins for quick end-to-end testing.</Text>
        <Text style={styles.kv}>Email: <Text style={styles.kvValue}>support@litxtech.com</Text></Text>
        <Text style={styles.kv}>Password: <Text style={styles.kvValue}>Bavul2017?</Text></Text>

        <TouchableOpacity
          accessibilityRole="button"
          testID="create-test-run"
          onPress={runCreate}
          disabled={status === 'running'}
          style={[styles.runButton, status === 'running' && styles.runButtonDisabled]}
        >
          {status === 'running' ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={styles.runRow}>
              <UserPlus size={18} color="#fff" />
              <Text style={styles.runText}>Create Test Account</Text>
            </View>
          )}
        </TouchableOpacity>

        {status === 'success' && (
          <View style={styles.successRow} testID="create-test-success">
            <CheckCircle size={18} color="#10B981" />
            <Text style={styles.successText}>{message}</Text>
          </View>
        )}
        {status === 'error' && (
          <View style={styles.errorRow} testID="create-test-error">
            <AlertTriangle size={18} color="#FF4444" />
            <Text style={styles.errorText}>Failed: {message}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B10' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#333' },
  backButton: { padding: 8, marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  card: { margin: 16, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#333' },
  desc: { color: '#ccc', marginBottom: 12, fontSize: 13, lineHeight: 20 },
  kv: { color: '#888', marginTop: 4, fontSize: 13 },
  kvValue: { color: '#fff' },
  runButton: { marginTop: 16, backgroundColor: '#F04F8F', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  runButtonDisabled: { opacity: 0.6 },
  runRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  runText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  successRow: { marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 8 },
  successText: { color: '#10B981', fontSize: 13 },
  errorRow: { marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 8 },
  errorText: { color: '#FF8888', fontSize: 13 },
});
