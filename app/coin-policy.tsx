import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';

export default function CoinPolicyPage() {
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Coin Policy',
          headerStyle: { backgroundColor: '#111315' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '600' },
        }}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>Lumi Coin Policy</Text>
          <Text style={styles.lastUpdated}>Last Updated: 29 September 2025</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. What are Coins?</Text>
            <Text style={styles.text}>
              Coins are virtual digital credits used within the Lumi application. They serve as the primary currency for various in-app activities including video calls, sending gifts, and accessing premium features. Coins have no real-world monetary value and cannot be exchanged for cash or other currencies.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. How to Obtain Coins</Text>
            <Text style={styles.text}>
              Coins can be obtained through:{'\n'}
              • In-app purchases using real money via Apple App Store, Google Play Store, or other authorized payment methods{'\n'}
              • Promotional offers and bonuses{'\n'}
              • Daily login rewards{'\n'}
              • Completing in-app tasks and challenges{'\n'}
              • Receiving gifts from other users (for creators)
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Coin Usage</Text>
            
            <Text style={styles.subsectionTitle}>3.1. Video Calls</Text>
            <Text style={styles.text}>
              • 1:1 video calls cost 8 coins per minute{'\n'}
              • Minimum balance of 16 coins (2 minutes) required to start a call{'\n'}
              • Calls automatically end when coin balance is insufficient{'\n'}
              • No partial refunds for unused time
            </Text>

            <Text style={styles.subsectionTitle}>3.2. Virtual Gifts</Text>
            <Text style={styles.text}>
              Coins can be used to purchase virtual gifts ranging from 10 to 1000 coins:{'\n'}
              • Balloon (10 coins) - Small greeting gesture{'\n'}
              • Rose (25 coins) - Romantic classic{'\n'}
              • Diamond (50 coins) - Valuable gift{'\n'}
              • Crown (200 coins) - VIP show gesture{'\n'}
              • Castle (1000 coins) - Ultimate premium gift
            </Text>

            <Text style={styles.subsectionTitle}>3.3. Premium Features</Text>
            <Text style={styles.text}>
              • Priority matching in video calls{'\n'}
              • Special effects and filters{'\n'}
              • Enhanced profile visibility{'\n'}
              • Access to exclusive content
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Coin Packages and Pricing</Text>
            <Text style={styles.text}>
              Coin packages are available at various price points:{'\n'}
              • Starter Pack: 100 coins{'\n'}
              • Popular Pack: 500 coins{'\n'}
              • Value Pack: 1,000 coins{'\n'}
              • Premium Pack: 2,500 coins{'\n'}
              • Ultimate Pack: 5,000 coins{'\n'}
              • Mega Pack: 10,000 coins
            </Text>
            <Text style={styles.text}>
              Prices may vary by region and are subject to local taxes and fees. First-time purchasers may receive bonus coins as promotional offers.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Payment and Billing</Text>
            <Text style={styles.text}>
              • All payments are processed by LITXTECH LTD (Company No: 16745093){'\n'}
              • Purchases are made through Google Play Store or Apple App Store{'\n'}
              • Payments are charged immediately upon purchase confirmation{'\n'}
              • Coins are delivered to your account within minutes of successful payment{'\n'}
              • Payment methods include credit cards, debit cards, and mobile payments{'\n'}
              • All transactions are recorded and can be viewed in your purchase history{'\n'}
              • Prices may vary by region and include applicable taxes
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Refund Policy</Text>
            <Text style={styles.text}>
              • Coins are non-refundable once used or consumed for services.{'\n'}
              • EU consumers have a 14-day right of withdrawal for unused digital content.{'\n'}
              • Refunds may be considered for:{'\n'}
                - Technical errors resulting in failed coin delivery{'\n'}
                - Unauthorized purchases (subject to investigation){'\n'}
                - Duplicate charges due to system errors{'\n'}
              • Refund requests must be submitted within 48 hours of purchase.{'\n'}
              • For App Store and Google Play purchases, refund policies of those platforms apply.{'\n'}
              • Contact support@litxtechuk.com with your transaction ID for refund requests.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Coin Expiration and Account Closure</Text>
            <Text style={styles.text}>
              • Coins do not expire under normal account usage{'\n'}
              • Inactive accounts (no login for 12+ months) may have coins removed{'\n'}
              • Account closure results in forfeiture of all remaining coins{'\n'}
              • Suspended or banned accounts forfeit all coins{'\n'}
              • No compensation is provided for coins lost due to policy violations
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Creator Revenue Sharing</Text>
            <Text style={styles.text}>
              For content creators receiving gifts:{'\n'}
              • Creators receive a percentage of coin value from gifts{'\n'}
              • Revenue sharing rates may vary by creator level and agreement{'\n'}
              • Minimum withdrawal thresholds apply{'\n'}
              • KYC verification required for payouts{'\n'}
              • Payout processing may take 5-10 business days
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>9. Prohibited Activities</Text>
            <Text style={styles.text}>
              The following activities are strictly prohibited:{'\n'}
              • Attempting to hack, exploit, or manipulate the coin system{'\n'}
              • Selling, trading, or transferring coins outside the app{'\n'}
              • Using unauthorized third-party services to obtain coins{'\n'}
              • Creating multiple accounts to abuse promotional offers{'\n'}
              • Chargebacks or payment disputes for legitimately delivered coins
            </Text>
            <Text style={styles.text}>
              Violation of these policies may result in account suspension, coin forfeiture, and legal action.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>10. Changes to Coin Policy</Text>
            <Text style={styles.text}>
              We reserve the right to modify this Coin Policy at any time. Changes will be communicated through:{'\n'}
              • In-app notifications{'\n'}
              • Email notifications to registered users{'\n'}
              • Updates to this policy page{'\n'}
              • App store update notes
            </Text>
            <Text style={styles.text}>
              Continued use of the app after policy changes constitutes acceptance of the new terms.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>11. Consumer Rights</Text>
            <Text style={styles.text}>
              This policy does not affect your statutory rights as a consumer under applicable law. In jurisdictions where digital content refunds are required by law, those provisions supersede this policy.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>12. Contact Information</Text>
            <Text style={styles.text}>
              For questions about coins, purchases, or this policy:{'\n\n'}
              LITXTECH LTD{'\n'}
              71-75 Shelton Street, Covent Garden{'\n'}
              London, WC2H 9JQ, United Kingdom{'\n\n'}
              📧 Support: support@litxtechuk.com{'\n'}
              📧 Developer: developer@litxtechuk.com{'\n'}
              📞 Phone: +447441425582{'\n\n'}
              Company No: 16745093{'\n'}
              D-U-N-S®: 234203943{'\n\n'}
              For purchase disputes, please include your transaction ID and detailed description of the issue.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111315',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  lastUpdated: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#F04F8F',
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: 'white',
    marginBottom: 8,
    marginTop: 16,
  },
  text: {
    fontSize: 14,
    color: '#B7C0CE',
    lineHeight: 20,
    marginBottom: 8,
  },
});