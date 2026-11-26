/**
 * Central app identity — read the name from here everywhere (UI, notifications,
 * export files, app.config.ts).
 */
// Brand (user decision 2026-11-25): "Phelvik". Under the home-screen icon only the short name fits;
// the full store name adds the tagline from i18n (app.tagline): "Phelvik: Kegel & Pelvik Taban".
export const APP_NAME = 'Phelvik';
/** Full name for the stores and the About screen, per language. */
export const APP_FULL_NAME = { tr: 'Phelvik: Kegel & Pelvik Taban', en: 'Phelvik: Kegel & Pelvic Floor' } as const;

/** Bundle / package identifiers (placeholders until store setup). */
export const APP_SLUG = 'pelvik-app';
export const APP_SCHEME = 'pelvikapp';
export const IOS_BUNDLE_ID = 'com.example.pelvikapp';
export const ANDROID_PACKAGE = 'com.example.pelvikapp';

export const APP_VERSION = '1.0.0';

/** EAS project (used only to publish test builds/updates; no runtime network). */
export const EAS_PROJECT_ID = '18811e36-1176-4e14-9bb8-2e59752cd211';

/**
 * Seller and data controller named in the privacy policy and terms (KVKK m.10; App Store EU trader
 * and Google Play monetised accounts show the same details publicly). Company and address given by the
 * owner 2026-11-22; the support e-mail is still a placeholder — fill it in before release.
 */
export const LEGAL_ENTITY = {
  name: 'EtikTic',
  address: 'Bahçelievler Mahallesi, Cengiz Topel Caddesi, Haliliye / Şanlıurfa',
  email: 'teoremcontact@gmail.com',
};

/**
 * "Yakında" content (the locked programme cards in Keşfet and the locked rows of the exercise guide) is
 * hidden (owner decision 2026-11-23): App Review rejects placeholder / not-yet-available content
 * (guideline 2.1). Set to true to show it again.
 */
export const SHOW_COMING_SOON = false;

/** Minimum age for using the app (age gate). */
export const MIN_AGE = 16;

/**
 * Length of one training plan in days (user decision 2026-11-26: 180, was 30). The plan runs in six
 * 30-day stages ("Ay 1 … Ay 6"); each stage keeps the four-week rhythm (week 4 = the light week).
 */
export const PLAN_LENGTH_DAYS = 180;
/** Days in one stage of the plan, and the length plans had before 2026-11-26 (for migrating old data). */
export const PLAN_STAGE_DAYS = 30;
export const PLAN_STAGES = PLAN_LENGTH_DAYS / PLAN_STAGE_DAYS;
export const LEGACY_PLAN_LENGTH_DAYS = 30;
/**
 * After the 180-day plan (user decision 2026-11-26): a 7-day cycle that repeats for ever. Plan number 1
 * is the 180-day plan; plan number 2, 3, … are the cycles (each 7 days).
 */
export const CYCLE_DAYS = 7;

/**
 * The "Pelvik taban kasın nerede?" animation (SPEC_ANIMASYON_PELVIK §3) must be checked by a
 * physiotherapist or urologist before release. Set to true only after that review.
 */
export const introAnatomyReviewed = false;
