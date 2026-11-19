import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Card, Header, Screen, useTheme } from '@/components';
import { MiniBars } from '@/features/camps/core/ui';
import { fill, ODAK_ONBOARDING as ONB, ODAK_SOS as SOS, ODAK_STATS as S } from '@/features/camps/odak/content';
import { toolEffectiveness, managedCount } from '@/features/camps/odak/engine/sos';
import { bpsProgress, emotionPairs, fitCalendar, riskyHeatmap, topTriggers, weeklyUrges } from '@/features/camps/odak/engine/stats';
import { QuickExitButton } from '@/features/camps/odak/privacy/quickExit';
import { useOdakStore } from '@/features/camps/odak/store';
import { tint } from '@/features/campus/shared/ui';
import { OdakLock } from '@/features/camps/odak/ui';
import { useAccess } from '@/features/purchases/useGate';
import { goBack } from '@/lib/nav';

const label = (list: { id: string; label: string }[], id: string) => list.find((o) => o.id === id)?.label ?? id;

/** İstatistikler (SPEC_ODAK_KAMPI 5.12). Neutral colours: slip days are grey, never red. */
export default function OdakStats() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const premium = useAccess()('odak');
  const { goal, events, urges, checkins, screenings } = useOdakStore();
  const now = new Date();
  if (!goal) {
    return (
      <Screen>
        <Header title={S.title} onBack={() => goBack('/odak')} right={<QuickExitButton />} />
      </Screen>
    );
  }
  const cal = fitCalendar(goal, events, checkins, now);
  const weeks = weeklyUrges(urges, now);
  const heat = riskyHeatmap(urges, events);
  const heatMax = Math.max(0, ...heat.flat());
  const triggers = topTriggers(urges, events);
  const tools = toolEffectiveness(urges).filter((x) => x.managed > 0);
  const pairs = emotionPairs(events);
  const bps = bpsProgress(screenings, goal);
  const emotions = [...ONB.emotions.before, ...ONB.emotions.after];
  const cellColor = (c: string) => (c === 'fit' ? t.colors.success : c === 'slip' ? t.colors.textMuted : c === 'future' ? 'transparent' : t.colors.surfaceAlt);

  return (
    <Screen>
      <Header title={S.title} onBack={() => goBack('/odak')} right={<QuickExitButton />} />

      <Card style={{ alignItems: 'center', gap: 4 }}>
        <AppText variant="display" color={t.colors.success}>
          {managedCount(urges)}
        </AppText>
        <AppText weight="800">🌿 {S.managedTitle}</AppText>
      </Card>

      <Card style={{ gap: 8 }}>
        <AppText variant="h3">📅 {S.calendarTitle}</AppText>
        <View style={{ gap: 3 }} accessible accessibilityLabel={S.calendarTitle}>
          {cal.map((row, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 3 }}>
              {row.map((c, j) => (
                <View key={j} style={{ flex: 1, aspectRatio: 1, maxHeight: 22, borderRadius: 4, backgroundColor: cellColor(c), borderWidth: c === 'future' ? 1 : 0, borderColor: t.colors.border }} />
              ))}
            </View>
          ))}
        </View>
        <AppText variant="tiny" muted>
          {S.calendarLegend}
        </AppText>
      </Card>

      {premium ? (
        <>
          <Card style={{ gap: 8 }}>
            <AppText variant="h3">🌊 {S.urgesTitle}</AppText>
            <MiniBars values={weeks.map((w) => w.count)} labels={weeks.map((_, i) => fill(S.weekShort, { n: i + 1 }))} a11y={S.urgesTitle} valueLabels />
            <AppText weight="700" variant="small">
              {S.intensityTitle}
            </AppText>
            <MiniBars values={weeks.map((w) => w.avg)} color={t.colors.accent} a11y={S.intensityTitle} valueLabels height={70} />
          </Card>

          <Card style={{ gap: 8 }}>
            <AppText variant="h3">⏰ {S.heatTitle}</AppText>
            {heatMax === 0 ? (
              <AppText variant="small" muted>
                {S.heatEmpty}
              </AppText>
            ) : (
              <View style={{ gap: 3 }} accessible accessibilityLabel={S.heatTitle}>
                <View style={{ flexDirection: 'row', gap: 3, paddingLeft: 34 }}>
                  {S.hours.map((h) => (
                    <AppText key={h} variant="tiny" muted center style={{ flex: 1 }}>
                      {h}
                    </AppText>
                  ))}
                </View>
                {heat.map((row, i) => (
                  <View key={i} style={{ flexDirection: 'row', gap: 3, alignItems: 'center' }}>
                    <AppText variant="tiny" muted style={{ width: 31 }}>
                      {S.days[i]}
                    </AppText>
                    {row.map((v, j) => (
                      <View
                        key={j}
                        style={{
                          flex: 1,
                          height: 20,
                          borderRadius: 4,
                          backgroundColor: v
                            ? tint(
                                t.colors.primary,
                                Math.round(40 + (v / heatMax) * 215)
                                  .toString(16)
                                  .padStart(2, '0'),
                              )
                            : t.colors.surfaceAlt,
                        }}
                      />
                    ))}
                  </View>
                ))}
              </View>
            )}
          </Card>

          <Card style={{ gap: 6 }}>
            <AppText variant="h3">📍 {S.triggersTitle}</AppText>
            {triggers.length ? (
              triggers.map((x) => (
                <AppText key={x.id} variant="small">
                  {label(ONB.triggers.options, x.id)} · {x.count}
                </AppText>
              ))
            ) : (
              <AppText variant="small" muted>
                {S.none}
              </AppText>
            )}
          </Card>

          <Card style={{ gap: 6 }}>
            <AppText variant="h3">🛠️ {S.toolsTitle}</AppText>
            {tools.length ? (
              tools.slice(0, 4).map((x) => (
                <AppText key={x.tool} variant="small">
                  {label(
                    SOS.tools.items.map((i) => ({ id: i.id, label: i.title })),
                    x.tool,
                  )}{' '}
                  · {x.managed}/{x.used}
                </AppText>
              ))
            ) : (
              <AppText variant="small" muted>
                {S.none}
              </AppText>
            )}
          </Card>

          <Card style={{ gap: 6 }}>
            <AppText variant="h3">💭 {S.emotionsTitle}</AppText>
            {pairs.length ? (
              pairs.map((p) => (
                <AppText key={`${p.before}-${p.after}`} variant="small">
                  {label(emotions, p.before)} → {label(emotions, p.after)} · {p.count}
                </AppText>
              ))
            ) : (
              <AppText variant="small" muted>
                {S.none}
              </AppText>
            )}
          </Card>

          <Card style={{ gap: 6 }}>
            <AppText variant="h3">📈 {S.bpsTitle}</AppText>
            {bps.length ? (
              bps.map((b, i) => (
                <AppText key={i} variant="small">
                  {fill('{d}. gün · {s}/10', { d: b.day, s: b.score })}
                </AppText>
              ))
            ) : (
              <AppText variant="small" muted>
                {S.none}
              </AppText>
            )}
            <AppText variant="tiny" muted>
              {S.bpsNote}
            </AppText>
          </Card>
        </>
      ) : (
        <OdakLock title={tr('odak.premium.stats')} />
      )}
    </Screen>
  );
}
