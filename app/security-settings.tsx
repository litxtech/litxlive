import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, Shield, Phone, Mail, Key, AlertTriangle, CheckCircle } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useUser } from "@/providers/UserProvider";
import { Colors } from "@/constants/colors";

interface SecuritySettings {
  twoFactorEnabled: boolean;
  smsVerification: boolean;
  emailVerification: boolean;
  loginAlerts: boolean;
  deviceManagement: boolean;
  suspiciousActivity: boolean;
  spamProtection: boolean;
  autoBlock: boolean;
}

export default function SecuritySettingsScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [settings, setSettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    smsVerification: true,
    emailVerification: true,
    loginAlerts: true,
    deviceManagement: true,
    suspiciousActivity: true,
    spamProtection: true,
    autoBlock: false,
  });
  
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const handleToggle = (key: keyof SecuritySettings) => {
    if (key === 'twoFactorEnabled' && !settings.twoFactorEnabled) {
      setShowOTPModal(true);
      return;
    }
    
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSendOTP = () => {
    // TODO: Implement OTP sending
    Alert.alert("OTP Gönderildi", "Doğrulama kodu telefonunuza gönderildi.");
    setOtpSent(true);
  };

  const handleVerifyOTP = () => {
    if (otpCode.length !== 6) {
      Alert.alert("Hata", "Lütfen 6 haneli kodu girin.");
      return;
    }
    
    // TODO: Implement OTP verification
    Alert.alert("Başarılı", "İki faktörlü doğrulama aktif edildi!");
    setSettings(prev => ({ ...prev, twoFactorEnabled: true }));
    setShowOTPModal(false);
    setOtpCode("");
    setOtpSent(false);
  };

  const SecurityCard = ({ 
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
    <View style={styles.securityCard}>
      <View style={styles.securityHeader}>
        <View style={styles.securityInfo}>
          <Icon color={color} size={24} />
          <View style={styles.securityText}>
            <Text style={styles.securityTitle}>{title}</Text>
            <Text style={styles.securityDescription}>{description}</Text>
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
          <Text style={styles.headerTitle}>Güvenlik Ayarları</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Security Status */}
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Shield color="#10B981" size={32} />
              <Text style={styles.statusTitle}>Güvenlik Durumu</Text>
            </View>
            <Text style={styles.statusText}>
              {settings.twoFactorEnabled ? "Yüksek Güvenlik" : "Orta Güvenlik"}
            </Text>
            <Text style={styles.statusSubtext}>
              {settings.twoFactorEnabled 
                ? "Hesabınız maksimum güvenlik seviyesinde korunuyor"
                : "İki faktörlü doğrulamayı aktif ederek güvenliğinizi artırın"
              }
            </Text>
          </View>

          {/* Authentication Settings */}
          <Text style={styles.sectionTitle}>🔐 Kimlik Doğrulama</Text>
          
          <SecurityCard
            title="İki Faktörlü Doğrulama"
            description="Hesabınız için ek güvenlik katmanı"
            icon={Key}
            enabled={settings.twoFactorEnabled}
            onToggle={() => handleToggle('twoFactorEnabled')}
            color="#10B981"
          />
          
          <SecurityCard
            title="SMS Doğrulama"
            description="Telefon numaranıza doğrulama kodu gönderilir"
            icon={Phone}
            enabled={settings.smsVerification}
            onToggle={() => handleToggle('smsVerification')}
            color="#3B82F6"
          />
          
          <SecurityCard
            title="Email Doğrulama"
            description="Email adresinize doğrulama kodu gönderilir"
            icon={Mail}
            enabled={settings.emailVerification}
            onToggle={() => handleToggle('emailVerification')}
            color="#8B5CF6"
          />

          {/* Security Alerts */}
          <Text style={styles.sectionTitle}>🚨 Güvenlik Uyarıları</Text>
          
          <SecurityCard
            title="Giriş Uyarıları"
            description="Yeni cihazlardan giriş yapıldığında bildirim alın"
            icon={AlertTriangle}
            enabled={settings.loginAlerts}
            onToggle={() => handleToggle('loginAlerts')}
            color="#F59E0B"
          />
          
          <SecurityCard
            title="Şüpheli Aktivite"
            description="Olağandışı aktiviteler için uyarı alın"
            icon={Shield}
            enabled={settings.suspiciousActivity}
            onToggle={() => handleToggle('suspiciousActivity')}
            color="#EF4444"
          />

          {/* Spam Protection */}
          <Text style={styles.sectionTitle}>🛡️ Spam Koruması</Text>
          
          <SecurityCard
            title="Spam Koruması"
            description="Otomatik spam mesaj tespiti ve filtreleme"
            icon={Shield}
            enabled={settings.spamProtection}
            onToggle={() => handleToggle('spamProtection')}
            color="#06B6D4"
          />
          
          <SecurityCard
            title="Otomatik Engelleme"
            description="Spam kullanıcıları otomatik olarak engelle"
            icon={AlertTriangle}
            enabled={settings.autoBlock}
            onToggle={() => handleToggle('autoBlock')}
            color="#EF4444"
          />

          {/* Device Management */}
          <Text style={styles.sectionTitle}>📱 Cihaz Yönetimi</Text>
          
          <SecurityCard
            title="Cihaz Yönetimi"
            description="Kayıtlı cihazlarınızı görüntüleyin ve yönetin"
            icon={Phone}
            enabled={settings.deviceManagement}
            onToggle={() => handleToggle('deviceManagement')}
            color="#8B5CF6"
          />

          {/* Security Tips */}
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>💡 Güvenlik İpuçları</Text>
            <View style={styles.tipItem}>
              <CheckCircle color="#10B981" size={16} />
              <Text style={styles.tipText}>Güçlü şifreler kullanın</Text>
            </View>
            <View style={styles.tipItem}>
              <CheckCircle color="#10B981" size={16} />
              <Text style={styles.tipText}>İki faktörlü doğrulamayı aktif edin</Text>
            </View>
            <View style={styles.tipItem}>
              <CheckCircle color="#10B981" size={16} />
              <Text style={styles.tipText}>Şüpheli linklere tıklamayın</Text>
            </View>
            <View style={styles.tipItem}>
              <CheckCircle color="#10B981" size={16} />
              <Text style={styles.tipText}>Düzenli olarak şifrenizi değiştirin</Text>
            </View>
          </View>
        </ScrollView>

        {/* OTP Modal */}
        <Modal
          visible={showOTPModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowOTPModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>İki Faktörlü Doğrulama</Text>
              
              {!otpSent ? (
                <View>
                  <Text style={styles.modalText}>
                    Telefon numaranıza doğrulama kodu gönderilecek. Devam etmek istiyor musunuz?
                  </Text>
                  
                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => setShowOTPModal(false)}
                    >
                      <Text style={styles.cancelButtonText}>İptal</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.sendButton}
                      onPress={handleSendOTP}
                    >
                      <Text style={styles.sendButtonText}>Kod Gönder</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View>
                  <Text style={styles.modalText}>
                    6 haneli doğrulama kodunu girin:
                  </Text>
                  
                  <TextInput
                    style={styles.otpInput}
                    value={otpCode}
                    onChangeText={setOtpCode}
                    placeholder="123456"
                    keyboardType="numeric"
                    maxLength={6}
                    placeholderTextColor={Colors.textMuted}
                  />
                  
                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => {
                        setShowOTPModal(false);
                        setOtpSent(false);
                        setOtpCode("");
                      }}
                    >
                      <Text style={styles.cancelButtonText}>İptal</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.verifyButton}
                      onPress={handleVerifyOTP}
                    >
                      <Text style={styles.verifyButtonText}>Doğrula</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
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
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: '#10B981',
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
    color: '#10B981',
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
  securityCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  securityText: {
    marginLeft: 12,
    flex: 1,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  securityDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
  },
  tipsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 12,
    flex: 1,
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
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  otpInput: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
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
  sendButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  verifyButton: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
