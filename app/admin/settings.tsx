import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Settings, Flag, Shield, Lock, Zap, Link as LinkIcon } from 'lucide-react-native';
import { useRouter } from 'expo-router';

type TabType = 'features' | 'auth' | 'privacy' | 'limits' | 'integrations';

export default function AdminSettings() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('features');
  const [featureFlags, setFeatureFlags] = useState({
    videoCall: true,
    quickMatch: true,
    gifts: true,
    reels: true,
    messaging: true,
  });

  const tabs: { key: TabType; label: string; icon: any }[] = [
    { key: 'features', label: 'Feature Flags', icon: Flag },
    { key: 'auth', label: 'Auth', icon: Shield },
    { key: 'privacy', label: 'Privacy', icon: Lock },
    { key: 'limits', label: 'Rate Limits', icon: Zap },
    { key: 'integrations', label: 'Integrations', icon: LinkIcon },
  ];

  const toggleFeature = (key: keyof typeof featureFlags) => {
    setFeatureFlags(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Icon size={18} color={isActive ? '#FFD700' : '#666'} />
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView style={styles.scrollView}>
        {activeTab === 'features' && (
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Feature Flags</Text>
            {Object.entries(featureFlags).map(([key, value]) => (
              <View key={key} style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>
                    {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                  </Text>
                  <Text style={styles.settingDescription}>
                    Enable or disable {key.toLowerCase()} feature
                  </Text>
                </View>
                <Switch
                  value={value}
                  onValueChange={() => toggleFeature(key as keyof typeof featureFlags)}
                  trackColor={{ false: '#333', true: '#F04F8F' }}
                  thumbColor={value ? '#fff' : '#666'}
                />
              </View>
            ))}
          </View>
        )}
        {activeTab !== 'features' && (
          <View style={styles.emptyState}>
            <Settings size={48} color="#666" />
            <Text style={styles.emptyText}>{activeTab} settings coming soon</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B10',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingHorizontal: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    gap: 8,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#FFD700',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
  },
  tabTextActive: {
    color: '#FFD700',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
});
