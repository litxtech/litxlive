import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AdminDebugPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const insets = useSafeAreaInsets();

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const testCORS = async () => {
    setLogs([]);
    const API = process.env.EXPO_PUBLIC_ADMIN_API;
    const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    
    addLog(`API URL: ${API}`);
    addLog(`Has Anon Key: ${!!anonKey}`);
    addLog(`Origin: ${typeof window !== 'undefined' ? window.location.origin : 'N/A'}`);

    try {
      addLog('Testing OPTIONS (preflight)...');
      const optionsRes = await fetch(API!, {
        method: 'OPTIONS',
        headers: {
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'content-type',
        },
      });
      addLog(`OPTIONS status: ${optionsRes.status}`);
      addLog(`OPTIONS headers: ${JSON.stringify(Object.fromEntries(optionsRes.headers.entries()))}`);
    } catch (e) {
      addLog(`OPTIONS error: ${e}`);
    }

    try {
      addLog('Testing POST /login...');
      const res = await fetch(API!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(anonKey ? { apikey: anonKey, Authorization: `Bearer ${anonKey}` } : {}),
        },
        body: JSON.stringify({ username: 'admin', password: 'Bavul2817?' }),
      });
      addLog(`POST status: ${res.status}`);
      const text = await res.text();
      addLog(`POST response: ${text}`);
    } catch (e) {
      addLog(`POST error: ${e}`);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Text style={styles.title}>Admin API Debug</Text>
      
      <TouchableOpacity style={styles.button} onPress={testCORS}>
        <Text style={styles.buttonText}>Test CORS & Login</Text>
      </TouchableOpacity>

      <ScrollView style={styles.logContainer}>
        {logs.map((log, i) => (
          <Text key={i} style={styles.logText}>{log}</Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0d10',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4C6FFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logContainer: {
    flex: 1,
    backgroundColor: '#1a1d2e',
    borderRadius: 12,
    padding: 12,
  },
  logText: {
    color: '#9aa4bf',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
});
