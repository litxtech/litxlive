import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity, Modal, TextInput, Alert, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAdmin } from '@/providers/AdminProvider';
import { trpc } from '@/lib/trpc';
import AdminSidebar from '@/components/AdminSidebar';
import { Plus, Edit3, Archive, Trash2, Globe, Rocket } from 'lucide-react-native';

interface FormState {
  id?: string;
  title: string;
  body_md: string;
  locale: string;
  category?: string;
  show_on_login: boolean;
  required_ack: boolean;
  show_in_app: boolean;
  show_in_footer: boolean;
  sort_order: string;
}

export default function AdminPoliciesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isLoading: authLoading } = useAdmin();

  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'draft'|'published'|'archived'|'all'>('all');
  const [locale, setLocale] = useState<string>('en');

  const listQuery = trpc.policies.adminListAll.useQuery({ locale, status: statusFilter === 'all' ? undefined : statusFilter }, { enabled: isAuthenticated });
  const createMutation = trpc.policies.adminCreate.useMutation();
  const updateMutation = trpc.policies.adminUpdate.useMutation();
  const publishMutation = trpc.policies.adminPublish.useMutation();
  const archiveMutation = trpc.policies.adminArchive.useMutation();
  const deleteMutation = trpc.policies.adminDelete.useMutation();

  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [form, setForm] = useState<FormState>({
    title: '',
    body_md: '',
    locale: 'en',
    category: '',
    show_on_login: false,
    required_ack: false,
    show_in_app: true,
    show_in_footer: true,
    sort_order: '100',
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/admin' as any);
    }
  }, [isAuthenticated, authLoading, router]);

  const data = useMemo(() => {
    const items = listQuery.data ?? [];
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(p => p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q));
  }, [listQuery.data, search]);

  const openCreate = () => {
    setForm({ title: '', body_md: '', locale, category: '', show_on_login: false, required_ack: false, show_in_app: true, show_in_footer: true, sort_order: '100' });
    setModalVisible(true);
  };

  const openEdit = (p: any) => {
    setForm({ id: p.id, title: p.title, body_md: p.body_md, locale: p.locale, category: p.category ?? '', show_on_login: p.show_on_login, required_ack: p.required_ack, show_in_app: p.show_in_app, show_in_footer: p.show_in_footer, sort_order: String(p.sort_order ?? 100) });
    setModalVisible(true);
  };

  const submitForm = async () => {
    try {
      const payload = {
        title: form.title,
        body_md: form.body_md,
        locale: form.locale,
        category: form.category || undefined,
        show_on_login: form.show_on_login,
        required_ack: form.required_ack,
        show_in_app: form.show_in_app,
        show_in_footer: form.show_in_footer,
        sort_order: Number(form.sort_order) || 100,
      };
      if (form.id) {
        await updateMutation.mutateAsync({ id: form.id, ...payload });
      } else {
        await createMutation.mutateAsync(payload as any);
      }
      await listQuery.refetch();
      setModalVisible(false);
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    }
  };

  const publish = async (id: string) => {
    try {
      await publishMutation.mutateAsync({ id });
      await listQuery.refetch();
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    }
  };

  const archive = async (id: string) => {
    try {
      await archiveMutation.mutateAsync({ id });
      await listQuery.refetch();
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteMutation.mutateAsync({ id });
      await listQuery.refetch();
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    }
  };

  if (authLoading || listQuery.isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {Platform.OS === 'web' && <AdminSidebar />}
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4C6FFF" />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {Platform.OS === 'web' && <AdminSidebar />}
      <View style={styles.content}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <Text style={styles.title}>Policies</Text>
          <TouchableOpacity onPress={openCreate} style={styles.addBtn} testID="policy-add-btn">
            <Plus size={18} color="#0b0e0f" />
            <Text style={styles.addBtnText}>New Policy</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <View style={styles.badges}>
                  <Text style={[styles.badge, item.status === 'published' ? styles.badgeOk : item.status === 'archived' ? styles.badgeWarn : styles.badgeInfo]}>{item.status}</Text>
                  <Text style={styles.badge}>v{item.version}</Text>
                </View>
              </View>
              <Text style={styles.cardSub}>{item.locale} • {item.category ?? 'general'} • {item.slug}</Text>
              <View style={styles.actionsRow}>
                <TouchableOpacity onPress={() => openEdit(item)} style={[styles.actionBtn, styles.edit]} testID={`policy-edit-${item.id}`}>
                  <Edit3 size={16} color="#d0d7de" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => publish(item.id)} style={[styles.actionBtn, styles.publish]} testID={`policy-publish-${item.id}`}>
                  <Rocket size={16} color="#0b0e0f" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => archive(item.id)} style={[styles.actionBtn, styles.archive]} testID={`policy-archive-${item.id}`}>
                  <Archive size={16} color="#d0d7de" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => remove(item.id)} style={[styles.actionBtn, styles.delete]} testID={`policy-delete-${item.id}`}>
                  <Trash2 size={16} color="#ff8aa0" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          contentContainerStyle={{ padding: 16 }}
        />
      </View>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{form.id ? 'Edit Policy' : 'New Policy'}</Text>
            <TextInput style={styles.input} placeholder="Title" placeholderTextColor="#5f6a86" value={form.title} onChangeText={(t) => setForm(s => ({ ...s, title: t }))} />
            <TextInput style={[styles.input, styles.textarea]} placeholder="Markdown body" placeholderTextColor="#5f6a86" value={form.body_md} onChangeText={(t) => setForm(s => ({ ...s, body_md: t }))} multiline />
            <TextInput style={styles.input} placeholder="Locale (tr/en)" placeholderTextColor="#5f6a86" value={form.locale} onChangeText={(t) => setForm(s => ({ ...s, locale: t }))} />
            <TextInput style={styles.input} placeholder="Category" placeholderTextColor="#5f6a86" value={form.category} onChangeText={(t) => setForm(s => ({ ...s, category: t }))} />
            <View style={styles.switchRow}>
              <TouchableOpacity style={[styles.switch, form.show_on_login && styles.switchOn]} onPress={() => setForm(s => ({ ...s, show_on_login: !s.show_on_login }))}>
                <Text style={styles.switchText}>Show on login</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.switch, form.required_ack && styles.switchOn]} onPress={() => setForm(s => ({ ...s, required_ack: !s.required_ack }))}>
                <Text style={styles.switchText}>Require ack</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.switchRow}>
              <TouchableOpacity style={[styles.switch, form.show_in_app && styles.switchOn]} onPress={() => setForm(s => ({ ...s, show_in_app: !s.show_in_app }))}>
                <Text style={styles.switchText}>Show in app</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.switch, form.show_in_footer && styles.switchOn]} onPress={() => setForm(s => ({ ...s, show_in_footer: !s.show_in_footer }))}>
                <Text style={styles.switchText}>Show in footer</Text>
              </TouchableOpacity>
            </View>
            <TextInput style={styles.input} placeholder="Sort order" placeholderTextColor="#5f6a86" keyboardType="number-pad" value={form.sort_order} onChangeText={(t) => setForm(s => ({ ...s, sort_order: t }))} />

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.modalBtn, styles.cancel]}>
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={submitForm} style={[styles.modalBtn, styles.save]}>
                <Text style={[styles.modalBtnText, styles.modalBtnTextDark]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#0c0d10' },
  content: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: '#fff', fontSize: 22, fontWeight: '800' as const },
  addBtn: { backgroundColor: '#4C6FFF', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10 },
  addBtnText: { color: '#0b0e0f', fontWeight: '700' as const },
  card: { backgroundColor: '#101015', borderRadius: 12, borderWidth: 1, borderColor: '#23263a', padding: 16 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '700' as const },
  cardSub: { color: '#9aa4bf', marginTop: 6 },
  badges: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: { color: '#c9d1d9', fontSize: 12, backgroundColor: '#1a1d2e', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeOk: { backgroundColor: '#1a2a22', color: '#49d39c' },
  badgeWarn: { backgroundColor: '#2a1a1f', color: '#ff8aa0' },
  badgeInfo: { backgroundColor: '#1a1d2e', color: '#9aa4bf' },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  actionBtn: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  edit: { backgroundColor: '#1a1d2e' },
  publish: { backgroundColor: '#49d39c' },
  archive: { backgroundColor: '#1a1d2e' },
  delete: { backgroundColor: '#2a1a1f' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modalCard: { backgroundColor: '#101015', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#23263a', width: '100%', maxWidth: 520 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700' as const, marginBottom: 12 },
  input: { backgroundColor: '#1a1d2e', color: '#fff', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#23263a', marginBottom: 10 },
  textarea: { height: 140, textAlignVertical: 'top' as const },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  switch: { backgroundColor: '#1a1d2e', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  switchOn: { backgroundColor: '#24314d' },
  switchText: { color: '#c9d1d9', fontSize: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 10 },
  modalBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  cancel: { backgroundColor: '#2d333b' },
  save: { backgroundColor: '#4C6FFF' },
  modalBtnText: { color: '#c9d1d9', fontWeight: '600' as const },
  modalBtnTextDark: { color: '#0b0e0f' },
});
