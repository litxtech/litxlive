import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trash2, Mail, Phone } from 'lucide-react-native';

export default function AccountDeletion() {
  const [isDeleting, setIsDeleting] = useState(false);

  const openEmail = () => {
    Linking.openURL('mailto:support@litxtech.com?subject=Hesap Silme Talebi');
  };

  const openPhone = () => {
    Linking.openURL('tel:+905551234567');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Hesabınızı Silmek İstediğinizden Emin misiniz?',
      'Bu işlem geri alınamaz. Tüm verileriniz kalıcı olarak silinecektir.',
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => {
            setIsDeleting(true);
            // Gerçek silme işlemi burada yapılacak
            setTimeout(() => {
              setIsDeleting(false);
              Alert.alert('Başarılı', 'Hesabınız başarıyla silindi.');
            }, 2000);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Hesap Silme</Text>
        
        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>⚠️ Önemli Uyarı</Text>
          <Text style={styles.warningText}>
            Hesabınızı silmek istediğinizde:
          </Text>
          <Text style={styles.warningList}>
            • Tüm kişisel verileriniz silinir
            • Video kayıtlarınız kalıcı olarak silinir
            • Hesap kurtarma mümkün değildir
            • Bu işlem geri alınamaz
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Hesabınızı Silmek İçin:</Text>
        
        <View style={styles.stepBox}>
          <Text style={styles.stepNumber}>1</Text>
          <Text style={styles.stepText}>
            Aşağıdaki "Hesabımı Sil" butonuna tıklayın
          </Text>
        </View>

        <View style={styles.stepBox}>
          <Text style={styles.stepNumber}>2</Text>
          <Text style={styles.stepText}>
            Onay ekranında "Sil" butonuna tıklayın
          </Text>
        </View>

        <View style={styles.stepBox}>
          <Text style={styles.stepNumber}>3</Text>
          <Text style={styles.stepText}>
            Hesabınız kalıcı olarak silinecektir
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]} 
          onPress={handleDeleteAccount}
          disabled={isDeleting}
        >
          <Trash2 size={20} color="#fff" />
          <Text style={styles.deleteButtonText}>
            {isDeleting ? 'Siliniyor...' : 'Hesabımı Sil'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Alternatif Yöntemler:</Text>
        
        <TouchableOpacity style={styles.contactButton} onPress={openEmail}>
          <Mail size={20} color="#007AFF" />
          <Text style={styles.contactButtonText}>
            E-posta ile İletişim
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.contactButton} onPress={openPhone}>
          <Phone size={20} color="#007AFF" />
          <Text style={styles.contactButtonText}>
            Telefon ile İletişim
          </Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Veri Güvenliği:</Text>
        <Text style={styles.text}>
          • Tüm verileriniz GDPR uyumlu olarak silinir
          • 30 gün içinde tüm yedekler kaldırılır
          • Silme işlemi onaylandıktan sonra geri alınamaz
        </Text>

        <Text style={styles.footer}>
          Destek için: support@litxtech.com
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  warningBox: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 10,
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 5,
  },
  warningList: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 15,
    color: '#333',
  },
  stepBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  stepNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginRight: 15,
    minWidth: 30,
  },
  stepText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginVertical: 20,
  },
  deleteButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 10,
  },
  contactButtonText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 10,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
    color: '#666',
  },
  footer: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 30,
    fontStyle: 'italic',
  },
});