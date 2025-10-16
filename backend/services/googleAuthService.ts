export class GoogleAuthService {
  generateAuthUrl() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    
    console.log('[GoogleAuth] Checking credentials...');
    console.log('[GoogleAuth] Client ID exists:', !!clientId);
    console.log('[GoogleAuth] Redirect URI exists:', !!redirectUri);
    
    if (!clientId || !redirectUri || 
        clientId === 'your_google_client_id.apps.googleusercontent.com' ||
        clientId.includes('your_') ||
        clientSecret === 'GOCSPX-your_google_client_secret') {
      console.error('[GoogleAuth] ⚠️  Google OAuth credentials not configured properly');
      console.error('[GoogleAuth] 🔑 Please configure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI in .env');
      console.error('[GoogleAuth] Current GOOGLE_CLIENT_ID:', clientId ? clientId.substring(0, 20) + '...' : 'NOT SET');
      console.error('[GoogleAuth] Current GOOGLE_REDIRECT_URI:', redirectUri || 'NOT SET');
      throw new Error('Google OAuth is not configured. Please contact support or use email/phone authentication.');
    }
    
    console.log('[GoogleAuth] Generating auth URL with redirect:', redirectUri);
    
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'openid',
      ].join(' '),
    });
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    console.log('[GoogleAuth] Generated auth URL');
    return authUrl;
  }

  async getToken(code: string) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    
    if (!clientId || !clientSecret || !redirectUri ||
        clientId === 'your_google_client_id.apps.googleusercontent.com' ||
        clientSecret === 'GOCSPX-your_google_client_secret') {
      console.error('[GoogleAuth] ⚠️  Google OAuth credentials not configured');
      throw new Error('Google OAuth is not configured');
    }
    
    console.log('[GoogleAuth] Exchanging code for token');
    
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error('[GoogleAuth] Token exchange error:', errorData);
      throw new Error('Failed to exchange Google authorization code');
    }
    
    console.log('[GoogleAuth] Token exchange successful');
    return (await res.json()) as { access_token: string; id_token?: string };
  }

  async verifyToken(idToken: string) {
    console.log('[GoogleAuth] Verifying ID token');
    
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error('[GoogleAuth] Token verification error:', errorData);
      throw new Error('Invalid Google ID token');
    }
    
    const payload = (await res.json()) as any;
    
    console.log('[GoogleAuth] Token verified successfully for:', payload?.email);
    
    return {
      email: payload?.email ?? '',
      name: payload?.name ?? payload?.given_name ?? '',
      picture: payload?.picture ?? '',
      googleId: payload?.sub ?? '',
      emailVerified: payload?.email_verified === 'true' || payload?.email_verified === true,
    };
  }
}

export const googleAuthService = new GoogleAuthService();
