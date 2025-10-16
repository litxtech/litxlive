import React, { useMemo, useCallback } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { usePolicies } from '@/providers/PolicyProvider';
import { Colors } from '@/constants/colors';

interface Props { visible: boolean; onClose: () => void }

export default function PolicyModal({ visible, onClose }: Props) {
  const { pending, acknowledge } = usePolicies();
  const first = useMemo(() => pending[0], [pending]);

  const onAccept = useCallback(async () => {
    if (!first) return;
    try {
      await acknowledge(first.id, first.version);
    } catch (e) {
      console.log('[PolicyModal] acknowledge error', e);
    }
  }, [first, acknowledge]);

  return (
    <Modal visible={visible && Boolean(first)} animationType={Platform.OS === 'web' ? 'none' : 'slide'} transparent testID="policy-modal">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title} testID="policy-title">{first?.title}</Text>
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} testID="policy-body">
            <Text style={styles.bodyText}>{first?.body_md}</Text>
          </ScrollView>
          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose} style={[styles.btn, styles.secondary]} testID="policy-defer-btn">
              <Text style={styles.btnTextSecondary}>Later</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onAccept} style={[styles.btn, styles.primary]} testID="policy-accept-btn">
              <Text style={styles.btnTextPrimary}>Accept</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 16 },
  card: { backgroundColor: '#111315', borderRadius: 16, maxHeight: '80%', padding: 16 },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' as const, marginBottom: 8 },
  body: { maxHeight: 320 },
  bodyContent: { paddingBottom: 8 },
  bodyText: { color: '#c9d1d9', fontSize: 14, lineHeight: 20 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12 },
  btn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  primary: { backgroundColor: Colors.primary },
  secondary: { backgroundColor: '#2d333b' },
  btnTextPrimary: { color: '#0b0e0f', fontWeight: '700' as const },
  btnTextSecondary: { color: '#c9d1d9', fontWeight: '600' as const },
});
