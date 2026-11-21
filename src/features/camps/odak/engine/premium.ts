import type { OdakLesson, OdakMission } from './program';

/**
 * Free vs premium (SPEC_ODAK_KAMPI 8). Always free: assessment and screening results, SOS (every tool),
 * slip flow, support screen, the "Bilim Ne Diyor?" library, the basic counter and the phone-filter
 * guides. Premium (existing subscription): the full 90-day mission programme, all lessons, detailed
 * statistics, the risky-hour reminder, the specialist summary export and writing the
 * future-self letter (reading an existing letter in SOS stays free).
 */
export const FREE_PHASE = 'awareness';

export const missionIsFree = (m: Pick<OdakMission, 'phase'>) => m.phase === FREE_PHASE;
export const lessonIsFree = (l: Pick<OdakLesson, 'phase'>) => l.phase === FREE_PHASE;
