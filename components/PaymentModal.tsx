import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CreditCard, Star, Crown, X, Check } from 'lucide-react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { paymentService } from '@/services/paymentService';
import { COIN_PACKAGES, SUBSCRIPTION_PACKAGES } from '@/lib/stripe';
import { Colors } from '@/constants/colors';

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  type: 'coins' | 'subscription';
  onSuccess?: (result: any) => void;
}

export default function PaymentModal({ visible, onClose, type, onSuccess }: PaymentModalProps) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  const handlePurchase = async (packageId: string) => {
    if (loading) return;

    setLoading(true);
    setSelectedPackage(packageId);

    try {
      let result;
      
      if (type === 'coins') {
        result = await paymentService.purchaseCoins(packageId, 'pm_card_visa'); // Test card
      } else {
        result = await paymentService.purchaseSubscription(packageId, 'pm_card_visa'); // Test card
      }

      if (result.success) {
        Alert.alert(
          'Başarılı!',
          type === 'coins' 
            ? 'Coinleriniz hesabınıza eklendi!' 
            : 'Aboneliğiniz aktif edildi!',
          [{ text: 'Tamam', onPress: onClose }]
        );
        onSuccess?.(result);
      } else {
        Alert.alert('Hata', result.error || 'Ödeme işlemi başarısız');
      }
    } catch (error) {
      console.error('[PaymentModal] Purchase error:', error);
      Alert.alert('Hata', 'Ödeme işlemi sırasında bir hata oluştu');
    } finally {
      setLoading(false);
      setSelectedPackage(null);
    }
  };

  const packages = type === 'coins' ? COIN_PACKAGES : SUBSCRIPTION_PACKAGES;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {type === 'coins' ? (
                <Star color={Colors.primary} size={24} />
              ) : (
                <Crown color={Colors.primary} size={24} />
              )}
              <Text style={styles.title}>
                {type === 'coins' ? 'Coin Satın Al' : 'Abonelik Satın Al'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color={Colors.textMuted} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {packages.map((pkg) => (
              <TouchableOpacity
                key={pkg.id}
                style={[
                  styles.packageCard,
                  pkg.popular && styles.popularPackage,
                  selectedPackage === pkg.id && styles.selectedPackage,
                ]}
                onPress={() => handlePurchase(pkg.id)}
                disabled={loading}
              >
                {pkg.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>En Popüler</Text>
                  </View>
                )}

                <View style={styles.packageHeader}>
                  <Text style={styles.packageName}>{pkg.name}</Text>
                  <View style={styles.priceContainer}>
                    <Text style={styles.price}>${pkg.price}</Text>
                    {type === 'subscription' && 'interval' in pkg && (
                      <Text style={styles.interval}>/{pkg.interval}</Text>
                    )}
                  </View>
                </View>

                {type === 'coins' && 'coins' in pkg && (
                  <View style={styles.coinInfo}>
                    <Text style={styles.coinAmount}>{pkg.coins} Lumi Coin</Text>
                    {'bonus' in pkg && pkg.bonus && (
                      <Text style={styles.bonusText}>+{pkg.bonus} Bonus!</Text>
                    )}
                  </View>
                )}

                {type === 'subscription' && 'features' in pkg && pkg.features && (
                  <View style={styles.featuresList}>
                    {pkg.features.map((feature: string, index: number) => (
                      <View key={index} style={styles.featureItem}>
                        <Check color={Colors.success} size={16} />
                        <Text style={styles.featureText}>{feature}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {loading && selectedPackage === pkg.id && (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator color={Colors.primary} size="small" />
                    <Text style={styles.loadingText}>İşleniyor...</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}

            <View style={styles.paymentInfo}>
              <View style={styles.paymentMethod}>
                <CreditCard color={Colors.textMuted} size={20} />
                <Text style={styles.paymentText}>Güvenli ödeme - Stripe</Text>
              </View>
              <Text style={styles.securityText}>
                Ödeme bilgileriniz güvenli şekilde işlenir
              </Text>
            </View>
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
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    paddingHorizontal: 20,
  },
  packageCard: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    position: 'relative',
  },
  popularPackage: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}10`,
  },
  selectedPackage: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}20`,
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  packageName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  interval: {
    fontSize: 14,
    color: Colors.textMuted,
    marginLeft: 2,
  },
  coinInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coinAmount: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  bonusText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '600',
  },
  featuresList: {
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 2,
  },
  featureText: {
    fontSize: 14,
    color: Colors.text,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.text,
  },
  paymentInfo: {
    marginTop: 20,
    padding: 16,
    backgroundColor: Colors.background,
    borderRadius: 12,
    alignItems: 'center',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  paymentText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  securityText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
