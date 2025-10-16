import { supabase } from '@/lib/supabase';

export interface DashboardStats {
  total_users: number;
  active_users: number;
  live_calls: number;
  complaints: number;
  revenue: number;
  risk_alerts: number;
}

export interface UserSearchResult {
  user_id: string;
  email: string;
  display_name: string;
  username: string;
  country: string;
  is_verified: boolean;
  is_vip: boolean;
  coins: number;
  level: number;
  last_seen: string;
  risk_score: number;
  status: string;
  created_at: string;
}

export interface LiveCall {
  id: string;
  room_id: string;
  room_name: string;
  host_id: string;
  mode: string;
  participants_count: number;
  started_at: string;
  is_active: boolean;
}

export interface Complaint {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  complaint_type: string;
  description: string;
  priority: string;
  status: string;
  created_at: string;
}

export interface RiskEvent {
  id: string;
  user_id: string;
  event_type: string;
  severity: string;
  description: string;
  is_resolved: boolean;
  created_at: string;
}

export interface CoinTransaction {
  id: string;
  user_id: string;
  transaction_type: string;
  amount: number;
  balance_after: number;
  reason_code: string;
  created_at: string;
}

export interface UserBan {
  id: string;
  user_id: string;
  ban_type: string;
  reason: string;
  duration_hours: number;
  is_active: boolean;
  created_at: string;
  expires_at: string;
}

export class AdminApiService {
  // Dashboard Stats
  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      const { data, error } = await supabase.rpc('get_dashboard_stats');
      
      if (error) {
        console.error('Dashboard stats error:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      throw error;
    }
  }

  // Advanced User Search
  static async searchUsers(params: {
    query?: string;
    status?: string;
    verification?: string;
    country?: string;
    riskLevel?: string;
    sortBy?: string;
    sortOrder?: string;
    limit?: number;
    offset?: number;
  }): Promise<UserSearchResult[]> {
    try {
      const { data, error } = await supabase.rpc('search_users_advanced', {
        p_query: params.query || '',
        p_status: params.status || 'all',
        p_verification: params.verification || 'all',
        p_country: params.country || 'all',
        p_risk_level: params.riskLevel || 'all',
        p_sort_by: params.sortBy || 'last_seen',
        p_sort_order: params.sortOrder || 'desc',
        p_limit: params.limit || 50,
        p_offset: params.offset || 0
      });
      
      if (error) {
        console.error('User search error:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Failed to search users:', error);
      throw error;
    }
  }

  // Get Live Calls
  static async getLiveCalls(): Promise<LiveCall[]> {
    try {
      const { data, error } = await supabase
        .from('live_sessions')
        .select('*')
        .eq('is_active', true)
        .order('started_at', { ascending: false });
      
      if (error) {
        console.error('Live calls error:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Failed to fetch live calls:', error);
      throw error;
    }
  }

  // Get Complaints
  static async getComplaints(params: {
    status?: string;
    priority?: string;
    limit?: number;
    offset?: number;
  }): Promise<Complaint[]> {
    try {
      let query = supabase
        .from('complaints')
        .select(`
          id,
          reporter_id,
          reported_user_id,
          complaint_type,
          description,
          priority,
          status,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (params.status) {
        query = query.eq('status', params.status);
      }

      if (params.priority) {
        query = query.eq('priority', params.priority);
      }

      if (params.limit) {
        query = query.limit(params.limit);
      }

      if (params.offset) {
        query = query.range(params.offset, params.offset + (params.limit || 50) - 1);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Complaints error:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Failed to fetch complaints:', error);
      throw error;
    }
  }

  // Get Risk Events
  static async getRiskEvents(params: {
    severity?: string;
    resolved?: boolean;
    limit?: number;
  }): Promise<RiskEvent[]> {
    try {
      let query = supabase
        .from('risk_events')
        .select('*')
        .order('created_at', { ascending: false });

      if (params.severity) {
        query = query.eq('severity', params.severity);
      }

      if (params.resolved !== undefined) {
        query = query.eq('is_resolved', params.resolved);
      }

      if (params.limit) {
        query = query.limit(params.limit);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Risk events error:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Failed to fetch risk events:', error);
      throw error;
    }
  }

  // Get User Details
  static async getUserDetails(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_risk_scores(score, factors, last_calculated),
          user_bans!inner(ban_type, reason, is_active, created_at, expires_at),
          coin_transactions(transaction_type, amount, balance_after, reason_code, created_at),
          device_fingerprints(fingerprint, device_info, is_suspicious, last_seen)
        `)
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('User details error:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Failed to fetch user details:', error);
      throw error;
    }
  }

  // Ban User
  static async banUser(params: {
    userId: string;
    banType: string;
    reason: string;
    durationHours?: number;
    adminId: string;
  }): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('ban_user', {
        p_user_id: params.userId,
        p_ban_type: params.banType,
        p_reason: params.reason,
        p_duration_hours: params.durationHours,
        p_admin_id: params.adminId
      });
      
      if (error) {
        console.error('Ban user error:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Failed to ban user:', error);
      throw error;
    }
  }

  // Adjust User Coins
  static async adjustUserCoins(params: {
    userId: string;
    amount: number;
    reasonCode: string;
    adminId: string;
  }): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('adjust_user_coins', {
        p_user_id: params.userId,
        p_amount: params.amount,
        p_reason_code: params.reasonCode,
        p_admin_id: params.adminId
      });
      
      if (error) {
        console.error('Adjust coins error:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Failed to adjust user coins:', error);
      throw error;
    }
  }

