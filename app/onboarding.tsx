import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CountryPicker from '@/components/CountryPicker';
import { router } from 'expo-router';
import { useUser } from '@/providers/UserProvider';
import { supabase } from '@/lib/supabase';
import type { Gender } from '@/types/db';

export default function OnboardingSinglePage() {
  const { refreshProfile } = useUser();
  const insets = useSafeAreaInsets();

  const [gender, setGender] = useState<Gender | undefined>();
  const [interested, setInterested] = useState<Gender | undefined>();
  const [age, setAge] = useState<string>('21');
  const [countryCode, setCountryCode] = useState<string | undefined>('TR');
  const [bio, setBio] = useState<string>('');
  const [emailInput, setEmailInput] = useState<string>('');
  const [phone, setPhone] = useState<string>('');

  const [busy, setBusy] = useState<boolean>(false);
  const [pickerOpen, setPickerOpen] = useState<boolean>(false);

  const ageNum = useMemo(() => Number(age), [age]);
  const v = {
    gender: !!gender,
    interested: !!interested,
    age: Number.isInteger(ageNum) && ageNum >= 18 && ageNum <= 99,
    country: /^[A-Z]{2}$/.test(countryCode || ''),
    bio: bio.trim().length <= 200,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.trim()),
    phone: /^\+?[0-9\s()-]{7,20}$/.test(phone.trim()),
  };
  const allValid = v.gender && v.interested && v.age && v.country && v.bio && v.email && v.phone;

  const save = async () => {
    console.log('[Onboarding] Save pressed');
    try {
      if (!allValid) {
        Alert.alert('Eksik Bilgi', 'Lütfen zorunlu alanları (email, telefon, cinsiyet, hoşlandığın, yaş, ülke) tamamla.');
        return;
      }
      setBusy(true);

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) throw new Error('Oturum bulunamadı.');

      const normalizedEmail = emailInput.trim().toLowerCase();
      const normalizedPhone = phone.trim();

      await supabase.auth.updateUser({
        email: normalizedEmail || undefined,
        data: {
          phone,
          gender,
          interested_in: interested,
        } as Record<string, any>,
      });

      await supabase
        .from('profiles')
        .upsert(
          {
            user_id: authUser.id,
            display_name: (normalizedEmail || authUser.email)?.split('@')[0] ?? `user_${authUser.id.slice(0, 6)}`,
            gender,
            gender_preference: (interested as any) ?? null,
            age: ageNum,
            country: countryCode ?? null,
            bio: bio.trim() || null,
          },
          { onConflict: 'user_id' }
        );

      const { error } = await supabase
        .from('profiles')
        .update({
          bio: bio.trim() || null,
        })
        .eq('user_id', authUser.id);

      if (error) throw error;

      await supabase.auth.updateUser({
        data: { onboarding_complete: true, gender_set: Boolean(gender) } as Record<string, any>,
      });

      if (refreshProfile) {
        await refreshProfile();
      }

      Alert.alert('Tebrikler', 'Kayıt tamamlandı!');
      router.replace('/(tabs)/home');
    } catch (e: any) {
      console.error('[Onboarding] Save error', e);
      Alert.alert('Hata', e?.message || 'Kayıt tamamlanamadı.');
    } finally {
      setBusy(false);
    }
  };

  const Pill = ({
    value,
    label,
    selected,
    onSelect,
  }: {
    value: Gender;
    label: string;
    selected: boolean;
    onSelect: (v: Gender) => void;
  }) => (
    <TouchableOpacity
      onPress={() => onSelect(value)}
      style={[styles.pill, selected && styles.pillSelected]}
      activeOpacity={0.8}
    >
      <Text style={styles.pillText}>{label}</Text>
    </TouchableOpacity>
  );

  const Helper = ({ ok, text }: { ok: boolean; text: string }) => (
    <Text style={[styles.helperText, ok ? styles.helperOk : styles.helperError]}>
      {ok ? '✓ ' : '• '}
      {text}
    </Text>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Hadi profili bitirelim</Text>
            <Text style={styles.subtitle}>
              Hızlıca doldur, gerisini uygulamada hallederiz.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>
              Email <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              value={emailInput}
              onChangeText={setEmailInput}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="ornek@mail.com"
              placeholderTextColor="#5f6a86"
              style={styles.input}
              testID="onboardingEmailInput"
            />
            <Helper ok={v.email} text="Geçerli bir email gir." />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>
              Telefon Numarası <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="+90 5xx xxx xx xx"
              placeholderTextColor="#5f6a86"
              style={styles.input}
              testID="onboardingPhoneInput"
            />
            <Helper ok={v.phone} text="Sadece rakam ve +, boşluk, ( ) kullanılabilir." />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>
              Cinsiyet <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.pillRow}>
              <Pill
                value="male"
                label="Erkek"
                selected={gender === 'male'}
                onSelect={setGender}
              />
              <Pill
                value="female"
                label="Kadın"
                selected={gender === 'female'}
                onSelect={setGender}
              />
            </View>
            <Helper ok={!!gender} text="Bu alan zorunlu." />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>
              Hoşlandığın <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.pillRow}>
              <Pill
                value="male"
                label="Erkek"
                selected={interested === 'male'}
                onSelect={setInterested}
              />
              <Pill
                value="female"
                label="Kadın"
                selected={interested === 'female'}
                onSelect={setInterested}
              />
            </View>
            <Helper ok={!!interested} text="Bu alan zorunlu." />
          </View>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>
                Yaş <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                value={age}
                onChangeText={(t) => setAge(t.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                placeholder="21"
                placeholderTextColor="#5f6a86"
                underlineColorAndroid="transparent"
                style={styles.input}
              />
              <Helper ok={v.age} text="18–99 arası olmalı." />
            </View>

            <View style={styles.halfWidth}>
              <Text style={styles.label}>
                Ülke <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                onPress={() => setPickerOpen(true)}
                style={styles.countryButton}
                activeOpacity={0.8}
              >
                <Text style={countryCode ? styles.countryText : styles.countryPlaceholder}>
                  {countryCode || 'Seç'}
                </Text>
              </TouchableOpacity>
              <Helper ok={v.country} text="ISO-2 kod (örn. TR, US)." />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Kısa Bio (opsiyonel, 200)</Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Kısaca kendinden bahset…"
              placeholderTextColor="#5f6a86"
              underlineColorAndroid="transparent"
              multiline
              maxLength={200}
              style={styles.bioInput}
            />
            <Text style={styles.charCount}>{bio.trim().length}/200</Text>
          </View>

          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${
                    (Number(v.email) +
                      Number(v.phone) +
                      Number(v.gender) +
                      Number(v.interested) +
                      Number(v.age) +
                      Number(v.country)) *
                    (100 / 6)
                  }%`,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            Zorunlu alanların{' '}
            {Number(v.email) + Number(v.phone) + Number(v.gender) + Number(v.interested) + Number(v.age) + Number(v.country)} / 6
            tamam.
          </Text>

          <TouchableOpacity
            onPress={save}
            disabled={!allValid || busy}
            style={[styles.saveButton, (!allValid || busy) && styles.saveButtonDisabled]}
            activeOpacity={0.85}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Kaydı Tamamla</Text>
            )}
          </TouchableOpacity>

          <CountryPicker
            visible={pickerOpen}
            onClose={() => setPickerOpen(false)}
            value={countryCode}
            onChange={(code: string) => {
              setCountryCode(code);
              setPickerOpen(false);
            }}
          />
        </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    color: '#111',
    fontSize: 22,
    fontWeight: '800' as const,
  },
  subtitle: {
    color: '#666',
    marginTop: 4,
  },
  section: {
    marginTop: 12,
  },
  label: {
    color: '#666',
    marginBottom: 6,
  },
  required: {
    color: '#ff7a9e',
  },
  pillRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
  },
  pillSelected: {
    backgroundColor: '#4C6FFF',
  },
  pillText: {
    color: '#111',
  },
  helperText: {
    fontSize: 12,
  },
  helperOk: {
    color: '#10B981',
  },
  helperError: {
    color: '#EF4444',
  },
  row: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 10,
  },
  halfWidth: {
    flex: 1,
  },
  input: {
    color: '#111',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  countryButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    justifyContent: 'center',
  },
  countryText: {
    color: '#111',
  },
  countryPlaceholder: {
    color: '#9AA0A6',
  },
  bioInput: {
    color: '#111',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    minHeight: 96,
    borderWidth: 1,
    borderColor: '#e9ecef',
    textAlignVertical: 'top',
  },
  charCount: {
    color: '#9AA0A6',
    fontSize: 12,
    marginTop: 4,
  },
  progressBarContainer: {
    marginTop: 18,
    backgroundColor: '#e9ecef',
    height: 8,
    borderRadius: 999,
  },
  progressBar: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#4C6FFF',
  },
  progressText: {
    color: '#666',
    fontSize: 12,
    marginTop: 6,
  },
  saveButton: {
    marginTop: 18,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#4C6FFF',
  },
  saveButtonDisabled: {
    backgroundColor: '#e5e7eb',
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '800' as const,
  },
});
