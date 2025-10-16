import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useCameraPermissions } from 'expo-camera';
import { Colors } from '@/constants/colors';

interface RealVerificationModalProps {
  visible: boolean;
  onClose: () => void;
  type: 'identity' | 'selfie';
}

export default function RealVerificationModal({ visible, onClose, type }: RealVerificationModalProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState<'id' | 'passport' | 'driver' | null>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const isIdentity = type === 'identity';

  const requestCameraPermission = async () => {
    const result = await requestPermission();
    return result?.granted || false;
  };

  const requestMediaLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  };

  const handleTakePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('İzin Gerekli', 'Kamera kullanımı için izin gerekli.');
      return;
    }

    setLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: isIdentity ? [4, 3] : [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedImage(result.assets[0].uri);
        setStep(2);
      }
    } catch (error) {
      Alert.alert('Hata', 'Fotoğraf çekilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFromGallery = async () => {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) {
      Alert.alert('İzin Gerekli', 'Galeri erişimi için izin gerekli.');
      return;
    }

    setLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: isIdentity ? [4, 3] : [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedImage(result.assets[0].uri);
        setStep(2);
      }
    } catch (error) {
      Alert.alert('Hata', 'Fotoğraf seçilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitVerification = async () => {
    if (!capturedImage) return;

    setLoading(true);
    try {
      // Simulate upload to server
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Here you would normally upload to your server
      // const formData = new FormData();
      // formData.append('image', {
      //   uri: capturedImage,
      //   type: 'image/jpeg',
      //   name: 'verification.jpg',
      // });
      // const response = await fetch('/api/upload-verification', {
      //   method: 'POST',
      //   body: formData,
      // });

      Alert.alert(
        'Başarılı', 
        `${isIdentity ? 'Kimlik belgeniz' : 'Selfie fotoğrafınız'} başarıyla yüklendi ve doğrulama için gönderildi.`,
        [{ text: 'Tamam', onPress: onClose }]
      );
    } catch (error) {
      Alert.alert('Hata', 'Doğrulama gönderilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setStep(1);
  };

  const handleDocumentTypeSelect = (type: 'id' | 'passport' | 'driver') => {
    setDocumentType(type);
  };

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

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
                    ? 'Kimlik belgenizi fotoğraflayarak hesabınızı doğrulayın.'
                    : 'Yüzünüzü fotoğraflayarak kimliğinizi doğrulayın.'
                  }
                </Text>

                {isIdentity && (
                  <View style={styles.documentTypeSection}>
                    <Text style={styles.sectionTitle}>Belge Türü Seçin:</Text>
                    <View style={styles.documentTypeButtons}>
                      <TouchableOpacity
                        style={[
                          styles.documentTypeButton,
                          documentType === 'id' && styles.documentTypeButtonActive
                        ]}
                        onPress={() => handleDocumentTypeSelect('id')}
                      >
                        <MaterialIcons name="credit-card" size={20} color={documentType === 'id' ? '#FFFFFF' : Colors.primary} />
                        <Text style={[
                          styles.documentTypeButtonText,
                          documentType === 'id' && styles.documentTypeButtonTextActive
                        ]}>
                          Kimlik Kartı
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[
                          styles.documentTypeButton,
                          documentType === 'passport' && styles.documentTypeButtonActive
                        ]}
                        onPress={() => handleDocumentTypeSelect('passport')}
                      >
                        <MaterialIcons name="book" size={20} color={documentType === 'passport' ? '#FFFFFF' : Colors.primary} />
                        <Text style={[
                          styles.documentTypeButtonText,
                          documentType === 'passport' && styles.documentTypeButtonTextActive
                        ]}>
                          Pasaport
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[
                          styles.documentTypeButton,
                          documentType === 'driver' && styles.documentTypeButtonActive
                        ]}
                        onPress={() => handleDocumentTypeSelect('driver')}
                      >
                        <MaterialIcons name="drive-eta" size={20} color={documentType === 'driver' ? '#FFFFFF' : Colors.primary} />
                        <Text style={[
                          styles.documentTypeButtonText,
                          documentType === 'driver' && styles.documentTypeButtonTextActive
                        ]}>
                          Ehliyet
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <View style={styles.requirements}>
                  <Text style={styles.requirementsTitle}>Gereksinimler:</Text>
                  {isIdentity ? (
                    <>
                      <Text style={styles.requirementItem}>• Belge net ve okunabilir olmalı</Text>
                      <Text style={styles.requirementItem}>• Tüm köşeler görünür olmalı</Text>
                      <Text style={styles.requirementItem}>• Işık yansıması olmamalı</Text>
                      <Text style={styles.requirementItem}>• Belge düz ve katlanmamış olmalı</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.requirementItem}>• İyi aydınlatma</Text>
                      <Text style={styles.requirementItem}>• Yüzünüz net görünmeli</Text>
                      <Text style={styles.requirementItem}>• Gözlük/maske takmayın</Text>
                      <Text style={styles.requirementItem}>• Doğal ifade</Text>
                    </>
                  )}
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.cameraButton}
                    onPress={handleTakePhoto}
                    disabled={loading || (isIdentity && !documentType)}
                  >
                    <MaterialIcons name="camera-alt" size={24} color="#FFFFFF" />
                    <Text style={styles.cameraButtonText}>Fotoğraf Çek</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.galleryButton}
                    onPress={handleSelectFromGallery}
                    disabled={loading || (isIdentity && !documentType)}
                  >
                    <MaterialIcons name="photo-library" size={24} color={Colors.primary} />
                    <Text style={styles.galleryButtonText}>Galeriden Seç</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {step === 2 && capturedImage && (
              <>
                <View style={styles.previewContainer}>
                  <Text style={styles.previewTitle}>Önizleme</Text>
                  <Image source={{ uri: capturedImage }} style={styles.previewImage} />
                  
                  <View style={styles.previewActions}>
                    <TouchableOpacity
                      style={styles.retakeButton}
                      onPress={handleRetake}
                    >
                      <MaterialIcons name="refresh" size={20} color={Colors.primary} />
                      <Text style={styles.retakeButtonText}>Yeniden Çek</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSubmitVerification}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <MaterialIcons name="cloud-upload" size={20} color="#FFFFFF" />
                      <Text style={styles.submitButtonText}>Doğrulamayı Gönder</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
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
    maxHeight: '90%',
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
  documentTypeSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  documentTypeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  documentTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
    gap: 8,
  },
  documentTypeButtonActive: {
    backgroundColor: Colors.primary,
  },
  documentTypeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  documentTypeButtonTextActive: {
    color: '#FFFFFF',
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
  actionButtons: {
    gap: 12,
  },
  cameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cameraButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  galleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.borderLight,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: 8,
  },
  galleryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  previewImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 16,
  },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: 4,
  },
  retakeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
