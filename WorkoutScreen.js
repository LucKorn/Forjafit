import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { ArrowLeft, Check, Timer, Trophy, Plus, Minus } from 'lucide-react-native';
import { COLORS } from './colors';
import { triggerLightTap } from './feedback';
import IsometricTimer from './IsometricTimer';

export default function WorkoutScreen({ workout, onFinish, onCancel, onStartRest }) {
  const safeWorkout = workout || {
    id: 'w-fallback',
    name: 'Treino',
    subtitle: '',
    type: 'strength',
    exercises: [],
  };
  const isCardio = safeWorkout.type === 'cardio';

  const initialExercises = useMemo(() => {
    const list = Array.isArray(safeWorkout.exercises) ? safeWorkout.exercises : [];
    return list.map((ex, i) => {
      const setsNum = Math.max(1, parseInt(ex?.sets, 10) || 3);
      return {
        id: ex?.id || `ex-${i}-${Date.now()}`,
        name: ex?.name || `Exercício ${i + 1}`,
        sets: setsNum,
        reps: String(ex?.reps || '10'),
        weightKg: Number(ex?.weightKg) || 0,
        restSeconds: Number(ex?.restSeconds) || 60,
        isIsometric: Boolean(ex?.isIsometric),
        durationSeconds: Number(ex?.durationSeconds) || 45,
        notes: String(ex?.notes || ''),
        completedSets: Array(setsNum).fill(false),
        actualReps: parseInt(ex?.reps, 10) || 10,
      };
    });
  }, [safeWorkout]);

  const [exercises, setExercises] = useState(initialExercises);
  const [distanceKm, setDistanceKm] = useState(String(safeWorkout.distanceKm ?? '6.5'));
  const [durationMin, setDurationMin] = useState(String(safeWorkout.durationMin ?? '40'));

  const toggleSet = (exIdx, setIdx) => {
    triggerLightTap();
    setExercises((prev) =>
      prev.map((ex, idx) => {
        if (idx !== exIdx) return ex;
        const nextSets = Array.isArray(ex.completedSets) ? [...ex.completedSets] : [];
        const becomingDone = !nextSets[setIdx];
        nextSets[setIdx] = becomingDone;
        if (becomingDone && Number(ex.restSeconds) > 0 && onStartRest) {
          onStartRest(Number(ex.restSeconds));
        }
        return { ...ex, completedSets: nextSets };
      })
    );
  };

  const adjustWeight = (exIdx, delta) => {
    triggerLightTap();
    setExercises((prev) =>
      prev.map((ex, idx) =>
        idx === exIdx
          ? { ...ex, weightKg: Math.max(0, (Number(ex.weightKg) || 0) + delta) }
          : ex
      )
    );
  };

  const handleCompleteWorkout = () => {
    const now = new Date();
    const months = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
    ];
    const dateLabel = `${String(now.getDate()).padStart(2, '0')} ${months[now.getMonth()]}`;

    if (isCardio) {
      const dist = parseFloat(String(distanceKm || '0').replace(',', '.')) || 0;
      const dur = parseInt(String(durationMin || '0'), 10) || 0;
      if (onFinish) {
        onFinish({
          id: 'sess-' + Date.now(),
          workoutId: safeWorkout.id,
          workoutName: safeWorkout.name,
          type: 'cardio',
          timestamp: now.getTime(),
          dateLabel,
          volumeKg: 0,
          exercisesCount: 0,
          setsCount: 0,
          distanceKm: dist,
          durationMin: dur,
          summaryText: `${dist} km • ${dur} min`,
        });
      }
      return;
    }

    let totalVolume = 0;
    let totalDoneSets = 0;

    exercises.forEach((ex) => {
      const doneCount = Array.isArray(ex.completedSets)
        ? ex.completedSets.filter(Boolean).length
        : 0;
      totalDoneSets += doneCount;
      if (!ex.isIsometric) {
        totalVolume += doneCount * (Number(ex.weightKg) || 0) * (Number(ex.actualReps) || 10);
      }
    });

    if (totalDoneSets === 0) {
      Alert.alert(
        'Nenhuma série marcada',
        'Marque pelo menos uma série concluída antes de finalizar o treino.'
      );
      return;
    }

    if (onFinish) {
      onFinish({
        id: 'sess-' + Date.now(),
        workoutId: safeWorkout.id,
        workoutName: safeWorkout.name,
        type: 'strength',
        timestamp: now.getTime(),
        dateLabel,
        volumeKg: Math.round(totalVolume),
        exercisesCount: exercises.length,
        setsCount: totalDoneSets,
        summaryText: `${exercises.length} exercícios • ${totalDoneSets} séries`,
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (onCancel) onCancel();
          }}
        >
          <ArrowLeft size={20} color={COLORS.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{safeWorkout.name}</Text>
          {!!safeWorkout.subtitle && (
            <Text style={styles.subtitle}>{safeWorkout.subtitle}</Text>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {isCardio ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>REGISTRO DE CARDIO</Text>
            {!!safeWorkout.notes && <Text style={styles.notes}>{safeWorkout.notes}</Text>}

            <Text style={styles.inputLabel}>Distância percorrida (km)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={distanceKm}
              onChangeText={setDistanceKm}
              placeholderTextColor={COLORS.textMuted}
            />

            <Text style={styles.inputLabel}>Duração total (minutos)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={durationMin}
              onChangeText={setDurationMin}
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
        ) : exercises.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.notes}>
              Este treino ainda não possui exercícios cadastrados. Vá em Fichas para adicionar.
            </Text>
          </View>
        ) : (
          exercises.map((ex, exIdx) => (
            <View key={ex.id} style={styles.card}>
              <View style={styles.exHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.exName}>{ex.name}</Text>
                  <Text style={styles.exMeta}>
                    {ex.sets} séries × {ex.reps} • Descanso {ex.restSeconds}s
                  </Text>
                </View>

                {!ex.isIsometric && (
                  <View style={styles.weightControl}>
                    <TouchableOpacity
                      style={styles.wBtn}
                      onPress={() => adjustWeight(exIdx, -2)}
                    >
                      <Minus size={14} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.weightText}>{ex.weightKg} kg</Text>
                    <TouchableOpacity
                      style={styles.wBtn}
                      onPress={() => adjustWeight(exIdx, 2)}
                    >
                      <Plus size={14} color={COLORS.text} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {!!ex.notes && <Text style={styles.notes}>{ex.notes}</Text>}

              {ex.isIsometric && (
                <IsometricTimer
                  targetSeconds={ex.durationSeconds || 45}
                  onComplete={() => {
                    const nextIdx = (ex.completedSets || []).findIndex((s) => !s);
                    if (nextIdx !== -1) toggleSet(exIdx, nextIdx);
                  }}
                />
              )}

              <View style={styles.setsRow}>
                {(ex.completedSets || []).map((done, setIdx) => (
                  <TouchableOpacity
                    key={setIdx}
                    style={[styles.setPill, done && styles.setPillDone]}
                    onPress={() => toggleSet(exIdx, setIdx)}
                  >
                    {done ? (
                      <Check size={15} color="#fff" />
                    ) : (
                      <Text style={styles.setPillText}>Série {setIdx + 1}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.manualRestBtn}
                onPress={() => {
                  triggerLightTap();
                  if (onStartRest) onStartRest(ex.restSeconds || 60);
                }}
              >
                <Timer size={13} color={COLORS.orange} />
                <Text style={styles.manualRestText}>
                  Iniciar descanso ({ex.restSeconds || 60}s)
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        <TouchableOpacity style={styles.finishBtn} onPress={handleCompleteWorkout}>
          <Trophy size={18} color="#fff" />
          <Text style={styles.finishText}>FINALIZAR E SALVAR TREINO</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  subtitle: { color: COLORS.textSecondary, fontSize: 12 },
  content: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  cardTitle: {
    color: COLORS.blue,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  exHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  exName: { color: COLORS.text, fontSize: 16, fontWeight: '800' },
  exMeta: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  weightControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: 4,
    gap: 6,
  },
  wBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weightText: {
    color: COLORS.orange,
    fontSize: 13,
    fontWeight: '800',
    minWidth: 46,
    textAlign: 'center',
  },
  notes: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 6,
  },
  setsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  setPill: {
    flex: 1,
    minWidth: 74,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.cardElevated,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setPillDone: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  setPillText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
  },
  manualRestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 6,
  },
  manualRestText: {
    color: COLORS.orange,
    fontSize: 12,
    fontWeight: '700',
  },
  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.cardElevated,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  finishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.green,
    paddingVertical: 15,
    borderRadius: 14,
    marginTop: 8,
  },
  finishText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
});
