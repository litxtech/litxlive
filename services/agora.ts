const FUNCTIONS_URL = process.env.EXPO_PUBLIC_FUNCTIONS_URL!;

export async function fetchAgoraToken(channel: string, uid: number | string) {
  const url = `${FUNCTIONS_URL}/agora-token`;
  const r = await fetch(url, { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify({ channel, uid }) 
  });
  if (!r.ok) throw new Error('agora token fail');
  return await r.json() as { token: string; appId: string; channel: string };
}
