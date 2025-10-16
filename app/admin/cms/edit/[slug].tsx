import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Save, Trash2 } from 'lucide-react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function EditCMSPage() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [policyId, setPolicyId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [showInFooter, setShowInFooter] = useState(true);
  const [footerLabel, setFooterLabel] = useState('');

  useEffect(() => {
    loadPage();
  }, [slug]);

  const loadPage = async () => {
    try {
      setLoading(true);
      console.log('[CMS Edit] Loading page:', slug);

      if (!supabase) {
        Alert.alert('Error', 'Database connection not available');
        return;
      }

      const { data: policy, error } = await supabase
        .from('policies')
        .select(`
          id,
          slug,
          title,
          show_in_footer,
          footer_label,
          policy_versions!inner(
            id,
            version,
            locale,
            content_markdown,
            content_html,
            status
          )
        `)
        .eq('slug', slug)
        .single();

      if (error) {
        console.error('[CMS Edit] Load error:', error);
        Alert.alert('Error', 'Failed to load page: ' + error.message);
        return;
      }

      if (!policy) {
        Alert.alert('Error', 'Page not found');
        router.back();
        return;
      }

      console.log('[CMS Edit] Page loaded:', policy.id);

      const versions = policy.policy_versions || [];
      const latestVersion = versions.sort((a: any, b: any) => b.version - a.version)[0];

      setPolicyId(policy.id);
      setTitle(policy.title || '');
      setContent(latestVersion?.content_markdown || latestVersion?.content_html || '');
      setShowInFooter(policy.show_in_footer || false);
      setFooterLabel(policy.footer_label || '');
    } catch (error: any) {
      console.error('[CMS Edit] Exception:', error);
      Alert.alert('Error', 'Failed to load page');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Error', 'Title and content are required');
      return;
    }

    setSaving(true);
    try {
      console.log('[CMS Edit] Saving page:', policyId);

      if (!supabase) {
        Alert.alert('Error', 'Database connection not available');
        setSaving(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('policies')
        .update({
          title,
          show_in_footer: showInFooter,
          footer_label: footerLabel || title,
        })
        .eq('id', policyId);

      if (updateError) {
        console.error('[CMS Edit] Update error:', updateError);
        Alert.alert('Error', 'Failed to update page: ' + updateError.message);
        setSaving(false);
        return;
      }

      const { data: versions } = await supabase
        .from('policy_versions')
        .select('version')
        .eq('policy_id', policyId)
        .order('version', { ascending: false })
        .limit(1);

      const latestVersion = versions?.[0]?.version || 0;

      const { error: versionError } = await supabase
        .from('policy_versions')
        .update({
          content_markdown: content,
          content_html: content,
        })
        .eq('policy_id', policyId)
        .eq('version', latestVersion);

      if (versionError) {
        console.error('[CMS Edit] Version error:', versionError);
        Alert.alert('Error', 'Failed to update content: ' + versionError.message);
        setSaving(false);
        return;
      }

      const { data: footerItem } = await supabase
        .from('footer_items')
        .select('*')
        .eq('policy_id', policyId)
        .eq('locale', 'en')
        .single();

      if (showInFooter && !footerItem) {
        const { data: footerItems } = await supabase
          .from('footer_items')
          .select('order_index')
          .order('order_index', { ascending: false })
          .limit(1);

        const maxOrder = footerItems?.[0]?.order_index || 0;

        await supabase
          .from('footer_items')
          .insert({
            policy_id: policyId,
            locale: 'en',
            label: footerLabel || title,
            order_index: maxOrder + 1,
            is_active: true,
          });
      } else if (!showInFooter && footerItem) {
        await supabase
          .from('footer_items')
          .delete()
          .eq('policy_id', policyId)
          .eq('locale', 'en');
      } else if (showInFooter && footerItem) {
        await supabase
          .from('footer_items')
          .update({ label: footerLabel || title })
          .eq('policy_id', policyId)
          .eq('locale', 'en');
      }

      console.log('[CMS Edit] Page saved successfully');
      Alert.alert('Success', 'Page updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('[CMS Edit] Exception:', error);
      Alert.alert('Error', 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Page',
      'Are you sure you want to delete this page? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('[CMS Edit] Deleting page:', policyId);

              if (!supabase) {
                Alert.alert('Error', 'Database connection not available');
                return;
              }

              const { error: footerError } = await supabase
                .from('footer_items')
                .delete()
                .eq('policy_id', policyId);

              if (footerError) {
                console.error('[CMS Edit] Footer delete error:', footerError);
              }

              const { error } = await supabase
                .from('policies')
                .delete()
                .eq('id', policyId);

              if (error) {
                console.error('[CMS Edit] Delete error:', error);
                Alert.alert('Error', 'Failed to delete page: ' + error.message);
                return;
              }

              console.log('[CMS Edit] Page deleted successfully');
              Alert.alert('Success', 'Page deleted successfully', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (error: any) {
              console.error('[CMS Edit] Exception:', error);
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
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00D4FF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Page</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Trash2 size={20} color="#ff4444" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.label}>Page Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter page title"
            placeholderTextColor="#666"
          />

          <Text style={styles.label}>Content (HTML/Markdown)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={content}
            onChangeText={setContent}
            placeholder="Enter page content (HTML and Markdown supported)"
            placeholderTextColor="#666"
            multiline
            numberOfLines={20}
            textAlignVertical="top"
          />

          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <Text style={styles.label}>Show in Footer</Text>
              <Text style={styles.helperText}>Display this page in the app footer</Text>
            </View>
            <Switch
              value={showInFooter}
              onValueChange={setShowInFooter}
              trackColor={{ false: '#333', true: '#00FF88' }}
              thumbColor={showInFooter ? '#fff' : '#666'}
            />
          </View>

          {showInFooter && (
            <>
              <Text style={styles.label}>Footer Label (Optional)</Text>
              <TextInput
                style={styles.input}
                value={footerLabel}
                onChangeText={setFooterLabel}
                placeholder={title || 'Footer label'}
                placeholderTextColor="#666"
              />
              <Text style={styles.helperText}>
                Leave empty to use the page title
              </Text>
            </>
          )}

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Save size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
  },
  deleteButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#fff',
    marginBottom: 16,
  },
  textArea: {
    minHeight: 300,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  switchLabel: {
    flex: 1,
  },
  helperText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#00D4FF',
    borderRadius: 8,
    padding: 14,
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
