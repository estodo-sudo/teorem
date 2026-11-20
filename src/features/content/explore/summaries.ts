import { useTranslation } from 'react-i18next';

import type { IconName } from '@/components/Icon';
import type { ModuleTone } from '@/config/theme';
import type { CampSummary } from '@/features/camps/core/definition';
import { ALC } from '@/features/campus/alcohol/content';
import { alcPhase, dryDays, thisWeek as alcWeek } from '@/features/campus/alcohol/logic';
import { BODY } from '@/features/campus/body/content';
import { bodyPhase, programProgress, programWeek, type BodyId } from '@/features/campus/body/logic';
import { useAccess } from '@/features/purchases/useGate';
import { useCampusStore } from '@/stores/campusStore';
import { useProgressStore } from '@/stores/progressStore';

import type { Course } from '../data';

/**
 * Alkolsüz Kamp (route and data stay /campus/alcohol, SPEC_KESFET_V2 §3): shown in the Kamplar strip.
 * Same status line as before; "joined" once the plan is set up.
 */
export function useAlcSummary(): CampSummary {
  const { t: tr } = useTranslation();
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
  return { joined: active, day: active && s.mode === 'quit' ? Math.min(s.quitGoalDays, dryDays(s, now) + 1) : undefined, total: s.quitGoalDays, progress, status };
}

export interface ProgramSummary {
  key: string;
  title: string;
  icon: IconName;
  tone: ModuleTone;
  /** Length chip: "8 hafta" or "6 ders". */
  length: string;
  /** "Hafta 2 / 8" or "2/6 ders" once started. */
  progressLabel?: string;
  progress: number;
  locked: boolean;
  route: { kind: 'body'; id: BodyId } | { kind: 'course'; id: string };
}

/** Exercise programme (Dik Boyun, Güçlü Kemer): programme week and progress. */
export function useBodySummary(id: BodyId): ProgramSummary {
  const { t: tr } = useTranslation();
  const access = useAccess();
  const c = BODY[id];
  const s = useCampusStore((x) => x[id]);
  const now = new Date();
  const active = bodyPhase(s) === 'active';
  const week = Math.min(c.weeks, programWeek(s, now));
  return {
    key: id,
    title: c.title,
    icon: c.icon,
    tone: 'campus',
    length: tr('discover.weeks', { count: c.weeks }),
    progressLabel: active ? tr('discover.weekOf', { week, total: c.weeks }) : undefined,
    progress: active ? programProgress(s, c.weeks, c.weeklyTarget) : 0,
    locked: !access('courses'),
    route: { kind: 'body', id },
  };
}

/** Lesson programme: lessons done of total. */
export function useCourseSummary(course: Course): ProgramSummary {
  const { t: tr } = useTranslation();
  const access = useAccess();
  const done = useProgressStore((s) => s.content.courseProgress[course.id]?.completedLessonIds.length ?? 0);
  const total = course.lessons.length;
  return {
    key: course.id,
    title: course.title,
    icon: course.icon,
    tone: 'knowledge',
    length: tr('discover.lessons', { count: total }),
    progressLabel: done > 0 ? tr('discover.lessonsDone', { done, total }) : undefined,
    progress: done / Math.max(1, total),
    locked: !access('courses'),
    route: { kind: 'course', id: course.id },
  };
}

export { ALC };
