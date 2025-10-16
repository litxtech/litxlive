import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAdmin } from '@/providers/AdminProvider';
import { adminApi, FooterContent, Policy } from '@/services/adminApi';
import AdminSidebar from '@/components/AdminSidebar';
import { FileText, Link } from 'lucide-react-native';

export default function AdminContent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isLoading: authLoading } = useAdmin();
  const [footerContent, setFooterContent] = useState<FooterContent[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/admin' as any);
    }
  }, [isAuthenticated, authLoading, router]);

  const loadContent = async () => {
    try {
      const [footer, pols] = await Promise.all([
        adminApi.getFooter(),
        adminApi.getPolicies(),
      ]);
      setFooterContent(footer);
      setPolicies(pols);
    } catch (err) {
      console.error('[Content] Error loading content:', err);
      Alert.alert('Error', 'Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadContent();
    }
  }, [isAuthenticated]);

  if (authLoading || loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {Platform.OS === 'web' && <AdminSidebar />}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4C6FFF" />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {Platform.OS === 'web' && <AdminSidebar />}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Content Management</Text>
          <Text style={styles.subtitle}>Manage footer and policies</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Link size={20} color="#4C6FFF" />
            <Text style={styles.sectionTitle}>Footer Content</Text>
          </View>
          {footerContent.map((item) => (
            <View key={item.id} style={styles.contentCard}>
              <Text style={styles.contentName}>{item.section_name}</Text>
              <Text style={styles.contentLanguage}>Language: {item.language}</Text>
              <Text style={styles.contentOrder}>Order: {item.order_index}</Text>
              <View style={[styles.activeBadge, item.is_active && styles.activeBadgeActive]}>
                <Text style={styles.activeText}>{item.is_active ? 'Active' : 'Inactive'}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FileText size={20} color="#4C6FFF" />
            <Text style={styles.sectionTitle}>Policies</Text>
          </View>
          {policies.map((policy) => (
            <View key={policy.id} style={styles.contentCard}>
              <Text style={styles.contentName}>{policy.title}</Text>
              <Text style={styles.contentType}>Type: {policy.policy_type}</Text>
              <Text style={styles.contentLanguage}>Language: {policy.language}</Text>
              <Text style={styles.contentVersion}>Version: {policy.version}</Text>
              <View style={[styles.activeBadge, policy.is_active && styles.activeBadgeActive]}>
                <Text style={styles.activeText}>{policy.is_active ? 'Active' : 'Inactive'}</Text>
              </View>
              {policy.requires_consent && (
                <View style={styles.consentBadge}>
                  <Text style={styles.consentText}>Requires Consent</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#0c0d10',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#9aa4bf',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  contentCard: {
    backgroundColor: '#101015',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#23263a',
    marginBottom: 12,
  },
  contentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  contentType: {
    fontSize: 14,
    color: '#9aa4bf',
    marginBottom: 4,
  },
  contentLanguage: {
    fontSize: 14,
    color: '#9aa4bf',
    marginBottom: 4,
  },
  contentOrder: {
    fontSize: 14,
    color: '#9aa4bf',
    marginBottom: 8,
  },
  contentVersion: {
    fontSize: 14,
    color: '#9aa4bf',
    marginBottom: 8,
  },
  activeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#2a1a1f',
    marginTop: 8,
  },
  activeBadgeActive: {
    backgroundColor: '#1a2a22',
  },
  activeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  consentBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#2a2315',
    marginTop: 8,
  },
  consentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
});
