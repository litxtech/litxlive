import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

export default function AdminTest() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Test Page</Text>
      <Text style={styles.subtitle}>Bu sayfa çalışıyor!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundColor,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textMuted,
  },
});
