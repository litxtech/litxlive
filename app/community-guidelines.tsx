import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Shield, AlertTriangle, Heart, Users, Ban, Flag } from 'lucide-react-native';

export default function CommunityGuidelinesPage() {
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Community Guidelines',
          headerStyle: { backgroundColor: '#111315' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '600' },
        }}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Shield color="#F04F8F" size={32} />
            </View>
            <Text style={styles.title}>Lumi Community Guidelines</Text>
            <Text style={styles.subtitle}>
              Our community guidelines help create a safe, respectful, and enjoyable environment for everyone.
            </Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Heart color="#F04F8F" size={24} />
              <Text style={styles.sectionTitle}>Be Respectful</Text>
            </View>
            <Text style={styles.text}>
              • Treat all users with kindness and respect{' \n'}
              • No harassment, bullying, or hate speech{' \n'}
              • Respect different opinions, cultures, and backgrounds{' \n'}
              • Use appropriate language in all interactions
            </Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Users color="#6366F1" size={24} />
              <Text style={styles.sectionTitle}>Appropriate Content</Text>
            </View>
            <Text style={styles.text}>
              • No nudity or sexually explicit content{' \n'}
              • No violent or graphic content{' \n'}
              • No promotion of illegal activities{' \n'}
              • Keep content appropriate for all ages (13+){' \n'}
              • No spam or misleading information
            </Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AlertTriangle color="#EAB308" size={24} />
              <Text style={styles.sectionTitle}>Safety First</Text>
            </View>
            <Text style={styles.text}>
              • Never share personal information (address, phone, financial details){' \n'}
              • Report suspicious behavior immediately{' \n'}
              • Don&apos;t meet strangers in person without proper precautions{' \n'}
              • Block users who make you uncomfortable{' \n'}
              • Be cautious with external links and requests
            </Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ban color="#EF4444" size={24} />
              <Text style={styles.sectionTitle}>Prohibited Activities</Text>
            </View>
            <Text style={styles.text}>
              • Impersonation of others{' \n'}
              • Creating fake accounts or bots{' \n'}
              • Selling or trading accounts{' \n'}
              • Attempting to hack or exploit the platform{' \n'}
              • Circumventing bans or restrictions{' \n'}
              • Commercial solicitation without permission
            </Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Flag color="#10B981" size={24} />
              <Text style={styles.sectionTitle}>Reporting & Enforcement</Text>
            </View>
            <Text style={styles.text}>
              If you encounter content or behavior that violates these guidelines:{' \n\n'}
              • Use the report button on posts, comments, or profiles{' \n'}
              • Provide detailed information about the violation{' \n'}
              • Our moderation team reviews reports within 24 hours{' \n'}
              • False reports may result in account restrictions
            </Text>

            <Text style={styles.sectionTitle}>Emergency Reporting</Text>
            <Text style={styles.text}>
              For critical incidents requiring immediate attention:{' \n\n'}
              🚨 Emergency WhatsApp: +1 307 271 5151 (24/7){' \n'}
              📧 Legal Matters: legal@litxtechuk.com{' \n'}
              📧 General Support: support@litxtechuk.com{' \n\n'}
              Response Times:{' \n'}
              • Critical incidents (blackmail, threats): 1 hour{' \n'}
              • Legal matters: 24 hours{' \n'}
              • General support: 48 hours
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Consequences</Text>
            <Text style={styles.text}>
              Violations of these guidelines may result in:{' \n\n'}
              • Warning notification{' \n'}
              • Temporary content removal{' \n'}
              • Temporary account suspension{' \n'}
              • Permanent account ban{' \n'}
              • Legal action in severe cases
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Zero Tolerance Policy</Text>
            <Text style={styles.text}>
              LITXTECH LTD maintains a zero tolerance policy for the following activities. These violations result in immediate account termination and potential legal action:{' \n\n'}
              • Blackmail or extortion attempts{' \n'}
              • Unauthorized recording of video calls or conversations{' \n'}
              • Sharing or distribution of illegal content{' \n'}
              • Threats of violence or harm{' \n'}
              • Identity theft or impersonation for malicious purposes{' \n'}
              • Child exploitation or endangerment{' \n'}
              • Terrorist activities or promotion{' \n\n'}
              We pursue civil and criminal liability claims against violators and cooperate fully with law enforcement.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security Incident Response</Text>
            <Text style={styles.text}>
              If you experience a security incident:{' \n\n'}
              1. Report immediately using emergency contacts{' \n'}
              2. Preserve all evidence (screenshots, messages){' \n'}
              3. Do not delete conversations or content{' \n'}
              4. Contact local law enforcement if threatened{' \n'}
              5. Cooperate with our investigation{' \n'}
              6. Do not engage further with the perpetrator{' \n\n'}
              Our legal team will respond within 1 hour for critical incidents and provide full support throughout the process.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Preservation for Legal Proceedings</Text>
            <Text style={styles.text}>
              We retain user data for a minimum of 90 days to support legal investigations:{' \n\n'}
              • Chat logs and call metadata{' \n'}
              • IP addresses and device information{' \n'}
              • User verification documents{' \n'}
              • Report and moderation history{' \n'}
              • Evidence of violations{' \n\n'}
              This data may be provided to law enforcement upon official court order or subpoena.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>User Protection Measures</Text>
            <Text style={styles.text}>
              We implement comprehensive security measures to protect our users:{' \n\n'}
              • Real-time monitoring for suspicious activity{' \n'}
              • Screen recording detection alerts{' \n'}
              • One-tap emergency report button{' \n'}
              • Anonymous reporting system{' \n'}
              • Automated evidence preservation{' \n'}
              • 24/7 emergency support line{' \n'}
              • AI-powered content moderation{' \n'}
              • Manual review by trained moderators
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Age Requirements</Text>
            <Text style={styles.text}>
              • Primary usage: 18+ years of age{' \n'}
              • Users aged 13-17 require explicit parental or guardian consent{' \n'}
              • Age verification (selfie + identity) may be required at any time{' \n'}
              • Accounts found to be underage without consent will be terminated immediately{' \n'}
              • COPPA compliant for child protection
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Intellectual Property</Text>
            <Text style={styles.text}>
              • Only post content you own or have permission to use{' \n'}
              • Respect copyright and trademark laws{' \n'}
              • Give credit when using others&apos; work{' \n'}
              • Report copyright violations
            </Text>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              These guidelines may be updated periodically. Continued use of Lumi constitutes acceptance of any changes.
            </Text>
            <Text style={styles.footerText}>
              Last Updated: January 2025
            </Text>
            <Text style={styles.footerContact}>
              Questions? Contact us at support@litxtechuk.com
            </Text>
            <Text style={styles.footerContact}>
              Emergency? WhatsApp: +1 307 271 5151 (24/7)
            </Text>
            <Text style={styles.footerText}>
              LITXTECH LTD | Company No: 16745093 | D-U-N-S®: 234203943{' \n'}
              71-75 Shelton Street, Covent Garden, London, WC2H 9JQ, UNITED KINGDOM
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
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(240, 79, 143, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: 'white',
  },
  text: {
    fontSize: 16,
    color: '#B7C0CE',
    lineHeight: 24,
  },
  footer: {
    marginTop: 16,
    paddingTop: 32,
    borderTopWidth: 1,
    borderTopColor: '#242A36',
    gap: 12,
  },
  footerText: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
    textAlign: 'center',
  },
  footerContact: {
    fontSize: 14,
    color: '#F04F8F',
    fontWeight: '500' as const,
    textAlign: 'center',
    marginTop: 8,
  },
});