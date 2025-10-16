import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus } from 'lucide-react-native';
import { useRouter, Stack } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function CreateCMSPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');

  const [content, setContent] = useState('');

  const [footerLabel, setFooterLabel] = useState('');

  const generateSlug = (text: string) => {
    const turkishMap: { [key: string]: string } = {
      'ç': 'c', 'Ç': 'c',
      'ğ': 'g', 'Ğ': 'g',
      'ı': 'i', 'İ': 'i',
      'ö': 'o', 'Ö': 'o',
      'ş': 's', 'Ş': 's',
      'ü': 'u', 'Ü': 'u'
    };
    
    let slug = text;
    Object.keys(turkishMap).forEach(key => {
      slug = slug.replace(new RegExp(key, 'g'), turkishMap[key]);
    });
    
    return slug
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (text: string) => {
    setTitle(text);
  };

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Error', 'Title and content are required');
      return;
    }
    
    const slug = generateSlug(title);
    
    if (!slug) {
      Alert.alert('Error', 'Could not generate URL from title');
      return;
    }

    setSaving(true);
    try {
      console.log('[CMS Create] Creating page...');

      if (!supabase) {
        Alert.alert('Error', 'Database connection not available');
        setSaving(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in to create pages');
        setSaving(false);
        return;
      }

      const { data: userRecord } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!userRecord) {
        Alert.alert('Error', 'User record not found');
        setSaving(false);
        return;
      }

      const { data: policy, error: policyError } = await supabase
        .from('policies')
        .insert({
          slug,
          title,
          show_in_footer: true,
          footer_label: footerLabel || title,
          created_by: userRecord.id,
        })
        .select()
        .single();

      if (policyError) {
        console.error('[CMS Create] Policy error:', policyError);
        Alert.alert('Error', 'Failed to create page: ' + policyError.message);
        setSaving(false);
        return;
      }

      console.log('[CMS Create] Policy created:', policy.id);

      const { data: version, error: versionError } = await supabase
        .from('policy_versions')
        .insert({
          policy_id: policy.id,
          version: 1,
          locale: 'en',
          content_markdown: content,
          content_html: content,
          status: 'published',
          effective_at: new Date().toISOString(),
          created_by: userRecord.id,
        })
        .select()
        .single();

      if (versionError) {
        console.error('[CMS Create] Version error:', versionError);
        Alert.alert('Error', 'Failed to create page version: ' + versionError.message);
        setSaving(false);
        return;
      }

      console.log('[CMS Create] Version created:', version.id);

      const { data: footerItems } = await supabase
        .from('footer_items')
        .select('order_index')
        .order('order_index', { ascending: false })
        .limit(1);

      const maxOrder = footerItems?.[0]?.order_index || 0;

      await supabase
        .from('footer_items')
        .insert({
          policy_id: policy.id,
          locale: 'en',
          label: footerLabel || title,
          order_index: maxOrder + 1,
          is_active: true,
        });

      console.log('[CMS Create] Footer item created');

      Alert.alert('Success', 'Page created successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('[CMS Create] Exception:', error);
      Alert.alert('Error', 'Failed to create page: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create New Page</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.label}>Page Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={handleTitleChange}
            placeholder="Enter page title (e.g., Privacy Policy, Hakkımızda)"
            placeholderTextColor="#666"
          />
          {title.trim() && (
            <Text style={styles.helperText}>
              URL will be: /{generateSlug(title)}
            </Text>
          )}

          <Text style={styles.label}>Content (HTML/Markdown) *</Text>
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

          <Text style={styles.label}>Footer Label (Optional)</Text>
          <TextInput
            style={styles.input}
            value={footerLabel}
            onChangeText={setFooterLabel}
            placeholder={title || 'Leave empty to use page title'}
            placeholderTextColor="#666"
          />
          <Text style={styles.helperText}>
            This label will appear in the app footer. Leave empty to use the page title.
          </Text>

          <TouchableOpacity
            style={[styles.createButton, saving && styles.createButtonDisabled]}
            onPress={handleCreate}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Plus size={20} color="#fff" />
                <Text style={styles.createButtonText}>Create Page</Text>
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
  helperText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 16,
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

  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#00FF88',
    borderRadius: 8,
    padding: 14,
    marginTop: 8,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#0B0B10',
  },
});
