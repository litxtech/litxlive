import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';

export default function TermsPage() {
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Terms & Conditions',
          headerStyle: { backgroundColor: '#111315' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '600' },
        }}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>LITXTECH LTD Terms and Conditions</Text>
          <Text style={styles.lastUpdated}>Last Updated: 29 September 2025</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Agreement to Terms</Text>
            <Text style={styles.text}>
              By accessing or using the Lumi mobile application (the &quot;App&quot;) and any related services (the &quot;Services&quot;) provided by LITXTECH LTD (&quot;we,&quot; &quot;us,&quot; &quot;our&quot;), you agree to be bound by these Terms and Conditions (&quot;Terms&quot;). If you disagree with any part of the terms, then you do not have permission to access the Service.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Legal Entity</Text>
            <Text style={styles.text}>
              These Services are provided by LITXTECH LTD, a company registered in England and Wales.{'\n\n'}
              Company Registration Number: 16745093{'\n'}
              D-U-N-S® Number: 234203943{'\n'}
              Registered Address: 71-75 Shelton Street, Covent Garden, London, WC2H 9JQ, United Kingdom
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Eligibility & Age Requirements</Text>
            <Text style={styles.text}>
              • You must be at least 18 years of age to use our Services.{'\n'}
              • Users aged 13-17 may use the Services only with explicit parental or guardian consent.{'\n'}
              • We may request age verification (including selfie and identity verification) at any time.{'\n'}
              • Accounts found to be underage without proper consent will be terminated immediately.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. User Accounts</Text>
            <Text style={styles.text}>
              You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password. You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Intellectual Property</Text>
            <Text style={styles.text}>
              The Service and its original content (excluding Content provided by users), features, and functionality are and will remain the exclusive property of LITXTECH LTD and its licensors. The Service is protected by copyright, trademark, and other laws of both the United Kingdom and foreign countries. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of LITXTECH LTD.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. User-Generated Content</Text>
            
            <Text style={styles.subsectionTitle}>5.1. Responsibility</Text>
            <Text style={styles.text}>
              You are solely responsible for the content that you post on or through the Services (&quot;User Content&quot;). You represent and warrant that you own all right, title, and interest in and to such User Content or that you have all necessary rights to grant the licenses below.
            </Text>

            <Text style={styles.subsectionTitle}>5.2. License Grant</Text>
            <Text style={styles.text}>
              By posting User Content, you grant LITXTECH LTD a worldwide, perpetual, irrevocable, non-exclusive, royalty-free, sublicensable, and transferable license to use, reproduce, distribute, prepare derivative works of, display, and perform the User Content in connection with the Service and our business.
            </Text>

            <Text style={styles.subsectionTitle}>5.3. Prohibited Content</Text>
            <Text style={styles.text}>
              You agree not to post User Content that:{'\n'}
              • Is illegal, offensive, or promotes harm to others.{'\n'}
              • Is defamatory, obscene, pornographic, or invasive of another&apos;s privacy.{'\n'}
              • Infringes upon any third party&apos;s intellectual property rights.{'\n'}
              • Constitutes unsolicited or unauthorized advertising.{'\n'}
              • Contains software viruses or any other code designed to interrupt, destroy, or limit functionality.
            </Text>
            <Text style={styles.text}>
              We reserve the right to remove any User Content that, in our sole judgment, violates these Terms.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. In-App Purchases and Payment Processing</Text>
            <Text style={styles.text}>
              • All payments are processed by LITXTECH LTD (Company No: 16745093).{'\n'}
              • Purchases are made through Google Play Store or Apple App Store.{'\n'}
              • Payment for purchases will be charged to your app store account upon confirmation.{'\n'}
              • Coins and virtual items are non-refundable once used or consumed.{'\n'}
              • EU consumers have a 14-day right of withdrawal for unused digital content.{'\n'}
              • Subscriptions automatically renew unless cancelled 24 hours before renewal.{'\n'}
              • You can manage subscriptions in your app store account settings.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Acceptable Use</Text>
            <Text style={styles.text}>
              You agree not to:{'\n'}
              • Use the Service for any illegal purpose.{'\n'}
              • Violate any laws in your jurisdiction.{'\n'}
              • Send spam, bulk emails, or other unsolicited messages.{'\n'}
              • Attempt to interfere with, compromise the system integrity or security, or decipher any transmissions to or from the servers running the Service.{'\n'}
              • Take any action that imposes an unreasonable load on our infrastructure.{'\n'}
              • Use any robot, spider, crawler, scraper, or other automated means to access the Service.{'\n'}
              • Impersonate any person or entity.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>9. Termination</Text>
            <Text style={styles.text}>
              We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including a breach of the Terms.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>10. Disclaimer and Limitation of Liability</Text>
            
            <Text style={styles.subsectionTitle}>9.1. Disclaimer</Text>
            <Text style={styles.text}>
              YOUR USE OF THE SERVICE IS AT YOUR SOLE RISK. THE SERVICE IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS. LITXTECH LTD EXPRESSLY DISCLAIMS ALL WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </Text>

            <Text style={styles.subsectionTitle}>9.2. Limitation of Liability</Text>
            <Text style={styles.text}>
              TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, LITXTECH LTD, ITS DIRECTORS, EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS, OR AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICE.
            </Text>

            <Text style={styles.subsectionTitle}>9.3. Consumer Rights (UK)</Text>
            <Text style={styles.text}>
              Nothing in these Terms shall affect your statutory rights as a consumer under UK law. Our liability for death or personal injury resulting from our negligence, or for fraudulent misrepresentation, shall not be limited or excluded.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>11. Governing Law and Dispute Resolution</Text>
            <Text style={styles.text}>
              These Terms shall be governed and construed in accordance with the laws of England and Wales. Any dispute arising from these Terms or your use of the Services shall be subject to the exclusive jurisdiction of the courts of England and Wales. We retain the right to bring proceedings against you for breach of these Terms in your country of residence or any other relevant country.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>12. Changes to Terms</Text>
            <Text style={styles.text}>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>13. Security Incident Response Protocol</Text>
            <Text style={styles.text}>
              LITXTECH LTD takes user safety and security seriously. We have established comprehensive protocols for handling security incidents, including blackmail, illegal recording, harassment, and other serious violations.
            </Text>

            <Text style={styles.subsectionTitle}>13.1. Immediate Response Procedure</Text>
            <Text style={styles.text}>
              If you experience or witness any of the following, report immediately:{'\n'}
              • Blackmail or extortion attempts{'\n'}
              • Unauthorized recording of conversations{'\n'}
              • Threats or harassment{'\n'}
              • Sharing of illegal content{'\n'}
              • Identity theft or impersonation{'\n\n'}
              Our legal team will respond within 1 hour for critical incidents and within 24 hours for other legal matters.
            </Text>

            <Text style={styles.subsectionTitle}>13.2. User Protection Measures</Text>
            <Text style={styles.text}>
              • All video calls are monitored for suspicious activity{'\n'}
              • Screen recording detection alerts{'\n'}
              • One-tap emergency report button{'\n'}
              • Anonymous reporting system{'\n'}
              • Automated evidence preservation{'\n'}
              • 24/7 emergency support line
            </Text>

            <Text style={styles.subsectionTitle}>13.3. Data Preservation for Legal Proceedings</Text>
            <Text style={styles.text}>
              We retain user data for a minimum of 90 days to support legal investigations:{'\n'}
              • Chat logs and call metadata{'\n'}
              • IP addresses and device information{'\n'}
              • User verification documents{'\n'}
              • Report and moderation history{'\n\n'}
              This data may be provided to law enforcement upon official court order or subpoena.
            </Text>

            <Text style={styles.subsectionTitle}>13.4. Law Enforcement Cooperation</Text>
            <Text style={styles.text}>
              LITXTECH LTD cooperates fully with law enforcement agencies:{'\n'}
              • We require official court orders or subpoenas{'\n'}
              • Our legal team reviews all requests{'\n'}
              • Data is provided through secure channels{'\n'}
              • We maintain chain of custody documentation{'\n'}
              • We may initiate legal action against perpetrators
            </Text>

            <Text style={styles.subsectionTitle}>13.5. Zero Tolerance Policy</Text>
            <Text style={styles.text}>
              The following activities result in immediate account termination and potential legal action:{'\n'}
              • Blackmail or extortion{'\n'}
              • Unauthorized recording{'\n'}
              • Sharing illegal content{'\n'}
              • Harassment or threats{'\n'}
              • Identity theft{'\n\n'}
              We pursue civil and criminal liability claims against violators.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>14. Emergency Contact Information</Text>
            <Text style={styles.text}>
              LITXTECH LTD{'\n'}
              71-75 Shelton Street, Covent Garden, London, WC2H 9JQ, UNITED KINGDOM{'\n\n'}
              🚨 EMERGENCY CONTACTS:{'\n'}
              📱 Emergency WhatsApp: +1 307 271 5151 (24/7){'\n'}
              📧 Legal Matters: legal@litxtechuk.com{'\n'}
              📧 General Support: support@litxtechuk.com{'\n'}
              📧 Developer: developer@litxtechuk.com{'\n'}
              📞 Phone: +447441425582{'\n\n'}
              RESPONSE TIMES:{'\n'}
              • Critical incidents (blackmail, threats): 1 hour{'\n'}
              • Legal matters: 24 hours{'\n'}
              • General support: 48 hours{'\n\n'}
              Company No: 16745093{'\n'}
              D-U-N-S®: 234203943
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>15. User Responsibilities in Security Incidents</Text>
            <Text style={styles.text}>
              If you experience a security incident:{'\n'}
              • Report immediately using emergency contacts{'\n'}
              • Preserve all evidence (screenshots, messages){'\n'}
              • Do not delete conversations or content{'\n'}
              • Contact local law enforcement if threatened{'\n'}
              • Cooperate with our investigation{'\n'}
              • Do not engage further with the perpetrator{'\n\n'}
              We will provide full support and cooperation throughout the process.
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