  // Update Risk Score
  static async updateRiskScore(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('update_risk_score', {
        p_user_id: userId
      });
      
      if (error) {
        console.error('Update risk score error:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Failed to update risk score:', error);
      throw error;
    }
  }

  // Resolve Complaint
  static async resolveComplaint(params: {
    complaintId: string;
    resolution: string;
    adminId: string;
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('complaints')
        .update({
          status: 'resolved',
          resolution: params.resolution,
          assigned_admin_id: params.adminId,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.complaintId);
      
      if (error) {
        console.error('Resolve complaint error:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to resolve complaint:', error);
      throw error;
    }
  }

  // Get Audit Logs
  static async getAuditLogs(params: {
    adminId?: string;
    action?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (params.adminId) {
        query = query.eq('admin_user_id', params.adminId);
      }

      if (params.action) {
        query = query.eq('action', params.action);
      }

      if (params.limit) {
        query = query.limit(params.limit);
      }

      if (params.offset) {
        query = query.range(params.offset, params.offset + (params.limit || 50) - 1);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Audit logs error:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      throw error;
    }
  }

  // Bulk Actions
  static async bulkBanUsers(params: {
    userIds: string[];
    banType: string;
    reason: string;
    durationHours?: number;
    adminId: string;
  }): Promise<string[]> {
    try {
      const banIds: string[] = [];
      
      for (const userId of params.userIds) {
        const banId = await this.banUser({
          userId,
          banType: params.banType,
          reason: params.reason,
          durationHours: params.durationHours,
          adminId: params.adminId
        });
        banIds.push(banId);
      }
      
      return banIds;
    } catch (error) {
      console.error('Failed to bulk ban users:', error);
      throw error;
    }
  }

  // Export Data
  static async exportUsers(params: {
    format: 'csv' | 'json';
    filters?: any;
  }): Promise<string> {
    try {
      const users = await this.searchUsers({
        ...params.filters,
        limit: 10000 // Large limit for export
      });
      
      if (params.format === 'csv') {
        // Convert to CSV
        const headers = Object.keys(users[0] || {});
        const csvContent = [
          headers.join(','),
          ...users.map(user => 
            headers.map(header => `"${user[header as keyof UserSearchResult] || ''}"`).join(',')
          )
        ].join('\n');
        
        return csvContent;
      } else {
        // Return JSON
        return JSON.stringify(users, null, 2);
      }
    } catch (error) {
      console.error('Failed to export users:', error);
      throw error;
    }
  }

  // Real-time Subscriptions
  static subscribeToLiveCalls(callback: (calls: LiveCall[]) => void) {
    return supabase
      .channel('live_calls')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'live_sessions' },
        async () => {
          const calls = await this.getLiveCalls();
          callback(calls);
        }
      )
      .subscribe();
  }

  static subscribeToComplaints(callback: (complaints: Complaint[]) => void) {
    return supabase
      .channel('complaints')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'complaints' },
        async () => {
          const complaints = await this.getComplaints({});
          callback(complaints);
        }
      )
      .subscribe();
  }

  static subscribeToRiskEvents(callback: (events: RiskEvent[]) => void) {
    return supabase
      .channel('risk_events')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'risk_events' },
        async () => {
          const events = await this.getRiskEvents({});
          callback(events);
        }
      )
      .subscribe();
  }
}

export default AdminApiService;
