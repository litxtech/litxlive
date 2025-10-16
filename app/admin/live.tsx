import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Activity, Video, Users } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { trpc } from '@/lib/trpc';

type TabType = 'streams' | 'rooms' | 'quick_match';

export default function AdminLive() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('streams');

  const liveStatsQuery = trpc.admin.live.stats.useQuery(undefined, {
    refetchInterval: 5000,
  });
  const liveRoomsQuery = trpc.admin.live.rooms.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const stats = liveStatsQuery.data;
  const rooms = liveRoomsQuery.data?.rooms || [];

  const tabs: { key: TabType; label: string; icon: any }[] = [
    { key: 'streams', label: 'Streams', icon: Video },
    { key: 'rooms', label: 'Rooms', icon: Users },
    { key: 'quick_match', label: 'Quick Match', icon: Activity },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live & Calls</Text>
      </View>

      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.activeUsers}</Text>
            <Text style={styles.statLabel}>Active Users</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.activeRooms}</Text>
            <Text style={styles.statLabel}>Active Rooms</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.ongoingCalls}</Text>
            <Text style={styles.statLabel}>Ongoing Calls</Text>
          </View>
        </View>
      )}

      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Icon size={18} color={isActive ? '#FF4444' : '#666'} />
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView style={styles.scrollView}>
        {liveRoomsQuery.isLoading && (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color="#F04F8F" />
            <Text style={styles.emptyText}>Loading live data...</Text>
          </View>
        )}
        {rooms.length > 0 ? (
          <View style={styles.roomsContainer}>
            {rooms.map((room) => (
              <View key={room.id} style={styles.roomCard}>
                <View style={styles.roomHeader}>
                  <Video size={20} color="#FF4444" />
                  <Text style={styles.roomChannel}>{room.channelName}</Text>
                </View>
                <View style={styles.roomDetails}>
                  <Text style={styles.roomHost}>Host: {room.hostName}</Text>
                  <Text style={styles.roomGuest}>Guest: {room.guestName}</Text>
                  <Text style={styles.roomTime}>
                    Started: {new Date(room.createdAt).toLocaleTimeString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          !liveRoomsQuery.isLoading && (
            <View style={styles.emptyState}>
              <Activity size={48} color="#666" />
              <Text style={styles.emptyText}>No active rooms</Text>
              <Text style={styles.emptySubtext}>
                Live sessions will appear here
              </Text>
            </View>
          )
        )}
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
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingHorizontal: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    gap: 8,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#FF4444',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
  },
  tabTextActive: {
    color: '#FF4444',
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center' as const,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#F04F8F',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center' as const,
  },
  roomsContainer: {
    padding: 16,
  },
  roomCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  roomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  roomChannel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  roomDetails: {
    gap: 4,
  },
  roomHost: {
    fontSize: 14,
    color: '#2AD1FF',
  },
  roomGuest: {
    fontSize: 14,
    color: '#F04F8F',
  },
  roomTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});
