import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import { X } from 'lucide-react-native';
import { COUNTRIES } from '@/constants/countries';

type Props = {
  visible: boolean;
  onClose: () => void;
  value?: string;
  onChange: (code: string) => void;
};

export default function CountryPicker({ visible, onClose, value, onChange }: Props) {
  const [query, setQuery] = useState('');

  const filteredCountries = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [query]);

  const handleSelect = (code: string) => {
    onChange(code);
    setQuery('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Select Country</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X color="#333" size={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search country..."
            placeholderTextColor="#888"
            style={styles.searchInput}
            autoFocus
          />
        </View>

        <FlatList
          data={filteredCountries}
          keyExtractor={(item) => item.code}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.countryItem,
                value === item.code && styles.countryItemSelected,
              ]}
              onPress={() => handleSelect(item.code)}
            >
              <Text style={styles.countryCode}>{item.code}</Text>
              <Text
                style={[
                  styles.countryName,
                  value === item.code && styles.countryNameSelected,
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  searchInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  listContent: {
    paddingVertical: 8,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  countryItemSelected: {
    backgroundColor: '#f0f4ff',
  },
  countryCode: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6a11cb',
    width: 40,
  },
  countryName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  countryNameSelected: {
    fontWeight: '600' as const,
    color: '#6a11cb',
  },
});
