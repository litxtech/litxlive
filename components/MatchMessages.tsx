import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { View } from 'react-native';

export type Message = {
  id: string;
  match_id: string;
  sender_id?: string | null;
  content?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
};

type Props = {
  matchId: string | null | undefined;
  onNewMessage?: (message: Message) => void;
  testID?: string;
};

export default function MatchMessages({ matchId, onNewMessage, testID }: Props) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!matchId) {
      if (channelRef.current) {
        try {
          supabase.removeChannel(channelRef.current);
        } catch (err) {
          console.log('[MatchMessages] removeChannel error (no matchId):', err);
        }
        channelRef.current = null;
      }
      return;
    }

    try {
      const channel = supabase
        .channel(`messages-for-match-${matchId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
          (payload) => {
            const msg = payload?.new as Message;
            console.log('[MatchMessages] New message payload:', msg);
            if (onNewMessage && typeof onNewMessage === 'function' && msg) {
              try {
                onNewMessage(msg);
              } catch (cbErr) {
                console.log('[MatchMessages] onNewMessage callback error:', cbErr);
              }
            }
          },
        )
        .subscribe((status) => {
          console.log('[MatchMessages] Channel status:', status);
        });

      channelRef.current = channel;
    } catch (err) {
      console.log('[MatchMessages] subscribe error:', err);
    }

    return () => {
      if (channelRef.current) {
        try {
          console.log('[MatchMessages] Cleaning up channel');
          supabase.removeChannel(channelRef.current);
        } catch (err) {
          console.log('[MatchMessages] removeChannel error on cleanup:', err);
        }
        channelRef.current = null;
      }
    };
  }, [matchId, onNewMessage]);

  return <View accessibilityLabel="match-messages-listener" testID={testID ?? 'match-messages-listener'} style={{ display: 'none' }} />;
}
