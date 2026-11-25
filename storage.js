import AsyncStorage from '@react-native-async-storage/async-storage';
import { INITIAL_DATA } from './initialData';

const STORAGE_KEY = '@forjafit_data_v1';

export const loadAppData = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
      return INITIAL_DATA;
    }
    const parsed = JSON.parse(raw);
    return {
      workouts: Array.isArray(parsed.workouts) && parsed.workouts.length > 0 ? parsed.workouts : INITIAL_DATA.workouts,
      history: Array.isArray(parsed.history) ? parsed.history : [],
      bodyProfile: parsed.bodyProfile || INITIAL_DATA.bodyProfile,
      bodyHistory: Array.isArray(parsed.bodyHistory) ? parsed.bodyHistory : [],
    };
  } catch (e) {
    return INITIAL_DATA;
  }
};

export const saveAppData = async (data) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {}
};
