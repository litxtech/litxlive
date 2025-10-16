import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  PanResponder,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { GripVertical, Save, RefreshCw } from 'lucide-react-native';

type FooterItem = {
  id: number;
  label: string;
  order_index: number;
  is_active: boolean;
  policies: {
    id: string;
    slug: string;
    title: string;
  };
};

export default function FooterManager() {
  const [items, setItems] = useState<FooterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  React.useEffect(() => {
    fetchFooterItems();
  }, []);

  const fetchFooterItems = async () => {
    try {
      setLoading(true);
      const base = process.env.EXPO_PUBLIC_API_URL || '';
      const response = await fetch(
        `${base}/api/admin/pages/footer/items?locale=en`,
        {
          headers: {
            'Authorization': `Bearer ${await getAuthToken()}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch footer items');

      const data = await response.json();
      setItems(data.items || []);
    } catch (error) {
      console.error('Error fetching footer items:', error);
      Alert.alert('Error', 'Failed to load footer items');
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
      console.error('[FooterManager] getAuthToken error', e);
      return '';
    }
  };

  const handleSaveOrder = async () => {
    try {
      setSaving(true);
      const base = process.env.EXPO_PUBLIC_API_URL || '';
      const response = await fetch(
        `${base}/api/admin/pages/footer/reorder`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${await getAuthToken()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ items }),
        }
      );

      if (!response.ok) throw new Error('Failed to save order');

      Alert.alert('Success', 'Footer order saved successfully');
    } catch (error) {
      console.error('Error saving order:', error);
      Alert.alert('Error', 'Failed to save footer order');
    } finally {
      setSaving(false);
    }
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    const newItems = [...items];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);
    
    const reorderedItems = newItems.map((item, index) => ({
      ...item,
      order_index: index,
    }));
    
    setItems(reorderedItems);
  };

  const renderDraggableItem = (item: FooterItem, index: number) => {
    const pan = new Animated.ValueXY();

    const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setDraggedIndex(index);
      },
      onPanResponderMove: Animated.event([null, { dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gesture) => {
        setDraggedIndex(null);
        
        const itemHeight = 80;
        const movedItems = Math.round(gesture.dy / itemHeight);
        const newIndex = Math.max(0, Math.min(items.length - 1, index + movedItems));
        
        if (newIndex !== index) {
          moveItem(index, newIndex);
        }
        
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
        }).start();
      },
    });

    return (
      <Animated.View
        key={item.id}
        style={[
          styles.footerItem,
          draggedIndex === index && styles.footerItemDragging,
          {
            transform: pan.getTranslateTransform(),
          },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.dragHandle}>
          <GripVertical size={20} color="#9CA3AF" />
        </View>
        <View style={styles.itemContent}>
          <Text style={styles.itemLabel}>{item.label}</Text>
          <Text style={styles.itemSlug}>/{item.policies.slug}</Text>
        </View>
        <View style={styles.orderBadge}>
          <Text style={styles.orderText}>{index + 1}</Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Footer Management',
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
        <View>
          <Text style={styles.headerTitle}>Footer Link Order</Text>
          <Text style={styles.headerSubtitle}>
            Drag and drop to reorder footer links
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={fetchFooterItems}
            disabled={loading}
          >
            <RefreshCw size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveOrder}
            disabled={saving}
          >
            <Save size={20} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : 'Save Order'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No footer items</Text>
            <Text style={styles.emptySubtext}>
              Add pages with &quot;Show in footer&quot; enabled
            </Text>
          </View>
        ) : (
          <View style={styles.itemsList}>
            <View style={styles.instructionBox}>
              <Text style={styles.instructionText}>
                💡 Press and hold, then drag items to reorder
              </Text>
            </View>
            {items.map((item, index) => renderDraggableItem(item, index))}
          </View>
        )}
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
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
    marginBottom: 16,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  refreshButton: {
    padding: 12,
    backgroundColor: '#374151',
    borderRadius: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  saveButtonText: {
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
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  itemsList: {
    padding: 20,
  },
  instructionBox: {
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  instructionText: {
    fontSize: 14,
    color: '#D1D5DB',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  footerItemDragging: {
    opacity: 0.8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  dragHandle: {
    marginRight: 12,
    padding: 4,
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  itemSlug: {
    fontSize: 14,
    color: '#3B82F6',
  },
  orderBadge: {
    backgroundColor: '#374151',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  backButton: {
    color: '#3B82F6',
    fontSize: 16,
  },
});
