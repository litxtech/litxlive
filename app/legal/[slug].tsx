import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';

interface PageContent {
  title: string;
  content: string;
  slug: string;
}

export default function DynamicLegalPage() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [page, setPage] = useState<PageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!supabase) {
        setError('Database connection not available');
        setLoading(false);
        return;
      }

      const { data: policy, error: policyError } = await supabase
        .from('policies')
        .select(`
          id,
          slug,
          title,
          policy_versions!inner(
            content_markdown,
            content_html,
            version,
            status
          )
        `)
        .eq('slug', slug)
        .eq('policy_versions.status', 'published')
        .order('policy_versions.version', { ascending: false })
        .limit(1)
        .single();

      if (policyError) {
        console.error('[DynamicLegalPage] Error:', policyError);
        setError('Page not found');
        setLoading(false);
        return;
      }

      if (!policy || !policy.policy_versions || policy.policy_versions.length === 0) {
        setError('Page not found');
        setLoading(false);
        return;
      }

      const latestVersion = policy.policy_versions[0];
      setPage({
        title: policy.title,
        content: latestVersion.content_html || latestVersion.content_markdown,
        slug: policy.slug,
      });
    } catch (err: any) {
      console.error('[DynamicLegalPage] Exception:', err);
      setError('Failed to load page');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    fetchPage();
  }, [slug, fetchPage]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Loading...',
            headerStyle: { backgroundColor: Colors.background },
            headerTintColor: Colors.text,
          }}
        />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !page) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Error',
            headerStyle: { backgroundColor: Colors.background },
            headerTintColor: Colors.text,
          }}
        />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error || 'Page not found'}</Text>
          <Text style={styles.errorSubtext}>
            The page you&apos;re looking for doesn&apos;t exist or has been removed.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: page.title,
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
        }}
      />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>{page.title}</Text>
          <Text style={styles.body}>{page.content}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 20,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textSecondary,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
