import { supabase } from '@/lib/supabase';

export interface HealthCheck {
  name: string;
  status: 'ok' | 'warning' | 'fail';
  message: string;
  lastChecked: string;
  details?: Record<string, any>;
}

export interface SystemHealth {
  overall: 'ok' | 'warning' | 'fail';
  checks: HealthCheck[];
  lastUpdated: string;
}

class SystemHealthService {
  private healthCache: SystemHealth | null = null;
  private cacheExpiry: number = 0;
  private cacheDuration = 10000;

  async checkAuth(): Promise<HealthCheck> {
    try {
      if (!supabase) {
        return {
          name: 'Authentication',
          status: 'fail',
          message: 'Supabase not initialized',
          lastChecked: new Date().toISOString(),
        };
      }

      const { data, error } = await supabase.auth.getSession();

      if (error) {
        return {
          name: 'Authentication',
          status: 'fail',
          message: error.message,
          lastChecked: new Date().toISOString(),
        };
      }

      return {
        name: 'Authentication',
        status: 'ok',
        message: data.session ? 'Authenticated' : 'Not authenticated',
        lastChecked: new Date().toISOString(),
        details: {
          hasSession: !!data.session,
        },
      };
    } catch (error) {
      return {
        name: 'Authentication',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Auth check failed',
        lastChecked: new Date().toISOString(),
      };
    }
  }

  async checkRLS(): Promise<HealthCheck> {
    try {
      if (!supabase) {
        return {
          name: 'RLS (Row Level Security)',
          status: 'fail',
          message: 'Supabase not initialized',
          lastChecked: new Date().toISOString(),
        };
      }

      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (error) {
        if (error.code === 'PGRST301' || error.message.includes('permission')) {
          return {
            name: 'RLS (Row Level Security)',
            status: 'warning',
            message: 'RLS policies active (expected for unauthenticated)',
            lastChecked: new Date().toISOString(),
          };
        }

        return {
          name: 'RLS (Row Level Security)',
          status: 'fail',
          message: error.message,
          lastChecked: new Date().toISOString(),
        };
      }

      return {
        name: 'RLS (Row Level Security)',
        status: 'ok',
        message: 'RLS policies working correctly',
        lastChecked: new Date().toISOString(),
        details: {
          canQuery: true,
        },
      };
    } catch (error) {
      return {
        name: 'RLS (Row Level Security)',
        status: 'fail',
        message: error instanceof Error ? error.message : 'RLS check failed',
        lastChecked: new Date().toISOString(),
      };
    }
  }

  async checkPresence(): Promise<HealthCheck> {
    try {
      if (!supabase) {
        return {
          name: 'Presence System',
          status: 'fail',
          message: 'Supabase not initialized',
          lastChecked: new Date().toISOString(),
        };
      }

      const { data, error } = await supabase
        .from('presence')
        .select('user_id, online')
        .eq('online', true)
        .limit(10);

      if (error) {
        return {
          name: 'Presence System',
          status: 'fail',
          message: error.message,
          lastChecked: new Date().toISOString(),
        };
      }

      const onlineCount = data?.length || 0;

      return {
        name: 'Presence System',
        status: 'ok',
        message: `${onlineCount} users online`,
        lastChecked: new Date().toISOString(),
        details: {
          onlineUsers: onlineCount,
        },
      };
    } catch (error) {
      return {
        name: 'Presence System',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Presence check failed',
        lastChecked: new Date().toISOString(),
      };
    }
  }

  async checkMatchmaker(): Promise<HealthCheck> {
    try {
      if (!supabase) {
        return {
          name: 'Matchmaker',
          status: 'fail',
          message: 'Supabase not initialized',
          lastChecked: new Date().toISOString(),
        };
      }

      const { data, error } = await supabase
        .from('match_queue')
        .select('user_id')
        .limit(10);

      if (error) {
        return {
          name: 'Matchmaker',
          status: 'fail',
          message: error.message,
          lastChecked: new Date().toISOString(),
        };
      }

      const queueSize = data?.length || 0;

      return {
        name: 'Matchmaker',
        status: 'ok',
        message: `${queueSize} users in queue`,
        lastChecked: new Date().toISOString(),
        details: {
          queueSize,
        },
      };
    } catch (error) {
      return {
        name: 'Matchmaker',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Matchmaker check failed',
        lastChecked: new Date().toISOString(),
      };
    }
  }

