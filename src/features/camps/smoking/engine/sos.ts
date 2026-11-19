import type { CravingEvent, IfThenPlan, TriggerId } from '../types';

export { BREATH_MINUTES, SURF_MINUTES, surfPromptIndex, waveAmplitude } from '@/features/camps/core/sosEngine';
export const DELAY_MINUTES = 10;

/** Cravings ridden out without smoking ("Bu güne kadar N krizi atlattın"). */
export const resistedCount = (cravings: CravingEvent[]) => cravings.filter((c) => c.outcome === 'resisted').length;

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
