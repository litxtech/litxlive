import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, Alert, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/colors';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.h2}>{title}</Text>
    <View style={{ height: 8 }} />
    {children}
  </View>
);

export default function ChildSafetyPolicyScreen() {
  const title = 'Child Safety Standards Policy';

  const items = useMemo(
    () => ({
      company: {
        name: 'LITXTECH LTD',
        address: '71–75 Shelton Street, Covent Garden, London, WC2H 9JQ, UNITED KINGDOM',
        number: '16745093',
        app: 'Lumi Live',
      },
      contacts: {
        email: 'support@litxtech.com',
        whatsapp: '+1 307 271 5151',
        altEmail: 'sonertoprak@litxtech.com',
      },
      link: 'https://litxtech.com/legal/child-safety-policy',
    }),
    [],
  );

  const onOpen = async (url: string) => {
    try {
      console.log('[ChildSafetyPolicy] Open URL:', url);
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
      else Alert.alert('Unable to open link', url);
    } catch (e) {
      console.error('[ChildSafetyPolicy] Linking error', e);
      Alert.alert('Link error', 'Please try again later.');
    }
  };

  return (
    <View style={styles.container} testID="child-safety-policy">
      <Stack.Screen
        options={{
          title,
          headerShown: true,
          headerStyle: { backgroundColor: Colors.backgroundColor },
          headerTintColor: Colors.text,
        }}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.h1}>{title}</Text>

        <Text style={styles.meta}>
          Company: {items.company.name}
          {"\n"}
          Registered Address: {items.company.address}
          {"\n"}
          Company Number: {items.company.number}
          {"\n"}
          Application: {items.company.app}
        </Text>

        <Section title="1. Overview">
          <Text style={styles.body}>
            LITXTECH LTD is committed to protecting children and young people who interact with the Lumi Live application. We fully comply with the Google Play Child Safety Standards, the UK Children’s Code, and other international regulations to ensure that Lumi Live is a safe, respectful, and abuse-free environment.
          </Text>
        </Section>

        <Section title="2. Child Safety and Protection Measures">
          <View style={styles.bulletGroup}>
            <Text style={styles.bullet}>• Zero tolerance for abuse: Lumi Live strictly prohibits any content, behavior, or communication involving child sexual abuse material (CSAM), exploitation, or grooming.</Text>
            <Text style={styles.bullet}>• Active moderation: Our safety systems and moderation team continuously monitor live sessions and user content. Any violation results in immediate suspension and reporting to relevant authorities.</Text>
            <Text style={styles.bullet}>• Age restriction: Lumi Live is not intended for users under 18 years of age.</Text>
            <Text style={styles.bullet}>• Content filtering: Uploaded or streamed content is screened using automated tools and manual review to prevent inappropriate behavior.</Text>
            <Text style={styles.bullet}>• User reporting: Users can report any abuse, suspicious activity, or policy violations directly within the app.</Text>
          </View>
        </Section>

        <Section title="3. Reporting and Contact Channels">
          <Text style={styles.body}>If you suspect or witness child exploitation, harassment, or inappropriate activity within Lumi Live, please contact our Trust & Safety Team immediately.</Text>
          <View style={{ height: 8 }} />
          <Text style={styles.link} onPress={() => onOpen('mailto:' + items.contacts.email)}>
            Email (24/7 Reports): {items.contacts.email}
          </Text>
          <Text
            style={styles.link}
            onPress={() => onOpen(Platform.select({ web: 'https://wa.me/13072715151', default: 'https://wa.me/13072715151' }) ?? 'https://wa.me/13072715151')}
          >
            WhatsApp Hotline (Emergency Reports): {items.contacts.whatsapp}
          </Text>
          <Text style={styles.link} onPress={() => onOpen('mailto:' + items.contacts.altEmail)}>
            Alternate Contact: {items.contacts.altEmail}
          </Text>
          <View style={{ height: 8 }} />
          <Text style={styles.body}>All reports are reviewed urgently by our internal safety officers. We cooperate fully with local and international law enforcement agencies.</Text>
        </Section>

        <Section title="4. Legal Compliance">
          <View style={styles.bulletGroup}>
            <Text style={styles.bullet}>• UK Children’s Code (ICO)</Text>
            <Text style={styles.bullet}>• GDPR Article 8 (Child Data Consent)</Text>
            <Text style={styles.bullet}>• U.S. COPPA (Children’s Online Privacy Protection Act)</Text>
            <Text style={styles.bullet}>• UN Convention on the Rights of the Child (UNCRC)</Text>
            <Text style={styles.bullet}>• Google Play Developer Program Policies (Child Safety & User-Generated Content)</Text>
          </View>
        </Section>

        <Section title="5. Ongoing Commitment">
          <Text style={styles.body}>
            We perform periodic audits and continuous updates to ensure Lumi Live remains compliant with evolving child protection laws and digital safety standards. Our team is dedicated to transparent, proactive communication with regulators and users.
          </Text>
        </Section>

        <View style={styles.divider} />
        <Text style={styles.caption}>Public link</Text>
        <Text style={styles.link} onPress={() => onOpen(items.link)}>
          {items.link}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundColor,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  h1: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  h2: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textSecondary,
  },
  bulletGroup: {
    gap: 8,
  } as const,
  bullet: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textSecondary,
  },
  meta: {
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  caption: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 6,
  },
  link: {
    color: Colors.secondary,
    textDecorationLine: 'underline',
    fontSize: 16,
    marginVertical: 4,
  },
  section: {
    marginBottom: 20,
  },
});
