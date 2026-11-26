import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { AppText, Card, Header, Icon, Screen, useTheme, type IconName } from '@/components';
import { IconTile } from '@/components/ui';
import { appImage, type AppImage } from '@/content/images';
import { GLOSSARY, glossaryImageId } from '@/features/content/data';
import { APP_TERMS } from '@/features/today/GlossaryStrip';
import i18n from '@/i18n';
import { localeOf } from '@/i18n/languages';

/** How a section is presented, from its title (Turkish and English content). */
type Role = 'info' | 'action' | 'caution' | 'app' | 'source';
const ACTION = ['Ne işe yarar?', 'Hemen işe yarayan ipucu', 'Ne yapılabilir?', 'What does it do?', 'A tip that works straight away', 'What can be done?'];
const CAUTION = ['Dikkat', 'Ne zaman önemlidir?', 'Hiç olmuyorsa?', 'Sık yapılan hatalar', 'Caution', 'When does it matter?', "What if they don't happen at all?", 'Common mistakes'];
function roleOf(title: string): Role {
  if (title === 'Kaynaklar' || title === 'Sources') return 'source';
  if (title === 'Uygulamada' || title === 'In the app') return 'app';
  if (ACTION.includes(title)) return 'action';
  if (CAUTION.includes(title)) return 'caution';
  return 'info';
}

/** ~180 words per minute, at least 1 minute. */
const readMinutes = (texts: string[]) => Math.max(1, Math.round(texts.join(' ').split(/\s+/).length / 180));

/** 8-digit hex with alpha for soft tinted backgrounds. */
const tint = (hex: string, alpha = '1F') => (/^#[0-9a-f]{6}$/i.test(hex) ? `${hex}${alpha}` : hex);

/** Header photo height. */
const HERO_H = 400;

/**
 * "Neden, Nedir ve Ne Demek?" page — redesigned 2026-11-23 ("daha canlı ve estetik"): the term's own
 * photo across the top (its bottom blurred in the file) with the kicker, title, summary and reading time
 * on it; the explanation as numbered cards; tips and cautions as coloured cards with an accent bar; the
 * sources; and the next term with its photo.
 */
export default function GlossaryTermScreen() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { termId } = useLocalSearchParams<{ termId: string }>();
  const idx = GLOSSARY.findIndex((g) => g.id === termId);
  const term = GLOSSARY[idx];
  if (!term) {
    return (
      <Screen>
        <Header />
        <AppText>{tr('glossary.notFound')}</AppText>
      </Screen>
    );
  }
  const body = term.sections.filter((s) => roleOf(s.title) !== 'source');
  const sources = term.sections.find((s) => roleOf(s.title) === 'source');
  const next = GLOSSARY[(idx + 1) % GLOSSARY.length];
  // Numbers for the plain explanation sections, in order.
  const infoIdx = body.map((s) => roleOf(s.title) === 'info');
  const stepOf = (i: number) => infoIdx.slice(0, i + 1).filter(Boolean).length;
  const image = appImage(glossaryImageId(term));
  const kicker = APP_TERMS.has(term.id) ? tr('glossary.kindApp') : tr('glossary.kindHealth');
  const k = t.tone.knowledge;

  return (
    <Screen>
      <Header />

      <Hero image={image} icon={term.icon} kicker={kicker} title={term.title} summary={term.summary} meta={tr('glossary.meta', { sections: body.length, minutes: readMinutes(term.sections.map((s) => s.text)) })} />

      <View style={{ gap: t.space.md }}>
        {body.map((s, i) => {
          const role = roleOf(s.title);
          if (role === 'info') {
            return (
              <Card key={s.title} style={{ padding: t.space.lg, gap: t.space.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.md }}>
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: k.soft, alignItems: 'center', justifyContent: 'center' }}>
                    <AppText variant="callout" weight="800" color={k.fg}>
                      {stepOf(i)}
                    </AppText>
                  </View>
                  <AppText variant="title3" accessibilityRole="header" style={{ flex: 1 }}>
                    {s.title}
                  </AppText>
                </View>
                <AppText style={{ lineHeight: 24 }}>{s.text}</AppText>
              </Card>
            );
          }
          const color = role === 'action' ? t.colors.success : role === 'caution' ? t.colors.warning : t.colors.primary;
          const icon: IconName = role === 'action' ? 'success' : role === 'caution' ? 'warning' : 'target';
          return (
            <View key={s.title} style={{ flexDirection: 'row', borderRadius: t.radius.lg, overflow: 'hidden', backgroundColor: tint(color), borderWidth: 1, borderColor: tint(color, '44') }}>
              <View style={{ width: 4, backgroundColor: color }} />
              <View style={{ flex: 1, gap: t.space.sm, padding: t.space.lg }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.sm }}>
                  <Icon name={icon} size="md" color={color} />
                  <AppText variant="title3" accessibilityRole="header" color={role === 'app' ? t.colors.text : color} style={{ flex: 1 }}>
                    {s.title}
                  </AppText>
                </View>
                <AppText style={{ lineHeight: 24 }}>{s.text}</AppText>
              </View>
            </View>
          );
        })}
      </View>

      {sources ? (
        <View style={{ flexDirection: 'row', gap: 10, paddingTop: t.space.md, borderTopWidth: 1, borderTopColor: t.colors.border }}>
          <Icon name="book" size="md" color={k.fg} />
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="tiny" weight="800" muted>
              {tr('glossary.sourcesTitle').toLocaleUpperCase(localeOf(i18n.language))}
            </AppText>
            <AppText variant="tiny" muted style={{ lineHeight: 18 }}>
              {sources.text}
            </AppText>
          </View>
        </View>
      ) : null}

      {next && next.id !== term.id ? <NextCard id={next.id} image={next.image} icon={next.icon} title={next.title} /> : null}
    </Screen>
  );
}

