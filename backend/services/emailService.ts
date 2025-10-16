export class EmailService {
  private readonly fromEmail: string;
  private readonly brandName: string;
  private readonly domain: string;
  private readonly supportEmail: string;

  constructor() {
    this.fromEmail = 'noreply@litxtechuk.com';
    this.brandName = 'LITX Live';
    this.domain = process.env.DOMAIN ?? 'litxtechuk.com';
    this.supportEmail = 'support@litxtech.com';
  }

  async sendVerificationEmail(userEmail: string, verificationCode: string, userName: string = 'User', locale: string = 'en') {
    try {
      console.log(`[Email] Sending verification to ${userEmail}, code: ${verificationCode}`);
      
      const subject = locale === 'tr'
        ? `${this.brandName} - E-postanı doğrula`
        : `Verify your email — ${this.brandName}`;
      
      if (!process.env.SENDGRID_API_KEY || process.env.SENDGRID_API_KEY === 'SG.your_sendgrid_api_key_here') {
        console.warn('[Email] ⚠️  SendGrid API key not configured. Email will NOT be sent.');
        console.log(`[Email] ========================================`);
        console.log(`[Email] TO: ${userEmail}`);
        console.log(`[Email] SUBJECT: ${subject}`);
        console.log(`[Email] ✅ VERIFICATION CODE: ${verificationCode}`);
        console.log(`[Email] ========================================`);
        console.log(`[Email] 📧 Configure SENDGRID_API_KEY in .env to send real emails`);
        return { success: true as const, message: 'Verification email sent (dev mode - check console)' };
      }
      
      const apiKey = process.env.SENDGRID_API_KEY;
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: userEmail }],
              subject,
            },
          ],
          from: { email: this.fromEmail, name: this.brandName },
          content: [{ type: 'text/html', value: this.generateEmailTemplate(verificationCode, userName, locale) }],
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('[Email] SendGrid error:', errorData);
        throw new Error(`SendGrid error: ${res.status}`);
      }
      
      console.log('[Email] Verification email sent successfully');
      return { success: true as const, message: 'Verification email sent' };
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error('[Email] Error sending email:', err);
      return { success: false as const, message: 'Email could not be sent', error: err?.message ?? 'unknown' };
    }
  }

  async sendWelcomeEmail(userEmail: string, userName: string, locale: string = 'en', bonusCoins: number = 100) {
    try {
      console.log(`[Email] Sending welcome to ${userEmail}`);
      
      const subject = locale === 'tr'
        ? `${this.brandName}'e hoş geldin 🎉`
        : `Welcome to ${this.brandName} 🎉`;
      
      if (!process.env.SENDGRID_API_KEY || process.env.SENDGRID_API_KEY === 'SG.your_sendgrid_api_key_here') {
        console.warn('[Email] ⚠️  SendGrid API key not configured. Email will NOT be sent.');
        console.log(`[Email] ========================================`);
        console.log(`[Email] TO: ${userEmail}`);
        console.log(`[Email] SUBJECT: ${subject}`);
        console.log(`[Email] 🎉 WELCOME MESSAGE with ${bonusCoins} coins`);
        console.log(`[Email] ========================================`);
        console.log(`[Email] 📧 Configure SENDGRID_API_KEY in .env to send real emails`);
        return { success: true as const, message: 'Welcome email sent (dev mode - check console)' };
      }
      
      const apiKey = process.env.SENDGRID_API_KEY;
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: userEmail }],
              subject,
            },
          ],
          from: { email: this.fromEmail, name: this.brandName },
          content: [{ type: 'text/html', value: this.generateWelcomeTemplate(userName, locale, bonusCoins) }],
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('[Email] SendGrid error:', errorData);
        throw new Error(`SendGrid error: ${res.status}`);
      }
      
      console.log('[Email] Welcome email sent successfully');
      return { success: true as const, message: 'Welcome email sent' };
    } catch (error: unknown) {
      console.error('[Email] Error sending welcome email:', error);
      return { success: false as const, message: 'Welcome email could not be sent' };
    }
  }

  private generateEmailTemplate(verificationCode: string, userName: string, locale: string) {
    const isEnglish = locale === 'en';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          .container { max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; background: #0B0B10; }
          .header { background: linear-gradient(135deg, #F04F8F, #FF6B9D); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .code { font-size: 36px; font-weight: bold; color: #F04F8F; padding: 25px; background: #1a1a1a; text-align: center; margin: 25px 0; border-radius: 8px; letter-spacing: 8px; }
          .content { padding: 30px; background: #111315; color: #EDEFF6; }
          .footer { background: #1a1a1a; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; color: #888; }
          h1 { margin: 0; font-size: 28px; }
          h2 { color: #F04F8F; margin-top: 0; }
          p { line-height: 1.6; color: #EDEFF6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${this.brandName}</h1>
            <p>${isEnglish ? 'Live Video Chat Platform' : 'Canlı Görüntülü Görüşme Platformu'}</p>
          </div>
          <div class="content">
            <h2>${isEnglish ? 'Email Verification' : 'E-posta Doğrulama'}</h2>
            <p>${isEnglish ? `Hi ${userName},` : `Merhaba ${userName},`}</p>
            <p>${isEnglish 
              ? `Welcome to ${this.brandName}. Use the code below to verify your account:` 
              : `${this.brandName} platformuna hoş geldiniz. Hesabınızı doğrulamak için aşağıdaki kodu kullanın:`
            }</p>
            <div class="code">${verificationCode}</div>
            <p>${isEnglish 
              ? 'Enter this code in the app within 5 minutes to verify your account.' 
              : 'Bu kodu 5 dakika içinde uygulamada ilgili alana girerek hesabınızı doğrulayın.'
            }</p>
            <p>${isEnglish 
              ? "If you didn't request this, please ignore this email." 
              : 'Eğer bu işlemi siz yapmadıysanız, lütfen bu e-postayı dikkate almayın.'
            }</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 ${this.brandName} - ${this.domain}</p>
            <p>${isEnglish 
              ? 'This email was sent automatically, please do not reply.' 
              : 'Bu e-posta otomatik olarak gönderilmiştir, lütfen yanıtlamayın.'
            }</p>
            <p>${isEnglish ? 'Support' : 'Destek'}: ${this.supportEmail}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateWelcomeTemplate(userName: string, locale: string, bonusCoins: number) {
    const isEnglish = locale === 'en';
    const appUrl = `https://${this.domain}`;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          .container { max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; background: #0B0B10; }
          .header { background: linear-gradient(135deg, #F04F8F, #FF6B9D); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { padding: 30px; background: #111315; color: #EDEFF6; }
          .bonus { background: linear-gradient(135deg, #8A2CFF, #2AD1FF); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .bonus-amount { font-size: 32px; font-weight: bold; }
          .footer { background: #1a1a1a; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; color: #888; }
          .button { display: inline-block; background: linear-gradient(135deg, #F04F8F, #FF6B9D); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
          h1 { margin: 0; font-size: 28px; }
          h2 { color: #F04F8F; margin-top: 0; }
          p { line-height: 1.6; color: #EDEFF6; }
          ul { padding-left: 20px; }
          li { margin: 10px 0; color: #EDEFF6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${this.brandName}</h1>
            <p>${isEnglish ? 'Live Video Chat Platform' : 'Canlı Görüntülü Görüşme Platformu'}</p>
          </div>
          <div class="content">
            <h2>${isEnglish ? 'Welcome!' : 'Hoş Geldiniz!'}</h2>
            <p>${isEnglish ? `Hi <strong>${userName}</strong>,` : `Merhaba <strong>${userName}</strong>,`}</p>
            <p>${isEnglish 
              ? `You've successfully registered on ${this.brandName}!` 
              : `${this.brandName} platformuna başarıyla kayıt oldunuz!`
            }</p>
            
            <div class="bonus">
              <div class="bonus-amount">${bonusCoins} ${isEnglish ? 'Coins' : 'Coin'}</div>
              <p style="margin: 10px 0 0 0; color: white;">${isEnglish ? 'Welcome Bonus!' : 'Hoş Geldin Bonusu!'}</p>
            </div>
            
            <p>${isEnglish ? 'You can now enjoy these features:' : 'Artık aşağıdaki özelliklerden faydalanabilirsiniz:'}</p>
            <ul>
              <li>${isEnglish ? 'HD quality video calls' : 'HD kalitesinde görüntülü görüşmeler'}</li>
              <li>${isEnglish ? 'Live translation in 100+ languages' : '100+ dilde canlı çeviri'}</li>
              <li>${isEnglish ? 'Send gifts and earn rewards' : 'Hediye gönder ve ödül kazan'}</li>
              <li>${isEnglish ? 'Join voice rooms with up to 21 people' : '21 kişiye kadar sesli odalara katıl'}</li>
              <li>${isEnglish ? '24/7 support' : '7/24 destek'}</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${appUrl}" class="button">${isEnglish ? 'Start Connecting' : 'Bağlanmaya Başla'}</a>
            </div>
          </div>
          <div class="footer">
            <p>&copy; 2025 ${this.brandName} - ${this.domain}</p>
            <p>${isEnglish 
              ? 'This email was sent automatically, please do not reply.' 
              : 'Bu e-posta otomatik olarak gönderilmiştir, lütfen yanıtlamayın.'
            }</p>
            <p>${isEnglish ? 'Support' : 'Destek'}: ${this.supportEmail}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export const emailService = new EmailService();
