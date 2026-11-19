import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Card, Icon, ProgressBar, useTheme } from '@/components';
import { ALC } from '@/features/campus/alcohol/content';
import { alcPhase, dryDays, thisWeek as alcWeek } from '@/features/campus/alcohol/logic';
import { BODY } from '@/features/campus/body/content';
import { bodyPhase, programProgress, programWeek, weekRoutineDays, type BodyId } from '@/features/campus/body/logic';
import { openGated, useAccess } from '@/features/purchases/useGate';
import { useCampusStore } from '@/stores/campusStore';
import { useProgressStore } from '@/stores/progressStore';

import { COURSES, type Course, type GlossaryTerm } from './data';

/** Every campus in display order (camps have their own "Kamplar" list, see features/camps/registry). */
export type CampusEntry = { kind: 'alcohol'; id: string }
  | { kind: 'body'; id: BodyId }
  | { kind: 'course'; id: string; course: Course };
export const CAMPUSES: CampusEntry[] = [
  { kind: 'alcohol', id: ALC.id },
  { kind: 'body', id: 'neck' },
  { kind: 'body', id: 'feet' },
  ...COURSES.map((course) => ({ kind: 'course' as const, id: course.id, course })),
];

/** Emoji of a campus entry (for previews). */
export const campusEmoji = (c: CampusEntry) =>
  c.kind === 'alcohol' ? ALC.emoji : c.kind === 'body' ? BODY[c.id].emoji : c.course.emoji;

export function CampusCard({ entry }: { entry: CampusEntry }) {
  if (entry.kind === 'alcohol') return <AlcCampusCard />;
  if (entry.kind === 'body') return <BodyCampusCard id={entry.id} />;
  return <CourseCard course={entry.course} />;
}

/** Alkol Bağımlılığı Kampüsü row: this week's standard drinks (cut) or the alcohol-free day (quit). */
export function AlcCampusCard() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const access = useAccess();
  const s = useCampusStore((x) => x.alcohol);
  const now = new Date();
  const active = alcPhase(s) === 'active';
  const week = alcWeek(s, now);
  const status = !active
    ? tr('acampus.card.setup')
    : s.mode === 'cut'
      ? tr('acampus.card.cut', { total: String(week.total).replace('.', ','), limit: week.limit })
      : tr('acampus.card.quit', { count: dryDays(s, now) + 1 });
  const progress = !active ? 0 : s.mode === 'cut' ? Math.min(1, week.total / week.limit) : Math.min(1, dryDays(s, now) / s.quitGoalDays);
  return (
    <Card onPress={() => openGated('courses', '/campus/alcohol')} accessibilityLabel={`${ALC.title}, ${status}`} style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <AppText variant="h1">{ALC.emoji}</AppText>
        <View style={{ flex: 1 }}>
          <AppText variant="h3">{ALC.title}</AppText>
          <AppText variant="small" weight="700" color={t.colors.primary}>
            {status}
          </AppText>
        </View>
        <Icon name={access('courses') ? 'chevron' : 'lock'} color={t.colors.textMuted} size={18} />
      </View>
      <ProgressBar value={progress} height={6} color={s.mode === 'cut' && week.over ? t.colors.danger : undefined} />
    </Card>
  );
}

/** Exercise campus row (Dik Boyun / Güçlü Kemer): programme week and this week's routine days. */
export function BodyCampusCard({ id }: { id: BodyId }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const access = useAccess();
  const c = BODY[id];
  const s = useCampusStore((x) => x[id]);
  const now = new Date();
  const active = bodyPhase(s) === 'active';
  const week = programWeek(s, now);
  const status = !active
    ? tr('body.card.setup')
    : week > c.weeks
      ? tr('body.card.done')
      : tr('body.card.active', { week, done: Math.min(c.weeklyTarget, weekRoutineDays(s, now)), goal: c.weeklyTarget });
  return (
    <Card onPress={() => openGated('courses', `/campus/${id}`)} accessibilityLabel={`${c.title}, ${status}`} style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <AppText variant="h1">{c.emoji}</AppText>
        <View style={{ flex: 1 }}>
          <AppText variant="h3">{c.title}</AppText>
          <AppText variant="small" weight="700" color={t.colors.primary}>
            {status}
          </AppText>
        </View>
        <Icon name={access('courses') ? 'chevron' : 'lock'} color={t.colors.textMuted} size={18} />
      </View>
      <ProgressBar value={active ? programProgress(s, c.weeks, c.weeklyTarget) : 0} height={6} />
    </Card>
  );
}

