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
    const { error } = await supabase.rpc('enqueue_for_match')
    if (error) throw error
    return { success: true as const }
  } catch (e: any) {
    console.error('[PresenceService] Join queue error:', e?.message || e)
    return { success: false as const, error: e?.message || 'join-queue-failed' }
  }
}

async function leaveMatchQueue(_userId: string) {
  try {
    const { error } = await supabase.rpc('leave_match_queue')
    if (error) throw error
    return { success: true as const }
  } catch (e: any) {
    console.error('[PresenceService] Leave queue error:', e?.message || e)
    return { success: false as const, error: e?.message || 'leave-queue-failed' }
  }
}

async function findMatch(myUserId: string, _lang: string, _tags: string[], preferences?: any) {
  try {
    // First, get user's preferences from profile
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('gender, country, orientation')
      .eq('id', myUserId)
      .single();

    // Build query with filters
    let query = supabase
      .from('profiles')
      .select('id, display_name, avatar_url, gender, country, online_status')
      .neq('id', myUserId)
      .eq('online_status', true)
      .eq('discoverable', true);

    // Apply gender filter
    if (preferences?.gender && preferences.gender !== 'all') {
      if (preferences.gender === 'mixed') {
        // For mixed, show both genders
        query = query.in('gender', ['male', 'female']);
      } else {
        query = query.eq('gender', preferences.gender);
      }
    }

    // Apply country filter
    if (preferences?.country && preferences.country !== 'all') {
      // Support for new country codes
      const supportedCountries = ['TR', 'PH', 'VE', 'CO', 'BR', 'PK', 'VN', 'EG', 'SY', 'MY', 'IN'];
      if (supportedCountries.includes(preferences.country)) {
        query = query.eq('country', preferences.country);
      } else if (preferences.country === 'EU') {
        // European countries
        query = query.in('country', ['DE', 'FR', 'ES', 'IT', 'NL', 'GB']);
      } else {
        query = query.eq('country', preferences.country);
      }
    }

    const { data, error } = await query.limit(10);
    
    if (error) throw error;
    
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
