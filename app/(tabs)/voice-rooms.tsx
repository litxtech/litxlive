import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Video } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/providers/UserProvider';

interface LiveUser {
  id: string;
  user_id: string;
  name: string;
  country: string;
  avatar: string;
  isOnline: boolean;
}

export default function VoiceRoomsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const [users, setUsers] = useState<LiveUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlineCount, setOnlineCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, [user]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const selectRes = await supabase
        .from('profiles')
        .select('*')
        .limit(50);

      if (selectRes.error) {
        console.error('[VoiceRooms] Error loading users:', JSON.stringify(selectRes.error, null, 2));
        console.error('[VoiceRooms] Error details:', selectRes.error.message || selectRes.error.hint || 'Unknown error');
        setError(selectRes.error.message || 'Failed to load users');
        return;
      }

      const rows: any[] = Array.isArray(selectRes.data) ? selectRes.data : [];
      const formattedUsers: LiveUser[] = rows.map((profile: any) => {
        const displayName = profile.display_name ?? profile.displayName ?? 'User';
        const avatarUrl = profile.avatar_url ?? profile.avatar ?? '';
        const country = profile.country ?? 'Unknown';
        const uid: string = profile.id;
        return {
          id: String(profile.id ?? uid ?? Math.random().toString(36).slice(2)),
          user_id: String(uid ?? ''),
          name: String(displayName),
          country: String(country),
          avatar: avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&size=400`,
          isOnline: Boolean(profile.online_status ?? profile.isOnline ?? false),
        };
      });

      setUsers(formattedUsers);
      setOnlineCount(formattedUsers.filter(u => u.isOnline).length);
    } catch (error: any) {
      console.error('[VoiceRooms] Load users error:', error?.message || JSON.stringify(error));
      setError(error?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="voice-rooms-screen">
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Text style={styles.title}>insanlar</Text>
      </View>

      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Random Eşleştirme...</Text>
        <Text style={styles.statsSubtitle}>📊 {onlineCount.toLocaleString()} Çevrimiçi</Text>
        <TouchableOpacity style={styles.startButton}>
          <Text style={styles.startButtonText}>Başlangıç</Text>
        </TouchableOpacity>
        <Text style={styles.coinBadge}>💰 3/once</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9BFF64" />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      ) : error ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>⚠️</Text>
          <Text style={styles.errorTitle}>Bir sorun oluştu</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadUsers}>
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      ) : users.length === 0 ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyText}>👥</Text>
          <Text style={styles.emptyTitle}>Henüz kimse yok</Text>
          <Text style={styles.emptyMessage}>Profilini tamamla ve eşleşmeleri gör</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.scroll} 
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.grid}>
            {users.map((user) => (
            <TouchableOpacity key={user.id} style={styles.userCard} activeOpacity={0.9}>
              <Image source={{ uri: user.avatar }} style={styles.userImage} />
              
              <LinearGradient
                colors={['rgba(0,0,0,0.8)', 'transparent']}
                start={{ x: 0, y: 1 }}
                end={{ x: 0, y: 0 }}
                style={styles.userOverlay}
              >
                <View style={styles.userInfo}>
                  <View style={styles.onlineIndicator} />
                  <Text style={styles.userName}>{user.name}</Text>
                </View>
                
                <View style={styles.countryBadge}>
                  <Text style={styles.countryFlag}>🇹🇷</Text>
                  <Text style={styles.countryText}>{user.country}</Text>
                </View>
              </LinearGradient>

              <TouchableOpacity style={styles.videoButton} activeOpacity={0.8}>
                <Video color="#fff" size={24} fill="#fff" />
              </TouchableOpacity>
            </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0C',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  statsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(155, 255, 100, 0.15)',
    position: 'relative',
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statsSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 12,
  },
  startButton: {
    backgroundColor: '#1C1C1E',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignSelf: 'flex-start',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  coinBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  userCard: {
    width: '48%',
    aspectRatio: 0.75,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1C1C1E',
    position: 'relative',
  },
  userImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  userOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'transparent',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00D9FF',
    marginRight: 6,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  countryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  countryFlag: {
    fontSize: 14,
  },
  countryText: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  videoButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(155, 81, 224, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#9B51E0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  errorText: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  retryButton: {
    backgroundColor: '#9BFF64',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#0B0B0C',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  emptyText: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
