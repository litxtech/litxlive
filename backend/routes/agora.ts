import { Hono } from 'hono';
import { RtcTokenBuilder, RtcRole } from 'agora-access-token';

const app = new Hono();

app.get('/rtc-token', (c) => {
  try {
    const channelName = c.req.query('channelName');
    const uid = c.req.query('uid');

    console.log('🎥 Agora Token Request:', { channelName, uid });

    if (!channelName || !uid) {
      console.error('❌ Missing parameters');
      return c.json({ error: 'channelName and uid are required' }, 400);
    }

    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    console.log('🔑 Agora Credentials:', {
      appId: appId ? `${appId.substring(0, 8)}...` : 'MISSING',
      certificate: appCertificate ? `${appCertificate.substring(0, 8)}...` : 'MISSING'
    });

    if (!appId || !appCertificate) {
      console.error('❌ Agora credentials not configured');
      return c.json({ error: 'Agora credentials not configured' }, 500);
    }

    const role = RtcRole.PUBLISHER;
    const expireTime = 3600;
    const now = Math.floor(Date.now() / 1000);
    const privilegeExpire = now + expireTime;

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      parseInt(uid),
      role,
      privilegeExpire
    );

    console.log('✅ Token generated successfully:', {
      channelName,
      uid,
      tokenLength: token.length,
      expiresIn: expireTime
    });

    return c.json({
      success: true,
      token,
      channelName,
      uid: parseInt(uid),
      appId,
      expiresIn: expireTime,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Token generation failed:', error);
    return c.json({ error: 'Failed to generate token', details: String(error) }, 500);
  }
});

export default app;
