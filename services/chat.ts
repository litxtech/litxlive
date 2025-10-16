import { supabase } from '@/lib/supabase';
import type { UUID, Message } from '@/types/db';

export async function sendMessage(convId: UUID, senderId: UUID, content: string) {
  const { data, error } = await supabase
    .from('messages')
    .insert({ conv_id: convId, sender_id: senderId, content })
    .select()
    .single();
  if (error) throw error;
  return data;
}
