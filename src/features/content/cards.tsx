import { ALC } from '@/features/campus/alcohol/content';
import type { BodyId } from '@/features/campus/body/logic';

import { COURSES, type Course } from './data';

/**
 * Every programme in display order (Keşfet v2 shows the alcohol one in the Kamplar strip as "Alkolsüz Kamp";
 * ids and routes stay /campus/*). The old row cards and the "see all" lists were removed (SPEC_KESFET_V2 §7).
 */
export type CampusEntry = { kind: 'alcohol'; id: string }
  | { kind: 'body'; id: BodyId }
  | { kind: 'course'; id: string; course: Course };
export const CAMPUSES: CampusEntry[] = [
  { kind: 'alcohol', id: ALC.id },
  { kind: 'body', id: 'neck' },
  { kind: 'body', id: 'feet' },
  ...COURSES.map((course) => ({ kind: 'course' as const, id: course.id, course })),
];
