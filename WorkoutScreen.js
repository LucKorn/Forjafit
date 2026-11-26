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
import {
  ArrowLeft,
  Check,
  ChevronUp,
  ChevronDown,
  X,
  Flame,
  Trophy,
} from 'lucide-react-native';
import { COLORS } from './colors';
import { triggerLightTap } from './feedback';

const EFFORT_LEVELS = ['Fácil', 'Ideal', 'No Limite'];

export default function WorkoutScreen({ workout, onFinish, onCancel, onStartRest }) {
  const safeWorkout = workout && typeof workout === 'object' ? workout : {};
  const isCardio = safeWorkout.type === 'cardio';

  const initialExercises = useMemo(() => {
    const rawList = Array.isArray(safeWorkout.exercises) ? safeWorkout.exercises : [];
    return rawList.map((ex, idx) => {
      const setsNum = Math.max(
        1,
        parseInt(ex?.setsCount ?? ex?.sets ?? ex?.series, 10) || 3
      );
      const isIso = Boolean(ex?.isIsometric);
      const baseWeight =
        Number(ex?.defaultWeight ?? ex?.weightKg ?? ex?.carga ?? 0) || 0;
      const secDefault =
        parseInt(String(ex?.durationSeconds ?? ex?.defaultReps ?? ex?.reps ?? '45'), 10) || 45;
      const repDefault =
        parseInt(String(ex?.defaultReps ?? ex?.reps ?? '12'), 10) || 12;

      return {
        id: ex?.id || `ex-${idx}`,
        name: String(ex?.name || `Exercício ${idx + 1}`),
        equipment: String(ex?.equipment || 'Equipamento livre'),
        lastSummary: String(
          ex?.lastSummary ||
            (isIso
              ? `${secDefault}s • ${setsNum}×${secDefault}s`
              : `${baseWeight}kg • ${setsNum}×${repDefault}`)
        ),
        restSeconds: Number(ex?.restSeconds || 60) || 60,
        isIsometric: isIso,
        effort: EFFORT_LEVELS.includes(ex?.effort) ? ex.effort : 'Ideal',
        rows: Array.from({ length: setsNum }, (_, sIdx) => ({
          id: `${ex?.id || idx}-s-${sIdx}`,
          weight: String(baseWeight),
          reps: String(isIso ? secDefault : repDefault),
          done: false,
        })),
      };
    });
  }, [safeWorkout]);

  const initialWalkMin = useMemo(() => {
    if (safeWorkout.walkMin != null) return String(safeWorkout.walkMin);
    const total = Number(safeWorkout.durationMin) || 40;
    return String(Math.round(total / 2));
  }, [safeWorkout]);

  const initialRunMin = useMemo(() => {
    if (safeWorkout.runMin != null) return String(safeWorkout.runMin);
    const total = Number(safeWorkout.durationMin) || 40;
    const w = Math.round(total / 2);
    return String(Math.max(0, total - w));
  }, [safeWorkout]);

  const [exercises, setExercises] = useState(initialExercises);
  const [walkMin, setWalkMin] = useState(initialWalkMin);
  const [runMin, setRunMin] = useState(initialRunMin);
  const [distanceKm, setDistanceKm] = useState(String(safeWorkout.distanceKm ?? '6.5'));
  const [durationMin, setDurationMin] = useState(String(safeWorkout.durationMin ?? '40'));

  const handleWalkChange = (val) => {
    setWalkMin(val);
    const w = parseInt(val, 10) || 0;
    const r = parseInt(runMin, 10) || 0;
    if (w + r > 0) setDurationMin(String(w + r));
  };

  const handleRunChange = (val) => {
    setRunMin(val);
    const w = parseInt(walkMin, 10) || 0;
    const r = parseInt(val, 10) || 0;
    if (w + r > 0) setDurationMin(String(w + r));
  };

  const moveExercise = (idx, delta) => {
    const target = idx + delta;
    if (target < 0 || target >= exercises.length) return;
    triggerLightTap();
    setExercises((prev) => {
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[target];
      next[target] = temp;
      return next;
    });
  };

  const removeExercise = (idx) => {
    triggerLightTap();
    setExercises((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateRowField = (exIdx, rowIdx, field, val) => {
    setExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIdx) return ex;
        return {
          ...ex,
          rows: ex.rows.map((r, rI) => (rI === rowIdx ? { ...r, [field]: val } : r)),
        };
      })
    );
  };

  const toggleRowDone = (exIdx, rowIdx) => {
    triggerLightTap();
    setExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIdx) return ex;
        const targetRow = ex.rows[rowIdx];
        const becomingDone = !targetRow?.done;
        if (becomingDone && ex.restSeconds > 0 && onStartRest) {
          onStartRest(ex.restSeconds);
        }
        return {
          ...ex,
          rows: ex.rows.map((r, rI) => (rI === rowIdx ? { ...r, done: becomingDone } : r)),
        };
      })
    );
  };

  const setEffort = (exIdx, effort) => {
    triggerLightTap();
    setExercises((prev) =>
      prev.map((ex, i) => (i === exIdx ? { ...ex, effort } : ex))
    );
  };

  const getSuggestionText = (ex) => {
    if (ex.isIsometric) {
      if (ex.effort === 'Fácil') return 'Esforço leve! Sugestão: aumentar +5s a +10s na próxima sessão.';
      if (ex.effort === 'No Limite') return 'No limite! Mantenha o tempo atual até consolidar bem.';
      return 'Intensidade ideal! Busque manter os segundos com boa execução.';
    }
    if (ex.effort === 'Fácil') {
      return 'Esforço fácil! Sugestão: subir +2kg no próximo treino.';
    }
    if (ex.effort === 'No Limite') {
      return 'No limite! Mantenha a carga e consolide as repetições.';
    }
    return 'Ritmo ideal! Mantenha a carga ou busque +1 repetição.';
  };

  const handleFinish = () => {
    const now = new Date();
    const months = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
    ];
    const dateLabel = `${String(now.getDate()).padStart(2, '0')} ${months[now.getMonth()]}`;

    if (isCardio) {
      const dist = parseFloat(String(distanceKm || '0').replace(',', '.')) || 0;
      const wNum = parseInt(String(walkMin || '0'), 10) || 0;
      const rNum = parseInt(String(runMin || '0'), 10) || 0;
      const dur =
        wNum + rNum > 0
          ? wNum + rNum
          : parseInt(String(durationMin || '0'), 10) || 0;

      const intervalText =
        wNum > 0 || rNum > 0 ? ` (${wNum}m cam / ${rNum}m corr)` : '';

      if (onFinish) {
        onFinish({
          id: `sess-${Date.now()}`,
          workoutId: safeWorkout.id,
          workoutName: safeWorkout.name || 'Cardio Intervalado',
          workoutCode: safeWorkout.code || 'Cardio',
          type: 'cardio',
          timestamp: now.getTime(),
          dateLabel,
          volumeKg: 0,
          distanceKm: dist,
          walkMin: wNum,
          runMin: rNum,
          durationMin: dur,
          summaryText: `${dist} km • ${dur} min${intervalText}`,
        });
      }
      return;
    }

    let totalVolume = 0;
    let totalDone = 0;
    const summaryParts = [];

    exercises.forEach((ex) => {
      const doneRows = (ex.rows || []).filter((r) => r.done);
      totalDone += doneRows.length;
      if (doneRows.length > 0) {
        let exVol = 0;
        let lastW = 0;
        let lastSec = 0;
        doneRows.forEach((r) => {
          const wNum = parseFloat(String(r.weight || '0').replace(',', '.')) || 0;
          const repNum = parseInt(String(r.reps || '0'), 10) || 0;
          lastW = wNum;
          lastSec = repNum;
          if (!ex.isIsometric) {
            exVol += wNum * repNum;
          }
        });
        totalVolume += exVol;
        const shortEx = ex.name.split(' com ')[0];
        summaryParts.push(
          ex.isIsometric ? `${shortEx} ${lastSec || 45}s` : `${shortEx} ${lastW}kg`
        );
      }
    });

    if (totalDone === 0) {
      Alert.alert(
        'Nenhuma série marcada',
        'Marque pelo menos uma série como feita antes de salvar o treino.'
      );
      return;
    }

    if (onFinish) {
      onFinish({
        id: `sess-${Date.now()}`,
        workoutId: safeWorkout.id,
        workoutName: safeWorkout.name || 'Treino',
        workoutCode: safeWorkout.code || 'Tr. A',
        type: 'strength',
        timestamp: now.getTime(),
        dateLabel,
        volumeKg: Math.round(totalVolume),
        summaryText: summaryParts.slice(0, 4).join(', ') || `${totalDone} séries concluídas`,
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
          <Text style={styles.topTitle}>{safeWorkout.shortName || safeWorkout.name || 'Treino'}</Text>
          {!!safeWorkout.subtitle && (
            <Text style={styles.topSub}>{safeWorkout.subtitle}</Text>
          )}
        </View>
        <View style={styles.queueTag}>
          <Text style={styles.queueTagText}>1º da fila</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {isCardio ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>REGISTRO DE CARDIO</Text>
            {!!safeWorkout.notes && <Text style={styles.notes}>{safeWorkout.notes}</Text>}

            <View style={styles.cardioSplitRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Caminhada (min)</Text>
                <TextInput
                  style={styles.cardioInput}
                  keyboardType="numeric"
                  value={walkMin}
                  onChangeText={handleWalkChange}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Corrida (min)</Text>
                <TextInput
                  style={styles.cardioInput}
                  keyboardType="numeric"
                  value={runMin}
                  onChangeText={handleRunChange}
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Distância (km)</Text>
            <TextInput
              style={styles.cardioInput}
              keyboardType="numeric"
              value={distanceKm}
              onChangeText={setDistanceKm}
            />

            <Text style={styles.inputLabel}>Duração Total (min)</Text>
            <TextInput
              style={styles.cardioInput}
              keyboardType="numeric"
              value={durationMin}
              onChangeText={setDurationMin}
            />
          </View>
        ) : (
          exercises.map((ex, exIdx) => {
            const doneCount = ex.rows.filter((r) => r.done).length;
            return (
              <View key={ex.id} style={styles.card}>
                <View style={styles.exTopRow}>
                  <Text style={styles.exIndex}>{exIdx + 1}.</Text>
                  <View style={styles.exActionGroup}>
                    <TouchableOpacity
                      style={styles.miniActionBtn}
                      onPress={() => moveExercise(exIdx, -1)}
                    >
                      <ChevronUp size={14} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.miniActionBtn}
                      onPress={() => moveExercise(exIdx, 1)}
                    >
                      <ChevronDown size={14} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.miniActionBtn}
                      onPress={() => removeExercise(exIdx)}
                    >
                      <X size={14} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                    <View style={styles.counterBadge}>
                      <Text style={styles.counterText}>
                        {doneCount}/{ex.rows.length}
                      </Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.exName}>{ex.name}</Text>
                <Text style={styles.exEquip}>{ex.equipment}</Text>
                <Text style={styles.exLast}>Último: {ex.lastSummary}</Text>

                <View style={styles.tipBox}>
                  <Flame size={15} color={COLORS.orange} />
                  <Text style={styles.tipText}>{getSuggestionText(ex)}</Text>
                </View>

                <View style={styles.tableHeader}>
                  <Text style={[styles.th, { width: 46 }]}>SÉRIE</Text>
                  {!ex.isIsometric && (
                    <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>
                      CARGA (KG)
                    </Text>
                  )}
                  <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>
                    {ex.isIsometric ? 'SEGUNDOS' : 'REPS'}
                  </Text>
                  <Text style={[styles.th, { width: 48, textAlign: 'center' }]}>FEITO</Text>
                </View>

                {ex.rows.map((row, rIdx) => (
                  <View key={row.id} style={styles.tableRow}>
                    <Text style={styles.rowNum}>#{rIdx + 1}</Text>

                    {!ex.isIsometric && (
                      <TextInput
                        style={[styles.cellInput, row.done && styles.cellInputDone]}
                        keyboardType="numeric"
                        value={row.weight}
                        onChangeText={(v) => updateRowField(exIdx, rIdx, 'weight', v)}
                      />
                    )}

                    <TextInput
                      style={[styles.cellInput, row.done && styles.cellInputDone]}
                      keyboardType="numeric"
                      value={row.reps}
                      onChangeText={(v) => updateRowField(exIdx, rIdx, 'reps', v)}
                    />

                    <TouchableOpacity
                      style={[styles.checkBtn, row.done && styles.checkBtnDone]}
                      onPress={() => toggleRowDone(exIdx, rIdx)}
                    >
                      <Check
                        size={17}
                        color={row.done ? '#fff' : COLORS.textMuted}
                      />
                    </TouchableOpacity>
                  </View>
                ))}

                <View style={styles.effortRow}>
                  <Text style={styles.effortLabel}>Esforço:</Text>
                  <View style={styles.effortPills}>
                    {EFFORT_LEVELS.map((lvl) => {
                      const active = ex.effort === lvl;
                      return (
                        <TouchableOpacity
                          key={lvl}
                          style={[styles.effortPill, active && styles.effortPillActive]}
                          onPress={() => setEffort(exIdx, lvl)}
                        >
                          <Text
                            style={[
                              styles.effortPillText,
                              active && styles.effortPillTextActive,
                            ]}
                          >
                            {lvl}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            );
          })
        )}

        <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
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
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: { color: COLORS.text, fontSize: 18, fontWeight: '900' },
  topSub: { color: COLORS.textSecondary, fontSize: 12 },
  queueTag: {
    backgroundColor: COLORS.cardElevated,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  queueTagText: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '700' },
  content: { padding: 14, paddingBottom: 36 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 3.5,
    borderLeftColor: COLORS.orange,
    marginBottom: 14,
  },
  exTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  exIndex: { color: COLORS.orange, fontSize: 14, fontWeight: '900' },
  exActionGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  miniActionBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.cardElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBadge: {
    backgroundColor: COLORS.cardElevated,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  counterText: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '800' },
  exName: { color: COLORS.text, fontSize: 19, fontWeight: '900', lineHeight: 24 },
  exEquip: { color: COLORS.textSecondary, fontSize: 12, marginTop: 3 },
  exLast: { color: COLORS.orange, fontSize: 12, fontWeight: '700', marginTop: 8 },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: '#1f160e',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.32)',
    borderRadius: 12,
    padding: 11,
    marginTop: 10,
    marginBottom: 14,
  },
  tipText: { color: '#fdba74', fontSize: 12, fontWeight: '600', flex: 1, lineHeight: 17 },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  th: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  rowNum: {
    width: 46,
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '800',
  },
  cellInput: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    backgroundColor: COLORS.cardElevated,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  cellInputDone: {
    borderColor: 'rgba(16, 185, 129, 0.5)',
    color: '#6ee7b7',
  },
  checkBtn: {
    width: 48,
    height: 42,
    borderRadius: 10,
    backgroundColor: COLORS.cardElevated,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBtnDone: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  effortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 8,
  },
  effortLabel: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  effortPills: { flexDirection: 'row', gap: 6 },
  effortPill: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.cardElevated,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  effortPillActive: {
    backgroundColor: COLORS.greenDim,
    borderColor: COLORS.green,
  },
  effortPillText: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '700' },
  effortPillTextActive: { color: '#34d399', fontWeight: '800' },
  cardTitle: {
    color: COLORS.blue,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8,
  },
  notes: { color: COLORS.textSecondary, fontSize: 12, marginBottom: 8 },
  cardioSplitRow: { flexDirection: 'row', gap: 10 },
  inputLabel: { color: COLORS.textSecondary, fontSize: 12, marginTop: 8, marginBottom: 5 },
  cardioInput: {
    backgroundColor: COLORS.cardElevated,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
  },
  finishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.green,
    paddingVertical: 15,
    borderRadius: 14,
    marginTop: 6,
  },
  finishText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 0.6 },
});
