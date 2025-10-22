import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router'; // ✅ EKLENDİ
import { Colors } from '@/constants/colors';
import { useAdmin } from '@/providers/AdminProvider';

const { width } = Dimensions.get('window');

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  path: string;
  badge?: number;
  color?: string;
}

const menuItems: MenuItem[] = [
   { id: 'dashboard', title: 'Dashboard', icon: 'dashboard', path: '/admin/dashboard-main', color: '#3B82F6' },
  { id: 'users', title: 'Users', icon: 'people', path: '/admin/users', color: '#10B981' },
  { id: 'sessions', title: 'Live Sessions', icon: 'videocam', path: '/admin/sessions', color: '#F59E0B' },
  { id: 'moderation', title: 'Moderation', icon: 'security', path: '/admin/moderation', color: '#EF4444' },
  { id: 'wallet', title: 'Wallet', icon: 'account-balance-wallet', path: '/admin/wallet', color: '#8B5CF6' },
  { id: 'policies', title: 'Policies', icon: 'policy', path: '/admin/policies', color: '#6B7280' },
  { id: 'consent', title: 'Consent', icon: 'verified-user', path: '/admin/consent', color: '#EC4899' },
  { id: 'test-admin', title: 'Test Admin', icon: 'bug-report', path: '/admin/test-admin', color: '#DC2626' },
  { id: 'retention', title: 'Retention', icon: 'archive', path: '/admin/retention', color: '#F97316' },
  { id: 'notifications', title: 'Notifications', icon: 'notifications', path: '/admin/notifications', color: '#84CC16' },
  { id: 'reports', title: 'Reports', icon: 'assessment', path: '/admin/reports', color: '#06B6D4' },
  { id: 'configuration', title: 'Configuration', icon: 'settings', path: '/admin/configuration', color: '#6366F1' },
  { id: 'risk', title: 'Risk Events', icon: 'warning', path: '/admin/risk', color: '#DC2626' },
  { id: 'audit', title: 'Audit Log', icon: 'history', path: '/admin/audit', color: '#7C3AED' },
  { id: 'support', title: 'Support', icon: 'support-agent', path: '/admin/support', color: '#059669' },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const insets = useSafeAreaInsets();
  const { isAdmin, isLoading } = useAdmin();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeItem, setActiveItem] = useState('dashboard');

  // Animasyonlar
  const sidebarAnim = useState(new Animated.Value(-width * 0.8))[0];
  const overlayAnim = useState(new Animated.Value(0))[0];

  const toggleSidebar = () => {
    if (sidebarOpen) {
      Animated.parallel([
        Animated.timing(sidebarAnim, { toValue: -width * 0.8, duration: 300, useNativeDriver: true }),
        Animated.timing(overlayAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => setSidebarOpen(false));
    } else {
      setSidebarOpen(true);
      Animated.parallel([
        Animated.timing(sidebarAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(overlayAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  };

  const handleMenuPress = (item: MenuItem) => {
    setActiveItem(item.id);

    Animated.parallel([
      Animated.timing(sidebarAnim, { toValue: -width * 0.8, duration: 300, useNativeDriver: true }),
      Animated.timing(overlayAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setSidebarOpen(false));

    // Navigate
    console.log('Navigate to:', item.path);
    router.push(item.path as any); // ✅ Artık import var
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading Admin Panel...</Text>
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
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={toggleSidebar}>
          <MaterialIcons name="menu" size={24} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <View style={styles.statusIndicator}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Live</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton}>
            <MaterialIcons name="notifications" size={20} color={Colors.primary} />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>3</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <MaterialIcons name="search" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>{children}</View>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
          <TouchableOpacity style={styles.overlayTouchable} onPress={toggleSidebar} />
        </Animated.View>
      )}

      {/* Sidebar */}
      <Animated.View style={[styles.sidebar, { transform: [{ translateX: sidebarAnim }] }]}>
        <LinearGradient colors={['#1F2937', '#111827']} style={styles.sidebarGradient}>
          {/* Sidebar Header */}
          <View style={styles.sidebarHeader}>
            <View style={styles.sidebarLogo}>
              <MaterialIcons name="admin-panel-settings" size={28} color="#FFFFFF" />
              <Text style={styles.sidebarTitle}>Admin Panel</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={toggleSidebar}>
              <MaterialIcons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Menu Items */}
          <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.menuItem, activeItem === item.id && styles.menuItemActive]}
                onPress={() => handleMenuPress(item)} // ✅ callback
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.menuItemIcon, { backgroundColor: item.color }]}>
                    <MaterialIcons name={item.icon as any} size={20} color="#FFFFFF" />
                  </View>
                  <Text
                    style={[
                      styles.menuItemText,
                      activeItem === item.id && styles.menuItemTextActive,
                    ]}
                  >
                    {item.title}
                  </Text>
                </View>
                {item.badge && (
                  <View style={styles.menuItemBadge}>
                    <Text style={styles.menuItemBadgeText}>{item.badge}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Sidebar Footer */}
          <View style={styles.sidebarFooter}>
            <TouchableOpacity style={styles.sidebarFooterItem}>
              <MaterialIcons name="help" size={20} color="#9CA3AF" />
              <Text style={styles.sidebarFooterText}>Help & Support</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sidebarFooterItem}>
              <MaterialIcons name="logout" size={20} color="#9CA3AF" />
              <Text style={styles.sidebarFooterText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundColor },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.backgroundColor },
  loadingText: { fontSize: 16, color: Colors.textMuted },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.backgroundColor, padding: 20 },
  errorText: { fontSize: 20, fontWeight: '600', color: Colors.text, marginTop: 16 },
  errorSubtext: { fontSize: 14, color: Colors.textMuted, marginTop: 8, textAlign: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  menuButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 20, fontWeight: '600', color: Colors.text },
  statusIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  statusText: { fontSize: 12, color: '#10B981', fontWeight: '500' },
  headerRight: { flexDirection: 'row', gap: 12 },
  headerButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  notificationBadge: { position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: 8, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' },
  notificationBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '600' },
  content: { flex: 1 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000 },
  overlayTouchable: { flex: 1 },
  sidebar: { position: 'absolute', top: 0, left: 0, bottom: 0, width: width * 0.8, zIndex: 1001 },
  sidebarGradient: { flex: 1 },
  sidebarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.1)' },
  sidebarLogo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sidebarTitle: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
  closeButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.1)', alignItems: 'center', justifyContent: 'center' },
  menuContainer: { flex: 1, paddingTop: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, marginHorizontal: 12, borderRadius: 8 },
  menuItemActive: { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuItemIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  menuItemText: { fontSize: 14, fontWeight: '500', color: '#D1D5DB' },
  menuItemTextActive: { color: '#FFFFFF', fontWeight: '600' },
  menuItemBadge: { backgroundColor: '#EF4444', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, minWidth: 20, alignItems: 'center' },
  menuItemBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '600' },
  sidebarFooter: { paddingHorizontal: 20, paddingVertical: 20, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.1)' },
  sidebarFooterItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  sidebarFooterText: { fontSize: 14, color: '#9CA3AF' },
});

