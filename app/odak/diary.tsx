import { router } from 'expo-router';
import { View } from 'react-native';

import { AppText, Button, Card, Header, Screen, useTheme } from '@/components';
import { ODAK_DIARY as D, fill, ODAK_ONBOARDING as ONB, ODAK_PANEL as P, ODAK_SOS as SOS } from '@/features/camps/odak/content';
import { byDay, diaryEntries, hourRange, SUMMARY_MIN, weekdayIndex, weeklySummary, type DiaryEntry } from '@/features/camps/odak/engine/diary';
import { QuickExitButton } from '@/features/camps/odak/privacy/quickExit';
import { useOdakStore } from '@/features/camps/odak/store';
import { goBack } from '@/lib/nav';
import { useNow } from '@/lib/useNow';

const LIST_DAYS = 14;

const triggerLabel = (id?: string | null) => ONB.triggers.options.find((o) => o.id === id)?.label ?? '';
const emotionLabel = (id?: string | null) => [...ONB.emotions.before, ...ONB.emotions.after].find((o) => o.id === id)?.label ?? '';
const toolLabel = (id?: string | null) => SOS.tools.items.find((o) => o.id === id)?.title ?? '';
const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/** Günlüğüm (SPEC_ODAK_KAMPI 5.4): weekly summary, quick logs and the last two weeks of entries. */
export default function OdakDiary() {
  const t = useTheme();
  useNow(60_000);
  const now = new Date();
  const { urges, events } = useOdakStore();
  const w = weeklySummary(urges, events, now);
  const days = byDay(diaryEntries(urges, events)).slice(0, LIST_DAYS);

  const line = (e: DiaryEntry) => {
    const time = hhmm(new Date(e.at));
    if (e.type === 'urge') {
      const u = e.urge;
      return `${time} · ${fill(D.list.urge, { n: u.intensityBefore })} · ${D.list[u.outcome]}${u.trigger ? ` · ${triggerLabel(u.trigger)}` : ''}`;
    }
    const b = e.behavior;
    const kind = P.log.options.find((o) => o.id === b.kind)?.label ?? '';
    const feel = b.emotionBefore || b.emotionAfter ? ` · ${emotionLabel(b.emotionBefore)}${b.emotionAfter ? ` → ${emotionLabel(b.emotionAfter)}` : ''}` : '';
    return `${time} · ${kind}${b.trigger ? ` · ${triggerLabel(b.trigger)}` : ''}${feel}`;
  };
  const dayTitle = (k: string) => {
    const [y, m, d] = k.split('-').map(Number) as [number, number, number];
    const date = new Date(y, m - 1, d);
    return `${D.days[weekdayIndex(date)]} · ${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}`;
  };

  return (
    <Screen>
      <Header title={D.title} onBack={() => goBack('/odak')} right={<QuickExitButton />} />
      <AppText muted>{D.intro}</AppText>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button label={D.urge.title} icon="plus" onPress={() => router.push('/odak/log-urge')} style={{ flex: 1 }} />
        <Button label={D.behavior.title} icon="plus" variant="secondary" onPress={() => router.push('/odak/log-behavior')} style={{ flex: 1 }} />
      </View>

      <Card style={{ gap: 8 }}>
        <AppText variant="h3">📊 {D.week.title}</AppText>
        <AppText variant="small" weight="700">
          {fill(D.week.counts, { urges: w.urges, managed: w.managed, behaviors: w.behaviors })}
        </AppText>
        {w.enough ? (
          <>
            {w.riskyHour !== null ? <AppText variant="small">⏰ {fill(D.week.riskyHour, { range: hourRange(w.riskyHour) })}</AppText> : null}
            {w.riskyDay !== null ? <AppText variant="small">📅 {fill(D.week.riskyDay, { day: D.days[w.riskyDay] })}</AppText> : null}
            {w.topTrigger ? <AppText variant="small">📍 {fill(D.week.topTrigger, { trigger: triggerLabel(w.topTrigger) })}</AppText> : null}
            {w.bestTool ? <AppText variant="small">🛠️ {fill(D.week.bestTool, { tool: toolLabel(w.bestTool) })}</AppText> : null}
            {w.emotionBefore && w.emotionAfter ? <AppText variant="small">💭 {fill(D.week.emotions, { before: emotionLabel(w.emotionBefore), after: emotionLabel(w.emotionAfter) })}</AppText> : null}
            {w.avgSatisfaction !== null ? <AppText variant="small">🌡️ {fill(D.week.satisfaction, { avg: String(w.avgSatisfaction).replace('.', ',') })}</AppText> : null}
          </>
        ) : (
          <AppText variant="small" muted>
            {fill(D.week.empty, { min: SUMMARY_MIN, n: w.urges + w.behaviors })}
          </AppText>
        )}
        <AppText variant="tiny" muted>
          {D.week.note}
        </AppText>
      </Card>

      <AppText variant="h3" style={{ marginTop: 6 }}>
        {D.list.title}
      </AppText>
      {days.length === 0 ? (
        <AppText muted>{D.list.empty}</AppText>
      ) : (
        days.map((d) => (
          <Card key={d.day} style={{ gap: 6 }}>
            <AppText variant="small" weight="800" color={t.colors.primary}>
              {dayTitle(d.day)}
            </AppText>
            {d.entries.map((e) => (
              <AppText key={e.type === 'urge' ? e.urge.id : e.behavior.id} variant="small">
                {e.type === 'urge' ? '🌊' : '📝'} {line(e)}
              </AppText>
            ))}
          </Card>
        ))
      )}
    </Screen>
  );
}
