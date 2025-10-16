import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';

export default function PrivacyPage() {
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Privacy Policy',
          headerStyle: { backgroundColor: '#111315' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '600' },
        }}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>LITXTECH LTD Privacy Policy</Text>
          <Text style={styles.lastUpdated}>Last Updated: 29 September 2025</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Introduction</Text>
            <Text style={styles.text}>
              LITXTECH LTD (&quot;we,&quot; &quot;our,&quot; &quot;us&quot;) is committed to protecting and respecting your privacy. This Privacy Policy (&quot;Policy&quot;) explains how we collect, use, disclose, and safeguard your information when you use our mobile application Lumi (the &quot;App&quot;) and any related services (collectively, the &quot;Services&quot;).
            </Text>
            <Text style={styles.text}>
              Please read this Policy carefully. By accessing or using our Services, you signify that you have read, understood, and agree to our collection, storage, use, and disclosure of your personal information as described in this Policy and our Terms and Conditions.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Information We Collect</Text>
            
            <Text style={styles.subsectionTitle}>2.1. Personal Data You Provide Voluntarily:</Text>
            <Text style={styles.text}>
              • Account Information: When you register an account, we may collect your name, email address, phone number, and a password.{'\n'}
              • Profile Information: Information you add to your profile, such as a profile picture, biography, or other details.{'\n'}
              • User Content: Content you generate, post, upload, or share through the Services, including photos, videos, comments, and messages.{'\n'}
              • Communication Data: If you contact us (e.g., via support email), we collect records of that correspondence.{'\n'}
              • Payment Information: For in-app purchases or subscriptions, payment is processed by third-party payment processors (e.g., Apple App Store, Google Play Store, Stripe). We do not store your full credit card details on our servers. We receive transaction identifiers and summary information.
            </Text>

            <Text style={styles.subsectionTitle}>2.2. Information Collected Automatically:</Text>
            <Text style={styles.text}>
              • Device Information: We collect information about the device you use to access our Services, including the hardware model, operating system and version, unique device identifiers (e.g., IMEI, MAC address), mobile network information, and the device&apos;s telephone number.{'\n'}
              • Log Data: Our servers automatically record information (&quot;log data&quot;) created by your use of the Services. This includes your IP address, browser type and settings, the date and time of your request, how you used the Services, and cookie data.{'\n'}
              • Usage Information: We collect information about your interaction with the Services, such as the features you use, the time and duration of your activities, and the pages or content you view.{'\n'}
              • Location Information: With your explicit permission, we may collect and process information about your precise (GPS) or approximate location. You can enable or disable location services through your device settings.
            </Text>

            <Text style={styles.subsectionTitle}>2.3. Information from Third Parties:</Text>
            <Text style={styles.text}>
              We may receive information about you from third parties, such as social media platforms if you connect your account, or advertising partners.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
            <Text style={styles.text}>
              We use the information we collect in the following ways:{'\n'}
              • To provide and maintain our Services, including to monitor the usage of our Service.{'\n'}
              • To manage your account as a registered user.{'\n'}
              • To perform a contract (e.g., providing paid services or subscriptions).{'\n'}
              • To contact you via email, telephone, SMS, or other electronic communication regarding updates or important notices.{'\n'}
              • To provide you with news, offers, and information about related products and services, unless you opt out.{'\n'}
              • To attend and manage your requests to us.{'\n'}
              • To evaluate or conduct mergers, sales, restructuring, or business transfers.{'\n'}
              • To analyse trends, measure effectiveness of promotions, and improve our Services.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Legal Basis for Processing (UK GDPR)</Text>
            <Text style={styles.text}>
              • Performance of a Contract{'\n'}
              • Consent (where given, e.g., marketing, location tracking){'\n'}
              • Legitimate Interests (e.g., service improvement, fraud prevention){'\n'}
              • Legal Obligation (where required by law)
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. How We Share Your Information</Text>
            <Text style={styles.text}>
              We may share your information:{'\n'}
              • With service providers (cloud, hosting, payment, analytics).{'\n'}
              • During business transfers (mergers, acquisitions).{'\n'}
              • With affiliates and business partners.{'\n'}
              • With other users (where you share in public areas).{'\n'}
              • With your consent.{'\n'}
              • Where required by law.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. International Data Transfers</Text>
            <Text style={styles.text}>
              Your data may be transferred outside the UK/EEA. Such transfers comply with UK GDPR using safeguards like the International Data Transfer Agreement (IDTA) or adequacy decisions.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Data Security</Text>
            <Text style={styles.text}>
              We apply administrative, technical, and physical safeguards to protect your data. However, no method is 100% secure.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Your Data Protection Rights (UK GDPR)</Text>
            <Text style={styles.text}>
              You have the right to:{'\n'}
              • Access your data.{'\n'}
              • Rectify inaccurate data.{'\n'}
              • Request erasure.{'\n'}
              • Restrict processing.{'\n'}
              • Object to processing.{'\n'}
              • Request data portability.{'\n'}
              • Withdraw consent.
            </Text>
            <Text style={styles.text}>
              To exercise your rights, contact us at support@litxtech.com.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>9. Data Retention and Preservation</Text>
            <Text style={styles.text}>
              We retain personal data only as long as necessary for our purposes, legal obligations, dispute resolution, and policy enforcement.
            </Text>

            <Text style={styles.subsectionTitle}>9.1. Standard Data Retention</Text>
            <Text style={styles.text}>
              • Account information: Retained while account is active + 30 days after deletion{'\n'}
              • Chat logs and messages: 90 days minimum{'\n'}
              • Call metadata: 90 days minimum{'\n'}
              • Transaction records: 7 years (legal requirement){'\n'}
              • User verification documents: Duration of account + 1 year
            </Text>

            <Text style={styles.subsectionTitle}>9.2. Extended Retention for Legal Proceedings</Text>
            <Text style={styles.text}>
              In cases of security incidents, legal investigations, or law enforcement requests, we retain data for extended periods:{'\n'}
              • All communication logs and metadata{'\n'}
              • IP addresses and device information{'\n'}
              • User verification documents{'\n'}
              • Report and moderation history{'\n'}
              • Evidence of violations{'\n\n'}
              This data is preserved to support legal proceedings, protect user safety, and cooperate with law enforcement.
            </Text>

            <Text style={styles.subsectionTitle}>9.3. Data Preservation Requests</Text>
            <Text style={styles.text}>
              Upon receiving a valid legal request (court order, subpoena, or official law enforcement request), we will:{'\n'}
              • Preserve all relevant data immediately{'\n'}
              • Maintain chain of custody documentation{'\n'}
              • Provide data through secure channels{'\n'}
              • Comply with all legal requirements{'\n'}
              • Notify affected users where legally permitted
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>10. Children&apos;s Privacy</Text>
            <Text style={styles.text}>
              We do not knowingly collect data from children under 13. If such data is found, it will be deleted.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>11. Changes to This Privacy Policy</Text>
            <Text style={styles.text}>
              We may update this Policy. Updates will be posted here with a new &quot;Last Updated&quot; date.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>12. Law Enforcement Cooperation</Text>
            <Text style={styles.text}>
              LITXTECH LTD cooperates fully with law enforcement agencies to protect user safety and comply with legal obligations.
            </Text>

            <Text style={styles.subsectionTitle}>12.1. Legal Requests</Text>
            <Text style={styles.text}>
              We respond to valid legal requests from law enforcement agencies:{'\n'}
              • Court orders and subpoenas{'\n'}
              • Search warrants{'\n'}
              • Emergency disclosure requests (imminent danger){'\n'}
              • International legal assistance requests{'\n\n'}
              All requests are reviewed by our legal team to ensure validity and compliance with applicable laws.
            </Text>

            <Text style={styles.subsectionTitle}>12.2. Information Provided</Text>
            <Text style={styles.text}>
              Depending on the nature of the request, we may provide:{'\n'}
              • User account information and registration data{'\n'}
              • Communication logs and metadata{'\n'}
              • IP addresses and device information{'\n'}
              • Transaction and payment records{'\n'}
              • User-generated content and media{'\n'}
              • Verification documents and identity information
            </Text>

            <Text style={styles.subsectionTitle}>12.3. Emergency Situations</Text>
            <Text style={styles.text}>
              In cases involving imminent danger to life or serious bodily harm, we may disclose information to law enforcement without a court order. This includes:{'\n'}
              • Credible threats of violence{'\n'}
              • Child safety concerns{'\n'}
              • Suicide prevention{'\n'}
              • Missing persons cases{'\n'}
              • Terrorist activities
            </Text>

            <Text style={styles.subsectionTitle}>12.4. User Notification</Text>
            <Text style={styles.text}>
              We will notify affected users of legal requests for their data unless:{'\n'}
              • Prohibited by law or court order{'\n'}
              • Notice would endanger an investigation{'\n'}
              • Emergency circumstances exist{'\n'}
              • The request involves child safety
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>13. Security Incident Reporting</Text>
            <Text style={styles.text}>
              If you experience or witness a security incident, including blackmail, illegal recording, harassment, or threats, please report immediately.
            </Text>

            <Text style={styles.subsectionTitle}>13.1. Emergency Contacts</Text>
            <Text style={styles.text}>
              🚨 Emergency WhatsApp: +1 307 271 5151 (24/7){'\n'}
              📧 Legal Matters: legal@litxtechuk.com{'\n'}
              📧 General Support: support@litxtechuk.com{'\n\n'}
              Response Times:{'\n'}
              • Critical incidents: 1 hour{'\n'}
              • Legal matters: 24 hours{'\n'}
              • General support: 48 hours
            </Text>

            <Text style={styles.subsectionTitle}>13.2. What to Report</Text>
            <Text style={styles.text}>
              • Blackmail or extortion attempts{'\n'}
              • Unauthorized recording of conversations{'\n'}
              • Threats or harassment{'\n'}
              • Sharing of illegal content{'\n'}
              • Identity theft or impersonation{'\n'}
              • Child safety concerns{'\n'}
              • Any activity that violates laws
            </Text>

            <Text style={styles.subsectionTitle}>13.3. Evidence Preservation</Text>
            <Text style={styles.text}>
              If reporting an incident:{'\n'}
              • Take screenshots of all relevant content{'\n'}
              • Do not delete messages or conversations{'\n'}
              • Note dates, times, and usernames{'\n'}
              • Preserve any external communications{'\n'}
              • Contact local law enforcement if threatened{'\n\n'}
              We will preserve all platform data related to your report for legal proceedings.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>14. Contact Us</Text>
            <Text style={styles.text}>
              LITXTECH LTD{'\n'}
              71-75 Shelton Street, Covent Garden, London, WC2H 9JQ, UNITED KINGDOM{'\n\n'}
              📧 General Support: support@litxtechuk.com{'\n'}
              📧 Legal Matters: legal@litxtechuk.com{'\n'}
              📧 Developer: developer@litxtechuk.com{'\n'}
              📞 Phone: +447441425582{'\n'}
              🚨 Emergency WhatsApp: +1 307 271 5151{'\n\n'}
              Company No: 16745093{'\n'}
              D-U-N-S®: 234203943
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