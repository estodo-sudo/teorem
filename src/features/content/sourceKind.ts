/** Source type badge for the "Kaynaklar" lists (SPEC_UI_V3 §7.15): a neutral guess from the org and title. */
export type SourceKind = 'who' | 'rct' | 'review' | 'guideline' | 'institution' | 'study';

export function sourceKind(s: { org: string; title: string }): SourceKind {
  // Locale-free lower case: most source names are English, and the Turkish locale would turn "NICE" into "nıce".
  const org = s.org.toLowerCase();
  const title = s.title.toLowerCase();
  // No \b here: it does not treat Turkish letters as word characters ("(DSÖ)").
  if (/(^|[^a-z])(who|dsö)([^a-zçğıöşü]|$)|world health|dünya sağlık/.test(org)) return 'who';
  if (/random|rct\b|controlled trial|kontrollü/.test(title)) return 'rct';
  if (/review|meta-?analy|cochrane|derleme|sistematik/.test(`${title} ${org}`)) return 'review';
  if (/guideline|kılavuz|rehber|recommendation|öneri|nice\b|uspstf/.test(`${title} ${org}`)) return 'guideline';
  if (/bakanlı|ministry|cdc|nhs|nih|fda|ema|yeşilay|institute|enstitü|association|derneği|society|foundation|vakf/.test(org)) return 'institution';
  return 'study';
}
