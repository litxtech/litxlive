import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  Platform,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Edit3,
  Crown,
  Globe,
  LogOut,
  Camera,
  MapPin,
  Calendar,
  Check,
  Shield,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  Briefcase,
  Settings,
} from "lucide-react-native";
import { router } from "expo-router";
import { useUser } from "@/providers/UserProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { supportedLanguages } from "@/constants/languages";
import Footer from "@/components/Footer";

import { Colors } from "@/constants/colors";
import { useOwner } from "@/providers/OwnerProvider";
import RealVerificationModal from "@/components/RealVerificationModal";
import LumiIdService from "@/lib/lumiId";
import VerificationService from "@/lib/verification";

export default function ProfileScreen() {
  const { user, logout } = useUser();
  const { t, currentLanguage, changeLanguage } = useLanguage();
  const { featureEnabled, isOwner, adminMode, openAdminMode } = useOwner();
  const [showLanguageModal, setShowLanguageModal] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const [showIdentityVerification, setShowIdentityVerification] = useState<boolean>(false);
  const [showSelfieVerification, setShowSelfieVerification] = useState<boolean>(false);
  const longPressTimer = useRef<number | null>(null);

  const handleLogout = useCallback(() => {
    console.log('[Profile] Logout button pressed');

    if (isLoggingOut) {
      return;
    }

    if (Platform.OS === 'web') {
      try {
        const confirmed = typeof window !== 'undefined' ? window.confirm('Are you sure you want to sign out?') : true;
        if (!confirmed) return;
        setIsLoggingOut(true);
        logout()
          .then(() => {
            console.log('[Profile] Logout successful (web), redirecting to auth');
            router.replace('/auth');
          })
          .catch((error) => {
            console.error('[Profile] Logout error (web):', error);
            Alert.alert(t('error'), t('authFailed'));
          })
          .finally(() => setIsLoggingOut(false));
      } catch (error) {
        console.error('[Profile] Logout exception (web):', error);
      }
      return;
    }

    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: t('cancel'), style: "cancel" as const },
        {
          text: "Sign Out",
          style: "destructive" as const,
          onPress: async () => {
            if (isLoggingOut) return;
            setIsLoggingOut(true);
            console.log('[Profile] User confirmed logout');
            try {
              await logout();
              console.log('[Profile] Logout successful, redirecting to auth');
              router.replace("/auth");
            } catch (error) {
              console.error('[Profile] Logout error:', error);
              Alert.alert(t('error'), t('authFailed'));
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  }, [isLoggingOut, logout, t]);

  const handleEditProfile = () => {
    console.log('[Profile] Edit profile button pressed');
    try {
      router.push("/edit-profile" as any);
    } catch (error) {
      console.error('[Profile] Navigation error:', error);
      Alert.alert('Error', 'Failed to open edit profile. Please try again.');
    }
  };

  const handleChangeAvatar = () => {
    Alert.alert(
      "Change Avatar",
      "Avatar upload functionality coming soon!",
      [{ text: "OK" }]
    );
  };

  const handleIdentityVerification = () => {
    console.log('[Profile] Identity verification button pressed');
    Alert.alert(
      "Identity Verification",
      "Upload your ID document to verify your identity. This helps keep our community safe.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Upload ID", onPress: () => {
          Alert.alert("Coming Soon", "Identity verification will be available soon!");
        }}
      ]
    );
  };

  const handleSelfieVerification = () => {
    console.log('[Profile] Selfie verification button pressed');
    Alert.alert(
      "Selfie Verification",
      "Take a selfie to verify your identity. This helps prevent fake accounts.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Take Selfie", onPress: () => {
          Alert.alert("Coming Soon", "Selfie verification will be available soon!");
        }}
      ]
    );
  };

  const handleAgencyApplication = () => {
    console.log('[Profile] Agency application button pressed');
    try {
      router.push('/apply' as any);
    } catch (error) {
      console.error('[Profile] Navigation error:', error);
      Alert.alert('Error', 'Failed to open agency application. Please try again.');
    }
  };

  const handleLanguageSelect = async (languageCode: string) => {
    await changeLanguage(languageCode as any);
    setShowLanguageModal(false);
  };

  const currentLanguageInfo = supportedLanguages.find(
    (lang) => lang.code === currentLanguage
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('profile')}</Text>
          <TouchableOpacity 
            onPress={handleEditProfile} 
            style={styles.editButton} 
            testID="editProfileButton"
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Edit3 color={Colors.primary} size={20} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.profileCard}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={handleChangeAvatar}
              onPressIn={() => {
                if (longPressTimer.current) return;
                longPressTimer.current = setTimeout(() => {
                  try {
                    if (featureEnabled && isOwner) {
                      openAdminMode('long_press_profile_avatar');
                    }
                  } catch (e) {
                    console.log('[Profile] admin mode open error', e);
                  } finally {
                    if (longPressTimer.current) {
                      clearTimeout(longPressTimer.current);
                      longPressTimer.current = null;
                    }
                  }
                }, 3000) as unknown as number;
              }}
              onPressOut={() => {
                if (longPressTimer.current) {
                  clearTimeout(longPressTimer.current);
                  longPressTimer.current = null;
                }
              }}
              testID="changeAvatarButton"
            >
              <Image
                source={{
                  uri: user?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face",
                }}
                style={styles.avatar}
              />
              <View style={styles.cameraButton}>
                <Camera color="white" size={14} />
              </View>
            </TouchableOpacity>

            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.displayName}>{user?.displayName || "User"}</Text>
                {/* Verification Badges */}
                {user?.verificationLevel === 'blue' && (
                  <View style={styles.blueBadge}>
                    <Text style={styles.blueBadgeText}>✓</Text>
                  </View>
                )}
                {user?.verificationLevel === 'yellow' && (
                  <View style={styles.yellowBadge}>
                    <Text style={styles.yellowBadgeText}>✓</Text>
                  </View>
                )}
                {user?.isVip && (
                  <View style={styles.vipBadge}>
                    <Crown color="#FFD700" size={14} />
                  </View>
                )}
              </View>
              <Text style={styles.username}>@{user?.username || "username"}</Text>
              
              {/* LUMI-ID Display */}
              <View style={styles.lumiIdContainer}>
                <Text style={styles.lumiIdLabel}>LUMI-ID:</Text>
                <Text style={styles.lumiIdValue}>{user?.lumiId || "LUMI-000000"}</Text>
              </View>
              
              <Text style={styles.bio}>
                {user?.bio || "Welcome to LUMI Live! 🎉"}
              </Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{user?.level || 1}</Text>
                <Text style={styles.statLabel}>Level</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{user?.coins || 0}</Text>
                <Text style={styles.statLabel}>Coins</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>0</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.kycSection}>
          <View style={styles.kycCard}>
            <View style={styles.kycHeader}>
              <Shield color={Colors.secondary} size={20} />
              <Text style={styles.kycTitle}>Verification Center</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.verificationItem}
              onPress={() => setShowIdentityVerification(true)}
              testID="identityVerificationButton"
            >
              <View style={styles.verificationLeft}>
                <View style={styles.verificationIconContainer}>
                  <Award color={user?.identityVerified ? Colors.success : Colors.textSecondary} size={18} />
                </View>
                <View style={styles.verificationInfo}>
                  <Text style={styles.verificationLabel}>Identity Verification</Text>
                  <Text style={styles.verificationDesc}>Upload ID document</Text>
                </View>
              </View>
              <View style={[
                styles.verificationBadge,
                user?.identityVerified ? styles.verifiedBadge : 
                user?.verificationStatus === 'pending' ? styles.pendingBadge : 
                styles.notVerifiedBadge
              ]}>
                {user?.identityVerified ? (
                  <CheckCircle color={Colors.success} size={16} />
                ) : user?.verificationStatus === 'pending' ? (
                  <Clock color={Colors.warning} size={16} />
                ) : (
                  <XCircle color={Colors.textSecondary} size={16} />
                )}
                <Text style={[
                  styles.verificationBadgeText,
                  user?.identityVerified ? styles.verifiedText : 
                  user?.verificationStatus === 'pending' ? styles.pendingText : 
                  styles.notVerifiedText
                ]}>
                  {user?.identityVerified ? 'Verified' : 
                   user?.verificationStatus === 'pending' ? 'Pending' : 
                   'Not Verified'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.verificationItem}
              onPress={() => setShowSelfieVerification(true)}
              testID="selfieVerificationButton"
            >
              <View style={styles.verificationLeft}>
                <View style={styles.verificationIconContainer}>
                  <Camera color={user?.selfieVerified ? Colors.success : Colors.textSecondary} size={18} />
                </View>
                <View style={styles.verificationInfo}>
                  <Text style={styles.verificationLabel}>Selfie Verification</Text>
                  <Text style={styles.verificationDesc}>Take a selfie photo</Text>
                </View>
              </View>
              <View style={[
                styles.verificationBadge,
                user?.selfieVerified ? styles.verifiedBadge : 
                user?.verificationStatus === 'pending' ? styles.pendingBadge : 
                styles.notVerifiedBadge
              ]}>
                {user?.selfieVerified ? (
                  <CheckCircle color={Colors.success} size={16} />
                ) : user?.verificationStatus === 'pending' ? (
                  <Clock color={Colors.warning} size={16} />
                ) : (
                  <XCircle color={Colors.textSecondary} size={16} />
                )}
                <Text style={[
                  styles.verificationBadgeText,
                  user?.selfieVerified ? styles.verifiedText : 
                  user?.verificationStatus === 'pending' ? styles.pendingText : 
                  styles.notVerifiedText
                ]}>
                  {user?.selfieVerified ? 'Verified' : 
                   user?.verificationStatus === 'pending' ? 'Pending' : 
                   'Not Verified'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.verificationItem, styles.agencyItem]}
              onPress={handleAgencyApplication}
              testID="agencyApplicationButton"
            >
              <View style={styles.verificationLeft}>
                <View style={[styles.verificationIconContainer, styles.agencyIconContainer]}>
                  <Briefcase color={user?.isAgency ? Colors.primary : "#8B5CF6"} size={18} />
                </View>
                <View style={styles.verificationInfo}>
                  <Text style={styles.verificationLabel}>Agency Application</Text>
                  <Text style={styles.verificationDesc}>
                    {user?.isAgency ? 'Manage agency' : 
                     user?.agencyStatus === 'pending' ? 'Application pending' : 
                     'Become a verified creator'}
                  </Text>
                </View>
              </View>
              <View style={[
                styles.verificationBadge,
                user?.isAgency ? styles.agencyApprovedBadge : 
                user?.agencyStatus === 'pending' ? styles.pendingBadge : 
                styles.agencyNotAppliedBadge
              ]}>
                {user?.isAgency ? (
                  <>
                    <Crown color={Colors.primary} size={16} />
                    <Text style={[styles.verificationBadgeText, styles.agencyApprovedText]}>Active</Text>
                  </>
                ) : user?.agencyStatus === 'pending' ? (
                  <>
                    <Clock color={Colors.warning} size={16} />
                    <Text style={[styles.verificationBadgeText, styles.pendingText]}>Pending</Text>
                  </>
                ) : (
                  <Text style={[styles.verificationBadgeText, styles.applyNowText]}>Apply Now</Text>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Settings</Text>

          <View style={styles.contactRow}>
            <TouchableOpacity
              style={styles.smallPill}
              onPress={() => Linking.openURL('mailto:support@litxtech.com?subject=Report%20/ %20Abuse')}
              testID="contact-support"
            >
              <Text style={styles.smallPillText}>Report • support@litxtech.com</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.smallPill}
              onPress={() => Linking.openURL('mailto:developer@litxtech.com?subject=Bug%20Report')}
              testID="contact-dev"
            >
              <Text style={styles.smallPillText}>Bugs • developer@litxtech.com</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.smallPill}
              onPress={() => Linking.openURL('https://wa.me/3072715151')}
              testID="contact-whatsapp"
            >
              <Text style={styles.smallPillText}>WhatsApp • +307 271 5151</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowLanguageModal(true)}
            testID="languageSettingButton"
          >
            <View style={styles.settingLeft}>
              <Globe color={Colors.primary} size={18} />
              <Text style={styles.settingText}>{t('language')}</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>
                {currentLanguageInfo?.flag} {currentLanguageInfo?.name}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => {
              router.push('/settings' as any);
            }}
            testID="hometownSettingButton"
          >
            <View style={styles.settingLeft}>
              <MapPin color={Colors.secondary} size={18} />
              <Text style={styles.settingText}>Hometown</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>
                {user?.hometownCity && user?.hometownCountry 
                  ? `${user.hometownCity}, ${user.hometownCountry}` 
                  : "Not set"}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => {
              try {
                const ts = user?.createdAt ? new Date(user.createdAt) : new Date();
                const full = ts.toLocaleString();
                const days = Math.max(0, Math.floor((Date.now() - ts.getTime()) / (1000 * 60 * 60 * 24)));
                Alert.alert('Member since', `${full}\n${days} days ago`);
              } catch (e) {
                Alert.alert('Member since', 'Date not available');
              }
            }}
            testID="member-since-button"
          >
            <View style={styles.settingLeft}>
              <Calendar color={Colors.success} size={18} />
              <Text style={styles.settingText}>Member since</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Today"}
              </Text>
            </View>
          </TouchableOpacity>

          {user?.email?.toLowerCase() === 'support@litxtech.com' && (
            <TouchableOpacity 
              style={[styles.settingItem, styles.adminItem]} 
              onPress={() => {
                console.log('[Profile] Admin button pressed');
                router.push('/admin' as any);
              }} 
              testID="adminButton"
            >
              <View style={styles.settingLeft}>
                <Settings color={Colors.primary} size={18} />
                <Text style={[styles.settingText, { color: Colors.primary }]}>
                  Admin Panel
                </Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.settingItem, styles.deleteAccountItem]}
            onPress={() => router.push('/account-deletion' as any)}
            testID="deleteAccountNavigate"
          >
            <View style={styles.settingLeft}>
              <XCircle color={Colors.error} size={18} />
              <Text style={[styles.settingText, { color: Colors.error }]}>Delete Account</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={[styles.settingValue, { color: Colors.error }]}>Permanent</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, styles.logoutItem, isLoggingOut ? { opacity: 0.5 } : null as any]} 
            onPress={handleLogout} 
            disabled={isLoggingOut} 
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} 
            testID="signOutButton"
          >
            <View style={styles.settingLeft}>
              <LogOut color={Colors.error} size={18} />
              <Text style={[styles.settingText, { color: Colors.error }]}>
                {isLoggingOut ? 'Signing out…' : 'Sign Out'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        
        <Footer />
      </ScrollView>

      {/* Real Verification Modals */}
      <RealVerificationModal
        visible={showIdentityVerification}
        onClose={() => setShowIdentityVerification(false)}
        type="identity"
      />
      
      <RealVerificationModal
        visible={showSelfieVerification}
        onClose={() => setShowSelfieVerification(false)}
        type="selfie"
      />

      <Modal
        visible={showLanguageModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Language</Text>
              <TouchableOpacity
                onPress={() => setShowLanguageModal(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>Done</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.languageList}>
              {supportedLanguages.map((language) => (
                <TouchableOpacity
                  key={language.code}
                  style={styles.languageItem}
                  onPress={() => handleLanguageSelect(language.code)}
                >
                  <View style={styles.languageLeft}>
                    <Text style={styles.languageFlag}>{language.flag}</Text>
                    <Text style={styles.languageName}>{language.name}</Text>
                  </View>
                  {currentLanguage === language.code && (
                    <Check color={Colors.primary} size={20} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingBottom: 80,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.primary,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileSection: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  profileCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.borderLight,
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  profileInfo: {
    alignItems: "center",
    marginBottom: 20,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  displayName: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  blueBadge: {
    backgroundColor: '#1DA1F2',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blueBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800' as const,
  },
  vipBadge: {
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    borderRadius: 10,
    padding: 4,
  },
  username: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  bio: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: "row",
    gap: 24,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: "500" as const,
  },
  kycSection: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  kycCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  kycHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  kycTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  verificationItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  agencyItem: {
    borderBottomWidth: 0,
    backgroundColor: "rgba(139, 92, 246, 0.05)",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  verificationLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  verificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  agencyIconContainer: {
    backgroundColor: "rgba(139, 92, 246, 0.1)",
  },
  verificationInfo: {
    flex: 1,
  },
  verificationLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 2,
  },
  verificationDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  verificationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  verifiedBadge: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
  },
  pendingBadge: {
    backgroundColor: "rgba(251, 191, 36, 0.1)",
  },
  notVerifiedBadge: {
    backgroundColor: Colors.borderLight,
  },
  agencyApprovedBadge: {
    backgroundColor: "rgba(99, 102, 241, 0.1)",
  },
  agencyNotAppliedBadge: {
    backgroundColor: "rgba(139, 92, 246, 0.1)",
  },
  verificationBadgeText: {
    fontSize: 11,
    fontWeight: "600" as const,
  },
  verifiedText: {
    color: Colors.success,
  },
  pendingText: {
    color: Colors.warning,
  },
  notVerifiedText: {
    color: Colors.textSecondary,
  },
  agencyApprovedText: {
    color: Colors.primary,
  },
  applyNowText: {
    color: "#8B5CF6",
    fontWeight: "700" as const,
  },
  settingsSection: {
    paddingHorizontal: 24,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  smallPill: {
    backgroundColor: Colors.borderLight,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  smallPillText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  adminItem: {
    borderColor: "rgba(99, 102, 241, 0.2)",
    backgroundColor: "rgba(99, 102, 241, 0.05)",
  },
  logoutItem: {
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  deleteAccountItem: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: 'rgba(239, 68, 68, 0.06)'
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  settingText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: "500" as const,
  },
  settingRight: {
    alignItems: "flex-end",
  },
  settingValue: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  modalCloseButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  modalCloseText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "600" as const,
  },
  languageList: {
    flex: 1,
  },
  languageItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  languageLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  languageFlag: {
    fontSize: 24,
  },
  languageName: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: "500" as const,
  },
  // LUMI-ID Styles
  lumiIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  lumiIdLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  lumiIdValue: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '700',
    marginLeft: 4,
  },
  // Verification Badge Styles
  yellowBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  yellowBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
