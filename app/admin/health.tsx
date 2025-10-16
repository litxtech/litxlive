import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCircle, XCircle, RefreshCw, Shield, Database, Radio, Video, CreditCard, Users } from 'lucide-react-native';
import { useRouter } from 'expo-router';

type HealthStatus = 'ok' | 'warning' | 'error';

interface HealthModule {
  name: string;
  status: HealthStatus;
  icon: any;
  color: string;
  lastCheck: string;
}

export default function AdminHealth() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const [modules, setModules] = useState<HealthModule[]>([
    { name: 'Authentication', status: 'ok', icon: Shield, color: '#00FF88', lastCheck: 'Just now' },
    { name: 'Database', status: 'ok', icon: Database, color: '#00FF88', lastCheck: 'Just now' },
    { name: 'Presence', status: 'ok', icon: Radio, color: '#00FF88', lastCheck: 'Just now' },
    { name: 'Matchmaker', status: 'ok', icon: Users, color: '#00FF88', lastCheck: 'Just now' },
    { name: 'WebRTC', status: 'ok', icon: Video, color: '#00FF88', lastCheck: 'Just now' },
    { name: 'Payments', status: 'ok', icon: CreditCard, color: '#00FF88', lastCheck: 'Just now' },
  ]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const getStatusIcon = (status: HealthStatus) => {
    if (status === 'ok') return CheckCircle;
    if (status === 'warning') return AlertCircle;
    return XCircle;
  };

  const getStatusColor = (status: HealthStatus) => {
    if (status === 'ok') return '#00FF88';
    if (status === 'warning') return '#FFD700';
    return '#FF4444';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>System Health</Text>
        <TouchableOpacity
          onPress={handleRefresh}
          disabled={refreshing}
          style={styles.refreshButton}
        >
          <RefreshCw
            size={20}
            color="#666"
            style={{
              transform: [{ rotate: refreshing ? '180deg' : '0deg' }],
            }}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.overallStatus}>
            <CheckCircle size={32} color="#00FF88" />
            <Text style={styles.overallText}>All Systems Operational</Text>
          </View>

          <View style={styles.modulesGrid}>
            {modules.map((module, index) => {
              const Icon = module.icon;
              const StatusIcon = getStatusIcon(module.status);
              const statusColor = getStatusColor(module.status);

              return (
                <View key={index} style={styles.moduleCard}>
                  <View style={styles.moduleHeader}>
                    <Icon size={24} color={module.color} />
                    <StatusIcon size={20} color={statusColor} />
                  </View>
                  <Text style={styles.moduleName}>{module.name}</Text>
                  <Text style={styles.moduleStatus}>{module.lastCheck}</Text>
                  <TouchableOpacity style={styles.retryButton}>
                    <Text style={styles.retryText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
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
    flex: 1,
  },
  refreshButton: {
    padding: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  overallStatus: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#00FF8840',
  },
  overallText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#00FF88',
    marginTop: 12,
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  moduleCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  moduleName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 4,
  },
  moduleStatus: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#0B0B10',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  retryText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#666',
  },
});

const AlertCircle = ({ size, color }: { size: number; color: string }) => (
  <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />
);
