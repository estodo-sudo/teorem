/** Local-date helpers. Date keys are "YYYY-MM-DD" in the device's local time. */

const pad = (n: number) => (n < 10 ? `0${n}` : String(n));

export function toDateKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function addDays(key: string, days: number): string {
  const d = fromDateKey(key);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

/** Whole calendar days from a to b (b - a). DST-safe. */
export function daysBetween(a: string, b: string): number {
  const da = fromDateKey(a);
  const db = fromDateKey(b);
  const utcA = Date.UTC(da.getFullYear(), da.getMonth(), da.getDate());
  const utcB = Date.UTC(db.getFullYear(), db.getMonth(), db.getDate());
  return Math.round((utcB - utcA) / 86_400_000);
}

/** Monday-based start of the week for a date key. */
export function startOfWeek(key: string): string {
  const d = fromDateKey(key);
  const dow = (d.getDay() + 6) % 7; // Mon=0
  return addDays(key, -dow);
}

export function parseTime(hhmm: string): { hour: number; minute: number } {
  const [h, m] = hhmm.split(':').map(Number);
  return { hour: Math.min(23, Math.max(0, h ?? 0)), minute: Math.min(59, Math.max(0, m ?? 0)) };
}

export function formatTime(hour: number, minute: number): string {
  return `${pad(hour)}:${pad(minute)}`;
}

export function formatDuration(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${pad(r)}`;
}
