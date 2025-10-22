import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useUser } from '@/providers/UserProvider';
import { useLanguage } from '@/providers/LanguageProvider';

interface Room {
  id: string;
  title: string;
  description: string;
  host: {
    name: string;
    avatar: string;
  };
  participants: number;
  maxParticipants: number;
  mode: 'chat' | 'queue' | 'panel' | 'whisper' | 'radio';
  category: string;
  language: string;
  isLive: boolean;
  duration: number;
  mood: 'calm' | 'lively' | 'intense';
  tags: string[];
  isRecorded: boolean;
  isPrivate: boolean;
  password?: string;
}

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2;

// Modern mock data with party categories
const mockRooms: Room[] = [
  {
    id: '1',
    title: '🎉 Gece Partisi - Canlı Müzik',
    description: 'En sevilen şarkılar eşliğinde dans edelim!',
    host: {
      name: 'DJ Alex',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    },
    participants: 45,
    maxParticipants: 100,
    mode: 'radio',
    category: 'Parti',
    language: 'TR',
    isLive: true,
    duration: 120,
    mood: 'intense',
    tags: ['parti', 'müzik', 'dans'],
    isRecorded: true,
    isPrivate: false,
  },
  {
    id: '2',
    title: '💻 Tech Talk - AI & Future',
    description: 'Yapay zeka ve gelecek teknolojileri hakkında sohbet',
    host: {
      name: 'Tech Guru',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
    },
    participants: 18,
    maxParticipants: 50,
    mode: 'panel',
    category: 'Teknoloji',
    language: 'TR',
    isLive: true,
    duration: 60,
    mood: 'calm',
    tags: ['AI', 'teknoloji', 'gelecek'],
    isRecorded: false,
    isPrivate: false,
  },
  {
    id: '3',
    title: '🎨 Sanat & Kültür Sohbeti',
    description: 'Modern sanat ve kültür üzerine derinlemesine konuşma',
    host: {
      name: 'Art Lover',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    },
    participants: 32,
    maxParticipants: 80,
    mode: 'chat',
    category: 'Sanat',
    language: 'TR',
    isLive: true,
    duration: 90,
    mood: 'lively',
    tags: ['sanat', 'kültür', 'yaratıcılık'],
    isRecorded: false,
    isPrivate: false,
  },
  {
    id: '4',
    title: '🎮 Gaming Night',
    description: 'Oyun severler bir araya geliyor! Hangi oyunları oynuyorsunuz?',
    host: {
      name: 'Game Master',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
    },
    participants: 67,
    maxParticipants: 150,
    mode: 'chat',
    category: 'Oyun',
    language: 'TR',
    isLive: true,
    duration: 180,
    mood: 'intense',
    tags: ['oyun', 'gaming', 'eğlence'],
    isRecorded: true,
    isPrivate: false,
  },
  {
    id: '5',
    title: '📚 Kitap Kulübü',
    description: 'Bu ayın kitabı: "Sapiens" - Yuval Noah Harari',
    host: {
      name: 'Book Worm',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    },
    participants: 23,
    maxParticipants: 40,
    mode: 'panel',
    category: 'Eğitim',
    language: 'TR',
    isLive: true,
    duration: 75,
    mood: 'calm',
    tags: ['kitap', 'okuma', 'öğrenme'],
    isRecorded: false,
    isPrivate: false,
  },
  {
    id: '6',
    title: '🍕 Yemek & Tarif Paylaşımı',
    description: 'En sevdiğiniz tarifleri paylaşın, yeni lezzetler keşfedin!',
    host: {
      name: 'Chef Master',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
    },
    participants: 41,
    maxParticipants: 60,
    mode: 'chat',
    category: 'Yemek',
    language: 'TR',
    isLive: true,
    duration: 45,
    mood: 'lively',
    tags: ['yemek', 'tarif', 'lezzet'],
    isRecorded: false,
    isPrivate: false,
  },
];

const getMoodColor = (mood: string) => {
  switch (mood) {
    case 'calm': return '#10B981';
    case 'lively': return '#F59E0B';
    case 'intense': return '#EF4444';
    default: return '#6B7280';
  }
};

const getMoodText = (mood: string) => {
  switch (mood) {
    case 'calm': return 'Sakin';
    case 'lively': return 'Hareketli';
    case 'intense': return 'Hararetli';
    default: return 'Bilinmiyor';
  }
};

const getModeIcon = (mode: string) => {
  switch (mode) {
    case 'chat': return 'chat';
    case 'queue': return 'queue';
    case 'panel': return 'group';
    case 'whisper': return 'hearing';
    case 'radio': return 'radio';
    default: return 'mic';
  }
};

