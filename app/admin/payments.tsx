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
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAdmin } from '@/providers/AdminProvider';
import { adminApi } from '@/services/adminApi';
import type { PaymentTransaction } from '@/services/adminApi';
import AdminSidebar from '@/components/AdminSidebar';
import { CheckCircle, XCircle, Clock } from 'lucide-react-native';

export default function AdminPayments() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isLoading: authLoading } = useAdmin();
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [filter, setFilter] = useState<'succeeded' | 'failed' | 'pending' | undefined>('succeeded');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/admin' as any);
    }
  }, [isAuthenticated, authLoading, router]);

  const loadPayments = useCallback(async () => {
    try {
      const data = await adminApi.getPayments({ status: filter, limit: 100 });
      setPayments(data);
    } catch (err) {
      console.error('[Payments] Error loading payments:', err);
      Alert.alert('Error', 'Failed to load payments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    if (isAuthenticated) {
      loadPayments();
    }
  }, [isAuthenticated, loadPayments]);

  const onRefresh = () => {
    setRefreshing(true);
    loadPayments();
  };

  const formatAmount = (amountCent: number, currency: string): string => {
    const amount = amountCent / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
          <Text style={styles.title}>Payments</Text>
          <Text style={styles.subtitle}>Transaction history and management</Text>
        </View>

        <View style={styles.filters}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'succeeded' && styles.filterButtonActive]}
            onPress={() => setFilter('succeeded')}
            activeOpacity={0.7}
          >
            <CheckCircle size={16} color={filter === 'succeeded' ? '#4C6FFF' : '#9aa4bf'} />
            <Text style={[styles.filterText, filter === 'succeeded' && styles.filterTextActive]}>
              Succeeded
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'failed' && styles.filterButtonActive]}
            onPress={() => setFilter('failed')}
            activeOpacity={0.7}
          >
            <XCircle size={16} color={filter === 'failed' ? '#4C6FFF' : '#9aa4bf'} />
            <Text style={[styles.filterText, filter === 'failed' && styles.filterTextActive]}>
              Failed
            </Text>
          </TouchableOpacity>
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
            style={[styles.filterButton, filter === undefined && styles.filterButtonActive]}
            onPress={() => setFilter(undefined)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, filter === undefined && styles.filterTextActive]}>
              All
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {payments.map((payment) => (
            <View key={payment.id} style={styles.paymentCard}>
              <View style={styles.paymentInfo}>
                <View style={styles.paymentHeader}>
                  <Text style={styles.paymentAmount}>
                    {formatAmount(payment.amount_cent, payment.currency)}
                  </Text>
                  <View style={[
                    styles.statusBadge,
                    payment.status === 'succeeded'
                      ? styles.statussucceeded
                      : payment.status === 'failed'
                      ? styles.statusfailed
                      : styles.statuspending,
                  ]}>
                    <Text style={styles.statusText}>{payment.status}</Text>
                  </View>
                </View>
                <Text style={styles.paymentSku}>SKU: {payment.sku}</Text>
                <Text style={styles.paymentProvider}>Provider: {payment.provider}</Text>
                <Text style={styles.paymentDate}>{formatDate(payment.created_at)}</Text>
                <Text style={styles.paymentId} numberOfLines={1}>
                  ID: {payment.id}
                </Text>
              </View>
            </View>
          ))}
          {payments.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No {filter || ''} payments</Text>
            </View>
          )}
        </ScrollView>
      </View>
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
    flexWrap: 'wrap',
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
  paymentCard: {
    backgroundColor: '#101015',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#23263a',
    marginBottom: 12,
  },
  paymentInfo: {
    gap: 6,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  paymentAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statussucceeded: {
    backgroundColor: '#1a2a22',
  },
  statusfailed: {
    backgroundColor: '#2a1a1f',
  },
  statuspending: {
    backgroundColor: '#2a2315',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'capitalize',
  },
  paymentSku: {
    fontSize: 14,
    color: '#9aa4bf',
  },
  paymentProvider: {
    fontSize: 14,
    color: '#9aa4bf',
  },
  paymentDate: {
    fontSize: 13,
    color: '#6f7899',
  },
  paymentId: {
    fontSize: 12,
    color: '#5f6a86',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
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
});
