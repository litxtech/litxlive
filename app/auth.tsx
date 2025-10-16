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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Mail, Lock, User, Eye, EyeOff, Key, Chrome, Globe, MessageCircle, Users, Shield, Heart, Sparkles, Video, Twitch } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { router, Link } from "expo-router";
import { useUser } from "@/providers/UserProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { authService } from "@/services/auth";

const { width, height } = Dimensions.get('window');

type AuthMode = 'signin' | 'signup' | 'reset' | 'otp' | 'verify-otp';

export default function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('signin');
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [otpCode, setOtpCode] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useUser();
  const { t } = useLanguage();

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

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  const floatingAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

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
  }, []);

  const FloatingIcon = ({ icon: Icon, index, style }: { icon: any; index: number; style: any }) => {
    const translateY = floatingAnims[index].interpolate({
      inputRange: [0, 1],
      outputRange: [0, -20],
    });

    const rotate = floatingAnims[index].interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '10deg'],
    });

    return (
      <Animated.View
        style={[
          styles.floatingIcon,
          style,
          {
            transform: [{ translateY }, { rotate }],
          },
        ]}
      >
        <Icon color="rgba(255, 255, 255, 0.3)" size={28} />
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
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
                  <View style={styles.logoWrapper}>
                    <Text style={styles.logoText}>Lumi</Text>
                  </View>
                  <Text style={styles.tagline}>Meet. Chat. Connect. Worldwide.</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoText: {
    fontSize: 40,
    fontWeight: "700" as const,
    color: "#6a11cb",
    letterSpacing: -1,
  },
  logoAccent: {
    fontSize: 40,
    fontWeight: "700" as const,
    color: "#2575fc",
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 15,
    color: "#666",
    marginBottom: 20,
    fontWeight: "500" as const,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#333",
    marginBottom: 6,
    textAlign: "center",
  },
  description: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
  },
  floatingIcon: {
    position: 'absolute',
    opacity: 0.7,
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
    backgroundColor: "#f8f9fa",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 16 : 14,
    gap: 12,
    borderWidth: 2,
    borderColor: "#e9ecef",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
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
    marginTop: 16,
    borderRadius: 14,
    overflow: 'hidden',
  },
  authButtonGradient: {
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
  },
  authButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "white",
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
    borderRadius: 14,
    paddingVertical: 18,
    gap: 8,
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
    borderRadius: 14,
    paddingVertical: 18,
    gap: 8,
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
    borderRadius: 14,
    paddingVertical: 18,
    gap: 8,
  },
  twitterButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "white",
  },
});
