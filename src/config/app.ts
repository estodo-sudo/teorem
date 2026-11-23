/**
 * Central app identity. The product name is intentionally a placeholder until
 * branding is final — read it from here everywhere (UI, notifications, export
 * files, app.config.ts).
 */
// Temporary name until branding is final (SPEC_V4 §0.6): never show a placeholder like "[UYGULAMA_ADI]".
export const APP_NAME = 'Uygulama';

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

/** Length of one training plan in days. */
export const PLAN_LENGTH_DAYS = 30;

/**
 * The "Pelvik taban kasın nerede?" animation (SPEC_ANIMASYON_PELVIK §3) must be checked by a
 * physiotherapist or urologist before release. Set to true only after that review.
 */
export const introAnatomyReviewed = false;
