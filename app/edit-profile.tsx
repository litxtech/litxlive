import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUser } from '@/providers/UserProvider';
import { Colors } from '@/constants/colors';
import { ArrowLeft, Save, User, Mail, MapPin, Calendar, Heart, Globe } from 'lucide-react-native';

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, updateProfile } = useUser();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    username: user?.username || '',
    bio: user?.bio || '',
    email: user?.email || '',
    phone: user?.phone || '',
    country: user?.country || '',
    city: user?.city || '',
    hometown: user?.hometown || '',
    gender: user?.gender || '',
    orientation: user?.orientation || '',
    birthDate: user?.birthDate || '',
    interests: user?.interests || '',
    website: user?.website || '',
  });

  const handleSave = async () => {
    if (saving) return;

    setSaving(true);
    try {
      // Update profile using the correct field names
      const profileData = {
        displayName: formData.displayName,
        username: formData.username,
        bio: formData.bio,
        country: formData.country,
        city: formData.city,
        hometown: formData.hometown,
        gender: formData.gender,
        orientation: formData.orientation,
        birthDate: formData.birthDate,
        interests: formData.interests,
        website: formData.website,
        phone: formData.phone,
      };
      
      await updateProfile(profileData);
      Alert.alert('Başarılı', 'Profil bilgileriniz güncellendi.', [
        { text: 'Tamam', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('[EditProfile] Update error:', error);
      Alert.alert('Hata', 'Profil güncellenirken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const genderOptions = [
    { value: 'male', label: 'Erkek' },
    { value: 'female', label: 'Kadın' },
    { value: 'other', label: 'Diğer' },
    { value: 'prefer_not_to_say', label: 'Belirtmek istemiyorum' },
  ];

  const orientationOptions = [
    { value: 'male', label: 'Erkek' },
    { value: 'female', label: 'Kadın' },
    { value: 'both', label: 'Her ikisi' },
    { value: 'other', label: 'Diğer' },
  ];

  const countryOptions = [
    { value: 'TR', label: 'Türkiye' },
    { value: 'US', label: 'United States' },
    { value: 'DE', label: 'Germany' },
    { value: 'FR', label: 'France' },
    { value: 'GB', label: 'United Kingdom' },
    { value: 'IT', label: 'Italy' },
    { value: 'ES', label: 'Spain' },
    { value: 'NL', label: 'Netherlands' },
    { value: 'CA', label: 'Canada' },
    { value: 'AU', label: 'Australia' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Profil Düzenle</Text>
        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.7}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Save size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Temel Bilgiler</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Görünen Ad</Text>
            <TextInput
              style={styles.input}
              value={formData.displayName}
              onChangeText={(text) => updateField('displayName', text)}
              placeholder="Görünen adınızı girin"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Kullanıcı Adı</Text>
            <TextInput
              style={styles.input}
              value={formData.username}
              onChangeText={(text) => updateField('username', text)}
              placeholder="Kullanıcı adınızı girin"
              placeholderTextColor={Colors.textSecondary}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Hakkında</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.bio}
              onChangeText={(text) => updateField('bio', text)}
              placeholder="Kendiniz hakkında kısa bir açıklama yazın"
              placeholderTextColor={Colors.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>İletişim Bilgileri</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-posta</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={formData.email}
              editable={false}
              placeholderTextColor={Colors.textSecondary}
            />
            <Text style={styles.helpText}>E-posta adresi değiştirilemez</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Telefon</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => updateField('phone', text)}
              placeholder="Telefon numaranızı girin"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Website</Text>
            <TextInput
              style={styles.input}
              value={formData.website}
              onChangeText={(text) => updateField('website', text)}
              placeholder="Website adresiniz (opsiyonel)"
              placeholderTextColor={Colors.textSecondary}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>
        </View>

        {/* Location Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Konum Bilgileri</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ülke</Text>
            <View style={styles.selectContainer}>
              <Text style={styles.selectText}>
                {countryOptions.find(c => c.value === formData.country)?.label || 'Ülke seçin'}
              </Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Şehir</Text>
            <TextInput
              style={styles.input}
              value={formData.city}
              onChangeText={(text) => updateField('city', text)}
              placeholder="Şehrinizi girin"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Memleket</Text>
            <TextInput
              style={styles.input}
              value={formData.hometown}
              onChangeText={(text) => updateField('hometown', text)}
              placeholder="Memleketinizi girin"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kişisel Bilgiler</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cinsiyet</Text>
            <View style={styles.radioGroup}>
              {genderOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.radioOption,
                    formData.gender === option.value && styles.radioOptionSelected
                  ]}
                  onPress={() => updateField('gender', option.value)}
                >
                  <Text style={[
                    styles.radioText,
                    formData.gender === option.value && styles.radioTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Hangi cinsiyetten hoşlanıyorsunuz?</Text>
            <View style={styles.radioGroup}>
              {orientationOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.radioOption,
                    formData.orientation === option.value && styles.radioOptionSelected
                  ]}
                  onPress={() => updateField('orientation', option.value)}
                >
                  <Text style={[
                    styles.radioText,
                    formData.orientation === option.value && styles.radioTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Doğum Tarihi</Text>
            <TextInput
              style={styles.input}
              value={formData.birthDate}
              onChangeText={(text) => updateField('birthDate', text)}
              placeholder="GG/AA/YYYY"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>İlgi Alanları</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.interests}
              onChangeText={(text) => updateField('interests', text)}
              placeholder="Hobileriniz, ilgi alanlarınız (virgülle ayırın)"
              placeholderTextColor={Colors.textSecondary}
              multiline
              numberOfLines={2}
            />
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  disabledInput: {
    backgroundColor: Colors.borderLight,
    color: Colors.textSecondary,
  },
  helpText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  selectContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectText: {
    fontSize: 16,
    color: Colors.text,
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  radioOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  radioOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  radioText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  radioTextSelected: {
    color: '#fff',
  },
  bottomSpacer: {
    height: 40,
  },
});