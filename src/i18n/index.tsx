import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import type { TranslationKey } from "@/i18n/translations";
import {
  languageFromTags,
  translate,
  type AppLanguage,
  type TranslationValues,
} from "@/i18n/core";

const LANGUAGE_STORAGE_KEY = "@leafscan_language";

type I18nContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (key: TranslationKey, values?: TranslationValues) => string;
  formatDate: (timestamp: number) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function deviceLanguage(): AppLanguage {
  return languageFromTags(getLocales().map((locale) => locale.languageTag));
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(deviceLanguage);

  useEffect(() => {
    void AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
      .then((stored) => {
        if (stored === "en" || stored === "hi") setLanguageState(stored);
      })
      .catch((error) => console.warn("Failed to load app language:", error));
  }, []);

  const setLanguage = useCallback((nextLanguage: AppLanguage) => {
    setLanguageState(nextLanguage);
    void AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage).catch((error) =>
      console.warn("Failed to save app language:", error)
    );
  }, []);

  const t = useCallback(
    (key: TranslationKey, values?: TranslationValues) =>
      translate(language, key, values),
    [language]
  );

  const formatDate = useCallback(
    (timestamp: number) =>
      new Intl.DateTimeFormat(language === "hi" ? "hi-IN" : "en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(timestamp)),
    [language]
  );

  const value = useMemo(
    () => ({ language, setLanguage, t, formatDate }),
    [formatDate, language, setLanguage, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}

export type { AppLanguage } from "@/i18n/core";
