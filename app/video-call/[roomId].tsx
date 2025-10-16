import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Gift,
  MessageCircle,
} from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useUser } from '@/providers/UserProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { VIDEO_CALL_RATE } from '@/constants/gifts';
import GiftModal from '@/components/GiftModal';
import { lumiService } from '@/services/lumiService';
import { agoraService } from '@/services/agoraService';
import { joinVideoRoom } from '@/services/matchService';

export default function VideoCallRoom() {
  const { roomId } = useLocalSearchParams();
  const { user, updateCoins } = useUser();
  const { t } = useLanguage();
  
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string>('');
  const [showAiCoach, setShowAiCoach] = useState(false);
  const [agoraToken, setAgoraToken] = useState<string | null>(null);
  const [agoraError, setAgoraError] = useState<string | null>(null);

  useEffect(() => {
    lumiService.setContext('video-call');
    initializeAgoraCall();

    return () => {
      agoraService.leaveChannel();
    };
  }, []);

  const initializeAgoraCall = async () => {
    try {
      console.log('[VideoCall] Initializing Agora...', { roomId, userId: user?.id });
      
      if (!roomId || !user?.id) {
        setAgoraError('Missing room or user information');
        return;
      }

      const channelName = String(roomId);
      const uid = parseInt(user.id.replace(/-/g, '').substring(0, 8), 16);

      console.log('[VideoCall] Getting token:', { channelName, uid });

      const videoConfig = await joinVideoRoom({ roomId: channelName });

      if (videoConfig.token) {
        console.log('[VideoCall] Token received successfully');
        setAgoraToken(videoConfig.token);
        setIsConnected(true);
      } else {
        console.error('[VideoCall] Failed to get token');
        setAgoraError('Failed to initialize call');
        Alert.alert('Connection Error', 'Failed to initialize call');
      }
    } catch (error: any) {
      console.error('[VideoCall] Initialize error:', error);
      setAgoraError(error.message || 'Failed to initialize call');
      Alert.alert('Error', error.message || 'Failed to initialize call');
    }
  };

  useEffect(() => {
    if (isConnected && callDuration === 10) {
      lumiService.getIcebreaker()
        .then(suggestion => {
          setAiSuggestion(suggestion);
          setShowAiCoach(true);
          setTimeout(() => setShowAiCoach(false), 8000);
        })
        .catch(() => {});
    }
  }, [isConnected, callDuration]);

  useEffect(() => {
    if (isConnected) {
      const timer = setInterval(() => {
        setCallDuration(prev => {
          const newDuration = prev + 1;
          
          // Deduct coins every minute
          if (newDuration % 60 === 0) {
            const currentCoins = user?.coins || 0;
            if (currentCoins >= VIDEO_CALL_RATE) {
              updateCoins(-VIDEO_CALL_RATE);
            } else {
              // End call if no coins
              handleEndCall();
              return prev;
            }
          }
          
          return newDuration;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isConnected, user?.coins, updateCoins]);

  const handleEndCall = () => {
    Alert.alert(
      t('endCall'),
      'Are you sure you want to end the call?',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('endCall'),
          style: 'destructive',
          onPress: () => {
            router.replace('/(tabs)/home');
          },
        },
      ]
    );
  };

  const toggleMute = async () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    await agoraService.muteLocalAudio(newMuted);
  };

  const toggleVideo = async () => {
    const newVideoOff = !isVideoOff;
    setIsVideoOff(newVideoOff);
    await agoraService.muteLocalVideo(newVideoOff);
  };

  const openGifts = () => {
    setShowGiftModal(true);
  };

  const handleSendGift = (gift: any) => {
    console.log('Gift sent:', gift);
    // Here you would send the gift to the partner via websocket/API
  };

  const openChat = () => {
    console.log('Open chat');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const remainingMinutes = user ? Math.floor(user.coins / VIDEO_CALL_RATE) : 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#111315', '#1a1a1a']}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Status Bar */}
          <View style={styles.statusBar}>
            <View style={styles.statusLeft}>
              <View style={[styles.statusDot, { backgroundColor: isConnected ? '#10B981' : '#F59E0B' }]} />
              <Text style={styles.statusText}>
                {isConnected ? t('connecting') : 'Connected'}
              </Text>
            </View>
            <Text style={styles.duration}>{formatTime(callDuration)}</Text>
          </View>

          {/* Video Area */}
          <View style={styles.videoContainer}>
            {!isConnected ? (
              <View style={styles.connectingView}>
                <Text style={styles.connectingText}>{t('connecting')}</Text>
              </View>
            ) : (
              <>
                {/* Partner Video (Main) */}
                <View style={styles.partnerVideo}>
                  <LinearGradient
                    colors={['#333', '#555']}
                    style={styles.videoPlaceholder}
                  >
                    <Text style={styles.videoPlaceholderText}>Partner Video</Text>
                  </LinearGradient>
                </View>

                {/* Self Video (PiP) */}
                <View style={styles.selfVideo}>
                  <LinearGradient
                    colors={['#222', '#444']}
                    style={styles.selfVideoContainer}
                  >
                    {isVideoOff ? (
                      <VideoOff color="white" size={24} />
                    ) : (
                      <Text style={styles.selfVideoText}>You</Text>
                    )}
                  </LinearGradient>
                </View>
              </>
            )}
          </View>

          {/* AI Coach Suggestion */}
          {showAiCoach && aiSuggestion && (
            <View style={styles.aiCoachCard}>
              <Text style={styles.aiCoachTitle}>✨ Lumi suggests:</Text>
              <Text style={styles.aiCoachText}>{aiSuggestion}</Text>
            </View>
          )}

          {/* Coin Info */}
          <View style={styles.coinInfo}>
            <Text style={styles.coinText}>
              {user?.coins || 0} coins • {remainingMinutes} min remaining
            </Text>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.controlButton, isMuted && styles.controlButtonActive]}
              onPress={toggleMute}
            >
              {isMuted ? (
                <MicOff color="white" size={24} />
              ) : (
                <Mic color="white" size={24} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, isVideoOff && styles.controlButtonActive]}
              onPress={toggleVideo}
            >
              {isVideoOff ? (
                <VideoOff color="white" size={24} />
              ) : (
                <Video color="white" size={24} />
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlButton} onPress={openGifts}>
              <Gift color="white" size={24} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlButton} onPress={openChat}>
              <MessageCircle color="white" size={24} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.endCallButton} onPress={handleEndCall}>
              <PhoneOff color="white" size={24} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
      
      {/* Gift Modal */}
      <GiftModal
        visible={showGiftModal}
        onClose={() => setShowGiftModal(false)}
        recipientName="Partner"
        onSendGift={handleSendGift}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
  duration: {
    fontSize: 16,
    color: '#F04F8F',
    fontWeight: '600',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  connectingView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectingText: {
    fontSize: 18,
    color: 'white',
    fontWeight: '500',
  },
  partnerVideo: {
    flex: 1,
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  videoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlaceholderText: {
    fontSize: 16,
    color: 'white',
    opacity: 0.7,
  },
  selfVideo: {
    position: 'absolute',
    top: 32,
    right: 32,
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
  },
  selfVideoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selfVideoText: {
    fontSize: 12,
    color: 'white',
    opacity: 0.7,
  },
  coinInfo: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  coinText: {
    fontSize: 14,
    color: '#888',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 16,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonActive: {
    backgroundColor: '#F04F8F',
  },
  endCallButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiCoachCard: {
    backgroundColor: 'rgba(155, 81, 224, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#9B51E0',
  },
  aiCoachTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#9B51E0',
    marginBottom: 6,
  },
  aiCoachText: {
    fontSize: 14,
    color: 'white',
    lineHeight: 20,
  },
});
