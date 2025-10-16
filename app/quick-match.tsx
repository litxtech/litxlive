import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { useQuickMatch } from '@/hooks/useQuickMatch';
import { useUser } from '@/providers/UserProvider';
import { Colors } from '@/constants/colors';
import { Video, X } from 'lucide-react-native';

export default function QuickMatchScreen() {
  const { user } = useUser();
  const userId = user?.id ?? '';
  const { phase, match, start } = useQuickMatch(userId, { want: 'any', region: 'eu' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!match) return;
    // TODO: Get conversation ID from match
    // const unsub = subscribeInbox(match.id, (m) => {
    //   setMessages(prev => [...prev, m]);
    // });
    // return () => {
    //   unsub();
    // };
  }, [match?.id]);

  const handleSend = async () => {
    if (!match || !msg.trim()) return;
    try {
      // TODO: Get conversation ID from match
      // await sendMessage(match.id, userId, msg);
      setMsg('');
      console.log('Message sending not yet implemented');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
        headerShown: true, 
        title: 'Quick Match',
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        headerRight: () => (
          <TouchableOpacity onPress={() => router.back()}>
            <X color={Colors.text} size={24} />
          </TouchableOpacity>
        )
      }} />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Status</Text>
          <Text style={styles.statusValue}>{phase}</Text>
        </View>

        {!match && phase === 'idle' && (
          <TouchableOpacity style={styles.startButton} onPress={start}>
            <Video color={Colors.background} size={24} />
            <Text style={styles.startButtonText}>Start Matching</Text>
          </TouchableOpacity>
        )}

        {phase === 'queue' && (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Searching for a match...</Text>
          </View>
        )}

        {match && (
          <View style={styles.matchCard}>
            <Text style={styles.matchTitle}>Match Found!</Text>
            <Text style={styles.matchRoom}>Room: {match.id}</Text>

            <View style={styles.messagesSection}>
              <Text style={styles.messagesTitle}>Messages (Coming Soon)</Text>
              <View style={styles.inputRow}>
                <TextInput
                  value={msg}
                  onChangeText={setMsg}
                  placeholder="Type a message..."
                  placeholderTextColor={Colors.textMuted}
                  style={styles.input}
                />
                <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                  <Text style={styles.sendButtonText}>Send</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  statusCard: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusLabel: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
    textTransform: 'capitalize' as const,
  },
  startButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.background,
  },
  loadingCard: {
    backgroundColor: Colors.card,
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.text,
  },
  matchCard: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 16,
  },
  matchTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  matchRoom: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  videoPlaceholder: {
    backgroundColor: Colors.background,
    padding: 24,
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
  },
  videoPlaceholderText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  videoInfo: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  messagesSection: {
    gap: 12,
  },
  messagesTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  messagesList: {
    maxHeight: 200,
    gap: 8,
  },
  messageItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  myMessage: {
    backgroundColor: Colors.primary,
    alignSelf: 'flex-end',
    maxWidth: '80%',
  },
  theirMessage: {
    backgroundColor: Colors.border,
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  messageText: {
    fontSize: 14,
    color: Colors.text,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  sendButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.background,
  },
});
