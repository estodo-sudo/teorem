import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Header, Screen, useTheme } from '@/components';
import { Card, Illustration, Progress } from '@/components/ui';
import { ACHIEVEMENTS, type AchievementDef } from '@/features/gamification/achievements';
import { Medallion } from '@/features/gamification/Medallion';
import { buildAchievementContext } from '@/features/gamification/service';
import { useProgressStore } from '@/stores/progressStore';
import { localeOf } from '@/i18n/languages';

/** Kupalar — ui-v3 medallion grid (SPEC_UI_V3 §4.3, §7.11): earned count and bar on top, three per row. */
export default function Achievements() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const unlocked = useProgressStore((s) => s.achievements);
  const ctx = buildAchievementContext();
  const count = ACHIEVEMENTS.filter((a) => unlocked[a.id]).length;
  const summary = tr('achievements.summaryShort', { count, total: ACHIEVEMENTS.length });

  return (
    <Screen>
      <Header title={tr('achievements.title')} />
      <Card style={{ padding: t.space.gutter, gap: t.space.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.lg }}>
          {count === 0 ? <Illustration name="empty-trophies" size={72} /> : null}
          <AppText variant="title2" tabular style={{ flex: 1 }}>
            {summary}
          </AppText>
        </View>
        <Progress value={count / ACHIEVEMENTS.length} label={summary} tone="highlight" />
      </Card>
      <View accessibilityRole="list" style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: t.space.xl }}>
        {ACHIEVEMENTS.map((a) => (
          <Item key={a.id} a={a} at={unlocked[a.id]} progress={a.progress(ctx)} />
        ))}
      </View>
    </Screen>
  );
}

function Item({ a, at, progress }: { a: AchievementDef; at?: string; progress: number }) {
  const t = useTheme();
  const { t: tr, i18n } = useTranslation();
  const title = tr(`achievements.items.${a.id}.title`);
  const target = a.target ?? 1;
  const value = Math.min(target, Math.floor(progress * target + 1e-9));
  const progressText = at
    ? new Date(at).toLocaleDateString(localeOf(i18n.language), { day: 'numeric', month: 'short' })
    : a.target
      ? a.unit
        ? tr('achievements.progress', { value, target, unit: tr(`achievements.unit.${a.unit}`) })
        : tr('achievements.progressPlain', { value, target })
      : tr('achievements.percent', { pct: Math.round(progress * 100) });
  return (
    <View
      accessible
      accessibilityLabel={at ? tr('achievements.earnedA11y', { title, date: progressText }) : tr('achievements.lockedA11y', { title, progress: progressText })}
      style={{ width: '33.33%', alignItems: 'center', gap: t.space.xs, paddingHorizontal: t.space.xs }}
    >
      <Medallion icon={a.icon} earned={Boolean(at)} progress={progress} ribbon={a.target ? String(a.target) : undefined} />
      <AppText variant="footnote" center style={{ fontWeight: '500' }}>
        {title}
      </AppText>
      <AppText variant="caption" muted center tabular style={{ fontWeight: '400' }}>
        {progressText}
      </AppText>
    </View>
  );
}
