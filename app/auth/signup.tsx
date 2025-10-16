import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Mail, Lock, Phone, Calendar, MapPin, Eye, EyeOff, ChevronDown, CheckCircle2, XCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import { authService } from '@/services/auth';
import { COUNTRIES, CITIES_BY_COUNTRY } from '@/constants/countries';

import { useLanguage } from '@/providers/LanguageProvider';

type SignupStep = 'personal' | 'contact' | 'password';

export default function SignupScreen() {
  const { currentLanguage } = useLanguage();
  const [step, setStep] = useState<SignupStep>('personal'); // keeping local steps for UX, but Step-2 lives on /auth/signup/credentials
  const [isLoading, setIsLoading] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState<string>('');
  const [showDateSheet, setShowDateSheet] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [tempYear, setTempYear] = useState<number>(2000);
  const [tempMonth, setTempMonth] = useState<number>(1);
  const [tempDay, setTempDay] = useState<number>(1);
  const dobISO = useMemo<string>(() => {
    if (!selectedDate) return '';
    const y = selectedDate.getUTCFullYear();
    const m = String(selectedDate.getUTCMonth() + 1).padStart(2, '0');
    const d = String(selectedDate.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [selectedDate]);
  const dobDisplay = useMemo<string>(() => {
    if (!selectedDate) return '';
    const y = selectedDate.getUTCFullYear();
    const m = String(selectedDate.getUTCMonth() + 1).padStart(2, '0');
    const d = String(selectedDate.getUTCDate()).padStart(2, '0');
    if (currentLanguage === 'tr') return `${d}.${m}.${y}`;
    return `${y}-${m}-${d}`;
  }, [selectedDate, currentLanguage]);
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneCountryCode, setPhoneCountryCode] = useState('+90');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const isValidDobISO = (value: string): boolean => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    return regex.test(value);
  };

  const computeAgeFromDobISO = (value: string): number | null => {
    if (!isValidDobISO(value)) return null;
    const [yyyy, mm, dd] = value.split('-').map((v) => parseInt(v, 10));
    const dobUTC = Date.UTC(yyyy, mm - 1, dd, 12, 0, 0);
    if (Number.isNaN(dobUTC)) return null;
    const now = new Date();
    const nowUTC = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      12,
      0,
      0
    );
    const years = Math.floor((nowUTC - dobUTC) / (365.2425 * 24 * 60 * 60 * 1000));
    return years;
  };

  const personalReady = useMemo<boolean>(() => {
    if (!firstName.trim() || !lastName.trim()) return false;
    if (!country) return false;
    if (!city.trim()) return false;
    if (!dobISO) return false;
    if (!isValidDobISO(dobISO)) return false;
    const a = computeAgeFromDobISO(dobISO);
    return a !== null && a >= 18;
  }, [firstName, lastName, country, city, dobISO]);

  const validatePersonalInfo = (): boolean => {
    setErrorBanner(null);
    const nameRegex = /^[A-Za-zÀ-žĞÜŞİÖÇğüşiöç\s]{2,50}$/;
    if (!nameRegex.test(firstName.trim()) || !nameRegex.test(lastName.trim())) {
      setErrorBanner('Invalid first/last name');
      return false;
    }

    if (!dobISO) {
      setErrorBanner('Select a valid date');
      return false;
    }

    if (!isValidDobISO(dobISO)) {
      setErrorBanner('Select a valid date');
      return false;
    }

    const actualAge = computeAgeFromDobISO(dobISO);
    if (actualAge === null) {
      setErrorBanner('Select a valid date');
      return false;
    }

    if (actualAge < 18) {
      setErrorBanner('Users under 18 are not accepted.');
      return false;
    }

    if (!country) {
      setErrorBanner('Please select your country');
      return false;
    }

    if (!city.trim()) {
      setErrorBanner('Please enter your city');
      return false;
    }

    return true;
  };

  const validateContactInfo = (): boolean => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    if (!phone.trim() || phone.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return false;
    }

    return true;
  };

  const validatePassword = (): boolean => {
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return false;
    }

    if (!/[A-Z]/.test(password)) {
      Alert.alert('Error', 'Password must contain at least one uppercase letter');
      return false;
    }

    if (!/[0-9]/.test(password)) {
      Alert.alert('Error', 'Password must contain at least one number');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    return true;
  };

  const isValidDate = (_dateString: string): boolean => {
    return true;
  };

  const submitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const handleNext = async () => {
    if (isSubmitting || isLoading) return;
    setIsSubmitting(true);
    if (submitTimerRef.current) {
      clearTimeout(submitTimerRef.current);
      submitTimerRef.current = null;
    }
    submitTimerRef.current = setTimeout(async () => {
      if (step === 'personal') {
        console.log('[telemetry] signup_step1_submit');
        if (!validatePersonalInfo()) {
          setIsSubmitting(false);
          console.log('[telemetry] signup_step1_error(validation)');
          return;
        }
        try {
          setIsLoading(true);
          const payload = {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            dob: dobISO,
            country_iso2: COUNTRIES.find((c) => c.name === country)?.code ?? '',
            city_name: city.trim(),
            lang: currentLanguage,
          };
          console.log('[Signup] Step-1 save locally', payload);
          try {
            const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
            await AsyncStorage.setItem('signup_step1_v2', JSON.stringify(payload));
          } catch (err) {
            console.log('local save failed', err);
          }
          if (typeof window !== 'undefined' && window?.sessionStorage) {
            try {
              window.sessionStorage.setItem('signup_step1_v2', JSON.stringify(payload));
              const encoder = new TextEncoder();
              const data = encoder.encode(JSON.stringify(payload));
              if (window.crypto?.subtle) {
                const digest = await window.crypto.subtle.digest('SHA-256', data);
                const hashArray = Array.from(new Uint8Array(digest));
                const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                router.replace({ pathname: '/auth/signup/credentials', params: { s: hashHex.slice(0, 16) } });
              } else {
                router.replace('/auth/signup/credentials');
              }
            } catch (err) {
              console.log('sessionStorage failed', err);
              router.replace('/auth/signup/credentials');
            }
          } else {
            router.replace('/auth/signup/credentials');
          }
          console.log('[telemetry] signup_step1_success');
          setSuccessToast('Information saved. You can continue.');
        } catch (e) {
          console.error('[Signup] personal submit error', e);
          setErrorBanner('Connection error, please try again.');
          console.log('[telemetry] signup_step1_error(network-ex)');
        } finally {
          setIsLoading(false);
          setIsSubmitting(false);
        }
      } else if (step === 'contact') {
        if (validateContactInfo()) {
          setStep('password');
        }
        setIsSubmitting(false);
      } else {
        setIsSubmitting(false);
      }
    }, 600);
    
  };

  const handleBack = () => {
    if (step === 'contact') {
      setStep('personal');
    } else if (step === 'password') {
      setStep('contact');
    }
  };

  const handleSignup = async () => {
    if (!validatePassword()) return;

    setIsLoading(true);

    try {
      console.log('[Signup] Starting signup process...');
      
      const displayName = `${firstName} ${lastName}`;
      const response = await authService.signUpWithEmail(email, password, displayName);

      if (response.success) {
        console.log('[Signup] Account created successfully');
        
        try {
          if (typeof window !== 'undefined' && window.sessionStorage) {
            window.sessionStorage.setItem('signup_email', email);
          }
          const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
          await AsyncStorage.setItem('signup_email', email);
        } catch (e) {
          console.log('[Signup] could not persist signup_email', e);
        }

        Alert.alert(
          'Success!',
          'Verification email sent. Please check your inbox.',
          [
            {
              text: 'Open Verify Page',
              onPress: () => router.replace('/auth/verify-email'),
            },
          ]
        );
      } else {
        console.error('[Signup] Signup failed:', response.message);
        Alert.alert('Error', response.message || 'Signup failed');
      }
    } catch (error) {
      console.error('[Signup] Exception:', error);
      const message = error instanceof Error ? error.message : 'Signup failed';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCountry = COUNTRIES.find(c => c.name === country);
  const computedAge = useMemo<number | null>(() => computeAgeFromDobISO(dobISO), [dobISO]);
  React.useEffect(() => {
    if (computedAge !== null) {
      setAge(String(computedAge));
    }
  }, [computedAge]);
  const selectedCountryCode = selectedCountry?.code || '';
  const availableCities = country && selectedCountryCode && CITIES_BY_COUNTRY[selectedCountryCode] 
    ? CITIES_BY_COUNTRY[selectedCountryCode]
    : [];

  const renderPersonalInfo = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Personal Information</Text>
      <Text style={styles.stepDescription}>Tell us about yourself</Text>

      <View style={styles.row}>
        <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
          <User color="#888" size={20} />
          <TextInput
            style={styles.input}
            placeholder="First Name"
            placeholderTextColor="#888"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
            editable={!isLoading}
          />
        </View>

        <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
          <User color="#888" size={20} />
          <TextInput
            style={styles.input}
            placeholder="Last Name"
            placeholderTextColor="#888"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
            editable={!isLoading}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]} testID="ageDisplay">
          <Calendar color="#888" size={20} />
          <Text style={styles.input}>
            {computedAge !== null ? `Age: ${computedAge}` : 'Age (auto)'}
          </Text>
        </View>

        <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
          <Calendar color="#888" size={20} />
          <TouchableOpacity
            accessibilityLabel="Birth date selector"
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            onPress={() => {
              // initialize temp pickers from selected or default
              const now = new Date();
              const max = new Date(Date.UTC(now.getUTCFullYear() - 18, now.getUTCMonth(), now.getUTCDate()));
              const base = selectedDate ?? max;
              setTempYear(base.getUTCFullYear());
              setTempMonth(base.getUTCMonth() + 1);
              setTempDay(base.getUTCDate());
              setShowDateSheet(true);
            }}
            disabled={isLoading}
            testID="dobField"
          >
            <Text style={[styles.input, !dobDisplay && styles.placeholder]}>{dobDisplay || (currentLanguage === 'tr' ? 'DD.MM.YYYY' : 'YYYY-MM-DD')}</Text>
            <ChevronDown color="#888" size={16} />
          </TouchableOpacity>
        </View>
      </View>

      {!!dobDisplay && (
        <Text style={{ color: '#666', fontSize: 12 }}>Age: {computedAge ?? '—'}</Text>
      )}

      <TouchableOpacity
        style={styles.inputContainer}
        onPress={() => setShowCountryPicker(true)}
        disabled={isLoading}
      >
        <MapPin color="#888" size={20} />
        <Text style={[styles.input, !country && styles.placeholder]}>
          {country ? `${selectedCountry?.flag} ${country}` : 'Select Country'}
        </Text>
        <ChevronDown color="#888" size={20} />
      </TouchableOpacity>

      {country && (
        <TouchableOpacity
          style={styles.inputContainer}
          onPress={() => setShowCityPicker(true)}
          disabled={isLoading}
        >
          <MapPin color="#888" size={20} />
          <Text style={[styles.input, !city && styles.placeholder]}>
            {city || 'Select City'}
          </Text>
          <ChevronDown color="#888" size={20} />
        </TouchableOpacity>
      )}

      {country && availableCities.length === 0 && (
        <View style={styles.inputContainer}>
          <MapPin color="#888" size={20} />
          <TextInput
            style={styles.input}
            placeholder="Enter City"
            placeholderTextColor="#888"
            value={city}
            onChangeText={setCity}
            autoCapitalize="words"
            editable={!isLoading}
          />
        </View>
      )}
    </View>
  );

  const renderContactInfo = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Contact Information</Text>
      <Text style={styles.stepDescription}>How can we reach you?</Text>

      <View style={styles.inputContainer}>
        <Mail color="#888" size={20} />
        <TextInput
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

      <View style={styles.phoneContainer}>
        <TouchableOpacity
          style={styles.countryCodeButton}
          onPress={() => setShowCountryPicker(true)}
          disabled={isLoading}
        >
          <Text style={styles.countryCodeText}>{phoneCountryCode}</Text>
          <ChevronDown color="#888" size={16} />
        </TouchableOpacity>

        <View style={[styles.inputContainer, { flex: 1 }]}>
          <Phone color="#888" size={20} />
          <TextInput
            style={styles.input}
            placeholder="5xx xxx xx xx"
            placeholderTextColor="#888"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            editable={!isLoading}
          />
        </View>
      </View>
    </View>
  );

  const renderPasswordInfo = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Create Password</Text>
      <Text style={styles.stepDescription}>Secure your account</Text>

      <View style={styles.inputContainer}>
        <Lock color="#888" size={20} />
        <TextInput
          style={styles.input}
          placeholder="Password (min 8 characters)"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          editable={!isLoading}
          autoCorrect={false}
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={styles.eyeButton}
          disabled={isLoading}
        >
          {showPassword ? (
            <EyeOff color="#888" size={20} />
          ) : (
            <Eye color="#888" size={20} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <Lock color="#888" size={20} />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#888"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
          editable={!isLoading}
          autoCorrect={false}
        />
        <TouchableOpacity
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          style={styles.eyeButton}
          disabled={isLoading}
        >
          {showConfirmPassword ? (
            <EyeOff color="#888" size={20} />
          ) : (
            <Eye color="#888" size={20} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.passwordRequirements}>
        <Text style={styles.requirementText}>Password must contain:</Text>
        <Text style={[styles.requirementItem, password.length >= 8 && styles.requirementMet]}>
          • At least 8 characters
        </Text>
        <Text style={[styles.requirementItem, /[A-Z]/.test(password) && styles.requirementMet]}>
          • One uppercase letter
        </Text>
        <Text style={[styles.requirementItem, /[0-9]/.test(password) && styles.requirementMet]}>
          • One number
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6a11cb', '#2575fc']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.card}>
              <View style={styles.header}>
                <View style={styles.logoWrapper}>
                  <Text style={styles.logoText}>Lumi</Text>
                </View>
                <Text style={styles.tagline}>Meet. Chat. Connect. Worldwide.</Text>
                <Text style={styles.subtitle}>Create Account</Text>
                <Text style={styles.description}>Join the community</Text>
              </View>

              <View style={styles.progressBar}>
                <View style={[styles.progressStep, step !== 'personal' && styles.progressStepActive]} />
                <View style={[styles.progressStep, step === 'password' && styles.progressStepActive]} />
                <View style={[styles.progressStep, step === 'password' && styles.progressStepActive]} />
              </View>

              {errorBanner && (
                <View style={styles.errorBanner} testID="errorBanner">
                  <Text style={styles.errorBannerText}>{errorBanner}</Text>
                </View>
              )}
              {successToast && (
                <View style={styles.successToast} testID="successToast">
                  <Text style={styles.successToastText}>{successToast}</Text>
                </View>
              )}

              {step === 'personal' && renderPersonalInfo()}
              {step === 'contact' && renderContactInfo()}
              {step === 'password' && renderPasswordInfo()}

              <View style={styles.buttonContainer}>
                {step !== 'personal' && (
                  <TouchableOpacity
                    style={[styles.button, styles.backButton]}
                    onPress={handleBack}
                    disabled={isLoading}
                  >
                    <Text style={styles.backButtonText}>Back</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.button, styles.nextButton, step === 'personal' && { flex: 1, opacity: personalReady ? 1 : 0.6 }]}
                  onPress={step === 'password' ? handleSignup : handleNext}
                  disabled={isLoading || (step === 'personal' && !personalReady)}
                  testID="nextButton"
                >
                  <LinearGradient
                    colors={['#6a11cb', '#2575fc']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={styles.buttonText}>
                        {step === 'password' ? (currentLanguage === 'tr' ? 'Hesap Oluştur' : 'Create Account') : currentLanguage === 'tr' ? 'Devam' : 'Next'}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.switchButton}
                onPress={() => router.back()}
                disabled={isLoading}
              >
                <Text style={styles.switchText}>
                  Already have an account?
                  <Text style={styles.switchLink}> Sign In</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={showCountryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Country</Text>
            <FlatList
              data={COUNTRIES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setCountry(item.name);
                    setPhoneCountryCode(`+${item.code === 'TR' ? '90' : item.code === 'US' ? '1' : '44'}`);
                    setCity('');
                    setShowCountryPicker(false);
                  }}
                >
                  <Text style={styles.modalItemText}>
                    {item.flag} {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCountryPicker(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCityPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCityPicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select City</Text>
            <FlatList
              data={availableCities}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setCity(item);
                    setShowCityPicker(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCityPicker(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        visible={showDateSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDateSheet(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { paddingBottom: 0 }]}>            
            <Text style={styles.modalTitle}>Select your birth date</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 8, height: 280 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.pickerLabel}>Day</Text>
                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((item) => (
                    <TouchableOpacity key={`d-${item}`} style={styles.modalItem} onPress={() => setTempDay(item)}>
                      <Text style={[styles.modalItemText, tempDay === item && styles.selectedItem]}>{String(item).padStart(2, '0')}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.pickerLabel}>Month</Text>
                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((item) => (
                    <TouchableOpacity key={`m-${item}`} style={styles.modalItem} onPress={() => setTempMonth(item)}>
                      <Text style={[styles.modalItemText, tempMonth === item && styles.selectedItem]}>{String(item).padStart(2, '0')}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.pickerLabel}>Year</Text>
                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                  {Array.from({ length: (new Date().getUTCFullYear() - 1900 - 18 + 1) }, (_, i) => new Date().getUTCFullYear() - 18 - i).map((item) => (
                    <TouchableOpacity key={`y-${item}`} style={styles.modalItem} onPress={() => setTempYear(item)}>
                      <Text style={[styles.modalItemText, tempYear === item && styles.selectedItem]}>{String(item)}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 12, padding: 16 }}>
              <TouchableOpacity style={[styles.backButton, { flex: 1 }]} onPress={() => setShowDateSheet(false)}>
                <Text style={styles.backButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.nextButton, { flex: 1 }]}
                onPress={() => {
                  const min = Date.UTC(1900, 0, 1);
                  const now = new Date();
                  const max = Date.UTC(now.getUTCFullYear() - 18, now.getUTCMonth(), now.getUTCDate());
                  const cand = Date.UTC(tempYear, tempMonth - 1, tempDay);
                  if (Number.isNaN(cand) || cand < min) {
                    setErrorBanner('Select a valid date');
                    return;
                  }
                  if (cand > max) {
                    setErrorBanner('Users under 18 are not accepted.');
                    return;
                  }
                  const d = new Date(cand);
                  setSelectedDate(d);
                  setShowDateSheet(false);
                }}
              >
                <LinearGradient
                  colors={['#6a11cb', '#2575fc']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>Done</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Smoke Tests */}
      <View style={styles.smokeRow}>
        <View style={styles.smokeItem}>
          {dobISO ? <CheckCircle2 color="#2e7d32" /> : <XCircle color="#c62828" />}
          <Text style={styles.smokeText}>DOB filled</Text>
        </View>
        <View style={styles.smokeItem}>
          {computedAge !== null && computedAge >= 18 ? <CheckCircle2 color="#2e7d32" /> : <XCircle color="#c62828" />}
          <Text style={styles.smokeText}>18+</Text>
        </View>
        <View style={styles.smokeItem}>
          {isSubmitting ? <XCircle color="#c62828" /> : <CheckCircle2 color="#2e7d32" />}
          <Text style={styles.smokeText}>No double submit</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
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
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoText: {
    fontSize: 40,
    fontWeight: '700' as const,
    color: '#6a11cb',
    letterSpacing: -1,
  },
  logoAccent: {
    fontSize: 40,
    fontWeight: '700' as const,
    color: '#2575fc',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 15,
    color: '#666',
    marginBottom: 20,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#333',
    marginBottom: 6,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
  },
  progressBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: '#6a11cb',
  },
  stepContainer: {
    gap: 16,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#333',
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#e9ecef',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  placeholder: {
    color: '#888',
  },
  eyeButton: {
    padding: 4,
  },
  phoneContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#e9ecef',
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#333',
  },
  passwordRequirements: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  requirementText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#333',
    marginBottom: 4,
  },
  requirementItem: {
    fontSize: 13,
    color: '#999',
  },
  requirementMet: {
    color: '#4caf50',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  backButton: {
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#666',
  },
  nextButton: {
    shadowColor: '#6a11cb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: 'white',
  },
  switchButton: {
    alignItems: 'center',
    marginTop: 24,
  },
  switchText: {
    fontSize: 14,
    color: '#666',
  },
  switchLink: {
    color: '#6a11cb',
    fontWeight: '600' as const,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
  pickerLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  selectedItem: {
    color: '#6a11cb',
    fontWeight: '700' as const,
  },
  modalCloseButton: {
    marginTop: 16,
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 14,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#666',
  },
  errorBanner: {
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  errorBannerText: {
    color: '#c62828',
    fontSize: 14,
    textAlign: 'center',
  },
  successToast: {
    backgroundColor: '#e8f5e9',
    borderColor: '#66bb6a',
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  successToastText: {
    color: '#2e7d32',
    fontSize: 14,
    textAlign: 'center',
  },
  smokeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  smokeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  smokeText: {
    fontSize: 12,
    color: '#555',
  },
});
