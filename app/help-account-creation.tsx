import React from 'react';
import { Stack } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';

export default function HelpAccountCreation() {
  return (
    <View style={styles.container} testID="helpAccountCreationScreen">
      <Stack.Screen options={{ title: 'Account Creation Help', headerBackTitle: 'Back' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Account Creation Help</Text>
        <Text style={styles.subtitle}>Ways to create and secure your Rork account.</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Supported Methods</Text>
          <Text style={styles.text}>• Username and password{"\n"}• OAuth (Google, Apple ID){"\n"}• Email or Phone verification</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Password Requirements</Text>
          <Text style={styles.text}>Minimum 8 characters, at least 1 letter and 1 number. Use a unique password for your safety.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Verification</Text>
          <Text style={styles.text}>We may ask you to verify your email or phone. This protects your account and helps prevent abuse.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Privacy and Security</Text>
          <Text style={styles.text}>All data is transmitted over TLS 1.2+ and sensitive data is encrypted at rest. You control your privacy settings from Profile {'>'} Settings.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Troubleshooting</Text>
          <Text style={styles.text}>• Did not receive email? Check spam or try again in a few minutes.{"\n"}• Code expired? Request a new one.{"\n"}• Wrong number or email? Update and retry.{"\n"}• Still blocked? Contact privacy@litxtechuk.com</Text>
        </View>

        <View style={styles.meta}>
          <Text style={styles.small}>Platform: {Platform.OS}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0d10' },
  content: { padding: 16, paddingBottom: 40 },
  title: { color: '#ffffff', fontSize: 22, fontWeight: '800' as const },
  subtitle: { color: '#9aa4bf', marginTop: 6 },
  card: { backgroundColor: '#101015', borderRadius: 14, padding: 14, marginTop: 14, borderWidth: 1, borderColor: '#1d2233' },
  cardTitle: { color: '#ffffff', fontSize: 16, fontWeight: '700' as const, marginBottom: 8 },
  text: { color: '#c7cbe1', lineHeight: 20 },
  small: { color: '#6b7390', fontSize: 12, marginTop: 6 },
  meta: { marginTop: 20 },
});