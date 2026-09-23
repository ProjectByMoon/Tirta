import React, { createContext, useContext, useEffect, useState } from 'react';
import { translations } from './translations';
import { supabase } from '../lib/supabase/client';

export const SUPPORTED_LANGUAGES = [
  { code: 'id', name: 'Indonesia', nativeName: 'Indonesia' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];
const DEFAULT_LANGUAGE: LanguageCode = 'id';
const LANGUAGE_CODES = new Set<string>(SUPPORTED_LANGUAGES.map(({ code }) => code));

export function isSupportedLanguage(value: unknown): value is LanguageCode {
  return typeof value === 'string' && LANGUAGE_CODES.has(value);
}

type LangContextType = {
  lang: LanguageCode;
  setLang: (lang: LanguageCode) => Promise<void>;
  t: (key: string) => string;
};

const LanguageContext = createContext<LangContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LanguageCode>(DEFAULT_LANGUAGE);

  useEffect(() => {
    let active = true;
    async function loadUserLanguage() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active || !user) return;

      const { data } = await supabase
        .from('karyawan')
        .select('preferred_language')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (active && isSupportedLanguage(data?.preferred_language)) {
        setLangState(data.preferred_language);
      }
    }
    void loadUserLanguage();
    return () => { active = false; };
  }, []);

  const setLang = async (newLang: LanguageCode) => {
    if (!isSupportedLanguage(newLang)) return;
    setLangState(newLang);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('karyawan')
      .update({ preferred_language: newLang })
      .eq('auth_user_id', user.id);

    // UI remains on the user's selected language even if persistence fails.
    // The next authenticated load will safely fall back to Indonesian.
    if (error) console.warn('Unable to persist language preference:', error.message);
  };

  const t = (key: string) => {
    return translations[lang]?.[key] ?? translations[DEFAULT_LANGUAGE]?.[key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useTranslation must be used within LanguageProvider');
  return context;
}
