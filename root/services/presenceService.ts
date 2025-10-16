import { supabase } from './supabase'

export async function ensureMyPresenceRow() {
  const { data: { user }, error: uerr } = await supabase.auth.getUser()
  if (uerr || !user) {
    console.error('[PresenceService] Auth error:', uerr)
    throw uerr ?? new Error('No user')
  }

  console.log('[PresenceService] Ensuring presence for user:', user.id)

  const { error } = await supabase
    .from('presence')
    .upsert(
      { user_id: user.id, in_call: false, last_seen: new Date().toISOString() },
      { onConflict: 'user_id', ignoreDuplicates: false }
    )

  if (error) {
    console.error('[PresenceService] Upsert error:', error)
    throw error
  }

  console.log('[PresenceService] Presence ensured successfully')
}

export async function setInCall(flag: boolean) {
  const { data: { user }, error: uerr } = await supabase.auth.getUser()
  if (uerr || !user) {
    console.error('[PresenceService] Auth error:', uerr)
    throw uerr ?? new Error('No user')
  }

  console.log('[PresenceService] Setting in_call to', flag, 'for user:', user.id)

  const { error } = await supabase
    .from('presence')
    .update({ in_call: flag, last_seen: new Date().toISOString() })
    .eq('user_id', user.id)

  if (error) {
    console.error('[PresenceService] Update presence error:', error)
    throw error
  }

  console.log('[PresenceService] In-call status updated successfully')
}

export function onPresenceChange(
  handler: (payload: { user_id: string; in_call: boolean; last_seen: string }) => void
) {
  const channel = supabase
    .channel('presence-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'presence' },
      (p: any) => {
        console.log('[PresenceService] Presence change:', p)
        handler(p.new ?? p.old)
      }
    )
    .subscribe()
  
  return () => {
    console.log('[PresenceService] Unsubscribing from presence changes')
    supabase.removeChannel(channel)
  }
}