/** Course row used on Discover and on the all-courses list. */
export function CourseCard({ course }: { course: Course }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const access = useAccess();
  const done = useProgressStore((s) => s.content.courseProgress[course.id]?.completedLessonIds.length ?? 0);
  return (
    <Card
      onPress={() => openGated('courses', { pathname: '/course/[courseId]', params: { courseId: course.id } })}
      accessibilityLabel={`${course.title}, ${tr('courses.progress', { done, total: course.lessons.length })}`}
      style={{ gap: 8 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <AppText variant="h1">{course.emoji}</AppText>
        <View style={{ flex: 1 }}>
          <AppText variant="h3">{course.title}</AppText>
          <AppText variant="small" weight="700" color={t.colors.primary}>
            {done > 0 ? tr('courses.progress', { done, total: course.lessons.length }) : tr('courses.notStarted', { count: course.lessons.length })}
          </AppText>
        </View>
        <Icon name={access('courses') ? 'chevron' : 'lock'} color={t.colors.textMuted} size={18} />
      </View>
      <ProgressBar value={done / course.lessons.length} height={6} />
    </Card>
  );
}

/** "Neden, Nedir ve Ne Demek?" row, styled like a course row. Free for everyone. */
/** `detail`: none = title only (Training), short = one line (Discover), full = whole summary (all-terms list). */
export function GlossaryCard({ term, detail = 'none' }: { term: GlossaryTerm; detail?: 'none' | 'short' | 'full' }) {
  const t = useTheme();
  return (
    <Card
      onPress={() => router.push({ pathname: '/glossary/[termId]', params: { termId: term.id } })}
      accessibilityLabel={term.title}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
    >
      <AppText variant="h1">{term.emoji}</AppText>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="h3">{term.title}</AppText>
        {detail !== 'none' ? (
          <AppText variant="small" muted numberOfLines={detail === 'short' ? 1 : undefined}>
            {term.summary}
          </AppText>
        ) : null}
      </View>
      <Icon name="chevron" color={t.colors.textMuted} size={18} />
    </Card>
  );
}

/**
 * Last row of a Discover section: opens the full list. On the left, the next items'
 * emojis overlap like a stack with a "+N" badge, so it reads as "there is more here".
 */
export function SeeAllCard({ label, hint, emojis, moreCount, onPress }: { label: string; hint: string; emojis: string[]; moreCount: number; onPress: () => void }) {
  const t = useTheme();
  const shown = emojis.slice(0, 3);
  const size = 40;
  return (
    <Card onPress={onPress} accessibilityLabel={`${label}, ${hint}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, borderStyle: 'dashed', borderColor: t.colors.primary }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }} importantForAccessibility="no-hide-descendants">
        {shown.map((e, i) => (
          <View
            key={`${e}-${i}`}
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              marginLeft: i === 0 ? 0 : -14,
              backgroundColor: t.colors.surfaceAlt,
              borderWidth: 2,
              borderColor: t.colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: shown.length - i,
            }}
          >
            <AppText>{e}</AppText>
          </View>
        ))}
        {moreCount > shown.length ? (
          <View style={{ height: size, minWidth: size, paddingHorizontal: 6, borderRadius: size / 2, marginLeft: -14, backgroundColor: t.colors.primary, borderWidth: 2, borderColor: t.colors.surface, alignItems: 'center', justifyContent: 'center' }}>
            <AppText variant="tiny" weight="800" color={t.colors.primaryText}>
              +{moreCount - shown.length}
            </AppText>
          </View>
        ) : null}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText weight="800" color={t.colors.primary}>
          {label}
        </AppText>
        <AppText variant="small" muted>
          {hint}
        </AppText>
      </View>
      <Icon name="chevron" color={t.colors.primary} size={18} />
    </Card>
  );
}
