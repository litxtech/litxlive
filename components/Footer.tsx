import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { usePolicies } from '@/providers/PolicyProvider';

export default function Footer() {
  const { footerPolicies } = usePolicies();

  const items = useMemo(() => {
    const fallback = [
      { slug: 'privacy', title: 'Privacy' },
      { slug: 'terms', title: 'Terms' },
      { slug: 'child-safety-policy', title: 'Child Safety' },
      { slug: 'account-deletion', title: 'Account Deletion' },
      { slug: 'account-creation-help', title: 'Account Creation Help' },
    ];
    return (footerPolicies && footerPolicies.length > 0) ? footerPolicies : fallback;
  }, [footerPolicies]);

  const handlePolicyPress = (slug: string) => {
    const routeMap: Record<string, string> = {
      privacy: '/privacy',
      terms: '/terms',
      'child-safety-policy': '/legal/child-safety-policy',
      'account-deletion': '/account-deletion',
      'account-creation-help': '/help-account-creation',
    };

    const route = routeMap[slug] ?? `/policies/${slug}`;
    router.push(route as any);
  };

  return (
    <View style={styles.container} testID="footer">
      <View style={styles.linksRow}>
        {items.map((policy, index) => (
          <React.Fragment key={policy.slug}>
            <TouchableOpacity
              onPress={() => handlePolicyPress(policy.slug)}
              style={styles.link}
              accessibilityRole="link"
              testID={`footer-link-${policy.slug}`}
            >
              <Text style={styles.linkText}>{policy.title}</Text>
            </TouchableOpacity>
            {index < items.length - 1 && (
              <Text style={styles.separator}>•</Text>
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  linksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  link: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  linkText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '500' as const,
  },
  separator: {
    color: Colors.textMuted,
    fontSize: 12,
    opacity: 0.5,
  },
});
