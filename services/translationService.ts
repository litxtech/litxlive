

export interface TranslationResult {
  success: boolean;
  translatedText?: string;
  detectedLanguage?: string;
  error?: string;
}

export interface TranslationSettings {
  autoTranslate: boolean;
  targetLanguage: string;
  showOriginal: boolean;
}

class TranslationService {
  private apiUrl = 'https://translate.googleapis.com/translate_a/single';
  private rateLimitCount = 0;
  private rateLimitWindow = 60000;
  private maxRequestsPerMinute = 30;
  private lastResetTime = Date.now();

  private checkRateLimit(): boolean {
    const now = Date.now();
    
    if (now - this.lastResetTime > this.rateLimitWindow) {
      this.rateLimitCount = 0;
      this.lastResetTime = now;
    }

    if (this.rateLimitCount >= this.maxRequestsPerMinute) {
      return false;
    }

    this.rateLimitCount++;
    return true;
  }

  async translateText(
    text: string,
    targetLang: string,
    sourceLang: string = 'auto'
  ): Promise<TranslationResult> {
    try {
      if (!text || text.trim().length === 0) {
        return { success: false, error: 'Empty text' };
      }

      if (!this.checkRateLimit()) {
        return { 
          success: false, 
          error: 'Translation rate limit exceeded. Please slow down.' 
        };
      }

      console.log('[Translation] Translating:', { text: text.substring(0, 50), targetLang, sourceLang });

      const params = new URLSearchParams({
        client: 'gtx',
        sl: sourceLang,
        tl: targetLang,
        dt: 't',
        q: text,
      });

      const response = await fetch(`${this.apiUrl}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data || !data[0]) {
        throw new Error('Invalid translation response');
      }

      const translatedText = data[0]
        .map((item: any) => item[0])
        .filter((item: any) => item)
        .join('');

      const detectedLanguage = data[2] || sourceLang;

      console.log('[Translation] Success:', translatedText.substring(0, 50));

      return {
        success: true,
        translatedText,
        detectedLanguage,
      };
    } catch (error) {
      console.error('[Translation] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Translation failed',
      };
    }
  }

  async translateMessage(
    message: string,
    userLang: string,
    messageLang?: string
  ): Promise<TranslationResult> {
    if (!messageLang || messageLang === userLang) {
      return {
        success: true,
        translatedText: message,
        detectedLanguage: messageLang || userLang,
      };
    }

    return this.translateText(message, userLang, messageLang);
  }

  async detectLanguage(text: string): Promise<{ success: boolean; language?: string; error?: string }> {
    try {
      if (!text || text.trim().length === 0) {
        return { success: false, error: 'Empty text' };
      }

      const result = await this.translateText(text, 'en', 'auto');

      if (result.success && result.detectedLanguage) {
        return {
          success: true,
          language: result.detectedLanguage,
        };
      }

      return { success: false, error: 'Language detection failed' };
    } catch (error) {
      console.error('[Translation] Detect language error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Detection failed',
      };
    }
  }

  async batchTranslate(
    messages: { id: string; text: string; lang?: string }[],
    targetLang: string
  ): Promise<{ id: string; translatedText: string; error?: string }[]> {
    const results = [];

    for (const message of messages) {
      if (!message.lang || message.lang === targetLang) {
        results.push({
          id: message.id,
          translatedText: message.text,
        });
        continue;
      }

      const result = await this.translateText(message.text, targetLang, message.lang);

      if (result.success && result.translatedText) {
        results.push({
          id: message.id,
          translatedText: result.translatedText,
        });
      } else {
        results.push({
          id: message.id,
          translatedText: message.text,
          error: result.error,
        });
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }

  getLanguageName(code: string): string {
    const languages: Record<string, string> = {
      'en': 'English',
      'tr': 'Türkçe',
      'es': 'Español',
      'fr': 'Français',
      'de': 'Deutsch',
      'it': 'Italiano',
      'pt': 'Português',
      'ru': 'Русский',
      'ar': 'العربية',
      'zh': '中文',
      'ja': '日本語',
      'ko': '한국어',
      'hi': 'हिन्दी',
      'nl': 'Nederlands',
      'pl': 'Polski',
      'sv': 'Svenska',
      'no': 'Norsk',
      'da': 'Dansk',
      'fi': 'Suomi',
      'el': 'Ελληνικά',
      'cs': 'Čeština',
      'hu': 'Magyar',
      'ro': 'Română',
      'uk': 'Українська',
      'th': 'ไทย',
      'vi': 'Tiếng Việt',
      'id': 'Bahasa Indonesia',
      'ms': 'Bahasa Melayu',
      'fa': 'فارسی',
      'he': 'עברית',
      'bn': 'বাংলা',
      'ur': 'اردو',
    };

    return languages[code] || code.toUpperCase();
  }

  getSupportedLanguages(): { code: string; name: string }[] {
    return [
      { code: 'en', name: 'English' },
      { code: 'tr', name: 'Türkçe' },
      { code: 'es', name: 'Español' },
      { code: 'fr', name: 'Français' },
      { code: 'de', name: 'Deutsch' },
      { code: 'it', name: 'Italiano' },
      { code: 'pt', name: 'Português' },
      { code: 'ru', name: 'Русский' },
      { code: 'ar', name: 'العربية' },
      { code: 'zh', name: '中文' },
      { code: 'ja', name: '日本語' },
      { code: 'ko', name: '한국어' },
      { code: 'hi', name: 'हिन्दी' },
      { code: 'nl', name: 'Nederlands' },
      { code: 'pl', name: 'Polski' },
      { code: 'sv', name: 'Svenska' },
      { code: 'no', name: 'Norsk' },
      { code: 'da', name: 'Dansk' },
      { code: 'fi', name: 'Suomi' },
      { code: 'el', name: 'Ελληνικά' },
      { code: 'cs', name: 'Čeština' },
      { code: 'hu', name: 'Magyar' },
      { code: 'ro', name: 'Română' },
      { code: 'uk', name: 'Українська' },
      { code: 'th', name: 'ไทย' },
      { code: 'vi', name: 'Tiếng Việt' },
      { code: 'id', name: 'Bahasa Indonesia' },
      { code: 'ms', name: 'Bahasa Melayu' },
      { code: 'fa', name: 'فارسی' },
      { code: 'he', name: 'עברית' },
      { code: 'bn', name: 'বাংলা' },
      { code: 'ur', name: 'اردو' },
    ];
  }

  getRateLimitStatus(): { remaining: number; total: number; resetsIn: number } {
    const now = Date.now();
    const resetsIn = this.rateLimitWindow - (now - this.lastResetTime);
    
    return {
      remaining: Math.max(0, this.maxRequestsPerMinute - this.rateLimitCount),
      total: this.maxRequestsPerMinute,
      resetsIn: Math.max(0, resetsIn),
    };
  }
}

export const translationService = new TranslationService();
