import { deepClone } from '@/lib/clone';

import { emptyCampEvents } from './state';
import type { CampEvents, CheckIn, CigaretteLog, CravingEvent } from './types';

/** Persistence port for camp event logs. SQLite in the app, in-memory on web and in tests. */
export interface CampRepo {
  loadAll(): CampEvents;
  insertCigarette(l: CigaretteLog): void;
  deleteCigarette(id: string): void;
  insertCraving(c: CravingEvent): void;
  insertCheckin(c: CheckIn): void;
  clearAll(): void;
  replaceAll(data: CampEvents): void;
}

export function createMemoryCampRepo(initial: CampEvents = emptyCampEvents()): CampRepo {
  let data = deepClone(initial);
  const upsert = <T extends { id: string }>(arr: T[], item: T) => {
    const i = arr.findIndex((x) => x.id === item.id);
    if (i >= 0) arr[i] = item;
    else arr.push(item);
  };
  return {
    loadAll: () => deepClone(data),
    insertCigarette: (l) => upsert(data.cigarettes, deepClone(l)),
    deleteCigarette: (id) => {
      data.cigarettes = data.cigarettes.filter((l) => l.id !== id);
    },
    insertCraving: (c) => upsert(data.cravings, deepClone(c)),
    insertCheckin: (c) => upsert(data.checkins, deepClone(c)),
    clearAll: () => {
      data = emptyCampEvents();
    },
    replaceAll: (d) => {
      data = deepClone(d);
    },
  };
}
