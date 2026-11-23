import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Card, Header, Icon, Screen, useTheme } from '@/components';
import { IconTile } from '@/components/ui';
import { GLOSSARY } from '@/features/content/data';
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

  return (
    <Screen>
      <Header />

      <View style={{ alignItems: 'center', gap: 10, paddingVertical: t.space.xs }}>
        <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: tint(t.colors.primary, '33'), alignItems: 'center', justifyContent: 'center' }}>
          <IconTile icon={term.icon} tone="knowledge" size="lg" round />
        </View>
        <AppText variant="h1" center accessibilityRole="header">
          {term.title}
        </AppText>
        <AppText muted center style={{ paddingHorizontal: t.space.sm }}>
          {term.summary}
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: t.space.md, paddingVertical: 6, borderRadius: t.radius.pill, backgroundColor: t.colors.surfaceAlt }}>
          <Icon name="book" color={t.colors.textMuted} size={14} />
          <AppText variant="tiny" weight="700" muted>
            {tr('glossary.meta', { sections: body.length, minutes: readMinutes(term.sections.map((s) => s.text)) })}
          </AppText>
        </View>
      </View>

      <View style={{ gap: 14 }}>
        {body.map((s, i) => {
          const role = roleOf(s.title);
          if (role === 'info') {
            const step = stepOf(i);
            const lastInfo = !body.slice(i + 1).some((x) => roleOf(x.title) === 'info');
            return (
              <View key={s.title} style={{ flexDirection: 'row', gap: t.space.md }}>
                <View style={{ alignItems: 'center', width: 30 }}>
                  <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: t.colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                    <AppText variant="small" weight="800" color={t.colors.primaryText}>
                      {step}
                    </AppText>
                  </View>
                  {!lastInfo ? <View style={{ flex: 1, width: 2, marginTop: 6, borderRadius: 1, backgroundColor: t.colors.border }} /> : null}
                </View>
                <View style={{ flex: 1, gap: 6, paddingBottom: 6 }}>
                  <AppText variant="h3" accessibilityRole="header" style={{ marginTop: 3 }}>
                    {s.title}
                  </AppText>
                  <AppText style={{ lineHeight: 24 }}>{s.text}</AppText>
                </View>
              </View>
            );
          }
          const color = role === 'action' ? t.colors.success : role === 'caution' ? t.colors.warning : t.colors.primary;
          const icon = role === 'action' ? 'success' : role === 'caution' ? 'warning' : 'target';
          return (
            <View
              key={s.title}
              style={{ gap: t.space.sm, padding: t.space.lg, borderRadius: t.radius.lg, backgroundColor: tint(color), borderWidth: 1, borderColor: tint(color, '55') }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.sm }}>
                <Icon name={icon} size="md" />
                <AppText variant="h3" accessibilityRole="header" color={role === 'app' ? t.colors.text : color}>
                  {s.title}
                </AppText>
              </View>
              <AppText style={{ lineHeight: 24 }}>{s.text}</AppText>
            </View>
          );
        })}
      </View>

      {sources ? (
        <View style={{ flexDirection: 'row', gap: 10, paddingTop: t.space.md, borderTopWidth: 1, borderTopColor: t.colors.border }}>
          <Icon name="book" size="md" color={t.tone.knowledge.fg} />
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

      {next && next.id !== term.id ? (
        <Card
          onPress={() => router.replace({ pathname: '/glossary/[termId]', params: { termId: next.id } })}
          accessibilityLabel={`${tr('glossary.next')}: ${next.title}`}
          style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.md, marginTop: t.space.xs }}
        >
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
            <IconTile icon={next.icon} tone="knowledge" />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="tiny" weight="800" color={t.colors.primary}>
              {tr('glossary.next').toLocaleUpperCase(localeOf(i18n.language))}
            </AppText>
            <AppText weight="800">{next.title}</AppText>
          </View>
          <Icon name="chevron" color={t.colors.textMuted} size={18} />
        </Card>
      ) : null}
    </Screen>
  );
}
