export class SmsService {
  private readonly brandName = 'LITX Live';
  private readonly domain = process.env.DOMAIN ?? 'litxtechuk.com';

  async sendVerificationSms(phoneNumber: string, verificationCode: string, locale: string = 'en') {
    try {
      console.log(`[SMS] Sending verification to ${phoneNumber}, code: ${verificationCode}`);
      
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const message = locale === 'tr'
        ? `${this.brandName}: Dogrulama kodun: ${verificationCode}. 5 dk gecerli. Kodu kimseyle paylasma.`
        : `${this.brandName}: Your verification code is ${verificationCode}. Valid for 5 minutes. Do not share.`;
      
      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER ||
          process.env.TWILIO_ACCOUNT_SID === 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx') {
        console.warn('[SMS] ⚠️  Twilio credentials not configured. SMS will NOT be sent.');
        console.log(`[SMS] ========================================`);
        console.log(`[SMS] TO: ${formattedPhone}`);
        console.log(`[SMS] MESSAGE: ${message}`);
        console.log(`[SMS] ✅ VERIFICATION CODE: ${verificationCode}`);
        console.log(`[SMS] ========================================`);
        console.log(`[SMS] 📱 Configure Twilio credentials in .env to send real SMS`);
        return { success: true as const, message: 'Verification SMS sent (dev mode - check console)' };
      }
      
      const res = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + process.env.TWILIO_ACCOUNT_SID + '/Messages.json', {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + Buffer.from((process.env.TWILIO_ACCOUNT_SID + ':' + process.env.TWILIO_AUTH_TOKEN)).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          Body: message,
          From: process.env.TWILIO_PHONE_NUMBER,
          To: formattedPhone,
        }).toString(),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('[SMS] Twilio error:', errorData);
        throw new Error(`Twilio error: ${res.status}`);
      }
      
      console.log('[SMS] Verification SMS sent successfully');
      return { success: true as const, message: 'Verification SMS sent' };
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error('[SMS] Error sending SMS:', err);
      return { success: false as const, message: 'SMS could not be sent: ' + (err?.message ?? 'unknown') };
    }
  }

  async sendWelcomeSms(phoneNumber: string, userName: string, locale: string = 'en', bonusCoins: number = 100) {
    try {
      console.log(`[SMS] Sending welcome to ${phoneNumber}`);
      
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const appUrl = `https://${this.domain}`;
      const message = locale === 'tr'
        ? `${this.brandName}: Kaydin tamam. ${bonusCoins} coin hediye! Profil: ${appUrl}`
        : `${this.brandName}: Registration complete. ${bonusCoins} coins gift! Profile: ${appUrl}`;
      
      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER ||
          process.env.TWILIO_ACCOUNT_SID === 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx') {
        console.warn('[SMS] ⚠️  Twilio credentials not configured. SMS will NOT be sent.');
        console.log(`[SMS] ========================================`);
        console.log(`[SMS] TO: ${formattedPhone}`);
        console.log(`[SMS] MESSAGE: ${message}`);
        console.log(`[SMS] 🎉 WELCOME MESSAGE with ${bonusCoins} coins`);
        console.log(`[SMS] ========================================`);
        console.log(`[SMS] 📱 Configure Twilio credentials in .env to send real SMS`);
        return { success: true as const, message: 'Welcome SMS sent (dev mode - check console)' };
      }
      
      const res = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + process.env.TWILIO_ACCOUNT_SID + '/Messages.json', {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + Buffer.from((process.env.TWILIO_ACCOUNT_SID + ':' + process.env.TWILIO_AUTH_TOKEN)).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          Body: message,
          From: process.env.TWILIO_PHONE_NUMBER,
          To: formattedPhone,
        }).toString(),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('[SMS] Twilio error:', errorData);
        throw new Error(`Twilio error: ${res.status}`);
      }
      
      console.log('[SMS] Welcome SMS sent successfully');
      return { success: true as const, message: 'Welcome SMS sent' };
    } catch (error: unknown) {
      console.error('[SMS] Error sending welcome SMS:', error);
      return { success: false as const, message: 'Welcome SMS could not be sent' };
    }
  }

  private formatPhoneNumber(phoneNumber: string): string {
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    if (cleaned.startsWith('+')) {
      return cleaned;
    }
    
    if (!cleaned.startsWith('+')) {
      if (cleaned.startsWith('0')) {
        cleaned = '+90' + cleaned.substring(1);
      } else if (cleaned.startsWith('5') && cleaned.length === 10) {
        cleaned = '+90' + cleaned;
      } else if (!cleaned.startsWith('1') && !cleaned.startsWith('2') && !cleaned.startsWith('3')) {
        cleaned = '+' + cleaned;
      }
    }
    
    return cleaned;
  }
  
  async sendRateLimitSms(phoneNumber: string, locale: string = 'en') {
    const message = locale === 'tr'
      ? `${this.brandName}: Cok sik istek. 60 sn sonra tekrar dene.`
      : `${this.brandName}: Too many requests. Try again in 60 seconds.`;
    console.log(`[SMS] Rate limit message: ${message}`);
    return { success: true as const, message: 'Rate limit notification sent' };
  }
  
  async sendLockSms(phoneNumber: string, locale: string = 'en') {
    const message = locale === 'tr'
      ? `${this.brandName}: Guvenlik kilidi. 5 dk sonra tekrar dene.`
      : `${this.brandName}: Security lock. Try again in 5 minutes.`;
    console.log(`[SMS] Lock message: ${message}`);
    return { success: true as const, message: 'Lock notification sent' };
  }
}

export const smsService = new SmsService();
