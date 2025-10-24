import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { X } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

interface AdvancedFiltersModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: {
    gender: string;
    country: string;
    vipFilter: string;
    verificationFilter: string;
    onlineFilter: string;
  }) => void;
}

export function AdvancedFiltersModal({ visible, onClose, onApply }: AdvancedFiltersModalProps) {
  const [filters, setFilters] = useState({
    gender: 'all',
    country: 'all',
    vipFilter: 'all',
    verificationFilter: 'all',
    onlineFilter: 'all',
  });

  const handleApply = () => {
    onApply(filters);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Advanced Filters</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color={Colors.text} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Gender</Text>
              <View style={styles.options}>
                {['all', 'male', 'female', 'mixed'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.option,
                      filters.gender === option && styles.optionSelected,
                    ]}
                    onPress={() => setFilters({ ...filters, gender: option })}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        filters.gender === option && styles.optionTextSelected,
                      ]}
                    >
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>VIP Status</Text>
              <View style={styles.options}>
                {['all', 'vip_only', 'non_vip'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.option,
                      filters.vipFilter === option && styles.optionSelected,
                    ]}
                    onPress={() => setFilters({ ...filters, vipFilter: option })}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        filters.vipFilter === option && styles.optionTextSelected,
                      ]}
                    >
                      {option === 'all' ? 'All Users' : 
                       option === 'vip_only' ? 'VIP Only' : 'Non-VIP'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Verification</Text>
              <View style={styles.options}>
                {['all', 'yellow', 'blue'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.option,
                      filters.verificationFilter === option && styles.optionSelected,
                    ]}
                    onPress={() => setFilters({ ...filters, verificationFilter: option })}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        filters.verificationFilter === option && styles.optionTextSelected,
                      ]}
                    >
                      {option === 'all' ? 'All Users' : 
                       option === 'yellow' ? 'Yellow Tick' : 'Blue Tick'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Online Status</Text>
              <View style={styles.options}>
                {['all', 'online_only'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.option,
                      filters.onlineFilter === option && styles.optionSelected,
                    ]}
                    onPress={() => setFilters({ ...filters, onlineFilter: option })}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        filters.onlineFilter === option && styles.optionTextSelected,
                      ]}
                    >
                      {option === 'all' ? 'All Users' : 'Online Only'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
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
  modalContainer: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionText: {
    fontSize: 14,
    color: Colors.text,
  },
  optionTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.card,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
});
