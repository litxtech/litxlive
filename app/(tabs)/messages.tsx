import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { Search, MessageCircle, Video, Phone, Trash2, MoreVertical } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ChatSearch from "@/components/ChatSearch";
import MatchMessages from "@/components/MatchMessages";
import { useUser } from "@/providers/UserProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import Footer from "@/components/Footer";

import { Colors } from "@/constants/colors";

interface ChatUser {
  id: string;
  displayName: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: string;
  isOnline: boolean;
  unreadCount: number;
  // LUMI Features
  lumiId?: string;
  verificationLevel?: 'none' | 'yellow' | 'blue';
  isVip?: boolean;
  age?: number;
  country?: string;
  isBlocked?: boolean;
  isBlockedBy?: boolean;
}

const mockChats: ChatUser[] = [
  {
    id: "1",
    displayName: "Emma",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    lastMessage: "Hey! How are you doing? 😊",
    lastMessageTime: "2m",
    isOnline: true,
    unreadCount: 2,
    lumiId: "LUMI-123456",
    verificationLevel: "yellow",
    isVip: false,
    age: 24,
    country: "TR",
    isBlocked: false,
    isBlockedBy: false,
  },
  {
    id: "2",
    displayName: "Sofia",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    lastMessage: "Thanks for the gift! 💎",
    lastMessageTime: "1h",
    isOnline: true,
    unreadCount: 0,
    lumiId: "LUMI-234567",
    verificationLevel: "blue",
    isVip: true,
    age: 22,
    country: "TR",
    isBlocked: false,
    isBlockedBy: false,
  },
  {
    id: "3",
    displayName: "Ayşe",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
    lastMessage: "Good morning! ☀️",
    lastMessageTime: "3h",
    isOnline: false,
    unreadCount: 1,
  },
  {
    id: "4",
    displayName: "Maria",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
    lastMessage: "Let's video chat later!",
    lastMessageTime: "1d",
    isOnline: false,
    unreadCount: 0,
  },
];

