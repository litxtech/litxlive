import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, Check, Crown, Star, Zap } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useUser } from "@/providers/UserProvider";
import { Colors } from "@/constants/colors";
import { SUBSCRIPTION_TIERS, getSubscriptionPrice, getActiveSubscriptionTier } from "@/constants/subscriptions";

export default function SubscriptionsScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [selectedTier, setSelectedTier] = useState<string>('gold');
  const [isYearly, setIsYearly] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const currentSubscription = getActiveSubscriptionTier(null);

  const handleSubscribe = (tierId: string) => {
    if (tierId === 'standard') {
      Alert.alert("Bilgi", "Standart üyelik zaten aktif!");
      return;
    }

    setSelectedTier(tierId);
    setShowPaymentModal(true);
  };

  const handlePayment = () => {
    // TODO: Implement payment processing
    Alert.alert(
      "Ödeme Başarılı",
      `${SUBSCRIPTION_TIERS.find(t => t.id === selectedTier)?.name} aboneliği aktif edildi!`,
      [
        {
          text: "Tamam",
          onPress: () => {
            setShowPaymentModal(false);
            router.back();
          }
        }
      ]
    );
  };

  const getTierIcon = (tierId: string) => {
    switch (tierId) {
      case 'standard':
        return <Star color="#6B7280" size={24} />;
      case 'gold':
        return <Crown color="#FFD700" size={24} />;
      case 'vip':
        return <Zap color="#FF6B6B" size={24} />;
      default:
        return <Star color="#6B7280" size={24} />;
    }
  };

  const getTierGradient = (tierId: string) => {
    switch (tierId) {
      case 'standard':
        return ['#6B7280', '#4B5563'];
      case 'gold':
        return ['#FFD700', '#FFA500'];
      case 'vip':
        return ['#FF6B6B', '#FF4757'];
      default:
        return ['#6B7280', '#4B5563'];
    }
  };

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
          <Text style={styles.headerTitle}>Abonelik Planları</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Current Subscription */}
          {currentSubscription && currentSubscription.id !== 'standard' && (
            <View style={styles.currentSubscriptionCard}>
              <Text style={styles.currentSubscriptionTitle}>
                🎉 Aktif Abonelik: {currentSubscription.name}
              </Text>
              <Text style={styles.currentSubscriptionText}>
                {currentSubscription.benefits.dailyBonus} günlük bonus coin
              </Text>
            </View>
          )}

          {/* Billing Toggle */}
          <View style={styles.billingToggle}>
            <TouchableOpacity
              style={[styles.billingOption, !isYearly && styles.billingOptionActive]}
              onPress={() => setIsYearly(false)}
            >
              <Text style={[styles.billingText, !isYearly && styles.billingTextActive]}>
                Aylık
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.billingOption, isYearly && styles.billingOptionActive]}
              onPress={() => setIsYearly(true)}
            >
              <Text style={[styles.billingText, isYearly && styles.billingTextActive]}>
                Yıllık (20% İndirim)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Subscription Tiers */}
          {SUBSCRIPTION_TIERS.map((tier) => (
            <View key={tier.id} style={styles.tierCard}>
              <LinearGradient
                colors={getTierGradient(tier.id) as [string, string]}
                style={styles.tierGradient}
              >
                <View style={styles.tierHeader}>
                  <View style={styles.tierInfo}>
                    {getTierIcon(tier.id)}
                    <Text style={styles.tierName}>{tier.name}</Text>
                    {tier.popular && (
                      <View style={styles.popularBadge}>
                        <Text style={styles.popularText}>Popüler</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.tierPrice}>
                    <Text style={styles.priceText}>
                      {tier.price === 0 ? 'Ücretsiz' : `$${getSubscriptionPrice(tier, isYearly).toFixed(2)}`}
                    </Text>
                    {tier.price > 0 && (
                      <Text style={styles.pricePeriod}>
                        {isYearly ? '/yıl' : '/ay'}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.tierFeatures}>
                  {tier.features.map((feature, index) => (
                    <View key={index} style={styles.featureRow}>
                      <Check color="white" size={16} />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[
                    styles.subscribeButton,
                    currentSubscription?.id === tier.id && styles.currentSubscriptionButton
                  ]}
                  onPress={() => handleSubscribe(tier.id)}
                >
                  <Text style={styles.subscribeButtonText}>
                    {currentSubscription?.id === tier.id ? 'Aktif' : 'Seç'}
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          ))}

          {/* Benefits Comparison */}
          <View style={styles.comparisonCard}>
            <Text style={styles.comparisonTitle}>📊 Özellik Karşılaştırması</Text>
            <View style={styles.comparisonTable}>
              <View style={styles.comparisonHeader}>
                <Text style={styles.comparisonHeaderText}>Özellik</Text>
                <Text style={styles.comparisonHeaderText}>Standart</Text>
                <Text style={styles.comparisonHeaderText}>Gold</Text>
                <Text style={styles.comparisonHeaderText}>VIP</Text>
              </View>
              
              {[
                { name: 'Günlük Like', standard: '10', gold: '50', vip: 'Sınırsız' },
                { name: 'Reklam', standard: 'Var', gold: 'Yok', vip: 'Yok' },
                { name: 'Bonus Coin', standard: '0', gold: '50/gün', vip: '100/gün' },
                { name: 'VIP Rozet', standard: 'Yok', gold: 'Yok', vip: 'Var' },
                { name: 'Öncelikli Eşleşme', standard: 'Yok', gold: 'Yok', vip: 'Var' },
              ].map((row, index) => (
                <View key={index} style={styles.comparisonRow}>
                  <Text style={styles.comparisonRowText}>{row.name}</Text>
                  <Text style={styles.comparisonRowText}>{row.standard}</Text>
                  <Text style={styles.comparisonRowText}>{row.gold}</Text>
                  <Text style={styles.comparisonRowText}>{row.vip}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Payment Modal */}
        <Modal
          visible={showPaymentModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowPaymentModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Ödeme</Text>
              
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentTier}>
                  {SUBSCRIPTION_TIERS.find(t => t.id === selectedTier)?.name} Abonelik
                </Text>
                <Text style={styles.paymentPrice}>
                  ${getSubscriptionPrice(SUBSCRIPTION_TIERS.find(t => t.id === selectedTier)!, isYearly).toFixed(2)}
                  {isYearly ? '/yıl' : '/ay'}
                </Text>
              </View>

              <View style={styles.paymentButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowPaymentModal(false)}
                >
                  <Text style={styles.cancelButtonText}>İptal</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.payButton}
                  onPress={handlePayment}
                >
                  <Text style={styles.payButtonText}>Öde</Text>
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
  currentSubscriptionCard: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 1,
    borderColor: '#22C55E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  currentSubscriptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#22C55E',
    marginBottom: 4,
  },
  currentSubscriptionText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  billingToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  billingOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  billingOptionActive: {
    backgroundColor: Colors.primary,
  },
  billingText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
  billingTextActive: {
    color: 'white',
  },
  tierCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  tierGradient: {
    padding: 20,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tierInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tierName: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginLeft: 12,
  },
  popularBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  popularText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  tierPrice: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  pricePeriod: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  tierFeatures: {
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: 'white',
    marginLeft: 12,
    flex: 1,
  },
  subscribeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  currentSubscriptionButton: {
    backgroundColor: 'rgba(34, 197, 94, 0.3)',
  },
  subscribeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  comparisonCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginBottom: 16,
  },
  comparisonTable: {
    gap: 8,
  },
  comparisonHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  comparisonHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  comparisonRow: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  comparisonRowText: {
    flex: 1,
    fontSize: 12,
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
  paymentInfo: {
    marginBottom: 20,
  },
  paymentTier: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  paymentPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  paymentButtons: {
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
  payButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  payButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
