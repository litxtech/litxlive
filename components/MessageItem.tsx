import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';

type Message = {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
};

type MessageItemProps = {
  message: Message;
  currentUserId: string;
  onDelete?: (messageId: string) => void;
};

export default function MessageItem({ message, currentUserId, onDelete }: MessageItemProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const isOwnMessage = message.sender_id === currentUserId;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isOwnMessage,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return isOwnMessage && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (isOwnMessage && gestureState.dx < 0) {
          translateX.setValue(Math.max(gestureState.dx, -80));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -60) {
          Animated.timing(translateX, {
            toValue: -80,
            duration: 200,
            useNativeDriver: true,
          }).start();
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const handleLongPress = () => {
    if (!isOwnMessage) return;

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Bu mesajı silmek istediğinize emin misiniz?');
      if (confirmed) {
        handleDelete();
      }
    } else {
      Alert.alert(
        'Mesajı Sil',
        'Bu mesajı silmek istediğinize emin misiniz?',
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Sil', style: 'destructive', onPress: handleDelete },
        ]
      );
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', message.id)
        .eq('sender_id', currentUserId);

      if (error) throw error;

      if (onDelete) {
        onDelete(message.id);
      }

      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Error deleting message:', error);
      Alert.alert('Hata', 'Mesaj silinemedi. Lütfen tekrar deneyin.');
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.messageWrapper,
          isOwnMessage && styles.ownMessageWrapper,
          { transform: [{ translateX }] },
        ]}
        {...(isOwnMessage ? panResponder.panHandlers : {})}
      >
        <TouchableOpacity
          onLongPress={handleLongPress}
          delayLongPress={500}
          activeOpacity={0.9}
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownMessage : styles.otherMessage,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
            ]}
          >
            {message.content}
          </Text>
          <Text
            style={[
              styles.timestamp,
              isOwnMessage ? styles.ownTimestamp : styles.otherTimestamp,
            ]}
          >
            {new Date(message.created_at).toLocaleTimeString('tr-TR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {isOwnMessage && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          activeOpacity={0.7}
        >
          <Trash2 color="#FFFFFF" size={20} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    position: 'relative',
  },
  messageWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    maxWidth: '80%',
  },
  ownMessageWrapper: {
    alignSelf: 'flex-end',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    maxWidth: '100%',
  },
  ownMessage: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 4,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: Colors.text,
  },
  timestamp: {
    fontSize: 11,
  },
  ownTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherTimestamp: {
    color: Colors.textMuted,
  },
  deleteButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 70,
    backgroundColor: '#FF4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
});
