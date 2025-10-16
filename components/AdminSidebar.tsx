import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import {
  LayoutDashboard,
  Users,
  Building2,
  CreditCard,
  FileText,
  ScrollText,
  ShieldCheck,
  LogOut,
  type LucideIcon,
} from 'lucide-react-native';
import { useAdmin } from '@/providers/AdminProvider';

interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  permission?: string;
}

const menuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  { id: 'users', label: 'Users', icon: Users, path: '/admin/users', permission: 'manage_users' },
  { id: 'agencies', label: 'Agencies', icon: Building2, path: '/admin/agencies', permission: 'manage_agencies' },
  { id: 'payments', label: 'Payments', icon: CreditCard, path: '/admin/payments', permission: 'view_analytics' },
  { id: 'content', label: 'Content', icon: FileText, path: '/admin/content', permission: 'manage_content' },
  { id: 'policies', label: 'Policies', icon: ShieldCheck, path: '/admin/policies', permission: 'manage_content' },
  { id: 'logs', label: 'Logs', icon: ScrollText, path: '/admin/logs', permission: 'view_all_stats' },
];

export default function AdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { adminData, logout } = useAdmin();
  const me = adminData;

  const hasPermission = (permission?: string): boolean => {
    if (!permission) return true;
    if (me?.is_super_admin) return true;
    if (!me?.permissions) return true;
    return me?.permissions?.[permission] === true;
  };

  const handleLogout = async () => {
    try {
      console.log('[AdminSidebar] Logout pressed');
      await logout();
    } catch (e) {
      console.log('[AdminSidebar] Logout error', (e as Error)?.message || String(e));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>Admin Panel</Text>
        {me && (
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{me.display_name}</Text>
            <Text style={styles.userRole}>{me.is_super_admin ? 'Super Admin' : 'Admin'}</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.menu} showsVerticalScrollIndicator={false}>
        {menuItems.map((item) => {
          if (!hasPermission(item.permission)) return null;

          const isActive = pathname === item.path;
          const Icon = item.icon;

          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, isActive && styles.menuItemActive]}
              onPress={() => router.push(item.path as any)}
              activeOpacity={0.7}
            >
              <Icon size={20} color={isActive ? '#4C6FFF' : '#9aa4bf'} />
              <Text style={[styles.menuItemText, isActive && styles.menuItemTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7} testID="adminLogoutButton">
        <LogOut size={20} color="#ff8aa0" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 260,
    backgroundColor: '#101015',
    borderRightWidth: 1,
    borderRightColor: '#23263a',
    paddingVertical: 24,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  logo: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 16,
  },
  userInfo: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1a1d2e',
    borderRadius: 8,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 12,
    color: '#9aa4bf',
  },
  menu: {
    flex: 1,
    paddingHorizontal: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  menuItemActive: {
    backgroundColor: '#1a1d2e',
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9aa4bf',
    marginLeft: 12,
  },
  menuItemTextActive: {
    color: '#4C6FFF',
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 28,
    marginTop: 12,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ff8aa0',
    marginLeft: 12,
  },
});
