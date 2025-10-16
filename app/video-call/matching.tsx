import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Users, Heart, Zap, AlertCircle, PhoneOff, Mic, MicOff, Video, VideoOff, Gift, MessageCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import { useUser } from '@/providers/UserProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { MIN_COINS_FOR_CALL, VIDEO_CALL_RATE } from '@/constants/gifts';
import { presenceService } from '@/services/presenceService';
import { roomService } from '@/services/roomService';
import { agoraService } from '@/services/agoraService';
import { lumiService } from '@/services/lumiService';
import { startMatch, joinVideoRoom } from '@/services/matchService';
import GiftModal from '@/components/GiftModal';

const { width } = Dimensions.get('window');

type CallState = 'idle' | 'searching' | 'connected';

export default function MatchingScreen() {
  const { user, updateCoins } = useUser();
  const { t, currentLanguage } = useLanguage();
  const [callState, setCallState] = useState<CallState>('idle');
  const [searchTime, setSearchTime] = useState(0);
  const [callDuration, setCallDuration] = useState(0);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [rotateAnim] = useState(new Animated.Value(0));
  const [error, setError] = useState<string | null>(null);
  const [matchCheckInterval, setMatchCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string>('');
  const [showAiCoach, setShowAiCoach] = useState(false);

  const checkForMatch = useCallback(async () => {
    if (!user) return;

    try {
      const userLang = currentLanguage || 'en';
      const userTags = user.languages || ['general'];

      const result = await presenceService.findMatch(user.id, userLang, userTags);

      if (result.success && result.match) {
        console.log('[Matching] Match found!', result.match);
        
        await presenceService.leaveMatchQueue(user.id);
        await presenceService.leaveMatchQueue(result.match.user_id);

        const roomResult = await roomService.createRoom(user.id, result.match.user_id, 60);

        if (roomResult.success && roomResult.room) {
          await presenceService.updatePresence(user.id, { in_call: true });
          await presenceService.updatePresence(result.match.user_id, { in_call: true });

          setActiveRoomId(roomResult.room.room_id);
          await initializeVideoCall(roomResult.room.room_id);
        } else {
          throw new Error(roomResult.error || 'Failed to create room');
        }
      }
    } catch (error) {
      console.error('[Matching] Check match error:', error);
      setError(error instanceof Error ? error.message : 'Failed to find match');
    }
  }, [user, currentLanguage]);

  const initializeVideoCall = async (roomId: string) => {
    try {
      console.log('[VideoCall] Initializing Agora...', { roomId, userId: user?.id });
      
      if (!roomId || !user?.id) {
        setError('Missing room or user information');
        return;
      }

      const channelName = String(roomId);
      const uid = parseInt(user.id.replace(/-/g, '').substring(0, 8), 16);

      console.log('[VideoCall] Getting token:', { channelName, uid });

      const videoConfig = await joinVideoRoom({ roomId: channelName });

      if (videoConfig.token) {
        console.log('[VideoCall] Token received successfully');
        setCallState('connected');
        setSearchTime(0);
        lumiService.setContext('video-call');
      } else {
        console.error('[VideoCall] Failed to get token');
        setError('Failed to initialize call');
        Alert.alert('Connection Error', 'Failed to initialize call');
        setCallState('idle');
      }
    } catch (error: any) {
      console.error('[VideoCall] Initialize error:', error);
      setError(error.message || 'Failed to initialize call');
      Alert.alert('Error', error.message || 'Failed to initialize call');
      setCallState('idle');
    }
  };

  useEffect(() => {
    if (callState === 'searching') {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );

      const rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      );

      pulseAnimation.start();
      rotateAnimation.start();

      const timer = setInterval(() => {
        setSearchTime(prev => prev + 1);
      }, 1000);

      const interval = setInterval(checkForMatch, 2000) as unknown as NodeJS.Timeout;
      setMatchCheckInterval(interval);

      checkForMatch();

      return () => {
        pulseAnimation.stop();
        rotateAnimation.stop();
        clearInterval(timer);
        clearInterval(interval);
      };
    }
  }, [callState, checkForMatch]);

  useEffect(() => {
    if (callState === 'connected' && callDuration === 10) {
      lumiService.getIcebreaker()
        .then(suggestion => {
          setAiSuggestion(suggestion);
          setShowAiCoach(true);
          setTimeout(() => setShowAiCoach(false), 8000);
        })
        .catch(() => {});
    }
  }, [callState, callDuration]);

  useEffect(() => {
    if (callState === 'connected') {
      const timer = setInterval(() => {
        setCallDuration(prev => {
          const newDuration = prev + 1;
          
          if (newDuration % 60 === 0) {
            const currentCoins = user?.coins || 0;
            if (currentCoins >= VIDEO_CALL_RATE) {
              updateCoins(-VIDEO_CALL_RATE);
            } else {
              handleEndCall();
              return prev;
            }
          }
          
          return newDuration;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [callState, user?.coins, updateCoins]);

  const handleStartSearch = async () => {
    if (!user || user.coins < MIN_COINS_FOR_CALL) {
      router.push('/(tabs)/wallet');
      return;
    }

    try {
      setError(null);
      console.log('[Matching] Starting search...');

      setCallState('searching');
      setSearchTime(0);

      const matchResult = await startMatch(user.id);

      if (matchResult.status === 'matched' && matchResult.room) {
        console.log('[Matching] Match found immediately:', matchResult);
        setActiveRoomId(matchResult.room);
        await initializeVideoCall(matchResult.room);
      } else if (matchResult.status === 'error') {
        throw new Error(matchResult.error || 'Failed to start matching');
      } else {
        console.log('[Matching] Waiting for match...');
        await presenceService.updatePresence(user.id, {
          online: true,
          in_call: false,
          lang: currentLanguage || 'en',
          tags: user.languages || ['general'],
        });

        const userLang = currentLanguage || 'en';
        const userTags = user.languages || ['general'];

        const result = await presenceService.joinMatchQueue(user.id, userTags, userLang);

        if (!result.success) {
          throw new Error(result.error || 'Failed to join queue');
        }

        console.log('[Matching] Joined queue successfully');
      }
    } catch (error) {
      console.error('[Matching] Start search error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start matching';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
      setCallState('idle');
    }
  };

  const handleStopSearch = async () => {
    try {
      console.log('[Matching] Stopping search...');
      
      if (matchCheckInterval) {
        clearInterval(matchCheckInterval);
        setMatchCheckInterval(null);
      }

      if (user) {
        await presenceService.leaveMatchQueue(user.id);
        await presenceService.updatePresence(user.id, { in_call: false });
      }

      setCallState('idle');
      setSearchTime(0);
      setError(null);
    } catch (error) {
      console.error('[Matching] Stop search error:', error);
    }
  };



  const handleEndCall = async () => {
    try {
      console.log('[VideoCall] Ending call...');
      
      if (matchCheckInterval) {
        clearInterval(matchCheckInterval);
        setMatchCheckInterval(null);
      }

      await agoraService.leaveChannel();

      if (user) {
        await presenceService.updatePresence(user.id, { in_call: false });
      }

      setCallState('idle');
      setCallDuration(0);
      setActiveRoomId(null);
      setError(null);
    } catch (error) {
      console.error('[VideoCall] End call error:', error);
    }
  };

  const handleClose = async () => {
    if (callState === 'searching') {
      await handleStopSearch();
    } else if (callState === 'connected') {
      Alert.alert(
        t('endCall'),
        'Are you sure you want to end the call?',
        [
          { text: t('cancel'), style: 'cancel' },
          {
            text: t('endCall'),
            style: 'destructive',
            onPress: async () => {
              await handleEndCall();
              router.back();
            },
          },
        ]
      );
      return;
    }
    router.back();
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

  const handleSendGift = (gift: any) => {
    console.log('Gift sent:', gift);
  };

  useEffect(() => {
    return () => {
      if (matchCheckInterval) {
        clearInterval(matchCheckInterval);
      }
      if (user && callState === 'searching') {
        presenceService.leaveMatchQueue(user.id);
      }
      if (callState === 'connected') {
        agoraService.leaveChannel();
      }
    };
  }, [matchCheckInterval, user, callState]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const canAffordCall = user && user.coins >= MIN_COINS_FOR_CALL;
  const maxMinutes = user ? Math.floor(user.coins / VIDEO_CALL_RATE) : 0;

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#111315', '#1a1a1a', '#111315']}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X color="white" size={24} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Quick Match</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Error Banner */}
          {error && (
            <View style={styles.errorBanner}>
              <AlertCircle color="#FF4444" size={20} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Content */}
          <View style={styles.content}>
            {callState === 'idle' ? (
              <>
                {/* Main Circle */}
                <View style={styles.circleContainer}>
                  <LinearGradient
                    colors={['#F04F8F', '#FF6B9D']}
                    style={styles.mainCircle}
                  >
                    <Users color="white" size={60} />
                  </LinearGradient>
                </View>

                {/* Title */}
                <Text style={styles.title}>{t('startVideoCall')}</Text>
                <Text style={styles.subtitle}>{t('findSomeone')}</Text>

                {/* Stats */}
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Heart color="#F04F8F" size={20} />
                    <Text style={styles.statText}>1.2K online</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Zap color="#FFD700" size={20} />
                    <Text style={styles.statText}>{VIDEO_CALL_RATE} {t('callRate')}</Text>
                  </View>
                </View>

                {/* Balance Info */}
                <View style={styles.balanceInfo}>
                  <Text style={styles.balanceText}>
                    Your balance: {user?.coins || 0} coins
                  </Text>
                  {canAffordCall ? (
                    <Text style={styles.balanceSubtext}>
                      You can chat for up to {maxMinutes} minutes
                    </Text>
                  ) : (
                    <Text style={[styles.balanceSubtext, { color: '#FF4444' }]}>
                      Minimum {MIN_COINS_FOR_CALL} coins required
                    </Text>
                  )}
                </View>

                {/* Action Button */}
                {canAffordCall ? (
                  <TouchableOpacity
                    style={styles.startButton}
                    onPress={handleStartSearch}
                  >
                    <LinearGradient
                      colors={['#F04F8F', '#FF6B9D']}
                      style={styles.startButtonGradient}
                    >
                      <Text style={styles.startButtonText}>Start Matching</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.buyCoinsButton}
                    onPress={() => router.push('/(tabs)/wallet')}
                  >
                    <Text style={styles.buyCoinsText}>{t('buyCoin')}</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : callState === 'searching' ? (
              <>
                {/* Searching Animation */}
                <View style={styles.searchingContainer}>
                  <Animated.View
                    style={[
                      styles.searchingCircle,
                      {
                        transform: [{ scale: pulseAnim }, { rotate: spin }],
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={['#F04F8F', '#FF6B9D']}
                      style={styles.searchingGradient}
                    >
                      <Users color="white" size={40} />
                    </LinearGradient>
                  </Animated.View>
                </View>

                <Text style={styles.searchingTitle}>🔍 Finding your perfect match...</Text>
                <Text style={styles.searchingSubtitle}>⏳ Searching through 1.2K online users</Text>
                <Text style={styles.searchingTime}>{formatTime(searchTime)}</Text>

                <View style={styles.searchingSteps}>
                  <Text style={styles.searchingStep}>• Checking compatibility...</Text>
                  <Text style={styles.searchingStep}>• Looking for best connection...</Text>
                  <Text style={styles.searchingStep}>• Almost there!</Text>
                </View>

                <TouchableOpacity
                  style={styles.stopButton}
                  onPress={handleStopSearch}
                >
                  <Text style={styles.stopButtonText}>{t('cancel')}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Video Call View */}
                <View style={styles.videoCallContainer}>
                  {/* Status Bar */}
                  <View style={styles.callStatusBar}>
                    <View style={styles.statusLeft}>
                      <View style={styles.statusDot} />
                      <Text style={styles.statusText}>Connected</Text>
                    </View>
                    <Text style={styles.duration}>{formatTime(callDuration)}</Text>
                  </View>

                  {/* Video Area */}
                  <View style={styles.videoArea}>
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
                      {user?.coins || 0} coins • {Math.floor((user?.coins || 0) / VIDEO_CALL_RATE)} min remaining
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

                    <TouchableOpacity style={styles.controlButton} onPress={() => setShowGiftModal(true)}>
                      <Gift color="white" size={24} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.controlButton} onPress={() => console.log('Chat')}>
                      <MessageCircle color="white" size={24} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.endCallButton} onPress={handleEndCall}>
                      <PhoneOff color="white" size={24} />
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  circleContainer: {
    marginBottom: 40,
  },
  mainCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 40,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 40,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
  balanceInfo: {
    alignItems: 'center',
    marginBottom: 40,
  },
  balanceText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
    marginBottom: 4,
  },
  balanceSubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  startButton: {
    width: width * 0.8,
    maxWidth: 300,
  },
  startButtonGradient: {
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  buyCoinsButton: {
    width: width * 0.8,
    maxWidth: 300,
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: '#F04F8F',
  },
  buyCoinsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F04F8F',
  },
  searchingContainer: {
    marginBottom: 40,
  },
  searchingCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  searchingGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
  },
  searchingTime: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F04F8F',
    marginBottom: 40,
  },
  stopButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  stopButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#FF4444',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 24,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#FF4444',
    fontWeight: '500',
  },
  searchingSubtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 16,
  },
  searchingSteps: {
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  searchingStep: {
    fontSize: 14,
    color: '#888',
    marginVertical: 4,
  },
  videoCallContainer: {
    width: '100%',
    flex: 1,
  },
  callStatusBar: {
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
    backgroundColor: '#10B981',
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
  videoArea: {
    flex: 1,
    position: 'relative',
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
