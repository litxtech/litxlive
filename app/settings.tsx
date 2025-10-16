import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useLanguage } from '@/providers/LanguageProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

export default function SettingsScreen() {
  const { t } = useLanguage();
  const [menuPosition, setMenuPosition] = useState<'bottom' | 'top'>('bottom');
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('tr');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedMenuPosition = await AsyncStorage.getItem('menuPosition');
      const savedNotifications = await AsyncStorage.getItem('notifications');
      const savedDarkMode = await AsyncStorage.getItem('darkMode');
      const savedLanguage = await AsyncStorage.getItem('language');

      if (savedMenuPosition) {
        setMenuPosition(savedMenuPosition as 'bottom' | 'top');
      }
      if (savedNotifications !== null) {
        setNotifications(JSON.parse(savedNotifications));
      }
      if (savedDarkMode !== null) {
        setDarkMode(JSON.parse(savedDarkMode));
      }
      if (savedLanguage) {
        setLanguage(savedLanguage);
      }
    } catch (error) {
      console.error('Settings load error:', error);
    }
  };

  const handleMenuPositionChange = async (value: boolean) => {
    const newPosition = value ? 'top' : 'bottom';
    setMenuPosition(newPosition);
    await AsyncStorage.setItem('menuPosition', newPosition);
    
    Alert.alert(
      'Menü Pozisyonu Değiştirildi',
      `Menü artık ${newPosition === 'top' ? 'üstte' : 'altta'} görünecek. Değişikliği görmek için uygulamayı yeniden başlatın.`,
      [{ text: 'Tamam' }]
    );
  };

  const handleNotificationsChange = async (value: boolean) => {
    setNotifications(value);
    await AsyncStorage.setItem('notifications', JSON.stringify(value));
  };

  const handleDarkModeChange = async (value: boolean) => {
    setDarkMode(value);
    await AsyncStorage.setItem('darkMode', JSON.stringify(value));
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    AsyncStorage.setItem('language', newLanguage);
  };

  const settingsItems = [
    {
      id: 'menu-position',
      title: 'Menü Pozisyonu',
      subtitle: menuPosition === 'top' ? 'Üst menü aktif' : 'Alt menü aktif',
      icon: menuPosition === 'top' ? 'keyboard-arrow-up' : 'keyboard-arrow-down',
      type: 'switch',
      value: menuPosition === 'top',
      onValueChange: handleMenuPositionChange,
    },
    {
      id: 'notifications',
      title: 'Bildirimler',
      subtitle: notifications ? 'Bildirimler açık' : 'Bildirimler kapalı',
      icon: 'notifications',
      type: 'switch',
      value: notifications,
      onValueChange: handleNotificationsChange,
    },
    {
      id: 'dark-mode',
      title: 'Karanlık Mod',
      subtitle: darkMode ? 'Karanlık mod aktif' : 'Açık mod aktif',
      icon: 'dark-mode',
      type: 'switch',
      value: darkMode,
      onValueChange: handleDarkModeChange,
    },
    {
      id: 'language',
      title: 'Dil',
      subtitle: language === 'tr' ? 'Türkçe' : 'English',
      icon: 'language',
      type: 'select',
      options: [
        { value: 'tr', label: 'Türkçe' },
        { value: 'en', label: 'English' },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ayarlar</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Menu Position Preview */}
        <View style={styles.previewSection}>
          <Text style={styles.previewTitle}>Menü Önizleme</Text>
          <View style={styles.previewContainer}>
            <View style={[
              styles.previewMenu,
              menuPosition === 'top' ? styles.previewTopMenu : styles.previewBottomMenu
            ]}>
              <View style={styles.previewTab}>
                <MaterialIcons name="home" size={16} color={Colors.primary} />
                <Text style={styles.previewTabText}>Ana</Text>
              </View>
              <View style={styles.previewTab}>
                <MaterialIcons name="search" size={16} color={Colors.textMuted} />
                <Text style={styles.previewTabText}>Keşfet</Text>
              </View>
              <View style={styles.previewTab}>
                <MaterialIcons name="record-voice-over" size={16} color={Colors.textMuted} />
                <Text style={styles.previewTabText}>Ses</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Settings Items */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Genel Ayarlar</Text>
          {settingsItems.map((item) => (
            <View key={item.id} style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}>
                  <MaterialIcons name={item.icon as any} size={24} color={Colors.primary} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>{item.title}</Text>
                  <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
              <View style={styles.settingRight}>
                {item.type === 'switch' ? (
                  <Switch
                    value={item.value}
                    onValueChange={item.onValueChange}
                    trackColor={{ false: Colors.border, true: Colors.primary }}
                    thumbColor={item.value ? '#FFFFFF' : Colors.textMuted}
                  />
                ) : item.type === 'select' ? (
                  <TouchableOpacity style={styles.selectButton}>
                    <Text style={styles.selectText}>
                      {item.options?.find(opt => opt.value === language)?.label}
                    </Text>
                    <MaterialIcons name="keyboard-arrow-down" size={20} color={Colors.textMuted} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          ))}
        </View>

        {/* Menu Position Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <MaterialIcons name="info" size={24} color={Colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Menü Pozisyonu</Text>
              <Text style={styles.infoText}>
                Menüyü üstte veya altta konumlandırabilirsiniz. Tercih ettiğiniz pozisyon kaydedilir ve tüm sayfalarda geçerli olur.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundColor,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  previewSection: {
    marginTop: 20,
    marginBottom: 30,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  previewContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 120,
    justifyContent: 'center',
  },
  previewMenu: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundColor,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  previewTopMenu: {
    alignSelf: 'flex-start',
  },
  previewBottomMenu: {
    alignSelf: 'flex-end',
  },
  previewTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  previewTabText: {
    fontSize: 8,
    fontWeight: '500',
    color: Colors.textMuted,
    marginTop: 2,
  },
  settingsSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  settingRight: {
    marginLeft: 12,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.borderLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectText: {
    fontSize: 14,
    color: Colors.text,
    marginRight: 4,
  },
  infoSection: {
    marginBottom: 30,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: Colors.borderLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
  },
});