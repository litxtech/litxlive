import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MessageSquare, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';

interface Suggestion {
  id: string;
  text: string;
}

export default function LumiAssistant() {
  const [open, setOpen] = useState<boolean>(false);
  const insets = useSafeAreaInsets();

  const suggestions = useMemo<Suggestion[]>(
    () => [
      { id: 's1', text: 'Find recent matches' },
      { id: 's2', text: 'How to start a video call?' },
      { id: 's3', text: 'Report a problem' },
    ],
    [],
  );

  const toggle = useCallback(() => setOpen((v) => !v), []);

  return (
    <View pointerEvents="box-none" style={[styles.container, { bottom: Math.max(16, insets.bottom + 72) }]} testID="lumi-assistant">
      {open && (
        <View style={styles.panel} testID="lumi-panel">
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Lumi Assistant</Text>
            <TouchableOpacity onPress={toggle} testID="lumi-close">
              <X size={18} color={Colors.text} />
            </TouchableOpacity>
          </View>
          {suggestions.map((s) => (
            <TouchableOpacity key={s.id} style={styles.suggestion} onPress={() => console.log('Lumi:', s.text)} testID={`lumi-suggestion-${s.id}`}>
              <Text style={styles.suggestionText}>{s.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TouchableOpacity
        onPress={toggle}
        style={styles.fab}
        testID="lumi-fab"
        accessibilityRole={Platform.OS === 'web' ? undefined : 'button'}
      >
        <MessageSquare size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    zIndex: 100,
  },
  fab: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  panel: {
    position: 'absolute',
    left: 0,
    bottom: 56,
    width: 300,
    maxWidth: '90%',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  suggestion: {
    paddingVertical: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
