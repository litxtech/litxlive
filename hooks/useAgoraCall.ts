import { useEffect, useState } from 'react';
import { fetchAgoraToken } from '@/services/agora';

export function useAgoraCall(room: string, uid: string | number) {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [appId, setAppId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const result = await fetchAgoraToken(room, uid);
        if (mounted) {
          setToken(result.token);
          setAppId(result.appId);
          setReady(true);
        }
      } catch (error) {
        console.error('Failed to fetch Agora token:', error);
      }
    })();
    return () => { 
      mounted = false;
    };
  }, [room, uid]);

  return { ready, token, appId };
}
