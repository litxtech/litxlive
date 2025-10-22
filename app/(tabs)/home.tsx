import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Radio, MapPin, Search, Users, AlertCircle, PhoneOff, Mic, MicOff, VideoOff, Video, Gift, MessageCircle, Menu } from "lucide-react-native";
import { MaterialIcons } from '@expo/vector-icons';
import { router } from "expo-router";
import { useUser } from "@/providers/UserProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import Footer from "@/components/Footer";
import { lumiService } from "@/services/lumiService";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { MIN_COINS_FOR_CALL, VIDEO_CALL_RATE } from '@/constants/gifts';
import { presenceService } from '@/services/presenceService';
import { roomService } from '@/services/roomService';
import { agoraService } from '@/services/agoraService';
import GiftModal from '@/components/GiftModal';
import UserMenu from '@/components/UserMenu';
import CountrySelectionModal from '@/components/CountrySelectionModal';
import UserGrid from '@/components/UserGrid';

type CallState = 'idle' | 'searching' | 'connected';

export default function HomeScreen() {
  const { user, updateCoins } = useUser();
  const { t, currentLanguage } = useLanguage();
  const scaleAnim = useMemo(() => new Animated.Value(1), []);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [rotateAnim] = useState(new Animated.Value(0));
  
  const [callState, setCallState] = useState<CallState>('idle');
  const [searchTime, setSearchTime] = useState(0);
  const [callDuration, setCallDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [matchCheckInterval, setMatchCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const [, setActiveRoomId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string>('');
  const [showAiCoach, setShowAiCoach] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female' | 'mixed'>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [showCountryModal, setShowCountryModal] = useState(false);
  
  // LUMI Advanced Filters
  const [ageRangeFilter, setAgeRangeFilter] = useState<[number, number]>([18, 65]);
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'none' | 'yellow' | 'blue'>('all');
  const [vipFilter, setVipFilter] = useState<boolean | null>(null); // null = all, true = vip only, false = non-vip only
  const [onlineFilter, setOnlineFilter] = useState<'all' | 'online' | 'live'>('all');
  
  // LUMI Robot Moderation
  const [robotModerationActive, setRobotModerationActive] = useState(false);
  const [robotModerationTime, setRobotModerationTime] = useState(0);
  const [showRobotWarning, setShowRobotWarning] = useState(false);

  React.useEffect(() => {
    lumiService.setContext(callState === 'connected' ? 'video-call' : 'home');
  }, [callState]);

  const initializeVideoCall = useCallback(async (roomId: string) => {
    try {
      console.log('[VideoCall] Initializing Agora...', { roomId, userId: user?.id });
      
      if (!roomId || !user?.id) {
        setError('Missing room or user information');
        return;
      }

      const channelName = String(roomId);
      const uid = parseInt(user.id.replace(/-/g, '').substring(0, 8), 16);

      console.log('[VideoCall] Getting token:', { channelName, uid });

      const result = await agoraService.initializeVideoCall(channelName, uid);

      if (result.success && result.token) {
        console.log('[VideoCall] Token received successfully');
        setCallState('connected');
        setSearchTime(0);
        
        // LUMI Robot Moderation - Start 2-minute monitoring
        setRobotModerationActive(true);
        setRobotModerationTime(120); // 2 minutes in seconds
        setShowRobotWarning(true);
        console.log('[LUMI] Robot moderation started - 2 minutes monitoring');
      } else {
        console.error('[VideoCall] Failed to get token:', result.error);
        setError(result.error || 'Failed to initialize call');
        Alert.alert('Connection Error', result.error || 'Failed to initialize call');
        setCallState('idle');
      }
    } catch (error: any) {
      console.error('[VideoCall] Initialize error:', error);
      setError(error.message || 'Failed to initialize call');
      Alert.alert('Error', error.message || 'Failed to initialize call');
      setCallState('idle');
    }
  }, [user]);

  const checkForMatch = useCallback(async () => {
    if (!user) {
      console.log('[Matching] No user, skipping match check');
      return;
    }

    try {
      const userLang = currentLanguage || 'en';
      const userTags = user.languages || ['general'];

      // Apply current filters
      const matchingPreferences = {
        gender: genderFilter !== 'all' ? genderFilter : undefined,
        country: countryFilter !== 'all' ? countryFilter : undefined,
        mixed: genderFilter === 'mixed'
      };

      console.log('[Matching] Checking for match with filters...', { 
        userId: user.id, 
        lang: userLang, 
        tags: userTags,
        preferences: matchingPreferences 
      });
      
      const result = await presenceService.findMatch(user.id, userLang, userTags, matchingPreferences);

      if (result.success && result.match) {
        console.log('[Matching] Match found!', result.match);
        
        console.log('[Matching] Leaving queue...');
        await presenceService.leaveMatchQueue(user.id);
        await presenceService.leaveMatchQueue(result.match.user_id);

        console.log('[Matching] Creating room...');
        const roomResult = await roomService.createRoom(user.id, result.match.user_id, 60);

        if (roomResult.success && roomResult.room) {
          console.log('[Matching] Room created:', roomResult.room.room_id);
          
          console.log('[Matching] Updating presence to in_call...');
          await presenceService.updatePresence(user.id, { in_call: true });
          await presenceService.updatePresence(result.match.user_id, { in_call: true });

          setActiveRoomId(roomResult.room.room_id);
          await initializeVideoCall(roomResult.room.room_id);
        } else {
          console.error('[Matching] Failed to create room:', roomResult.error);
          throw new Error(roomResult.error || 'Failed to create room');
        }
      } else {
        console.log('[Matching] No match found yet, continuing search...');
      }
    } catch (error) {
      console.error('[Matching] Check match error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to find match';
      setError(errorMessage);
      Alert.alert('Matching Error', errorMessage);
      setCallState('idle');
    }
  }, [user, currentLanguage, initializeVideoCall, genderFilter, countryFilter]);



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
  }, [callState, checkForMatch, pulseAnim, rotateAnim]);

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

  const handleEndCall = useCallback(async () => {
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
  }, [matchCheckInterval, user]);

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
  }, [callState, user?.coins, updateCoins, handleEndCall]);

  // LUMI Robot Moderation Timer
  useEffect(() => {
    if (robotModerationActive && robotModerationTime > 0) {
      const timer = setInterval(() => {
        setRobotModerationTime(prev => {
          const newTime = prev - 1;
          
          if (newTime <= 0) {
            // Robot moderation period ended
            setRobotModerationActive(false);
            setShowRobotWarning(false);
            console.log('[LUMI] Robot moderation period ended - users can now chat freely');
            return 0;
          }
          
          return newTime;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [robotModerationActive, robotModerationTime]);

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
      console.log('[Matching] Starting search with filters...', {
        userId: user.id,
        coins: user.coins,
        lang: currentLanguage,
        languages: user.languages,
        genderFilter,
        countryFilter
      });

      const userLang = currentLanguage || 'en';
      const userTags = user.languages || ['general'];

      // Apply filters to matching preferences
      const matchingPreferences = {
        gender: genderFilter !== 'all' ? genderFilter : undefined,
        country: countryFilter !== 'all' ? countryFilter : undefined,
        mixed: genderFilter === 'mixed'
      };

      console.log('[Matching] Updating presence with filters...');
      await presenceService.updatePresence(user.id, {
        online: true,
        in_call: false,
        lang: userLang,
        tags: userTags,
        preferences: matchingPreferences,
      });

      console.log('[Matching] Joining queue with filters...');
      const result = await presenceService.joinMatchQueue(user.id, userTags, userLang, matchingPreferences);

      if (!result.success) {
        throw new Error(result.error || 'Failed to join queue');
      }

      console.log('[Matching] Joined queue successfully with filters');
      setCallState('searching');
      setSearchTime(0);
    } catch (error) {
      console.error('[Matching] Start search error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start matching';
      setError(errorMessage);
      Alert.alert('Matching Error', `Could not start matching: ${errorMessage}\n\nPlease check your internet connection and try again.`);
    }
  };

  const handleGoLive = () => {
    haptic();
    Alert.alert("Coming Soon", "Go Live feature will be available soon!");
  };

  const handleQuickMatch = () => {
    handleStartPress();
  };

  const handleNearby = () => {
    handleStartPress();
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

  const handleDiscover = () => {
    haptic();
    router.push("/(tabs)/discover");
  };

  const handleSettings = () => {
    haptic();
    router.push("/settings");
  };

  const getCountryDisplayName = (countryCode: string) => {
    const countryMap: { [key: string]: string } = {
      'all': '🌍 Tümü',
      'TR': '🇹🇷 Türkiye',
      'PH': '🇵🇭 Filipinler',
      'VE': '🇻🇪 Venezuela',
      'CO': '🇨🇴 Kolombiya',
      'BR': '🇧🇷 Brezilya',
      'PK': '🇵🇰 Pakistan',
      'VN': '🇻🇳 Vietnam',
      'EG': '🇪🇬 Mısır',
      'SY': '🇸🇾 Suriye',
      'MY': '🇲🇾 Malezya',
      'IN': '🇮🇳 Hindistan',
    };
    return countryMap[countryCode] || '🌍 Tümü';
  };

  const handleCountrySelect = (countryCode: string) => {
    console.log('[Home] Country filter updated:', countryCode);
    setCountryFilter(countryCode);
    setShowCountryModal(false);
  };

  if (callState === 'searching') {
    return (
      <View style={styles.container}>
        <View style={styles.fullScreenGradient}>
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
              <Text style={styles.searchingStep}>• Looking for best connection...</Text>
              <Text style={styles.searchingStep}>• Almost there!</Text>
            </View>

            <TouchableOpacity
              style={styles.stopButton}
              onPress={handleStopSearch}
            >
              <Text style={styles.stopButtonText}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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

            {/* LUMI Robot Moderation Warning */}
            {showRobotWarning && robotModerationActive && (
              <View style={styles.robotModerationCard}>
                <Text style={styles.robotModerationTitle}>🤖 Robot Moderasyon Aktif</Text>
                <Text style={styles.robotModerationText}>
                  İlk 2 dakika robot tarafından izleniyor. Süre: {Math.floor(robotModerationTime / 60)}:{(robotModerationTime % 60).toString().padStart(2, '0')}
                </Text>
                <Text style={styles.robotModerationSubtext}>
                  Bu süre zarfında uygunsuz davranış tespit edilirse otomatik olarak uyarı alacaksınız.
                </Text>
              </View>
            )}

            <View style={styles.coinInfo}>
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
        </View>
        
        <GiftModal
          visible={showGiftModal}
          onClose={() => setShowGiftModal(false)}
          recipientName="Partner"
          onSendGift={handleSendGift}
        />
      </View>
    );
  }

  return (
    <View style={styles.container} testID="home-screen">
      <View style={styles.topButtons}>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={handleSettings}
          testID="settings-button"
          activeOpacity={0.7}
        >
          <View style={styles.settingsButtonInner}>
            <MaterialIcons name="settings" size={20} color={Colors.text} />
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setShowUserMenu(true)}
          testID="menu-button"
          activeOpacity={0.7}
        >
          <View style={styles.menuButtonInner}>
            <Menu color={Colors.text} size={24} strokeWidth={2} />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Go Live. Meet. Earn.</Text>
          <Text style={styles.heroSubtitle}>
            Connect with people worldwide through live video
          </Text>
          
          {/* Filter Buttons */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Filtreler</Text>
            
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Cinsiyet:</Text>
              <View style={styles.filterButtons}>
                <TouchableOpacity
                  style={[styles.filterButton, genderFilter === 'all' && styles.filterButtonActive]}
                  onPress={() => {
                    setGenderFilter('all');
                    console.log('[Filter] Gender set to: all');
                  }}
                >
                  <Text style={[styles.filterButtonText, genderFilter === 'all' && styles.filterButtonTextActive]}>
                    Tümü
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterButton, genderFilter === 'male' && styles.filterButtonActive]}
                  onPress={() => {
                    setGenderFilter('male');
                    console.log('[Filter] Gender set to: male');
                  }}
                >
                  <Text style={[styles.filterButtonText, genderFilter === 'male' && styles.filterButtonTextActive]}>
                    Erkek
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterButton, genderFilter === 'female' && styles.filterButtonActive]}
                  onPress={() => {
                    setGenderFilter('female');
                    console.log('[Filter] Gender set to: female');
                  }}
                >
                  <Text style={[styles.filterButtonText, genderFilter === 'female' && styles.filterButtonTextActive]}>
                    Kadın
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterButton, genderFilter === 'mixed' && styles.filterButtonActive]}
                  onPress={() => {
                    setGenderFilter('mixed');
                    console.log('[Filter] Gender set to: mixed');
                  }}
                >
                  <Text style={[styles.filterButtonText, genderFilter === 'mixed' && styles.filterButtonTextActive]}>
                    Karışık
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Ülke:</Text>
              <TouchableOpacity
                style={[styles.countryFilterButton, countryFilter !== 'all' && styles.countryFilterButtonActive]}
                onPress={() => {
                  setShowCountryModal(true);
                  console.log('[Filter] Country modal opened');
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.countryFilterText, countryFilter !== 'all' && styles.countryFilterTextActive]}>
                  {countryFilter === 'all' ? '🌍 Tümü' : getCountryDisplayName(countryFilter)}
                </Text>
                <Text style={styles.countryFilterArrow}>▼</Text>
              </TouchableOpacity>
            </View>
            
            {/* LUMI Advanced Filters */}
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Doğrulama:</Text>
              <View style={styles.filterButtons}>
                <TouchableOpacity
                  style={[styles.filterButton, verificationFilter === 'all' && styles.filterButtonActive]}
                  onPress={() => {
                    setVerificationFilter('all');
                    console.log('[Filter] Verification set to: all');
                  }}
                >
                  <Text style={[styles.filterButtonText, verificationFilter === 'all' && styles.filterButtonTextActive]}>
                    Tümü
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterButton, verificationFilter === 'yellow' && styles.filterButtonActive]}
                  onPress={() => {
                    setVerificationFilter('yellow');
                    console.log('[Filter] Verification set to: yellow');
                  }}
                >
                  <Text style={[styles.filterButtonText, verificationFilter === 'yellow' && styles.filterButtonTextActive]}>
                    🟡 Doğrulanmış
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterButton, verificationFilter === 'blue' && styles.filterButtonActive]}
                  onPress={() => {
                    setVerificationFilter('blue');
                    console.log('[Filter] Verification set to: blue');
                  }}
                >
                  <Text style={[styles.filterButtonText, verificationFilter === 'blue' && styles.filterButtonTextActive]}>
                    🔵 Influencer
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>VIP:</Text>
              <View style={styles.filterButtons}>
                <TouchableOpacity
                  style={[styles.filterButton, vipFilter === null && styles.filterButtonActive]}
                  onPress={() => {
                    setVipFilter(null);
                    console.log('[Filter] VIP set to: all');
                  }}
                >
                  <Text style={[styles.filterButtonText, vipFilter === null && styles.filterButtonTextActive]}>
                    Tümü
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterButton, vipFilter === true && styles.filterButtonActive]}
                  onPress={() => {
                    setVipFilter(true);
                    console.log('[Filter] VIP set to: vip only');
                  }}
                >
                  <Text style={[styles.filterButtonText, vipFilter === true && styles.filterButtonTextActive]}>
                    ⭐ VIP
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterButton, vipFilter === false && styles.filterButtonActive]}
                  onPress={() => {
                    setVipFilter(false);
                    console.log('[Filter] VIP set to: non-vip only');
                  }}
                >
                  <Text style={[styles.filterButtonText, vipFilter === false && styles.filterButtonTextActive]}>
                    👤 Normal
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Durum:</Text>
              <View style={styles.filterButtons}>
                <TouchableOpacity
                  style={[styles.filterButton, onlineFilter === 'all' && styles.filterButtonActive]}
                  onPress={() => {
                    setOnlineFilter('all');
                    console.log('[Filter] Online set to: all');
                  }}
                >
                  <Text style={[styles.filterButtonText, onlineFilter === 'all' && styles.filterButtonTextActive]}>
                    Tümü
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterButton, onlineFilter === 'online' && styles.filterButtonActive]}
                  onPress={() => {
                    setOnlineFilter('online');
                    console.log('[Filter] Online set to: online only');
                  }}
                >
                  <Text style={[styles.filterButtonText, onlineFilter === 'online' && styles.filterButtonTextActive]}>
                    🟢 Çevrimiçi
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterButton, onlineFilter === 'live' && styles.filterButtonActive]}
                  onPress={() => {
                    setOnlineFilter('live');
                    console.log('[Filter] Online set to: live only');
                  }}
                >
                  <Text style={[styles.filterButtonText, onlineFilter === 'live' && styles.filterButtonTextActive]}>
                    🔴 Canlı
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Debug Info */}
            <View style={styles.debugInfo}>
              <Text style={styles.debugText}>
                Aktif Filtreler: Cinsiyet={genderFilter}, Ülke={countryFilter}, Doğrulama={verificationFilter}, VIP={vipFilter}, Durum={onlineFilter}
              </Text>
            </View>
          </View>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <AlertCircle color="#FF4444" size={20} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Random Matching Section */}
        <View style={styles.randomMatchingSection}>
          <LinearGradient
            colors={['#10B981', '#34D399']}
            style={styles.matchingBanner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.matchingLeft}>
              <Text style={styles.matchingTitle}>Random Eşleştirme...</Text>
              <Text style={styles.matchingSubtitle}>22.127 Çevrimiçi</Text>
            </View>
            <View style={styles.matchingRight}>
              <View style={styles.coinInfo}>
                <Text style={styles.coinIcon}>🪙</Text>
                <Text style={styles.coinTextPrimary}>3/once</Text>
              </View>
              <TouchableOpacity
                style={styles.startMatchingButton}
                onPress={handleStartPress}
                activeOpacity={0.8}
              >
                <Text style={styles.startMatchingText}>Başlangıç</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Users Grid */}
        <View style={styles.usersSection}>
          <Text style={styles.usersTitle}>İnsanlar</Text>
          <UserGrid onUserPress={(user) => console.log('User pressed:', user)} />
        </View>

        <View style={styles.mainContent}>
          <Animated.View style={[styles.startButtonContainer, { transform: [{ scale: scaleAnim }] }]}>
            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStartPress}
              activeOpacity={0.9}
              testID="start-button"
            >
              <LinearGradient
                colors={Colors.gradients.primary}
                style={styles.startButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialIcons name="videocam" size={32} color="#FFFFFF" />
                <Text style={styles.startButtonText}>Start</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

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

          <View style={styles.quickOptions}>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={handleGoLive}
              testID="go-live-button"
            >
              <LinearGradient
                colors={Colors.gradients.primary}
                style={styles.optionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Radio color="#FFFFFF" size={18} strokeWidth={2.5} />
                <Text style={styles.optionText}>Go Live</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={handleQuickMatch}
              testID="quick-match-button"
            >
              <View style={styles.optionContent}>
                <MaterialIcons name="videocam" size={18} color={Colors.primary} />
                <Text style={styles.optionTextDark}>Quick Match</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={handleNearby}
              testID="nearby-button"
            >
              <View style={styles.optionContent}>
                <MapPin color={Colors.secondary} size={18} strokeWidth={2.5} />
                <Text style={styles.optionTextDark}>Nearby</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={handleDiscover}
              testID="discover-button"
            >
              <View style={styles.optionContent}>
                <Search color={Colors.mint} size={18} strokeWidth={2.5} />
                <Text style={styles.optionTextDark}>Discover</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <Footer />
      </ScrollView>

      <UserMenu
        visible={showUserMenu}
        onClose={() => setShowUserMenu(false)}
      />

      <CountrySelectionModal
        visible={showCountryModal}
        onClose={() => setShowCountryModal(false)}
        onSelectCountry={handleCountrySelect}
        selectedCountry={countryFilter}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundColor,
  },
  topButtons: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    right: 20,
    flexDirection: 'row',
    gap: 12,
    zIndex: 100,
  },
  settingsButton: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  settingsButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  menuButton: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  menuButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  heroSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  mainContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  startButtonContainer: {
    marginBottom: 24,
  },
  startButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8,
  },
  startButtonGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  quickOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    maxWidth: 400,
  },
  optionButton: {
    borderRadius: 12,
    overflow: "hidden",
    minWidth: 100,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  optionGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  optionTextDark: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  fullScreenGradient: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  searchingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  searchingCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 40,
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
    color: '#111',
    textAlign: 'center',
    marginBottom: 16,
  },
  searchingSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  searchingTime: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F04F8F',
    marginBottom: 40,
  },
  searchingSteps: {
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  searchingStep: {
    fontSize: 14,
    color: '#666',
    marginVertical: 4,
  },
  stopButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  stopButtonText: {
    fontSize: 16,
    color: '#111',
    fontWeight: '500',
  },
  videoCallContainer: {
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
    color: '#111',
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
    backgroundColor: '#f8f9fa',
  },
  videoPlaceholderText: {
    fontSize: 16,
    color: '#666',
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
    backgroundColor: '#f8f9fa',
  },
  selfVideoText: {
    fontSize: 12,
    color: '#666',
  },
  coinInfoContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  coinTextSecondary: {
    fontSize: 14,
    color: '#666',
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
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
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
    backgroundColor: '#f8f4ff',
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
    color: '#111',
    lineHeight: 20,
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
  balanceInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  balanceText: {
    fontSize: 16,
    color: '#111',
    fontWeight: '600',
    marginBottom: 4,
  },
  balanceSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  filterSection: {
    marginTop: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  filterRow: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.borderLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text,
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  countryFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.borderLight,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 48,
  },
  countryFilterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  countryFilterText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    flex: 1,
  },
  countryFilterTextActive: {
    color: '#FFFFFF',
  },
  countryFilterArrow: {
    fontSize: 12,
    color: Colors.textMuted,
    marginLeft: 8,
  },
  randomMatchingSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  matchingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 80,
  },
  matchingLeft: {
    flex: 1,
  },
  matchingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  matchingSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  matchingRight: {
    alignItems: 'center',
    gap: 8,
  },
  coinInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coinIcon: {
    fontSize: 16,
  },
  coinTextPrimary: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  startMatchingButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  startMatchingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  usersSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  usersTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  debugInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  debugText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  // LUMI Robot Moderation Styles
  robotModerationCard: {
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
    borderWidth: 1,
    borderColor: '#FFC107',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 8,
  },
  robotModerationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFC107',
    marginBottom: 8,
    textAlign: 'center',
  },
  robotModerationText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
    fontWeight: '500',
  },
  robotModerationSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 16,
  },
});
