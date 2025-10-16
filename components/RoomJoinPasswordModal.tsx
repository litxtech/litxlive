import React, { useCallback, useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { joinRoom } from '@/lib/rooms';

interface Props {
  visible: boolean;
  onClose: () => void;
  roomId: string;
  onJoined?: (roomId: string) => void;
}

export default function RoomJoinPasswordModal({ visible, onClose, roomId, onJoined }: Props) {
  const [pwd, setPwd] = useState<string>('');
  const [busy, setBusy] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = useCallback(async () => {
    try {
      setBusy(true);
      setErr(null);
      await joinRoom(roomId, 'self', pwd);
      onClose();
      onJoined?.(roomId);
    } catch (e: unknown) {
      const m = (e as { message?: string })?.message ?? 'Giriş başarısız';
      setErr(m);
    } finally {
      setBusy(false);
    }
  }, [pwd, roomId, onClose, onJoined]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Şifre Gerekli</Text>
          <Text style={styles.label}>Oda Şifresi</Text>
          <TextInput
            value={pwd}
            onChangeText={setPwd}
            secureTextEntry
            placeholder="••••"
            placeholderTextColor="#5f6a86"
            style={styles.input}
            testID="room-join-password-input"
          />
          {err ? <Text style={styles.errorText} testID="room-join-error">{err}</Text> : null}
          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose} style={styles.btnGhost} testID="room-join-cancel">
              <Text style={styles.btnGhostText}>Vazgeç</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={submit} disabled={busy} style={[styles.btnPrimary, busy ? styles.btnDisabled : undefined]} testID="room-join-submit">
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>Gir</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  card: { width: '88%', backgroundColor: '#0c0d10', borderRadius: 16, padding: 16 },
  title: { color: '#fff', fontSize: 16, fontWeight: '600' as const, marginBottom: 10 },
  label: { color: '#9aa4bf', marginBottom: 6 },
  input: { color: '#fff', backgroundColor: '#101015', borderRadius: 10, padding: 12, marginBottom: 10 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  btnGhost: { padding: 10 },
  btnGhostText: { color: '#9aa4bf' },
  btnPrimary: { backgroundColor: '#4C6FFF', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  btnPrimaryText: { color: '#fff', fontWeight: '600' as const },
  btnDisabled: { opacity: 0.7 },
  errorText: { color: '#ff6b6b', marginBottom: 8 },
});