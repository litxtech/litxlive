import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

interface User {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string;
  country: string;
  gender: string;
  online_status: boolean;
  is_live: boolean;
}

interface UserGridProps {
  onUserPress?: (user: User) => void;
}

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2; // 2 columns with padding

// Mock data - in real app, this would come from API
const mockUsers: User[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    display_name: 'Ayla',
    username: 'ayla_turkish',
    avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
    country: 'TR',
    gender: 'female',
    online_status: true,
    is_live: true,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    display_name: 'leyna ❤️',
    username: 'leyna_heart',
    avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
    country: 'TR',
    gender: 'female',
    online_status: true,
    is_live: true,
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    display_name: 'Hel 🪭',
    username: 'hel_fan',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
    country: 'TR',
    gender: 'female',
    online_status: true,
    is_live: false,
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    display_name: 'GizemX 💋',
    username: 'gizemx_kiss',
    avatar_url: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=400&fit=crop&crop=face',
    country: 'TR',
    gender: 'female',
    online_status: true,
    is_live: true,
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    display_name: 'Maria',
    username: 'maria_ph',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face',
    country: 'PH',
    gender: 'female',
    online_status: true,
    is_live: false,
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    display_name: 'Carlos',
    username: 'carlos_ve',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
    country: 'VE',
    gender: 'male',
    online_status: true,
    is_live: false,
  },
];

const getCountryFlag = (countryCode: string) => {
  const flags: { [key: string]: string } = {
    'TR': '🇹🇷',
    'PH': '🇵🇭',
    'VE': '🇻🇪',
    'CO': '🇨🇴',
    'BR': '🇧🇷',
    'PK': '🇵🇰',
    'VN': '🇻🇳',
    'EG': '🇪🇬',
    'SY': '🇸🇾',
    'MY': '🇲🇾',
    'IN': '🇮🇳',
  };
  return flags[countryCode] || '🌍';
};

export default function UserGrid({ onUserPress }: UserGridProps) {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    // Simulate loading users
    setUsers(mockUsers);
  }, []);

  const handleUserPress = (user: User) => {
    if (onUserPress) {
      onUserPress(user);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.grid}>
          {users.map((user) => (
            <TouchableOpacity
              key={user.id}
              style={styles.userCard}
              onPress={() => handleUserPress(user)}
              activeOpacity={0.8}
            >
              <View style={styles.avatarContainer}>
                <Image
                  source={{ uri: user.avatar_url }}
                  style={styles.avatar}
                  resizeMode="cover"
                />
                {user.online_status && (
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: user.is_live ? '#FF6B6B' : '#10B981' }
                  ]} />
                )}
                {user.is_live && (
                  <View style={styles.liveIndicator}>
                    <Text style={styles.liveText}>LIVE</Text>
                  </View>
                )}
                <View style={styles.videoIcon}>
                  <MaterialIcons name="videocam" size={16} color="#FFFFFF" />
                </View>
              </View>
              
              <View style={styles.userInfo}>
                <Text style={styles.userName} numberOfLines={1}>
                  {user.display_name}
                </Text>
                <View style={styles.countryContainer}>
                  <Text style={styles.countryFlag}>
                    {getCountryFlag(user.country)}
                  </Text>
                  <Text style={styles.countryName}>
                    {user.country === 'TR' ? 'Turkey' : 
                     user.country === 'PH' ? 'Philippines' :
                     user.country === 'VE' ? 'Venezuela' :
                     user.country === 'CO' ? 'Colombia' :
                     user.country === 'BR' ? 'Brazil' :
                     user.country === 'PK' ? 'Pakistan' :
                     user.country === 'VN' ? 'Vietnam' :
                     user.country === 'EG' ? 'Egypt' :
                     user.country === 'SY' ? 'Syria' :
                     user.country === 'MY' ? 'Malaysia' :
                     user.country === 'IN' ? 'India' : user.country}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  userCard: {
    width: cardWidth,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    height: cardWidth * 1.2,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  statusDot: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  liveIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  videoIcon: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    padding: 12,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  countryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  countryFlag: {
    fontSize: 12,
  },
  countryName: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
});
