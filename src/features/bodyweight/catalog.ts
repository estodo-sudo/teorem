import type { IconName } from '@/components/Icon';
import { pick } from '@/i18n/content';
import bacakTextTr from '@/content/bodyweight/bacak.tr.json';
import bacakTextEn from '@/content/bodyweight/bacak.en.json';
import baldirTextTr from '@/content/bodyweight/baldir.tr.json';
import baldirTextEn from '@/content/bodyweight/baldir.en.json';
import gogusTextTr from '@/content/bodyweight/gogus.tr.json';
import gogusTextEn from '@/content/bodyweight/gogus.en.json';
import isinmaTextTr from '@/content/bodyweight/isinma.tr.json';
import isinmaTextEn from '@/content/bodyweight/isinma.en.json';
import kalcaTextTr from '@/content/bodyweight/kalca.tr.json';
import kalcaTextEn from '@/content/bodyweight/kalca.en.json';
import kardiyoTextTr from '@/content/bodyweight/kardiyo.tr.json';
import kardiyoTextEn from '@/content/bodyweight/kardiyo.en.json';
import karinTextTr from '@/content/bodyweight/karin.tr.json';
import karinTextEn from '@/content/bodyweight/karin.en.json';
import kolTextTr from '@/content/bodyweight/kol.tr.json';
import kolTextEn from '@/content/bodyweight/kol.en.json';
import omuzTextTr from '@/content/bodyweight/omuz.tr.json';
import omuzTextEn from '@/content/bodyweight/omuz.en.json';
import sirtTextTr from '@/content/bodyweight/sirt.tr.json';
import sirtTextEn from '@/content/bodyweight/sirt.en.json';
import tamVucutTextTr from '@/content/bodyweight/tamVucut.tr.json';
import tamVucutTextEn from '@/content/bodyweight/tamVucut.en.json';

import { buildMoves, type MoveSpec } from '../fitness/motion';
import { BACAK_PROGRAMS } from './bacak';
import { BALDIR_PROGRAMS } from './baldir';
import { GOGUS_PROGRAMS } from './gogus';
import { ISINMA_ROUTINE } from './isinma';
import { KALCA_PROGRAMS } from './kalca';
import { KARDIYO_PROGRAMS } from './kardiyo';
import { KARIN_PROGRAMS } from './karin';
import { KOL_PROGRAMS } from './kol';
import { OMUZ_PROGRAMS } from './omuz';
import bacakPoses from './poses/bacak.json';
import baldirPoses from './poses/baldir.json';
import gogusPoses from './poses/gogus.json';
import isinmaPoses from './poses/isinma.json';
import kalcaPoses from './poses/kalca.json';
import kardiyoPoses from './poses/kardiyo.json';
import karinPoses from './poses/karin.json';
import kolPoses from './poses/kol.json';
import omuzPoses from './poses/omuz.json';
import sirtPoses from './poses/sirt.json';
import tamVucutPoses from './poses/tamVucut.json';
import type { CategoryId, Program, ProgramId, Workout } from './program';
import { SIRT_PROGRAMS } from './sirt';
import { TAM_VUCUT_PROGRAMS } from './tamVucut';

const bacakText = pick({ tr: bacakTextTr, en: bacakTextEn });
const baldirText = pick({ tr: baldirTextTr, en: baldirTextEn });
const gogusText = pick({ tr: gogusTextTr, en: gogusTextEn });
const isinmaText = pick({ tr: isinmaTextTr, en: isinmaTextEn });
const kalcaText = pick({ tr: kalcaTextTr, en: kalcaTextEn });
const kardiyoText = pick({ tr: kardiyoTextTr, en: kardiyoTextEn });
const karinText = pick({ tr: karinTextTr, en: karinTextEn });
const kolText = pick({ tr: kolTextTr, en: kolTextEn });
const omuzText = pick({ tr: omuzTextTr, en: omuzTextEn });
const sirtText = pick({ tr: sirtTextTr, en: sirtTextEn });
const tamVucutText = pick({ tr: tamVucutTextTr, en: tamVucutTextEn });

/** A move's how-to text (unreviewed content). */
export interface BwExercise {
  id: string;
  name: string;
  target: string;
  setup: string;
  steps: string[];
  tip: string;
  mistake: string;
}

export interface CategoryText {
  title: string;
  intro: string;
  science: string[];
}

export interface Category {
  id: CategoryId;
  icon: IconName;
  /** Ready to use (programmes and moves added); the others show "Yakında". */
  ready: boolean;
  programs: Program[];
  /** A single routine instead of programmes (Isınma: one 10-minute warm-up). */
  routine?: Workout;
  text?: CategoryText;
  exercises: BwExercise[];
  moves: Record<string, MoveSpec>;
}

type Content = { category: CategoryText; exercises: BwExercise[] };

const make = (id: CategoryId, icon: IconName, programs: Program[] = [], content?: Content, poses?: unknown, routine?: Workout): Category => ({
  id,
  icon,
  ready: (programs.length > 0 || Boolean(routine)) && Boolean(content),
  programs,
  ...(routine ? { routine } : {}),
  ...(content ? { text: content.category } : {}),
  exercises: content?.exercises ?? [],
  moves: poses ? buildMoves(poses) : {},
});

/** Aletsiz Fitness categories in order (user request 2026-11-22). Filled one by one. */
export const CATEGORIES: Category[] = [
  make('karin', 'target', KARIN_PROGRAMS, karinText as Content, karinPoses),
  make('gogus', 'shield', GOGUS_PROGRAMS, gogusText as Content, gogusPoses),
  make('sirt', 'layers', SIRT_PROGRAMS, sirtText as Content, sirtPoses),
  make('omuz', 'mountain', OMUZ_PROGRAMS, omuzText as Content, omuzPoses),
  make('kol', 'dumbbell', KOL_PROGRAMS, kolText as Content, kolPoses),
  make('bacak', 'footprints', BACAK_PROGRAMS, bacakText as Content, bacakPoses),
  make('kalca', 'circle', KALCA_PROGRAMS, kalcaText as Content, kalcaPoses),
  make('baldir', 'arrowUp', BALDIR_PROGRAMS, baldirText as Content, baldirPoses),
  make('tamVucut', 'body', TAM_VUCUT_PROGRAMS, tamVucutText as Content, tamVucutPoses),
  make('kardiyo', 'heartPulse', KARDIYO_PROGRAMS, kardiyoText as Content, kardiyoPoses),
  make('isinma', 'sun', [], isinmaText as Content, isinmaPoses, ISINMA_ROUTINE),
];

export const getCategory = (id: string) => CATEGORIES.find((c) => c.id === id);
export const getProgram = (c: Category, id: string) => c.programs.find((p) => p.id === (id as ProgramId));
export const getExercise = (c: Category, id: string) => c.exercises.find((e) => e.id === id);
