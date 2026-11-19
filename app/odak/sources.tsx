import { Linking, Pressable } from 'react-native';

import { AppText, Card, Header, Screen, useTheme } from '@/components';
import { fill, ODAK_COACH, ODAK_LIBRARY, ODAK_METHOD as M, ODAK_MISSIONS, ODAK_ONBOARDING, ODAK_PANEL, ODAK_PLANS, ODAK_SKILLS, ODAK_SOS, ODAK_SOURCES, ODAK_SUPPORT } from '@/features/camps/odak/content';
import { sourceUsage } from '@/features/camps/odak/engine/sources';
import { QuickExitButton } from '@/features/camps/odak/privacy/quickExit';
import { goBack } from '@/lib/nav';

/** Kaynaklar ve Yöntem (SPEC_ODAK_KAMPI 7.3): method, evidence levels, review status and every source. */
export default function OdakSources() {
  const t = useTheme();
  const usage = sourceUsage([ODAK_ONBOARDING, ODAK_PLANS, ODAK_PANEL, ODAK_SOS, ODAK_MISSIONS, ODAK_SKILLS, ODAK_LIBRARY, ODAK_COACH, ODAK_SUPPORT]);
  return (
    <Screen>
      <Header title={M.title} onBack={() => goBack('/odak')} right={<QuickExitButton />} />
      <AppText>{M.intro}</AppText>
      <Card style={{ gap: 6 }}>
        <AppText variant="h3">🧭 {M.methodTitle}</AppText>
        {M.method.map((m) => (
          <AppText key={m} variant="small">
            • {m}
          </AppText>
        ))}
      </Card>
      <Card style={{ gap: 6 }}>
        <AppText variant="h3">🔬 {M.evidenceTitle}</AppText>
        {Object.entries(M.levels).map(([k, v]) => (
          <AppText key={k} variant="small">
            • {v}
          </AppText>
        ))}
        <AppText variant="tiny" muted>
          {M.reviewNote}
        </AppText>
      </Card>
      <AppText variant="h3" style={{ marginTop: 6 }}>
        📚 {M.sourcesTitle}
      </AppText>
      {ODAK_SOURCES.map((s) => (
        <Pressable key={s.id} onPress={() => void Linking.openURL(s.url)} accessibilityRole="link" accessibilityLabel={`${s.org} – ${s.title}`} style={{ minHeight: 48 }}>
          <Card style={{ gap: 2 }}>
            <AppText variant="small" weight="700" color={t.colors.primary}>
              {s.title}
            </AppText>
            <AppText variant="tiny" muted>
              {s.org} · {s.year}
              {usage[s.id] ? ` · ${fill(M.usedIn, { n: usage[s.id] })}` : ''}
            </AppText>
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}
