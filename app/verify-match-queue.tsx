import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function VerifyMatchQueue() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const addLog = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runVerification = async () => {
    if (!supabase) {
      addLog('❌ Supabase client is not initialized');
      return;
    }

    setLoading(true);
    setResults([]);

    try {
      addLog('🔍 Starting verification...');

      // Test 1: Check if we can query the table
      addLog('📊 Test 1: Checking if match_queue table exists...');
      const { data: tableData, error: tableError } = await supabase
        .from('match_queue')
        .select('*')
        .limit(1);

      if (tableError) {
        addLog(`❌ Table check failed: ${tableError.message}`);
        addLog(`   Code: ${tableError.code}`);
        addLog(`   Details: ${JSON.stringify(tableError.details)}`);
      } else {
        addLog('✅ Table exists and is accessible');
        addLog(`   Current rows: ${tableData?.length || 0}`);
      }

      // Test 2: Check authentication
      addLog('🔐 Test 2: Checking authentication...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        addLog('❌ Not authenticated');
        addLog('   Please login first');
      } else {
        addLog('✅ Authenticated');
        addLog(`   User ID: ${user.id}`);
        addLog(`   Email: ${user.email || 'N/A'}`);
      }

      // Test 3: Try to insert (if authenticated)
      if (user) {
        addLog('📝 Test 3: Testing insert...');
        const { data: insertData, error: insertError } = await supabase
          .from('match_queue')
          .insert({
            tags: ['test'],
            lang: 'en'
          })
          .select()
          .single();

        if (insertError) {
          addLog(`❌ Insert failed: ${insertError.message}`);
          addLog(`   Code: ${insertError.code}`);
          addLog(`   Details: ${JSON.stringify(insertError.details)}`);
        } else {
          addLog('✅ Insert successful');
          addLog(`   Data: ${JSON.stringify(insertData)}`);

          // Clean up
          addLog('🧹 Cleaning up test data...');
          const { error: deleteError } = await supabase
            .from('match_queue')
            .delete()
            .eq('user_id', user.id);

          if (deleteError) {
            addLog(`⚠️  Cleanup failed: ${deleteError.message}`);
          } else {
            addLog('✅ Cleanup successful');
          }
        }
      }

      addLog('✅ Verification complete!');

    } catch (error) {
      addLog(`❌ Unexpected error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Stack.Screen options={{ title: 'Verify Match Queue' }} />
      
      <View style={styles.header}>
        <Text style={styles.title}>Match Queue Verification</Text>
        <Text style={styles.subtitle}>Check if the table exists and works</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={runVerification}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Run Verification</Text>
        )}
      </TouchableOpacity>

      <ScrollView style={styles.resultsContainer}>
        {results.map((result, index) => (
          <Text key={index} style={styles.resultText}>
            {result}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  button: {
    backgroundColor: '#8B5CF6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
  },
  resultText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
    color: '#333',
  },
});
