import { q } from '../lib/db.js';

export interface TranslationRequest {
  text: string;
  sourceLang: string;
  targetLang: string;
}

export interface TranslationResult {
  translatedText: string;
  cached: boolean;
}

export class TranslationService {
  private static async checkCache(
    text: string,
    sourceLang: string,
    targetLang: string
  ): Promise<string | null> {
    try {
      const result = await q<{ translated_text: string }>(
        `SELECT translated_text FROM translations 
         WHERE source_text = $1 AND source_lang = $2 AND target_lang = $3 
         LIMIT 1`,
        [text, sourceLang, targetLang]
      );
      
      return result.rows[0]?.translated_text || null;
    } catch (error) {
      console.error('Translation cache check error:', error);
      return null;
    }
  }

  private static async saveToCache(
    text: string,
    sourceLang: string,
    targetLang: string,
    translatedText: string
  ): Promise<void> {
    try {
      await q(
        `INSERT INTO translations (source_text, source_lang, target_lang, translated_text)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT DO NOTHING`,
        [text, sourceLang, targetLang, translatedText]
      );
    } catch (error) {
      console.error('Translation cache save error:', error);
    }
  }

  private static async translateWithAPI(
    text: string,
    sourceLang: string,
    targetLang: string
  ): Promise<string> {
    try {
      const response = await fetch('https://translate.googleapis.com/translate_a/single', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: sourceLang,
          target: targetLang,
          format: 'text',
        }),
      });

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data[0][0][0] || text;
    } catch (error) {
      console.error('Translation API error:', error);
      return text;
    }
  }

  static async translate(
    text: string,
    sourceLang: string,
    targetLang: string
  ): Promise<TranslationResult> {
    if (sourceLang === targetLang) {
      return { translatedText: text, cached: false };
    }

    const cached = await this.checkCache(text, sourceLang, targetLang);
    if (cached) {
      return { translatedText: cached, cached: true };
    }

    const translatedText = await this.translateWithAPI(text, sourceLang, targetLang);
    
    await this.saveToCache(text, sourceLang, targetLang, translatedText);

    return { translatedText, cached: false };
  }

  static async translateBatch(
    texts: string[],
    sourceLang: string,
    targetLang: string
  ): Promise<string[]> {
    const results = await Promise.all(
      texts.map(text => this.translate(text, sourceLang, targetLang))
    );
    return results.map(r => r.translatedText);
  }
}
