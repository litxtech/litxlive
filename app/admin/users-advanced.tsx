import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { useAdmin } from '@/providers/AdminProvider';

const { width } = Dimensions.get('window');

interface User {
  id: string;
  email: string;
  displayName: string;
  username: string;
  country: string;
  isVerified: boolean;
  isVip: boolean;
  coins: number;
  level: number;
  lastActive: string;
  riskScore: number;
  status: 'active' | 'banned' | 'suspended';
  createdAt: string;
  avatar?: string;
}

interface SearchFilters {
  query: string;
  status: 'all' | 'active' | 'banned' | 'suspended';
  verification: 'all' | 'verified' | 'unverified';
  country: string;
  riskLevel: 'all' | 'low' | 'medium' | 'high';
  sortBy: 'lastActive' | 'createdAt' | 'coins' | 'riskScore';
  sortOrder: 'asc' | 'desc';
}

export default function AdvancedUsersScreen() {
  const insets = useSafeAreaInsets();
  const { isAdmin, isLoading } = useAdmin();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    status: 'all',
    verification: 'all',
    country: 'all',
    riskLevel: 'all',
    sortBy: 'lastActive',
    sortOrder: 'desc',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  // Animasyonlar
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const searchAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadUsers();
    startAnimations();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchFilters, users]);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Simulated data - gerçek API entegrasyonu yapılacak
      const mockUsers: User[] = [
        {
          id: '1',
          email: 'john.doe@example.com',
          displayName: 'John Doe',
          username: 'johndoe',
          country: 'US',
          isVerified: true,
          isVip: true,
          coins: 1250,
          level: 5,
          lastActive: '2 min ago',
          riskScore: 2.1,
          status: 'active',
          createdAt: '2024-01-15',
        },
        {
          id: '2',
          email: 'jane.smith@example.com',
          displayName: 'Jane Smith',
          username: 'janesmith',
          country: 'UK',
          isVerified: false,
          isVip: false,
          coins: 450,
          level: 3,
          lastActive: '1 hour ago',
          riskScore: 4.8,
          status: 'active',
          createdAt: '2024-01-20',
        },
        {
          id: '3',
          email: 'banned.user@example.com',
          displayName: 'Banned User',
          username: 'banneduser',
          country: 'CA',
          isVerified: false,
          isVip: false,
          coins: 0,
          level: 1,
          lastActive: '3 days ago',
          riskScore: 8.5,
          status: 'banned',
          createdAt: '2024-01-10',
        },
      ];
      
      setUsers(mockUsers);
    } catch (error) {
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];

    // Text search
    if (searchFilters.query) {
      const query = searchFilters.query.toLowerCase();
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(query) ||
        user.displayName.toLowerCase().includes(query) ||
        user.username.toLowerCase().includes(query) ||
        user.id.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (searchFilters.status !== 'all') {
      filtered = filtered.filter(user => user.status === searchFilters.status);
    }

    // Verification filter
    if (searchFilters.verification !== 'all') {
      filtered = filtered.filter(user => 
        searchFilters.verification === 'verified' ? user.isVerified : !user.isVerified
      );
    }

    // Country filter
    if (searchFilters.country !== 'all') {
      filtered = filtered.filter(user => user.country === searchFilters.country);
    }

    // Risk level filter
    if (searchFilters.riskLevel !== 'all') {
      filtered = filtered.filter(user => {
        const score = user.riskScore;
        switch (searchFilters.riskLevel) {
          case 'low': return score < 3;
          case 'medium': return score >= 3 && score < 6;
          case 'high': return score >= 6;
          default: return true;
        }
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (searchFilters.sortBy) {
        case 'lastActive':
          aValue = a.lastActive;
          bValue = b.lastActive;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'coins':
          aValue = a.coins;
          bValue = b.coins;
          break;
        case 'riskScore':
          aValue = a.riskScore;
          bValue = b.riskScore;
          break;
        default:
          return 0;
      }

      if (searchFilters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredUsers(filtered);
  };

  const handleSearch = (query: string) => {
    setSearchFilters(prev => ({ ...prev, query }));
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setSearchFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleBulkAction = (action: string) => {
    if (selectedUsers.length === 0) {
      Alert.alert('No Selection', 'Please select users first');
      return;
    }

    Alert.alert(
      'Bulk Action',
      `Are you sure you want to ${action} ${selectedUsers.length} users?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => {
          // Implement bulk action
          console.log(`${action} users:`, selectedUsers);
          setSelectedUsers([]);
        }}
      ]
    );
  };

  const getRiskColor = (score: number) => {
    if (score < 3) return '#10B981';
    if (score < 6) return '#F59E0B';
    return '#EF4444';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'banned': return '#EF4444';
      case 'suspended': return '#F59E0B';
      default: return Colors.textMuted;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading Users...</Text>
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="block" size={48} color={Colors.error} />
        <Text style={styles.errorText}>Access Denied</Text>
        <Text style={styles.errorSubtext}>You don&apos;t have admin privileges</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <View style={styles.headerLeft}>
          <MaterialIcons name="people" size={28} color={Colors.primary} />
          <Text style={styles.headerTitle}>User Management</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <MaterialIcons name="filter-list" size={20} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.exportButton}>
            <MaterialIcons name="download" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Search Bar */}
      <Animated.View 
        style={[
          styles.searchContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by ID, email, name, username..."
            placeholderTextColor={Colors.textMuted}
            value={searchFilters.query}
            onChangeText={handleSearch}
          />
          {searchFilters.query.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <MaterialIcons name="clear" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* Filters */}
      {showFilters && (
        <Animated.View 
          style={[
            styles.filtersContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterRow}>
              <FilterChip
                label="Status"
                value={searchFilters.status}
                options={[
                  { label: 'All', value: 'all' },
                  { label: 'Active', value: 'active' },
                  { label: 'Banned', value: 'banned' },
                  { label: 'Suspended', value: 'suspended' },
                ]}
                onSelect={(value: any) => handleFilterChange('status', value)}
              />
              
              <FilterChip
                label="Verification"
                value={searchFilters.verification}
                options={[
                  { label: 'All', value: 'all' },
                  { label: 'Verified', value: 'verified' },
                  { label: 'Unverified', value: 'unverified' },
                ]}
                onSelect={(value: any) => handleFilterChange('verification', value)}
              />
              
              <FilterChip
                label="Risk Level"
                value={searchFilters.riskLevel}
                options={[
                  { label: 'All', value: 'all' },
                  { label: 'Low', value: 'low' },
                  { label: 'Medium', value: 'medium' },
                  { label: 'High', value: 'high' },
                ]}
                onSelect={(value) => handleFilterChange('riskLevel', value)}
              />
              
              <FilterChip
                label="Sort By"
                value={searchFilters.sortBy}
                options={[
                  { label: 'Last Active', value: 'lastActive' },
                  { label: 'Created', value: 'createdAt' },
                  { label: 'Coins', value: 'coins' },
                  { label: 'Risk Score', value: 'riskScore' },
                ]}
                onSelect={(value) => handleFilterChange('sortBy', value)}
              />
            </View>
          </ScrollView>
        </Animated.View>
      )}

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <Animated.View 
          style={[
            styles.bulkActionsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <Text style={styles.bulkActionsText}>
            {selectedUsers.length} user(s) selected
          </Text>
          <View style={styles.bulkActions}>
            <TouchableOpacity 
              style={[styles.bulkAction, styles.banAction]}
              onPress={() => handleBulkAction('ban')}
            >
              <MaterialIcons name="block" size={16} color="#FFFFFF" />
              <Text style={styles.bulkActionText}>Ban</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.bulkAction, styles.suspendAction]}
              onPress={() => handleBulkAction('suspend')}
            >
              <MaterialIcons name="pause" size={16} color="#FFFFFF" />
              <Text style={styles.bulkActionText}>Suspend</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.bulkAction, styles.resetAction]}
              onPress={() => handleBulkAction('reset password')}
            >
              <MaterialIcons name="lock-reset" size={16} color="#FFFFFF" />
              <Text style={styles.bulkActionText}>Reset PW</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Users List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading users...</Text>
          </View>
        ) : (
          filteredUsers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              isSelected={selectedUsers.includes(user.id)}
              onSelect={() => handleUserSelect(user.id)}
              onRiskColor={getRiskColor}
              onStatusColor={getStatusColor}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

// Filter Chip Component
interface FilterChipProps {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onSelect: (value: string) => void;
}

function FilterChip({ label, value, options, onSelect }: FilterChipProps) {
  return (
    <View style={styles.filterChip}>
      <Text style={styles.filterChipLabel}>{label}:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {options.map((option: any) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.filterOption,
              value === option.value && styles.filterOptionActive
            ]}
            onPress={() => onSelect(option.value)}
          >
            <Text style={[
              styles.filterOptionText,
              value === option.value && styles.filterOptionTextActive
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// User Card Component
interface UserCardProps {
  user: User;
  isSelected: boolean;
  onSelect: () => void;
  onRiskColor: (score: number) => string;
  onStatusColor: (status: string) => string;
}

function UserCard({ user, isSelected, onSelect, onRiskColor, onStatusColor }: UserCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.userCard,
        isSelected && styles.userCardSelected
      ]}
      onPress={onSelect}
    >
      <View style={styles.userCardHeader}>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {user.displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <View style={styles.userNameRow}>
              <Text style={styles.userName}>{user.displayName}</Text>
              {user.isVerified && (
                <MaterialIcons name="verified" size={16} color="#3B82F6" />
              )}
              {user.isVip && (
                <MaterialIcons name="star" size={16} color="#F59E0B" />
              )}
            </View>
            <Text style={styles.userEmail}>{user.email}</Text>
            <Text style={styles.userId}>ID: {user.id}</Text>
          </View>
        </View>
        <View style={styles.userStatus}>
          <View style={[
            styles.statusIndicator,
            { backgroundColor: onStatusColor(user.status) }
          ]} />
          <Text style={styles.statusText}>{user.status}</Text>
        </View>
      </View>
      
      <View style={styles.userStats}>
        <View style={styles.userStat}>
          <MaterialIcons name="attach-money" size={16} color={Colors.textMuted} />
          <Text style={styles.userStatText}>{user.coins} coins</Text>
        </View>
        <View style={styles.userStat}>
          <MaterialIcons name="trending-up" size={16} color={Colors.textMuted} />
          <Text style={styles.userStatText}>Level {user.level}</Text>
        </View>
        <View style={styles.userStat}>
          <MaterialIcons name="security" size={16} color={onRiskColor(user.riskScore)} />
          <Text style={[styles.userStatText, { color: onRiskColor(user.riskScore) }]}>
            Risk: {user.riskScore}
          </Text>
        </View>
        <View style={styles.userStat}>
          <MaterialIcons name="schedule" size={16} color={Colors.textMuted} />
          <Text style={styles.userStatText}>{user.lastActive}</Text>
        </View>
      </View>
      
      <View style={styles.userActions}>
        <TouchableOpacity style={styles.userAction}>
          <MaterialIcons name="visibility" size={16} color={Colors.primary} />
          <Text style={styles.userActionText}>View</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.userAction}>
          <MaterialIcons name="edit" size={16} color={Colors.primary} />
          <Text style={styles.userActionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.userAction}>
          <MaterialIcons name="block" size={16} color="#EF4444" />
          <Text style={[styles.userActionText, { color: '#EF4444' }]}>Ban</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
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
    marginTop: 16,
    fontSize: 16,
    color: Colors.textMuted,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundColor,
    padding: 20,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  errorSubtext: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  filtersContainer: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 16,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterChipLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.borderLight,
    marginRight: 8,
  },
  filterOptionActive: {
    backgroundColor: Colors.primary,
  },
  filterOptionText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: '#FFFFFF',
  },
  bulkActionsContainer: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bulkActionsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  bulkActions: {
    flexDirection: 'row',
    gap: 8,
  },
  bulkAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  banAction: {
    backgroundColor: '#EF4444',
  },
  suspendAction: {
    backgroundColor: '#F59E0B',
  },
  resetAction: {
    backgroundColor: '#6B7280',
  },
  bulkActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  userCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  userCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}10`,
  },
  userCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  userDetails: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  userId: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  userStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text,
    textTransform: 'capitalize',
  },
  userStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 12,
  },
  userStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userStatText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  userActions: {
    flexDirection: 'row',
    gap: 12,
  },
  userAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: Colors.borderLight,
    gap: 4,
  },
  userActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.primary,
  },
});
