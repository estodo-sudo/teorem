import { Contact } from 'expo-contacts';
import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

/**
 * Device helpers for the camp. Nothing leaves the device: the reason photo is copied into the
 * app's own document folder, and the ALO 171 contact goes through the system's own form.
 */

/** Picks a photo from the gallery and keeps a private copy; null when cancelled or unavailable. */
export async function pickReasonPhoto(): Promise<string | null> {
  try {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.7 });
    if (res.canceled || !res.assets[0]) return null;
    const uri = res.assets[0].uri;
    if (Platform.OS === 'web') return uri; // web preview only
    const dir = new Directory(Paths.document, 'camp');
    if (!dir.exists) dir.create({ intermediates: true });
    const dest = new File(dir, `reason-${Date.now()}.jpg`);
    await new File(uri).copy(dest);
    return dest.uri;
  } catch {
    return null;
  }
}

/** Deletes a private reason photo (ignored when it is already gone). */
export function deleteReasonPhoto(uri: string | undefined) {
  if (!uri || Platform.OS === 'web') return;
  try {
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch {
    // best effort
  }
}

export type SaveContactResult = 'saved' | 'cancelled' | 'unavailable';

/** Opens the system "new contact" form pre-filled with ALO 171; the user confirms it there. */
export async function saveAlo171Contact(name: string): Promise<SaveContactResult> {
  if (Platform.OS === 'web') return 'unavailable';
  try {
    const created = await Contact.presentCreateForm({ givenName: name, phones: [{ label: 'work', number: '171' }] });
    return created ? 'saved' : 'cancelled';
  } catch {
    return 'unavailable';
  }
}

export { exportDoctorSummary } from '@/features/camps/core/share';
