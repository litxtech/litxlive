import { supabase } from '@/lib/supabase';
import type { UUID } from '@/types/db';

export async function enqueueForMatch(
  userId: UUID,
  gender: string | null,
  want: string | null,
  locale: string | null,
  region: string | null,
  priority = 0
) {
  const { data: { user }, error: uerr } = await supabase.auth.getUser()
  if (uerr || !user) throw uerr ?? new Error('Not authenticated')
  
  const { error } = await supabase.rpc('enqueue_for_match');
  if (error) throw error;
}

export async function dequeueSelfIfAny(userId: UUID) {
  const { data, error } = await supabase
    .from('match_queue')
    .update({ status: 'cancelled' as any, dequeued_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('status', 'waiting')
    .select('id')
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

export async function popAndMatchServerSide() {
  const { data, error } = await supabase.rpc('pop_and_match');
  if (error) throw error;
  return data as { match_id: UUID; a_user: UUID; b_user: UUID; room: string }[] | null;
}

export async function findMyActiveMatch(userId: UUID) {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .or(`a_user_id.eq.${userId},b_user_id.eq.${userId}`)
    .in('status', ['matched','connected'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}
