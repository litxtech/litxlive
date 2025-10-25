import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAdmin } from '@/providers/AdminProvider';
import { useRouter } from 'expo-router';

const Btn = ({ title, onPress, testID }: { title: string; onPress: () => void; testID?: string }) => (
  <Pressable onPress={onPress} style={styles.btn} testID={testID}>
    <Text style={styles.btnText}>{title}</Text>
  </Pressable>
);

type ProfileRow = {
  id: string;
  email: string | null;
  role: string | null;
  blue_check?: boolean | null;
  display_name?: string | null;
  username?: string | null;
  full_name?: string | null;
};

type AuditRow = {
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
};

export default function AdminPanel() {
  const { isAdmin, isLoading, isAuthenticated } = useAdmin();
  const router = useRouter();
  const [meRole, setMeRole] = useState<string | null>(null);
  const [meEmail, setMeEmail] = useState<string | null>(null);
  const [ownerLevel, setOwnerLevel] = useState<number>(0);
  const [q, setQ] = useState<string>('');
  const [results, setResults] = useState<ProfileRow[]>([]);
  const [selected, setSelected] = useState<ProfileRow | null>(null);
  const [amount, setAmount] = useState<string>('100');
  const [reason, setReason] = useState<string>('');
  const [tempMinutes, setTempMinutes] = useState<string>('60');
  const [audit, setAudit] = useState<AuditRow[]>([]);

  const insets = useSafeAreaInsets();
  const targetUserId = useMemo(() => selected?.id ?? '', [selected]);

  // Admin authentication check
  useEffect(() => {
    console.log('[AdminPanel] Auth check - isLoading:', isLoading, 'isAdmin:', isAdmin, 'isAuthenticated:', isAuthenticated);
    if (!isLoading && !isAdmin) {
      console.log('[AdminPanel] Not admin, redirecting');
      router.replace('/admin' as any);
    }
  }, [isAdmin, isLoading, router]);

  useEffect(() => {
    (async () => {
      try {
        console.log('[AdminPanel] fetching session');
        const { data: sessionRes, error: sessionErr } = await supabase.auth.getSession();
        if (sessionErr) console.log('[AdminPanel] getSession error', sessionErr);
        const uid = sessionRes?.session?.user?.id;
        const email = sessionRes?.session?.user?.email ?? null;
        setMeEmail(email || null);
        if (!uid) {
          setMeRole(null);
          return;
        }
        const { data, error } = await supabase
          .from('profiles')
          .select('role, owner_level')
          .eq('id', uid)
          .maybeSingle();
        if (error) {
          console.log('[AdminPanel] profile role error', error);
          Alert.alert('Hata', 'Profil okunamadı');
        }
        setMeRole((data as any)?.role ?? null);
        setOwnerLevel(Number((data as any)?.owner_level ?? 0) || 0);
      } catch (e) {
        console.log('[AdminPanel] init error', e);
        setMeRole(null);
      }
    })();
  }, []);

  const isOwner = (meRole === 'owner') || (ownerLevel >= 900) || ((meEmail || '').toLowerCase() === 'support@litxtech.com');

  const search = async () => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, role, blue_check, username, full_name')
      .ilike('email', `%${q.trim()}%`)
      .limit(20);
    if (error) {
      Alert.alert('Hata', error.message);
      return;
    }
    setResults((data ?? []) as ProfileRow[]);
  };

  const fetchAudit = async () => {
    const { data, error } = await supabase
      .from('audit_log')
      .select('action, entity_type, entity_id, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    if (error) {
      Alert.alert('Hata', error.message);
      return;
    }
    setAudit((data ?? []) as AuditRow[]);
  };

  useEffect(() => {
    fetchAudit();
  }, []);

  async function run(fn: () => Promise<unknown>, okMsg: string) {
    try {
      if (!targetUserId) {
        Alert.alert('Hata', 'Önce kullanıcı seçin');
        return;
      }
      await fn();
      await fetchAudit();
      Alert.alert('Tamam', okMsg);
    } catch (e: any) {
      console.log('[AdminPanel] action error', e);
      Alert.alert('Hata', e?.message ?? String(e));
    }
  }

  const rpcBlue = async (setFlag: boolean) => {
    const { error } = await supabase.rpc('admin_set_blue_tick', {
      p_target_user: targetUserId,
      p_set: setFlag,
      p_reason: reason || (setFlag ? 'verified' : 'manual_unverify'),
    });
    if (error) throw new Error(error.message);
  };

  const rpcBan = async (type: 'hard' | 'shadow' | 'temp') => {
    const { error } = await supabase.rpc('admin_ban_user', {
      p_target_user: targetUserId,
      p_type: type,
      p_minutes: type === 'temp' ? Number(tempMinutes || '0') : null,
      p_reason: reason || `ban_${type}`,
    });
    if (error) throw new Error(error.message);
  };

  const rpcUnban = async () => {
    const { error } = await supabase.rpc('admin_unban_user', {
      p_target_user: targetUserId,
      p_reason: reason || 'manual_unban',
    });
    if (error) throw new Error(error.message);
  };

  const rpcMint = async () => {
    const { error } = await supabase.rpc('admin_mint_coin', {
      p_target_user: targetUserId,
      p_amount: Number(amount || '0'),
      p_reason: reason || 'manual_mint',
    });
    if (error) throw new Error(error.message);
  };

  const rpcBurn = async () => {
    const { error } = await supabase.rpc('admin_burn_coin', {
      p_target_user: targetUserId,
      p_amount: Number(amount || '0'),
      p_reason: reason || 'manual_burn',
    });
    if (error) throw new Error(error.message);
  };

  if (isLoading) {
    return (
      <View style={styles.noAccess} testID="admin-loading">
        <Text style={styles.noAccessTitle}>Loading Admin Panel...</Text>
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={styles.noAccess} testID="admin-no-access">
        <Text style={styles.noAccessTitle}>Erişim yok: Bu sayfa yalnızca ADMIN için.</Text>
        <Text style={styles.noAccessDesc}>
          support@litxtech.com ile giriş yap ve admin yetkisi verdiğimiz hesaptan aç.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]} testID="admin-panel">
      <Text style={styles.headerTitle}>Admin Panel — support@litxtech.com</Text>

      <Text style={styles.sectionTitle}>Kullanıcı Ara (email)</Text>
      <View style={styles.row}>
        <TextInput
          placeholder="email parçasi yaz (örn: @gmail.com)"
          value={q}
          onChangeText={setQ}
          autoCapitalize="none"
          style={styles.input}
          onSubmitEditing={search as any}
          returnKeyType="search"
          testID="admin-search-input"
        />
        <Btn title="Ara" onPress={search} testID="admin-search-button" />
      </View>

      {results.length > 0 && (
        <View style={styles.resultsBox}>
          {results.map((r) => (
            <Pressable
              key={r.id}
              onPress={() => setSelected(r)}
              style={styles.resultRow}
              testID={`admin-result-${r.id}`}
            >
              <Text style={styles.resultName}>
                {r.display_name || r.full_name || r.username || r.email || '(noname)'} {r.blue_check ? '🔵' : ''}
              </Text>
              <Text style={styles.resultEmail}>{r.email}</Text>
              <Text style={styles.resultMeta}>
                role: {r.role || '-'} • uid: {r.id}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.selectedBox}>
        <Text style={styles.selectedTitle}>Seçili Kullanıcı</Text>
        <Text selectable style={styles.selectedUid}>{selected ? selected.id : '—'}</Text>
        <Text style={styles.selectedEmail}>{selected?.email ?? ''}</Text>
      </View>

      <Text style={styles.sectionTitle}>Aksiyon Parametreleri</Text>
      <TextInput
        placeholder="Miktar (coin)"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        style={styles.input}
        testID="admin-amount"
      />
      <TextInput
        placeholder="Sebep / Reason"
        value={reason}
        onChangeText={setReason}
        style={styles.input}
        testID="admin-reason"
      />
      <TextInput
        placeholder="Temp ban süresi (dakika)"
        value={tempMinutes}
        onChangeText={setTempMinutes}
        keyboardType="numeric"
        style={styles.input}
        testID="admin-temp-minutes"
      />

      <Btn title="💰 Mint Coin" onPress={() => run(rpcMint, 'Mint tamam')} testID="btn-mint" />
      <Btn title="🔥 Burn Coin" onPress={() => run(rpcBurn, 'Burn tamam')} testID="btn-burn" />
      <Btn title="✅ Blue Tick Ver" onPress={() => run(() => rpcBlue(true), 'Blue tick verildi')} testID="btn-blue-on" />
      <Btn title="❌ Blue Tick Kaldır" onPress={() => run(() => rpcBlue(false), 'Blue tick kaldırıldı')} testID="btn-blue-off" />
      <Btn title="🚫 Hard Ban" onPress={() => run(() => rpcBan('hard'), 'Hard ban uygulandı')} testID="btn-ban-hard" />
      <Btn title="👻 Shadow Ban" onPress={() => run(() => rpcBan('shadow'), 'Shadow ban uygulandı')} testID="btn-ban-shadow" />
      <Btn title="⏳ Temp Ban" onPress={() => run(() => rpcBan('temp'), 'Temp ban uygulandı')} testID="btn-ban-temp" />
      <Btn title="🟢 Unban" onPress={() => run(rpcUnban, 'Unban tamam')} testID="btn-unban" />

      <Text style={styles.auditTitle}>Audit Log — Son 10</Text>
      <View style={styles.auditBox}>
        {audit.length === 0 && <Text>Henüz kayıt yok.</Text>}
        {audit.map((a, i) => (
          <View key={`${a.created_at}-${i}`} style={styles.auditRow}>
            <Text style={styles.auditAction}>{a.action}</Text>
            <Text style={styles.auditMeta}>{a.entity_type ?? '-'} • {a.entity_id ?? '-'}</Text>
            <Text style={styles.auditTime}>{new Date(a.created_at).toLocaleString()}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
    gap: 14,
  },
  btn: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginVertical: 6,
  },
  btnText: {
    textAlign: 'center',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  sectionTitle: {
    marginTop: 6,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  resultsBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  resultRow: {
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderColor: '#ddd',
  },
  resultName: {
    fontWeight: '700',
  },
  resultEmail: {},
  resultMeta: {
    fontSize: 12,
    opacity: 0.7,
  },
  selectedBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  selectedTitle: {
    fontWeight: '700',
  },
  selectedUid: {},
  selectedEmail: {},
  noAccess: {
    padding: 20,
  },
  noAccessTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  noAccessDesc: {
    marginTop: 8,
  },
  auditTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '800',
  },
  auditBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  auditRow: {
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderColor: '#eee',
  },
  auditAction: {
    fontWeight: '700',
  },
  auditMeta: {
    fontSize: 12,
    opacity: 0.7,
  },
  auditTime: {
    fontSize: 12,
  },
});

