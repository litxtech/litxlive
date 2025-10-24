import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Platform,
  Dimensions,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { useUser } from '@/providers/UserProvider';
import { usePresence } from '@/hooks/usePresence';
import { useAgora } from '@/hooks/useAgora';
import { useVerification } from '@/hooks/useVerification';
import { useCoins } from '@/hooks/useCoins';
import { useAdmin } from '@/providers/AdminProvider';
import { 
  Users, 
  Settings, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff, 
  Gift, 
  MessageCircle,
  AlertCircle,
  Star,
  Zap,
  Camera,
  Crown,
  Shield,
  Heart,
  Sparkles
} from 'lucide-react-native';
import GiftModal from '@/components/GiftModal';
import CountrySelectionModal from '@/components/CountrySelectionModal';
import LanguageSelector from '@/components/LanguageSelector';
import { AdvancedFiltersModal } from '@/components/AdvancedFiltersModal';

const { width, height } = Dimensions.get('window');

// Constants
const MIN_COINS_FOR_CALL = 10;
const VIDEO_CALL_RATE = 1; // 1 coin per minute
const SEARCH_TIMEOUT = 30000; // 30 seconds
const ROBOT_MODERATION_DURATION = 120; // 2 minutes

export default function HomeScreen() {
  const { user, updateProfile } = useUser();
  const { isAdmin } = useAdmin();
  const insets = useSafeAreaInsets();
  
  // Core states
  const [callState, setCallState] = useState<'idle' | 'searching' | 'connected'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [searchTime, setSearchTime] = useState(0);
  const [callDuration, setCallDuration] = useState(0);
  
  // UI states
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Filter states
  const [genderFilter, setGenderFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [currentLanguage, setCurrentLanguage] = useState('en');
  
  // Call states
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showAiCoach, setShowAiCoach] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  
  // LUMI Robot Moderation
  const [robotModerationActive, setRobotModerationActive] = useState(false);
  const [robotModerationTime, setRobotModerationTime] = useState(0);
  const [showRobotWarning, setShowRobotWarning] = useState(false);
  
  // Animations
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const spin = useRef(new Animated.Value(0)).current;
  
  // Refs
  const matchCheckInterval = useRef<number | null>(null);
  
  // Hooks
  const { updatePresence, joinMatchQueue, leaveMatchQueue, findMatch } = usePresence();
  const { joinChannel, leaveChannel, toggleMute: agoraToggleMute, toggleVideo: agoraToggleVideo } = useAgora();
  const { verificationLevel } = useVerification();
  const { updateCoins } = useCoins();

  // Animation effects
  useEffect(() => {
    if (callState === 'searching') {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      );
      pulseAnimation.start();
      
      const spinAnimation = Animated.loop(
        Animated.timing(spin, { toValue: 1, duration: 2000, useNativeDriver: true })
      );
      spinAnimation.start();
      
      return () => {
        pulseAnimation.stop();
        spinAnimation.stop();
      };
    }
  }, [callState, pulseAnim, spin]);

  // Search timer
  useEffect(() => {
    if (callState === 'searching') {
      const timer = setInterval(() => {
        setSearchTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setSearchTime(0);
    }
  }, [callState]);

  // Call duration timer
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

  // Robot moderation timer
  useEffect(() => {
    if (robotModerationActive && robotModerationTime > 0) {
      const timer = setInterval(() => {
        setRobotModerationTime(prev => {
          const newTime = prev - 1;
          
          if (newTime <= 0) {
            setRobotModerationActive(false);
            setShowRobotWarning(false);
            return 0;
          }
          
          return newTime;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [robotModerationActive, robotModerationTime]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (matchCheckInterval.current) {
        clearInterval(matchCheckInterval.current);
      }
      if (callState === 'connected') {
        leaveChannel();
      }
    };
  }, [matchCheckInterval, callState]);

  const haptic = async () => {
    if (Platform.OS !== "web") {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {
        console.log("haptics error", e);
      }
    }
  };

  const handleStartPress = async () => {
    if (!user) {
      Alert.alert('Error', 'Please login first');
      return;
    }

    if (user.coins < MIN_COINS_FOR_CALL) {
      haptic();
      Alert.alert(
        'Insufficient Coins',
        `You need at least ${MIN_COINS_FOR_CALL} coins to start a call. Would you like to get more coins?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Get Coins', onPress: () => router.push('/(tabs)/wallet') }
        ]
      );
      return;
    }

    try {
      haptic();
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();

      setError(null);
      setCallState('searching');
      
      // Start robot moderation
      setRobotModerationActive(true);
      setRobotModerationTime(ROBOT_MODERATION_DURATION);
      setShowRobotWarning(true);
      
      // Join match queue
      const result = await joinMatchQueue(user.id, [], currentLanguage, {
        gender: genderFilter,
        country: countryFilter,
        vipFilter: 'all',
        verificationFilter: 'all',
        onlineFilter: 'all'
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to join match queue');
      }
      
      // Start match checking
      startMatchCheck();
      
    } catch (error: any) {
      console.error('[Home] Start error:', error);
      setError(error.message || 'Failed to start matching');
      setCallState('idle');
    }
  };

  const startMatchCheck = () => {
    if (matchCheckInterval.current) {
      clearInterval(matchCheckInterval.current);
    }
    
    let checkCount = 0;
    const maxChecks = 15; // 30 saniye / 2 saniye = 15 kontrol
    
    matchCheckInterval.current = setInterval(async () => {
      try {
        checkCount++;
        
        // Maksimum kontrol sayısına ulaştıysa dur
        if (checkCount >= maxChecks) {
          handleStopSearch();
          return;
        }
        
        const matchResult = await findMatch(user?.id || '', currentLanguage, [], {
          gender: genderFilter,
          country: countryFilter,
          vipFilter: 'all',
          verificationFilter: 'all',
          onlineFilter: 'all'
        });
        
        if (matchResult.success && 'match' in matchResult && matchResult.match) {
          clearInterval(matchCheckInterval.current!);
          await handleMatchFound(matchResult.match);
        }
      } catch (error) {
        console.error('[Home] Match check error:', error);
        handleStopSearch();
      }
    }, 2000);
  };

  const handleMatchFound = async (match: any) => {
    try {
      setCallState('connected');
      await joinChannel(match.user_id);
      setShowRobotWarning(false);
    } catch (error: any) {
      console.error('[Home] Match found error:', error);
      setError('Failed to connect to match');
      setCallState('idle');
    }
  };

  const handleStopSearch = async () => {
    try {
      if (matchCheckInterval.current) {
        clearInterval(matchCheckInterval.current);
        matchCheckInterval.current = null;
      }
      
      await leaveMatchQueue(user?.id || '');
      setCallState('idle');
      setSearchTime(0);
    } catch (error: any) {
      console.error('[Home] Stop search error:', error);
    }
  };

  const handleEndCall = async () => {
    try {
      await leaveChannel();
      setCallState('idle');
      setCallDuration(0);
      setRobotModerationActive(false);
      setShowRobotWarning(false);
    } catch (error: any) {
      console.error('[Home] End call error:', error);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    agoraToggleMute();
  };

  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff);
    agoraToggleVideo();
  };

  const handleSendGift = (giftId: string, recipientId: string) => {
    console.log('Sending gift:', giftId, 'to:', recipientId);
    // Implement gift sending logic
  };

  const handleSettings = () => {
    router.push('/(tabs)/profile');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCountrySelect = (countryCode: string) => {
    setCountryFilter(countryCode);
    setShowCountryModal(false);
  };

  const handleLanguageSelect = (language: string) => {
    setCurrentLanguage(language);
    setShowLanguageModal(false);
  };

  if (callState === 'searching') {
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <View style={styles.fullScreenGradient}>
            <View style={styles.searchingContainer}>
              <Animated.View
                style={[
                  styles.searchingCircle,
                  {
                    transform: [{ scale: pulseAnim }, { rotate: spin.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg']
                  })}],
                  },
                ]}
              >
                <LinearGradient
                  colors={Colors.gradients.primary}
                  style={styles.searchingGradient}
                >
                  <Users color="white" size={40} />
                </LinearGradient>
              </Animated.View>

              <Text style={styles.searchingTitle}>🔍 Finding your perfect match...</Text>
              <Text style={styles.searchingSubtitle}>⏳ Searching through 1.2K online users</Text>
              <Text style={styles.searchingTime}>{formatTime(searchTime)}</Text>

              <View style={styles.searchingSteps}>
                <Text style={styles.searchingStep}>• Checking compatibility...</Text>
                <Text style={styles.searchingStep}>• Analyzing preferences...</Text>
                <Text style={styles.searchingStep}>• Connecting to available users...</Text>
              </View>

              <TouchableOpacity
                style={styles.stopButton}
                onPress={handleStopSearch}
                activeOpacity={0.8}
              >
                <Text style={styles.stopButtonText}>Stop</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  if (callState === 'connected') {
    return (
      <View style={styles.container}>
        <View style={styles.fullScreenGradient}>
          <View style={styles.videoCallContainer}>
            <View style={styles.callStatusBar}>
              <View style={styles.statusLeft}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Connected</Text>
              </View>
              <Text style={styles.duration}>{formatTime(callDuration)}</Text>
            </View>

            <View style={styles.videoArea}>
              <View style={styles.partnerVideo}>
                <LinearGradient
                  colors={['#333', '#555']}
                  style={styles.videoPlaceholder}
                >
                  <Text style={styles.videoPlaceholderText}>Partner Video</Text>
                </LinearGradient>
              </View>

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

            {showAiCoach && aiSuggestion && (
              <View style={styles.aiCoachCard}>
                <Text style={styles.aiCoachTitle}>✨ Lumi suggests:</Text>
                <Text style={styles.aiCoachText}>{aiSuggestion}</Text>
              </View>
            )}

            {showRobotWarning && robotModerationActive && (
              <View style={styles.robotModerationCard}>
                <Text style={styles.robotModerationTitle}>🤖 AI Moderation Active</Text>
                <Text style={styles.robotModerationText}>
                  Video calls are monitored by artificial intelligence.
                  Inappropriate behavior will be automatically detected and action will be taken.
                </Text>
                <Text style={styles.robotModerationSubtext}>
                  Time remaining: {robotModerationTime} seconds
                </Text>
              </View>
            )}

            <View style={styles.coinInfoContainer}>
              <Text style={styles.coinTextPrimary}>
                {user?.coins || 0} coins • {Math.floor((user?.coins || 0) / VIDEO_CALL_RATE)} min remaining
              </Text>
            </View>

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

              <TouchableOpacity
                style={styles.endCallButton}
                onPress={handleEndCall}
              >
                <PhoneOff color="white" size={28} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => setShowGiftModal(true)}
              >
                <Gift color="white" size={24} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => Alert.alert("Report", "Report user feature coming soon!")}
              >
                <AlertCircle color="white" size={24} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <GiftModal
          visible={showGiftModal}
          onClose={() => setShowGiftModal(false)}
          recipientName="Partner"
          onSendGift={(gift) => handleSendGift(gift.id, 'partner-id')}
        />
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container} testID="home-screen">
        <View style={styles.topButtons}>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={handleSettings}
            testID="settings-button"
            activeOpacity={0.7}
          >
            <Settings color={Colors.text} size={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>LUMI</Text>
            <Text style={styles.subtitle}>Global Video Friends</Text>
            <Text style={styles.description}>
              Connect with people worldwide through video calls
            </Text>
          </View>

          <View style={styles.filters}>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowCountryModal(true)}
            >
              <Text style={styles.filterText}>
                {countryFilter === 'all' ? '🌍 All Countries' : `🌍 ${countryFilter}`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowLanguageModal(true)}
            >
              <Text style={styles.filterText}>
                {currentLanguage === 'en' ? '🇺🇸 English' : `🇹🇷 ${currentLanguage}`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.advancedFiltersButton}
              onPress={() => setShowAdvancedFilters(true)}
            >
              <Text style={styles.advancedFiltersText}>⚙️ Filters</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.startButtonContainer}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity
                style={styles.startButton}
                onPress={handleStartPress}
                activeOpacity={0.8}
                testID="start-button"
              >
                <LinearGradient
                  colors={Colors.gradients.primary}
                  style={styles.startButtonGradient}
                >
                  <Users color="white" size={32} />
                  <Text style={styles.startButtonText}>Start Video Call</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>1.2K</Text>
              <Text style={styles.statLabel}>Online Users</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>50+</Text>
              <Text style={styles.statLabel}>Countries</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>24/7</Text>
              <Text style={styles.statLabel}>Available</Text>
            </View>
          </View>
        </View>

        <CountrySelectionModal
          visible={showCountryModal}
          onClose={() => setShowCountryModal(false)}
          onSelectCountry={handleCountrySelect}
          selectedCountry={countryFilter}
        />

        <LanguageSelector
          showLabel={false}
          compact={true}
        />

        <AdvancedFiltersModal
          visible={showAdvancedFilters}
          onClose={() => setShowAdvancedFilters(false)}
          onApply={(filters: any) => {
            setGenderFilter(filters.gender);
            setCountryFilter(filters.country);
            setShowAdvancedFilters(false);
          }}
        />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  fullScreenGradient: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topButtons: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flex: 1,
    paddingTop: 100,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.textMuted,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },
  filters: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  filterButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    minHeight: 44,
  },
  filterText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    numberOfLines: 2,
  },
  advancedFiltersButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginLeft: 8,
  },
  advancedFiltersText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  startButtonContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  startButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  startButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    textAlign: 'center',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 40,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  // Searching styles
  searchingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  searchingCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 40,
  },
  searchingGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  searchingSubtitle: {
    fontSize: 16,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 20,
  },
  searchingTime: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 30,
  },
  searchingSteps: {
    marginBottom: 40,
  },
  searchingStep: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 8,
  },
  stopButton: {
    backgroundColor: '#ff4444',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 25,
  },
  stopButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Video call styles
  videoCallContainer: {
    flex: 1,
    padding: 20,
  },
  callStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  duration: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  videoArea: {
    flex: 1,
    marginBottom: 20,
  },
  partnerVideo: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 12,
    marginBottom: 10,
  },
  videoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  videoPlaceholderText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '500',
  },
  selfVideo: {
    position: 'absolute',
    top: 20,
    right: 20,
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
    color: 'white',
    fontSize: 14,
  },
  aiCoachCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  aiCoachTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  aiCoachText: {
    color: 'white',
    fontSize: 14,
  },
  robotModerationCard: {
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  robotModerationTitle: {
    color: '#FFC107',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  robotModerationText: {
    color: 'white',
    fontSize: 14,
    marginBottom: 4,
  },
  robotModerationSubtext: {
    color: '#FFC107',
    fontSize: 12,
  },
  coinInfoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  coinTextPrimary: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonActive: {
    backgroundColor: '#ff4444',
  },
  endCallButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ff4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
