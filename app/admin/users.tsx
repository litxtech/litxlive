import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAdmin } from '@/providers/AdminProvider';
import { adminApi, AdminUser, AdminUsersListResponse, AdminUserProfile } from '@/services/adminApi';
import AdminSidebar from '@/components/AdminSidebar';
import UserAutocomplete from '@/components/UserAutocomplete';
import { Search, Ban, Coins, CheckCircle, X, Pencil } from 'lucide-react-native';

export default function AdminUsers() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isLoading: authLoading } = useAdmin();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const [pageSize] = useState<number>(25);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [modalType, setModalType] = useState<'ban' | 'credit' | 'verify' | 'edit' | null>(null);
  const [banReason, setBanReason] = useState<string>('');
  const [banDays, setBanDays] = useState<string>('');
  const [coinAmount, setCoinAmount] = useState<string>('');
  const [coinReason, setCoinReason] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [profileLoading, setProfileLoading] = useState<boolean>(false);
  const [profile, setProfile] = useState<AdminUserProfile | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/admin' as any);
    }
  }, [isAuthenticated, authLoading, router]);

  const loadUsers = async () => {
    try {
      const res = await adminApi.getUsers({ limit: pageSize, offset: page * pageSize, query: searchQuery.trim() || undefined });
      setUsers(res.users);
      setTotal(res.total);
    } catch (err) {
      console.error('[Users] Error loading users:', err);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadUsers();
    }
  }, [isAuthenticated, searchQuery, page]);

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 0;
  const canNext = page + 1 < totalPages;

  const openModal = (user: AdminUser, type: 'ban' | 'credit' | 'verify' | 'edit') => {
    setSelectedUser(user);
    setModalType(type);
    setModalVisible(true);
    setBanReason('');
    setBanDays('');
    setCoinAmount('');
    setCoinReason('');
    if (type === 'edit') {
      setProfileLoading(true);
      adminApi.getUserProfile(user.id)
        .then(setProfile)
        .catch((e) => Alert.alert('Error', e.message ?? 'Failed to load profile'))
        .finally(() => setProfileLoading(false));
    } else {
      setProfile(null);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedUser(null);
    setModalType(null);
  };

  const handleBanUser = async () => {
    if (!selectedUser || !banReason.trim()) {
      Alert.alert('Error', 'Please enter a ban reason');
      return;
    }

    setActionLoading(true);
    try {
      const days = banDays ? parseInt(banDays, 10) : undefined;
      await adminApi.banUser(selectedUser.id, banReason.trim(), days);
      Alert.alert('Success', 'User banned successfully');
      closeModal();
      loadUsers();
    } catch (err) {
      console.error('[Users] Ban error:', err);
      Alert.alert('Error', 'Failed to ban user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreditCoins = async () => {
    if (!selectedUser || !coinAmount.trim() || !coinReason.trim()) {
      Alert.alert('Error', 'Please enter amount and reason');
      return;
    }

    const amount = parseInt(coinAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setActionLoading(true);
    try {
      await adminApi.creditWallet(selectedUser.id, amount, coinReason.trim());
      Alert.alert('Success', 'Coins credited successfully');
      closeModal();
      loadUsers();
    } catch (err) {
      console.error('[Users] Credit error:', err);
      Alert.alert('Error', 'Failed to credit coins');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyUser = async () => {
    if (!selectedUser) return;

    setActionLoading(true);
    try {
      await adminApi.verifyUser(selectedUser.id);
      Alert.alert('Success', 'User verified successfully');
      closeModal();
      loadUsers();
    } catch (err) {
      console.error('[Users] Verify error:', err);
      Alert.alert('Error', 'Failed to verify user');
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {Platform.OS === 'web' && <AdminSidebar />}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4C6FFF" />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {Platform.OS === 'web' && <AdminSidebar />}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Users</Text>
          <Text style={styles.subtitle}>Manage platform users</Text>
        </View>

        <UserAutocomplete
          placeholder="Kullanıcı ara (email, isim veya kullanıcı adı)..."
          onUserSelect={(user) => {
            setSearchQuery(user.email);
            // Optionally navigate to user details or perform action
            console.log('Selected user:', user);
          }}
          onTextChange={setSearchQuery}
          initialValue={searchQuery}
          style={styles.autocompleteContainer}
        />

        <ScrollView
          style={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {users.map((u) => (
            <View key={u.id} style={styles.userCard}>
              <View style={styles.userInfo}>
                <Text style={styles.userName} testID="admin-user-name">{u.username ?? u.name ?? u.email}</Text>
                <Text style={styles.userEmail} testID="admin-user-email">{u.email}</Text>
                <View style={styles.userMeta}>
                  <Text style={styles.userMetaText}>Coins: {u.coins}</Text>
                  {u.banned && (
                    <View style={styles.bannedBadge}>
                      <Text style={styles.bannedText}>Banned</Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.banButton]}
                  onPress={() => openModal(u, 'ban')}
                  activeOpacity={0.7}
                >
                  <Ban size={16} color="#ff8aa0" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.coinButton]}
                  onPress={() => openModal(u, 'credit')}
                  activeOpacity={0.7}
                >
                  <Coins size={16} color="#ffa94d" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.verifyButton]}
                  onPress={() => openModal(u, 'verify')}
                  activeOpacity={0.7}
                >
                  <CheckCircle size={16} color="#49d39c" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => openModal(u, 'edit')}
                  activeOpacity={0.7}
                >
                  <Pencil size={16} color="#4C6FFF" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
        <View style={styles.pagination}>
          <Text style={styles.paginationText}>Page {page + 1} / {totalPages} • {total} users</Text>
          <View style={styles.paginationButtons}>
            <TouchableOpacity 
              style={[styles.pageButton, !canPrev && { opacity: 0.4 } as any]}
              disabled={!canPrev}
              onPress={() => setPage(Math.max(0, page - 1))}
            >
              <Text style={styles.pageButtonText}>Prev</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.pageButton, !canNext && { opacity: 0.4 } as any]}
              disabled={!canNext}
              onPress={() => setPage(page + 1)}
            >
              <Text style={styles.pageButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalType === 'ban' && 'Ban User'}
                {modalType === 'credit' && 'Credit Coins'}
                {modalType === 'verify' && 'Verify User'}
                {modalType === 'edit' && 'Edit Profile'}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <X size={24} color="#9aa4bf" />
              </TouchableOpacity>
            </View>

            {modalType === 'ban' && (
              <>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Ban reason"
                  placeholderTextColor="#5f6a86"
                  value={banReason}
                  onChangeText={setBanReason}
                  multiline
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Duration (days, leave empty for permanent)"
                  placeholderTextColor="#5f6a86"
                  value={banDays}
                  onChangeText={setBanDays}
                  keyboardType="number-pad"
                />
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonDanger]}
                  onPress={handleBanUser}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.modalButtonText}>Ban User</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {modalType === 'credit' && (
              <>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Amount"
                  placeholderTextColor="#5f6a86"
                  value={coinAmount}
                  onChangeText={setCoinAmount}
                  keyboardType="number-pad"
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Reason"
                  placeholderTextColor="#5f6a86"
                  value={coinReason}
                  onChangeText={setCoinReason}
                  multiline
                />
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={handleCreditCoins}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.modalButtonText}>Credit Coins</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {modalType === 'verify' && (
              <>
                <Text style={styles.modalText}>
                  Are you sure you want to verify {selectedUser?.username ?? selectedUser?.name ?? selectedUser?.email}?
                </Text>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={handleVerifyUser}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.modalButtonText}>Verify User</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {modalType === 'edit' && (
              <>
                {profileLoading && <ActivityIndicator color="#4C6FFF" />}
                {profile && (
                  <>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Email"
                      placeholderTextColor="#5f6a86"
                      value={profile.email}
                      onChangeText={(t) => setProfile({ ...profile!, email: t })}
                      autoCapitalize="none"
                    />
                    <TextInput
                      style={styles.modalInput}
                      placeholder="First name"
                      placeholderTextColor="#5f6a86"
                      value={profile.firstName ?? ''}
                      onChangeText={(t) => setProfile({ ...profile!, firstName: t })}
                    />
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Last name"
                      placeholderTextColor="#5f6a86"
                      value={profile.lastName ?? ''}
                      onChangeText={(t) => setProfile({ ...profile!, lastName: t })}
                    />
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Username"
                      placeholderTextColor="#5f6a86"
                      value={profile.username ?? ''}
                      onChangeText={(t) => setProfile({ ...profile!, username: t })}
                    />
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Display name"
                      placeholderTextColor="#5f6a86"
                      value={profile.displayName ?? ''}
                      onChangeText={(t) => setProfile({ ...profile!, displayName: t })}
                    />
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Country (ISO code)"
                      placeholderTextColor="#5f6a86"
                      value={profile.country ?? ''}
                      onChangeText={(t) => setProfile({ ...profile!, country: t })}
                    />
                    <TextInput
                      style={styles.modalInput}
                      placeholder="City / Hometown"
                      placeholderTextColor="#5f6a86"
                      value={profile.city ?? ''}
                      onChangeText={(t) => setProfile({ ...profile!, city: t })}
                    />
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Gender (male/female)"
                      placeholderTextColor="#5f6a86"
                      value={profile.gender ?? ''}
                      onChangeText={(t) => setProfile({ ...profile!, gender: t })}
                    />
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Orientation (male/female/both)"
                      placeholderTextColor="#5f6a86"
                      value={profile.orientation ?? ''}
                      onChangeText={(t) => setProfile({ ...profile!, orientation: t })}
                    />
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Phone country code (e.g. +90)"
                      placeholderTextColor="#5f6a86"
                      value={profile.phoneCountry ?? ''}
                      onChangeText={(t) => setProfile({ ...profile!, phoneCountry: t })}
                    />
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Phone number"
                      placeholderTextColor="#5f6a86"
                      value={profile.phoneNumber ?? ''}
                      onChangeText={(t) => setProfile({ ...profile!, phoneNumber: t })}
                    />
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={async () => {
                        if (!profile) return;
                        setActionLoading(true);
                        try {
                          await adminApi.updateUserProfile({ ...profile, userId: profile.id, email: profile.email });
                          Alert.alert('Success', 'Profile updated');
                          closeModal();
                          loadUsers();
                        } catch (err) {
                          console.error('[Users] Update profile error:', err);
                          Alert.alert('Error', 'Failed to update profile');
                        } finally {
                          setActionLoading(false);
                        }
                      }}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.modalButtonText}>Save</Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#0c0d10',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#9aa4bf',
  },
  autocompleteContainer: {
    marginBottom: 16,
  },
  list: {
    flex: 1,
  },
  pagination: {
    marginTop: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#23263a',
  },
  paginationText: {
    color: '#9aa4bf',
    fontSize: 12,
    marginBottom: 8,
  },
  paginationButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  pageButton: {
    backgroundColor: '#101015',
    borderWidth: 1,
    borderColor: '#23263a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pageButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#101015',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#23263a',
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#9aa4bf',
    marginBottom: 8,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userMetaText: {
    fontSize: 12,
    color: '#9aa4bf',
  },
  bannedBadge: {
    backgroundColor: '#2a1a1f',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  bannedText: {
    fontSize: 12,
    color: '#ff8aa0',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  banButton: {
    backgroundColor: '#2a1a1f',
  },
  coinButton: {
    backgroundColor: '#2a2315',
  },
  verifyButton: {
    backgroundColor: '#1a2a22',
  },
  editButton: {
    backgroundColor: '#121a2a',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#101015',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#23263a',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  modalInput: {
    backgroundColor: '#1a1d2e',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#23263a',
  },
  modalText: {
    fontSize: 14,
    color: '#9aa4bf',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#4C6FFF',
    borderRadius: 8,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  modalButtonDanger: {
    backgroundColor: '#ff8aa0',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
