import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

/**
 * "Hekimime göster": turns the summary HTML into a PDF on the device and opens the share sheet
 * (the user chooses where it goes). On web the browser's print dialog opens instead.
 */
export async function exportDoctorSummary(html: string, dialogTitle: string): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      await Print.printAsync({ html });
      return true;
    }
    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle });
    else await Print.printAsync({ uri });
    return true;
  } catch {
    return false;
  }
}
