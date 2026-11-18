/** Calendar helpers in the device's local time (Türkiye has no daylight saving, but midnight crossings matter). */
export const MIN_MS = 60_000;
export const HOUR_MS = 3_600_000;
export const DAY_MS = 86_400_000;

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Local calendar day key (YYYY-MM-DD). */
export function dayKey(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Whole calendar days from `a` to `b` (midnight to midnight; negative when b is earlier). */
export function calendarDaysBetween(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY_MS);
}

export const ms = (iso: string) => new Date(iso).getTime();
