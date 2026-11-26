import AsyncStorage from '@react-native-async-storage/async-storage';
import { INITIAL_DATA } from './initialData';

const STORAGE_KEY = '@forjafit_data_v1';

const normalizeExercise = (ex, wIdx, exIdx) => {
  const safeEx = ex && typeof ex === 'object' ? ex : {};
  const setsNum = Math.max(
    1,
    parseInt(safeEx.setsCount ?? safeEx.sets ?? safeEx.series, 10) || 3
  );
  const weightVal = Number(
    safeEx.defaultWeight ?? safeEx.weightKg ?? safeEx.carga ?? safeEx.peso ?? 0
  ) || 0;
  const repsVal =
    parseInt(String(safeEx.defaultReps ?? safeEx.reps ?? safeEx.repeticoes ?? '12'), 10) || 12;
  const restVal = Number(safeEx.restSeconds ?? safeEx.descanso ?? 60) || 60;
  const isIso = Boolean(
    safeEx.isIsometric || /prancha|isom/i.test(String(safeEx.name || ''))
  );
  const durVal = Number(safeEx.durationSeconds || (isIso ? repsVal || 45 : 0)) || 45;

  return {
    id: safeEx.id || `ex-${wIdx}-${exIdx}`,
    name: String(safeEx.name || `Exercício ${exIdx + 1}`),
    equipment: String(safeEx.equipment || safeEx.subtitle || 'Equipamento livre'),
    setsCount: setsNum,
    defaultWeight: weightVal,
    defaultReps: repsVal,
    lastSummary:
      safeEx.lastSummary ||
      (isIso ? `${durVal}s • ${setsNum}×${durVal}s` : `${weightVal}kg • ${setsNum}×${repsVal}`),
    restSeconds: restVal,
    isIsometric: isIso,
    durationSeconds: durVal,
    effort: safeEx.effort || 'Ideal',
  };
};

const normalizeWorkout = (w, idx) => {
  const safeW = w && typeof w === 'object' ? w : {};
  const isCardio =
    safeW.type === 'cardio' || /cardio|corrida|caminhada/i.test(String(safeW.name || ''));
  const rawEx = Array.isArray(safeW.exercises) ? safeW.exercises : [];
  const exercises = isCardio ? [] : rawEx.map((ex, eIdx) => normalizeExercise(ex, idx, eIdx));
  const rawName = String(safeW.name || `Treino ${idx + 1}`);
  const shortName = String(safeW.shortName || rawName.split('—')[0].trim() || rawName);
  const code =
    safeW.code ||
    (isCardio ? 'Cardio' : `Tr. ${String.fromCharCode(65 + (idx % 26))}`);

  return {
    id: safeW.id || `w-${idx}`,
    code,
    name: rawName,
    shortName,
    subtitle: String(
      safeW.subtitle ||
        (isCardio
          ? 'Caminhada 6.5 km/h + Corrida 12 km/h'
          : exercises.map((e) => e.name).slice(0, 2).join(' • ') || 'Treino personalizado')
    ),
    estimatedMin: Number(safeW.estimatedMin ?? safeW.durationMin ?? (isCardio ? 40 : 38)) || 38,
    type: isCardio ? 'cardio' : 'strength',
    distanceKm: Number(safeW.distanceKm ?? safeW.distancia ?? 6.5) || 6.5,
    durationMin: Number(safeW.durationMin ?? safeW.duracao ?? 40) || 40,
    notes: String(
      safeW.notes ||
        (isCardio ? 'Alternar 600m corrida a 12 km/h com 400m caminhada a 6.5 km/h' : '')
    ),
    exercises,
  };
};

const normalizeSession = (s, idx) => {
  const safeS = s && typeof s === 'object' ? s : {};
  const ts =
    typeof safeS.timestamp === 'number' && !Number.isNaN(safeS.timestamp)
      ? safeS.timestamp
      : safeS.date
      ? new Date(safeS.date).getTime() || Date.now() - idx * 86400000
      : Date.now() - idx * 86400000;
  const d = new Date(ts);
  const months = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
  ];
  const dateLabel =
    safeS.dateLabel ||
    `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]}`;

  const rawName = String(safeS.workoutName || safeS.name || 'Treino');
  const workoutCode =
    safeS.workoutCode ||
    (/cardio/i.test(rawName)
      ? 'Cardio'
      : /b|puxar/i.test(rawName)
      ? 'Tr. B'
      : 'Tr. A');

  return {
    id: safeS.id || `sess-${idx}-${ts}`,
    workoutId: safeS.workoutId || 'w-treino-a',
    workoutName: rawName,
    workoutCode,
    type: safeS.type === 'cardio' ? 'cardio' : 'strength',
    timestamp: ts,
    dateLabel,
    volumeKg: Math.round(Number(safeS.volumeKg ?? safeS.volume ?? 0) || 0),
    distanceKm: Number(safeS.distanceKm || 0) || 0,
    durationMin: Number(safeS.durationMin || 0) || 0,
    summaryText: String(
      safeS.summaryText ||
        safeS.exercisesSummary ||
        (safeS.type === 'cardio'
          ? `${safeS.distanceKm || 0} km • ${safeS.durationMin || 0} min`
          : 'Sessão concluída')
    ),
  };
};

export const loadAppData = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
      return INITIAL_DATA;
    }
    const parsed = JSON.parse(raw);
    const rawWorkouts =
      Array.isArray(parsed?.workouts) && parsed.workouts.length > 0
        ? parsed.workouts
        : INITIAL_DATA.workouts;
    const workouts = rawWorkouts.map((w, idx) => normalizeWorkout(w, idx));
    const history = Array.isArray(parsed?.history)
      ? parsed.history.map((s, idx) => normalizeSession(s, idx))
      : [];
    const bodyHistory = Array.isArray(parsed?.bodyHistory) ? parsed.bodyHistory : [];
    const latestBody = bodyHistory[0] || {};
    const bodyProfile = {
      heightCm: Number(parsed?.bodyProfile?.heightCm ?? latestBody?.heightCm ?? 177) || 177,
      weightKg: Number(parsed?.bodyProfile?.weightKg ?? latestBody?.weightKg ?? 79) || 79,
      armCm: Number(parsed?.bodyProfile?.armCm ?? latestBody?.armCm ?? 37) || 37,
      chestCm: Number(parsed?.bodyProfile?.chestCm ?? latestBody?.chestCm ?? 103) || 103,
      waistCm: Number(parsed?.bodyProfile?.waistCm ?? latestBody?.waistCm ?? 82.5) || 82.5,
      abdomenCm: Number(parsed?.bodyProfile?.abdomenCm ?? latestBody?.abdomenCm ?? 85.5) || 85.5,
      thighCm: Number(parsed?.bodyProfile?.thighCm ?? latestBody?.thighCm ?? 58) || 58,
      calfCm: Number(parsed?.bodyProfile?.calfCm ?? latestBody?.calfCm ?? 38.5) || 38.5,
    };

    return {
      workouts,
      history,
      bodyProfile,
      bodyHistory,
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
    
