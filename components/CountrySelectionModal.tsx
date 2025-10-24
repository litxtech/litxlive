import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Colors } from '@/constants/colors';

interface Country {
  code: string;
  name: string;
  flag: string;
}

interface CountrySelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCountry: (countryCode: string) => void;
  selectedCountry: string;
}

const countries: Country[] = [
  { code: 'all', name: 'Tümü', flag: '🌍' },
  { code: 'TR', name: 'Türkiye', flag: '🇹🇷' },
  { code: 'PH', name: 'Filipinler', flag: '🇵🇭' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪' },
  { code: 'CO', name: 'Kolombiya', flag: '🇨🇴' },
  { code: 'BR', name: 'Brezilya', flag: '🇧🇷' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  { code: 'EG', name: 'Mısır', flag: '🇪🇬' },
  { code: 'SY', name: 'Suriye', flag: '🇸🇾' },
  { code: 'MY', name: 'Malezya', flag: '🇲🇾' },
  { code: 'IN', name: 'Hindistan', flag: '🇮🇳' },
];

const { width } = Dimensions.get('window');

export default function CountrySelectionModal({
  visible,
  onClose,
  onSelectCountry,
  selectedCountry,
}: CountrySelectionModalProps) {
  const handleCountrySelect = (countryCode: string) => {
    console.log('[CountryModal] Country selected:', countryCode);
    onSelectCountry(countryCode);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Ülke Seçimi</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.countryList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.countryListContent}
          >
            {countries.map((country) => (
              <TouchableOpacity
                key={country.code}
                style={[
                  styles.countryButton,
                  selectedCountry === country.code && styles.countryButtonActive,
                ]}
                onPress={() => handleCountrySelect(country.code)}
                activeOpacity={0.7}
              >
                <Text style={styles.countryFlag}>{country.flag}</Text>
                <Text
                  style={[
                    styles.countryName,
                    selectedCountry === country.code && styles.countryNameActive,
                  ]}
                >
                  {country.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.submitButtonText}>Gönder</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  countryList: {
    maxHeight: 400,
  },
  countryListContent: {
    padding: 20,
    gap: 12,
  },
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  countryButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  countryFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  countryName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    flex: 1,
  },
  countryNameActive: {
    color: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: Colors.primary,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
