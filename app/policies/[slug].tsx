import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { usePolicies } from '@/providers/PolicyProvider';

export default function PolicyDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { policies } = usePolicies();
  const policy = useMemo(() => policies.find(p => p.slug === slug), [policies, slug]);

  return (
    <View style={styles.container} testID="policy-detail">
      <Stack.Screen options={{ title: policy?.title ?? 'Policy' }} />
      {!policy ? (
        <Text style={styles.loading}>Not found</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          <Text style={styles.title}>{policy.title}</Text>
          <Text style={styles.bodyText}>{policy.body_md}</Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  loading: { color: '#999' },
  body: { paddingBottom: 24 },
  title: { color: '#fff', fontSize: 20, fontWeight: '700' as const, marginBottom: 8 },
  bodyText: { color: '#c9d1d9', fontSize: 15, lineHeight: 22 },
});
