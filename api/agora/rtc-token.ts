import type { VercelRequest, VercelResponse } from '@vercel/node';
import { RtcTokenBuilder, RtcRole } from 'agora-access-token';

export const config = {
  maxDuration: 10,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const startTime = Date.now();
  console.log('[RTC Token] Request started at:', new Date().toISOString());

  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Cache-Control', 'no-store');

    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    const payload = req.method === 'POST' ? req.body : req.query;
    const channel = String(payload?.channel || payload?.channelName || '').trim();
    const uidRaw = payload?.uid;
    const uid = typeof uidRaw === 'string' ? parseInt(uidRaw, 10) : Number(uidRaw || 0);

    console.log('[RTC Token] Params:', { channel, uid, method: req.method });

    if (!channel || channel === 'undefined' || channel === 'null') {
      return res.status(400).json({ error: 'channel is required' });
    }

    const appID = process.env.AGORA_APP_ID;
    const cert = process.env.AGORA_APP_CERTIFICATE;

    if (!appID || !cert) {
      console.error('[RTC Token] Missing credentials');
      return res.status(500).json({ error: 'Agora credentials not configured' });
    }

    const role = RtcRole.PUBLISHER;
    const expire = Math.floor(Date.now() / 1000) + 3600;
    const token = RtcTokenBuilder.buildTokenWithUid(appID, cert, channel, uid, role, expire);

    const duration = Date.now() - startTime;
    console.log(`[RTC Token] Success in ${duration}ms`);

    return res.status(200).json({
      success: true,
      token,
      expireAt: expire,
      channel,
      uid,
      appId: appID,
    });
  } catch (e: any) {
    const duration = Date.now() - startTime;
    console.error(`[RTC Token] Error after ${duration}ms:`, e.message);
    return res.status(500).json({ error: e?.message || 'Token generation failed' });
  }
}
