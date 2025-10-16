import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, AlertTriangle, Sparkles, XCircle, CheckCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { lumiService } from '@/services/lumiService';
import { trpc } from '@/lib/trpc';

export default function AdminModeration() {
  const router = useRouter();
  const [aiInsights, setAiInsights] = useState<Record<string, string>>({});
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const reportsQuery = trpc.admin.moderation.reports.useQuery({ status: 'pending', limit: 50, offset: 0 });
  const resolveMutation = trpc.admin.moderation.resolve.useMutation();

  useEffect(() => {
    lumiService.setContext('admin');
  }, []);

  const reports = reportsQuery.data?.reports || [];

  const analyzeReport = async (report: any) => {
    setAnalyzingId(report.id);
    try {
      const insights = await lumiService.analyzeContentModeration({
        contentType: 'report',
        reportsCount: 1,
        reasons: [report.reason],
        contentAge: Math.floor((Date.now() - new Date(report.createdAt).getTime()) / (1000 * 60 * 60)),
        userHistory: 'unknown',
      });
      setAiInsights(prev => ({ ...prev, [report.id]: insights }));
    } catch (error) {
      console.error('Content analysis error:', error);
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleResolve = (reportId: string, action: 'dismiss' | 'warn' | 'ban') => {
    Alert.alert(
      'Resolve Report',
      `Are you sure you want to ${action} this report?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await resolveMutation.mutateAsync({ reportId, action, notes: `Admin action: ${action}` });
              reportsQuery.refetch();
              Alert.alert('Success', 'Report resolved successfully');
            } catch {
              Alert.alert('Error', 'Failed to resolve report');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Moderation</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {reportsQuery.isLoading && (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color="#F04F8F" />
            <Text style={styles.emptyText}>Loading reports...</Text>
          </View>
        )}
        {reports.length > 0 ? (
          <View style={styles.reportsContainer}>
            {reports.map((report) => (
              <View key={report.id} style={styles.reportCard}>
                <View style={styles.reportHeader}>
                  <View style={styles.reportInfo}>
                    <Text style={styles.reportId}>{report.id.substring(0, 8)}</Text>
                    <View style={styles.severityBadge}>
                      <Text style={styles.severityText}>{report.status.toUpperCase()}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.aiAnalyzeButton}
                    onPress={() => analyzeReport(report)}
                    disabled={analyzingId === report.id}
                  >
                    {analyzingId === report.id ? (
                      <ActivityIndicator size="small" color="#9B51E0" />
                    ) : (
                      <Sparkles size={20} color="#9B51E0" />
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.reportDetails}>
                  <Text style={styles.reportUser}>Reported: {report.reportedUserName}</Text>
                  <Text style={styles.reportType}>Reporter: {report.reporterName}</Text>
                  <Text style={styles.reportCount}>Reason: {report.reason}</Text>
                  <Text style={styles.reportReasons}>Description: {report.description || 'N/A'}</Text>
                  <Text style={styles.reportHistory}>Created: {new Date(report.createdAt).toLocaleDateString()}</Text>
                </View>

                {aiInsights[report.id] && (
                  <View style={styles.aiInsightsBox}>
                    <View style={styles.aiInsightsHeader}>
                      <Sparkles size={16} color="#9B51E0" />
                      <Text style={styles.aiInsightsTitle}>AI Moderation Analysis</Text>
                    </View>
                    <Text style={styles.aiInsightsText}>{aiInsights[report.id]}</Text>
                  </View>
                )}

                <View style={styles.reportActions}>
                  <TouchableOpacity 
                    style={styles.approveButton}
                    onPress={() => handleResolve(report.id, 'dismiss')}
                    disabled={resolveMutation.isPending}
                  >
                    <CheckCircle size={18} color="#fff" />
                    <Text style={styles.actionButtonText}>Dismiss</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.rejectButton}
                    onPress={() => handleResolve(report.id, 'ban')}
                    disabled={resolveMutation.isPending}
                  >
                    <XCircle size={18} color="#fff" />
                    <Text style={styles.actionButtonText}>Ban User</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <AlertTriangle size={48} color="#666" />
            <Text style={styles.emptyText}>No reports</Text>
            <Text style={styles.emptySubtext}>
              User reports and moderation actions will appear here
            </Text>
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
  reportsContainer: {
    padding: 16,
  },
  reportCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reportId: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#FFD700',
  },
  severityHigh: {
    backgroundColor: '#FF4444',
  },
  severityMedium: {
    backgroundColor: '#FFD700',
  },
  severityText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#000',
  },
  aiAnalyzeButton: {
    padding: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#9B51E0',
  },
  reportDetails: {
    marginBottom: 12,
  },
  reportUser: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 4,
  },
  reportType: {
    fontSize: 13,
    color: '#999',
    marginBottom: 4,
  },
  reportCount: {
    fontSize: 13,
    color: '#FF4444',
    marginBottom: 4,
  },
  reportReasons: {
    fontSize: 13,
    color: '#ccc',
    marginBottom: 4,
  },
  reportHistory: {
    fontSize: 13,
    color: '#666',
  },
  aiInsightsBox: {
    marginTop: 12,
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#0B0B10',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#9B51E0',
  },
  aiInsightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  aiInsightsTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#9B51E0',
  },
  aiInsightsText: {
    fontSize: 13,
    color: '#ccc',
    lineHeight: 20,
  },
  reportActions: {
    flexDirection: 'row',
    gap: 8,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#00FF88',
    borderRadius: 8,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#FF4444',
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