/** The term's photo with the title on it; a tone gradient with the icon when there is no photo. */
function Hero({ image, icon, kicker, title, summary, meta }: { image?: AppImage; icon: IconName; kicker: string; title: string; summary: string; meta: string }) {
  const t = useTheme();
  const f = t.focus;
  const hero = image?.slide ?? image?.image;
  return (
    <View style={{ minHeight: HERO_H, borderRadius: t.radius.xl, overflow: 'hidden', backgroundColor: t.tone.knowledge.soft, justifyContent: 'flex-end' }}>
      {hero ? <Image source={hero} placeholder={image ? { blurhash: image.blurhash } : undefined} contentFit="cover" contentPosition="top" transition={200} style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" /> : null}
      {!hero ? (
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
          <IconTile icon={icon} tone="knowledge" size="lg" round />
        </View>
      ) : null}
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <LinearGradient id="glossaryVeil" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={f.black} stopOpacity={0.15} />
            <Stop offset="0.45" stopColor={f.black} stopOpacity={0.15} />
            <Stop offset="0.75" stopColor={f.black} stopOpacity={0.6} />
            <Stop offset="1" stopColor={f.black} stopOpacity={0.85} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#glossaryVeil)" />
      </Svg>
      <View style={{ padding: t.space.lg, gap: t.space.sm }}>
        <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: t.space.xs, paddingHorizontal: t.space.sm, paddingVertical: 4, borderRadius: t.radius.pill, backgroundColor: t.veil.strong }}>
          <Icon name={icon} size={14} color={f.text} />
          <AppText variant="caption" weight="700" color={f.text}>
            {kicker}
          </AppText>
        </View>
        <AppText variant="title1" accessibilityRole="header" color={f.text}>
          {title}
        </AppText>
        <AppText variant="callout" color={f.icon}>
          {summary}
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="book" color={f.icon} size={14} />
          <AppText variant="footnote" weight="600" color={f.icon}>
            {meta}
          </AppText>
        </View>
      </View>
    </View>
  );
}

/** Next term with its own photo. */
function NextCard({ id, image, icon, title }: { id: string; image?: string; icon: IconName; title: string }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const img = appImage(glossaryImageId({ id, image }));
  return (
    <Card onPress={() => router.replace({ pathname: '/glossary/[termId]', params: { termId: id } })} accessibilityLabel={`${tr('glossary.next')}: ${title}`} style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.md, padding: t.space.md, marginTop: t.space.xs }}>
      {img ? (
        <Image source={img.image} placeholder={{ blurhash: img.blurhash }} contentFit="cover" style={{ width: 64, height: 64, borderRadius: t.radius.md }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
      ) : (
        <IconTile icon={icon} tone="knowledge" />
      )}
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="tiny" weight="800" color={t.colors.primary}>
          {tr('glossary.next').toLocaleUpperCase(localeOf(i18n.language))}
        </AppText>
        <AppText weight="800">{title}</AppText>
      </View>
      <Icon name="chevron" color={t.colors.textMuted} size={18} />
    </Card>
  );
}
