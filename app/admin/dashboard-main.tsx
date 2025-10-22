import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { useAdmin } from '@/providers/AdminProvider';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  trend?: string;
}

function StatCard({ title, value, icon, color, trend }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
          <MaterialIcons name={icon as any} size={24} color={color} />
        </View>
        {trend && (
          <Text style={[styles.trendText, { color: trend.startsWith('+') ? '#10B981' : '#EF4444' }]}>
            {trend}
          </Text>
        )}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );
}

export default function AdminDashboardMain() {
  const insets = useSafeAreaInsets();
  const { isAdmin, isLoading } = useAdmin();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    liveCalls: 0,
    revenue: 0,
  });

  const loadStats = async () => {
    // Simulate API call
    setTimeout(() => {
      setStats({
        totalUsers: 1234,
        activeUsers: 567,
        liveCalls: 23,
        revenue: 5678,
      });
    }, 1000);
  };

  useEffect(() => {
    loadStats();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading Admin Panel...</Text>
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={styles.noAccessContainer}>
        <MaterialIcons name="block" size={64} color={Colors.textMuted} />
        <Text style={styles.noAccessTitle}>Access Denied</Text>
        <Text style={styles.noAccessText}>
          You don&apos;t have admin privileges
        </Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <Text style={styles.headerSubtitle}>Welcome back, Admin!</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon="people"
          color="#3B82F6"
          trend="+12%"
        />
        <StatCard
          title="Active Users"
          value={stats.activeUsers.toLocaleString()}
          icon="person"
          color="#10B981"
          trend="+8%"
        />
        <StatCard
          title="Live Calls"
          value={stats.liveCalls}
          icon="videocam"
          color="#F59E0B"
          trend="-3%"
        />
        <StatCard
          title="Revenue"
          value={`$${stats.revenue.toLocaleString()}`}
          icon="account-balance-wallet"
          color="#8B5CF6"
          trend="+15%"
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard}>
            <LinearGradient
              colors={['#3B82F6', '#1D4ED8']}
              style={styles.actionGradient}
            >
              <MaterialIcons name="people" size={24} color="#FFFFFF" />
              <Text style={styles.actionText}>Manage Users</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.actionGradient}
            >
              <MaterialIcons name="videocam" size={24} color="#FFFFFF" />
              <Text style={styles.actionText}>Live Sessions</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <LinearGradient
              colors={['#EF4444', '#DC2626']}
              style={styles.actionGradient}
            >
              <MaterialIcons name="security" size={24} color="#FFFFFF" />
              <Text style={styles.actionText}>Moderation</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              style={styles.actionGradient}
            >
              <MaterialIcons name="account-balance-wallet" size={24} color="#FFFFFF" />
              <Text style={styles.actionText}>Wallet</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityList}>
          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <MaterialIcons name="person-add" size={20} color="#10B981" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>New user registered</Text>
              <Text style={styles.activityTime}>2 minutes ago</Text>
            </View>
          </View>

          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <MaterialIcons name="videocam" size={20} color="#3B82F6" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Live call started</Text>
              <Text style={styles.activityTime}>5 minutes ago</Text>
            </View>
          </View>

          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <MaterialIcons name="report" size={20} color="#F59E0B" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>New report submitted</Text>
              <Text style={styles.activityTime}>10 minutes ago</Text>
            </View>
          </View>

          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <MaterialIcons name="account-balance-wallet" size={20} color="#8B5CF6" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Payment processed</Text>
              <Text style={styles.activityTime}>15 minutes ago</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundColor,
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundColor,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.text,
    marginTop: 16,
  },
  noAccessContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundColor,
    padding: 20,
  },
  noAccessTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  noAccessText: {
    fontSize: 16,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionGradient: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  activityList: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});
