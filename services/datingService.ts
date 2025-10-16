import { supabase } from '@/lib/supabase';
import type { UUID, Profile, FeedProfile, Like, Match, Message } from '@/types/db';

class DatingService {
  async touchLastSeen(userId: UUID) {
    try {
      const { error } = await supabase.rpc('touch_last_seen');
      if (error) {
        console.error('[DatingService] Touch last seen error:', error);
      }
    } catch (error) {
      console.error('[DatingService] Touch last seen exception:', error);
    }
  }

  async updateOnlineStatus(userId: UUID, online: boolean) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          online_status: online,
          last_seen: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        console.error('[DatingService] Update online status error:', error);
      }
    } catch (error) {
      console.error('[DatingService] Update online status exception:', error);
    }
  }

  async getFeed(limit: number = 40): Promise<FeedProfile[]> {
    try {
      const { data, error } = await supabase.rpc('feed_opposite_gender', {
        p_limit: limit
      });

      if (error) {
        console.error('[DatingService] Get feed error:', error);
        return [];
      }

      return (data || []).map((profile: any) => ({
        ...profile,
        is_online: this.isOnline(profile.last_seen),
        last_seen_text: this.formatLastSeen(profile.last_seen)
      }));
    } catch (error) {
      console.error('[DatingService] Get feed exception:', error);
      return [];
    }
  }

  async getLiveFeed(limit: number = 50): Promise<FeedProfile[]> {
    try {
      const { data, error } = await supabase.rpc('feed_live_opposite_gender', {
        p_limit: limit
      });

      if (error) {
        console.error('[DatingService] Get live feed error:', error);
        return [];
      }

      return (data || []).map((profile: any) => ({
        ...profile,
        is_online: true,
        last_seen_text: 'Live now'
      }));
    } catch (error) {
      console.error('[DatingService] Get live feed exception:', error);
      return [];
    }
  }

  async likeUser(fromId: UUID, toId: UUID): Promise<{ success: boolean; matched: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('likes')
        .insert({ from_id: fromId, to_id: toId, status: 'like' });

      if (error) {
        const errorMsg = String(error.message || '');
        
        if (errorMsg.includes('Only opposite genders')) {
          return { success: false, matched: false, error: 'Can only match with opposite gender' };
        } else if (errorMsg.includes('duplicate key')) {
          return { success: false, matched: false, error: 'Already liked this user' };
        }
        
        console.error('[DatingService] Like user error:', error);
        return { success: false, matched: false, error: 'Failed to like user' };
      }

      const isMatched = await this.checkMatch(fromId, toId);

      if (isMatched) {
        await this.createMatch(fromId, toId);
        await this.createConversation(fromId, toId);
      }

      return { success: true, matched: isMatched };
    } catch (error) {
      console.error('[DatingService] Like user exception:', error);
      return { success: false, matched: false, error: 'Failed to like user' };
    }
  }

  async passUser(fromId: UUID, toId: UUID): Promise<{ success: boolean }> {
    try {
      const { error } = await supabase
        .from('likes')
        .insert({ from_id: fromId, to_id: toId, status: 'pass' });

      if (error) {
        console.error('[DatingService] Pass user error:', error);
        return { success: false };
      }

      return { success: true };
    } catch (error) {
      console.error('[DatingService] Pass user exception:', error);
      return { success: false };
    }
  }

  private async checkMatch(userA: UUID, userB: UUID): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('from_id', userB)
        .eq('to_id', userA)
        .eq('status', 'like')
        .maybeSingle();

      if (error) {
        console.error('[DatingService] Check match error:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('[DatingService] Check match exception:', error);
      return false;
    }
  }

  private async createMatch(userA: UUID, userB: UUID): Promise<void> {
    try {
      const { error } = await supabase
        .from('matches')
        .insert({ user_a: userA, user_b: userB });

      if (error) {
        console.error('[DatingService] Create match error:', error);
      }
    } catch (error) {
      console.error('[DatingService] Create match exception:', error);
    }
  }

  private async createConversation(userA: UUID, userB: UUID): Promise<void> {
    try {
      const { error } = await supabase
        .from('conversations')
        .insert({ user_a: userA, user_b: userB });

      if (error) {
        console.error('[DatingService] Create conversation error:', error);
      }
    } catch (error) {
      console.error('[DatingService] Create conversation exception:', error);
    }
  }

  async getMatches(userId: UUID): Promise<Profile[]> {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          profile_a:profiles!matches_user_a_fkey(*),
          profile_b:profiles!matches_user_b_fkey(*)
        `)
        .or(`user_a.eq.${userId},user_b.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[DatingService] Get matches error:', error);
        return [];
      }

      return (data || []).map((match: any) => {
        const otherProfile = match.user_a === userId ? match.profile_b : match.profile_a;
        return {
          ...otherProfile,
          is_online: this.isOnline(otherProfile.last_seen),
          last_seen_text: this.formatLastSeen(otherProfile.last_seen)
        };
      });
    } catch (error) {
      console.error('[DatingService] Get matches exception:', error);
      return [];
    }
  }

  async getConversations(userId: UUID): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          profile_a:profiles!conversations_user_a_fkey(*),
          profile_b:profiles!conversations_user_b_fkey(*)
        `)
        .or(`user_a.eq.${userId},user_b.eq.${userId}`)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) {
        console.error('[DatingService] Get conversations error:', error);
        return [];
      }

      return (data || []).map((conv: any) => {
        const otherProfile = conv.user_a === userId ? conv.profile_b : conv.profile_a;
        return {
          ...conv,
          other_user: {
            ...otherProfile,
            is_online: this.isOnline(otherProfile.last_seen),
            last_seen_text: this.formatLastSeen(otherProfile.last_seen)
          }
        };
      });
    } catch (error) {
      console.error('[DatingService] Get conversations exception:', error);
      return [];
    }
  }

  async sendMessage(convId: UUID, senderId: UUID, content: string): Promise<{ success: boolean }> {
    try {
      const { error } = await supabase
        .from('messages')
        .insert({ conv_id: convId, sender_id: senderId, content });

      if (error) {
        console.error('[DatingService] Send message error:', error);
        return { success: false };
      }

      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', convId);

      return { success: true };
    } catch (error) {
      console.error('[DatingService] Send message exception:', error);
      return { success: false };
    }
  }

  async getMessages(convId: UUID, limit: number = 50): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conv_id', convId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('[DatingService] Get messages error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[DatingService] Get messages exception:', error);
      return [];
    }
  }

  async blockUser(blockerId: UUID, blockedId: UUID): Promise<{ success: boolean }> {
    try {
      const { error } = await supabase
        .from('blocks')
        .insert({ blocker_id: blockerId, blocked_id: blockedId });

      if (error) {
        console.error('[DatingService] Block user error:', error);
        return { success: false };
      }

      return { success: true };
    } catch (error) {
      console.error('[DatingService] Block user exception:', error);
      return { success: false };
    }
  }

  async reportUser(reporterId: UUID, reportedId: UUID, reason: string): Promise<{ success: boolean }> {
    try {
      const { error } = await supabase
        .from('reports')
        .insert({ reporter_id: reporterId, reported_id: reportedId, reason });

      if (error) {
        console.error('[DatingService] Report user error:', error);
        return { success: false };
      }

      return { success: true };
    } catch (error) {
      console.error('[DatingService] Report user exception:', error);
      return { success: false };
    }
  }

  async startLiveStream(userId: UUID): Promise<{ success: boolean }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_live: true, 
          live_started_at: new Date().toISOString() 
        })
        .eq('user_id', userId);

      if (error) {
        console.error('[DatingService] Start live stream error:', error);
        return { success: false };
      }

      return { success: true };
    } catch (error) {
      console.error('[DatingService] Start live stream exception:', error);
      return { success: false };
    }
  }

  async stopLiveStream(userId: UUID): Promise<{ success: boolean }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_live: false })
        .eq('user_id', userId);

      if (error) {
        console.error('[DatingService] Stop live stream error:', error);
        return { success: false };
      }

      return { success: true };
    } catch (error) {
      console.error('[DatingService] Stop live stream exception:', error);
      return { success: false };
    }
  }

  subscribeToMessages(convId: UUID, callback: (message: Message) => void) {
    const channel = supabase
      .channel(`messages:${convId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conv_id=eq.${convId}`
        },
        (payload) => {
          callback(payload.new as Message);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  subscribeToFeed(callback: (profile: Profile) => void) {
    const channel = supabase
      .channel('feed-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            callback(payload.new as Profile);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  private isOnline(lastSeen: string): boolean {
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffSeconds = (now.getTime() - lastSeenDate.getTime()) / 1000;
    return diffSeconds < 60;
  }

  private formatLastSeen(lastSeen: string): string {
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - lastSeenDate.getTime()) / 1000);

    if (diffSeconds < 60) {
      return 'Online';
    } else if (diffSeconds < 3600) {
      const minutes = Math.floor(diffSeconds / 60);
      return `${minutes} min ago`;
    } else if (diffSeconds < 86400) {
      const hours = Math.floor(diffSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  }
}

export const datingService = new DatingService();
