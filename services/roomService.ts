import { supabase } from '@/lib/supabase';

interface Room {
  room_id: string;
  user_a_id: string;
  user_b_id: string;
  created_at: string;
  expires_at: string;
}

interface RoomResult {
  success: boolean;
  room?: Room;
  error?: string;
}

class RoomService {
  async createRoom(
    userAId: string,
    userBId: string,
    durationMinutes: number = 60
  ): Promise<RoomResult> {
    try {
      console.log('[RoomService] Creating room:', { userAId, userBId, durationMinutes });

      const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + durationMinutes * 60 * 1000);

      const { data, error } = await supabase
        .from('rooms')
        .insert({
          room_id: roomId,
          a_id: userAId,
          b_id: userBId,
          started_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          status: 'connected',
        })
        .select()
        .single();

      if (error) {
        console.error('[RoomService] Create room error:', error.message || JSON.stringify(error));
        return { success: false, error: error.message || 'Failed to create room' };
      }

      return {
        success: true,
        room: data,
      };
    } catch (error: any) {
      console.error('[RoomService] Create room error:', error?.message || String(error));
      return { success: false, error: error?.message || 'Failed to create room' };
    }
  }

  async getRoom(roomId: string): Promise<RoomResult> {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('room_id', roomId)
        .single();

      if (error) {
        console.error('[RoomService] Get room error:', error.message || JSON.stringify(error));
        return { success: false, error: error.message || 'Failed to get room' };
      }

      return {
        success: true,
        room: data,
      };
    } catch (error: any) {
      console.error('[RoomService] Get room error:', error?.message || String(error));
      return { success: false, error: error?.message || 'Failed to get room' };
    }
  }

  async endRoom(roomId: string): Promise<void> {
    try {
      console.log('[RoomService] Ending room:', roomId);

      const { error } = await supabase
        .from('rooms')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('room_id', roomId);

      if (error) {
        console.error('[RoomService] End room error:', error.message || JSON.stringify(error));
      }
    } catch (error: any) {
      console.error('[RoomService] End room error:', error?.message || String(error));
    }
  }
}

export const roomService = new RoomService();
