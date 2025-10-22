import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, CreditCard, CheckCircle, AlertCircle } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useUser } from "@/providers/UserProvider";
import { Colors } from "@/constants/colors";

interface IbanPaymentData {
  iban: string;
  bankName: string;
  accountHolder: string;
  amount: number;
  currency: string;
}

export default function IbanPaymentScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [showIbanModal, setShowIbanModal] = useState(false);
  const [paymentData, setPaymentData] = useState<IbanPaymentData>({
    iban: "",
    bankName: "",
    accountHolder: "",
    amount: 0,
    currency: "USD",
  });
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'test' | 'main' | 'completed'>('pending');

  const handleIbanSubmit = () => {
    if (!paymentData.iban || !paymentData.bankName || !paymentData.accountHolder) {
      Alert.alert("Hata", "Lütfen tüm alanları doldurun");
      return;
    }

    // IBAN validation
    if (paymentData.iban.length < 15) {
      Alert.alert("Hata", "Geçerli bir IBAN girin");
      return;
    }

    setPaymentStatus('test');
    setShowIbanModal(false);
    
    // Simulate test payment
    setTimeout(() => {
      setPaymentStatus('main');
      Alert.alert(
        "Test Ödemesi Bekleniyor",
        "Test ödemesi (0.20-0.40 USD) yapmanız gerekiyor. 3 gün içinde onaylayın.",
        [
          {
            text: "Tamam",
            onPress: () => {
              // Simulate test payment confirmation
              setTimeout(() => {
                setPaymentStatus('completed');
                Alert.alert("Başarılı", "Test ödemesi onaylandı. Ana ödeme 21 günde bir yapılacak.");
              }, 2000);
            }
          }
        ]
      );
    }, 1000);
  };

  const getStatusInfo = () => {
    switch (paymentStatus) {
      case 'pending':
        return {
          title: "IBAN Ödeme Sistemi",
          subtitle: "Kazançlarınızı IBAN ile alın",
          color: Colors.primary,
          icon: CreditCard,
        };
      case 'test':
        return {
          title: "Test Ödemesi Hazırlanıyor",
          subtitle: "IBAN bilgileriniz doğrulanıyor...",
          color: "#FFC107",
          icon: AlertCircle,
        };
      case 'main':
        return {
          title: "Test Ödemesi Bekleniyor",
          subtitle: "0.20-0.40 USD test ödemesi yapın",
          color: "#FF9800",
          icon: AlertCircle,
        };
      case 'completed':
        return {
          title: "Ödeme Sistemi Aktif",
          subtitle: "21 günde bir otomatik ödeme yapılacak",
          color: "#4CAF50",
          icon: CheckCircle,
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

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
          <Text style={styles.headerTitle}>IBAN Ödeme</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Status Card */}
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <StatusIcon color={statusInfo.color} size={32} />
              <Text style={[styles.statusTitle, { color: statusInfo.color }]}>
                {statusInfo.title}
              </Text>
            </View>
            <Text style={styles.statusSubtitle}>{statusInfo.subtitle}</Text>
          </View>

          {/* Payment Info */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>💰 Ödeme Bilgileri</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Görüşme Ücreti:</Text>
              <Text style={styles.infoValue}>20-45 coin/dakika</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Kazanç Oranı:</Text>
              <Text style={styles.infoValue}>%82.5 (Kullanıcı)</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Şirket Payı:</Text>
              <Text style={styles.infoValue}>%17.5 (LITXTECH LLC)</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ödeme Sıklığı:</Text>
              <Text style={styles.infoValue}>21 günde bir</Text>
            </View>
          </View>

          {/* IBAN Form */}
          {paymentStatus === 'pending' && (
            <TouchableOpacity
              style={styles.ibanButton}
              onPress={() => setShowIbanModal(true)}
            >
              <CreditCard color="white" size={24} />
              <Text style={styles.ibanButtonText}>IBAN Bilgilerini Gir</Text>
            </TouchableOpacity>
          )}

          {/* Payment Steps */}
          <View style={styles.stepsCard}>
            <Text style={styles.stepsTitle}>📋 Ödeme Süreci</Text>
            <View style={styles.step}>
              <View style={[styles.stepNumber, paymentStatus !== 'pending' && styles.stepCompleted]}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>IBAN bilgilerini girin</Text>
            </View>
            <View style={styles.step}>
              <View style={[styles.stepNumber, paymentStatus === 'test' && styles.stepActive]}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>Test ödemesi yapın (0.20-0.40 USD)</Text>
            </View>
            <View style={styles.step}>
              <View style={[styles.stepNumber, paymentStatus === 'main' && styles.stepActive]}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>Test ödemesini onaylayın</Text>
            </View>
            <View style={styles.step}>
              <View style={[styles.stepNumber, paymentStatus === 'completed' && styles.stepCompleted]}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <Text style={styles.stepText}>Ana ödeme sistemi aktif</Text>
            </View>
          </View>

          {/* Company Info */}
          <View style={styles.companyCard}>
            <Text style={styles.companyTitle}>🏢 Şirket Bilgileri</Text>
            <Text style={styles.companyText}>
              <Text style={styles.companyLabel}>Şirket:</Text> LITXTECH LLC
            </Text>
            <Text style={styles.companyText}>
              <Text style={styles.companyLabel}>Adres:</Text> 15442 VENTURA BLVD., STE 201-1834, SHERMAN OAKS, CALIFORNIA 91403
            </Text>
            <Text style={styles.companyText}>
              <Text style={styles.companyLabel}>WhatsApp:</Text> +1 307 271 5151
            </Text>
            <Text style={styles.companyText}>
              <Text style={styles.companyLabel}>Email:</Text> support@litxtech.com
            </Text>
          </View>
        </ScrollView>

        {/* IBAN Modal */}
        <Modal
          visible={showIbanModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowIbanModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>IBAN Bilgileri</Text>
              
              <TextInput
                style={styles.input}
                placeholder="IBAN (TR...)"
                value={paymentData.iban}
                onChangeText={(text) => setPaymentData({ ...paymentData, iban: text })}
                placeholderTextColor={Colors.textMuted}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Banka Adı"
                value={paymentData.bankName}
                onChangeText={(text) => setPaymentData({ ...paymentData, bankName: text })}
                placeholderTextColor={Colors.textMuted}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Hesap Sahibi Adı"
                value={paymentData.accountHolder}
                onChangeText={(text) => setPaymentData({ ...paymentData, accountHolder: text })}
                placeholderTextColor={Colors.textMuted}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowIbanModal(false)}
                >
                  <Text style={styles.cancelButtonText}>İptal</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleIbanSubmit}
                >
                  <Text style={styles.submitButtonText}>Kaydet</Text>
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
  statusSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  infoValue: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  ibanButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  ibanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  stepsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginBottom: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepCompleted: {
    backgroundColor: '#4CAF50',
  },
  stepActive: {
    backgroundColor: '#FFC107',
  },
  stepNumberText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  stepText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    flex: 1,
  },
  companyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  companyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginBottom: 16,
  },
  companyText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
    lineHeight: 20,
  },
  companyLabel: {
    fontWeight: '600',
    color: 'white',
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
  input: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    marginBottom: 16,
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
  submitButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
