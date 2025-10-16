import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { X, CheckCircle, XCircle, AlertCircle } from 'lucide-react-native';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: any;
}

export default function TestMatchQueueScreen() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result]);
  };

  const runTests = async () => {
    setTesting(true);
    setResults([]);

    addResult({ name: 'Check Supabase Connection', status: 'pending', message: 'Testing...' });
    
    try {
      if (!supabase) {
        addResult({ 
          name: 'Check Supabase Connection', 
          status: 'error', 
          message: 'Supabase not initialized' 
        });
        setTesting(false);
        return;
      }

      const { error: healthError } = await supabase
        .from('match_queue')
        .select('user_id', { head: true, count: 'exact' })
        .limit(1);

      if (healthError) {
        addResult({ 
          name: 'Check Supabase Connection', 
          status: 'error', 
          message: 'Supabase connection failed',
          details: healthError 
        });
        setTesting(false);
        return;
      }

      addResult({ 
        name: 'Check Supabase Connection', 
        status: 'success', 
        message: 'Connected successfully' 
      });
    } catch (error) {
      addResult({ 
        name: 'Check Supabase Connection', 
        status: 'error', 
        message: 'Connection error',
        details: error 
      });
      setTesting(false);
      return;
    }

    addResult({ name: 'Check match_queue Table', status: 'pending', message: 'Checking...' });
    
    try {
      if (!supabase) {
        addResult({ 
          name: 'Check match_queue Table', 
          status: 'error', 
          message: 'Supabase not initialized' 
        });
        setTesting(false);
        return;
      }

      const { data: tableCheck, error: tableError } = await supabase
        .from('match_queue')
        .select('*')
        .limit(1);

      if (tableError) {
        addResult({ 
          name: 'Check match_queue Table', 
          status: 'error', 
          message: 'Table does not exist or no access',
          details: tableError 
        });
      } else {
        addResult({ 
          name: 'Check match_queue Table', 
          status: 'success', 
          message: `Table exists! Found ${tableCheck?.length || 0} entries` 
        });
      }
    } catch (error) {
      addResult({ 
        name: 'Check match_queue Table', 
        status: 'error', 
        message: 'Error checking table',
        details: error 
      });
    }

    addResult({ name: 'Test Insert to match_queue', status: 'pending', message: 'Testing...' });
    
    try {
      if (!supabase) {
        addResult({ 
          name: 'Test Insert to match_queue', 
          status: 'error', 
          message: 'Supabase not initialized' 
        });
        setTesting(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        addResult({ 
          name: 'Test Insert to match_queue', 
          status: 'error', 
          message: 'Not logged in - please login first to test insert' 
        });
      } else {
        const { data: insertData, error: insertError } = await supabase
          .from('match_queue')
          .insert({
            user_id: user.id,
            tags: ['test'],
            lang: 'en',
          })
          .select()
          .single();

        if (insertError) {
          addResult({ 
            name: 'Test Insert to match_queue', 
            status: 'error', 
            message: `Insert failed: ${insertError.message}`,
            details: { code: insertError.code, message: insertError.message, hint: insertError.hint } 
          });
        } else {
          addResult({ 
            name: 'Test Insert to match_queue', 
            status: 'success', 
            message: 'Insert successful!',
            details: insertData 
          });

          await supabase
            .from('match_queue')
            .delete()
            .eq('user_id', user.id);
        }
      }
    } catch (error) {
      addResult({ 
        name: 'Test Insert to match_queue', 
        status: 'error', 
        message: 'Insert error',
        details: error 
      });
    }

    addResult({ name: 'Check presence Table', status: 'pending', message: 'Checking...' });
    
    try {
      if (!supabase) {
        addResult({ 
          name: 'Check presence Table', 
          status: 'error', 
          message: 'Supabase not initialized' 
        });
        setTesting(false);
        return;
      }

      const { data: presenceCheck, error: presenceError } = await supabase
        .from('presence')
        .select('*')
        .limit(1);

      if (presenceError) {
        addResult({ 
          name: 'Check presence Table', 
          status: 'error', 
          message: 'Table does not exist or no access',
          details: presenceError 
        });
      } else {
        addResult({ 
          name: 'Check presence Table', 
          status: 'success', 
          message: `Table exists! Found ${presenceCheck?.length || 0} entries` 
        });
      }
    } catch (error) {
      addResult({ 
        name: 'Check presence Table', 
        status: 'error', 
        message: 'Error checking table',
        details: error 
      });
    }

    addResult({ name: 'Check RLS Policies (End-to-End)', status: 'pending', message: 'Testing...' });
    
    try {
      if (!supabase) {
        addResult({ 
          name: 'Check RLS Policies (End-to-End)', 
          status: 'error', 
          message: 'Supabase not initialized' 
        });
        setTesting(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        addResult({ 
          name: 'Check RLS Policies (End-to-End)', 
          status: 'error', 
          message: 'No authenticated user - cannot test RLS' 
        });
      } else {
        const { data: insertData, error: insertError } = await supabase
          .from('match_queue')
          .insert({
            user_id: user.id,
            tags: ['rls-test'],
            lang: 'en',
          })
          .select()
          .single();

        if (insertError) {
          addResult({ 
            name: 'Check RLS Policies (End-to-End)', 
            status: 'error', 
            message: `RLS Insert failed: ${insertError.message}`,
            details: { code: insertError.code, message: insertError.message } 
          });
        } else {
          const { data: selectData, error: selectError } = await supabase
            .from('match_queue')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (selectError) {
            addResult({ 
              name: 'Check RLS Policies (End-to-End)', 
              status: 'error', 
              message: `RLS Select failed: ${selectError.message}`,
              details: selectError 
            });
          } else {
            const { error: deleteError } = await supabase
              .from('match_queue')
              .delete()
              .eq('user_id', user.id);

            if (deleteError) {
              addResult({ 
                name: 'Check RLS Policies (End-to-End)', 
                status: 'error', 
                message: `RLS Delete failed: ${deleteError.message}`,
                details: deleteError 
              });
            } else {
              addResult({ 
                name: 'Check RLS Policies (End-to-End)', 
                status: 'success', 
                message: 'RLS policies working! Insert → Select → Delete all successful' 
              });
            }
          }
        }
      }
    } catch (error) {
      addResult({ 
        name: 'Check RLS Policies (End-to-End)', 
        status: 'error', 
        message: 'RLS check error',
        details: error 
      });
    }

    setTesting(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle color="#10B981" size={24} />;
      case 'error':
        return <XCircle color="#EF4444" size={24} />;
      case 'pending':
        return <ActivityIndicator color="#F59E0B" size={24} />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return '#10B981';
      case 'error':
        return '#EF4444';
      case 'pending':
        return '#F59E0B';
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X color="white" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Match Queue Test</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={styles.infoCard}>
            <AlertCircle color="#F59E0B" size={24} />
            <Text style={styles.infoText}>
              This test checks if the match_queue table exists and is properly configured in Supabase.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.testButton, testing && styles.testButtonDisabled]}
            onPress={runTests}
            disabled={testing}
          >
            {testing ? (
              <>
                <ActivityIndicator color="white" />
                <Text style={styles.testButtonText}>Running Tests...</Text>
              </>
            ) : (
              <Text style={styles.testButtonText}>Run Tests</Text>
            )}
          </TouchableOpacity>

          {results.length > 0 && (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsTitle}>Test Results:</Text>
              
              {results.map((result, index) => (
                <View key={index} style={styles.resultCard}>
                  <View style={styles.resultHeader}>
                    {getStatusIcon(result.status)}
                    <Text style={styles.resultName}>{result.name}</Text>
                  </View>
                  
                  <Text style={[styles.resultMessage, { color: getStatusColor(result.status) }]}>
                    {result.message}
                  </Text>
                  
                  {result.details && (
                    <View style={styles.detailsContainer}>
                      <Text style={styles.detailsTitle}>Details:</Text>
                      <Text style={styles.detailsText}>
                        {JSON.stringify(result.details, null, 2)}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {results.length > 0 && !testing && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Summary</Text>
              <Text style={styles.summaryText}>
                ✅ Passed: {results.filter(r => r.status === 'success').length}
              </Text>
              <Text style={styles.summaryText}>
                ❌ Failed: {results.filter(r => r.status === 'error').length}
              </Text>
              <Text style={styles.summaryText}>
                ⏳ Pending: {results.filter(r => r.status === 'pending').length}
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111315',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#F59E0B',
    lineHeight: 20,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#F04F8F',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 24,
  },
  testButtonDisabled: {
    opacity: 0.6,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  resultsContainer: {
    gap: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  resultCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resultName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  resultMessage: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailsContainer: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  detailsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    marginBottom: 8,
  },
  detailsText: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'monospace',
  },
  summaryCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    gap: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#888',
  },
});
