import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform, FlatList, KeyboardAvoidingView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Brain, Send, X } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ChatMessagePartText {
  type: 'text';
  text: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  parts: ChatMessagePartText[];
}

function useAssistantAgent() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<unknown>(null);

  const sendMessage = useCallback(async (input: string | { text: string }) => {
    const text = typeof input === 'string' ? input : input?.text ?? '';
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      role: 'user',
      parts: [{ type: 'text', text }],
    };

    setMessages((prev) => [...prev, userMsg]);

    try {
      const base = process.env.EXPO_PUBLIC_TOOLKIT_URL ?? '';
      const url = base ? new URL('/agent/chat', base).toString() : '';

      if (!url) {
        const fallback: ChatMessage = {
          id: `a_${Date.now()}`,
          role: 'assistant',
          parts: [{ type: 'text', text: 'AI yapılandırması eksik. Lütfen EXPO_PUBLIC_TOOLKIT_URL ayarlayın.' }],
        };
        setMessages((prev) => [...prev, fallback]);
        return;
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: text }] }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { text?: string } | { messages?: { role: string; content: { type: 'text'; text: string }[] }[] };

      let reply = '';
      if ('text' in (data as any) && typeof (data as any).text === 'string') {
        reply = String((data as any).text);
      } else if ('messages' in (data as any) && Array.isArray((data as any).messages)) {
        const last = (data as any).messages[(data as any).messages.length - 1];
        reply = last?.content?.find?.((p: any) => p?.type === 'text')?.text ?? '';
      }

      const aiMsg: ChatMessage = {
        id: `a_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        role: 'assistant',
        parts: [{ type: 'text', text: reply || '✔️ İstek başarılı ancak yanıt boş döndü.' }],
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (e) {
      console.error('[DeepseekAssistant] agent error', e);
      setError(e);
      const errMsg: ChatMessage = {
        id: `e_${Date.now()}`,
        role: 'assistant',
        parts: [{ type: 'text', text: 'AI servisine ulaşılamadı. Lütfen tekrar deneyin.' }],
      };
      setMessages((prev) => [...prev, errMsg]);
    }
  }, []);

  return { messages, error, sendMessage } as const;
}

export default function DeepseekAssistant() {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState<boolean>(false);
  const [input, setInput] = useState<string>('');
  const inputRef = useRef<TextInput | null>(null);

  const { messages, error, sendMessage } = useAssistantAgent();

  const onToggle = useCallback(() => {
    setOpen((v) => !v);
    console.log('[DeepseekAssistant] toggle');
  }, []);

  const onSend = useCallback(async () => {
    try {
      const text = input.trim();
      if (!text) return;
      console.log('[DeepseekAssistant] Sending message:', text);
      setInput('');
      await sendMessage(text);
    } catch (e) {
      console.error('[DeepseekAssistant] Send error', e);
    }
  }, [input, sendMessage]);

  const quickPrompts = useMemo(
    () => [
      'Profilimi nasıl iyileştiririm?',
      'Bugün kiminle eşleşebilirim?',
      'Güvenlik ve gizlilik ipuçları',
    ],
    [],
  );

  return (
    <View pointerEvents="box-none" style={[styles.absolute, { bottom: Math.max(16, insets.bottom + 8) }]} testID="deepseek-assistant">
      {open && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.panelWrapper}
          pointerEvents="box-none"
        >
          <View style={styles.panel} testID="deepseek-panel">
            <View style={styles.panelHeader}>
              <View style={styles.headerLeft}>
                <LinearGradient colors={Colors.gradients.purple} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.logoCircle}>
                  <Brain color="#fff" size={16} />
                </LinearGradient>
                <Text style={styles.panelTitle}>DeepSeek</Text>
              </View>
              <TouchableOpacity onPress={onToggle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} testID="deepseek-close">
                <X size={18} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={(messages as ChatMessage[]) ?? []}
              keyExtractor={(m) => m.id}
              renderItem={({ item }) => (
                <View style={[styles.msg, item.role === 'user' ? styles.msgUser : styles.msgAi]}>
                  <Text style={[styles.msgText, item.role === 'user' ? styles.msgTextUser : styles.msgTextAi]}>
                    {item.parts?.[0]?.text ?? ''}
                  </Text>
                </View>
              )}
              contentContainerStyle={styles.msgList}
              testID="deepseek-messages"
            />

            {!!error && (
              <Text style={styles.errorText} testID="deepseek-error">{String(error)}</Text>
            )}

            <View style={styles.quickRow}>
              {quickPrompts.map((q) => (
                <TouchableOpacity
                  key={q}
                  style={styles.quickChip}
                  onPress={() => setInput(q)}
                  testID={`deepseek-quick-${q}`}
                >
                  <Text style={styles.quickText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inputRow}>
              <TextInput
                ref={inputRef}
                value={input}
                onChangeText={setInput}
                placeholder="Bir şey sor..."
                placeholderTextColor={Colors.textMuted}
                style={styles.input}
                returnKeyType="send"
                onSubmitEditing={onSend}
                testID="deepseek-input"
              />
              <TouchableOpacity style={styles.sendBtn} onPress={onSend} testID="deepseek-send">
                <LinearGradient colors={Colors.gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.sendGrad}>
                  <Send size={16} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}

      <TouchableOpacity onPress={onToggle} activeOpacity={0.9} style={styles.fab} testID="deepseek-fab">
        <LinearGradient colors={Colors.gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fabGrad}>
          <Brain color="#fff" size={18} />
          <Text style={styles.fabText}>DeepSeek</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  absolute: {
    position: 'absolute',
    right: 16,
    left: 16,
    zIndex: 200,
  },
  fab: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  fabGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 56,
    borderRadius: 28,
    gap: 8,
  },
  fabText: {
    color: '#fff',
    fontWeight: '700' as const,
    fontSize: 14,
  },
  panelWrapper: {
    width: '100%',
    alignItems: 'flex-end',
  },
  panel: {
    width: 340,
    maxWidth: '100%',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  msgList: {
    paddingVertical: 8,
    gap: 6,
  },
  msg: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginVertical: 4,
    maxWidth: '90%',
  },
  msgUser: {
    alignSelf: 'flex-end',
    backgroundColor: '#f1e9ff',
  },
  msgAi: {
    alignSelf: 'flex-start',
    backgroundColor: '#f6f7f9',
  },
  msgText: {
    fontSize: 14,
  },
  msgTextUser: {
    color: '#4b2bb8',
  },
  msgTextAi: {
    color: Colors.text,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    color: Colors.text,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  sendGrad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  quickChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: 4,
  },
});