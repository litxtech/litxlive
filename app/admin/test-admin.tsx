import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAdmin } from '@/providers/AdminProvider';
import { useUser } from '@/providers/UserProvider';

export default function TestAdmin() {
  const { user } = useUser();
  const { isAdmin, isLoading, checkAdminStatus } = useAdmin();
  const [testing, setTesting] = useState(false);

  const handleTestAdmin = async () => {
    setTesting(true);
    try {
      await checkAdminStatus();
      Alert.alert(
        'Admin Test', 
        `User: ${user?.email}\nID: ${user?.id}\nAdmin: ${isAdmin}\nLoading: ${isLoading}`
      );
    } catch (error) {
      Alert.alert('Error', `Test failed: ${error}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Test</Text>
      
      <View style={styles.info}>
        <Text style={styles.label}>User Email:</Text>
        <Text style={styles.value}>{user?.email || 'Not logged in'}</Text>
        
        <Text style={styles.label}>User ID:</Text>
        <Text style={styles.value}>{user?.id || 'Not logged in'}</Text>
        
        <Text style={styles.label}>Is Admin:</Text>
        <Text style={[styles.value, { color: isAdmin ? 'green' : 'red' }]}>
          {isAdmin ? 'YES' : 'NO'}
        </Text>
        
        <Text style={styles.label}>Loading:</Text>
        <Text style={styles.value}>{isLoading ? 'YES' : 'NO'}</Text>
      </View>

      <TouchableOpacity 
        style={styles.button} 
        onPress={handleTestAdmin}
        disabled={testing}
      >
        <Text style={styles.buttonText}>
          {testing ? 'Testing...' : 'Test Admin Status'}
        </Text>
      </TouchableOpacity>

      <View style={styles.instructions}>
        <Text style={styles.instructionTitle}>Admin Access Instructions:</Text>
        <Text style={styles.instruction}>
          1. Login with email: support@litxtech.com
        </Text>
        <Text style={styles.instruction}>
          2. Or use user ID: cba653e7-6ef9-4152-8a52-19c095cc8f1d
        </Text>
        <Text style={styles.instruction}>
          3. If still not working, check database schema
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  info: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  value: {
    fontSize: 14,
    marginBottom: 5,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  instructions: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  instruction: {
    fontSize: 14,
    marginBottom: 5,
  },
});
