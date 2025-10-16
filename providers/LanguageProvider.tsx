import { useEffect, useState, useCallback, useMemo } from 'react';
import { getLocales } from 'expo-localization';
import createContextHook from '@nkzw/create-context-hook';
import { translations, Language, TranslationKey } from '@/constants/languages';

const LANGUAGE_STORAGE_KEY = 'user_language';

type InterpolateParams = Record<string, string | number>;

const interpolate = (template: string, params?: InterpolateParams): string => {
  if (!params) return template;
  return template.replace(/\{(.*?)\}/g, (_, key) => {
    const k = String(key).trim();
    const v = params[k];
    return v === undefined || v === null ? `{${k}}` : String(v);
  });
};

// Simple storage functions to avoid direct AsyncStorage import
const getStoredLanguage = async (): Promise<string | null> => {
  try {
    const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
    return await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  } catch {
    return null;
  }
};

const setStoredLanguage = async (language: string): Promise<void> => {
  try {
    const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.log('Error saving language:', error);
  }
};

export const [LanguageProvider, useLanguage] = createContextHook(() => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadLanguage = useCallback(async () => {
    let isMounted = true;
    try {
      const storedLanguage = await getStoredLanguage();
      if (storedLanguage && storedLanguage in translations) {
        if (isMounted) setCurrentLanguage(storedLanguage as Language);
      } else {
        const locale = getLocales?.()[0]?.languageCode?.toLowerCase() ?? 'en';
        const fallback = (['en', 'tr', 'es', 'tl'] as Language[]).includes(locale as Language)
          ? (locale as Language)
          : 'en';
        if (isMounted) setCurrentLanguage(fallback);
        await setStoredLanguage(fallback);
      }
    } catch (error) {
      console.log('Error loading language:', error);
      if (isMounted) setCurrentLanguage('en');
    } finally {
      if (isMounted) setIsLoading(false);
    }
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    loadLanguage();
  }, [loadLanguage]);

  const changeLanguage = useCallback(async (language: Language) => {
    if (!language || typeof language !== 'string') return;
    if (!(language in translations)) return;
    try {
      await setStoredLanguage(language);
      setCurrentLanguage(language);
    } catch (error) {
      console.log('Error changing language:', error);
    }
  }, []);

  const t = useCallback((key: TranslationKey, params?: InterpolateParams): string => {
    const raw = translations[currentLanguage][key] ?? translations.en[key] ?? String(key);
    return interpolate(raw, params);
  }, [currentLanguage]);

  return useMemo(() => ({
    currentLanguage,
    changeLanguage,
    t,
    isLoading,
  }), [currentLanguage, changeLanguage, t, isLoading]);
});
