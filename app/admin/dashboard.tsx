import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAdmin } from '@/providers/AdminProvider';
import { adminApi, DashboardStats } from '@/services/adminApi';
import AdminSidebar from '@/components/AdminSidebar';
import { Users, Activity, Heart, DollarSign, AlertCircle, type LucideIcon } from 'lucide-react-native';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
        <Icon size={24} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isLoading: authLoading } = useAdmin();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/admin' as any);
    }
  }, [isAuthenticated, authLoading, router]);

  const loadStats = async () => {
    try {
      setError(null);
      const data = await adminApi.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('[Dashboard] Error loading stats:', err);
      setError('Failed to load dashboard stats');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadStats();
    }
  }, [isAuthenticated]);

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
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
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>Overview of your platform</Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <AlertCircle size={20} color="#ff8aa0" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {stats && (
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Users"
              value={stats.total_users.toLocaleString()}
              icon={Users}
              color="#4C6FFF"
            />
            <StatCard
              title="Active Today"
              value={stats.active_today.toLocaleString()}
              icon={Activity}
              color="#49d39c"
            />
            <StatCard
              title="Total Matches"
              value={stats.total_matches.toLocaleString()}
              icon={Heart}
              color="#ff7a9e"
            />
            <StatCard
              title="Total Revenue"
              value={`$${(stats.total_revenue / 100).toFixed(2)}`}
              icon={DollarSign}
              color="#ffa94d"
            />
            <StatCard
              title="Pending Reports"
              value={stats.pending_reports.toLocaleString()}
              icon={AlertCircle}
              color="#ff8aa0"
            />
          </View>
        )}
      </ScrollView>
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
  },
  contentContainer: {
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
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a1a1f',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  errorText: {
    flex: 1,
    color: '#ff8aa0',
    fontSize: 14,
  },
  statsGrid: {
    gap: 16,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#101015',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#23263a',
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    fontSize: 14,
    color: '#9aa4bf',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
});
