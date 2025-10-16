import { supabase } from './supabase'

export async function enqueueForMatch() {
  console.log('[MatchService] Enqueueing for match...')
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    console.error('[MatchService] Auth error:', authError)
    throw authError ?? new Error('Not authenticated')
  }

  console.log('[MatchService] User authenticated:', user.id)

  const { error } = await supabase.rpc('enqueue_for_match')
  
  if (error) {
    console.error('[MatchService] Enqueue error:', error)
    throw error
  }

  console.log('[MatchService] Successfully enqueued')
}

export async function waitForMatch(timeoutMs = 25_000) {
  const { data: { user }, error: uerr } = await supabase.auth.getUser()
  if (uerr || !user) {
    console.error('[MatchService] Auth error:', uerr)
    throw uerr ?? new Error('No user')
  }
  
  const me = user.id
  console.log('[MatchService] Waiting for match for user:', me)

  {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .or(`a_user_id.eq.${me},b_user_id.eq.${me}`)
      .eq('status', 'matched')
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (!error && data && data.length) {
      console.log('[MatchService] Found existing match:', data[0])
      return data[0]
    }
  }

  return new Promise<any>((resolve, reject) => {
    const timer = setTimeout(() => {
      console.log('[MatchService] Match timeout')
      supabase.removeChannel(ch)
      reject(new Error('match-timeout'))
    }, timeoutMs)

    const ch = supabase
      .channel('match-capture')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'matches' },
        (payload: any) => {
          console.log('[MatchService] Match event received:', payload)
          const row = payload.new
          if (!row) return
          if (row.status === 'matched' && (row.a_user_id === me || row.b_user_id === me)) {
            console.log('[MatchService] Match found!', row)
            clearTimeout(timer)
            supabase.removeChannel(ch)
            resolve(row)
          }
        }
      )
      .subscribe()
  })
}

export async function operatorPopAndMatchOnce() {
  console.log('[MatchService] Operator pop and match...')
  const { data, error } = await supabase.rpc('pop_and_match')
  if (error) {
    console.error('[MatchService] Pop and match error:', error)
    throw error
  }
  console.log('[MatchService] Pop and match result:', data)
  return data
}
