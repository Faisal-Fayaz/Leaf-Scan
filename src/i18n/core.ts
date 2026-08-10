import { en, hi, type TranslationKey } from "@/i18n/translations";

export type AppLanguage = "en" | "hi";
export type TranslationValues = Record<string, string | number>;

export function languageFromTags(tags: string[]): AppLanguage {
  return tags.some((tag) => tag.toLowerCase().startsWith("hi")) ? "hi" : "en";
}

export function translate(
  language: AppLanguage,
  key: TranslationKey,
  values: TranslationValues = {}
): string {
  const template = language === "hi" ? hi[key] : en[key];
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match
  );
}
