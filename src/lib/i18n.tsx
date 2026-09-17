import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { LANGUAGES } from './constants';
import { translations, type TranslationKey } from './translations';

interface I18nContextValue {
  lang: string;
  setLang: (lang: string) => void;
  t: (key: TranslationKey | string) => string;
  languages: typeof LANGUAGES;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = 'designly_lang';

function detectInitialLang(): string {
  if (typeof window === 'undefined') return 'en';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && LANGUAGES.some((l) => l.code === stored)) return stored;
  // Detect browser language
  const browserLang = navigator.language.split('-')[0].toLowerCase();
  if (LANGUAGES.some((l) => l.code === browserLang)) return browserLang;
  return 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<string>(detectInitialLang);

  const setLang = (newLang: string) => {
    setLangState(newLang);
    localStorage.setItem(STORAGE_KEY, newLang);
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key: TranslationKey | string): string => {
    const dict = translations[lang] || {};
    return (dict as Record<string, string>)[key] || (translations.en as Record<string, string>)[key] || key;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t, languages: LANGUAGES }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
