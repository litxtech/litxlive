import React, { useMemo, useState, useCallback } from 'react';
import { Stack, router } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, Linking, TouchableOpacity, Platform, Alert, ActivityIndicator, TextInput } from 'react-native';
import { Colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';

export default function AccountDeletion() {
  const contactEmail = 'privacy@litxtechuk.com';
  const externalURL = 'https://litxtechuk.com/account-deletion';

  const rows = useMemo(() => [
    { title: 'What is deleted', body: 'All personal data, profile, matches, messages, media, and preferences are permanently removed from production systems. Legal payment records may be retained as required by law.' },
    { title: 'Grace period', body: 'A 14-day cooling-off period may apply. During this time you can contact support to cancel deletion. After the period, deletion is irreversible.' },
    { title: 'Inactivity policy', body: 'Accounts with no activity for 90 days may be automatically deleted or anonymized.' },
    { title: 'Data export', body: 'You can request a machine-readable export of your data before deletion.' },
    { title: 'Verification', body: 'We only process deletion for verified owners of the account.' },
  ], []);

  const openEmail = () => {
    const url = `mailto:${contactEmail}`;
    Linking.openURL(url).catch(err => console.log('[AccountDeletion] email open failed', err));
  };

  const openExternal = () => {
    Linking.openURL(externalURL).catch(err => console.log('[AccountDeletion] external open failed', err));
  };

  const [loading, setLoading] = useState<boolean>(false);
  const [acknowledged, setAcknowledged] = useState<boolean>(false);
  const [confirmText, setConfirmText] = useState<string>('');

  const getApiBase = useCallback((): string => {
    const env = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
    if (env && env.length > 0) return env;
    if (Platform.OS === 'web' && typeof window !== 'undefined') return window.location.origin;
    return 'https://'+(process.env.DOMAIN ?? 'localhost');
  }, []);

  const callDelete = async () => {
    try {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) {
        Alert.alert('Not signed in', 'Please sign in first.');
        return;
      }
      const url = `${getApiBase()}/api/account/delete`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status} ${text}`);
      }
      Alert.alert('Account deleted', 'Your account and data have been permanently deleted.');
      try { await supabase.auth.signOut(); } catch {}
      router.replace('/auth');
    } catch (e: any) {
      Alert.alert('Deletion failed', e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container} testID="accountDeletionScreen">
      <Stack.Screen options={{ title: 'Account Deletion', headerBackTitle: 'Back' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Account Deletion</Text>
        <Text style={styles.subtitle}>How to permanently delete your Rork account and data.</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Delete via App</Text>
          <Text style={styles.text}>
            Uyarı / Warning: Hesabınızı sildiğinizde tüm kişisel verileriniz, profil, mesajlar, medya ve eşleşmeler kalıcı olarak silinir.
            Yasal zorunluluklar kapsamında ödeme kayıtları saklanabilir. Silme işlemi onaylandığında geri alınamaz ve herhangi bir iade,
            hak talebi veya veri kurtarma mümkün değildir.
          </Text>

          <View style={styles.ackRow}>
            <TouchableOpacity
              onPress={() => setAcknowledged(!acknowledged)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: acknowledged }}
              style={[styles.checkbox, acknowledged ? styles.checkboxOn : styles.checkboxOff]}
              testID="acknowledgeCheckbox"
            >
              {acknowledged && <Text style={styles.checkboxTick}>✓</Text>}
            </TouchableOpacity>
            <Text style={styles.ackLabel}>Okudum ve anladım • I have read and understand</Text>
          </View>

          <View style={styles.confirmGroup}>
            <Text style={styles.small}>Type DELETE to confirm</Text>
            <TextInput
              value={confirmText}
              onChangeText={setConfirmText}
              placeholder="DELETE"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="characters"
              style={styles.input}
              testID="confirmInput"
            />
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => {
              if (!acknowledged) {
                Alert.alert('Confirmation required', 'Please acknowledge the warning.');
                return;
              }
              if (confirmText.trim().toUpperCase() !== 'DELETE') {
                Alert.alert('Type DELETE', 'Please type DELETE to proceed.');
                return;
              }
              Alert.alert(
                'Delete account',
                'This action is irreversible. Are you sure?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: callDelete },
                ]
              );
            }}
            style={[styles.deleteBtn, (!acknowledged || confirmText.trim().toUpperCase() !== 'DELETE' || loading) ? { opacity: 0.6 } : null as any]}
            disabled={!acknowledged || confirmText.trim().toUpperCase() !== 'DELETE' || loading}
            testID="deleteAccountBtn"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.deleteBtnText}>Delete my account now</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Request via Web</Text>
          <Text style={styles.text}>Use the online request form if you cannot access the app.</Text>
          <TouchableOpacity accessibilityRole="link" onPress={openExternal} style={styles.linkBtn} testID="openExternalDeletionUrl">
            <Text style={styles.linkText}>Open account deletion request</Text>
          </TouchableOpacity>
          <Text style={styles.small}>URL: {externalURL}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Email Request</Text>
          <Text style={styles.text}>Send a deletion request from your registered email with the subject &quot;Account Deletion&quot;.</Text>
          <TouchableOpacity accessibilityRole="button" onPress={openEmail} style={styles.linkBtn} testID="emailPrivacy">
            <Text style={styles.linkText}>{contactEmail}</Text>
          </TouchableOpacity>
          <Text style={styles.small}>We respond within 72 hours.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          {rows.map((r) => (
            <View key={r.title} style={styles.row}>
              <Text style={styles.rowTitle}>{r.title}</Text>
              <Text style={styles.text}>{r.body}</Text>
            </View>
          ))}
        </View>

        <View style={styles.meta}>
          <Text style={styles.small}>Compliance: GDPR, Google Play Data Safety</Text>
          <Text style={styles.small}>Platform: {Platform.OS}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  title: { color: Colors.text, fontSize: 22, fontWeight: '800' as const },
  subtitle: { color: Colors.textSecondary, marginTop: 6 },
  card: { backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginTop: 14, borderWidth: 1, borderColor: Colors.border },
  cardTitle: { color: Colors.text, fontSize: 16, fontWeight: '700' as const, marginBottom: 8 },
  text: { color: Colors.textSecondary, lineHeight: 20 },
  linkBtn: { marginTop: 10, backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, alignSelf: 'flex-start' },
  linkText: { color: '#fff', fontWeight: '700' as const },
  small: { color: Colors.textMuted, fontSize: 12, marginTop: 6 },
  section: { marginTop: 18 },
  sectionTitle: { color: Colors.text, fontSize: 18, fontWeight: '800' as const, marginBottom: 8 },
  row: { marginBottom: 10 },
  rowTitle: { color: Colors.text, fontWeight: '700' as const, marginBottom: 4 },
  meta: { marginTop: 20 },
  deleteBtn: { marginTop: 10, backgroundColor: '#EF4444', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14, alignSelf: 'flex-start' },
  deleteBtnText: { color: '#fff', fontWeight: '700' as const },
  ackRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  checkbox: { width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  checkboxOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkboxOff: { backgroundColor: 'transparent', borderColor: Colors.border },
  checkboxTick: { color: '#fff', fontWeight: '800' as const },
  ackLabel: { color: Colors.text, flex: 1 },
  confirmGroup: { marginTop: 12 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: Colors.text, backgroundColor: Colors.surface },
});