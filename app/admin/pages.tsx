import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { FileText, Plus, Edit2, Trash2, Save, X, List } from 'lucide-react-native';

type Page = {
  id: string;
  slug: string;
  title: string;
  show_in_footer: boolean;
  footer_label: string;
  created_at: string;
  latest_version: {
    content_markdown: string;
    version: number;
  };
  total_versions: number;
};

export default function PagesManagement() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    content: '',
    footer_label: '',
    show_in_footer: true,
  });
  const [autoSaveTimer, setAutoSaveTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    fetchPages();
  }, []);

  useEffect(() => {
    if (hasUnsavedChanges && editingPage) {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
      const timer = setTimeout(() => {
        handleAutoSave();
      }, 3000);
      setAutoSaveTimer(timer);
    }
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [formData, hasUnsavedChanges]);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const base = process.env.EXPO_PUBLIC_API_URL || '';
      const response = await fetch(`${base}/api/admin/pages`, {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch pages');

      const data = await response.json();
      setPages(data.pages || []);
    } catch (error) {
      console.error('Error fetching pages:', error);
      Alert.alert('Error', 'Failed to load pages');
    } finally {
      setLoading(false);
    }
  };

  const getAuthToken = async (): Promise<string> => {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const token = await AsyncStorage.getItem('admin_token');
      if (token) return token;
      
      const { supabase } = await import('@/lib/supabase');
      if (!supabase) return '';
      const { data, error } = await supabase.auth.getSession();
      if (error || !data?.session?.access_token) return '';
      return data.session.access_token;
    } catch (e) {
      console.error('[PagesManagement] getAuthToken error', e);
      return '';
    }
  };

  const handleCreate = () => {
    setFormData({
      slug: '',
      title: '',
      content: '',
      footer_label: '',
      show_in_footer: true,
    });
    setEditingPage(null);
    setShowCreateModal(true);
  };

  const handleEdit = (page: Page) => {
    setFormData({
      slug: page.slug,
      title: page.title,
      content: page.latest_version?.content_markdown || '',
      footer_label: page.footer_label,
      show_in_footer: page.show_in_footer,
    });
    setEditingPage(page);
    setHasUnsavedChanges(false);
    setLastSaved(null);
    setShowCreateModal(true);
  };

  const handleAutoSave = useCallback(async () => {
    if (!editingPage || !formData.content) return;

    try {
      const base = process.env.EXPO_PUBLIC_API_URL || '';
      const response = await fetch(
        `${base}/api/admin/pages/${editingPage.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${await getAuthToken()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...formData, create_new_version: false }),
        }
      );

      if (response.ok) {
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [editingPage, formData]);

  const handleSave = async () => {
    try {
      if (!formData.title || !formData.content) {
        Alert.alert('Error', 'Title and content are required');
        return;
      }

      const base = process.env.EXPO_PUBLIC_API_URL || '';
      const url = editingPage
        ? `${base}/api/admin/pages/${editingPage.id}`
        : `${base}/api/admin/pages`;

      const method = editingPage ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save page');

      Alert.alert('Success', `Page ${editingPage ? 'updated' : 'created'} successfully`);
      setShowCreateModal(false);
      setHasUnsavedChanges(false);
      setLastSaved(null);
      fetchPages();
    } catch (error) {
      console.error('Error saving page:', error);
      Alert.alert('Error', 'Failed to save page');
    }
  };

  const handleDelete = (page: Page) => {
    Alert.alert(
      'Delete Page',
      `Are you sure you want to delete "${page.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const base = process.env.EXPO_PUBLIC_API_URL || '';
              const response = await fetch(
                `${base}/api/admin/pages/${page.id}`,
                {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${await getAuthToken()}`,
                    'Content-Type': 'application/json',
                  },
                }
              );

              if (!response.ok) throw new Error('Failed to delete page');

              Alert.alert('Success', 'Page deleted successfully');
              fetchPages();
            } catch (error) {
              console.error('Error deleting page:', error);
              Alert.alert('Error', 'Failed to delete page');
            }
          },
        },
      ]
    );
  };

  const renderPageItem = (page: Page) => (
    <View key={page.id} style={styles.pageCard}>
      <View style={styles.pageHeader}>
        <View style={styles.pageInfo}>
          <Text style={styles.pageTitle}>{page.title}</Text>
          <Text style={styles.pageSlug}>/{page.slug}</Text>
          <View style={styles.pageMeta}>
            <Text style={styles.pageMetaText}>
              v{page.latest_version?.version || 1} • {page.total_versions} versions
            </Text>
            {page.show_in_footer && (
              <View style={styles.footerBadge}>
                <Text style={styles.footerBadgeText}>Footer</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.pageActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEdit(page)}
          >
            <Edit2 size={18} color="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDelete(page)}
          >
            <Trash2 size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Page Management',
          headerStyle: { backgroundColor: '#0B0B10' },
          headerTintColor: '#FFFFFF',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backButton}>← Back</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Pages & Policies</Text>
            <Text style={styles.headerSubtitle}>
              Manage legal documents and static pages
            </Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.footerButton}
              onPress={() => router.push('/admin/footer-manager' as any)}
            >
              <List size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.createButtonText}>New Page</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : pages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FileText size={48} color="#4B5563" />
            <Text style={styles.emptyText}>No pages yet</Text>
            <Text style={styles.emptySubtext}>
              Create your first page to get started
            </Text>
          </View>
        ) : (
          <View style={styles.pagesList}>
            {pages.map(renderPageItem)}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>
                {editingPage ? 'Edit Page' : 'Create New Page'}
              </Text>
              {editingPage && lastSaved && (
                <Text style={styles.autoSaveText}>
                  Last saved: {lastSaved.toLocaleTimeString()}
                </Text>
              )}
              {editingPage && hasUnsavedChanges && (
                <Text style={styles.unsavedText}>Unsaved changes...</Text>
              )}
            </View>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Slug (URL) - Optional</Text>
              <TextInput
                style={styles.input}
                value={formData.slug}
                onChangeText={(text) => {
                  setFormData({ ...formData, slug: text });
                  setHasUnsavedChanges(true);
                }}
                placeholder="Auto-generated from title"
                placeholderTextColor="#6B7280"
                editable={!editingPage}
              />
              <Text style={styles.helperText}>Leave empty to auto-generate from title</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(text) => {
                  setFormData({ ...formData, title: text });
                  setHasUnsavedChanges(true);
                }}
                placeholder="Privacy Policy"
                placeholderTextColor="#6B7280"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Footer Label</Text>
              <TextInput
                style={styles.input}
                value={formData.footer_label}
                onChangeText={(text) => {
                  setFormData({ ...formData, footer_label: text });
                  setHasUnsavedChanges(true);
                }}
                placeholder="Privacy"
                placeholderTextColor="#6B7280"
              />
            </View>

            <View style={styles.formGroup}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() =>
                  setFormData({ ...formData, show_in_footer: !formData.show_in_footer })
                }
              >
                <View
                  style={[
                    styles.checkboxBox,
                    formData.show_in_footer && styles.checkboxBoxChecked,
                  ]}
                >
                  {formData.show_in_footer && (
                    <Text style={styles.checkboxCheck}>✓</Text>
                  )}
                </View>
                <Text style={styles.checkboxLabel}>Show in footer</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Content (Markdown/HTML)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.content}
                onChangeText={(text) => {
                  setFormData({ ...formData, content: text });
                  setHasUnsavedChanges(true);
                }}
                placeholder="Enter page content..."
                placeholderTextColor="#6B7280"
                multiline
                numberOfLines={15}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Save size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>
                {editingPage ? 'Update Page' : 'Create Page'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B10',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  footerButton: {
    backgroundColor: '#374151',
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  pagesList: {
    padding: 20,
    gap: 12,
  },
  pageCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pageInfo: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  pageSlug: {
    fontSize: 14,
    color: '#3B82F6',
    marginBottom: 8,
  },
  pageMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pageMetaText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  footerBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  footerBadgeText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  pageActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#374151',
  },
  backButton: {
    color: '#3B82F6',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0B0B10',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  autoSaveText: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 4,
  },
  unsavedText: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 4,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#FFFFFF',
  },
  textArea: {
    minHeight: 200,
    maxHeight: 400,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#374151',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  checkboxCheck: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  helperText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
    marginTop: 20,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
