import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Send, ArrowLeft, Gift, Phone, Video } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { useUser } from "@/providers/UserProvider";

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: Date;
  type: "text" | "gift";
}

const mockMessages: Message[] = [
  {
    id: "1",
    text: "Hey! How are you? 😊",
    senderId: "other",
    timestamp: new Date(Date.now() - 3600000),
    type: "text",
  },
  {
    id: "2",
    text: "I'm good! Thanks for asking",
    senderId: "me",
    timestamp: new Date(Date.now() - 3000000),
    type: "text",
  },
  {
    id: "3",
    text: "Would you like to video chat?",
    senderId: "other",
    timestamp: new Date(Date.now() - 1800000),
    type: "text",
  },
];

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [inputText, setInputText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const chatUser = {
    id: id as string,
    displayName: "Emma",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    isOnline: true,
  };

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      senderId: "me",
      timestamp: new Date(),
      type: "text",
    };

    setMessages([...messages, newMessage]);
    setInputText("");
  };

  const handleDeleteMessage = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === "me";

    const onLongPress = () => {
      if (!isMe) return;
      if (Platform.OS === 'web') {
        const confirmed = typeof window !== 'undefined' ? window.confirm('Bu mesajı silmek istediğinize emin misiniz?') : false;
        if (confirmed) handleDeleteMessage(item.id);
      } else {
        // eslint-disable-next-line no-alert
        // Using React Native Alert
        import('react-native').then(({ Alert }) => {
          Alert.alert(
            'Mesajı Sil',
            'Bu mesajı silmek istediğinize emin misiniz?',
            [
              { text: 'İptal', style: 'cancel' as const },
              { text: 'Sil', style: 'destructive' as const, onPress: () => handleDeleteMessage(item.id) },
            ]
          );
        });
      }
    };

    return (
      <View
        style={[
          styles.messageContainer,
          isMe ? styles.myMessage : styles.otherMessage,
        ]}
      >
        {!isMe && (
          <Image source={{ uri: chatUser.avatar }} style={styles.messageAvatar} />
        )}
        <TouchableOpacity
          activeOpacity={0.9}
          onLongPress={onLongPress}
          delayLongPress={500}
          testID={`message-${item.id}`}
          style={[
            styles.messageBubble,
            isMe ? styles.myMessageBubble : styles.otherMessageBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isMe ? styles.myMessageText : styles.otherMessageText,
            ]}
          >
            {item.text}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isMe ? styles.myMessageTime : styles.otherMessageTime,
            ]}
          >
            {item.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: () => (
            <View style={styles.headerTitle}>
              <Image source={{ uri: chatUser.avatar }} style={styles.headerAvatar} />
              <View>
                <Text style={styles.headerName}>{chatUser.displayName}</Text>
                {chatUser.isOnline && (
                  <Text style={styles.headerStatus}>Online</Text>
                )}
              </View>
            </View>
          ),
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerButton}
            >
              <ArrowLeft color={Colors.text} size={24} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerButton}>
                <Phone color={Colors.text} size={20} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton}>
                <Video color={Colors.text} size={20} />
              </TouchableOpacity>
            </View>
          ),
          headerStyle: {
            backgroundColor: Colors.background,
          },
        }}
      />

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.messagesList,
          { paddingBottom: insets.bottom + 80 },
        ]}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
      />

      <View style={[styles.inputContainer, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity style={styles.giftButton}>
          <Gift color={Colors.primary} size={24} />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={Colors.textMuted}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            !inputText.trim() && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <Send
            color={inputText.trim() ? "#FFFFFF" : Colors.textMuted}
            size={20}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.borderLight,
  },
  headerName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  headerStatus: {
    fontSize: 12,
    color: Colors.success,
  },
  headerButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-end",
  },
  myMessage: {
    justifyContent: "flex-end",
  },
  otherMessage: {
    justifyContent: "flex-start",
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: Colors.borderLight,
  },
  messageBubble: {
    maxWidth: "70%",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  myMessageBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
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
  myMessageText: {
    color: "#FFFFFF",
  },
  otherMessageText: {
    color: Colors.text,
  },
  messageTime: {
    fontSize: 11,
  },
  myMessageTime: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  otherMessageTime: {
    color: Colors.textMuted,
  },
  inputContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 8,
  },
  giftButton: {
    padding: 8,
    marginBottom: 4,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.surface,
  },
});
