import type { IconName } from '@/components/Icon';

/** Every legal document (route app/legal/<id>, texts in legal.<id>), in the order the profile lists them. */
export const LEGAL_DOCS = ['kvkk', 'privacy', 'terms', 'presale', 'renewal', 'refund', 'cookies', 'faq', 'disclaimer'] as const;
export type LegalSection = (typeof LEGAL_DOCS)[number];

/** Profile groups (user request 2026-11-22): "Politikalar" holds the legal policies, "Diğer" the rest. */
export const POLICY_DOCS: LegalSection[] = ['kvkk', 'privacy', 'terms', 'presale', 'renewal', 'refund', 'cookies'];
export const OTHER_DOCS: LegalSection[] = ['faq', 'disclaimer'];

export const LEGAL_ICONS: Record<LegalSection, IconName> = {
  kvkk: 'shieldCheck',
  privacy: 'lock',
  terms: 'file',
  presale: 'card',
  renewal: 'repeat',
  refund: 'wallet',
  cookies: 'blocks',
  faq: 'help',
  disclaimer: 'stethoscope',
};
