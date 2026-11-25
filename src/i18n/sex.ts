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
 * and `null` keeps the base item. A list of plain values (strings, numbers) replaces the base list.
 */
export function overlay<T>(base: T, patch: unknown): T {
  if (patch === undefined || patch === null) return base;
  if (Array.isArray(base) && Array.isArray(patch)) {
    // A list of plain values (e.g. sourceIds) is replaced as a whole.
    if (patch.every((p) => p !== null && typeof p !== 'object')) return patch as T;
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
  const variants: Record<Sex, T> = { male: base, female: overlay(base, female) };
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
