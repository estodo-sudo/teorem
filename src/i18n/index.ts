import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { useSettingsStore } from '@/stores/settingsStore';

import en from './en.json';
import { isLanguage, type Language } from './languages';
import tr from './tr.json';

export { LANGUAGE_NAMES, LOCALES, SUPPORTED_LANGUAGES, localeOf, type Language } from './languages';

const i18n = createInstance();

const saved = useSettingsStore.getState().settings.language;

// Turkish is the source language; every other language is complete (checked by the i18n tests) and
// falls back to English, then Turkish, should a key ever be missing.
void i18n.use(initReactI18next).init({
  resources: { tr: { translation: tr }, en: { translation: en } },
  lng: isLanguage(saved) ? saved : 'tr',
  fallbackLng: { tr: [], default: ['en', 'tr'] },
  interpolation: { escapeValue: false },
  returnNull: false,
  initAsync: false,
});

export function setLanguage(lang: Language) {
  if (i18n.language !== lang) void i18n.changeLanguage(lang);
}

export default i18n;
