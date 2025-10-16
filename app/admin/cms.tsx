import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, FileText, Eye, Edit, Plus, Trash2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

interface Page {
  id: string;
  slug: string;
  title: string;
  show_in_footer: boolean;
  footer_label: string | null;
  created_at: string;
  latest_version?: {
    id: string;
    version: number;
    locale: string;
    status: string;
    content_markdown: string;
    content_html: string;
  };
  total_versions?: number;
}

export default function AdminCMS() {
  const router = useRouter();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      setLoading(true);
      console.log('[CMS] Loading pages from Supabase...');

      if (!supabase) {
        console.error('[CMS] Supabase client not initialized');
        Alert.alert('Error', 'Database connection not available');
        return;
      }

      const { data: policies, error } = await supabase
        .from('policies')
        .select(`
          id,
          slug,
          title,
          show_in_footer,
          footer_label,
          created_at,
          policy_versions!inner(
            id,
            version,
            locale,
            status,
            content_markdown,
            content_html,
            created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[CMS] Error loading pages:', error);
        Alert.alert('Error', 'Failed to load pages: ' + error.message);
        return;
      }

      console.log('[CMS] Loaded policies:', policies?.length || 0);

      const pagesWithLatestVersion = (policies || []).map((policy: any) => {
        const versions = policy.policy_versions || [];
        const latestVersion = versions.sort((a: any, b: any) => b.version - a.version)[0];
        
        return {
          id: policy.id,
          slug: policy.slug,
          title: policy.title,
          show_in_footer: policy.show_in_footer,
          footer_label: policy.footer_label,
          created_at: policy.created_at,
          latest_version: latestVersion,
          total_versions: versions.length
        };
      });

      setPages(pagesWithLatestVersion);
      console.log('[CMS] Pages loaded successfully:', pagesWithLatestVersion.length);
    } catch (error: any) {
      console.error('[CMS] Exception loading pages:', error);
      Alert.alert('Error', 'Failed to load pages');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPages();
  };

  const handleDelete = async (page: Page) => {
    Alert.alert(
      'Delete Page',
      `Are you sure you want to delete "${page.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!supabase) {
                Alert.alert('Error', 'Database connection not available');
                return;
              }

              console.log('[CMS] Deleting page:', page.id);

              const { error: footerError } = await supabase
                .from('footer_items')
                .delete()
                .eq('policy_id', page.id);

              if (footerError) {
                console.error('[CMS] Error deleting footer items:', footerError);
              }

              const { error } = await supabase
                .from('policies')
                .delete()
                .eq('id', page.id);

              if (error) {
                console.error('[CMS] Error deleting page:', error);
                Alert.alert('Error', 'Failed to delete page: ' + error.message);
                return;
              }

              console.log('[CMS] Page deleted successfully');
              Alert.alert('Success', 'Page deleted successfully');
              loadPages();
            } catch (error: any) {
              console.error('[CMS] Exception deleting page:', error);
              Alert.alert('Error', 'Failed to delete page');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>CMS</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00D4FF" />
          <Text style={styles.loadingText}>Loading pages...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CMS</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pages ({pages.length})</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={handleRefresh}
                disabled={refreshing}
              >
                <Text style={styles.refreshButtonText}>
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => router.push('/admin/cms/create')}
              >
                <Plus size={18} color="#0B0B10" />
                <Text style={styles.createButtonText}>New Page</Text>
              </TouchableOpacity>
            </View>
          </View>

          {pages.length === 0 ? (
            <View style={styles.emptyState}>
              <FileText size={48} color="#666" />
              <Text style={styles.emptyStateTitle}>No pages yet</Text>
              <Text style={styles.emptyStateText}>Create your first page to get started</Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => router.push('/admin/cms/create')}
              >
                <Plus size={20} color="#fff" />
                <Text style={styles.emptyStateButtonText}>Create Page</Text>
              </TouchableOpacity>
            </View>
          ) : (
            pages.map((page) => (
              <View key={page.id} style={styles.pageCard}>
                <View style={styles.pageInfo}>
                  <FileText size={20} color="#00D4FF" />
                  <View style={styles.pageDetails}>
                    <Text style={styles.pageTitle}>{page.title}</Text>
                    <Text style={styles.pageRoute}>/{page.slug}</Text>
                    {page.total_versions && page.total_versions > 1 && (
                      <Text style={styles.versionText}>
                        {page.total_versions} versions
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.pageActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => router.push(`/${page.slug}` as any)}
                  >
                    <Eye size={18} color="#666" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => router.push(`/admin/cms/edit/${page.slug}` as any)}
                  >
                    <Edit size={18} color="#00D4FF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(page)}
                  >
                    <Trash2 size={18} color="#ff4444" />
                  </TouchableOpacity>
                  {page.latest_version && (
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>{page.latest_version.status}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B10',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#00D4FF',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#00FF88',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#0B0B10',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#00FF88',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#0B0B10',
  },
  pageCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pageDetails: {
    marginLeft: 12,
    flex: 1,
  },
  pageTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  pageRoute: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  versionText: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  pageActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    backgroundColor: '#0B0B10',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  deleteButton: {
    padding: 8,
    backgroundColor: '#0B0B10',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  statusBadge: {
    backgroundColor: '#00FF8820',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#00FF88',
  },
});
