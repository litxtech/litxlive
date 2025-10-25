import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAdmin } from '@/providers/AdminProvider';
import { useRouter } from 'expo-router';
import { Search, User, Mail, Calendar, Shield } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';

interface SearchResult {
  id: string;
  email: string;
  display_name: string;
  username: string;
  created_at: string;
  is_verified: boolean;
  is_banned: boolean;
  last_seen: string;
}

export default function AdminSearch() {
  const { isAdmin, isLoading } = useAdmin();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace('/admin' as any);
    }
  }, [isAdmin, isLoading, router]);

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, display_name, username, created_at, is_verified, last_seen')
        .or(`email.ilike.%${query}%,display_name.ilike.%${query}%,username.ilike.%${query}%`)
        .limit(20);

      if (error) {
        console.error('[AdminSearch] Search error:', error);
        Alert.alert('Error', 'Failed to search users');
        return;
      }

      const searchResults: SearchResult[] = (data || []).map(user => ({
        id: user.id,
        email: user.email || '',
        display_name: user.display_name || '',
        username: user.username || '',
        created_at: user.created_at,
        is_verified: user.is_verified || false,
        is_banned: false, // Bu bilgiyi ayrı bir sorgu ile alabilirsiniz
        last_seen: user.last_seen || '',
      }));

      setResults(searchResults);
    } catch (error) {
      console.error('[AdminSearch] Search error:', error);
      Alert.alert('Error', 'Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    searchUsers(searchQuery);
  };

  const onRefresh = () => {
    setRefreshing(true);
    searchUsers(searchQuery);
    setRefreshing(false);
  };

  const handleUserPress = (user: SearchResult) => {
    console.log('[AdminSearch] User pressed:', user.email);
    // Kullanıcı detay sayfasına yönlendir
    router.push(`/admin/users?userId=${user.id}` as any);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Access Denied</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search Users</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by email, name, or username..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoCapitalize="none"
          />
        </View>
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={loading}
        >
          <Text style={styles.searchButtonText}>
            {loading ? 'Searching...' : 'Search'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {results.length === 0 && searchQuery ? (
          <View style={styles.emptyContainer}>
            <Search size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No users found</Text>
            <Text style={styles.emptySubtext}>Try a different search term</Text>
          </View>
        ) : results.length === 0 ? (
          <View style={styles.emptyContainer}>
            <User size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Search for users</Text>
            <Text style={styles.emptySubtext}>Enter email, name, or username to search</Text>
          </View>
        ) : (
          results.map((user) => (
            <TouchableOpacity
              key={user.id}
              style={styles.userCard}
              onPress={() => handleUserPress(user)}
            >
              <View style={styles.userHeader}>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>
                    {user.display_name || user.username || 'No name'}
                  </Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                </View>
                <View style={styles.userStatus}>
                  {user.is_verified && (
                    <Shield size={16} color={Colors.success} />
                  )}
                </View>
              </View>
              <View style={styles.userDetails}>
                <View style={styles.userDetail}>
                  <Calendar size={14} color={Colors.textMuted} />
                  <Text style={styles.userDetailText}>
                    Joined: {new Date(user.created_at).toLocaleDateString()}
                  </Text>
                </View>
                {user.last_seen && (
                  <View style={styles.userDetail}>
                    <User size={14} color={Colors.textMuted} />
                    <Text style={styles.userDetailText}>
                      Last seen: {new Date(user.last_seen).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundColor,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundColor,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundColor,
  },
  errorText: {
    fontSize: 18,
    color: Colors.error,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.primary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  headerRight: {
    width: 60,
  },
  searchContainer: {
    padding: 20,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundColor,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: Colors.text,
  },
  searchButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: Colors.textMuted,
    marginTop: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  userCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  userStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userDetails: {
    gap: 8,
  },
  userDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userDetailText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});
