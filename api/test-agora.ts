import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const appID = process.env.AGORA_APP_ID;
  const cert = process.env.AGORA_APP_CERTIFICATE;
  
  res.status(200).json({
    hasAppId: !!appID,
    hasAppCert: !!cert,
    appIdLength: appID?.length || 0,
    certLength: cert?.length || 0,
    appIdPreview: appID ? `${appID.substring(0, 8)}...` : 'missing',
    certPreview: cert ? `${cert.substring(0, 8)}...` : 'missing',
  });
}
