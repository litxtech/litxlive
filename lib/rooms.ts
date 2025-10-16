import { supabase } from '@/lib/supabase';

export interface CreateRoomInput {
  name: string;
  description: string | null;
  max_participants: number;
  is_private: boolean;
  password: string | null;
  category: string | null;
  settings: Record<string, unknown>;
}

export interface RoomRecord {
  id: string;
  name: string;
  description: string | null;
  max_participants: number;
  is_private: boolean;
  password: string | null;
  category: string | null;
  created_by: string;
  created_at: string;
  updated_at?: string | null;
  settings: Record<string, unknown>;
}

export async function createRoom(input: CreateRoomInput): Promise<RoomRecord> {
  console.log('[rooms.createRoom] called with', input);
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) {
    console.error('[rooms.createRoom] Not authenticated');
    throw new Error('Oturum bulunamadı. Lütfen giriş yapın.');
  }

  const { data, error } = await supabase
    .from('rooms')
    .insert([
      {
        name: input.name,
        description: input.description,
        max_participants: input.max_participants,
        is_private: input.is_private,
        password: input.password,
        category: input.category,
        created_by: userId,
        settings: input.settings,
      },
    ])
    .select('*')
    .single();

  if (error || !data) {
    console.error('[rooms.createRoom] insert rooms error', error);
    throw new Error(error?.message ?? 'Oda oluşturulamadı');
  }

  const room = data as unknown as RoomRecord;

  const { error: partErr } = await supabase
    .from('room_participants')
    .insert([
      { room_id: room.id, user_id: userId, role: 'host', is_muted: false, is_video_enabled: false },
    ]);

  if (partErr) {
    console.error('[rooms.createRoom] insert room_participants error', partErr);
    throw new Error(partErr.message ?? 'Oda oluşturuldu ancak host kaydı eklenemedi');
  }

  console.log('[rooms.createRoom] success', room.id);
  return room;
}

export async function joinRoom(
  roomId: string,
  role: 'self' | 'listener' | 'speaker' | 'host' = 'self',
  password?: string | null,
): Promise<{ joined: boolean }>{
  console.log('[rooms.joinRoom] attempting join', { roomId, role });
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) {
    throw new Error('Giriş gerekli');
  }

  const { data: room, error: roomErr } = await supabase
    .from('rooms')
    .select('id, is_private, password, max_participants')
    .eq('id', roomId)
    .maybeSingle();

  if (roomErr || !room) {
    console.error('[rooms.joinRoom] room fetch error', roomErr);
    throw new Error(roomErr?.message ?? 'Oda bulunamadı');
  }

  if (room.is_private) {
    const ok = (password ?? '') === (room.password ?? '');
    if (!ok) {
      throw new Error('Şifre hatalı');
    }
  }

  const { data: countData } = await supabase
    .from('room_participants')
    .select('id', { count: 'exact', head: true })
    .eq('room_id', roomId)
    .is('left_at', null);

  const count = (countData as unknown as { length?: number } | null)?.length ?? 0;
  if (typeof room.max_participants === 'number' && count >= room.max_participants) {
    throw new Error('Oda dolu');
  }

  const roleToInsert = role === 'self' ? 'listener' : role;

  const { error: insertErr } = await supabase
    .from('room_participants')
    .insert([{ room_id: roomId, user_id: userId, role: roleToInsert, is_muted: false, is_video_enabled: false }]);

  if (insertErr) {
    console.error('[rooms.joinRoom] insert error', insertErr);
    throw new Error(insertErr.message ?? 'Odaya katılım başarısız');
  }

  return { joined: true };
}
