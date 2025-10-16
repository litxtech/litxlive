// services/matchService.ts
import { supabase } from './supabase'

export interface JoinVideoRoomParams {
  roomId: string
  preferredRole?: 'host' | 'audience'
}

export interface JoinedRoomInfo {
  roomId: string
  channelName: string
  uid: number
  token: string
}

export async function enqueueForMatch() {
  const { data: { user }, error: uerr } = await supabase.auth.getUser()
  if (uerr || !user) throw uerr ?? new Error('Not authenticated')
  const { error } = await supabase.rpc('enqueue_for_match')
  if (error) throw error
}

export async function waitForMatch(timeoutMs: number = 25_000): Promise<any> {
  const { data: { user }, error: uerr } = await supabase.auth.getUser()
  if (uerr || !user) throw uerr ?? new Error('No user')
  const me = user.id
  {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .or(`a_user_id.eq.${me},b_user_id.eq.${me}`)
      .eq('status', 'matched')
      .order('created_at', { ascending: false })
      .limit(1)
    if (!error && data && data.length) return data[0]
  }
  return new Promise<any>((resolve, reject) => {
    const timer = setTimeout(() => {
      supabase.removeChannel(ch); reject(new Error('match-timeout'))
    }, timeoutMs)
    const ch = supabase
      .channel('match-capture')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'matches' },
        (payload: any) => {
          const row = payload.new
          if (!row) return
          if (row.status === 'matched' && (row.a_user_id === me || row.b_user_id === me)) {
            clearTimeout(timer)
            supabase.removeChannel(ch)
            resolve(row)
          }
        }
      ).subscribe()
  })
}

export async function operatorPopAndMatchOnce() {
  const { data, error } = await supabase.rpc('pop_and_match')
  if (error) throw error
  return data
}

export async function joinVideoRoom(params: JoinVideoRoomParams): Promise<JoinedRoomInfo> {
  const { roomId, preferredRole } = params
  const { data: { user }, error: uerr } = await supabase.auth.getUser()
  if (uerr || !user) throw uerr ?? new Error('Not authenticated')
  const uid = Math.floor(Math.random() * 10_000_000)
  const base = process.env.EXPO_PUBLIC_API_URL ?? ''
  const url = `${base}/agora/rtc-token?channelName=${encodeURIComponent(roomId)}&uid=${uid}${preferredRole ? `&role=${preferredRole}` : ''}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`rtc-token-failed:${res.status}`)
  const json: { token?: string } = await res.json()
  const token = json.token ?? ''
  if (!token) throw new Error('rtc-token-empty')
  return { roomId, channelName: roomId, uid, token }
}

export async function startMatch(userId: string): Promise<{ status: 'queued' | 'matched' | 'error'; room?: string; error?: string }> {
  try {
    console.log('[matchService] startMatch for', userId)
    await enqueueForMatch()
    return { status: 'queued' }
  } catch (e: any) {
    return { status: 'error', error: e?.message || 'failed' }
  }
}

