import type { RelapseCause } from '../types';

export interface LessonRef {
  id: string;
  order: number;
  bonus: boolean;
  relapse: RelapseCause[];
}

export type LessonStatus = 'done' | 'open' | 'locked';

/**
 * Lessons open one after another. A lesson linked to one of the user's earlier relapse causes is
 * open from the start ("brought forward"); the bonus lesson opens after the first lesson.
 */
export function lessonStatuses(lessons: LessonRef[], completedIds: string[], relapseCauses: RelapseCause[]): Record<string, LessonStatus> {
  const out: Record<string, LessonStatus> = {};
  const main = lessons.filter((l) => !l.bonus).sort((a, b) => a.order - b.order);
  let prevDone = true;
  for (const l of main) {
    const done = completedIds.includes(l.id);
    out[l.id] = done ? 'done' : prevDone || l.relapse.some((c) => relapseCauses.includes(c)) ? 'open' : 'locked';
    prevDone = done;
  }
  const firstDone = main[0] ? completedIds.includes(main[0].id) : true;
  for (const l of lessons.filter((x) => x.bonus)) out[l.id] = completedIds.includes(l.id) ? 'done' : firstDone ? 'open' : 'locked';
  return out;
}

/** Lessons recommended because of earlier relapse causes (not yet done). */
export const recommendedLessons = (lessons: LessonRef[], completedIds: string[], relapseCauses: RelapseCause[]) => lessons.filter((l) => !completedIds.includes(l.id) && l.relapse.some((c) => relapseCauses.includes(c))).map((l) => l.id);

/** Today's lesson for the panel: a recommended open one first, else the next open one in order. */
export function nextLesson(lessons: LessonRef[], completedIds: string[], relapseCauses: RelapseCause[]): string | null {
  const st = lessonStatuses(lessons, completedIds, relapseCauses);
  const open = [...lessons].sort((a, b) => Number(a.bonus) - Number(b.bonus) || a.order - b.order).filter((l) => st[l.id] === 'open');
  const rec = open.find((l) => l.relapse.some((c) => relapseCauses.includes(c)));
  return (rec ?? open[0])?.id ?? null;
}

/** Quiz score 0–1 from chosen answers. */
export const quizScore = (answers: number[], correct: number[]) => (correct.length ? correct.filter((c, i) => answers[i] === c).length / correct.length : 1);
