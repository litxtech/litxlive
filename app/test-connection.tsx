import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, CheckCircle, XCircle, AlertCircle } from 'lucide-react-native';

type TestResult = {
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  details?: string;
};

export default function TestConnectionScreen() {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const updateTest = (name: string, status: TestResult['status'], message: string, details?: string) => {
    setTests(prev => {
      const existing = prev.find(t => t.name === name);
      if (existing) {
        return prev.map(t => t.name === name ? { name, status, message, details } : t);
      }
      return [...prev, { name, status, message, details }];
    });
  };

  const runTests = async () => {
    setIsRunning(true);
    setTests([]);

    updateTest('Environment Variables', 'pending', 'Checking...');
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      updateTest('Environment Variables', 'error', 'Missing environment variables', 
        `URL: ${supabaseUrl ? '✅' : '❌'}\nKey: ${supabaseKey ? '✅' : '❌'}`);
      setIsRunning(false);
      return;
    }
    
    updateTest('Environment Variables', 'success', 'Environment variables found', 
      `URL: ${supabaseUrl}\nKey length: ${supabaseKey.length}`);

    updateTest('Supabase URL', 'pending', 'Testing connection...');
    try {
      const response = await fetch(supabaseUrl, {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
        },
      });
      
      if (response.ok || response.status === 404) {
        updateTest('Supabase URL', 'success', 'Supabase server is reachable', 
          `Status: ${response.status}`);
      } else {
        updateTest('Supabase URL', 'warning', 'Unexpected response', 
          `Status: ${response.status}`);
      }
    } catch (error) {
      updateTest('Supabase URL', 'error', 'Cannot reach Supabase', 
        error instanceof Error ? error.message : String(error));
    }

    updateTest('Supabase Client', 'pending', 'Initializing client...');
    try {
      const { supabase } = await import('@/lib/supabase');
      updateTest('Supabase Client', 'success', 'Client initialized successfully');

      updateTest('Auth Test', 'pending', 'Testing auth endpoint...');
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          updateTest('Auth Test', 'warning', 'No active session', error.message);
        } else {
          updateTest('Auth Test', 'success', 'Auth endpoint working', 
            data.session ? `User: ${data.session.user.email}` : 'No active session');
        }
      } catch (authError) {
        updateTest('Auth Test', 'error', 'Auth test failed', 
          authError instanceof Error ? authError.message : String(authError));
      }

      updateTest('Database Test', 'pending', 'Testing database connection...');
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('count')
          .limit(1);
        
        if (error) {
          updateTest('Database Test', 'warning', 'Database query failed', error.message);
        } else {
          updateTest('Database Test', 'success', 'Database connection working');
        }
      } catch (dbError) {
        updateTest('Database Test', 'error', 'Database test failed', 
          dbError instanceof Error ? dbError.message : String(dbError));
      }
    } catch (clientError) {
      updateTest('Supabase Client', 'error', 'Failed to initialize client', 
        clientError instanceof Error ? clientError.message : String(clientError));
    }

    updateTest('Backend API', 'pending', 'Testing backend...');
    try {
      const backendUrl = process.env.EXPO_PUBLIC_API_URL || 'https://litxtechuk.com/api';
      const response = await fetch(`${backendUrl}/health`);
      const data = await response.json();
      
      if (response.ok) {
        updateTest('Backend API', 'success', 'Backend is reachable', 
          `Status: ${response.status}\nResponse: ${JSON.stringify(data)}`);
      } else {
        updateTest('Backend API', 'warning', 'Backend returned error', 
          `Status: ${response.status}`);
      }
    } catch (backendError) {
      updateTest('Backend API', 'error', 'Cannot reach backend', 
        backendError instanceof Error ? backendError.message : String(backendError));
    }

    setIsRunning(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle color="#10b981" size={24} />;
      case 'error':
        return <XCircle color="#ef4444" size={24} />;
      case 'warning':
        return <AlertCircle color="#f59e0b" size={24} />;
      default:
        return <ActivityIndicator size="small" color="#6366f1" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return '#10b981';
      case 'error':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      default:
        return '#6366f1';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color="#333" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Connection Test</Text>
        <TouchableOpacity 
          onPress={runTests} 
          disabled={isRunning}
          style={styles.retryButton}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {tests.length === 0 && isRunning && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Running tests...</Text>
          </View>
        )}

        {tests.map((test, index) => (
          <View key={index} style={styles.testCard}>
            <View style={styles.testHeader}>
              {getStatusIcon(test.status)}
              <View style={styles.testInfo}>
                <Text style={styles.testName}>{test.name}</Text>
                <Text style={[styles.testMessage, { color: getStatusColor(test.status) }]}>
                  {test.message}
                </Text>
              </View>
            </View>
            {test.details && (
              <View style={styles.testDetails}>
                <Text style={styles.detailsText}>{test.details}</Text>
              </View>
            )}
          </View>
        ))}

        {!isRunning && tests.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Summary</Text>
            <Text style={styles.summaryText}>
              ✅ Success: {tests.filter(t => t.status === 'success').length}
            </Text>
            <Text style={styles.summaryText}>
              ⚠️ Warning: {tests.filter(t => t.status === 'warning').length}
            </Text>
            <Text style={styles.summaryText}>
              ❌ Error: {tests.filter(t => t.status === 'error').length}
            </Text>
          </View>
        )}

        <View style={styles.helpCard}>
          <Text style={styles.helpTitle}>Need Help?</Text>
          <Text style={styles.helpText}>
            1. Check SETUP-ENV-GUIDE.md for environment setup{'\n'}
            2. Verify Supabase URL is correct (cbzwohfekgxbvkwrll){'\n'}
            3. Ensure environment variables are set in Rork platform{'\n'}
            4. Restart the development server after changing .env
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#111827',
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#6366f1',
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontWeight: '600' as const,
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  testCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  testInfo: {
    flex: 1,
  },
  testName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 4,
  },
  testMessage: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  testDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  detailsText: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  summaryCard: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  helpCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1e40af',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 20,
  },
});
