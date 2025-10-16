import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TestResult = {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  details?: any;
};

export default function TestMatchQueueFinal() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const insets = useSafeAreaInsets();

  if (!supabase) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ title: 'Match Queue Test' }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>❌ Supabase not initialized</Text>
          <Text style={styles.errorSubtext}>Check your .env configuration</Text>
        </View>
      </View>
    );
  }

  const updateResult = (name: string, status: TestResult['status'], message?: string, details?: any) => {
    setResults(prev => {
      const existing = prev.find(r => r.name === name);
      if (existing) {
        return prev.map(r => r.name === name ? { ...r, status, message, details } : r);
      }
      return [...prev, { name, status, message, details }];
    });
  };

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);

    if (!supabase) {
      updateResult('Supabase Check', 'error', 'Supabase client not initialized');
      setIsRunning(false);
      return;
    }

    const client = supabase;

    try {
      updateResult('Auth Check', 'running');
      const { data: { user }, error: authError } = await client.auth.getUser();
      
      if (authError || !user) {
        updateResult('Auth Check', 'error', 'Not authenticated. Please login first.', { authError });
        setIsRunning(false);
        return;
      }
      
      updateResult('Auth Check', 'success', `Logged in as: ${user.email}`, { userId: user.id });

      updateResult('Connection Test', 'running');
      const { error: healthError } = await client
        .from('match_queue')
        .select('user_id', { head: true, count: 'exact' })
        .limit(1);

      if (healthError) {
        updateResult('Connection Test', 'error', 'Cannot connect to match_queue table', { 
          error: healthError.message,
          code: healthError.code,
          details: healthError.details,
          hint: healthError.hint
        });
        setIsRunning(false);
        return;
      }

      updateResult('Connection Test', 'success', 'Table accessible');

      updateResult('Cleanup Old Entry', 'running');
      const { error: deleteError } = await client
        .from('match_queue')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) {
        updateResult('Cleanup Old Entry', 'error', 'Delete failed', { error: deleteError });
      } else {
        updateResult('Cleanup Old Entry', 'success', 'Old entries cleaned');
      }

      updateResult('Insert Test (Auto user_id)', 'running');
      const { data: insertData, error: insertError } = await client
        .from('match_queue')
        .insert({
          tags: ['test', 'video', 'tr'],
          lang: 'tr'
        })
        .select('*')
        .single();

      if (insertError) {
        updateResult('Insert Test (Auto user_id)', 'error', 'Insert failed', {
          error: insertError.message,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint
        });
      } else {
        updateResult('Insert Test (Auto user_id)', 'success', 'Insert successful', insertData);
      }

      updateResult('Select Test', 'running');
      const { data: selectData, error: selectError } = await client
        .from('match_queue')
        .select('*')
        .order('queued_at', { ascending: false });

      if (selectError) {
        updateResult('Select Test', 'error', 'Select failed', { error: selectError });
      } else {
        updateResult('Select Test', 'success', `Found ${selectData?.length || 0} entries`, selectData);
      }

      updateResult('Update Test', 'running');
      const { data: updateData, error: updateError } = await client
        .from('match_queue')
        .update({ tags: ['updated', 'test'] })
        .eq('user_id', user.id)
        .select('*')
        .single();

      if (updateError) {
        updateResult('Update Test', 'error', 'Update failed', { error: updateError });
      } else {
        updateResult('Update Test', 'success', 'Update successful', updateData);
      }

      updateResult('Final Cleanup', 'running');
      const { error: finalDeleteError } = await client
        .from('match_queue')
        .delete()
        .eq('user_id', user.id);

      if (finalDeleteError) {
        updateResult('Final Cleanup', 'error', 'Cleanup failed', { error: finalDeleteError });
      } else {
        updateResult('Final Cleanup', 'success', 'Test data cleaned');
      }

    } catch (error: any) {
      updateResult('Unexpected Error', 'error', error.message, { error });
    }

    setIsRunning(false);
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'running': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'running': return '⏳';
      default: return '⚪';
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Stack.Screen options={{ title: 'Match Queue Test (Final)' }} />
      
      <View style={styles.header}>
        <Text style={styles.title}>Match Queue Final Test</Text>
        <Text style={styles.subtitle}>Complete RLS & Trigger Verification</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, isRunning && styles.buttonDisabled]}
        onPress={runTests}
        disabled={isRunning}
      >
        {isRunning ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Run All Tests</Text>
        )}
      </TouchableOpacity>

      <ScrollView style={styles.results}>
        {results.map((result, index) => (
          <View key={index} style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultIcon}>{getStatusIcon(result.status)}</Text>
              <Text style={styles.resultName}>{result.name}</Text>
            </View>
            
            {result.message && (
              <Text style={[styles.resultMessage, { color: getStatusColor(result.status) }]}>
                {result.message}
              </Text>
            )}
            
            {result.details && (
              <View style={styles.detailsContainer}>
                <Text style={styles.detailsText}>
                  {JSON.stringify(result.details, null, 2)}
                </Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {results.length > 0 && !isRunning && (
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            ✅ Success: {results.filter(r => r.status === 'success').length} | 
            ❌ Failed: {results.filter(r => r.status === 'error').length}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#ef4444',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#94a3b8',
  },
  header: {
    padding: 20,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
  },
  button: {
    margin: 20,
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  results: {
    flex: 1,
    padding: 20,
  },
  resultCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
    flex: 1,
  },
  resultMessage: {
    fontSize: 14,
    marginBottom: 8,
  },
  detailsContainer: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  detailsText: {
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: 'monospace',
  },
  summary: {
    padding: 20,
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
    textAlign: 'center',
  },
});
