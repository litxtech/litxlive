export type TelegramUserInfo = { id?: string; email?: string; username?: string; ip?: string };

export async function sendTelegramNotification(userInfo: TelegramUserInfo, actionType: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN ?? '';
  const chatId = process.env.TELEGRAM_CHAT_ID ?? '';

  if (!botToken || !chatId) {
    console.error('Telegram env variables missing');
    return { ok: false, error: 'Missing env' };
  }

  const currentTime = new Date().toLocaleString('tr-TR', {
    timeZone: 'Europe/Istanbul',
    dateStyle: 'full',
    timeStyle: 'medium',
  } as Intl.DateTimeFormatOptions);

  let emoji = '🔔';
  if (actionType.includes('Giriş')) emoji = '🟢';
  if (actionType.includes('Kayıt')) emoji = '🆕';
  if (actionType.includes('Admin')) emoji = '👑';

  const message = `
${emoji} **LumiLive - ${actionType}**
────────────────
👤 **Kullanıcı:** ${userInfo?.username || userInfo?.email || 'N/A'}
📧 **Email:** ${userInfo?.email || 'N/A'}
🆔 **User ID:** ${userInfo?.id || 'N/A'}
🔐 **İşlem:** ${actionType}
⏰ **Zaman:** ${currentTime}
🌐 **IP:** ${userInfo?.ip || 'N/A'}
  `;

  try {
    const resp = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'Markdown' }),
    });

    const result = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      console.error('Telegram API Error', result);
      return { ok: false, error: 'api_error', result };
    }

    console.log('Telegram notification sent');
    return { ok: true };
  } catch (e) {
    console.error('Telegram notification failure', e);
    return { ok: false, error: e instanceof Error ? e.message : 'unknown' };
  }
}
