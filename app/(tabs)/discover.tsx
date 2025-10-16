import React, { useRef, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Text,
  Dimensions,
  FlatList,
  ViewToken,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, MessageCircle, Video, Search, Mic, Phone } from "lucide-react-native";
import { Colors } from "@/constants/colors";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/providers/UserProvider";
import { mockUsers } from "@/mocks/users";

interface ReelUser {
  id: string;
  user_id: string;
  name: string;
  avatar: string;
  mediaUrl: string;
  isVideo: boolean;
  online_status?: boolean;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const [reels, setReels] = useState<ReelUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
        .limit(40);

      let rows: any[] = [];

      if (selectRes.error) {
        console.log('[Discover] Using mock users due to error:', selectRes.error.message);
        rows = mockUsers;
      } else {
        rows = Array.isArray(selectRes.data) && selectRes.data.length > 0 ? selectRes.data : mockUsers;
      }

      const formattedReels: ReelUser[] = rows.map((profile: any) => {
        const displayName = profile.display_name ?? profile.displayName ?? 'User';
        const avatarUrl = profile.avatar_url ?? profile.avatar ?? '';
        const userId: string = profile.id ?? profile.user_id;
        return {
          id: String(profile.id ?? userId ?? Math.random().toString(36).slice(2)),
          user_id: String(userId ?? ''),
          name: String(displayName),
          avatar: avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&size=200`,
          mediaUrl: avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&size=1080`,
          isVideo: false,
          online_status: Boolean(profile.online_status ?? profile.isOnline ?? false),
        };
      });
      setReels(formattedReels);
    } catch (error: any) {
      console.log('[Discover] Using mock users due to error:', error?.message);
      const formattedReels: ReelUser[] = mockUsers.map((profile: any) => {
        const displayName = profile.display_name ?? profile.displayName ?? 'User';
        const avatarUrl = profile.avatar_url ?? profile.avatar ?? '';
        const userId: string = profile.id ?? profile.user_id;
        return {
          id: String(profile.id ?? userId ?? Math.random().toString(36).slice(2)),
          user_id: String(userId ?? ''),
          name: String(displayName),
          avatar: avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&size=200`,
          mediaUrl: avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&size=1080`,
          isVideo: false,
          online_status: Boolean(profile.online_status ?? profile.isOnline ?? false),
        };
      });
      setReels(formattedReels);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // TODO: Implement search functionality
    console.log('Search query:', query);
  };

  const handleVoiceSearch = () => {
    // TODO: Implement voice search functionality
    console.log('Voice search activated');
  };

  const handleVideoCall = (userId: string) => {
    // TODO: Implement video call functionality
    console.log('Video call with user:', userId);
  };

  const handleVoiceCall = (userId: string) => {
    // TODO: Implement voice call functionality
    console.log('Voice call with user:', userId);
  };

  const handleMessage = (userId: string) => {
    // TODO: Implement message functionality
    console.log('Message user:', userId);
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      console.log('Active reel:', viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderItem = ({ item }: { item: ReelUser }) => (
    <View style={[styles.reelContainer, { height: SCREEN_HEIGHT }]}>
      <Image source={{ uri: item.mediaUrl }} style={styles.reelImage} />
      
      <View style={[styles.topGradient, { paddingTop: insets.top }]} />
      <LinearGradient
        colors={['rgba(0,0,0,0.8)', 'transparent']}
        start={{ x: 0, y: 1 }}
        end={{ x: 0, y: 0 }}
        style={styles.bottomGradient}
      />

      <View style={[styles.userInfoContainer, { bottom: insets.bottom + 80 }]}>
        <TouchableOpacity style={styles.userProfile} activeOpacity={0.9}>
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
          <View style={styles.addBadge}>
            <Text style={styles.addBadgeText}>+</Text>
          </View>
        </TouchableOpacity>
        
        <View style={styles.userNameContainer}>
          <View style={styles.onlineIndicator} />
          <Text style={styles.userName}>{item.name}</Text>
        </View>
      </View>

      <View style={[styles.actionsContainer, { bottom: insets.bottom + 80 }]}>
        <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
          <Heart color="#FFFFFF" size={32} fill="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton} 
          activeOpacity={0.8}
          onPress={() => handleMessage(item.user_id)}
        >
          <MessageCircle color="#FFFFFF" size={32} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton} 
          activeOpacity={0.8}
          onPress={() => handleVideoCall(item.user_id)}
        >
          <Video color="#FFFFFF" size={32} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton} 
          activeOpacity={0.8}
          onPress={() => handleVoiceCall(item.user_id)}
        >
          <Phone color="#FFFFFF" size={32} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading profiles...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.emptyText}>Something went wrong</Text>
        <Text style={styles.emptySubtext}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadUsers}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (reels.length === 0) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.errorEmoji}>👥</Text>
        <Text style={styles.emptyText}>No profiles available</Text>
        <Text style={styles.emptySubtext}>Complete your profile to see matches</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="discover-screen">
      {/* Header with Search */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.searchContainer}>
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={() => setShowSearch(!showSearch)}
          >
            <Search size={20} color={Colors.text} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.voiceButton}
            onPress={handleVoiceSearch}
          >
            <Mic size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      {showSearch && (
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Kullanıcı ara..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={handleSearch}
            autoFocus
          />
        </View>
      )}

      <FlatList
        data={reels}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        removeClippedSubviews
        maxToRenderPerBatch={2}
        windowSize={3}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  reelContainer: {
    width: '100%',
    position: 'relative',
  },
  reelImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'transparent',
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: 'transparent',
  },
  userInfoContainer: {
    position: 'absolute',
    left: 16,
  },
  userProfile: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  addBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  addBadgeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700' as const,
    lineHeight: 18,
  },
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00FF88',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  actionsContainer: {
    position: 'absolute',
    right: 16,
    gap: 24,
    alignItems: 'center',
  },
  actionButton: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreButton: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  moreDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    color: Colors.text,
    fontSize: 16,
    padding: 0,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  emptyText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
