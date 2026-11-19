import { AESEncryptionKey, AESSealedData, aesDecryptAsync, aesEncryptAsync, CryptoDigestAlgorithm, digestStringAsync, randomUUID } from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { utf8Decode, utf8Encode, type Codec } from './codec';
import { createMemoryVaultBackend, createVault, type Vault, type VaultBackend, type VaultRow } from './vault';

/**
 * Device side of the Odak Kampı privacy layer:
 *  - the vault key (AES-256) lives in the device keychain / keystore, never leaves this device and is
 *    not part of backups (…THIS_DEVICE_ONLY);
 *  - the app PIN (only on phones without a lock) is stored as a salted SHA-256 hash in the same place;
 *  - the vault rows are in their own SQLite database (odak.db), sealed with AES-GCM.
 * The web preview has no keychain: everything stays in memory there (nothing is written).
 */
const KEY_ID = 'odak.vault.key.v1';
const PIN_ID = 'odak.pin.v1';
const DB_NAME = 'odak.db';
const WEB = Platform.OS === 'web';
const STORE_OPTS: SecureStore.SecureStoreOptions = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };

const memory = new Map<string, string>();
const secureGet = (id: string) => (WEB ? Promise.resolve(memory.get(id) ?? null) : SecureStore.getItemAsync(id, STORE_OPTS));
const secureSet = (id: string, v: string) => (WEB ? Promise.resolve(void memory.set(id, v)) : SecureStore.setItemAsync(id, v, STORE_OPTS));
const secureDelete = (id: string) => (WEB ? Promise.resolve(void memory.delete(id)) : SecureStore.deleteItemAsync(id, STORE_OPTS));

// ── Key and codec ───────────────────────────────────────────────────────────────

let keyPromise: Promise<AESEncryptionKey> | null = null;

function vaultKey(): Promise<AESEncryptionKey> {
  keyPromise ??= (async () => {
    const hex = await secureGet(KEY_ID);
    if (hex) return AESEncryptionKey.import(hex, 'hex');
    const key = await AESEncryptionKey.generate(256);
    await secureSet(KEY_ID, await key.encoded('hex'));
    return key;
  })().catch((e: unknown) => {
    keyPromise = null;
    throw e;
  });
  return keyPromise;
}

export const aesCodec: Codec = {
  async seal(text) {
    const sealed = await aesEncryptAsync(utf8Encode(text), await vaultKey());
    return (await sealed.combined('base64')) as string;
  },
  async open(sealed) {
    const bytes = await aesDecryptAsync(AESSealedData.fromCombined(sealed), await vaultKey(), { output: 'bytes' });
    return utf8Decode(bytes as Uint8Array);
  },
};

// ── Vault ───────────────────────────────────────────────────────────────────────

function sqliteBackend(): VaultBackend {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { openDatabaseSync } = require('expo-sqlite') as typeof import('expo-sqlite');
  const db = openDatabaseSync(DB_NAME);
  db.execSync('PRAGMA journal_mode = WAL; CREATE TABLE IF NOT EXISTS vault (col TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL, PRIMARY KEY (col, id));');
  return {
    all: () => db.getAllSync<VaultRow>('SELECT col, id, data FROM vault'),
    put: (r) => void db.runSync('INSERT OR REPLACE INTO vault (col, id, data) VALUES (?, ?, ?)', [r.col, r.id, r.data]),
    remove: (col, id) => void db.runSync('DELETE FROM vault WHERE col = ? AND id = ?', [col, id]),
    clear: () => void db.runSync('DELETE FROM vault'),
  };
}

let vault: Vault | null = null;

export function odakVault(): Vault {
  vault ??= createVault(WEB ? createMemoryVaultBackend() : sqliteBackend(), aesCodec);
  return vault;
}

// ── App PIN ─────────────────────────────────────────────────────────────────────

const hashPin = (salt: string, pin: string) => digestStringAsync(CryptoDigestAlgorithm.SHA256, `${salt}:${pin}`);

export async function hasPin(): Promise<boolean> {
  return (await secureGet(PIN_ID)) !== null;
}

export async function savePin(pin: string): Promise<void> {
  const salt = randomUUID();
  await secureSet(PIN_ID, JSON.stringify({ salt, hash: await hashPin(salt, pin) }));
}

export async function checkPin(pin: string): Promise<boolean> {
  const raw = await secureGet(PIN_ID);
  if (!raw) return false;
  try {
    const { salt, hash } = JSON.parse(raw) as { salt: string; hash: string };
    return (await hashPin(salt, pin)) === hash;
  } catch {
    return false;
  }
}

export const deletePin = () => secureDelete(PIN_ID);

// ── Device lock ─────────────────────────────────────────────────────────────────

/** Does the phone have a lock (code, fingerprint, face) the camp can use? */
export async function deviceSecured(): Promise<boolean> {
  if (WEB) return false;
  try {
    return (await LocalAuthentication.getEnrolledLevelAsync()) !== LocalAuthentication.SecurityLevel.NONE;
  } catch {
    return false;
  }
}

/** Face ID / fingerprint, falling back to the device code. */
export async function deviceUnlock(promptMessage: string, cancelLabel: string): Promise<boolean> {
  try {
    const r = await LocalAuthentication.authenticateAsync({ promptMessage, cancelLabel, disableDeviceFallback: false });
    return r.success;
  } catch {
    return false;
  }
}

// ── Wipe ────────────────────────────────────────────────────────────────────────

/** Deletes every Odak row, the vault key and the PIN. Cannot be undone. */
export async function wipeOdakSecrets(): Promise<void> {
  odakVault().clear();
  keyPromise = null;
  await secureDelete(KEY_ID);
  await deletePin();
}
