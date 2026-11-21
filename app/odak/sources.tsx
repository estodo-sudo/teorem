import { AppText, Card, Header, RowGroup, Screen } from '@/components';
import { SourceRow } from '@/features/content/SourceRow';
import { fill, ODAK_LIBRARY, ODAK_METHOD as M, ODAK_MISSIONS, ODAK_ONBOARDING, ODAK_PANEL, ODAK_PLANS, ODAK_SKILLS, ODAK_SOS, ODAK_SOURCES, ODAK_SUPPORT } from '@/features/camps/odak/content';
import { sourceUsage } from '@/features/camps/odak/engine/sources';
import { QuickExitButton } from '@/features/camps/odak/privacy/quickExit';
import { goBack } from '@/lib/nav';

/** Kaynaklar ve Yöntem (SPEC_ODAK_KAMPI 7.3): method, evidence levels, review status and every source. */
export default function OdakSources() {
  const usage = sourceUsage([ODAK_ONBOARDING, ODAK_PLANS, ODAK_PANEL, ODAK_SOS, ODAK_MISSIONS, ODAK_SKILLS, ODAK_LIBRARY, ODAK_SUPPORT]);
  return (
    <Screen>
      <Header title={M.title} onBack={() => goBack('/odak')} right={<QuickExitButton />} />
      <AppText>{M.intro}</AppText>
      <Card style={{ gap: 6 }}>
        <AppText variant="h3">{M.methodTitle}</AppText>
        {M.method.map((m) => (
          <AppText key={m} variant="small">
            • {m}
          </AppText>
        ))}
      </Card>
      <Card style={{ gap: 6 }}>
        <AppText variant="h3">{M.evidenceTitle}</AppText>
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
        {M.sourcesTitle}
      </AppText>
      <RowGroup>
        {ODAK_SOURCES.map((s) => (
          <SourceRow key={s.id} source={s} meta={`${s.org} · ${s.year}${usage[s.id] ? ` · ${fill(M.usedIn, { n: usage[s.id] })}` : ''}`} />
        ))}
      </RowGroup>
    </Screen>
  );
}
