import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { BlurView } from 'expo-blur';
import {
  User,
  MessageCircle,
  Wallet,
  Settings,
  Trash2,
  LogOut,
  HelpCircle,
  FileText,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useUser } from '@/providers/UserProvider';
import { Colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';

interface MenuItem {
  icon: React.ComponentType<any>;
  label: string;
  description: string;
  onPress: () => void;
  color?: string;
  testID?: string;
}

interface UserMenuProps {
  visible: boolean;
  onClose: () => void;
}

export default function UserMenu({ visible, onClose }: UserMenuProps) {
  const { user, logout } = useUser();
  const slideAnim = React.useRef(new Animated.Value(300)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, opacityAnim]);

  const handleAccountDeletion = async () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('[UserMenu] Starting account deletion...');
              
              const { data: { session } } = await supabase.auth.getSession();
              if (!session?.access_token) {
                Alert.alert('Error', 'No active session found');
                return;
              }

              const functionUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
              if (!functionUrl) {
                Alert.alert('Error', 'Configuration error');
                return;
              }

              const response = await fetch(`${functionUrl}/functions/v1/delete-account`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json',
                },
              });

              const result = await response.json();

              if (response.ok && result.success) {
                Alert.alert('Success', 'Your account has been deleted');
                await logout();
                onClose();
                router.replace('/auth');
              } else {
                Alert.alert('Error', result.error || 'Failed to delete account');
              }
            } catch (error: any) {
              console.error('[UserMenu] Account deletion error:', error);
              Alert.alert('Error', error.message || 'Failed to delete account');
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('[UserMenu] Logging out...');
              await logout();
              onClose();
              router.replace('/auth');
            } catch (error: any) {
              console.error('[UserMenu] Logout error:', error);
              Alert.alert('Error', 'Failed to log out');
            }
          },
        },
      ]
    );
  };

  const handleHelpSupport = () => {
    onClose();
    Alert.alert(
      'Help & Support',
      'Contact our support team',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Email Support',
          onPress: () => Linking.openURL('mailto:support@litxtech.com'),
        },
        {
          text: 'WhatsApp',
          onPress: () => Linking.openURL('https://wa.me/13072715151'),
        },
      ]
    );
  };

  const menuItems: MenuItem[] = [
    {
      icon: User,
      label: 'My Profile',
      description: 'Edit your profile',
      onPress: () => {
        onClose();
        router.push('/(tabs)/profile');
      },
      testID: 'menu-profile',
    },
    {
      icon: MessageCircle,
      label: 'Messages',
      description: 'View your conversations',
      onPress: () => {
        onClose();
        router.push('/(tabs)/messages');
      },
      testID: 'menu-messages',
    },
    {
      icon: Wallet,
      label: 'Wallet / Coins',
      description: 'Manage your balance',
      onPress: () => {
        onClose();
        router.push('/(tabs)/wallet');
      },
      testID: 'menu-wallet',
    },
    {
      icon: Settings,
      label: 'Settings',
      description: 'App preferences',
      onPress: () => {
        onClose();
        router.push('/settings');
      },
      testID: 'menu-settings',
    },
    {
      icon: HelpCircle,
      label: 'Help & Support',
      description: 'Get assistance',
      onPress: handleHelpSupport,
      testID: 'menu-help',
    },
    {
      icon: FileText,
      label: 'Policies',
      description: 'Privacy & Terms',
      onPress: () => {
        onClose();
        router.push('/policies');
      },
      testID: 'menu-policies',
    },
    {
      icon: Trash2,
      label: 'Account Deletion',
      description: 'Permanently delete account',
      onPress: handleAccountDeletion,
      color: '#FF4444',
      testID: 'menu-delete-account',
    },
    {
      icon: LogOut,
      label: 'Log Out',
      description: 'Sign out of your account',
      onPress: handleLogout,
      color: '#FF4444',
      testID: 'menu-logout',
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View
          style={[
            styles.backdrop,
            { opacity: opacityAnim },
          ]}
        />
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.menuContainer,
          {
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        {Platform.OS === 'ios' ? (
          <BlurView intensity={80} tint="light" style={styles.menuContent}>
            {renderMenuContent()}
          </BlurView>
        ) : (
          <View style={[styles.menuContent, styles.menuContentAndroid]}>
            {renderMenuContent()}
          </View>
        )}
      </Animated.View>
    </Modal>
  );

  function renderMenuContent() {
    return (
      <>
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.displayName || 'User'}</Text>
            <Text style={styles.userId}>Lumi ID: {user?.username || user?.userId}</Text>
            <View style={styles.balanceRow}>
              <Wallet color={Colors.primary} size={16} />
              <Text style={styles.balanceText}>{user?.coins || 0} coins</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.menuList}>
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const iconColor = item.color || Colors.text;
            const textColor = item.color || Colors.text;

            return (
              <React.Fragment key={item.label}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={item.onPress}
                  testID={item.testID}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={[styles.iconContainer, item.color && { backgroundColor: `${item.color}15` }]}>
                      <Icon color={iconColor} size={20} strokeWidth={2} />
                    </View>
                    <View style={styles.menuItemText}>
                      <Text style={[styles.menuItemLabel, { color: textColor }]}>
                        {item.label}
                      </Text>
                      <Text style={styles.menuItemDescription}>
                        {item.description}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
                {index < menuItems.length - 1 && <View style={styles.itemDivider} />}
              </React.Fragment>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>v1.0 Lumi • LitxTech LLC</Text>
        </View>
      </>
    );
  }
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '85%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  menuContent: {
    flex: 1,
    overflow: 'hidden',
  },
  menuContentAndroid: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  userInfo: {
    gap: 6,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  userId: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  balanceText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 24,
  },
  menuList: {
    flex: 1,
    paddingVertical: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    flex: 1,
    gap: 2,
  },
  menuItemLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  menuItemDescription: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  itemDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 78,
    marginRight: 24,
  },
  footer: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
});
