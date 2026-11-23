import { useSettingsStore } from '@/stores/settingsStore';

import { isLanguage, type Language } from './languages';

/**
 * The language of the bundled content (stories, glossary, camps, exercises…). It is read once when the
 * app starts: content files are turned into constants at import time, so a language change reloads the
 * app (see reloadApp) instead of re-rendering.
 */
export const CONTENT_LANGUAGE: Language = (() => {
  const l = useSettingsStore.getState().settings.language;
  return isLanguage(l) ? l : 'tr';
})();

/** The variant of a content file for the current language (English, then Turkish, when one is missing). */
export function pick<T>(variants: { tr: T } & Partial<Record<Language, T>>): T {
  return variants[CONTENT_LANGUAGE] ?? variants.en ?? variants.tr;
}
