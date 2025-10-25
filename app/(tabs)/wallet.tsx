import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
 Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Coins, Plus, X, Crown } from "lucide-react-native";
import { useUser } from "@/providers/UserProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import Footer from "@/components/Footer";
import { IAP_PACKAGES, formatPrice, COMPANY_INFO } from "@/constants/iapPackages";
import { trpc } from "@/lib/trpc";
import TransactionHistory from "@/components/TransactionHistory";
import { Colors } from "@/constants/colors";

// Platform-specific Stripe imports
import StripePayment from "@/components/StripePayment";
import PaymentModal from "@/components/PaymentModal";



export default function WalletScreen() {
  const { user } = useUser();
  const { t } = useLanguage();
  const [selectedTab, setSelectedTab] = useState<'buy' | 'transactions'>('buy');

  const [isPurchasing, setIsPurchasing] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState<'coins' | 'subscription'>('coins');
  const [showStripeModal, setShowStripeModal] = useState<boolean>(false);
  const [selectedPackage, setSelectedPackage] = useState<typeof IAP_PACKAGES[0] | null>(null);

  const balanceQuery = trpc.purchases.balance.useQuery(undefined, {
    enabled: !!user,
  });

  const transactionsQuery = trpc.purchases.list.useQuery(
    { limit: 20, offset: 0 },
    { enabled: !!user && selectedTab === 'transactions' }
  );

  const createPurchaseMutation = trpc.purchases.create.useMutation();

  const handlePurchase = async (pkg: typeof IAP_PACKAGES[0]) => {
    if (isPurchasing) return;

    const totalCoins = pkg.coins;
    const priceFormatted = formatPrice(pkg.price, 'USD');

    Alert.alert(
      "Select Payment Method",
      `${pkg.name}\n\n${totalCoins.toLocaleString()} Coins\nPrice: ${priceFormatted}`,
      [
        { text: t('cancel'), style: "cancel" },
        {
          text: "Pay with Stripe",
          onPress: () => {
            setSelectedPackage(pkg);
            setShowStripeModal(true);
          },
        },
        {
          text: "Other Payment",
          onPress: async () => {
            try {
              setIsPurchasing(true);

              const result = await createPurchaseMutation.mutateAsync({
                packageId: pkg.id,
                currency: 'USD',
                paymentMethod: 'google_play',
              });

              if (result.success) {
                await balanceQuery.refetch();
                Alert.alert(
                  "Purchase Initiated!",
                  `Order ID: ${result.orderId}\n\nYou will receive ${totalCoins.toLocaleString()} coins after payment confirmation.`
                );
              }
            } catch (error) {
              console.error('[Wallet] Purchase error:', error);
              Alert.alert('Error', 'Failed to initiate purchase. Please try again.');
            } finally {
              setIsPurchasing(false);
            }
          },
        },
      ]
    );
  };

  const handleStripeSuccess = () => {
    setShowStripeModal(false);
    setSelectedPackage(null);
    balanceQuery.refetch();
  };

  const handleStripeCancel = () => {
    setShowStripeModal(false);
    setSelectedPackage(null);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('wallet')}</Text>
        </View>

        <View style={styles.balanceSection}>
          <View style={styles.balanceCard}>
            <LinearGradient
              colors={Colors.gradients.primary}
              style={styles.balanceGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.balanceContent}>
                <View style={styles.balanceHeader}>
                  <Coins color="white" size={28} />
                  <Text style={styles.balanceLabel}>Your Balance</Text>
                </View>
                <Text style={styles.balanceAmount}>{balanceQuery.data?.coins || user?.coins || 0}</Text>
                <Text style={styles.balanceSubtext}>≈ ${(((balanceQuery.data?.coins || user?.coins || 0) * 0.00833)).toFixed(2)}</Text>
              </View>
            </LinearGradient>
          </View>
        </View>



        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'buy' && styles.tabActive]}
            onPress={() => setSelectedTab('buy')}
          >
            <Text style={[styles.tabText, selectedTab === 'buy' && styles.tabTextActive]}>
              Buy Coins
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'transactions' && styles.tabActive]}
            onPress={() => setSelectedTab('transactions')}
          >
            <Text style={[styles.tabText, selectedTab === 'transactions' && styles.tabTextActive]}>
              Transactions
            </Text>
          </TouchableOpacity>

        </View>


        {selectedTab === 'buy' && (
          <View style={styles.section}>
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>{COMPANY_INFO.name}</Text>
              <Text style={styles.companyDetails}>{COMPANY_INFO.address}</Text>
              <Text style={styles.companyDetails}>Support: {COMPANY_INFO.email.support}</Text>
            </View>



            <View style={styles.packagesGrid}>
              {IAP_PACKAGES.map((pkg, index) => (
                <TouchableOpacity
                  key={pkg.id}
                  style={[
                    styles.packageCard,
                    pkg.popular && styles.popularPackage,
                  ]}
                  onPress={() => handlePurchase(pkg)}
                  activeOpacity={0.7}
                >
                  {pkg.popular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularText}>MOST POPULAR</Text>
                    </View>
                  )}
                  
                  {pkg.badge && (
                    <View style={styles.packageBadge}>
                      <Text style={styles.packageBadgeText}>{pkg.badge}</Text>
                    </View>
                  )}

                  <View style={styles.packageHeader}>
                    <View style={styles.packageIconRow}>
                      <Coins color={pkg.popular ? Colors.primary : Colors.textSecondary} size={24} />
                      <Text style={[
                        styles.packageCoins,
                        pkg.popular && styles.packageCoinsPopular
                      ]}>
                        {pkg.coins.toLocaleString()}
                      </Text>
                    </View>
                    <Text style={styles.packageName}>{pkg.name}</Text>
                  </View>

                  <View style={styles.packageFooter}>
                    <Text style={[
                      styles.packagePrice,
                      pkg.popular && styles.packagePricePopular
                    ]}>
                      {formatPrice(pkg.price, 'USD')}
                    </Text>
                    <View style={[
                      styles.buyButton,
                      pkg.popular && styles.buyButtonPopular,
                      isPurchasing && styles.buyButtonDisabled
                    ]}>
                      <Plus 
                        color={pkg.popular ? "#FFFFFF" : (isPurchasing ? Colors.textMuted : Colors.primary)} 
                        size={18} 
                        strokeWidth={2.5} 
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {selectedTab === 'transactions' && (
          <View style={styles.section}>
            <TransactionHistory
              transactions={(transactionsQuery.data?.transactions || []).map((tx: any) => ({
                id: tx.id,
                userId: user?.id || '',
                type: tx.type,
                amount: parseFloat(tx.amount) || 0,
                currency: tx.currency,
                coins: tx.coins,
                packageId: tx.package_id,
                productId: tx.product_id,
                status: tx.status,
                paymentMethod: tx.payment_method,
                createdAt: tx.created_at,
                updatedAt: tx.created_at,
                completedAt: tx.completed_at,
              }))}
              isLoading={transactionsQuery.isLoading}
            />
          </View>
        )}


        
        <Footer />
      </ScrollView>

      <PaymentModal
        visible={showPaymentModal}
        type={paymentType}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={(result) => {
          console.log('Payment success:', result);
          setShowPaymentModal(false);
          // Refresh balance
          balanceQuery.refetch();
        }}
      />

      <Modal
        visible={showStripeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleStripeCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Stripe Payment</Text>
              <TouchableOpacity onPress={handleStripeCancel} style={styles.closeButton}>
                <X color={Colors.text} size={24} />
              </TouchableOpacity>
            </View>
            {selectedPackage && Platform.OS !== 'web' && (
              <StripePayment
                packageId={selectedPackage.id}
                packageName={selectedPackage.name}
                price={selectedPackage.price}
                coins={selectedPackage.coins}
                currency="USD"
                onSuccess={handleStripeSuccess}
                onCancel={handleStripeCancel}
              />
            )}
            {selectedPackage && Platform.OS === 'web' && (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ fontSize: 16, color: Colors.text, textAlign: 'center' }}>
                  Stripe payments are only available on mobile devices. Please use the mobile app to complete your purchase.
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundColor,
    paddingBottom: 80,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
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
  balanceSection: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  balanceCard: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  balanceGradient: {
    padding: 24,
  },
  balanceContent: {
    alignItems: "center",
  },
  balanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 14,
    color: "white",
    opacity: 0.9,
    fontWeight: "600" as const,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: "700" as const,
    color: "white",
    letterSpacing: -2,
  },
  balanceSubtext: {
    fontSize: 13,
    color: "white",
    opacity: 0.8,
    marginTop: 6,
  },
  statsSection: {
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "500" as const,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 8,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  packagesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  packageCard: {
    width: "48%",
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    position: "relative",
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 2,
  },
  popularPackage: {
    borderColor: Colors.primary,
    borderWidth: 2.5,
    backgroundColor: "#F8F4FF",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 6,
  },
  popularBadge: {
    position: "absolute",
    top: -10,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  popularText: {
    fontSize: 9,
    fontWeight: "800" as const,
    color: Colors.primary,
    letterSpacing: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  packageHeader: {
    alignItems: "center",
    marginBottom: 14,
    gap: 8,
  },
  packageIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  packageCoins: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  packageCoinsPopular: {
    color: Colors.primary,
    fontSize: 24,
  },
  packageName: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  packageMinutes: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "600" as const,
  },
  pricingNotice: {
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pricingNoticeText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  pricingNoticeSubtext: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  packageFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  packagePrice: {
    fontSize: 17,
    fontWeight: "800" as const,
    color: Colors.primary,
    letterSpacing: -0.3,
  },
  packagePricePopular: {
    fontSize: 18,
    color: Colors.primary,
  },
  buyButton: {
    backgroundColor: Colors.borderLight,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buyButtonPopular: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  buyButtonDisabled: {
    opacity: 0.4,
  },
  packageBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 5,
  },
  packageBadgeText: {
    fontSize: 24,
  },
  companyInfo: {
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  companyName: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  companyDetails: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.backgroundColor,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  closeButton: {
    padding: 4,
  },
  // Stripe Payment Styles
  stripeSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  stripeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  stripeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  stripeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
});