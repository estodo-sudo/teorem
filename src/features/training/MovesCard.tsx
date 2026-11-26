import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Icon, ProgressBar, useTheme, type IconName } from '@/components';
import { Badge, Card, IconTile, Sheet } from '@/components/ui';
import { toDateKey } from '@/lib/date';
import { useTrainingStore } from '@/stores/trainingStore';

import { ExerciseDemo } from './ExerciseDemo';
import { MoveLoop } from './MoveLoop';
import { absoluteDay, learnedMoves, MOVE_PROGRAM, moveRows, type MoveId } from './moves';
import { todayPlanPosition } from './plan';

/** Icon per move (the same as on Günüm and the "next round" screen). */
export const MOVE_ICON: Record<MoveId, IconName> = { elevator: 'layers', step_up: 'trendUp', step_down: 'trendDown', double_peak: 'mountain', half_quick: 'zap', half_hold: 'hourglass', wave: 'waves' };

/**
 * İlerleme → "Hareketlerin" (180-day plan, 2026-11-26): every move of the plan by name. Learned ones open
 * (tap → the move on a loop and how it goes); the latest is marked "Her turda"; the next one says on which
 * day it comes and how many days are left; the rest are locked with their day.
 */
export function MovesCard() {
  const t = useTheme();
  const k = t.tokens;
  const { t: tr } = useTranslation();
  const training = useTrainingStore((s) => s.training);
  const pos = todayPlanPosition(training, toDateKey());
  const learned = learnedMoves(training);
  const rows = moveRows(learned, absoluteDay(pos.planNumber, pos.planDay));
  const [open, setOpen] = useState<MoveId | null>(null);
  return (
    <>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <View style={{ padding: t.space.lg, gap: t.space.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <AppText variant="bodyStrong">{tr('moves.learnedTitle')}</AppText>
            <AppText variant="footnote" muted tabular>
              {tr('moves.count', { done: learned.length, total: MOVE_PROGRAM.length })}
            </AppText>
          </View>
          <ProgressBar value={learned.length / MOVE_PROGRAM.length} accessibilityLabel={tr('moves.count', { done: learned.length, total: MOVE_PROGRAM.length })} />
        </View>
        {rows.map((r) => {
          const opened = r.state === 'current' || r.state === 'learned';
          const name = tr(`exercise.${r.id}.name`);
          const line =
            r.state === 'current'
              ? tr('moves.current')
              : r.state === 'learned'
                ? tr(r.id === 'elevator' ? 'moves.learnedSlow' : 'moves.learned')
                : r.state === 'next'
                  ? r.daysLeft > 0
                    ? tr('moves.next', { day: r.day, count: r.daysLeft })
                    : tr('moves.nextToday')
                  : tr('moves.locked', { day: r.day });
          return (
            <Pressable
              key={r.id}
              disabled={!opened}
              onPress={() => setOpen(r.id)}
              accessibilityRole={opened ? 'button' : 'text'}
              accessibilityLabel={`${name}. ${line}`}
              testID={`move-row-${r.id}`}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: t.space.md,
                paddingHorizontal: t.space.lg,
                paddingVertical: t.space.md,
                minHeight: 64,
                borderTopWidth: t.border.thin,
                borderTopColor: k.border,
                backgroundColor: pressed ? k.muted : 'transparent',
              })}
            >
              {opened ? (
                <IconTile icon={MOVE_ICON[r.id]} tone="kegel" />
              ) : (
                <View style={{ width: t.tile.sm, height: t.tile.sm, borderRadius: t.radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: k.muted }}>
                  <Icon name={r.state === 'next' ? MOVE_ICON[r.id] : 'lock'} size="md" color={k.mutedForeground} />
                </View>
              )}
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="bodyStrong" color={opened ? undefined : k.mutedForeground}>
                  {name}
                </AppText>
                <AppText variant="footnote" muted>
                  {line}
                </AppText>
              </View>
              {r.state === 'current' ? <Badge label={tr('moves.currentBadge')} /> : opened ? <Icon name="chevron" size="sm" color={k.subtle} /> : null}
            </Pressable>
          );
        })}
      </Card>
      <Sheet visible={open !== null} onClose={() => setOpen(null)} title={open ? tr(`exercise.${open}.name`) : undefined}>
        {open ? (
          <View style={{ alignItems: 'center', gap: t.space.lg }}>
            {open === 'elevator' ? <ExerciseDemo type="elevator" /> : <MoveLoop move={open} size={150} />}
            <AppText variant="body" style={{ alignSelf: 'stretch' }}>
              {tr(`exercise.${open}.desc`)}
            </AppText>
          </View>
        ) : null}
      </Sheet>
    </>
  );
}
