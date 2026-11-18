import type { CravingEvent, IfThenPlan, TriggerId } from '../types';

/** Urge-surfing lengths offered (minutes); 3 is the default. */
export const SURF_MINUTES = [3, 5] as const;
export const DELAY_MINUTES = 10;
export const BREATH_MINUTES = 2;

/** Cravings ridden out without smoking ("Bu güne kadar N krizi atlattın"). */
export const resistedCount = (cravings: CravingEvent[]) => cravings.filter((c) => c.outcome === 'resisted').length;

/** Which guidance line to show: the prompts are spread evenly over the session. */
export function surfPromptIndex(elapsedSec: number, totalSec: number, count: number): number {
  if (count <= 0 || totalSec <= 0) return 0;
  return Math.min(count - 1, Math.max(0, Math.floor((elapsedSec / totalSec) * count)));
}

/**
 * Height of the urge wave (0–1) over the session: it builds up to a peak at 40% of the time,
 * then fades — the shape the guidance describes ("it rises, peaks and falls").
 */
export function waveAmplitude(elapsedSec: number, totalSec: number): number {
  if (totalSec <= 0) return 0;
  const x = Math.min(1, Math.max(0, elapsedSec / totalSec));
  const peak = 0.4;
  const v = x <= peak ? Math.sin((x / peak) * (Math.PI / 2)) : Math.cos(((x - peak) / (1 - peak)) * (Math.PI / 2));
  return 0.15 + 0.85 * Math.max(0, v);
}

/** If–then plans for a trigger (shown when that trigger is chosen in SOS). */
export const plansForTrigger = (plans: IfThenPlan[], trigger: TriggerId | null) => (trigger ? plans.filter((p) => p.trigger === trigger) : []);

// ── 60-second matching game ──────────────────────────────────────────────────────

export interface GameCard {
  symbol: string;
  matched: boolean;
}
export interface MatchGame {
  cards: GameCard[];
  /** Face-up, not yet matched cards (0–2). */
  open: number[];
  moves: number;
}

/** A shuffled deck with each symbol twice. `random` is injectable for tests. */
export function newMatchGame(symbols: string[], random: () => number = Math.random): MatchGame {
  const cards = [...symbols, ...symbols].map((symbol) => ({ symbol, matched: false }));
  for (let i = cards.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [cards[i], cards[j]] = [cards[j]!, cards[i]!];
  }
  return { cards, open: [], moves: 0 };
}

/**
 * Turns a card. Two open cards with the same symbol are matched; two different ones stay
 * visible until the next tap, which turns them back and opens the tapped card.
 */
export function flipCard(g: MatchGame, index: number): MatchGame {
  const card = g.cards[index];
  if (!card || card.matched || (g.open.length < 2 && g.open.includes(index))) return g;
  const open = g.open.length >= 2 ? [index] : [...g.open, index];
  if (open.length < 2) return { ...g, open };
  const [a, b] = open as [number, number];
  if (g.cards[a]!.symbol !== g.cards[b]!.symbol) return { ...g, open, moves: g.moves + 1 };
  return { cards: g.cards.map((c, i) => (i === a || i === b ? { ...c, matched: true } : c)), open: [], moves: g.moves + 1 };
}

export const gameWon = (g: MatchGame) => g.cards.every((c) => c.matched);
export const matchedPairs = (g: MatchGame) => g.cards.filter((c) => c.matched).length / 2;
