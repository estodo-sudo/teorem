import { useProfileStore } from '@/stores/profileStore';
import type { Sex } from '@/types';

/**
 * Programme texts for women and men. The training engine, ids and stored data are the same for both;
 * only the words change (e.g. the gentle, doctor-cleared track is "prostate surgery" for men and
 * "after giving birth" for women). Older installs have no answer yet and read as male.
 */
export const sexOf = (v: Sex | null | undefined): Sex => (v === 'female' ? 'female' : 'male');
export const currentSex = (): Sex => sexOf(useProfileStore.getState().profile.sex);
export const useSex = (): Sex => useProfileStore((s) => sexOf(s.profile.sex));

/** i18next context: `t('goal.erection', sexCtx(sex))` reads `goal.erection_female` for women, if present. */
export const sexCtx = (sex: Sex): { context?: string } => (sex === 'female' ? { context: 'female' } : {});

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Lays `patch` over `base` without changing either. Objects merge key by key. In arrays, a patch item
 * with an `id` replaces fields of the base item with the same id; items without an id go by position,
 * and `null` (or a shorter patch) keeps the base items. `{ $replace: [...] }` replaces a list as a whole.
 */
export function overlay<T>(base: T, patch: unknown): T {
  if (patch === undefined || patch === null) return base;
  // { $replace: [...] } replaces a list as a whole (e.g. a story's sources, a track's sourceIds).
  if (isObj(patch) && '$replace' in patch) return patch.$replace as T;
  if (Array.isArray(base) && Array.isArray(patch)) {
    const byId = new Map(patch.filter((p) => isObj(p) && typeof p.id === 'string').map((p) => [(p as { id: string }).id, p]));
    const anyId = byId.size > 0;
    return base.map((item, i) => {
      if (anyId) return isObj(item) && typeof item.id === 'string' ? overlay(item, byId.get(item.id)) : item;
      return overlay(item, patch[i]);
    }) as T;
  }
  if (isObj(base) && isObj(patch)) {
    const out: Record<string, unknown> = { ...base };
    for (const [k, v] of Object.entries(patch)) out[k] = k in base ? overlay(base[k], v) : v;
    return out as T;
  }
  return patch as T;
}

/**
 * A content constant that follows the profile's sex. Callers keep using it like the plain object or
 * array (`SCREENING.questions`, `KEGEL_TRACKS.find(...)`); every read picks the current variant, so a
 * change in settings shows on the next render.
 */
export function bySex<T extends object>(base: T, female: unknown): T {
  return sexVariants(base, overlay(base, female));
}

/**
 * Women's content lists (2026-11-25): `hide` takes out items only men need (e.g. erection topics),
 * `patch` lays women's wording over shared items (by id), and `add` puts women-only items where a
 * hidden one stood (`after`), so the list keeps its order and length.
 */
export function femaleList<T extends { id: string }>(base: T[], spec: { hide?: string[]; patch?: unknown[]; add?: (Partial<T> & { after?: string })[] }): T[] {
  const patched = overlay(base, spec.patch ?? []);
  const hide = new Set(spec.hide ?? []);
  const out: T[] = [];
  for (const item of patched) {
    if (!hide.has(item.id)) out.push(item);
    for (const a of spec.add ?? []) if (a.after === item.id) out.push(a as unknown as T);
  }
  for (const a of spec.add ?? []) if (!a.after || !base.some((b) => b.id === a.after)) out.push(a as unknown as T);
  return out;
}

/** A value that is `male` or `female` depending on the profile, read afresh on every access. */
export function sexVariants<T extends object>(male: T, female: T): T {
  const base = male;
  const variants: Record<Sex, T> = { male, female };
  const cur = () => variants[currentSex()];
  return new Proxy(base, {
    get: (_t, key) => {
      const v = cur();
      const val = Reflect.get(v, key, v) as unknown;
      return typeof val === 'function' ? (val as (...a: unknown[]) => unknown).bind(v) : val;
    },
    has: (_t, key) => Reflect.has(cur(), key),
    ownKeys: () => Reflect.ownKeys(cur()),
    getOwnPropertyDescriptor: (_t, key) => {
      const d = Reflect.getOwnPropertyDescriptor(cur(), key);
      if (!d) return d;
      // Proxy invariant: a key the target can't reconfigure (an array's `length`) must say so too.
      const own = Reflect.getOwnPropertyDescriptor(base, key);
      return { ...d, configurable: own ? own.configurable : true };
    },
  });
}