export default function RoomsScreen() {
  const { user } = useUser();
  const { t } = useLanguage();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    // Simulate API call
    setRooms(mockRooms);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRooms();
    setRefreshing(false);
  };

  const handleJoinRoom = (room: Room) => {
    console.log('Joining room:', room);
    // Navigate to room
  };

  const categories = [
    { id: 'all', name: 'Tümü', icon: 'apps', emoji: '🌟' },
    { id: 'Parti', name: 'Parti', icon: 'celebration', emoji: '🎉' },
    { id: 'Teknoloji', name: 'Tech', icon: 'computer', emoji: '💻' },
    { id: 'Sanat', name: 'Sanat', icon: 'palette', emoji: '🎨' },
    { id: 'Oyun', name: 'Oyun', icon: 'sports-esports', emoji: '🎮' },
    { id: 'Eğitim', name: 'Eğitim', icon: 'school', emoji: '📚' },
    { id: 'Yemek', name: 'Yemek', icon: 'restaurant', emoji: '🍕' },
    { id: 'Müzik', name: 'Müzik', icon: 'music-note', emoji: '🎵' },
  ];

  const filteredRooms = selectedCategory === 'all' 
    ? rooms 
    : rooms.filter(room => room.category === selectedCategory);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ses Odaları</Text>
        <TouchableOpacity style={styles.createButton}>
          <MaterialIcons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Category Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
        contentContainerStyle={styles.categoryContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              selectedCategory === category.id && styles.categoryButtonActive
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <MaterialIcons 
              name={category.icon as any} 
              size={20} 
              color={selectedCategory === category.id ? '#FFFFFF' : Colors.textMuted} 
            />
            <Text style={[
              styles.categoryText,
              selectedCategory === category.id && styles.categoryTextActive
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Rooms Grid */}
      <ScrollView
        style={styles.roomsContainer}
        contentContainerStyle={styles.roomsContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.roomsGrid}>
          {filteredRooms.map((room) => (
            <TouchableOpacity
              key={room.id}
              style={styles.roomCard}
              onPress={() => handleJoinRoom(room)}
              activeOpacity={0.8}
            >
              {/* Room Header */}
              <View style={styles.roomHeader}>
                <View style={styles.roomInfo}>
                  <Text style={styles.roomTitle} numberOfLines={2}>
                    {room.title}
                  </Text>
                  <Text style={styles.roomDescription} numberOfLines={2}>
                    {room.description}
                  </Text>
                </View>
                <View style={styles.roomStatus}>
                  {room.isLive && (
                    <View style={styles.liveIndicator}>
                      <View style={styles.liveDot} />
                      <Text style={styles.liveText}>CANLI</Text>
                    </View>
                  )}
                  {room.isRecorded && (
                    <MaterialIcons name="fiber-manual-record" size={16} color="#EF4444" />
                  )}
                </View>
              </View>

              {/* Host Info */}
              <View style={styles.hostInfo}>
                <Image source={{ uri: room.host.avatar }} style={styles.hostAvatar} />
                <Text style={styles.hostName}>{room.host.name}</Text>
                <View style={styles.roomMode}>
                  <MaterialIcons 
                    name={getModeIcon(room.mode) as any} 
                    size={16} 
                    color={Colors.primary} 
                  />
                </View>
              </View>

              {/* Room Stats */}
              <View style={styles.roomStats}>
                <View style={styles.statItem}>
                  <MaterialIcons name="people" size={16} color={Colors.textMuted} />
                  <Text style={styles.statText}>
                    {room.participants}/{room.maxParticipants}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <MaterialIcons name="schedule" size={16} color={Colors.textMuted} />
                  <Text style={styles.statText}>{room.duration} dk</Text>
                </View>
                <View style={styles.statItem}>
                  <View 
                    style={[
                      styles.moodIndicator, 
                      { backgroundColor: getMoodColor(room.mood) }
                    ]} 
                  />
                  <Text style={styles.statText}>
                    {getMoodText(room.mood)}
                  </Text>
                </View>
              </View>

              {/* Tags */}
              <View style={styles.tagsContainer}>
                {room.tags.slice(0, 3).map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </View>
                ))}
              </View>

              {/* Join Button */}
              <LinearGradient
                colors={Colors.gradients.primary}
                style={styles.joinButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <MaterialIcons name="mic" size={20} color="#FFFFFF" />
                <Text style={styles.joinButtonText}>Katıl</Text>
              </LinearGradient>
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
    backgroundColor: Colors.backgroundColor,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryContainer: {
    marginBottom: 20,
  },
  categoryContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.borderLight,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  categoryButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  roomsContainer: {
    flex: 1,
  },
  roomsContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  roomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  roomCard: {
    width: cardWidth,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  roomHeader: {
    marginBottom: 12,
  },
  roomInfo: {
    flex: 1,
  },
  roomTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
    lineHeight: 20,
  },
  roomDescription: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  roomStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#EF4444',
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  hostAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  hostName: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text,
    flex: 1,
  },
  roomMode: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  moodIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: Colors.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
