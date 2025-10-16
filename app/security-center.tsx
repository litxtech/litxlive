import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import {
  Shield,
  AlertTriangle,
  Phone,
  Mail,
  MessageCircle,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
} from 'lucide-react-native';

export default function SecurityCenterPage() {

  const handleWhatsApp = async () => {
    const phoneNumber = '+13072715151';
    const url = `whatsapp://send?phone=${phoneNumber}`;
    
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          'WhatsApp Not Available',
          'Please install WhatsApp or contact us via email at legal@litxtechuk.com'
        );
      }
    } catch (error) {
      console.error('Error opening WhatsApp:', error);
      Alert.alert('Error', 'Could not open WhatsApp. Please try again.');
    }
  };

  const handleEmail = async (email: string) => {
    const url = `mailto:${email}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Email Not Available', `Please email us at ${email}`);
      }
    } catch (error) {
      console.error('Error opening email:', error);
    }
  };

  const handlePhone = async () => {
    const phoneNumber = '+447441425582';
    const url = `tel:${phoneNumber}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Phone Not Available', `Please call ${phoneNumber}`);
      }
    } catch (error) {
      console.error('Error opening phone:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Security Center',
          headerStyle: { backgroundColor: '#111315' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '600' },
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Shield color="#F04F8F" size={40} />
            </View>
            <Text style={styles.title}>Security & Safety Center</Text>
            <Text style={styles.subtitle}>
              Your safety is our priority. Report incidents immediately and get help 24/7.
            </Text>
          </View>

          <View style={styles.emergencyCard}>
            <View style={styles.emergencyHeader}>
              <AlertTriangle color="#EF4444" size={24} />
              <Text style={styles.emergencyTitle}>Emergency Contacts</Text>
            </View>
            <Text style={styles.emergencySubtitle}>
              For critical incidents requiring immediate attention
            </Text>

            <TouchableOpacity style={styles.contactButton} onPress={handleWhatsApp}>
              <View style={styles.contactIcon}>
                <MessageCircle color="white" size={20} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Emergency WhatsApp</Text>
                <Text style={styles.contactValue}>+1 307 271 5151</Text>
                <Text style={styles.contactAvailability}>Available 24/7</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => handleEmail('legal@litxtechuk.com')}
            >
              <View style={styles.contactIcon}>
                <Mail color="white" size={20} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Legal Matters</Text>
                <Text style={styles.contactValue}>legal@litxtechuk.com</Text>
                <Text style={styles.contactAvailability}>Response within 24 hours</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactButton} onPress={handlePhone}>
              <View style={styles.contactIcon}>
                <Phone color="white" size={20} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Phone Support</Text>
                <Text style={styles.contactValue}>+44 744 142 5582</Text>
                <Text style={styles.contactAvailability}>Business hours</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AlertCircle color="#F04F8F" size={24} />
              <Text style={styles.sectionTitle}>What to Report</Text>
            </View>
            <View style={styles.reportList}>
              <View style={styles.reportItem}>
                <CheckCircle color="#10B981" size={20} />
                <Text style={styles.reportText}>Blackmail or extortion attempts</Text>
              </View>
              <View style={styles.reportItem}>
                <CheckCircle color="#10B981" size={20} />
                <Text style={styles.reportText}>Unauthorized recording of conversations</Text>
              </View>
              <View style={styles.reportItem}>
                <CheckCircle color="#10B981" size={20} />
                <Text style={styles.reportText}>Threats or harassment</Text>
              </View>
              <View style={styles.reportItem}>
                <CheckCircle color="#10B981" size={20} />
                <Text style={styles.reportText}>Sharing of illegal content</Text>
              </View>
              <View style={styles.reportItem}>
                <CheckCircle color="#10B981" size={20} />
                <Text style={styles.reportText}>Identity theft or impersonation</Text>
              </View>
              <View style={styles.reportItem}>
                <CheckCircle color="#10B981" size={20} />
                <Text style={styles.reportText}>Child safety concerns</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Clock color="#F04F8F" size={24} />
              <Text style={styles.sectionTitle}>Response Times</Text>
            </View>
            <View style={styles.responseList}>
              <View style={styles.responseItem}>
                <View style={styles.responseDot} />
                <View style={styles.responseContent}>
                  <Text style={styles.responseType}>Critical Incidents</Text>
                  <Text style={styles.responseTime}>Within 1 hour</Text>
                  <Text style={styles.responseDescription}>
                    Blackmail, threats, immediate danger
                  </Text>
                </View>
              </View>
              <View style={styles.responseItem}>
                <View style={styles.responseDot} />
                <View style={styles.responseContent}>
                  <Text style={styles.responseType}>Legal Matters</Text>
                  <Text style={styles.responseTime}>Within 24 hours</Text>
                  <Text style={styles.responseDescription}>
                    Law enforcement requests, legal inquiries
                  </Text>
                </View>
              </View>
              <View style={styles.responseItem}>
                <View style={styles.responseDot} />
                <View style={styles.responseContent}>
                  <Text style={styles.responseType}>General Support</Text>
                  <Text style={styles.responseTime}>Within 48 hours</Text>
                  <Text style={styles.responseDescription}>
                    Account issues, general questions
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FileText color="#F04F8F" size={24} />
              <Text style={styles.sectionTitle}>Evidence Preservation</Text>
            </View>
            <Text style={styles.text}>
              If reporting a security incident, please:
            </Text>
            <View style={styles.guideList}>
              <Text style={styles.guideItem}>1. Take screenshots of all relevant content</Text>
              <Text style={styles.guideItem}>2. Do not delete messages or conversations</Text>
              <Text style={styles.guideItem}>3. Note dates, times, and usernames</Text>
              <Text style={styles.guideItem}>4. Preserve any external communications</Text>
              <Text style={styles.guideItem}>5. Contact local law enforcement if threatened</Text>
            </View>
            <View style={styles.infoBox}>
              <Info color="#6366F1" size={20} />
              <Text style={styles.infoText}>
                We will preserve all platform data related to your report for legal proceedings.
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Zero Tolerance Policy</Text>
            <Text style={styles.text}>
              The following activities result in immediate account termination and potential legal
              action:
            </Text>
            <View style={styles.policyList}>
              <Text style={styles.policyItem}>• Blackmail or extortion</Text>
              <Text style={styles.policyItem}>• Unauthorized recording</Text>
              <Text style={styles.policyItem}>• Sharing illegal content</Text>
              <Text style={styles.policyItem}>• Harassment or threats</Text>
              <Text style={styles.policyItem}>• Identity theft</Text>
            </View>
            <Text style={styles.policyNote}>
              We pursue civil and criminal liability claims against violators and cooperate fully
              with law enforcement.
            </Text>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerTitle}>LITXTECH LTD</Text>
            <Text style={styles.footerText}>
              71-75 Shelton Street, Covent Garden{'\n'}
              London, WC2H 9JQ, UNITED KINGDOM
            </Text>
            <Text style={styles.footerText}>
              Company No: 16745093{'\n'}
              D-U-N-S®: 234203943
            </Text>
            <TouchableOpacity onPress={() => handleEmail('support@litxtechuk.com')}>
              <Text style={styles.footerLink}>support@litxtechuk.com</Text>
            </TouchableOpacity>
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
    alignItems: 'center' as const,
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(240, 79, 143, 0.1)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: 'white',
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center' as const,
    lineHeight: 24,
  },
  emergencyCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  emergencyHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    marginBottom: 8,
  },
  emergencyTitle: {
    fontSize: 22,
    fontWeight: 'bold' as const,
    color: 'white',
  },
  emergencySubtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
  },
  contactButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#242A36',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F04F8F',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: 'white',
    marginBottom: 4,
  },
  contactAvailability: {
    fontSize: 12,
    color: '#10B981',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    marginBottom: 16,
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
    marginBottom: 16,
  },
  reportList: {
    gap: 12,
  },
  reportItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  reportText: {
    fontSize: 16,
    color: '#B7C0CE',
    flex: 1,
  },
  responseList: {
    gap: 20,
  },
  responseItem: {
    flexDirection: 'row' as const,
    gap: 16,
  },
  responseDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F04F8F',
    marginTop: 6,
  },
  responseContent: {
    flex: 1,
  },
  responseType: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: 'white',
    marginBottom: 4,
  },
  responseTime: {
    fontSize: 16,
    color: '#F04F8F',
    marginBottom: 4,
  },
  responseDescription: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
  },
  guideList: {
    gap: 12,
    marginBottom: 16,
  },
  guideItem: {
    fontSize: 16,
    color: '#B7C0CE',
    lineHeight: 24,
  },
  infoBox: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#6366F1',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#B7C0CE',
    lineHeight: 20,
  },
  policyList: {
    gap: 8,
    marginBottom: 16,
  },
  policyItem: {
    fontSize: 16,
    color: '#B7C0CE',
    lineHeight: 24,
  },
  policyNote: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic' as const,
    lineHeight: 20,
  },
  footer: {
    marginTop: 16,
    paddingTop: 32,
    borderTopWidth: 1,
    borderTopColor: '#242A36',
    alignItems: 'center' as const,
    gap: 12,
  },
  footerTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: 'white',
  },
  footerText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center' as const,
    lineHeight: 20,
  },
  footerLink: {
    fontSize: 14,
    color: '#F04F8F',
    fontWeight: '500' as const,
    marginTop: 8,
  },
});
