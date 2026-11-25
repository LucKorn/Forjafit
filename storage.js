import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { INITIAL_DATA } from './initialData';

const STORAGE_KEY = '@forjafit_state_v1';

export async function loadAppData() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_DATA;
    return { ...INITIAL_DATA, ...JSON.parse(raw) };
  } catch (e) {
    return INITIAL_DATA;
  }
}

export async function saveAppData(data) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Erro ao salvar dados locais:', e);
  }
}

export async function exportBackupJson(data) {
  const fileUri = FileSystem.documentDirectory + `forjafit_backup_${new Date().toISOString().slice(0, 10)}.json`;
  await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(data, null, 2), {
    encoding: FileSystem.EncodingType.UTF8,
  });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/json',
      dialogTitle: 'Exportar Backup ForjaFit',
    });
  }
}

export async function importBackupJson() {
  const res = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });
  if (res.canceled || !res.assets || !res.assets[0]) return null;
  const content = await FileSystem.readAsStringAsync(res.assets[0].uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  const parsed = JSON.parse(content);
  if (!parsed.workouts) throw new Error('Arquivo de backup inválido');
  return parsed;
}
