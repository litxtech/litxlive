import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  ArrowLeft,
  Ban,
  CheckCircle,
  Coins,
  Infinity,
  Copy,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { trpc, trpcClient } from '@/lib/trpc';

export default function UserManagementScreen() {
  const router = useRouter();
  const [uniqueIdSearch, setUniqueIdSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAddCoinsModal, setShowAddCoinsModal] = useState(false);
  const [coinsAmount, setCoinsAmount] = useState('');
  const [coinsReason, setCoinsReason] = useState('');
  
  // Autocomplete states
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const addCoinsMutation = trpc.admin.users.addCoinsByUniqueId.useMutation();
  const banMutation = trpc.admin.users.banByUniqueId.useMutation();
  const verifyMutation = trpc.admin.users.verifyByUniqueId.useMutation();
  const unlimitedCoinsMutation = trpc.admin.users.setUnlimitedCoins.useMutation();
  const topUsersQuery = trpc.admin.users.getTopUsers.useQuery({ limit: 10, sortBy: 'calls' });

  // Autocomplete search function
  const searchUsers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setSearchLoading(true);
    try {
      // Search by email, name, or uniqueId
      const suggestions = await trpcClient.admin.users.searchUsers.query({
        query: query,
        limit: 10
      });
      setSearchSuggestions(suggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error('[UserSearch] Autocomplete error:', error);
      setSearchSuggestions([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(uniqueIdSearch);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [uniqueIdSearch, searchUsers]);

  const handleSearch = async () => {
    if (!uniqueIdSearch.trim()) {
      Alert.alert('Error', 'Please enter a search term');
      return;
    }

    try {
      const result = await trpcClient.admin.users.searchByUniqueId.query({ uniqueId: uniqueIdSearch.trim() });
      setSelectedUser(result);
      setShowUserModal(true);
      setShowSuggestions(false);
    } catch {
      Alert.alert('Error', 'User not found');
    }
  };

  const handleSuggestionSelect = async (suggestion: any) => {
    setUniqueIdSearch(suggestion.uniqueId || suggestion.email || suggestion.name);
    setShowSuggestions(false);
    
    try {
      const result = await trpcClient.admin.users.searchByUniqueId.query({ 
        uniqueId: suggestion.uniqueId 
      });
      setSelectedUser(result);
      setShowUserModal(true);
    } catch {
      Alert.alert('Error', 'User not found');
    }
  };

  const handleAddCoins = async () => {
    if (!selectedUser || !coinsAmount) {
      Alert.alert('Error', 'Please enter coins amount');
      return;
    }

    try {
      await addCoinsMutation.mutateAsync({
        uniqueId: selectedUser.user.uniqueId,
        amount: parseInt(coinsAmount),
        reason: coinsReason || 'Admin grant',
      });

      Alert.alert('Success', `${coinsAmount} coins added successfully`);
      setShowAddCoinsModal(false);
      setCoinsAmount('');
      setCoinsReason('');

      const updatedUser = await trpcClient.admin.users.searchByUniqueId.query({
        uniqueId: selectedUser.user.uniqueId,
      });
      setSelectedUser(updatedUser);
    } catch {
      Alert.alert('Error', 'Failed to add coins');
    }
  };

  const handleBanUser = () => {
    if (!selectedUser) return;

    Alert.alert(
      'Ban User',
      `Are you sure you want to ban ${selectedUser.user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Ban 7 Days',
          style: 'destructive',
          onPress: async () => {
            try {
              await banMutation.mutateAsync({
                uniqueId: selectedUser.user.uniqueId,
                reason: 'Admin action',
                durationDays: 7,
              });
              Alert.alert('Success', 'User banned for 7 days');
              setShowUserModal(false);
            } catch {
              Alert.alert('Error', 'Failed to ban user');
            }
          },
        },
        {
          text: 'Ban Permanent',
          style: 'destructive',
          onPress: async () => {
            try {
              await banMutation.mutateAsync({
                uniqueId: selectedUser.user.uniqueId,
                reason: 'Admin action - permanent',
              });
              Alert.alert('Success', 'User permanently banned');
              setShowUserModal(false);
            } catch {
              Alert.alert('Error', 'Failed to ban user');
            }
          },
        },
      ]
    );
  };

  const handleVerifyUser = async () => {
    if (!selectedUser) return;

    try {
      await verifyMutation.mutateAsync({
        uniqueId: selectedUser.user.uniqueId,
        verificationType: 'identity',
        badgeLevel: 'gold',
      });
      Alert.alert('Success', 'User verified successfully');

      const updatedUser = await trpcClient.admin.users.searchByUniqueId.query({
        uniqueId: selectedUser.user.uniqueId,
      });
      setSelectedUser(updatedUser);
    } catch {
      Alert.alert('Error', 'Failed to verify user');
    }
  };

  const handleToggleUnlimitedCoins = async () => {
    if (!selectedUser) return;

    const isUnlimited = selectedUser.user.unlimitedCoins;

    try {
      await unlimitedCoinsMutation.mutateAsync({
        uniqueId: selectedUser.user.uniqueId,
        unlimited: !isUnlimited,
      });

      Alert.alert(
        'Success',
        `Unlimited coins ${!isUnlimited ? 'enabled' : 'disabled'}`
      );

      const updatedUser = await trpcClient.admin.users.searchByUniqueId.query({
        uniqueId: selectedUser.user.uniqueId,
      });
      setSelectedUser(updatedUser);
    } catch {
      Alert.alert('Error', 'Failed to toggle unlimited coins');
    }
  };

  const copyToClipboard = (text: string) => {
    Alert.alert('Copied', `${text} copied to clipboard`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Management</Text>
      </View>

      <View style={styles.searchSection}>
        <Text style={styles.sectionTitle}>🔍 Search Users</Text>
        <View style={styles.searchContainer}>
          <Search size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by email, name, or Unique ID..."
            placeholderTextColor="#666"
            value={uniqueIdSearch}
            onChangeText={setUniqueIdSearch}
            onFocus={() => setShowSuggestions(true)}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchLoading && (
            <ActivityIndicator size="small" color="#F04F8F" style={styles.searchLoading} />
          )}
        </View>
        
        {/* Autocomplete Suggestions */}
        {showSuggestions && searchSuggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <FlatList
              data={searchSuggestions}
              keyExtractor={(item) => item.uniqueId || item.email}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => handleSuggestionSelect(item)}
                >
                  <View style={styles.suggestionContent}>
                    <Text style={styles.suggestionName}>{item.name}</Text>
                    <Text style={styles.suggestionEmail}>{item.email}</Text>
                    <Text style={styles.suggestionId}>{item.uniqueId}</Text>
                  </View>
                </TouchableOpacity>
              )}
              style={styles.suggestionsList}
            />
          </View>
        )}
        
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
        >
          <Text style={styles.searchButtonText}>Search User</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.topUsersSection}>
          <Text style={styles.sectionTitle}>🏆 Top Active Users</Text>
          {topUsersQuery.isLoading && (
            <ActivityIndicator size="large" color="#F04F8F" />
          )}
          {topUsersQuery.data?.users.map((user, index) => (
            <TouchableOpacity
              key={user.uniqueId}
              style={styles.topUserCard}
              onPress={async () => {
                const result = await trpcClient.admin.users.searchByUniqueId.query({
                  uniqueId: user.uniqueId,
                });
                setSelectedUser(result);
                setShowUserModal(true);
              }}
            >
              <View style={styles.topUserRank}>
                <Text style={styles.topUserRankText}>#{index + 1}</Text>
              </View>
              <View style={styles.topUserInfo}>
                <Text style={styles.topUserName}>{user.name}</Text>
                <Text style={styles.topUserId}>{user.uniqueId}</Text>
                <View style={styles.topUserStats}>
                  <Text style={styles.topUserStat}>
                    📞 {user.totalCalls} calls
                  </Text>
                  <Text style={styles.topUserStat}>
                    ⏱️ {user.totalMinutes} min
                  </Text>
                  <Text style={styles.topUserStat}>
                    💰 {user.currentCoins} coins
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={showUserModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUserModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>User Details</Text>
              <TouchableOpacity onPress={() => setShowUserModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedUser && (
              <ScrollView style={styles.modalScroll}>
                <View style={styles.userDetailCard}>
                  <View style={styles.userDetailRow}>
                    <Text style={styles.userDetailLabel}>Unique ID:</Text>
                    <TouchableOpacity
                      onPress={() =>
                        copyToClipboard(selectedUser.user.uniqueId)
                      }
                      style={styles.copyButton}
                    >
                      <Text style={styles.userDetailValue}>
                        {selectedUser.user.uniqueId}
                      </Text>
                      <Copy size={16} color="#F04F8F" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.userDetailRow}>
                    <Text style={styles.userDetailLabel}>Name:</Text>
                    <Text style={styles.userDetailValue}>
                      {selectedUser.user.name}
                    </Text>
                  </View>

                  <View style={styles.userDetailRow}>
                    <Text style={styles.userDetailLabel}>Email:</Text>
                    <Text style={styles.userDetailValue}>
                      {selectedUser.user.email}
                    </Text>
                  </View>

                  <View style={styles.userDetailRow}>
                    <Text style={styles.userDetailLabel}>Coins:</Text>
                    <Text style={styles.userDetailValue}>
                      {selectedUser.user.unlimitedCoins ? '♾️ ' : ''}
                      {selectedUser.user.coins}
                    </Text>
                  </View>

                  <View style={styles.userDetailRow}>
                    <Text style={styles.userDetailLabel}>Status:</Text>
                    <Text
                      style={[
                        styles.userDetailValue,
                        selectedUser.user.status === 'active'
                          ? styles.statusActive
                          : styles.statusBanned,
                      ]}
                    >
                      {selectedUser.user.status}
                    </Text>
                  </View>

                  {selectedUser.user.isTestAccount && (
                    <View style={styles.testAccountBadge}>
                      <Text style={styles.testAccountText}>
                        🧪 TEST ACCOUNT
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.analyticsCard}>
                  <Text style={styles.analyticsTitle}>📊 Analytics</Text>
                  <View style={styles.analyticsGrid}>
                    <View style={styles.analyticItem}>
                      <Text style={styles.analyticValue}>
                        {selectedUser.analytics.totalCalls}
                      </Text>
                      <Text style={styles.analyticLabel}>Total Calls</Text>
                    </View>
                    <View style={styles.analyticItem}>
                      <Text style={styles.analyticValue}>
                        {selectedUser.analytics.totalMinutes}
                      </Text>
                      <Text style={styles.analyticLabel}>Minutes</Text>
                    </View>
                    <View style={styles.analyticItem}>
                      <Text style={styles.analyticValue}>
                        {selectedUser.analytics.coinsSpent}
                      </Text>
                      <Text style={styles.analyticLabel}>Coins Spent</Text>
                    </View>
                    <View style={styles.analyticItem}>
                      <Text style={styles.analyticValue}>
                        {selectedUser.analytics.giftsSent}
                      </Text>
                      <Text style={styles.analyticLabel}>Gifts Sent</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.actionsCard}>
                  <Text style={styles.actionsTitle}>⚡ Quick Actions</Text>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => setShowAddCoinsModal(true)}
                  >
                    <Coins size={20} color="#10B981" />
                    <Text style={styles.actionButtonText}>Add Coins</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleToggleUnlimitedCoins}
                    disabled={unlimitedCoinsMutation.isPending}
                  >
                    <Infinity size={20} color="#9B51E0" />
                    <Text style={styles.actionButtonText}>
                      {selectedUser.user.unlimitedCoins
                        ? 'Disable'
                        : 'Enable'}{' '}
                      Unlimited Coins
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleVerifyUser}
                    disabled={verifyMutation.isPending}
                  >
                    <CheckCircle size={20} color="#2AD1FF" />
                    <Text style={styles.actionButtonText}>Verify User</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.dangerButton]}
                    onPress={handleBanUser}
                    disabled={banMutation.isPending}
                  >
                    <Ban size={20} color="#FF4444" />
                    <Text style={[styles.actionButtonText, styles.dangerText]}>
                      Ban User
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showAddCoinsModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowAddCoinsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.addCoinsModal}>
            <Text style={styles.modalTitle}>Add Coins</Text>

            <TextInput
              style={styles.input}
              placeholder="Amount"
              placeholderTextColor="#666"
              value={coinsAmount}
              onChangeText={setCoinsAmount}
              keyboardType="numeric"
            />

            <TextInput
              style={styles.input}
              placeholder="Reason (optional)"
              placeholderTextColor="#666"
              value={coinsReason}
              onChangeText={setCoinsReason}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddCoinsModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleAddCoins}
                disabled={addCoinsMutation.isPending}
              >
                {addCoinsMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Add Coins</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B10',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
  },
  searchSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#fff',
  },
  searchButton: {
    backgroundColor: '#F04F8F',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  topUsersSection: {
    padding: 16,
  },
  topUserCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  topUserRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F04F8F',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  topUserRankText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  topUserInfo: {
    flex: 1,
  },
  topUserName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 4,
  },
  topUserId: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  topUserStats: {
    flexDirection: 'row',
    gap: 12,
  },
  topUserStat: {
    fontSize: 12,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
  },
  modalClose: {
    fontSize: 24,
    color: '#999',
  },
  modalScroll: {
    flex: 1,
  },
  userDetailCard: {
    backgroundColor: '#0B0B10',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  userDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userDetailLabel: {
    fontSize: 14,
    color: '#999',
  },
  userDetailValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusActive: {
    color: '#10B981',
  },
  statusBanned: {
    color: '#FF4444',
  },
  testAccountBadge: {
    backgroundColor: '#9B51E0',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  testAccountText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#fff',
  },
  analyticsCard: {
    backgroundColor: '#0B0B10',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  analyticsTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 16,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  analyticItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  analyticValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#F04F8F',
    marginBottom: 4,
  },
  analyticLabel: {
    fontSize: 12,
    color: '#999',
  },
  actionsCard: {
    backgroundColor: '#0B0B10',
    borderRadius: 12,
    padding: 16,
  },
  actionsTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  dangerButton: {
    backgroundColor: '#2a1a1a',
  },
  dangerText: {
    color: '#FF4444',
  },
  addCoinsModal: {
    width: '80%',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
  },
  input: {
    backgroundColor: '#0B0B10',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#333',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  confirmButton: {
    backgroundColor: '#F04F8F',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  // Autocomplete styles
  searchLoading: {
    marginLeft: 8,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    zIndex: 1000,
    maxHeight: 200,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 2,
  },
  suggestionEmail: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  suggestionId: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'monospace',
  },
});
