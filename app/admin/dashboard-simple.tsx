import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useAdmin } from '@/providers/AdminProvider';

export default function AdminDashboardSimple() {
  const insets = useSafeAreaInsets();
  const { isAdmin, isLoading, adminData } = useAdmin();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
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
    >
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>Welcome to the admin panel</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <MaterialIcons name="people" size={32} color={Colors.primary} />
          <Text style={styles.statNumber}>1,234</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>

        <View style={styles.statCard}>
          <MaterialIcons name="videocam" size={32} color="#10B981" />
          <Text style={styles.statNumber}>45</Text>
          <Text style={styles.statLabel}>Live Calls</Text>
        </View>

        <View style={styles.statCard}>
          <MaterialIcons name="report" size={32} color="#F59E0B" />
          <Text style={styles.statNumber}>12</Text>
          <Text style={styles.statLabel}>Reports</Text>
        </View>

        <View style={styles.statCard}>
          <MaterialIcons name="account-balance-wallet" size={32} color="#8B5CF6" />
          <Text style={styles.statNumber}>$5,678</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity style={styles.actionButton}>
          <MaterialIcons name="people" size={24} color={Colors.primary} />
          <Text style={styles.actionText}>Manage Users</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <MaterialIcons name="videocam" size={24} color={Colors.primary} />
          <Text style={styles.actionText}>Live Sessions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <MaterialIcons name="security" size={24} color={Colors.primary} />
          <Text style={styles.actionText}>Moderation</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <MaterialIcons name="account-balance-wallet" size={24} color={Colors.primary} />
          <Text style={styles.actionText}>Wallet</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.recentActivity}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        
        <View style={styles.activityItem}>
          <MaterialIcons name="person-add" size={20} color="#10B981" />
          <Text style={styles.activityText}>New user registered</Text>
          <Text style={styles.activityTime}>2 min ago</Text>
        </View>

        <View style={styles.activityItem}>
          <MaterialIcons name="videocam" size={20} color="#3B82F6" />
          <Text style={styles.activityText}>Live call started</Text>
          <Text style={styles.activityTime}>5 min ago</Text>
        </View>

        <View style={styles.activityItem}>
          <MaterialIcons name="report" size={20} color="#F59E0B" />
          <Text style={styles.activityText}>New report submitted</Text>
          <Text style={styles.activityTime}>10 min ago</Text>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
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
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  quickActions: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionText: {
    fontSize: 16,
    color: Colors.text,
    marginLeft: 12,
  },
  recentActivity: {
    marginBottom: 32,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activityText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    marginLeft: 12,
  },
  activityTime: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});
