import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { Check, Globe } from 'lucide-react-native';
import { useLanguage } from '@/providers/LanguageProvider';
import { supportedLanguages, Language } from '@/constants/languages';

interface LanguageSelectorProps {
  showLabel?: boolean;
  compact?: boolean;
}

export default function LanguageSelector({ showLabel = true, compact = false }: LanguageSelectorProps) {
  const { currentLanguage, changeLanguage, t } = useLanguage();
  const [modalVisible, setModalVisible] = useState(false);

  const handleLanguageSelect = async (languageCode: Language) => {
    await changeLanguage(languageCode);
    setModalVisible(false);
  };

  const currentLang = supportedLanguages.find(lang => lang.code === currentLanguage);

  if (compact) {
    return (
      <>
        <TouchableOpacity
          style={styles.compactButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.compactFlag}>{currentLang?.flag}</Text>
        </TouchableOpacity>

        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Globe color="#F04F8F" size={24} />
                <Text style={styles.modalTitle}>{t('language')}</Text>
              </View>

              <ScrollView style={styles.languageList}>
                {supportedLanguages.map((lang) => (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.languageItem,
                      currentLanguage === lang.code && styles.languageItemActive,
                    ]}
                    onPress={() => handleLanguageSelect(lang.code)}
                  >
                    <Text style={styles.languageFlag}>{lang.flag}</Text>
                    <Text style={styles.languageName}>{lang.name}</Text>
                    {currentLanguage === lang.code && (
                      <Check color="#F04F8F" size={20} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      </>
    );
  }

  return (
    <>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setModalVisible(true)}
      >
        <Globe color="#888" size={20} />
        {showLabel && (
          <View style={styles.buttonContent}>
            <Text style={styles.buttonLabel}>{t('language')}</Text>
            <Text style={styles.buttonValue}>
              {currentLang?.flag} {currentLang?.name}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Globe color="#F04F8F" size={24} />
              <Text style={styles.modalTitle}>{t('language')}</Text>
            </View>

            <ScrollView style={styles.languageList}>
              {supportedLanguages.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageItem,
                    currentLanguage === lang.code && styles.languageItemActive,
                  ]}
                  onPress={() => handleLanguageSelect(lang.code)}
                >
                  <Text style={styles.languageFlag}>{lang.flag}</Text>
                  <Text style={styles.languageName}>{lang.name}</Text>
                  {currentLanguage === lang.code && (
                    <Check color="#F04F8F" size={20} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  buttonContent: {
    flex: 1,
  },
  buttonLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  buttonValue: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600' as const,
  },
  compactButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactFlag: {
    fontSize: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: 'white',
  },
  languageList: {
    maxHeight: 400,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  languageItemActive: {
    backgroundColor: '#222',
  },
  languageFlag: {
    fontSize: 24,
  },
  languageName: {
    flex: 1,
    fontSize: 16,
    color: 'white',
    fontWeight: '500' as const,
  },
});
