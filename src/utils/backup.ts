import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { KineticFormBackup } from '@/types/workout';

export async function downloadBackup(backup: KineticFormBackup) {
  const json = JSON.stringify(backup, null, 2);
  const filename = `kineticform-backup-${backup.exportedAt.slice(0, 10)}.json`;
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    return;
  }
  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.create();
  await file.write(json);
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device.');
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Save KineticForm backup' });
}

export async function readBackupFile(asset: { uri: string; file?: globalThis.File }) {
  if (asset.file) return asset.file.text();
  if (Platform.OS === 'web') return fetch(asset.uri).then((response) => response.text());
  return new File(asset.uri).text();
}
