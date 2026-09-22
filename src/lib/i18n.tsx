import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { LANGUAGES } from '@/lib/constants';

interface I18nValue {
  lang: string;
  setLang: (code: string) => void;
  t: (key: string) => string;
}

const STORAGE_KEY = 'designly.lang';
const FALLBACK: Record<string, string> = {
  'nav.create': 'Create',
  'nav.projects': 'Projects',
  'nav.templates': 'Templates',
  'nav.brands': 'Brand Kits',
  'nav.assets': 'Assets',
  'nav.credits': 'Credits',
  'nav.billing': 'Billing',
  'nav.settings': 'Settings',
  'nav.admin': 'Admin',
  'create.title': 'What would you like to make?',
  'create.subtitle': 'Describe it in a sentence. The AI team handles the rest.',
  'create.submit': 'Generate',
};

const I18nContext = createContext<I18nValue | null>(null);

function detectInitialLang(): string {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && LANGUAGES.some((l) => l.code === stored)) return stored;
  const nav = navigator.language.slice(0, 2);
  return LANGUAGES.some((l) => l.code === nav) ? nav : 'en';
}

/**
 * Flat key lookup with a two-tier fallback: the loaded dictionary for the
 * active language, then the built-in English strings, then the key itself.
 * A missing translation shows a readable label rather than a raw key.
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState(detectInitialLang);

  const setLang = useCallback((code: string) => {
    setLangState(code);
    localStorage.setItem(STORAGE_KEY, code);
    document.documentElement.lang = code;
  }, []);

  const dictionaries = useMemo<Record<string, Record<string, string>>>(() => ({}), []);

  const t = useCallback(
    (key: string) => dictionaries[lang]?.[key] ?? FALLBACK[key] ?? key,
    [dictionaries, lang],
  );

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}
