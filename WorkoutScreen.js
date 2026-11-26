import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  ArrowLeft,
  Check,
  Plus,
  Flame,
  Trophy,
  ChevronUp,
  ChevronDown,
  X,
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
  }, [safeWorkout.id]);

  const initialWalkMin = useMemo(() => {
    if (safeWorkout.walkMin != null) return String(safeWorkout.walkMin);
    const total = Number(safeWorkout.durationMin) || 40;
    return String(Math.round(total / 2));
  }, [safeWorkout.id]);

  const initialRunMin = useMemo(() => {
    if (safeWorkout.runMin != null) return String(safeWorkout.runMin);
    const total = Number(safeWorkout.durationMin) || 40;
    const w = Math.round(total / 2);
    return String(Math.max(0, total - w));
  }, [safeWorkout.id]);

  const [exercises, setExercises] = useState(initialExercises);
  const [walkMin, setWalkMin] = useState(initialWalkMin);
  const [runMin, setRunMin] = useState(initialRunMin);
  const [distanceKm, setDistanceKm] = useState(String(safeWorkout.distanceKm ?? '6.5'));
  const [durationMin, setDurationMin] = useState(String(safeWorkout.durationMin ?? '40'));

  const [showAddModal, setShowAddModal] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [newExEquip, setNewExEquip] = useState('Halteres');
  const [newExIsIso, setNewExIsIso] = useState(false);
  const [newExSets, setNewExSets] = useState('3');
  const [newExWeight, setNewExWeight] = useState('12');
  const [newExReps, setNewExReps] = useState('12');
  const [newExSeconds, setNewExSeconds] = useState('45');
  const [newExRest, setNewExRest] = useState('60');

  const handleOpenAddModal = () => {
    triggerLightTap();
    setNewExName('');
    setNewExEquip('Halteres');
    setNewExIsIso(false);
    setNewExSets('3');
    setNewExWeight('12');
    setNewExReps('12');
    setNewExSeconds('45');
    setNewExRest('60');
    setShowAddModal(true);
  };

  const handleConfirmAddExercise = () => {
    const cleanName = newExName.trim();
    if (!cleanName) {
      Alert.alert('Nome obrigatório', 'Digite o nome do exercício para adicionar.');
      return;
    }
    triggerLightTap();
    const setsNum = Math.max(1, parseInt(newExSets, 10) || 3);
    const restSec = Math.max(0, parseInt(newExRest, 10) || 60);
    const weightNum = parseFloat(String(newExWeight).replace(',', '.')) || 0;
    const repsNum = Math.max(1, parseInt(newExReps, 10) || 12);
    const secNum = Math.max(1, parseInt(newExSeconds, 10) || 45);
    const newId = `ex-custom-${Date.now()}`;

    const newExercise = {
      id: newId,
      name: cleanName,
      equipment: newExEquip.trim() || 'Equipamento livre',
      lastSummary: newExIsIso
        ? `${secNum}s • ${setsNum}×${secNum}s`
        : `${weightNum}kg • ${setsNum}×${repsNum}`,
      restSeconds: restSec,
      isIsometric: newExIsIso,
      effort: 'Ideal',
      rows: Array.from({ length: setsNum }, (_, sIdx) => ({
        id: `${newId}-s-${sIdx}`,
        weight: String(newExIsIso ? 0 : weightNum),
        reps: String(newExIsIso ? secNum : repsNum),
        done: false,
      })),
    };

    setExercises((prev) => [...prev, newExercise]);
    setShowAddModal(false);
  };

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
    const currentEx = exercises[exIdx];
    const targetRow = currentEx?.rows?.[rowIdx];
    if (!currentEx || !targetRow) return;

    const becomingDone = !targetRow.done;
    if (becomingDone && currentEx.restSeconds > 0 && typeof onStartRest === 'function') {
      onStartRest(currentEx.restSeconds);
    }

    setExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIdx) return ex;
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

      if (typeof onFinish === 'function') {
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

    if (typeof onFinish === 'function') {
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
            if (typeof onCancel === 'function') onCancel();
          }}
        >
          <ArrowLeft size={20} color={COLORS.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.topTitle}>
            {safeWorkout.shortName || safeWorkout.name || 'Treino'}
          </Text>
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
          <>
            {exercises.length === 0 && (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>Nenhum exercício nesta sessão</Text>
                <Text style={styles.emptySub}>
                  Toque no botão abaixo para adicionar exercícios ao treino.
                </Text>
              </View>
            )}

            {exercises.map((ex, exIdx) => {
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
            })}

            <TouchableOpacity style={styles.addExBtn} onPress={handleOpenAddModal}>
              <Plus size={18} color={COLORS.orange} />
              <Text style={styles.addExBtnText}>ADICIONAR EXERCÍCIO</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
          <Trophy size={18} color="#fff" />
          <Text style={styles.finishText}>FINALIZAR E SALVAR TREINO</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adicionar Exercício</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={22} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Nome do Exercício</Text>
            <TextInput
              style={styles.cardioInput}
              value={newExName}
              onChangeText={setNewExName}
              placeholder="Ex: Rosca Direta / Prancha"
              placeholderTextColor={COLORS.textMuted}
            />

            <Text style={styles.inputLabel}>Equipamento</Text>
            <TextInput
              style={styles.cardioInput}
              value={newExEquip}
              onChangeText={setNewExEquip}
              placeholder="Ex: Halteres, Barra, Peso corporal"
              placeholderTextColor={COLORS.textMuted}
            />

            <View style={styles.modeRow}>
              <TouchableOpacity
                style={[styles.modeBtn, !newExIsIso && styles.modeBtnActive]}
                onPress={() => setNewExIsIso(false)}
              >
                <Text style={[styles.modeText, !newExIsIso && styles.modeTextActive]}>
                  Repetições
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeBtn, newExIsIso && styles.modeBtnActive]}
                onPress={() => setNewExIsIso(true)}
              >
                <Text style={[styles.modeText, newExIsIso && styles.modeTextActive]}>
                  Segundos (Tempo)
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.cardioSplitRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Séries</Text>
                <TextInput
                  style={styles.cardioInput}
                  keyboardType="numeric"
                  value={newExSets}
                  onChangeText={setNewExSets}
                />
              </View>

              {newExIsIso ? (
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Segundos</Text>
                  <TextInput
                    style={styles.cardioInput}
                    keyboardType="numeric"
                    value={newExSeconds}
                    onChangeText={setNewExSeconds}
                  />
                </View>
              ) : (
                <>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Reps</Text>
                    <TextInput
                      style={styles.cardioInput}
                      keyboardType="numeric"
                      value={newExReps}
                      onChangeText={setNewExReps}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Carga (kg)</Text>
                    <TextInput
                      style={styles.cardioInput}
                      keyboardType="numeric"
                      value={newExWeight}
                      onChangeText={setNewExWeight}
                    />
                  </View>
                </>
              )}

              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Desc. (s)</Text>
                <TextInput
                  style={styles.cardioInput}
                  keyboardType="numeric"
                  value={newExRest}
                  onChangeText={setNewExRest}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.confirmAddBtn} onPress={handleConfirmAddExercise}>
              <Check size={18} color="#fff" />
              <Text style={styles.confirmAddText}>INCLUIR NO TREINO</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  emptyBox: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyTitle: { color: COLORS.text, fontSize: 15, fontWeight: '800' },
  emptySub: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
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
  cardTitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.9,
    marginBottom: 8,
  },
  notes: { color: COLORS.textSecondary, fontSize: 12, marginBottom: 12 },
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
  exName: { color: COLORS.text, fontSize: 18, fontWeight: '900' },
  exEquip: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  exLast: { color: COLORS.textMuted, fontSize: 12, marginTop: 4 },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.orangeDim,
    borderWidth: 1,
    borderColor: COLORS.orangeBorder,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    marginBottom: 12,
  },
  tipText: { color: COLORS.text, fontSize: 12, fontWeight: '600', flex: 1 },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 8,
  },
  th: { color: COLORS.textMuted, fontSize: 11, fontWeight: '800' },
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
    backgroundColor: COLORS.cardElevated,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 9,
    paddingVertical: 7,
    paddingHorizontal: 8,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  cellInputDone: {
    borderColor: COLORS.green,
    backgroundColor: COLORS.greenDim,
  },
  checkBtn: {
    width: 48,
    height: 36,
    borderRadius: 9,
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
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  effortLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  effortPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  effortPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: COLORS.cardElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  effortPillActive: {
    backgroundColor: COLORS.orangeDim,
    borderColor: COLORS.orange,
  },
  effortPillText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '700' },
  effortPillTextActive: { color: COLORS.orange, fontWeight: '800' },
  inputLabel: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 6 },
  cardioInput: {
    backgroundColor: COLORS.cardElevated,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: COLORS.text,
    fontSize: 14,
    marginBottom: 12,
  },
  cardioSplitRow: { flexDirection: 'row', gap: 8 },
  addExBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.orangeDim,
    borderWidth: 1.5,
    borderColor: COLORS.orange,
    paddingVertical: 13,
    borderRadius: 12,
    marginBottom: 12,
  },
  addExBtnText: { color: COLORS.orange, fontSize: 13, fontWeight: '900' },
  finishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.green,
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 2,
  },
  finishText: { color: '#fff', fontSize: 14, fontWeight: '900' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: { color: COLORS.text, fontSize: 18, fontWeight: '900' },
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  modeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.cardElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  modeBtnActive: {
    backgroundColor: COLORS.orangeDim,
    borderColor: COLORS.orange,
  },
  modeText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '700' },
  modeTextActive: { color: COLORS.orange, fontWeight: '800' },
  confirmAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.orange,
    paddingVertical: 13,
    borderRadius: 10,
    marginTop: 4,
  },
  confirmAddText: { color: '#fff', fontSize: 13, fontWeight: '900' },
});
