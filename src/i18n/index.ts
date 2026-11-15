import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en.json';
import tr from './tr.json';

export const SUPPORTED_LANGUAGES = ['tr', 'en'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

// Turkish is the primary language. English is a skeleton for Phase 2 and
// falls back to Turkish for any missing key.
void i18n.use(initReactI18next).init({
  resources: { tr: { translation: tr }, en: { translation: en } },
  lng: 'tr',
  fallbackLng: 'tr',
  interpolation: { escapeValue: false },
  returnNull: false,
  initAsync: false,
});

export function setLanguage(lang: Language) {
  if (i18n.language !== lang) void i18n.changeLanguage(lang);
}

export default i18n;
