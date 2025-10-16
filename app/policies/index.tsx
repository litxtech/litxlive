import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { usePolicies } from '@/providers/PolicyProvider';
import { Stack, router } from 'expo-router';

export default function PoliciesListScreen() {
  const { policies, isLoading } = usePolicies();
  const data = useMemo(() => policies, [policies]);

  return (
    <View style={styles.container} testID="policies-list">
      <Stack.Screen options={{ title: 'Policies' }} />
      {isLoading ? (
        <Text style={styles.loading}>Loading...</Text>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.item} onPress={() => router.push(`/policies/${item.slug}` as any)} testID={`policy-item-${item.slug}`}>
              <Text style={styles.title}>{item.title}</Text>
              <Text numberOfLines={2} style={styles.subtitle}>{item.category ?? item.slug}</Text>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  loading: { color: '#999' },
  item: { paddingVertical: 12 },
  title: { color: '#fff', fontSize: 16, fontWeight: '700' as const },
  subtitle: { color: '#9aa0a6', marginTop: 4 },
  sep: { height: 1, backgroundColor: '#222', opacity: 0.6 },
});
