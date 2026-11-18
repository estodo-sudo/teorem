import type { CampState } from '../state';
import { currentAttempt, latestAttempt } from '../state';
import type { CampEvents, SymptomId, TriggerId } from '../types';

import { slipsOf, smokeFreeDuration, totalSmokeFreeDays } from './counters';
import { currentPhase, quitStart } from './phase';
import { moneySaved } from './savings';
import { DAY_MS, ms } from './time';

/** The "show my doctor" summary: only what the user entered, nothing interpreted. */
export interface DoctorSummary {
  generatedAt: string;
  attemptNo: number;
  method: string;
  quitDate: string;
  phase: string;
  smokeFreeDays: number;
  sinceLastDays: number;
  perDayBefore: number;
  years: number;
  hsiScore: number;
  hsiLevel: string;
  products: string[];
  slips: number;
  cravings: { total: number; resisted: number; avgBefore: number | null; avgAfter: number | null };
  checkins: number;
  /** Most reported withdrawal symptoms (last 30 days). */
  topSymptoms: { id: SymptomId; count: number }[];
  /** Average mood (1–5) in the last 7 days; null when no check-ins. */
  moodLast7: number | null;
  topTriggers: { id: TriggerId; count: number }[];
  savedTRY: number;
}

const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null);
const top = <K extends string>(items: K[], n: number) => {
  const m = new Map<K, number>();
  for (const i of items) m.set(i, (m.get(i) ?? 0) + 1);
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([id, count]) => ({ id, count }));
};

export function doctorSummary(s: CampState, ev: CampEvents, now: Date): DoctorSummary | null {
  const a = currentAttempt(s) ?? latestAttempt(s);
  if (!a || !s.profile) return null;
  const p = s.profile;
  const since = ms(a.startedAt);
  const cravings = ev.cravings.filter((c) => ms(c.at) >= since);
  const recent = ev.checkins.filter((c) => now.getTime() - ms(c.at) <= 30 * DAY_MS);
  const week = ev.checkins.filter((c) => now.getTime() - ms(c.at) <= 7 * DAY_MS);
  const triggers = [...ev.cigarettes.filter((l) => l.attemptId === a.id && l.trigger).map((l) => l.trigger!), ...cravings.filter((c) => c.trigger).map((c) => c.trigger!)];
  return {
    generatedAt: now.toISOString(),
    attemptNo: a.attemptNo,
    method: p.method,
    quitDate: quitStart(a),
    phase: currentPhase(a, now),
    smokeFreeDays: totalSmokeFreeDays(a, ev.cigarettes, now),
    sinceLastDays: Math.floor(smokeFreeDuration(a, ev.cigarettes, now) / DAY_MS),
    perDayBefore: p.perDay,
    years: p.years,
    hsiScore: p.hsiScore,
    hsiLevel: p.hsiLevel,
    products: p.products,
    slips: slipsOf(a, ev.cigarettes).length,
    cravings: {
      total: cravings.length,
      resisted: cravings.filter((c) => c.outcome === 'resisted').length,
      avgBefore: avg(cravings.map((c) => c.intensityBefore)),
      avgAfter: avg(cravings.filter((c) => c.intensityAfter !== undefined).map((c) => c.intensityAfter!)),
    },
    checkins: ev.checkins.filter((c) => ms(c.at) >= since).length,
    topSymptoms: top(
      recent.flatMap((c) => c.symptoms),
      4,
    ),
    moodLast7: avg(week.map((c) => c.mood)),
    topTriggers: top(triggers, 3),
    savedTRY: Math.round(moneySaved(s.prices, p.perDay, a, ev.cigarettes, now)),
  };
}

const esc = (v: unknown) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Printable HTML (A4) for the summary. `rows` are [label, value] pairs already localised by the screen. */
export function summaryHtml(title: string, subtitle: string, rows: [string, string][], note: string): string {
  const body = rows.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('');
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<style>body{font-family:-apple-system,Roboto,Arial,sans-serif;color:#111;margin:32px}h1{font-size:22px;margin:0 0 4px}p{color:#555;margin:0 0 18px;font-size:13px}
table{border-collapse:collapse;width:100%;font-size:14px}th,td{text-align:left;padding:8px 10px;border-bottom:1px solid #ddd;vertical-align:top}th{width:45%;color:#333;font-weight:600}
.note{margin-top:18px;font-size:12px;color:#666}</style></head><body><h1>${esc(title)}</h1><p>${esc(subtitle)}</p><table>${body}</table><p class="note">${esc(note)}</p></body></html>`;
}

export interface SupporterVars {
  supporter: string;
  date: string;
  days: number;
}

/** Fills {supporter} {date} {days} in a supporter message. */
export const supporterText = (template: string, v: SupporterVars) => template.replace(/\{(supporter|date|days)\}/g, (_, k: keyof SupporterVars) => String(v[k]));
