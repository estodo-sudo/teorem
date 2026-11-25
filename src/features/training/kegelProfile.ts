import { pick } from '@/i18n/content';
import femaleJsonTr from '@/content/kegel/female.tr.json';
import femaleJsonEn from '@/content/kegel/female.en.json';
import { bySex } from '@/i18n/sex';
import screeningJsonTr from '@/content/kegel/screening.tr.json';
import screeningJsonEn from '@/content/kegel/screening.en.json';
import { toDateKey } from '@/lib/date';
import { useKegelStore, type KegelData } from '@/stores/kegelStore';
import { useTrainingStore } from '@/stores/trainingStore';
import type { Goal, TrackId } from '@/types';

import { rescreenDue, screeningToTrack, type ScreeningResult } from './schedule';
import { goalsToTrack, trackAllowed } from './tracks';

const screeningJson = pick({ tr: screeningJsonTr, en: screeningJsonEn });
const femaleJson = pick({ tr: femaleJsonTr, en: femaleJsonEn });

/** Muscle profile screening, tracks and the surgery clearance (SPEC_KEGEL_V2 §2, §3, §11.3). */

export interface ScreeningQuestion {
  id: string;
  text: string;
  pain?: boolean;
  note?: string;
}
export const SCREENING = bySex(screeningJson as unknown as { title: string; intro: string; questions: ScreeningQuestion[]; result: Record<string, string> }, femaleJson.screening);

/** Saves the answers as the muscle profile. The track itself stays the user's choice. */
export function saveScreening(answers: boolean[], now = new Date()): ScreeningResult {
  const result = screeningToTrack(answers);
  useKegelStore.getState().setProfile({
    primaryTrack: useTrainingStore.getState().training.track,
    hypertonicFlag: result.hypertonicFlag,
    painFlag: result.painFlag,
    screeningAnswers: answers.slice(0, SCREENING.questions.length).map((a) => a === true),
    screenedAt: now.toISOString(),
  });
  return result;
}

/** Changes the programme track; the surgery track only with the doctor's clearance. */
export function chooseTrack(track: TrackId): boolean {
  const k = useKegelStore.getState();
  if (!trackAllowed(track, Boolean(k.surgeryClearance))) return false;
  useTrainingStore.getState().update({ track });
  if (k.profile) k.setProfile({ ...k.profile, primaryTrack: track });
  return true;
}

/** "My doctor approved": opens the surgery track. */
export function confirmSurgeryClearance(now = new Date()) {
  useKegelStore.getState().setSurgeryClearance({ confirmedAt: now.toISOString() });
}

/** First track from the onboarding goals (surgery needs the clearance first). */
export function initialTrack(goals: Goal[]): TrackId {
  return goalsToTrack(goals, Boolean(useKegelStore.getState().surgeryClearance));
}

/** Existing users (migration) and new users are asked once; skipping is allowed (§14). */
export const needsScreening = (k: Pick<KegelData, 'profile' | 'screeningSkippedAt'>) => !k.profile && !k.screeningSkippedAt;

/** Relaxation track: re-screen every 2 weeks (§2). */
export function rescreenReminder(k: Pick<KegelData, 'profile'>, track: TrackId, today = toDateKey()): boolean {
  return Boolean(k.profile && track === 'relax' && rescreenDue(k.profile.screenedAt, today));
}