export default function MessagesScreen() {
  const { user } = useUser();
  const { t } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [selectedChat, setSelectedChat] = useState<ChatUser | null>(null);
  const [showChatOptions, setShowChatOptions] = useState(false);
  const [chats, setChats] = useState<ChatUser[]>(mockChats);

  const filteredChats = chats.filter((chat) =>
    chat.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChatPress = (chatId: string) => {
    console.log("Open chat:", chatId);
    router.push(`/chat/${chatId}`);
  };

  const handleDeleteChat = (chatId: string) => {
    Alert.alert(
      "Mesajı Sil",
      "Bu mesajı silmek istediğinizden emin misiniz?",
      [
        {
          text: "İptal",
          style: "cancel"
        },
        {
          text: "Sil",
          style: "destructive",
          onPress: () => {
            // Remove chat from local state
            setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
            console.log("Chat deleted:", chatId);
            setShowChatOptions(false);
            Alert.alert("Başarılı", "Mesaj silindi.");
          }
        }
      ]
    );
  };

  const handleChatOptions = (chat: ChatUser) => {
    setSelectedChat(chat);
    setShowChatOptions(true);
  };

  const handleBlockUser = (userId: string) => {
    Alert.alert(
      "Kullanıcıyı Engelle",
      "Bu kullanıcıyı engellemek istediğinizden emin misiniz? Engellenen kullanıcı sizinle mesajlaşamayacak.",
      [
        {
          text: "İptal",
          style: "cancel"
        },
        {
          text: "Engelle",
          style: "destructive",
          onPress: () => {
            // TODO: Implement actual block functionality
            console.log("Block user:", userId);
            setShowChatOptions(false);
            Alert.alert("Başarılı", "Kullanıcı engellendi.");
          }
        }
      ]
    );
  };

  const handleVideoCall = (userId: string) => {
    console.log("Start video call with:", userId);
  };

  const handleVoiceCall = (userId: string) => {
    console.log("Start voice call with:", userId);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('messages')}</Text>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search color={Colors.textMuted} size={18} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('searchMessagesPlaceholder')}
            placeholderTextColor={Colors.textMuted}
          />
        </View>
      </View>

      <ChatSearch
        visible={showSearch}
        onClose={() => setShowSearch(false)}
        onResultPress={(result) => {
          console.log('Navigate to message:', result);
          setShowSearch(false);
        }}
      />

      <ScrollView style={styles.chatList} contentContainerStyle={styles.chatListContent}>
        {filteredChats.map((chat) => (
          <TouchableOpacity
            key={chat.id}
            style={styles.chatItem}
            onPress={() => {
              setActiveMatchId(chat.id);
              handleChatPress(chat.id);
            }}
          >
            <View style={styles.avatarContainer}>
              <Image source={{ uri: chat.avatar }} style={styles.avatar} />
              {chat.isOnline && <View style={styles.onlineIndicator} />}
            </View>

            <View style={styles.chatContent}>
              <View style={styles.chatHeader}>
                <View style={styles.nameRow}>
                  <Text style={styles.chatName}>{chat.displayName}</Text>
                  {/* Verification Badges */}
                  {chat.verificationLevel === 'blue' && (
                    <View style={styles.blueBadge}>
                      <Text style={styles.blueBadgeText}>✓</Text>
                    </View>
                  )}
                  {chat.verificationLevel === 'yellow' && (
                    <View style={styles.yellowBadge}>
                      <Text style={styles.yellowBadgeText}>✓</Text>
                    </View>
                  )}
                  {/* VIP Badge */}
                  {chat.isVip && (
                    <View style={styles.vipBadge}>
                      <Text style={styles.vipBadgeText}>⭐</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.chatTime}>{chat.lastMessageTime}</Text>
              </View>
              
              {/* LUMI-ID and Age */}
              <View style={styles.userInfoRow}>
                <Text style={styles.lumiId}>{chat.lumiId}</Text>
                {chat.age && (
                  <Text style={styles.age}>{chat.age} yaş</Text>
                )}
              </View>
              
              <Text
                style={[
                  styles.lastMessage,
                  chat.unreadCount > 0 && styles.unreadMessage,
                ]}
                numberOfLines={1}
              >
                {chat.lastMessage}
              </Text>
            </View>

            {chat.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{chat.unreadCount}</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.optionsButton}
              onPress={() => handleChatOptions(chat)}
            >
              <MoreVertical size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        {filteredChats.length === 0 && (
          <View style={styles.emptyState}>
            <MessageCircle color={Colors.textMuted} size={48} strokeWidth={1.5} />
            <Text style={styles.emptyText}>
              {searchQuery ? t('noConversationsFound') : t('noMessages')}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery
                ? t('tryDifferentSearchTerm')
                : t('startConversation')}
            </Text>
          </View>
        )}
        
        <Footer />
      </ScrollView>

      <MatchMessages matchId={activeMatchId} testID="messages-realtime" />

      {/* Chat Options Modal */}
      <Modal
        visible={showChatOptions}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowChatOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Mesaj Seçenekleri</Text>
            
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                if (selectedChat) {
                  handleBlockUser(selectedChat.id);
                }
              }}
            >
              <Text style={[styles.modalOptionText, { color: "#FF3B30" }]}>
                🚫 Engelle
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                if (selectedChat) {
                  handleDeleteChat(selectedChat.id);
                }
              }}
            >
              <Trash2 size={20} color="#FF3B30" />
              <Text style={[styles.modalOptionText, { color: "#FF3B30" }]}>
                Mesajı Sil
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => setShowChatOptions(false)}
            >
              <Text style={styles.modalOptionText}>İptal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingBottom: 80,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  searchSection: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    marginLeft: 8,
  },
  chatList: {
    flex: 1,
  },
  chatListContent: {
    paddingBottom: 24,
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.borderLight,
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  chatTime: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  lastMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  unreadMessage: {
    color: Colors.text,
    fontWeight: "500" as const,
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  optionsButton: {
    padding: 8,
    borderRadius: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    width: "80%",
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 16,
    textAlign: "center",
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 12,
  },
  modalOptionText: {
    fontSize: 16,
    color: Colors.text,
  },
  // LUMI Features Styles
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 4,
  },
  lumiId: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '700',
    marginRight: 8,
  },
  age: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  // Verification Badges
  blueBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#1E90FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  blueBadgeText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
  },
  yellowBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  yellowBadgeText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
  },
  vipBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  vipBadgeText: {
    fontSize: 8,
    color: '#FFD700',
    fontWeight: 'bold',
  },
});
