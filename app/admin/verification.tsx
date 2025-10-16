import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Shield, CheckCircle, XCircle, Clock, AlertCircle, Sparkles } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { lumiService } from '@/services/lumiService';

type TabType = 'pending' | 'in_review' | 'approved' | 'rejected';

export default function AdminVerification() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [loading, setLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    lumiService.setContext('admin');
    analyzeVerifications();
  }, [activeTab]);

  const analyzeVerifications = async () => {
    setIsAnalyzing(true);
    try {
      const mockData = {
        applicationType: 'KYC Verification',
        documentsCount: 5,
        status: activeTab,
        submittedAt: new Date().toISOString(),
        country: 'Multiple',
      };
      const insights = await lumiService.analyzeVerificationDocuments(mockData);
      setAiInsights(insights);
    } catch (error) {
      console.error('AI analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const tabs: { key: TabType; label: string; icon: any; color: string }[] = [
    { key: 'pending', label: 'Pending', icon: Clock, color: '#FFD700' },
    { key: 'in_review', label: 'In Review', icon: AlertCircle, color: '#2AD1FF' },
    { key: 'approved', label: 'Approved', icon: CheckCircle, color: '#00FF88' },
    { key: 'rejected', label: 'Rejected', icon: XCircle, color: '#FF4444' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verification</Text>
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
                <Icon size={18} color={isActive ? tab.color : '#666'} />
                <Text style={[styles.tabText, isActive && { color: tab.color }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView style={styles.scrollView}>
        {aiInsights && (
          <View style={styles.aiInsightsCard}>
            <View style={styles.aiInsightsHeader}>
              <Sparkles size={20} color="#9B51E0" />
              <Text style={styles.aiInsightsTitle}>✨ Lumi AI Insights</Text>
              {isAnalyzing && <ActivityIndicator size="small" color="#9B51E0" />}
            </View>
            <Text style={styles.aiInsightsText}>{aiInsights}</Text>
            <TouchableOpacity 
              style={styles.refreshAiButton}
              onPress={analyzeVerifications}
              disabled={isAnalyzing}
            >
              <Text style={styles.refreshAiText}>Refresh Analysis</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.emptyState}>
          <Shield size={48} color="#666" />
          <Text style={styles.emptyText}>No {activeTab.replace('_', ' ')} verifications</Text>
          <Text style={styles.emptySubtext}>
            Verification requests will appear here
          </Text>
        </View>
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
    borderBottomColor: '#F04F8F',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center' as const,
  },
  aiInsightsCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    borderWidth: 2,
    borderColor: '#9B51E0',
  },
  aiInsightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  aiInsightsTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#9B51E0',
    flex: 1,
  },
  aiInsightsText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 22,
    marginBottom: 12,
  },
  refreshAiButton: {
    backgroundColor: '#9B51E0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center' as const,
  },
  refreshAiText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
});
