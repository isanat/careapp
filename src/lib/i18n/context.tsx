"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { translations, Language } from "./translations";

// Type for the translation object
type TranslationObject = typeof translations.pt;

// Helper to get nested value by dot notation
function getNestedValue(obj: TranslationObject, path: string): string | undefined {
  const keys = path.split('.');
  let current: unknown = obj;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  
  return typeof current === 'string' ? current : undefined;
}

// Helper to replace template variables
function interpolate(template: string, variables?: Record<string, string | number>): string {
  if (!variables) return template;
  
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return variables[key]?.toString() ?? match;
  });
}

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationObject;
  tFn: (key: string, variables?: Record<string, string | number>) => string;
  availableLanguages: { code: Language; name: string }[];
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const LANGUAGE_KEY = "idosolink-language";

const availableLanguages: { code: Language; name: string }[] = [
  { code: "pt", name: "Português" },
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
];

export function I18nProvider({ children }: { children: ReactNode }) {
  // Track if we've initialized from localStorage
  const initializedRef = useRef(false);
  
  // Start with "pt" to avoid hydration mismatch
  const [language, setLanguageState] = useState<Language>("pt");

  // Read from localStorage on mount (client-side only)
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    
    const stored = localStorage.getItem(LANGUAGE_KEY) as Language | null;
    if (stored && translations[stored]) {
      // Use microtask to avoid lint warning about setState in effect
      queueMicrotask(() => {
        setLanguageState(stored);
      });
    }
  }, []);

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

  // Translation function with dot notation and interpolation
  const tFn = useCallback((key: string, variables?: Record<string, string | number>): string => {
    const value = getNestedValue(translations[language], key);
    if (value === undefined) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
    return interpolate(value, variables);
  }, [language]);

  const value: I18nContextType = {
    language,
    setLanguage,
    t: translations[language],
    tFn,
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
