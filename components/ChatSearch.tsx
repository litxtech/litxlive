import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
} from 'react-native';
import { X, Search } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

interface SearchResult {
  id: string;
  displayName: string;
  avatar: string;
  lastMessage: string;
}

interface ChatSearchProps {
  visible: boolean;
  onClose: () => void;
  onResultPress: (result: SearchResult) => void;
}

const mockResults: SearchResult[] = [
  {
    id: '1',
    displayName: 'Emma',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    lastMessage: 'Hey! How are you doing? 😊',
  },
  {
    id: '2',
    displayName: 'Sofia',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    lastMessage: 'Thanks for the gift! 💎',
  },
];

export default function ChatSearch({ visible, onClose, onResultPress }: ChatSearchProps) {
  const [query, setQuery] = useState('');

  const filteredResults = mockResults.filter((result) =>
    result.displayName.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.searchBar}>
              <Search color={Colors.textMuted} size={20} />
              <TextInput
                style={styles.input}
                placeholder="Search messages..."
                placeholderTextColor={Colors.textMuted}
                value={query}
                onChangeText={setQuery}
                autoFocus
              />
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color={Colors.text} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.results}>
            {filteredResults.map((result) => (
              <TouchableOpacity
                key={result.id}
                style={styles.resultItem}
                onPress={() => onResultPress(result)}
              >
                <Image source={{ uri: result.avatar }} style={styles.avatar} />
                <View style={styles.resultContent}>
                  <Text style={styles.resultName}>{result.displayName}</Text>
                  <Text style={styles.resultMessage} numberOfLines={1}>
                    {result.lastMessage}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            {filteredResults.length === 0 && query.length > 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No results found</Text>
              </View>
            )}
          </ScrollView>
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
  },
  container: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 12,
  },
  closeButton: {
    padding: 4,
  },
  results: {
    flex: 1,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.borderLight,
  },
  resultContent: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  resultMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textMuted,
  },
});
