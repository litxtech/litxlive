import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAdmin } from '@/providers/AdminProvider';
import { adminApi, AdminLog } from '@/services/adminApi';
import AdminSidebar from '@/components/AdminSidebar';
import { ScrollText } from 'lucide-react-native';

export default function AdminLogs() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isLoading: authLoading } = useAdmin();
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/admin' as any);
    }
  }, [isAuthenticated, authLoading, router]);

  const loadLogs = useCallback(async () => {
    try {
      const data = await adminApi.getLogs({ limit: 100 });
      setLogs(data);
    } catch (err) {
      console.error('[Logs] Error loading logs:', err);
      Alert.alert('Error', 'Failed to load logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadLogs();
    }
  }, [isAuthenticated, loadLogs]);

  const onRefresh = () => {
    setRefreshing(true);
    loadLogs();
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
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
          <View style={styles.headerIcon}>
            <ScrollText size={24} color="#4C6FFF" />
          </View>
          <View>
            <Text style={styles.title}>Activity Logs</Text>
            <Text style={styles.subtitle}>Admin actions and system events</Text>
          </View>
        </View>

        <ScrollView
          style={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {logs.map((log) => (
            <View key={log.id} style={styles.logCard}>
              <View style={styles.logHeader}>
                <Text style={styles.logAction}>{log.action}</Text>
                <Text style={styles.logDate}>{formatDate(log.created_at)}</Text>
              </View>
              <Text style={styles.logUsername}>By: {log.username}</Text>
              {log.resource_type && (
                <Text style={styles.logResource}>
                  Resource: {log.resource_type}
                  {log.resource_id && ` (${log.resource_id.substring(0, 8)}...)`}
                </Text>
              )}
              {log.ip_address && (
                <Text style={styles.logIp}>IP: {log.ip_address}</Text>
              )}
              {log.details && Object.keys(log.details).length > 0 && (
                <View style={styles.logDetails}>
                  <Text style={styles.logDetailsTitle}>Details:</Text>
                  <Text style={styles.logDetailsText}>
                    {JSON.stringify(log.details, null, 2)}
                  </Text>
                </View>
              )}
            </View>
          ))}
          {logs.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No logs available</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#1a1d2e',
    alignItems: 'center',
    justifyContent: 'center',
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
  list: {
    flex: 1,
  },
  logCard: {
    backgroundColor: '#101015',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#23263a',
    marginBottom: 12,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  logAction: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  logDate: {
    fontSize: 12,
    color: '#6f7899',
  },
  logUsername: {
    fontSize: 14,
    color: '#9aa4bf',
    marginBottom: 4,
  },
  logResource: {
    fontSize: 14,
    color: '#9aa4bf',
    marginBottom: 4,
  },
  logIp: {
    fontSize: 13,
    color: '#6f7899',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  logDetails: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#1a1d2e',
    borderRadius: 8,
  },
  logDetailsTitle: {
    fontSize: 12,
    color: '#9aa4bf',
    marginBottom: 8,
    fontWeight: '600',
  },
  logDetailsText: {
    fontSize: 12,
    color: '#6f7899',
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
