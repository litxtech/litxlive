import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useUser } from '@/providers/UserProvider';
import { useLocalSearchParams, router } from 'expo-router';

interface Participant {
  id: string;
  name: string;
  avatar: string;
  role: 'host' | 'speaker' | 'listener' | 'stagehand';
  isSpeaking: boolean;
  isMuted: boolean;
  hasHandRaised: boolean;
  joinTime: Date;
}

interface Room {
  id: string;
  title: string;
  description: string;
  mode: 'chat' | 'queue' | 'panel' | 'whisper' | 'radio';
  participants: Participant[];
  isRecorded: boolean;
  isPrivate: boolean;
  host: Participant;
}

const { width, height } = Dimensions.get('window');

export default function RoomScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useUser();
  const [room, setRoom] = useState<Room | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    loadRoom();
  }, [id]);

  const loadRoom = async () => {
    // Mock room data
    const mockRoom: Room = {
      id: id as string,
      title: 'Kısa Kısa Gündem: 20 Dakika',
      description: 'Söz almak için el kaldır, sıra sana gelince mikrofon otomatik açılır.',
      mode: 'queue',
      isRecorded: true,
      isPrivate: false,
      host: {
        id: '1',
        name: 'Ahmet Yılmaz',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
        role: 'host',
        isSpeaking: false,
        isMuted: false,
        hasHandRaised: false,
        joinTime: new Date(),
      },
      participants: [
        {
          id: '1',
          name: 'Ahmet Yılmaz',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
          role: 'host',
          isSpeaking: false,
          isMuted: false,
          hasHandRaised: false,
          joinTime: new Date(),
        },
        {
          id: '2',
          name: 'Elif Kaya',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
          role: 'speaker',
          isSpeaking: true,
          isMuted: false,
          hasHandRaised: false,
          joinTime: new Date(),
        },
        {
          id: '3',
          name: 'Can Özkan',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
          role: 'listener',
          isSpeaking: false,
          isMuted: true,
          hasHandRaised: true,
          joinTime: new Date(),
        },
      ],
    };
    setRoom(mockRoom);
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
  };

  const handleHandRaise = () => {
    setIsHandRaised(!isHandRaised);
  };

  const handleLeaveRoom = () => {
    Alert.alert(
      'Odadan Ayrıl',
      'Odadan ayrılmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Ayrıl', style: 'destructive', onPress: () => router.back() },
      ]
    );
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'host': return 'star';
      case 'speaker': return 'mic';
      case 'listener': return 'hearing';
      case 'stagehand': return 'build';
      default: return 'person';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'host': return '#FFD700';
      case 'speaker': return Colors.primary;
      case 'listener': return Colors.textMuted;
      case 'stagehand': return '#10B981';
      default: return Colors.textMuted;
    }
  };

  if (!room) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Oda yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleLeaveRoom} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.roomTitle} numberOfLines={1}>
            {room.title}
          </Text>
          <Text style={styles.participantCount}>
            {room.participants.length} katılımcı
          </Text>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <MaterialIcons name="more-vert" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Room Description */}
      <View style={styles.descriptionContainer}>
        <Text style={styles.description}>{room.description}</Text>
        {room.isRecorded && (
          <View style={styles.recordedIndicator}>
            <MaterialIcons name="fiber-manual-record" size={16} color="#EF4444" />
            <Text style={styles.recordedText}>Kaydediliyor</Text>
          </View>
        )}
      </View>

      {/* Participants Grid */}
      <ScrollView style={styles.participantsContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.participantsGrid}>
          {room.participants.map((participant) => (
            <View key={participant.id} style={styles.participantCard}>
              <View style={styles.participantAvatar}>
                <Image source={{ uri: participant.avatar }} style={styles.avatar} />
                {participant.isSpeaking && (
                  <View style={styles.speakingIndicator}>
                    <View style={styles.speakingRing} />
                  </View>
                )}
                {participant.hasHandRaised && (
                  <View style={styles.handRaisedIndicator}>
                    <MaterialIcons name="pan-tool" size={16} color="#FFFFFF" />
                  </View>
                )}
              </View>
              <Text style={styles.participantName} numberOfLines={1}>
                {participant.name}
              </Text>
              <View style={styles.participantRole}>
                <MaterialIcons 
                  name={getRoleIcon(participant.role) as any} 
                  size={12} 
                  color={getRoleColor(participant.role)} 
                />
                <Text style={[styles.roleText, { color: getRoleColor(participant.role) }]}>
                  {participant.role === 'host' ? 'Host' :
                   participant.role === 'speaker' ? 'Konuşmacı' :
                   participant.role === 'listener' ? 'Dinleyici' :
                   participant.role === 'stagehand' ? 'Yardımcı' : 'Katılımcı'}
                </Text>
              </View>
              {participant.isMuted && (
                <View style={styles.mutedIndicator}>
                  <MaterialIcons name="mic-off" size={12} color="#EF4444" />
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.controls}>
          {/* Mute Button */}
          <TouchableOpacity
            style={[styles.controlButton, isMuted && styles.controlButtonActive]}
            onPress={handleMuteToggle}
          >
            <MaterialIcons 
              name={isMuted ? "mic-off" : "mic"} 
              size={24} 
              color={isMuted ? "#EF4444" : "#FFFFFF"} 
            />
          </TouchableOpacity>

          {/* Hand Raise Button */}
          <TouchableOpacity
            style={[styles.controlButton, isHandRaised && styles.controlButtonActive]}
            onPress={handleHandRaise}
          >
            <MaterialIcons 
              name="pan-tool" 
              size={24} 
              color={isHandRaised ? "#10B981" : "#FFFFFF"} 
            />
          </TouchableOpacity>

          {/* Reactions */}
          <TouchableOpacity style={styles.controlButton}>
            <MaterialIcons name="emoji-emotions" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Poll */}
          <TouchableOpacity style={styles.controlButton}>
            <MaterialIcons name="poll" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Whisper */}
          <TouchableOpacity style={styles.controlButton}>
            <MaterialIcons name="hearing" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Share */}
          <TouchableOpacity style={styles.controlButton}>
            <MaterialIcons name="share" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Settings */}
          <TouchableOpacity style={styles.controlButton}>
            <MaterialIcons name="settings" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundColor,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  roomTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  participantCount: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  descriptionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  description: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  recordedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recordedText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
  },
  participantsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  participantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  participantCard: {
    width: (width - 60) / 3,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  participantAvatar: {
    position: 'relative',
    marginBottom: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  speakingIndicator: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  speakingRing: {
    flex: 1,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: Colors.primary,
    opacity: 0.3,
  },
  handRaisedIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  participantName: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  participantRole: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '500',
  },
  mutedIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  controlsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  controlButtonActive: {
    backgroundColor: '#10B981',
  },
});
