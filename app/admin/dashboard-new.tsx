import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { useAdmin } from '@/providers/AdminProvider';

const { width } = Dimensions.get('window');

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  liveCalls: number;
  complaints: number;
  revenue: number;
  riskScore: number;
  // LUMI Specific Stats
  lumiIdsGenerated: number;
  verifiedUsers: number;
  vipUsers: number;
  totalCoins: number;
  giftsSent: number;
  subscriptions: {
    standard: number;
    gold: number;
    vip: number;
  };
  ibanPayments: number;
  robotModeration: {
    active: number;
    warnings: number;
    blocks: number;
  };
}

interface LiveCall {
  id: string;
  roomName: string;
  participants: number;
  duration: string;
  host: string;
  mode: string;
}

interface Complaint {
  id: string;
  user: string;
  type: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'reviewed' | 'resolved';
  timestamp: string;
}

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const { isAdmin, isLoading } = useAdmin();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [liveCalls, setLiveCalls] = useState<LiveCall[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [riskAlerts, setRiskAlerts] = useState<any[]>([]);
  
  // Animasyonlar
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadDashboardData();
    startAnimations();
  }, []);

  const startAnimations = () => {
    // Fade in animasyonu
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Slide up animasyonu
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Pulse animasyonu (risk alerts için)
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => pulse());
    };
    pulse();
  };

  const loadDashboardData = async () => {
    try {
      // Simulated data - gerçek API entegrasyonu yapılacak
      setStats({
        totalUsers: 15420,
        activeUsers: 892,
        liveCalls: 23,
        complaints: 7,
        revenue: 45230,
        riskScore: 3.2,
        // LUMI Specific Stats
        lumiIdsGenerated: 15420,
        verifiedUsers: 3240,
        vipUsers: 156,
        totalCoins: 2450000,
        giftsSent: 8920,
        subscriptions: {
          standard: 12000,
          gold: 3200,
          vip: 220,
        },
        ibanPayments: 45,
        robotModeration: {
          active: 23,
          warnings: 12,
          blocks: 3,
        },
      });

      setLiveCalls([
        {
          id: '1',
          roomName: 'Tech Talk #1',
          participants: 12,
          duration: '00:15:32',
          host: 'john_doe',
          mode: 'Panel',
        },
        {
          id: '2',
          roomName: 'Music Jam',
          participants: 8,
          duration: '00:08:45',
          host: 'music_lover',
          mode: 'Chat',
        },
      ]);

      setComplaints([
        {
          id: '1',
          user: 'user123',
          type: 'Harassment',
          priority: 'high',
          status: 'pending',
          timestamp: '2 min ago',
        },
        {
          id: '2',
          user: 'user456',
          type: 'Spam',
          priority: 'medium',
          status: 'reviewed',
          timestamp: '5 min ago',
        },
      ]);

      setRiskAlerts([
        { id: '1', type: 'Suspicious Activity', level: 'high', message: 'Multiple accounts from same IP' },
        { id: '2', type: 'Coin Anomaly', level: 'medium', message: 'Unusual coin transfer pattern' },
      ]);
    } catch (error) {
      console.error('Dashboard data load error:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="block" size={48} color={Colors.error} />
        <Text style={styles.errorText}>Access Denied</Text>
        <Text style={styles.errorSubtext}>You don&apos;t have admin privileges</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <View style={styles.headerLeft}>
          <MaterialIcons name="dashboard" size={28} color={Colors.primary} />
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <MaterialIcons name="refresh" size={20} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsButton}>
            <MaterialIcons name="settings" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Cards */}
        <Animated.View
          style={[
            styles.statsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <Text style={styles.sectionTitle}>Live Statistics</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Users"
              value={stats?.totalUsers || 0}
              icon="people"
              color="#3B82F6"
              trend="+12%"
            />
            <StatCard
              title="Active Now"
              value={stats?.activeUsers || 0}
              icon="online_prediction"
              color="#10B981"
              trend="+8%"
            />
            <StatCard
              title="Live Calls"
              value={stats?.liveCalls || 0}
              icon="videocam"
              color="#F59E0B"
              trend="+5%"
            />
            <StatCard
              title="Complaints"
              value={stats?.complaints || 0}
              icon="report"
              color="#EF4444"
              trend="-3%"
            />
            <StatCard
              title="Revenue"
              value={`$${stats?.revenue?.toLocaleString() || 0}`}
              icon="attach_money"
              color="#8B5CF6"
              trend="+15%"
            />
            <StatCard
              title="Risk Score"
              value={stats?.riskScore || 0}
              icon="security"
              color="#F97316"
              trend="+2%"
            />
          </View>
          
          {/* LUMI Specific Stats */}
          <Text style={styles.sectionTitle}>LUMI Özellikleri</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="LUMI-ID'ler"
              value={stats?.lumiIdsGenerated || 0}
              icon="badge"
              color="#6366F1"
              trend="+100%"
            />
            <StatCard
              title="Doğrulanmış"
              value={stats?.verifiedUsers || 0}
              icon="verified"
              color="#10B981"
              trend="+25%"
            />
            <StatCard
              title="VIP Kullanıcılar"
              value={stats?.vipUsers || 0}
              icon="star"
              color="#F59E0B"
              trend="+18%"
            />
            <StatCard
              title="Toplam Coin"
              value={stats?.totalCoins?.toLocaleString() || 0}
              icon="monetization_on"
              color="#8B5CF6"
              trend="+35%"
            />
            <StatCard
              title="Hediye Gönderildi"
              value={stats?.giftsSent || 0}
              icon="card_giftcard"
              color="#EC4899"
              trend="+42%"
            />
            <StatCard
              title="IBAN Ödemeleri"
              value={stats?.ibanPayments || 0}
              icon="account_balance"
              color="#06B6D4"
              trend="+8%"
            />
          </View>
          
          {/* Subscription Stats */}
          <Text style={styles.sectionTitle}>Abonelik İstatistikleri</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Standart"
              value={stats?.subscriptions?.standard || 0}
              icon="person"
              color="#6B7280"
              trend="+5%"
            />
            <StatCard
              title="Gold"
              value={stats?.subscriptions?.gold || 0}
              icon="workspace_premium"
              color="#FFD700"
              trend="+22%"
            />
            <StatCard
              title="VIP"
              value={stats?.subscriptions?.vip || 0}
              icon="diamond"
              color="#FF6B6B"
              trend="+15%"
            />
          </View>
          
          {/* Robot Moderation Stats */}
          <Text style={styles.sectionTitle}>Robot Moderasyon</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Aktif İzleme"
              value={stats?.robotModeration?.active || 0}
              icon="smart_toy"
              color="#3B82F6"
              trend="+12%"
            />
            <StatCard
              title="Uyarılar"
              value={stats?.robotModeration?.warnings || 0}
              icon="warning"
              color="#F59E0B"
              trend="-8%"
            />
            <StatCard
              title="Engellemeler"
              value={stats?.robotModeration?.blocks || 0}
              icon="block"
              color="#EF4444"
              trend="-15%"
            />
          </View>
        </Animated.View>

        {/* Risk Radar */}
        {riskAlerts.length > 0 && (
          <Animated.View
            style={[
              styles.riskRadar,
              {
                opacity: fadeAnim,
                transform: [{ scale: pulseAnim }],
              }
            ]}
          >
            <LinearGradient
              colors={['#FEF3C7', '#FDE68A']}
              style={styles.riskHeader}
            >
              <MaterialIcons name="warning" size={24} color="#D97706" />
              <Text style={styles.riskTitle}>Risk Radar</Text>
              <Animated.View style={[styles.riskBadge, { transform: [{ scale: pulseAnim }] }]}>
                <Text style={styles.riskBadgeText}>{riskAlerts.length}</Text>
              </Animated.View>
            </LinearGradient>
            <View style={styles.riskContent}>
              {riskAlerts.map((alert) => (
                <View key={alert.id} style={styles.riskItem}>
                  <View style={[
                    styles.riskIndicator,
                    { backgroundColor: alert.level === 'high' ? '#EF4444' : '#F59E0B' }
                  ]} />
                  <Text style={styles.riskMessage}>{alert.message}</Text>
                  <TouchableOpacity style={styles.riskAction}>
                    <MaterialIcons name="arrow-forward" size={16} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Live Calls */}
        <Animated.View
          style={[
            styles.liveCallsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Live Calls</Text>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All</Text>
              <MaterialIcons name="arrow-forward" size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          {liveCalls.map((call) => (
            <LiveCallCard key={call.id} call={call} />
          ))}
        </Animated.View>

        {/* Complaints Queue */}
        <Animated.View
          style={[
            styles.complaintsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Complaints Queue</Text>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All</Text>
              <MaterialIcons name="arrow-forward" size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          {complaints.map((complaint) => (
            <ComplaintCard key={complaint.id} complaint={complaint} />
          ))}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// Stat Card Component
function StatCard({ title, value, icon, color, trend }: any) {
  return (
    <View style={styles.statCard}>
      <LinearGradient
        colors={[`${color}20`, `${color}10`]}
        style={styles.statCardGradient}
      >
        <View style={styles.statCardHeader}>
          <MaterialIcons name={icon} size={24} color={color} />
          <Text style={[styles.trendText, { color: trend.startsWith('+') ? '#10B981' : '#EF4444' }]}>
            {trend}
          </Text>
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </LinearGradient>
    </View>
  );
}

// Live Call Card Component
function LiveCallCard({ call }: { call: LiveCall }) {
  return (
    <View style={styles.liveCallCard}>
      <View style={styles.liveCallHeader}>
        <View style={styles.liveIndicator} />
        <Text style={styles.liveCallTitle}>{call.roomName}</Text>
        <Text style={styles.liveCallMode}>{call.mode}</Text>
      </View>
      <View style={styles.liveCallDetails}>
        <View style={styles.liveCallDetail}>
          <MaterialIcons name="people" size={16} color={Colors.textMuted} />
          <Text style={styles.liveCallDetailText}>{call.participants} participants</Text>
        </View>
        <View style={styles.liveCallDetail}>
          <MaterialIcons name="schedule" size={16} color={Colors.textMuted} />
          <Text style={styles.liveCallDetailText}>{call.duration}</Text>
        </View>
        <View style={styles.liveCallDetail}>
          <MaterialIcons name="person" size={16} color={Colors.textMuted} />
          <Text style={styles.liveCallDetailText}>Host: {call.host}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.joinCallButton}>
        <MaterialIcons name="videocam" size={16} color="#FFFFFF" />
        <Text style={styles.joinCallText}>Join</Text>
      </TouchableOpacity>
    </View>
  );
}

// Complaint Card Component
function ComplaintCard({ complaint }: { complaint: Complaint }) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return Colors.textMuted;
    }
  };

  return (
    <View style={styles.complaintCard}>
      <View style={styles.complaintHeader}>
        <View style={styles.complaintLeft}>
          <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(complaint.priority) }]} />
          <Text style={styles.complaintUser}>{complaint.user}</Text>
        </View>
        <Text style={styles.complaintTimestamp}>{complaint.timestamp}</Text>
      </View>
      <Text style={styles.complaintType}>{complaint.type}</Text>
      <View style={styles.complaintActions}>
        <TouchableOpacity style={[styles.complaintAction, styles.reviewButton]}>
          <MaterialIcons name="visibility" size={16} color={Colors.primary} />
          <Text style={styles.complaintActionText}>Review</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.complaintAction, styles.resolveButton]}>
          <MaterialIcons name="check" size={16} color="#10B981" />
          <Text style={[styles.complaintActionText, { color: '#10B981' }]}>Resolve</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundColor,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundColor,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textMuted,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundColor,
    padding: 20,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  errorSubtext: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  statsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (width - 52) / 2,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statCardGradient: {
    padding: 16,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  riskRadar: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  riskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D97706',
    flex: 1,
  },
  riskBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  riskBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  riskContent: {
    padding: 16,
  },
  riskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  riskIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  riskMessage: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  riskAction: {
    padding: 4,
  },
  liveCallsContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  liveCallCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  liveCallHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  liveCallTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  liveCallMode: {
    fontSize: 12,
    color: Colors.primary,
    backgroundColor: Colors.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  liveCallDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  liveCallDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveCallDetailText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  joinCallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 4,
  },
  joinCallText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  complaintsContainer: {
    marginBottom: 24,
  },
  complaintCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  complaintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  complaintLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  complaintUser: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  complaintTimestamp: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  complaintType: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 12,
  },
  complaintActions: {
    flexDirection: 'row',
    gap: 8,
  },
  complaintAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  reviewButton: {
    backgroundColor: Colors.borderLight,
  },
  resolveButton: {
    backgroundColor: '#10B98120',
  },
  complaintActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.primary,
  },
});
