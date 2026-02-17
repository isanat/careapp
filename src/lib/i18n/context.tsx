"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { translations, Language, TranslationKey } from "./translations";

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKey;
  availableLanguages: { code: Language; name: string }[];
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const LANGUAGE_KEY = "idosolink-language";

const availableLanguages: { code: Language; name: string }[] = [
  { code: "pt", name: "Português" },
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
];

function getBrowserLanguage(): Language {
  if (typeof window === "undefined") {
    return "pt";
  }
  const browserLang = navigator.language.split("-")[0] as Language;
  return translations[browserLang] ? browserLang : "pt";
}

function getStoredLanguage(): Language | null {
  if (typeof window === "undefined") {
    return null;
  }
  const stored = localStorage.getItem(LANGUAGE_KEY) as Language | null;
  return stored && translations[stored] ? stored : null;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      return getStoredLanguage() || getBrowserLanguage();
    }
    return "pt";
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem(LANGUAGE_KEY, lang);
      document.documentElement.lang = lang;
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value: I18nContextType = {
    language,
    setLanguage,
    t: translations[language],
    availableLanguages,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}

export { translations };
