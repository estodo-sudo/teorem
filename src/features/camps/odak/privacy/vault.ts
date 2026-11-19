import type { Codec } from './codec';

/**
 * Encrypted store of the Odak Kampı. Every row is sealed (AES-256-GCM on the device, see
 * crypto.ts); on disk there is only an id, a neutral collection name and ciphertext — no dates,
 * kinds or text. Rows are few (a few per day), so collections are loaded whole and filtered in JS.
 */
export interface VaultRow {
  col: string;
  id: string;
  data: string;
}

export interface VaultBackend {
  all: () => VaultRow[];
  put: (row: VaultRow) => void;
  remove: (col: string, id: string) => void;
  clear: () => void;
}

export function createMemoryVaultBackend(): VaultBackend & { rows: Map<string, VaultRow> } {
  const rows = new Map<string, VaultRow>();
  const k = (col: string, id: string) => `${col}\u0000${id}`;
  return {
    rows,
    all: () => [...rows.values()],
    put: (r) => void rows.set(k(r.col, r.id), r),
    remove: (col, id) => void rows.delete(k(col, id)),
    clear: () => rows.clear(),
  };
}

/** Single documents (state, settings) live in this collection, keyed by name. */
export const DOC_COL = 'doc';

export interface Vault {
  /** Every collection, decrypted. Rows that cannot be opened (wrong key / damaged) are skipped. */
  load: () => Promise<{ docs: Record<string, unknown>; lists: Record<string, { id: string }[]> }>;
  setDoc: (name: string, value: unknown) => Promise<void>;
  put: <T extends { id: string }>(col: string, item: T) => Promise<void>;
  remove: (col: string, id: string) => void;
  clear: () => void;
}

export function createVault(backend: VaultBackend, codec: Codec): Vault {
  return {
    async load() {
      const docs: Record<string, unknown> = {};
      const lists: Record<string, { id: string }[]> = {};
      for (const r of backend.all()) {
        let value: unknown;
        try {
          value = JSON.parse(await codec.open(r.data));
        } catch {
          continue;
        }
        if (r.col === DOC_COL) docs[r.id] = value;
        else (lists[r.col] ??= []).push(value as { id: string });
      }
      return { docs, lists };
    },
    async setDoc(name, value) {
      backend.put({ col: DOC_COL, id: name, data: await codec.seal(JSON.stringify(value)) });
    },
    async put(col, item) {
      if (col === DOC_COL) throw new Error('reserved collection');
      backend.put({ col, id: item.id, data: await codec.seal(JSON.stringify(item)) });
    },
    remove: (col, id) => backend.remove(col, id),
    clear: () => backend.clear(),
  };
}
