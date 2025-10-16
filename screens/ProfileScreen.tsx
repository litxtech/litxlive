import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { supabase } from '@/lib/supabase';
import type { Gender } from '@/types/db';

export default function ProfileScreen() {
  const [username, setUsername] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [gender, setGender] = useState<Gender | undefined>(undefined);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      console.log('[ProfileScreen] fetching profile');
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }
        const { data, error } = await supabase
          .from('users')
          .select('username, bio, gender, is_live')
          .eq('id', user.id)
          .maybeSingle();
        if (error) {
          console.error('[ProfileScreen] load error', error);
        }
        if (data) {
          setUsername((data as any).username ?? '');
          setBio((data as any).bio ?? '');
          setGender(((data as any).gender ?? undefined) as Gender | undefined);
          setIsLive(Boolean((data as any).is_live));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = useCallback(async () => {
    if (!gender) {
      Alert.alert('Zorunlu Alan', 'Devam etmek için cinsiyet seçmelisin.');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { return; }
      const { error } = await supabase
        .from('users')
        .update({ username, bio, gender })
        .eq('id', user.id);
      if (error) throw error;
      Alert.alert('Kaydedildi', 'Profil güncellendi.');
    } catch (e: unknown) {
      const m = (e as { message?: string })?.message ?? 'Kaydedilemedi';
      setErr(m);
      Alert.alert('Hata', m);
    } finally {
      setBusy(false);
    }
  }, [bio, gender, username]);

  const toggleLive = useCallback(async () => {
    if (!gender) {
      Alert.alert('Önce Profil', 'Canlıya geçmeden önce cinsiyetini seç.');
      return;
    }
    const newLive = !isLive;
    setIsLive(newLive);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { return; }
      const { error } = await supabase
        .from('users')
        .update({ is_live: newLive, live_updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (error) throw error;
    } catch (e) {
      setIsLive(!newLive);
      Alert.alert('Hata', (e as any)?.message ?? 'Güncellenemedi');
    }
  }, [gender, isLive]);

  const GenderPill = useMemo(() => {
    const PillComponent = ({ value, label }: { value: Gender; label: string }) => (
      <TouchableOpacity
        onPress={() => setGender(value)}
        style={[
          styles.pill,
          { backgroundColor: gender === value ? '#4C6FFF' : '#101015' },
        ]}
        testID={`gender-${value}`}
      >
        <Text style={styles.pillText}>{label}</Text>
      </TouchableOpacity>
    );
    PillComponent.displayName = 'GenderPill';
    return PillComponent;
  }, [gender]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profil</Text>

      <Text style={styles.label}>Kullanıcı Adı</Text>
      <TextInput
        value={username}
        onChangeText={setUsername}
        placeholder="kullanici_adi"
        placeholderTextColor="#5f6a86"
        style={styles.input}
        testID="input-username"
      />

      <Text style={styles.label}>Bio</Text>
      <TextInput
        value={bio}
        onChangeText={setBio}
        placeholder="Kısaca kendini anlat"
        placeholderTextColor="#5f6a86"
        multiline
        style={[styles.input, styles.inputMultiline]}
        testID="input-bio"
      />

      <Text style={styles.label}>Cinsiyet (zorunlu)</Text>
      <View style={styles.row}>
        <GenderPill value="male" label="Erkek" />
        <GenderPill value="female" label="Kadın" />
      </View>

      {err ? <Text style={styles.errorText}>{err}</Text> : null}

      <View style={styles.actions}>
        <TouchableOpacity onPress={save} disabled={busy} style={[styles.btnPrimary, busy ? styles.btnDisabled : null as unknown as undefined]} testID="btn-save-profile">
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>Kaydet</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.hr} />

      <Text style={styles.label}>Canlı Durumu</Text>
      <TouchableOpacity onPress={toggleLive} style={[styles.btnMuted, { backgroundColor: isLive ? '#1f8b4c' : '#2b2f45' }]} testID="btn-toggle-live">
        <Text style={styles.btnMutedText}>{isLive ? 'Canlı: Açık (Kapat)' : 'Canlı: Kapalı (Aç)'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0d10', padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontSize: 18, fontWeight: '600' as const, marginBottom: 12 },
  label: { color: '#9aa4bf', marginBottom: 6 },
  input: { color: '#fff', backgroundColor: '#101015', borderRadius: 10, padding: 12, marginBottom: 10 },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' as const },
  row: { flexDirection: 'row', marginBottom: 10 },
  pill: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, marginRight: 8 },
  pillText: { color: '#fff' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  btnPrimary: { backgroundColor: '#4C6FFF', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  btnPrimaryText: { color: '#fff', fontWeight: '600' as const },
  btnDisabled: { opacity: 0.7 },
  hr: { height: 1, backgroundColor: '#171923', marginVertical: 16 },
  btnMuted: { padding: 12, borderRadius: 10 },
  btnMutedText: { color: '#fff', textAlign: 'center' },
  errorText: { color: '#ff6b6b', marginBottom: 8 },
});
