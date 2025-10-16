import { supabase } from '@/lib/supabase';
import type { UUID, Match, Message } from '@/types/db';

export function subscribeMatchUpdates(matchId: UUID, onChange: (m: Match) => void) {
  const ch = supabase
    .channel(`match:${matchId}`)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` },
      payload => onChange(payload.new as Match)
    )
    .subscribe();

  return () => supabase.removeChannel(ch);
}

export function subscribeInbox(convId: UUID, onMessage: (m: Message) => void) {
  const ch = supabase
    .channel(`messages:${convId}`)
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `conv_id=eq.${convId}` },
      payload => onMessage(payload.new as Message)
    )
    .subscribe();

  return () => supabase.removeChannel(ch);
}
