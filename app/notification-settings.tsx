import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, Bell, Volume2, VolumeX, Smartphone, Mail, MessageCircle, Video, Gift } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useUser } from "@/providers/UserProvider";
import { Colors } from "@/constants/colors";

interface NotificationSettings {
  pushNotifications: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  // LUMI Specific Notifications
  newMatches: boolean;
  videoCalls: boolean;
  gifts: boolean;
  messages: boolean;
  subscriptions: boolean;
  security: boolean;
  marketing: boolean;
  system: boolean;
}

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [settings, setSettings] = useState<NotificationSettings>({
    pushNotifications: true,
    soundEnabled: true,
    vibrationEnabled: true,
    emailNotifications: true,
    smsNotifications: false,
    // LUMI Specific
    newMatches: true,
    videoCalls: true,
    gifts: true,
    messages: true,
    subscriptions: true,
    security: true,
    marketing: false,
    system: true,
  });
  
  const [showSoundModal, setShowSoundModal] = useState(false);
  const [selectedSound, setSelectedSound] = useState('default');

  const handleToggle = (key: keyof NotificationSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleTestSound = () => {
    // TODO: Implement sound testing
    Alert.alert("Ses Testi", "Bildirim sesi test edildi!");
  };

  const NotificationCard = ({ 
    title, 
    description, 
    icon: Icon, 
    enabled, 
    onToggle, 
    color = Colors.primary 
  }: {
    title: string;
    description: string;
    icon: any;
    enabled: boolean;
    onToggle: () => void;
    color?: string;
  }) => (
    <View style={styles.notificationCard}>
      <View style={styles.notificationHeader}>
        <View style={styles.notificationInfo}>
          <Icon color={color} size={24} />
          <View style={styles.notificationText}>
            <Text style={styles.notificationTitle}>{title}</Text>
            <Text style={styles.notificationDescription}>{description}</Text>
          </View>
        </View>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          trackColor={{ false: Colors.border, true: color }}
          thumbColor={enabled ? 'white' : Colors.textMuted}
        />
      </View>
    </View>
  );

  const soundOptions = [
    { id: 'default', name: 'Varsayılan', emoji: '🔔' },
    { id: 'gentle', name: 'Yumuşak', emoji: '🔕' },
    { id: 'loud', name: 'Yüksek', emoji: '📢' },
    { id: 'melody', name: 'Melodi', emoji: '🎵' },
    { id: 'vibration', name: 'Sadece Titreşim', emoji: '📳' },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft color="white" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bildirim Ayarları</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Notification Status */}
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Bell color="#3B82F6" size={32} />
              <Text style={styles.statusTitle}>Bildirim Durumu</Text>
            </View>
            <Text style={styles.statusText}>
              {settings.pushNotifications ? "Bildirimler Aktif" : "Bildirimler Kapalı"}
            </Text>
            <Text style={styles.statusSubtext}>
              {settings.pushNotifications 
                ? "Tüm bildirimler açık ve aktif"
                : "Bildirimler kapalı - önemli güncellemeleri kaçırabilirsiniz"
              }
            </Text>
          </View>

          {/* General Settings */}
          <Text style={styles.sectionTitle}>🔔 Genel Bildirimler</Text>
          
          <NotificationCard
            title="Push Bildirimleri"
            description="Tüm push bildirimlerini aç/kapat"
            icon={Bell}
            enabled={settings.pushNotifications}
            onToggle={() => handleToggle('pushNotifications')}
            color="#3B82F6"
          />
          
          <NotificationCard
            title="Ses Bildirimleri"
            description="Bildirim seslerini aç/kapat"
            icon={settings.soundEnabled ? Volume2 : VolumeX}
            enabled={settings.soundEnabled}
            onToggle={() => handleToggle('soundEnabled')}
            color="#10B981"
          />
          
          <NotificationCard
            title="Titreşim"
            description="Bildirim titreşimlerini aç/kapat"
            icon={Smartphone}
            enabled={settings.vibrationEnabled}
            onToggle={() => handleToggle('vibrationEnabled')}
            color="#8B5CF6"
          />

          {/* Communication Settings */}
          <Text style={styles.sectionTitle}>📱 İletişim Bildirimleri</Text>
          
          <NotificationCard
            title="Email Bildirimleri"
            description="Email ile bildirim alın"
            icon={Mail}
            enabled={settings.emailNotifications}
            onToggle={() => handleToggle('emailNotifications')}
            color="#F59E0B"
          />
          
          <NotificationCard
            title="SMS Bildirimleri"
            description="SMS ile bildirim alın"
            icon={MessageCircle}
            enabled={settings.smsNotifications}
            onToggle={() => handleToggle('smsNotifications')}
            color="#06B6D4"
          />

          {/* LUMI Specific Notifications */}
          <Text style={styles.sectionTitle}>🌟 LUMI Özel Bildirimleri</Text>
          
          <NotificationCard
            title="Yeni Eşleşmeler"
            description="Yeni eşleşme bildirimleri"
            icon={MessageCircle}
            enabled={settings.newMatches}
            onToggle={() => handleToggle('newMatches')}
            color="#EC4899"
          />
          
          <NotificationCard
            title="Video Çağrıları"
            description="Gelen video çağrı bildirimleri"
            icon={Video}
            enabled={settings.videoCalls}
            onToggle={() => handleToggle('videoCalls')}
            color="#3B82F6"
          />
          
          <NotificationCard
            title="Hediye Bildirimleri"
            description="Gelen hediye bildirimleri"
            icon={Gift}
            enabled={settings.gifts}
            onToggle={() => handleToggle('gifts')}
            color="#F59E0B"
          />
          
          <NotificationCard
            title="Mesaj Bildirimleri"
            description="Yeni mesaj bildirimleri"
            icon={MessageCircle}
            enabled={settings.messages}
            onToggle={() => handleToggle('messages')}
            color="#10B981"
          />

          {/* System Notifications */}
          <Text style={styles.sectionTitle}>⚙️ Sistem Bildirimleri</Text>
          
          <NotificationCard
            title="Abonelik Bildirimleri"
            description="Abonelik güncellemeleri ve faturalar"
            icon={Bell}
            enabled={settings.subscriptions}
            onToggle={() => handleToggle('subscriptions')}
            color="#8B5CF6"
          />
          
          <NotificationCard
            title="Güvenlik Bildirimleri"
            description="Güvenlik uyarıları ve şüpheli aktiviteler"
            icon={Bell}
            enabled={settings.security}
            onToggle={() => handleToggle('security')}
            color="#EF4444"
          />
          
          <NotificationCard
            title="Pazarlama Bildirimleri"
            description="Promosyonlar ve özel teklifler"
            icon={Bell}
            enabled={settings.marketing}
            onToggle={() => handleToggle('marketing')}
            color="#F59E0B"
          />
          
          <NotificationCard
            title="Sistem Bildirimleri"
            description="Uygulama güncellemeleri ve bakım"
            icon={Bell}
            enabled={settings.system}
            onToggle={() => handleToggle('system')}
            color="#6B7280"
          />

          {/* Sound Settings */}
          {settings.soundEnabled && (
            <TouchableOpacity
              style={styles.soundButton}
              onPress={() => setShowSoundModal(true)}
            >
              <Volume2 color="white" size={24} />
              <Text style={styles.soundButtonText}>Bildirim Sesi Seç</Text>
            </TouchableOpacity>
          )}

          {/* Test Notifications */}
          <View style={styles.testCard}>
            <Text style={styles.testTitle}>🧪 Bildirim Testi</Text>
            <Text style={styles.testDescription}>
              Bildirim ayarlarınızı test edin
            </Text>
            <TouchableOpacity
              style={styles.testButton}
              onPress={handleTestSound}
            >
              <Text style={styles.testButtonText}>Test Et</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Sound Selection Modal */}
        <Modal
          visible={showSoundModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowSoundModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Bildirim Sesi Seç</Text>
              
              {soundOptions.map((sound) => (
                <TouchableOpacity
                  key={sound.id}
                  style={[
                    styles.soundOption,
                    selectedSound === sound.id && styles.soundOptionSelected
                  ]}
                  onPress={() => setSelectedSound(sound.id)}
                >
                  <Text style={styles.soundEmoji}>{sound.emoji}</Text>
                  <Text style={[
                    styles.soundName,
                    selectedSound === sound.id && styles.soundNameSelected
                  ]}>
                    {sound.name}
                  </Text>
                  {selectedSound === sound.id && (
                    <Text style={styles.soundCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowSoundModal(false)}
                >
                  <Text style={styles.cancelButtonText}>İptal</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={() => {
                    setShowSoundModal(false);
                    Alert.alert("Başarılı", "Bildirim sesi güncellendi!");
                  }}
                >
                  <Text style={styles.saveButtonText}>Kaydet</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statusCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3B82F6',
    marginLeft: 12,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  statusSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 16,
    marginTop: 20,
  },
  notificationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notificationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationText: {
    marginLeft: 12,
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
  },
  soundButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  soundButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  testCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  testTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
  },
  testDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
    textAlign: 'center',
  },
  testButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  soundOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  soundOptionSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  soundEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  soundName: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  soundNameSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  soundCheck: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '700',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
