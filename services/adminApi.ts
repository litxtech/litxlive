import { ADMIN_API } from "@/lib/adminEnv";
import { getAdminToken, saveAdminToken, clearAdminToken } from "@/lib/adminSession";
import { trpcClient } from "@/lib/trpc";
import { supabase } from "@/lib/supabase";

// Types
export type Json = Record<string, any>;

export type DashboardStats = {
  total_users: number;
  active_today: number;
  total_matches: number;
  total_revenue: number;
  pending_reports: number;
};

export interface AdminLoginResponse {
  success: boolean;
  username: string;
  token: string;
  error?: string;
}

export interface AdminMeResponse {
  admin_id?: string;
  username: string;
  display_name?: string;
  is_super_admin: boolean;
  permissions?: Record<string, boolean>;
}

export interface AdminLog {
  id: string;
  action: string;
  created_at: string;
  username: string;
  resource_type?: string;
  resource_id?: string;
  ip_address?: string;
  details?: Record<string, any>;
}

export interface FooterContent {
  id: string;
  section_name: string;
  language: string;
  order_index: number;
  is_active: boolean;
}

export interface Policy {
  id: string;
  title: string;
  policy_type?: string;
  language: string;
  version: number;
  is_active: boolean;
  requires_consent?: boolean;
}

export interface AgencyApplication {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  city: string;
  address?: string;
  national_id?: string;
  application_purpose: string;
  category_tags?: string[];
  company_type?: string;
  company_name?: string;
  tax_number?: string;
  company_address?: string;
  website?: string;
  hometown?: string;
  documents?: any;
  id_document_type?: string;
  selfie_url?: string;
  id_front_url?: string;
  id_back_url?: string;
  signature_name: string;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  username?: string;
  emailVerified: boolean;
  verified: boolean;
  kycStatus: string;
  coins: number;
  createdAt: string;
  lastSignIn: string | null;
  banned: boolean;
  reportCount: number;
  accountAge: number;
}

export interface AdminUsersListResponse {
  users: AdminUser[];
  total: number;
}

export interface PaymentTransaction {
  id: string;
  amount_cent: number;
  currency: string;
  sku: string | null;
  provider: string | null;
  status: 'succeeded' | 'failed' | 'pending' | string;
  created_at: string;
}

export interface AdminUserProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  displayName: string | null;
  city: string | null;
  gender: string | null;
  orientation: string | null;
  phoneCountry: string | null;
  phoneNumber: string | null;
  phoneE164: string | null;
}

