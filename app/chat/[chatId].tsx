import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from "react-native";
import { Stack, useLocalSearchParams, router } from "expo-router";
import {
  Send,
  Image as ImageIcon,
  Video as VideoIcon,
  MoreVertical,
  Heart,
  ThumbsUp,
  Laugh,
  Globe,
  Trash2,
  Ban,
  Flag,
} from "lucide-react-native";

import { Colors } from "@/constants/colors";

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  translated?: string;
  attachments?: {
    type: "image" | "video";
    url: string;
    thumbnail?: string;
  }[];
  reactions?: Record<string, string[]>;
  deleted?: boolean;
}

const mockMessages: Message[] = [
  {
    id: "1",
    senderId: "other",
    text: "Hey! How are you doing? 😊",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "2",
    senderId: "me",
    text: "I'm great! Thanks for asking. How about you?",
    timestamp: new Date(Date.now() - 3500000).toISOString(),
  },
  {
    id: "3",
    senderId: "other",
    text: "Doing well! Want to video chat later?",
    timestamp: new Date(Date.now() - 3400000).toISOString(),
    reactions: { "❤️": ["me"] },
  },
];

export default function ChatScreen() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const scrollViewRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [inputText, setInputText] = useState<string>("");
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [autoTranslate, setAutoTranslate] = useState<boolean>(false);

  const otherUser = {
    id: chatId,
    name: "Emma",
    avatar:
      "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    isOnline: true,
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: "me",
      text: inputText,
      timestamp: new Date().toISOString(),
    };

    setMessages([...messages, newMessage]);
    setInputText("");
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleTranslate = async (message: Message) => {
    if (message.translated) {
      const updatedMessages = messages.map((m) =>
        m.id === message.id ? { ...m, translated: undefined } : m
      );
      setMessages(updatedMessages);
      return;
    }

    Alert.alert(
      "Translation",
      "AI translation feature requires @rork/toolkit-sdk configuration. Please contact support."
    );
  };

  const handleReaction = (messageId: string, emoji: string) => {
    const updatedMessages = messages.map((m) => {
      if (m.id === messageId) {
        const reactions = { ...m.reactions };
        if (!reactions[emoji]) {
          reactions[emoji] = [];
        }
        if (reactions[emoji].includes("me")) {
          reactions[emoji] = reactions[emoji].filter((id) => id !== "me");
          if (reactions[emoji].length === 0) {
            delete reactions[emoji];
          }
        } else {
          reactions[emoji].push("me");
        }
        return { ...m, reactions };
      }
      return m;
    });
    setMessages(updatedMessages);
    setShowOptions(false);
  };

  const handleDeleteMessage = (messageId: string) => {
    Alert.alert(
      "Delete Message",
      "Are you sure you want to delete this message?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const updatedMessages = messages.map((m) =>
              m.id === messageId ? { ...m, deleted: true } : m
            );
            setMessages(updatedMessages);
            setShowOptions(false);
          },
        },
      ]
    );
  };

  const handleBlockUser = () => {
    Alert.alert(
      "Block User",
      `Are you sure you want to block ${otherUser.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: () => {
            console.log("User blocked");
            setShowOptions(false);
            router.back();
          },
        },
      ]
    );
  };

  const handleReport = () => {
    Alert.alert("Report", "Report functionality coming soon!");
    setShowOptions(false);
  };

  const renderMessage = (message: Message) => {
    const isMe = message.senderId === "me";

    if (message.deleted) {
      return (
        <View
          key={message.id}
          style={[styles.messageContainer, isMe && styles.myMessageContainer]}
        >
          <View style={[styles.messageBubble, styles.deletedBubble]}>
            <Text style={styles.deletedText}>Message deleted</Text>
          </View>
        </View>
      );
    }

    return (
      <TouchableOpacity
        key={message.id}
        style={[styles.messageContainer, isMe && styles.myMessageContainer]}
        onLongPress={() => {
          setSelectedMessage(message);
          setShowOptions(true);
        }}
      >
        {!isMe && (
          <Image source={{ uri: otherUser.avatar }} style={styles.messageAvatar} />
        )}
        <View style={styles.messageContent}>
          <View style={[styles.messageBubble, isMe && styles.myMessageBubble]}>
            <Text style={[styles.messageText, isMe && styles.myMessageText]}>
              {message.text}
            </Text>
            {message.translated && (
              <View style={styles.translatedContainer}>
                <Globe color={Colors.textMuted} size={12} />
                <Text style={styles.translatedText}>{message.translated}</Text>
              </View>
            )}
            <Text style={[styles.messageTime, isMe && styles.myMessageTime]}>
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
          {message.reactions && Object.keys(message.reactions).length > 0 && (
            <View style={styles.reactionsContainer}>
              {Object.entries(message.reactions).map(([emoji, users]) => (
                <View key={emoji} style={styles.reactionBadge}>
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                  <Text style={styles.reactionCount}>{users.length}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </TouchableOpacity>
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
          title: otherUser.name,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setShowOptions(true)}
              style={styles.headerButton}
            >
              <MoreVertical color={Colors.text} size={20} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map(renderMessage)}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.iconButton}>
          <ImageIcon color={Colors.primary} size={20} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <VideoIcon color={Colors.secondary} size={20} />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={Colors.textMuted}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <Send
            color={inputText.trim() ? "#FFFFFF" : Colors.textMuted}
            size={18}
          />
        </TouchableOpacity>
      </View>

      <Modal
        visible={showOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptions(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptions(false)}
        >
          <View style={styles.optionsMenu}>
            {selectedMessage && (
              <>
                <Text style={styles.optionsTitle}>Message Actions</Text>
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => handleReaction(selectedMessage.id, "❤️")}
                >
                  <Heart color={Colors.error} size={18} />
                  <Text style={styles.optionText}>React with ❤️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => handleReaction(selectedMessage.id, "👍")}
                >
                  <ThumbsUp color={Colors.primary} size={18} />
                  <Text style={styles.optionText}>React with 👍</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => handleReaction(selectedMessage.id, "😂")}
                >
                  <Laugh color={Colors.secondary} size={18} />
                  <Text style={styles.optionText}>React with 😂</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => handleTranslate(selectedMessage)}
                >
                  <Globe color={Colors.mint} size={18} />
                  <Text style={styles.optionText}>
                    {selectedMessage.translated ? "Hide Translation" : "Translate"}
                  </Text>
                </TouchableOpacity>
                {selectedMessage.senderId === "me" && (
                  <TouchableOpacity
                    style={styles.optionItem}
                    onPress={() => handleDeleteMessage(selectedMessage.id)}
                  >
                    <Trash2 color={Colors.error} size={18} />
                    <Text style={[styles.optionText, { color: Colors.error }]}>
                      Delete Message
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
            {!selectedMessage && (
              <>
                <Text style={styles.optionsTitle}>Chat Options</Text>
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => {
                    setAutoTranslate(!autoTranslate);
                    setShowOptions(false);
                  }}
                >
                  <Globe color={Colors.primary} size={18} />
                  <Text style={styles.optionText}>
                    {autoTranslate ? "Disable" : "Enable"} Auto-Translate
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.optionItem} onPress={handleReport}>
                  <Flag color={Colors.secondary} size={18} />
                  <Text style={styles.optionText}>Report User</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={handleBlockUser}
                >
                  <Ban color={Colors.error} size={18} />
                  <Text style={[styles.optionText, { color: Colors.error }]}>
                    Block User
                  </Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity
              style={[styles.optionItem, styles.cancelOption]}
              onPress={() => {
                setShowOptions(false);
                setSelectedMessage(null);
              }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerButton: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 24,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-end",
  },
  myMessageContainer: {
    flexDirection: "row-reverse",
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  messageContent: {
    maxWidth: "75%",
  },
  messageBubble: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  myMessageBubble: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  deletedBubble: {
    backgroundColor: Colors.borderLight,
    borderColor: Colors.border,
  },
  messageText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 20,
  },
  myMessageText: {
    color: "#FFFFFF",
  },
  deletedText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontStyle: "italic" as const,
  },
  translatedContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
  },
  translatedText: {
    fontSize: 13,
    color: Colors.textMuted,
    flex: 1,
    lineHeight: 18,
  },
  messageTime: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },
  myMessageTime: {
    color: "rgba(255,255,255,0.7)",
  },
  reactionsContainer: {
    flexDirection: "row",
    gap: 4,
    marginTop: 4,
  },
  reactionBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reactionEmoji: {
    fontSize: 12,
  },
  reactionCount: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "600" as const,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: Colors.borderLight,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "flex-end",
  },
  optionsMenu: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  optionsTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 16,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  optionText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: "500" as const,
  },
  cancelOption: {
    borderBottomWidth: 0,
    marginTop: 8,
    justifyContent: "center",
  },
  cancelText: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: "600" as const,
    textAlign: "center",
  },
});
