import React from 'react';
import { View, Text, ScrollView, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PrivacyPolicy() {
  const openEmail = () => {
    Linking.openURL('mailto:support@litxtech.com');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Gizlilik Politikası</Text>
        
        <Text style={styles.sectionTitle}>1. Bilgi Toplama</Text>
        <Text style={styles.text}>
          Lumi Video Chat uygulaması, hizmetlerimizi sağlamak için aşağıdaki bilgileri toplar:
        </Text>
        <Text style={styles.text}>
          • Kullanıcı hesap bilgileri (e-posta, isim)
          • Video ve ses kayıtları (sadece görüşme sırasında)
          • Cihaz bilgileri (model, işletim sistemi)
          • Kullanım istatistikleri
        </Text>

        <Text style={styles.sectionTitle}>2. Bilgi Kullanımı</Text>
        <Text style={styles.text}>
          Toplanan bilgiler şu amaçlarla kullanılır:
        </Text>
        <Text style={styles.text}>
          • Video görüşme hizmetlerinin sağlanması
          • Uygulama performansının iyileştirilmesi
          • Teknik destek sağlanması
          • Güvenlik önlemlerinin alınması
        </Text>

        <Text style={styles.sectionTitle}>3. Bilgi Paylaşımı</Text>
        <Text style={styles.text}>
          Kişisel bilgileriniz üçüncü taraflarla paylaşılmaz. Sadece yasal zorunluluklar 
          durumunda yetkili makamlarla paylaşılabilir.
        </Text>

        <Text style={styles.sectionTitle}>4. Veri Güvenliği</Text>
        <Text style={styles.text}>
          Tüm verileriniz end-to-end şifreleme ile korunur. Sunucularımız güvenli 
          veri merkezlerinde barındırılır.
        </Text>

        <Text style={styles.sectionTitle}>5. Çerezler</Text>
        <Text style={styles.text}>
          Uygulama performansını iyileştirmek için çerezler kullanılır. 
          Çerezleri tarayıcı ayarlarınızdan yönetebilirsiniz.
        </Text>

        <Text style={styles.sectionTitle}>6. Kullanıcı Hakları</Text>
        <Text style={styles.text}>
          • Verilerinize erişim hakkı
          • Verilerinizin düzeltilmesi hakkı
          • Verilerinizin silinmesi hakkı
          • Veri taşınabilirliği hakkı
        </Text>

        <Text style={styles.sectionTitle}>7. İletişim</Text>
        <Text style={styles.text}>
          Gizlilik politikası ile ilgili sorularınız için:
        </Text>
        <Text style={styles.link} onPress={openEmail}>
          support@litxtech.com
        </Text>

        <Text style={styles.sectionTitle}>8. Değişiklikler</Text>
        <Text style={styles.text}>
          Bu gizlilik politikası gerektiğinde güncellenebilir. 
          Önemli değişiklikler kullanıcılara bildirilir.
        </Text>

        <Text style={styles.footer}>
          Son güncelleme: 25 Ekim 2025
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
    color: '#666',
  },
  link: {
    fontSize: 14,
    color: '#007AFF',
    textDecorationLine: 'underline',
    marginBottom: 10,
  },
  footer: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 30,
    fontStyle: 'italic',
  },
});
