import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

interface VerificationModalProps {
  visible: boolean;
  onClose: () => void;
  type: 'identity' | 'selfie';
}

export default function VerificationModal({ visible, onClose, type }: VerificationModalProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const handleStartVerification = async () => {
    setLoading(true);
    try {
      // Simulate verification process
      await new Promise(resolve => setTimeout(resolve, 2000));
      setStep(2);
    } catch (error) {
      Alert.alert('Hata', 'Doğrulama işlemi başlatılamadı.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteVerification = async () => {
    setLoading(true);
    try {
      // Simulate completion
      await new Promise(resolve => setTimeout(resolve, 1500));
      Alert.alert('Başarılı', 'Doğrulama işlemi tamamlandı!');
      onClose();
    } catch (error) {
      Alert.alert('Hata', 'Doğrulama tamamlanamadı.');
    } finally {
      setLoading(false);
    }
  };

  const isIdentity = type === 'identity';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {isIdentity ? 'Kimlik Doğrulama' : 'Selfie Doğrulama'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {step === 1 && (
              <>
                <View style={styles.iconContainer}>
                  <MaterialIcons 
                    name={isIdentity ? "credit-card" : "camera-alt"} 
                    size={48} 
                    color={Colors.primary} 
                  />
                </View>
                
                <Text style={styles.description}>
                  {isIdentity 
                    ? 'Kimlik belgenizi yükleyerek hesabınızı doğrulayın. Bu işlem güvenliğiniz için gereklidir.'
                    : 'Yüzünüzü fotoğraflayarak kimliğinizi doğrulayın. Bu işlem hesap güvenliği için gereklidir.'
                  }
                </Text>

                <View style={styles.requirements}>
                  <Text style={styles.requirementsTitle}>Gereksinimler:</Text>
                  {isIdentity ? (
                    <>
                      <Text style={styles.requirementItem}>• Geçerli kimlik belgesi</Text>
                      <Text style={styles.requirementItem}>• Net ve okunabilir fotoğraf</Text>
                      <Text style={styles.requirementItem}>• Tüm bilgiler görünür olmalı</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.requirementItem}>• İyi aydınlatma</Text>
                      <Text style={styles.requirementItem}>• Yüzünüz net görünmeli</Text>
                      <Text style={styles.requirementItem}>• Gözlük/maske takmayın</Text>
                    </>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.startButton}
                  onPress={handleStartVerification}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.startButtonText}>Doğrulamayı Başlat</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {step === 2 && (
              <>
                <View style={styles.iconContainer}>
                  <MaterialIcons name="check-circle" size={48} color="#10B981" />
                </View>
                
                <Text style={styles.successTitle}>Doğrulama Tamamlandı!</Text>
                <Text style={styles.successDescription}>
                  {isIdentity 
                    ? 'Kimlik belgeniz başarıyla doğrulandı. Hesabınız artık doğrulanmış durumda.'
                    : 'Selfie doğrulamanız başarıyla tamamlandı. Hesabınız artık doğrulanmış durumda.'
                  }
                </Text>

                <TouchableOpacity
                  style={styles.completeButton}
                  onPress={handleCompleteVerification}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.completeButtonText}>Tamamla</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  requirements: {
    backgroundColor: Colors.borderLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  requirementItem: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  startButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  successDescription: {
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  completeButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
