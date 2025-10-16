import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,

} from 'react-native';
import { X, Gift as GiftIcon } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { GIFTS_CATALOG, Gift } from '@/constants/gifts';

interface GiftModalProps {
  visible: boolean;
  onClose: () => void;
  recipientName: string;
  onSendGift: (gift: any) => void;
}

export default function GiftModal({
  visible,
  onClose,
  recipientName,
  onSendGift,
}: GiftModalProps) {
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);

  const handleSend = () => {
    if (selectedGift) {
      onSendGift(selectedGift);
      onClose();
      setSelectedGift(null);
    }
  };

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
            <View style={styles.headerLeft}>
              <GiftIcon color={Colors.primary} size={24} />
              <Text style={styles.title}>Send Gift to {recipientName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color={Colors.text} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.giftList}>
            <View style={styles.giftGrid}>
              {GIFTS_CATALOG.map((gift) => (
                <TouchableOpacity
                  key={gift.id}
                  style={[
                    styles.giftItem,
                    selectedGift?.id === gift.id && styles.giftItemSelected,
                  ]}
                  onPress={() => setSelectedGift(gift)}
                >
                  <Text style={styles.giftIcon}>{gift.emoji}</Text>
                  <Text style={styles.giftName}>{gift.name}</Text>
                  <Text style={styles.giftPrice}>{gift.coins} coins</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.sendButton,
                !selectedGift && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!selectedGift}
            >
              <Text style={styles.sendButtonText}>
                {selectedGift
                  ? `Send ${selectedGift.name} (${selectedGift.coins} coins)`
                  : 'Select a gift'}
              </Text>
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
  container: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  closeButton: {
    padding: 4,
  },
  giftList: {
    flex: 1,
  },
  giftGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  giftItem: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  giftItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.borderLight,
  },
  giftIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  giftName: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  giftPrice: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.borderLight,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
