import React, { useCallback, useMemo, useState } from 'react';
import { Modal, View, Text, TextInput, Switch, TouchableOpacity, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { createRoom } from '@/lib/rooms';

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreated?: (roomId: string) => void;
}

export default function CreateVoiceRoomModal({ visible, onClose, onCreated }: Props) {
  const [name, setName] = useState<string>('Sohbet Odası');
  const [description, setDescription] = useState<string>('');
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('');
  const [maxParticipants, setMaxParticipants] = useState<string>('10');
  const [category, setCategory] = useState<string>('voice');
  const [busy, setBusy] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);

  const parsedMax = useMemo<number>(() => {
    const n = Number(maxParticipants);
    return Number.isFinite(n) && n > 0 ? Math.min(Math.max(2, Math.floor(n)), 1000) : 10;
  }, [maxParticipants]);

  const handleSubmit = useCallback(async () => {
    console.log('[CreateVoiceRoomModal] Submit pressed', { isPrivate, category, parsedMax });
    try {
      setBusy(true);
      setErr(null);

      if (!name.trim()) {
        setErr('Oda adı gerekli');
        setBusy(false);
        return;
      }

      if (isPrivate && password.trim().length < 4) {
        setErr('Gizli oda için en az 4 karakter şifre gir.');
        setBusy(false);
        return;
      }

      const room = await createRoom({
        name: name.trim(),
        description: description.trim() || null,
        max_participants: parsedMax,
        is_private: isPrivate,
        password: isPrivate ? password : null,
        category: category.trim() || 'voice',
        settings: {
          allow_video: false,
          allow_screen_share: false,
          mute_on_entry: true,
          waiting_room: false,
          recording_allowed: false,
        },
      });

      console.log('[CreateVoiceRoomModal] Room created', room?.id);
      onClose();
      onCreated?.(room.id);
    } catch (e: unknown) {
      const message = (e as { message?: string })?.message ?? 'Oda oluşturulamadı';
      console.error('[CreateVoiceRoomModal] Error creating room', e);
      setErr(message);
    } finally {
      setBusy(false);
    }
  }, [category, description, isPrivate, name, onClose, onCreated, parsedMax, password]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Sesli Oda Kur</Text>

          <Text style={styles.label}>Oda Adı</Text>
          <TextInput
            testID="input-room-name"
            value={name}
            onChangeText={setName}
            placeholder="Oda adı"
            placeholderTextColor="#5f6a86"
            style={styles.input}
            autoCapitalize="sentences"
          />

          <Text style={styles.label}>Açıklama (opsiyonel)</Text>
          <TextInput
            testID="input-room-description"
            value={description}
            onChangeText={setDescription}
            placeholder="Kısa açıklama"
            placeholderTextColor="#5f6a86"
            style={[styles.input, styles.inputMultiline]}
            multiline
          />

          <View style={styles.rowBetween}>
            <Text style={styles.labelInline}>Gizli Oda</Text>
            <Switch testID="switch-private" value={isPrivate} onValueChange={setIsPrivate} />
          </View>

          {isPrivate && (
            <>
              <Text style={styles.label}>Şifre</Text>
              <TextInput
                testID="input-room-password"
                value={password}
                onChangeText={setPassword}
                placeholder="Şifre"
                placeholderTextColor="#5f6a86"
                secureTextEntry
                style={styles.input}
              />
            </>
          )}

          <Text style={styles.label}>Maks. Katılımcı</Text>
          <TextInput
            testID="input-room-max"
            value={maxParticipants}
            onChangeText={setMaxParticipants}
            keyboardType={Platform.OS === 'web' ? 'default' : 'number-pad'}
            placeholder="10"
            placeholderTextColor="#5f6a86"
            style={styles.input}
          />

          <Text style={styles.label}>Kategori</Text>
          <TextInput
            testID="input-room-category"
            value={category}
            onChangeText={setCategory}
            placeholder="voice"
            placeholderTextColor="#5f6a86"
            style={styles.input}
            autoCapitalize="none"
          />

          {err ? (
            <Text testID="error-text" style={styles.errorText}>{err}</Text>
          ) : null}

          <View style={styles.actions}>
            <TouchableOpacity testID="btn-cancel" onPress={onClose} style={styles.btnGhost}>
              <Text style={styles.btnGhostText}>Vazgeç</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="btn-create"
              onPress={handleSubmit}
              disabled={busy}
              style={[styles.btnPrimary, busy ? styles.btnDisabled : undefined]}
            >
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>Oluştur</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0c0d10',
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600' as const,
    marginBottom: 12,
  },
  label: {
    color: '#9aa4bf',
    marginBottom: 6,
    marginTop: 6,
  },
  labelInline: {
    color: '#9aa4bf',
  },
  input: {
    color: '#fff',
    backgroundColor: '#101015',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  inputMultiline: {
    minHeight: 70,
    textAlignVertical: 'top' as const,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 14,
    gap: 12,
  },
  btnGhost: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  btnGhostText: {
    color: '#9aa4bf',
  },
  btnPrimary: {
    backgroundColor: '#4C6FFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnPrimaryText: {
    color: '#fff',
    fontWeight: '600' as const,
  },
  errorText: {
    color: '#ff6b6b',
    marginTop: 8,
  },
});