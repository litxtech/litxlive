import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, CheckCircle, XCircle, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { authService } from '@/services/auth';
import { supabase } from '@/lib/supabase';

type TestResult = {
  name: string;
  status: 'pending' | 'running' | 'pass' | 'fail';
  message?: string;
  duration?: number;
};

export default function EmailDebugScreen() {
  const [testEmail, setTestEmail] = useState<string>('');
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Supabase Client', status: 'pending' },
    { name: 'Supabase Auth Config', status: 'pending' },
    { name: 'Email Service', status: 'pending' },
    { name: 'Send Test Email', status: 'pending' },
    { name: 'Resend Verification', status: 'pending' },
  ]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[EmailDebug] ${message}`);
  };

  const updateTest = (index: number, status: TestResult['status'], message?: string, duration?: number) => {
    setTests(prev => prev.map((test, i) => 
      i === index ? { ...test, status, message, duration } : test
    ));
  };

  const runTests = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      addLog('❌ Please enter a valid email address');
      return;
    }

    setIsRunning(true);
    setLogs([]);
    addLog('🚀 Starting email verification tests...');

    try {
      updateTest(0, 'running');
      const start0 = Date.now();
      if (!supabase) {
        updateTest(0, 'fail', 'Supabase client not initialized');
        addLog('❌ Test 1 FAILED: Supabase client is null');
        setIsRunning(false);
        return;
      }
      updateTest(0, 'pass', 'Client initialized', Date.now() - start0);
      addLog('✅ Test 1 PASSED: Supabase client is ready');

      updateTest(1, 'running');
      const start1 = Date.now();
      try {
        const { data: { session } } = await supabase.auth.getSession();
        updateTest(1, 'pass', `Session: ${session ? 'Active' : 'None'}`, Date.now() - start1);
        addLog(`✅ Test 2 PASSED: Auth config OK (Session: ${session ? 'Active' : 'None'})`);
      } catch (error) {
        updateTest(1, 'fail', 'Auth config error');
        addLog(`❌ Test 2 FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      updateTest(2, 'running');
      const start2 = Date.now();
      try {
        const testResult = await authService.signInWithOTP(testEmail);
        if (testResult.success) {
          updateTest(2, 'pass', 'Email service working', Date.now() - start2);
          addLog('✅ Test 3 PASSED: Email service is functional');
        } else {
          updateTest(2, 'fail', testResult.message);
          addLog(`❌ Test 3 FAILED: ${testResult.message}`);
        }
      } catch (error) {
        updateTest(2, 'fail', 'Service error');
        addLog(`❌ Test 3 FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      updateTest(3, 'running');
      const start3 = Date.now();
      try {
        const { error } = await supabase.auth.signInWithOtp({
          email: testEmail,
          options: {
            emailRedirectTo: 'https://www.litxtechuk.com/auth/callback',
          },
        });
        
        if (error) {
          updateTest(3, 'fail', error.message);
          addLog(`❌ Test 4 FAILED: ${error.message}`);
        } else {
          updateTest(3, 'pass', 'Test email sent', Date.now() - start3);
          addLog('✅ Test 4 PASSED: Test email sent successfully');
          addLog(`📧 Check inbox: ${testEmail}`);
        }
      } catch (error) {
        updateTest(3, 'fail', 'Send error');
        addLog(`❌ Test 4 FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      updateTest(4, 'running');
      const start4 = Date.now();
      try {
        const result = await authService.resendVerificationEmail(testEmail);
        if (result.success) {
          updateTest(4, 'pass', 'Resend working', Date.now() - start4);
          addLog('✅ Test 5 PASSED: Resend verification working');
        } else {
          updateTest(4, 'fail', result.message);
          addLog(`❌ Test 5 FAILED: ${result.message}`);
        }
      } catch (error) {
        updateTest(4, 'fail', 'Resend error');
        addLog(`❌ Test 5 FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      addLog('🏁 All tests completed');
    } catch (error) {
      addLog(`❌ Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const resetTests = () => {
    setTests(prev => prev.map(test => ({ ...test, status: 'pending' as const, message: undefined, duration: undefined })));
    setLogs([]);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return <View style={styles.statusDot} />;
      case 'running': return <ActivityIndicator size="small" color="#2196f3" />;
      case 'pass': return <CheckCircle color="#4caf50" size={20} />;
      case 'fail': return <XCircle color="#f44336" size={20} />;
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
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color="white" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Email Debug</Text>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={styles.card}>
            <View style={styles.iconContainer}>
              <Mail color="#6a11cb" size={48} />
            </View>

            <Text style={styles.title}>Email Verification Test</Text>
            <Text style={styles.description}>
              Test email sending functionality and debug issues
            </Text>

            <View style={styles.inputContainer}>
              <Mail color="#888" size={20} />
              <TextInput
                style={styles.input}
                placeholder="Enter test email"
                placeholderTextColor="#888"
                value={testEmail}
                onChangeText={setTestEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isRunning}
                testID="testEmailInput"
              />
            </View>

            <View style={styles.testsContainer}>
              {tests.map((test, index) => (
                <View key={index} style={styles.testRow}>
                  <View style={styles.testLeft}>
                    {getStatusIcon(test.status)}
                    <Text style={styles.testName}>{test.name}</Text>
                  </View>
                  <View style={styles.testRight}>
                    {test.duration && (
                      <Text style={styles.testDuration}>{test.duration}ms</Text>
                    )}
                    {test.message && (
                      <Text style={styles.testMessage}>{test.message}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={runTests}
                disabled={isRunning || !testEmail}
                testID="runTestsButton"
              >
                <LinearGradient
                  colors={['#6a11cb', '#2575fc']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  {isRunning ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <RefreshCw color="white" size={18} />
                      <Text style={styles.buttonText}>Run Tests</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={resetTests}
                disabled={isRunning}
                testID="resetButton"
              >
                <Text style={styles.secondaryButtonText}>Reset</Text>
              </TouchableOpacity>
            </View>

            {logs.length > 0 && (
              <View style={styles.logsContainer}>
                <Text style={styles.logsTitle}>Logs:</Text>
                <ScrollView style={styles.logsScroll} nestedScrollEnabled>
                  {logs.map((log, index) => (
                    <Text key={index} style={styles.logText}>{log}</Text>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.infoBox}>
              <AlertCircle color="#2196f3" size={20} />
              <Text style={styles.infoText}>
                This tool tests email sending. Check EMAIL_VERIFICATION_FIX.md for detailed setup instructions.
              </Text>
            </View>
          </View>
        </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: 'white',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#f0f4ff',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
    marginBottom: 24,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  testsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  testRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  testLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  testName: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#333',
  },
  testRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  testDuration: {
    fontSize: 12,
    color: '#666',
  },
  testMessage: {
    fontSize: 11,
    color: '#999',
    maxWidth: 120,
    textAlign: 'right',
  },
  statusDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e0e0e0',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  button: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  primaryButton: {
    shadowColor: '#6a11cb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: 'white',
  },
  secondaryButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e9ecef',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#666',
  },
  logsContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    maxHeight: 200,
  },
  logsTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#4caf50',
    marginBottom: 8,
  },
  logsScroll: {
    maxHeight: 150,
  },
  logText: {
    fontSize: 11,
    color: '#e0e0e0',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1976d2',
    lineHeight: 18,
  },
});