async function fetchAdmin<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${ADMIN_API}${endpoint}`;
  const token = await getAdminToken();

  console.log("[adminApi] fetch", { url, hasToken: !!token });

  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const res = await fetch(url, {
    ...options,
    credentials: 'omit',
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(anonKey ? { apikey: anonKey } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : anonKey ? { Authorization: `Bearer ${anonKey}` } : {}),
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[adminApi] fetch error", { 
      url, 
      status: res.status, 
      statusText: res.statusText,
      error: text 
    });
    throw new Error(text || `Admin API error: ${res.status} ${res.statusText}`);
  }
  
  return res.json() as Promise<T>;
}

async function fetchAdminSafe<T>(endpoint: string, options: RequestInit | undefined, fallback: T): Promise<T> {
  try {
    return await fetchAdmin<T>(endpoint, options);
  } catch (e: unknown) {
    const msg = String((e as Error)?.message ?? e);
    if (msg.includes('Not found') || msg.includes('404')) {
      console.warn('[adminApi] 404 Not Found on', endpoint, '→ returning fallback');
      return fallback;
    }
    console.error('[adminApi] request failed', { endpoint, error: msg });
    return fallback;
  }
}

export const adminApi = {
  async login(username: string, password: string): Promise<AdminLoginResponse> {
    const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log("[adminApi] 🔑 Login attempt", { 
      endpoint: ADMIN_API,
      username,
      passwordLength: password.length,
      hasAnonKey: !!anonKey,
      origin: typeof window !== 'undefined' ? window.location.origin : 'N/A'
    });

    const requestBody = { username, password };
    console.log("[adminApi] 📤 Request body:", requestBody);

    const headers: Record<string, string> = { 
      Accept: "application/json", 
      "Content-Type": "application/json",
    };
    
    if (anonKey) {
      headers.apikey = anonKey;
      headers.Authorization = `Bearer ${anonKey}`;
    }
    
    console.log("[adminApi] 📨 Request headers:", Object.keys(headers));

    try {
      const res = await fetch(`${ADMIN_API}/login`, {
        method: "POST",
        credentials: 'omit',
        headers,
        body: JSON.stringify(requestBody),
      });

      console.log("[adminApi] 📥 Response status:", res.status, res.statusText);

      const responseText = await res.text();
      console.log("[adminApi] 📥 Response text:", responseText);

      let body: Json = {};
      try {
        body = JSON.parse(responseText);
        console.log("[adminApi] 📥 Parsed response:", body);
      } catch (e) {
        console.error("[adminApi] ❌ JSON parse error:", e);
        throw new Error(`Invalid JSON response: ${responseText}`);
      }
      
      if (!res.ok || !body?.success || !body?.token) {
        console.error("[adminApi] ❌ Login failed", { 
          status: res.status,
          statusText: res.statusText,
          response: body,
          success: body?.success,
          hasToken: !!body?.token,
          error: body?.error
        });
        throw new Error(body?.error ?? responseText ?? `Login failed (${res.status})`);
      }

      console.log("[adminApi] ✅ Login success", { 
        username: body.username,
        tokenLength: body.token?.length 
      });
      
      await saveAdminToken(body.token as string);
      return body as AdminLoginResponse;
    } catch (error) {
      console.error("[adminApi] ❌ Network/Fetch error:", error);
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('Bağlantı hatası: Sunucuya ulaşılamıyor. CORS veya network sorunu olabilir.');
      }
      throw error;
    }
  },

  async me(): Promise<AdminMeResponse> {
    const url = `${ADMIN_API}/me`;
    console.log("[adminApi] me() calling:", url);
    return fetchAdmin<AdminMeResponse>(url);
  },

  async logout(): Promise<void> {
    console.log("[adminApi] logout");
    await clearAdminToken();
    if (typeof window !== "undefined" && window.location) {
      window.location.href = "/admin";
    }
  },

  async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Gerçek database'den veri çek
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, created_at, last_seen')
        .not('last_seen', 'is', null);

      if (usersError) {
        console.error('[AdminAPI] Users fetch error:', usersError);
        // Fallback to mock data
        return {
          total_users: 1250,
          active_today: 89,
          total_matches: 3420,
          total_revenue: 15420,
          pending_reports: 12,
        };
      }

      const today = new Date().toISOString().split('T')[0];
      const activeToday = users?.filter(user => 
        user.last_seen && user.last_seen.startsWith(today)
      ).length || 0;

      return {
        total_users: users?.length || 0,
        active_today: activeToday,
        total_matches: 3420, // Bu için ayrı tablo gerekli
        total_revenue: 15420, // Bu için ayrı tablo gerekli
        pending_reports: 12, // Bu için ayrı tablo gerekli
      };
    } catch (error) {
      console.error('[AdminAPI] Dashboard stats error:', error);
      // Fallback to mock data
      return {
        total_users: 1250,
        active_today: 89,
        total_matches: 3420,
        total_revenue: 15420,
        pending_reports: 12,
      };
    }
  },

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return fetchAdmin<{ status: string; timestamp: string }>("/health");
  },

  // User Management Functions
  async banUser(userId: string, reason: string, days?: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_bans')
        .insert({
          user_id: userId,
          reason: reason,
          banned_until: days ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString() : null,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('[AdminAPI] Ban user error:', error);
        throw new Error('Failed to ban user');
      }

      console.log('[AdminAPI] User banned successfully:', userId);
    } catch (error) {
      console.error('[AdminAPI] Ban user error:', error);
      throw error;
    }
  },

  async creditCoins(userId: string, amount: number, reason: string): Promise<void> {
    try {
      // Önce kullanıcının mevcut coin'ini al
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('coins')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        console.error('[AdminAPI] Get profile error:', profileError);
        throw new Error('Failed to get user profile');
      }

      const newCoins = (profile?.coins || 0) + amount;

      // Coin'i güncelle
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ coins: newCoins })
        .eq('user_id', userId);

      if (updateError) {
        console.error('[AdminAPI] Update coins error:', updateError);
        throw new Error('Failed to update coins');
      }

      // Transaction log ekle
      const { error: logError } = await supabase
        .from('coin_transactions')
        .insert({
          user_id: userId,
          amount: amount,
          type: 'admin_credit',
          reason: reason,
          created_at: new Date().toISOString()
        });

      if (logError) {
        console.warn('[AdminAPI] Transaction log error:', logError);
      }

      console.log('[AdminAPI] Coins credited successfully:', userId, amount);
    } catch (error) {
      console.error('[AdminAPI] Credit coins error:', error);
      throw error;
    }
  },

  async verifyUser(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: true, verified_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) {
        console.error('[AdminAPI] Verify user error:', error);
        throw new Error('Failed to verify user');
      }

      console.log('[AdminAPI] User verified successfully:', userId);
    } catch (error) {
      console.error('[AdminAPI] Verify user error:', error);
      throw error;
    }
  },

  async getLogs(params?: { limit?: number }): Promise<AdminLog[]> {
    const limit = params?.limit ?? 100;
    const endpoint = `/logs?limit=${encodeURIComponent(String(limit))}`;
    return fetchAdminSafe<AdminLog[]>(endpoint, { method: 'GET' }, []);
  },

  async getFooter(): Promise<FooterContent[]> {
    // Primary: tRPC backend
    try {
      const rows = await trpcClient.policies.listFooter.query({ locale: 'en' });
      return rows.map((p) => ({
        id: p.slug,
        section_name: p.title,
        language: 'en',
        order_index: 100,
        is_active: true,
      }));
    } catch (e) {
      console.warn('[adminApi] tRPC policies.listFooter failed, trying Edge/public', e);
    }

    // Fallback: Edge function
    const edge = await fetchAdminSafe<FooterContent[]>(`/footer`, { method: 'GET' }, []);
    if (edge.length > 0) return edge;

    // Final fallback: synthesize from public policies if available
    try {
      const pols = await fetchAdminSafe<any[]>(`/public/policies`, { method: 'GET' }, []);
      return pols.map((p) => ({
        id: p.id ?? p.slug ?? String(Math.random()),
        section_name: p.title ?? 'Policy',
        language: p.locale ?? 'en',
        order_index: typeof p.sort_order === 'number' ? p.sort_order : 100,
        is_active: p.show_in_footer ?? true,
      })) as FooterContent[];
    } catch (e) {
      console.warn('[adminApi] getFooter synth fallback failed', e);
      return [];
    }
  },

  async getPolicies(): Promise<Policy[]> {
    // Primary: tRPC backend
    try {
      const rows = await trpcClient.policies.listPublic.query({ locale: 'en' });
      return rows.map((r) => ({
        id: r.id,
        title: r.title,
        policy_type: r.category ?? 'legal',
        language: r.locale,
        version: r.version,
        is_active: r.status === 'published',
        requires_consent: r.required_ack,
      }));
    } catch (e) {
      console.warn('[adminApi] tRPC policies.listPublic failed, trying Edge', e);
    }

    // Fallback: Edge
    const rows = await fetchAdminSafe<any[]>(`/public/policies`, { method: 'GET' }, []);
    return rows.map((r) => ({
      id: r.id ?? r.slug ?? String(Math.random()),
      title: r.title ?? 'Policy',
      policy_type: r.category ?? 'legal',
      language: r.locale ?? 'en',
      version: typeof r.version === 'number' ? r.version : 1,
      is_active: r.status ? r.status === 'published' : true,
      requires_consent: Boolean(r.required_ack ?? false),
    })) as Policy[];
  },

  async banUser(userId: string, reason: string, durationDays?: number): Promise<{ success: boolean }> {
    await trpcClient.admin.users.ban.mutate({ userId, reason, durationDays });
    return { success: true };
  },

  async verifyUser(userId: string): Promise<{ success: boolean }> {
    await trpcClient.admin.users.verify.mutate({ userId });
    return { success: true };
  },

  async getUserProfile(userId: string): Promise<AdminUserProfile> {
    const res = await trpcClient.admin.users.getProfile.query({ userId });
    return res as unknown as AdminUserProfile;
  },

  async updateUserProfile(payload: Partial<AdminUserProfile> & { userId: string; email?: string | undefined }): Promise<{ success: boolean }> {
    await trpcClient.admin.users.updateProfile.mutate(payload as any);
    return { success: true };
  },

  async creditWallet(_userId: string, _amount: number, _reason: string): Promise<{ success: boolean }> {
    throw new Error('Coin credit via Admin UI is not available in this build');
  },

  async getAgencies(params?: { status?: 'pending' | 'approved' | 'rejected'; limit?: number }): Promise<AgencyApplication[]> {
    const limit = params?.limit ?? 100;
    const status = params?.status ?? 'pending';
    const endpoint = `/agencies?status=${encodeURIComponent(status)}&limit=${encodeURIComponent(String(limit))}`;
    return fetchAdminSafe<AgencyApplication[]>(endpoint, { method: 'GET' }, []);
  },

  async setAgencyStatus(id: string, status: 'approved' | 'rejected', notes?: string): Promise<{ success: boolean }> {
    const endpoint = `/agencies/${encodeURIComponent(id)}/status`;
    const body = { status, notes } as const;
    const res = await fetchAdminSafe<{ success: boolean; error?: string }>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    }, { success: false });
    if (!res.success) {
      console.warn('[adminApi] setAgencyStatus fallback: returning success=false');
    }
    return { success: !!res.success };
  },

  async getUsers(params: { limit: number; offset?: number; query?: string }): Promise<AdminUsersListResponse> {
    const limit = params.limit ?? 25;
    const offset = params.offset ?? 0;
    const search = params.query ?? undefined;
    const res = await trpcClient.admin.users.list.query({ limit, offset, search });
    return res as unknown as AdminUsersListResponse;
  },

  async searchUsers(query: string, limit: number = 10): Promise<AdminUser[]> {
    try {
      const res = await trpcClient.admin.users.list.query({ 
        limit, 
        offset: 0, 
        search: query.trim() 
      });
      return (res as any).users || [];
    } catch (e) {
      console.warn('[adminApi] searchUsers fallback → returning empty', e);
      return [];
    }
  },

  async getPayments(params?: { status?: 'succeeded' | 'failed' | 'pending'; limit?: number }): Promise<PaymentTransaction[]> {
    const limit = params?.limit ?? 100;
    try {
      const list = await trpcClient.purchases.list.query({ limit, offset: 0 });
      const mapped: PaymentTransaction[] = (list as any).transactions.map((t: any) => ({
        id: String(t.id),
        amount_cent: typeof t.amount === 'number' ? Math.round(t.amount * 100) : Number(t.amount ?? 0) * 100,
        currency: String(t.currency ?? 'usd'),
        sku: (t.package_id ?? null) as string | null,
        provider: (t.payment_method ?? null) as string | null,
        status: String(t.status ?? 'succeeded'),
        created_at: String(t.created_at ?? new Date().toISOString()),
      }));
      const filtered = params?.status ? mapped.filter(m => m.status === params.status) : mapped;
      return filtered;
    } catch (e) {
      console.warn('[adminApi] getPayments fallback → returning empty', e);
      return [];
    }
  },
};
