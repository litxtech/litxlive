import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
  Dimensions,
  Pressable,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Mail, Lock, User, Eye, EyeOff, Key, Chrome, Globe, MessageCircle, Users, Shield, Heart, Sparkles, Video, Twitch, Star, Zap, Camera, Mic } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { router, Link } from "expo-router";
import { useUser } from "@/providers/UserProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { authService } from "@/services/auth";

const { width, height } = Dimensions.get('window');

type AuthMode = 'signin' | 'signup' | 'reset' | 'otp' | 'verify-otp';

export default function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [showSplash, setShowSplash] = useState(true);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [otpCode, setOtpCode] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useUser();
  const { t } = useLanguage();

  // Animasyon referansları
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Floating animasyonlar
  const floatingAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  // Splash screen animasyonu - daha hızlı ve profesyonel
  useEffect(() => {
    if (showSplash) {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Sadece 800ms bekle, daha hızlı geçiş
        setTimeout(() => setShowSplash(false), 800);
      });
    }
  }, [showSplash]);

  // Floating animasyonları
  useEffect(() => {
    floatingAnims.forEach((anim, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 3000 + index * 500,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 3000 + index * 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });

    // Pulse animasyonu
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Rotate animasyonu
  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const handleSignUp = async () => {
    if (!email || !password || !displayName) {
      Alert.alert(t('error'), 'Please fill all fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert(t('error'), 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await authService.signUpWithEmail(email, password, displayName);
      
      if (response.success) {
        Alert.alert(
          'Success',
          'Account created! Please check your email to verify your account.',
          [
            {
              text: 'OK',
              onPress: () => setMode('signin'),
            },
          ]
        );
      } else {
        Alert.alert(t('error'), response.message);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign up failed';
      Alert.alert(t('error'), message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert(t('error'), 'Please enter email and password');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await authService.signInWithEmail(email, password);
      
      if (response.success && response.user) {
        const userData = {
          id: response.user.id,
          email: response.user.email,
          displayName: response.user.displayName,
          username: response.user.displayName.toLowerCase().replace(/\s+/g, ''),
          emailVerified: response.user.emailVerified,
          phoneVerified: false,
        };
        
        await login(userData);
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('gender, age, city')
          .eq('user_id', response.user.id)
          .single();
        
        const isComplete = profile && profile.gender && profile.age && profile.city;
        router.replace("/(tabs)/home");
      } else {
        Alert.alert(t('error'), response.message);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign in failed';
      Alert.alert(t('error'), message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (!email) {
      Alert.alert(t('error'), 'Please enter your email');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await authService.signInWithOTP(email);
      
      if (response.success) {
        Alert.alert('Magic link sent', `${response.message}\n\nPlease open the link from your email on this device.`, [
          {
            text: 'OK',
            onPress: () => setMode('signin'),
          },
        ]);
      } else {
        Alert.alert(t('error'), response.message);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send OTP';
      Alert.alert(t('error'), message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!email || !otpCode) {
      Alert.alert(t('error'), 'Please enter the verification code');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await authService.verifyOTP(email, otpCode);
      
      if (response.success && response.user) {
        const userData = {
          id: response.user.id,
          email: response.user.email,
          displayName: response.user.displayName,
          username: response.user.displayName.toLowerCase().replace(/\s+/g, ''),
          emailVerified: response.user.emailVerified,
          phoneVerified: false,
        };
        
        await login(userData);
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('gender, age, city')
          .eq('user_id', response.user.id)
          .single();
        
        const isComplete = profile && profile.gender && profile.age && profile.city;
        router.replace("/(tabs)/home");
      } else {
        Alert.alert(t('error'), response.message);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Verification failed';
      Alert.alert(t('error'), message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert(t('error'), 'Please enter your email');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await authService.resetPassword(email);
      
      if (response.success) {
        Alert.alert(
          'Success',
          response.message,
          [
            {
              text: 'OK',
              onPress: () => setMode('signin'),
            },
          ]
        );
      } else {
        Alert.alert(t('error'), response.message);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send reset email';
      Alert.alert(t('error'), message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    
    try {
      const response = await authService.signInWithGoogle();
      
      if (response.success && response.user) {
        const userData = {
          id: response.user.id,
          email: response.user.email,
          displayName: response.user.displayName,
          username: response.user.displayName.toLowerCase().replace(/\s+/g, ''),
          emailVerified: response.user.emailVerified,
          phoneVerified: false,
        };
        
        await login(userData);
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('gender, age, city')
          .eq('user_id', response.user.id)
          .single();
        
        const isComplete = profile && profile.gender && profile.age && profile.city;
        router.replace("/(tabs)/home");
      } else if (!response.success && response.message !== 'Redirecting to Google...') {
        Alert.alert(t('error'), response.message);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google sign in failed';
      Alert.alert(t('error'), message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTwitchSignIn = async () => {
    setIsLoading(true);
    
    try {
      const response = await authService.signInWithTwitch();
      
      if (response.success && response.user) {
        const userData = {
          id: response.user.id,
          email: response.user.email,
          displayName: response.user.displayName,
          username: response.user.displayName.toLowerCase().replace(/\s+/g, ''),
          emailVerified: response.user.emailVerified,
          phoneVerified: false,
        };
        
        await login(userData);
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('gender, age, city')
          .eq('user_id', response.user.id)
          .single();
        
        const isComplete = profile && profile.gender && profile.age && profile.city;
        router.replace("/(tabs)/home");
      } else if (!response.success && response.message !== 'Redirecting to Twitch...') {
        Alert.alert(t('error'), response.message);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Twitch sign in failed';
      Alert.alert(t('error'), message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTwitterSignIn = async () => {
    setIsLoading(true);
    
    try {
      const response = await authService.signInWithTwitter();
      
      if (response.success && response.user) {
        const userData = {
          id: response.user.id,
          email: response.user.email,
          displayName: response.user.displayName,
          username: response.user.displayName.toLowerCase().replace(/\s+/g, ''),
          emailVerified: response.user.emailVerified,
          phoneVerified: false,
        };
        
        await login(userData);
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('gender, age, city')
          .eq('user_id', response.user.id)
          .single();
        
        const isComplete = profile && profile.gender && profile.age && profile.city;
        router.replace("/(tabs)/home");
      } else if (!response.success && response.message !== 'Redirecting to Twitter...') {
        Alert.alert(t('error'), response.message);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Twitter sign in failed';
      Alert.alert(t('error'), message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderSignInForm = () => (
    <View style={styles.form}>
      <View style={styles.inputContainer}>
        <Mail color="#888" size={20} />
        <TextInput
          testID="email-input"
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isLoading}
          autoCorrect={false}
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Lock color="#888" size={20} />
        <TextInput
          testID="password-input"
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          editable={!isLoading}
          autoCorrect={false}
        />
        <Pressable
          onPress={() => setShowPassword(!showPassword)}
          style={styles.eyeButton}
          disabled={isLoading}
        >
          {showPassword ? (
            <EyeOff color="#888" size={20} />
          ) : (
            <Eye color="#888" size={20} />
          )}
        </Pressable>
      </View>
      
      <Pressable
        testID="signin-button"
        style={({ pressed }) => [
          styles.authButton,
          pressed && styles.buttonPressed,
        ]}
        onPress={handleSignIn}
        disabled={isLoading || !email || !password}
      >
        <LinearGradient
          colors={["#6a11cb", "#2575fc"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.authButtonGradient}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.authButtonText}>Sign In</Text>
          )}
        </LinearGradient>
      </Pressable>
      
      <Pressable
        style={styles.forgotPasswordButton}
        onPress={() => setMode('reset')}
        disabled={isLoading}
      >
        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
      </Pressable>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      <Pressable
        testID="google-button"
        style={({ pressed }) => [
          styles.googleButton,
          pressed && styles.buttonPressed,
        ]}
        onPress={handleGoogleSignIn}
        disabled={isLoading}
      >
        <Chrome color="white" size={20} />
        <Text style={styles.googleButtonText}>Continue with Google</Text>
      </Pressable>

      <Pressable
        testID="twitch-button"
        style={({ pressed }) => [
          styles.twitchButton,
          pressed && styles.buttonPressed,
        ]}
        onPress={handleTwitchSignIn}
        disabled={isLoading}
      >
        <Twitch color="white" size={20} />
        <Text style={styles.twitchButtonText}>Continue with Twitch</Text>
      </Pressable>

      <Pressable
        testID="twitter-button"
        style={({ pressed }) => [
          styles.twitterButton,
          pressed && styles.buttonPressed,
        ]}
        onPress={handleTwitterSignIn}
        disabled={isLoading}
      >
        <MessageCircle color="white" size={20} />
        <Text style={styles.twitterButtonText}>Continue with X</Text>
      </Pressable>

      <Pressable
        testID="otp-button"
        style={({ pressed }) => [
          styles.secondaryButton,
          pressed && styles.buttonPressed,
        ]}
        onPress={() => setMode('otp')}
        disabled={isLoading}
      >
        <Key color="#6a11cb" size={20} />
        <Text style={styles.secondaryButtonText}>Sign in with Magic Link</Text>
      </Pressable>
      
      <Pressable
        style={styles.switchButton}
        onPress={() => {
          setMode('signup');
          setPassword('');
        }}
        disabled={isLoading}
      >
        <Text style={styles.switchText}>
          Don&apos;t have an account?
          <Text style={styles.switchLink}> Sign Up</Text>
        </Text>
      </Pressable>
    </View>
  );

  const renderSignUpForm = () => (
    <View style={styles.form}>
      <View style={styles.inputContainer}>
        <User color="#888" size={20} />
        <TextInput
          testID="displayname-input"
          style={styles.input}
          placeholder="Display Name"
          placeholderTextColor="#888"
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
          editable={!isLoading}
          autoCorrect={false}
        />
      </View>

      <View style={styles.inputContainer}>
        <Mail color="#888" size={20} />
        <TextInput
          testID="email-input"
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isLoading}
          autoCorrect={false}
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Lock color="#888" size={20} />
        <TextInput
          testID="password-input"
          style={styles.input}
          placeholder="Password (min 6 characters)"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          editable={!isLoading}
          autoCorrect={false}
        />
        <Pressable
          onPress={() => setShowPassword(!showPassword)}
          style={styles.eyeButton}
          disabled={isLoading}
        >
          {showPassword ? (
            <EyeOff color="#888" size={20} />
          ) : (
            <Eye color="#888" size={20} />
          )}
        </Pressable>
      </View>
      
      <Pressable
        testID="signup-button"
        style={({ pressed }) => [
          styles.authButton,
          pressed && styles.buttonPressed,
        ]}
        onPress={handleSignUp}
        disabled={isLoading || !email || !password || !displayName}
      >
        <LinearGradient
          colors={["#6a11cb", "#2575fc"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.authButtonGradient}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.authButtonText}>Create Account</Text>
          )}
        </LinearGradient>
      </Pressable>
      
      <Pressable
        style={styles.switchButton}
        onPress={() => {
          setMode('signin');
          setPassword('');
          setDisplayName('');
        }}
        disabled={isLoading}
      >
        <Text style={styles.switchText}>
          Already have an account?
          <Text style={styles.switchLink}> Sign In</Text>
        </Text>
      </Pressable>
    </View>
  );

  const renderResetForm = () => (
    <View style={styles.form}>
      <Text style={styles.resetDescription}>
        Enter your email address and we&apos;ll send you a link to reset your password.
      </Text>

      <View style={styles.inputContainer}>
        <Mail color="#888" size={20} />
        <TextInput
          testID="email-input"
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isLoading}
          autoCorrect={false}
        />
      </View>
      
      <Pressable
        testID="reset-button"
        style={({ pressed }) => [
          styles.authButton,
          pressed && styles.buttonPressed,
        ]}
        onPress={handleResetPassword}
        disabled={isLoading || !email}
      >
        <LinearGradient
          colors={["#6a11cb", "#2575fc"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.authButtonGradient}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.authButtonText}>Send Reset Link</Text>
          )}
        </LinearGradient>
      </Pressable>
      
      <Pressable
        style={styles.backButton}
        onPress={() => setMode('signin')}
        disabled={isLoading}
      >
        <Text style={styles.backButtonText}>Back to Sign In</Text>
      </Pressable>
    </View>
  );

  const renderOTPForm = () => (
    <View style={styles.form}>
      <Text style={styles.resetDescription}>
        Enter your email and we&apos;ll send you a magic link to sign in.
      </Text>

      <View style={styles.inputContainer}>
        <Mail color="#888" size={20} />
        <TextInput
          testID="email-input"
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isLoading}
          autoCorrect={false}
        />
      </View>
      
      <Pressable
        testID="send-otp-button"
        style={({ pressed }) => [
          styles.authButton,
          pressed && styles.buttonPressed,
        ]}
        onPress={handleSendOTP}
        disabled={isLoading || !email}
      >
        <LinearGradient
          colors={["#6a11cb", "#2575fc"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.authButtonGradient}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.authButtonText}>Send Magic Link</Text>
          )}
        </LinearGradient>
      </Pressable>
      
      <Pressable
        style={styles.backButton}
        onPress={() => setMode('signin')}
        disabled={isLoading}
      >
        <Text style={styles.backButtonText}>Back to Sign In</Text>
      </Pressable>
    </View>
  );

  const renderVerifyOTPForm = () => (
    <View style={styles.form}>
      <Text style={styles.resetDescription}>
        Enter the 6-digit code from your email.
      </Text>

      <View style={styles.codeInputContainer}>
        <TextInput
          testID="otp-code-input"
          style={styles.codeInput}
          placeholder="000000"
          placeholderTextColor="#888"
          value={otpCode}
          onChangeText={setOtpCode}
          keyboardType="number-pad"
          maxLength={6}
          textAlign="center"
          editable={!isLoading}
          autoCorrect={false}
        />
      </View>
      
      <Pressable
        testID="verify-otp-button"
        style={({ pressed }) => [
          styles.authButton,
          pressed && styles.buttonPressed,
        ]}
        onPress={handleVerifyOTP}
        disabled={isLoading || otpCode.length !== 6}
      >
        <LinearGradient
          colors={["#6a11cb", "#2575fc"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.authButtonGradient}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.authButtonText}>Verify Code</Text>
          )}
        </LinearGradient>
      </Pressable>

      <Pressable
        style={styles.resendButton}
        onPress={handleSendOTP}
        disabled={isLoading}
      >
        <Text style={styles.resendButtonText}>Resend Code</Text>
      </Pressable>
      
      <Pressable
        style={styles.backButton}
        onPress={() => setMode('otp')}
        disabled={isLoading}
      >
        <Text style={styles.backButtonText}>Back</Text>
      </Pressable>
    </View>
  );

  const getHeaderTitle = () => {
    switch (mode) {
      case 'signin': return 'Welcome Back';
      case 'signup': return 'Create Account';
      case 'reset': return 'Reset Password';
      case 'otp': return 'Magic Link';
      case 'verify-otp': return 'Verify Code';
      default: return 'Welcome';
    }
  };

  const getHeaderSubtitle = () => {
    switch (mode) {
      case 'signin': return 'Sign in to continue';
      case 'signup': return 'Join the community';
      case 'reset': return 'Recover your account';
      case 'otp': return 'Sign in without password';
      case 'verify-otp': return 'Check your email';
      default: return '';
    }
  };


        // Splash Screen Component - Daha profesyonel ve hızlı
        const SplashScreen = () => (
          <View style={styles.splashContainer}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.splashGradient}
            >
              <Animated.View
                style={[
                  styles.splashContent,
                  {
                    opacity: fadeAnim,
                    transform: [
                      { scale: scaleAnim },
                      { translateY: slideAnim }
                    ],
                  },
                ]}
              >
                <Animated.View
                  style={[
                    styles.logoContainer,
                    {
                      transform: [{ scale: pulseAnim }],
                    },
                  ]}
                >
                  <View style={styles.logoCircle}>
                    <Video color="white" size={32} />
                  </View>
                </Animated.View>

                <Text style={styles.splashTitle}>LUMI</Text>
                <Text style={styles.splashSubtitle}>Global Video Friends</Text>

                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="white" />
                </View>
              </Animated.View>
            </LinearGradient>
          </View>
        );

  // Floating Icon Component
  const FloatingIcon = ({ icon: Icon, index, style }: { icon: any; index: number; style: any }) => {
    const translateY = floatingAnims[index].interpolate({
      inputRange: [0, 1],
      outputRange: [0, -30],
    });

    const rotate = floatingAnims[index].interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '15deg'],
    });

    const opacity = floatingAnims[index].interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.3, 0.7, 0.3],
    });

    return (
      <Animated.View
        style={[
          styles.floatingIcon,
          style,
          {
            transform: [{ translateY }, { rotate }],
            opacity,
          },
        ]}
      >
        <Icon color="rgba(255, 255, 255, 0.4)" size={24} />
      </Animated.View>
    );
  };

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      >
        {/* Floating Background Icons */}
        <FloatingIcon icon={Video} index={0} style={{ top: 100, left: 50 }} />
        <FloatingIcon icon={Heart} index={1} style={{ top: 150, right: 60 }} />
        <FloatingIcon icon={Users} index={2} style={{ top: 200, left: 30 }} />
        <FloatingIcon icon={Camera} index={3} style={{ top: 250, right: 40 }} />
        <FloatingIcon icon={Mic} index={4} style={{ top: 300, left: 70 }} />
        <FloatingIcon icon={Star} index={5} style={{ top: 350, right: 20 }} />
        <FloatingIcon icon={Zap} index={0} style={{ top: 400, left: 80 }} />
        <FloatingIcon icon={Sparkles} index={1} style={{ top: 450, right: 80 }} />

        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.keyboardView}
          >
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <Animated.View 
                style={[
                  styles.content,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                <View style={styles.card}>
                  <View style={styles.header}>
                    <Animated.View
                      style={[
                        styles.logoContainer,
                        {
                          transform: [{ scale: pulseAnim }],
                        },
                      ]}
                    >
                      <View style={styles.logoCircle}>
                        <Video color="white" size={32} />
                      </View>
                    </Animated.View>
                    <Text style={styles.logoText}>LUMI</Text>
                    <Text style={styles.tagline}>Global Video Friends</Text>
                    <Text style={styles.subtitle}>{getHeaderTitle()}</Text>
                    <Text style={styles.description}>{getHeaderSubtitle()}</Text>
                  </View>

                  {mode === 'signin' && renderSignInForm()}
                  {mode === 'signup' && renderSignUpForm()}
                  {mode === 'reset' && renderResetForm()}
                  {mode === 'otp' && renderOTPForm()}
                  {mode === 'verify-otp' && renderVerifyOTPForm()}

                  <View style={styles.legalLinks}>
                    <Link href="/privacy" asChild>
                      <Pressable>
                        <Text style={styles.legalText}>Privacy Policy</Text>
                      </Pressable>
                    </Link>
                    <Text style={styles.legalDivider}>•</Text>
                    <Link href="/terms" asChild>
                      <Pressable>
                        <Text style={styles.legalText}>Terms of Service</Text>
                      </Pressable>
                    </Link>
                  </View>
                </View>
              </Animated.View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  // Splash Screen Styles
  splashContainer: {
    flex: 1,
  },
  splashGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: 30,
  },
        logoCircle: {
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 2,
          borderColor: 'rgba(255, 255, 255, 0.2)',
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        },
        splashTitle: {
          fontSize: 36,
          fontWeight: '800',
          color: 'white',
          letterSpacing: 1.5,
          marginBottom: 8,
          textShadowColor: 'rgba(0, 0, 0, 0.3)',
          textShadowOffset: { width: 0, height: 2 },
          textShadowRadius: 4,
        },
        splashSubtitle: {
          fontSize: 16,
          color: 'rgba(255, 255, 255, 0.9)',
          fontWeight: '500',
          marginBottom: 30,
          textAlign: 'center',
        },
        loadingContainer: {
          alignItems: 'center',
          justifyContent: 'center',
        },

  // Main Container Styles
  container: {
    flex: 1,
  },
  backgroundGradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    minHeight: Platform.OS === 'web' ? height - 100 : undefined,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 28,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoText: {
    fontSize: 36,
    fontWeight: "800" as const,
    color: "#667eea",
    letterSpacing: 1,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: "#667eea",
    marginBottom: 20,
    fontWeight: "600" as const,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  floatingIcon: {
    position: 'absolute',
    zIndex: 1,
  },
  form: {
    gap: 16,
  },
  resetDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: Platform.OS === 'ios' ? 18 : 16,
    gap: 14,
    borderWidth: 2,
    borderColor: "rgba(102, 126, 234, 0.2)",
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    fontWeight: '500',
  },
  eyeButton: {
    padding: 4,
  },
  codeInputContainer: {
    marginBottom: 8,
  },
  codeInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    fontSize: 24,
    fontWeight: "600" as const,
    color: "#333",
    letterSpacing: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  authButton: {
    marginTop: 20,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  authButtonGradient: {
    borderRadius: 18,
    paddingVertical: 20,
    alignItems: "center",
  },
  authButtonText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "white",
    letterSpacing: 0.5,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 14,
    paddingVertical: 18,
    gap: 8,
    borderWidth: 2,
    borderColor: "#e9ecef",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#6a11cb",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e0e0e0",
  },
  dividerText: {
    color: "#999",
    paddingHorizontal: 16,
    fontSize: 14,
  },
  forgotPasswordButton: {
    alignItems: "center",
    marginTop: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: "#6a11cb",
    fontWeight: "500" as const,
  },
  resendButton: {
    alignItems: "center",
    marginTop: 8,
  },
  resendButtonText: {
    fontSize: 14,
    color: "#6a11cb",
    fontWeight: "500" as const,
  },
  backButton: {
    alignItems: "center",
    marginTop: 8,
  },
  backButtonText: {
    fontSize: 14,
    color: "#999",
    fontWeight: "500" as const,
  },
  switchButton: {
    alignItems: "center",
    marginTop: 24,
  },
  switchText: {
    fontSize: 14,
    color: "#666",
  },
  switchLink: {
    color: "#6a11cb",
    fontWeight: "600" as const,
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  legalText: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'underline',
  },
  legalDivider: {
    fontSize: 12,
    color: '#ccc',
    marginHorizontal: 8,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4285F4",
    borderRadius: 16,
    paddingVertical: 18,
    gap: 10,
    shadowColor: '#4285F4',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "white",
  },
  twitchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#9146FF",
    borderRadius: 16,
    paddingVertical: 18,
    gap: 10,
    shadowColor: '#9146FF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  twitchButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "white",
  },
  twitterButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1DA1F2",
    borderRadius: 16,
    paddingVertical: 18,
    gap: 10,
    shadowColor: '#1DA1F2',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  twitterButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "white",
  },
});
