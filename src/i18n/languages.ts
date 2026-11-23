/**
 * App languages (user request 2026-11-22: Turkish first, then English, German, French, Spanish and one
 * more, one language per round). Pure: no React, no stores.
 */
export const SUPPORTED_LANGUAGES = ['tr', 'en'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

/** Name of each language in itself (shown in the language picker). */
export const LANGUAGE_NAMES: Record<Language, string> = { tr: 'Türkçe', en: 'English' };

/** BCP 47 locale for dates, numbers, money and speech. */
export const LOCALES: Record<Language, string> = { tr: 'tr-TR', en: 'en-US' };

export const isLanguage = (v: unknown): v is Language => typeof v === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(v);

/** The language for a device language code: supported ones as they are, anything else English. */
export function languageForDevice(code: string | null | undefined): Language {
  const c = (code ?? '').toLowerCase().slice(0, 2);
  return isLanguage(c) ? c : 'en';
}

export const localeOf = (lang: string): string => (isLanguage(lang) ? LOCALES[lang] : LOCALES.en);
