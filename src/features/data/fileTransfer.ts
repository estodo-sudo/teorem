import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { snapshotApp } from './appData';
import { buildExport, exportFileName, parseImport, serializeExport, type ImportResult } from './exportImport';
import { MAX_IMPORT_BYTES } from './sanitize';

/** Writes the backup JSON to cache and opens the system share sheet. */
export async function exportToShareSheet(): Promise<'shared' | 'unavailable'> {
  const json = serializeExport(buildExport(snapshotApp()));
  if (Platform.OS === 'web') {
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = exportFileName();
    a.click();
    return 'shared';
  }
  const file = new File(Paths.cache, exportFileName());
  if (file.exists) file.delete();
  file.create();
  file.write(json);
  if (!(await Sharing.isAvailableAsync())) return 'unavailable';
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: exportFileName(), UTI: 'public.json' });
  return 'shared';
}

/** Lets the user pick a backup file and validates it (does not apply it). */
export async function pickImportFile(): Promise<ImportResult | null> {
  const res = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true });
  if (res.canceled || !res.assets[0]) return null;
  const asset = res.assets[0];
  // Do not even read a file that is far larger than any real backup.
  if (typeof asset.size === 'number' && asset.size > MAX_IMPORT_BYTES) return { ok: false, error: 'corrupt' };
  const text = Platform.OS === 'web' ? await (await fetch(asset.uri)).text() : await new File(asset.uri).text();
  return parseImport(text);
}
