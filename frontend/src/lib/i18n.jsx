import { createContext, useContext, useState, useCallback } from "react";
import en from "./translations/en.json";
import hi from "./translations/hi.json";

const translations = { en, hi };

const I18nContext = createContext();

function getNestedValue(obj, path) {
  return path.split(".").reduce((acc, key) => acc?.[key], obj);
}

export function I18nProvider({ children }) {
  const [locale, setLocale] = useState(
    () => localStorage.getItem("rakshak_lang") || "en"
  );

  const changeLocale = useCallback((newLocale) => {
    setLocale(newLocale);
    localStorage.setItem("rakshak_lang", newLocale);
  }, []);

  const t = useCallback(
    (key) => {
      const val = getNestedValue(translations[locale], key);
      if (val !== undefined) return val;
      // Fallback to English
      const fallback = getNestedValue(translations.en, key);
      if (fallback !== undefined) return fallback;
      // Last resort: return key
      return key;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ t, locale, setLocale: changeLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useT() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useT must be used within I18nProvider");
  return ctx;
}
