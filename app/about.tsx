import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Building2, Globe, Users, Award, ExternalLink } from 'lucide-react-native';

export default function AboutPage() {
  const openURL = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Failed to open URL:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'About Us',
          headerStyle: { backgroundColor: '#111315' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '600' },
        }}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>LITX</Text>
            </View>
            <Text style={styles.title}>About LitxTech</Text>
            <Text style={styles.subtitle}>
              Empowering digital transformation through innovative technology solutions
            </Text>
          </View>

          {/* Company Overview */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Building2 color="#F04F8F" size={24} />
              <Text style={styles.sectionTitle}>Our Company</Text>
            </View>
            <Text style={styles.description}>
              LitxTech is an international technology company operating through LitxTech LTD in the United Kingdom (Company Number: 16745093, London) and LitxTech LLC in the United States (Wyoming). We deliver AI-driven, scalable, and reliable software solutions that help businesses accelerate their digital transformation.
            </Text>
          </View>

          {/* Mission */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Globe color="#F04F8F" size={24} />
              <Text style={styles.sectionTitle}>Our Mission</Text>
            </View>
            <Text style={styles.description}>
              Our mission is to empower companies across industries—hospitality, healthcare, education, retail, automotive, and beyond—by optimizing operations, reducing costs, and enhancing customer experience through innovative technology.
            </Text>
          </View>

          {/* Products */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Users color="#F04F8F" size={24} />
              <Text style={styles.sectionTitle}>Lumi Business</Text>
            </View>
            <Text style={styles.description}>
              As part of this vision, we developed Lumi Business, our professional video conferencing and collaboration platform. With secure connections, high-quality audio and video, screen sharing, and smart scheduling, Lumi Business makes communication seamless for modern teams.
            </Text>
          </View>

          {/* Leadership */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Award color="#F04F8F" size={24} />
              <Text style={styles.sectionTitle}>Leadership</Text>
            </View>
            <Text style={styles.description}>
              Founded by Soner Toprak, a technology entrepreneur with expertise in software development, digital marketing, and business solutions, LitxTech combines technical innovation with strategic insight.
            </Text>
            <TouchableOpacity
              style={styles.linkedinButton}
              onPress={() => openURL('https://linkedin.com/in/sonertoprak')}
            >
              <ExternalLink color="#F04F8F" size={16} />
              <Text style={styles.linkedinText}>View LinkedIn Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Values */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Our Values</Text>
            <Text style={styles.description}>
              At LitxTech, we believe in building solutions that are not only innovative but also sustainable, transparent, and future-ready. Our goal is to be recognized globally as a trusted technology partner shaping the digital future.
            </Text>
          </View>

          {/* Contact Information */}
          <View style={styles.contactSection}>
            <Text style={styles.contactTitle}>Contact Information</Text>
            
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>United Kingdom Office:</Text>
              <Text style={styles.contactText}>
                LitxTech LTD{'\n'}
                Company Number: 16745093{'\n'}
                71-75 Shelton Street, Covent Garden{'\n'}
                London, WC2H 9JQ, United Kingdom
              </Text>
            </View>

            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>United States Office:</Text>
              <Text style={styles.contactText}>
                LitxTech LLC{'\n'}
                Wyoming, United States
              </Text>
            </View>

            <View style={styles.contactButtons}>
              <TouchableOpacity
                style={styles.contactButton}
                onPress={() => openURL('mailto:support@litxtech.com')}
              >
                <Text style={styles.contactButtonText}>support@litxtech.com</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.contactButton}
                onPress={() => openURL('tel:+13072715151')}
              >
                <Text style={styles.contactButtonText}>+1 307 271 5151</Text>
              </TouchableOpacity>
            </View>
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
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F04F8F',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: 'white',
  },
  title: {
    fontSize: 28,
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
  description: {
    fontSize: 16,
    color: '#B7C0CE',
    lineHeight: 24,
  },
  linkedinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  linkedinText: {
    fontSize: 14,
    color: '#F04F8F',
    fontWeight: '500' as const,
  },
  contactSection: {
    marginTop: 16,
    paddingTop: 32,
    borderTopWidth: 1,
    borderTopColor: '#242A36',
  },
  contactTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: 'white',
    marginBottom: 24,
  },
  contactInfo: {
    marginBottom: 20,
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#F04F8F',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#B7C0CE',
    lineHeight: 20,
  },
  contactButtons: {
    gap: 12,
    marginTop: 16,
  },
  contactButton: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  contactButtonText: {
    fontSize: 14,
    color: '#F04F8F',
    fontWeight: '500' as const,
  },
});