  async checkRTC(): Promise<HealthCheck> {
    try {
      const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      const hasRTCPeerConnection = !!(window.RTCPeerConnection);

      if (!hasGetUserMedia || !hasRTCPeerConnection) {
        return {
          name: 'WebRTC',
          status: 'fail',
          message: 'WebRTC not supported in this browser',
          lastChecked: new Date().toISOString(),
          details: {
            getUserMedia: hasGetUserMedia,
            RTCPeerConnection: hasRTCPeerConnection,
          },
        };
      }

      return {
        name: 'WebRTC',
        status: 'ok',
        message: 'WebRTC supported',
        lastChecked: new Date().toISOString(),
        details: {
          getUserMedia: hasGetUserMedia,
          RTCPeerConnection: hasRTCPeerConnection,
        },
      };
    } catch (error) {
      return {
        name: 'WebRTC',
        status: 'fail',
        message: error instanceof Error ? error.message : 'RTC check failed',
        lastChecked: new Date().toISOString(),
      };
    }
  }

  async checkTranslation(): Promise<HealthCheck> {
    try {
      const testUrl = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=hello';
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(testUrl, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          name: 'Translation Service',
          status: 'warning',
          message: `API returned ${response.status}`,
          lastChecked: new Date().toISOString(),
        };
      }

      return {
        name: 'Translation Service',
        status: 'ok',
        message: 'Translation API accessible',
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          name: 'Translation Service',
          status: 'warning',
          message: 'Translation API timeout',
          lastChecked: new Date().toISOString(),
        };
      }

      return {
        name: 'Translation Service',
        status: 'warning',
        message: 'Translation API unavailable (non-critical)',
        lastChecked: new Date().toISOString(),
      };
    }
  }

  async checkFeedPublish(): Promise<HealthCheck> {
    try {
      if (!supabase) {
        return {
          name: 'Feed Publish',
          status: 'fail',
          message: 'Supabase not initialized',
          lastChecked: new Date().toISOString(),
        };
      }

      const { data, error } = await supabase
        .from('live_streams')
        .select('id, status')
        .eq('status', 'live')
        .limit(5);

      if (error) {
        return {
          name: 'Feed Publish',
          status: 'fail',
          message: error.message,
          lastChecked: new Date().toISOString(),
        };
      }

      const liveCount = data?.length || 0;

      return {
        name: 'Feed Publish',
        status: 'ok',
        message: `${liveCount} live streams`,
        lastChecked: new Date().toISOString(),
        details: {
          liveStreams: liveCount,
        },
      };
    } catch (error) {
      return {
        name: 'Feed Publish',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Feed check failed',
        lastChecked: new Date().toISOString(),
      };
    }
  }

  async runAllChecks(): Promise<SystemHealth> {
    const now = Date.now();

    if (this.healthCache && now < this.cacheExpiry) {
      return this.healthCache;
    }

    console.log('[SystemHealth] Running health checks...');

    const checks = await Promise.all([
      this.checkAuth(),
      this.checkRLS(),
      this.checkPresence(),
      this.checkMatchmaker(),
      this.checkRTC(),
      this.checkTranslation(),
      this.checkFeedPublish(),
    ]);

    const failCount = checks.filter(c => c.status === 'fail').length;
    const warningCount = checks.filter(c => c.status === 'warning').length;

    let overall: 'ok' | 'warning' | 'fail' = 'ok';
    if (failCount > 0) {
      overall = 'fail';
    } else if (warningCount > 0) {
      overall = 'warning';
    }

    const health: SystemHealth = {
      overall,
      checks,
      lastUpdated: new Date().toISOString(),
    };

    this.healthCache = health;
    this.cacheExpiry = now + this.cacheDuration;

    return health;
  }

  clearCache() {
    this.healthCache = null;
    this.cacheExpiry = 0;
  }
}

export const systemHealthService = new SystemHealthService();
