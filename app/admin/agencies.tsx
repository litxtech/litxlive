import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAdmin } from '@/providers/AdminProvider';
import { adminApi, AgencyApplication } from '@/services/adminApi';
import AdminSidebar from '@/components/AdminSidebar';
import { CheckCircle, XCircle, Clock, X } from 'lucide-react-native';

export default function AdminAgencies() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isLoading: authLoading } = useAdmin();
  const [agencies, setAgencies] = useState<AgencyApplication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | undefined>('pending');
  const [selectedAgency, setSelectedAgency] = useState<AgencyApplication | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/admin' as any);
    }
  }, [isAuthenticated, authLoading, router]);

  const loadAgencies = useCallback(async () => {
    try {
      const data = await adminApi.getAgencies({ status: filter, limit: 100 });
      setAgencies(data);
    } catch (err) {
      console.error('[Agencies] Error loading agencies:', err);
      Alert.alert('Error', 'Failed to load agencies');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    if (isAuthenticated) {
      loadAgencies();
    }
  }, [isAuthenticated, loadAgencies]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAgencies();
  };

  const openModal = (agency: AgencyApplication) => {
    setSelectedAgency(agency);
    setModalVisible(true);
    setReviewNotes('');
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedAgency(null);
    setReviewNotes('');
  };

  const handleSetStatus = async (status: 'approved' | 'rejected') => {
    if (!selectedAgency) return;

    setActionLoading(true);
    try {
      await adminApi.setAgencyStatus(selectedAgency.id, status, reviewNotes.trim() || undefined);
      Alert.alert('Success', `Agency ${status} successfully`);
      closeModal();
      loadAgencies();
    } catch (err) {
      console.error('[Agencies] Set status error:', err);
      Alert.alert('Error', `Failed to ${status} agency`);
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
          <Text style={styles.title}>Agency Applications</Text>
          <Text style={styles.subtitle}>Review and manage agency requests</Text>
        </View>

        <View style={styles.filters}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'pending' && styles.filterButtonActive]}
            onPress={() => setFilter('pending')}
            activeOpacity={0.7}
          >
            <Clock size={16} color={filter === 'pending' ? '#4C6FFF' : '#9aa4bf'} />
            <Text style={[styles.filterText, filter === 'pending' && styles.filterTextActive]}>
              Pending
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'approved' && styles.filterButtonActive]}
            onPress={() => setFilter('approved')}
            activeOpacity={0.7}
          >
            <CheckCircle size={16} color={filter === 'approved' ? '#4C6FFF' : '#9aa4bf'} />
            <Text style={[styles.filterText, filter === 'approved' && styles.filterTextActive]}>
              Approved
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'rejected' && styles.filterButtonActive]}
            onPress={() => setFilter('rejected')}
            activeOpacity={0.7}
          >
            <XCircle size={16} color={filter === 'rejected' ? '#4C6FFF' : '#9aa4bf'} />
            <Text style={[styles.filterText, filter === 'rejected' && styles.filterTextActive]}>
              Rejected
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {agencies.map((agency) => (
            <TouchableOpacity
              key={agency.id}
              style={styles.agencyCard}
              onPress={() => openModal(agency)}
              activeOpacity={0.7}
            >
              <View style={styles.agencyInfo}>
                <Text style={styles.agencyName}>{agency.first_name} {agency.last_name}</Text>
                <Text style={styles.agencyContact}>{agency.email}</Text>
                {agency.phone && <Text style={styles.agencyPhone}>{agency.phone}</Text>}
                <Text style={styles.agencyLocation}>{agency.city}</Text>
                {agency.application_purpose && (
                  <Text style={styles.agencyPurpose}>
                    Amaç: {agency.application_purpose}
                  </Text>
                )}
              </View>
              <View style={[
                styles.statusBadge,
                agency.status === 'pending' && styles.statuspending,
                agency.status === 'approved' && styles.statusapproved,
                agency.status === 'rejected' && styles.statusrejected
              ]}>
                <Text style={styles.statusText}>{agency.status}</Text>
              </View>
            </TouchableOpacity>
          ))}
          {agencies.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No {filter} applications</Text>
            </View>
          )}
        </ScrollView>
      </View>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Review Application</Text>
              <TouchableOpacity onPress={closeModal}>
                <X size={24} color="#9aa4bf" />
              </TouchableOpacity>
            </View>

            {selectedAgency && (
              <>
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Ad Soyad</Text>
                  <Text style={styles.modalValue}>{selectedAgency.first_name} {selectedAgency.last_name}</Text>
                </View>
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Başvuru Amacı</Text>
                  <Text style={styles.modalValue}>{selectedAgency.application_purpose}</Text>
                </View>
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Email</Text>
                  <Text style={styles.modalValue}>{selectedAgency.email}</Text>
                </View>
                {selectedAgency.phone && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Phone</Text>
                    <Text style={styles.modalValue}>{selectedAgency.phone}</Text>
                  </View>
                )}
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Konum</Text>
                  <Text style={styles.modalValue}>{selectedAgency.city}</Text>
                </View>
                {selectedAgency.company_name && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Şirket Adı</Text>
                    <Text style={styles.modalValue}>{selectedAgency.company_name}</Text>
                  </View>
                )}
                {selectedAgency.website && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Website</Text>
                    <Text style={styles.modalValue}>{selectedAgency.website}</Text>
                  </View>
                )}

                <TextInput
                  style={styles.modalInput}
                  placeholder="Review notes (optional)"
                  placeholderTextColor="#5f6a86"
                  value={reviewNotes}
                  onChangeText={setReviewNotes}
                  multiline
                />

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonApprove]}
                    onPress={() => handleSetStatus('approved')}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <CheckCircle size={20} color="#fff" />
                        <Text style={styles.modalButtonText}>Approve</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonReject]}
                    onPress={() => handleSetStatus('rejected')}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <XCircle size={20} color="#fff" />
                        <Text style={styles.modalButtonText}>Reject</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
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
  filters: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#101015',
    borderWidth: 1,
    borderColor: '#23263a',
    gap: 8,
  },
  filterButtonActive: {
    backgroundColor: '#1a1d2e',
    borderColor: '#4C6FFF',
  },
  filterText: {
    fontSize: 14,
    color: '#9aa4bf',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#4C6FFF',
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  agencyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: '#101015',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#23263a',
    marginBottom: 12,
  },
  agencyInfo: {
    flex: 1,
  },
  agencyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  agencyContact: {
    fontSize: 14,
    color: '#9aa4bf',
    marginBottom: 2,
  },
  agencyEmail: {
    fontSize: 14,
    color: '#9aa4bf',
    marginBottom: 2,
  },
  agencyPhone: {
    fontSize: 14,
    color: '#9aa4bf',
    marginBottom: 8,
  },
  agencyLocation: {
    fontSize: 13,
    color: '#6f7899',
    marginBottom: 4,
  },
  agencyPurpose: {
    fontSize: 12,
    color: '#4C6FFF',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 12,
  },
  statuspending: {
    backgroundColor: '#2a2315',
  },
  statusapproved: {
    backgroundColor: '#1a2a22',
  },
  statusrejected: {
    backgroundColor: '#2a1a1f',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#9aa4bf',
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
    maxWidth: 500,
    maxHeight: '80%',
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
  modalSection: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 12,
    color: '#9aa4bf',
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  modalValue: {
    fontSize: 14,
    color: '#fff',
  },
  modalInput: {
    backgroundColor: '#1a1d2e',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#23263a',
    minHeight: 80,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    height: 48,
    gap: 8,
  },
  modalButtonApprove: {
    backgroundColor: '#49d39c',
  },
  modalButtonReject: {
    backgroundColor: '#ff8aa0',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
