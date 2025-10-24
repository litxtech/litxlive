import { supabase } from './supabase'

type PresenceUpdate = {
  in_call?: boolean
  [key: string]: unknown
}

async function ensureMyPresenceRow() {
  const { data: authData, error: uerr } = await supabase.auth.getUser()
  if (uerr || !authData?.user) throw uerr ?? new Error('No user')
  const { error } = await supabase
    .from('presence')
    .upsert({ user_id: authData.user.id, in_call: false }, { onConflict: 'user_id', ignoreDuplicates: false })
  if (error) throw error
}

async function setInCall(flag: boolean) {
  const { data: authData, error: uerr } = await supabase.auth.getUser()
  if (uerr || !authData?.user) throw uerr ?? new Error('No user')
  const { error } = await supabase.from('presence').update({ in_call: flag }).eq('user_id', authData.user.id)
  if (error) throw error
}

function onPresenceChange(
  handler: (payload: { user_id: string; in_call: boolean; last_seen: string }) => void,
) {
  const channel = supabase
    .channel('presence-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'presence' }, (p: any) => handler(p.new ?? p.old))
    .subscribe()
  return () => supabase.removeChannel(channel)
}

async function updatePresence(userId: string, data: PresenceUpdate) {
  try {
    const payload: { user_id: string; in_call?: boolean } = { user_id: userId }
    if (typeof data.in_call === 'boolean') payload.in_call = data.in_call
    const { error } = await supabase.from('presence').upsert(payload, { onConflict: 'user_id', ignoreDuplicates: false })
    if (error) throw error
    return { success: true as const }
  } catch (e: any) {
    console.error('[PresenceService] Update presence error:', e?.message || e)
    return { success: false as const, error: e?.message || 'update-failed' }
  }
}

async function joinMatchQueue(_userId: string, tags: string[], lang: string, preferences?: any) {
  try {
    await updatePresence(_userId, { in_call: false })
    
    // Direct insert instead of RPC to avoid queued_at column issue
    const { error } = await supabase
      .from('match_queue')
      .insert({
        user_id: _userId,
        preferences: preferences || {},
        status: 'waiting'
      })
    
    if (error) throw error
    return { success: true as const }
  } catch (e: any) {
    console.error('[PresenceService] Join queue error:', e?.message || e)
    return { success: false as const, error: e?.message || 'join-queue-failed' }
  }
}

async function leaveMatchQueue(_userId: string) {
  try {
    // Direct delete instead of RPC
    const { error } = await supabase
      .from('match_queue')
      .delete()
      .eq('user_id', _userId)
    
    if (error) throw error
    return { success: true as const }
  } catch (e: any) {
    console.error('[PresenceService] Leave queue error:', e?.message || e)
    return { success: false as const, error: e?.message || 'leave-queue-failed' }
  }
}

async function findMatch(myUserId: string, _lang: string, _tags: string[], preferences?: any) {
  try {
    console.log('[PresenceService] Find match with preferences:', preferences);
    
    // Build query with filters
    let query = supabase
      .from('profiles')
      .select('id, display_name, avatar_url, gender, bio, coins, is_vip, is_verified, country')
      .neq('id', myUserId)
      .eq('is_active', true);

    // Apply gender filter
    if (preferences?.gender && preferences.gender !== 'all' && preferences.gender !== 'mixed') {
      query = query.eq('gender', preferences.gender);
    }

    // Apply country filter
    if (preferences?.country && preferences.country !== 'all') {
      query = query.eq('country', preferences.country);
    }

    // Apply VIP filter
    if (preferences?.vipFilter === 'vip_only') {
      query = query.eq('is_vip', true);
    }

    // Apply verification filter
    if (preferences?.verificationFilter === 'yellow') {
      query = query.eq('is_verified', true);
    } else if (preferences?.verificationFilter === 'blue') {
      query = query.eq('is_verified', true); // Blue tick için aynı mantık
    }

    // Apply online filter
    if (preferences?.onlineFilter === 'online_only') {
      query = query.eq('online_status', true);
    }

    const { data, error } = await query.limit(10);
    
    if (error) {
      console.error('[PresenceService] Query error:', error);
      throw error;
    }
    
    console.log('[PresenceService] Found matches:', data?.length || 0);
    
    if (data && data.length > 0) {
      // Return the first available match
      const match = data[0];
      return {
        success: true as const,
        match: {
          user_id: match.id,
          display_name: match.display_name,
          avatar_url: match.avatar_url,
          gender: match.gender,
          bio: match.bio,
          coins: match.coins,
          is_vip: match.is_vip,
          is_verified: match.is_verified,
          country: match.country
        }
      };
    }

    return { success: false as const };
  } catch (e: any) {
    console.error('[PresenceService] Find match error:', e?.message || e);
    return { success: false as const, error: e?.message || 'find-match-failed' };
  }
}

export const presenceService = {
  ensureMyPresenceRow,
  setInCall,
  onPresenceChange,
  updatePresence,
  joinMatchQueue,
  leaveMatchQueue,
  findMatch,
}

export type PresenceServiceType = typeof presenceService
