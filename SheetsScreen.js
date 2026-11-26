import React, { useState, useEffect } from 'react';
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
import { Plus, Trash2, Edit3, Download, Upload, X, Check } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { COLORS } from './colors';
import { triggerLightTap } from './feedback';

const hydrateExerciseDrafts = (ex) => {
  const isIso = Boolean(ex?.isIsometric);
  const setsCount = Math.max(1, parseInt(ex?.setsCount, 10) || 3);
  const defaultReps = Math.max(1, parseInt(ex?.defaultReps, 10) || 12);
  const durationSeconds = Math.max(
    1,
    parseInt(ex?.durationSeconds ?? ex?.defaultReps, 10) || 45
  );
  const defaultWeight = isIso ? 0 : Number(ex?.defaultWeight) || 0;
  const restSeconds =
    ex?.restSeconds !== undefined && ex?.restSeconds !== null && ex?.restSeconds !== ''
      ? Math.max(0, parseInt(ex.restSeconds, 10) || 0)
      : 60;

  return {
    ...ex,
    setsCount,
    defaultReps,
    durationSeconds,
    defaultWeight,
    restSeconds,
    _setsText: String(setsCount),
    _repsText: String(defaultReps),
    _secondsText: String(durationSeconds),
    _weightText: String(defaultWeight),
    _restText: String(restSeconds),
  };
};

export default function SheetsScreen({
  appData,
  onUpdateWorkouts,
  onImportAllData,
  autoOpenNew,
  onConsumeAutoOpen,
}) {
  const [editingWorkout, setEditingWorkout] = useState(null);
  const workouts = Array.isArray(appData?.workouts) ? appData.workouts : [];

  const openNewWorkout = () => {
    triggerLightTap();
    setEditingWorkout({
      id: `w-${Date.now()}`,
      code: `Tr. ${String.fromCharCode(65 + (workouts.length % 26))}`,
      name: '',
      shortName: '',
      subtitle: '',
      estimatedMin: 40,
      type: 'strength',
      distanceKm: 6.5,
      walkMin: 20,
      runMin: 20,
      durationMin: 40,
      notes: '',
      exercises: [],
    });
  };

  useEffect(() => {
    if (autoOpenNew) {
      openNewWorkout();
      if (onConsumeAutoOpen) onConsumeAutoOpen();
    }
  }, [autoOpenNew]);

  const addExercise = () => {
    setEditingWorkout((prev) => ({
      ...prev,
      exercises: [
        ...(prev?.exercises || []),
        hydrateExerciseDrafts({
          id: `ex-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          name: '',
          equipment: 'Halteres',
          setsCount: 3,
          defaultWeight: 16,
          defaultReps: 12,
          lastSummary: '16kg • 3×12',
          restSeconds: 60,
          isIsometric: false,
          durationSeconds: 45,
          effort: 'Ideal',
        }),
      ],
    }));
  };

  const updateExercise = (idx, field, value) => {
    setEditingWorkout((prev) => ({
      ...prev,
      exercises: (prev?.exercises || []).map((ex, i) =>
        i === idx ? { ...ex, [field]: value } : ex
      ),
    }));
  };

  const toggleExerciseMode = (idx, isIso) => {
    triggerLightTap();
    setEditingWorkout((prev) => ({
      ...prev,
      exercises: (prev?.exercises || []).map((ex, i) => {
        if (i !== idx) return ex;
        const secVal =
          parseInt(ex._secondsText, 10) ||
          Number(ex.durationSeconds || ex.defaultReps || 45) ||
          45;
        const repVal =
          parseInt(ex._repsText, 10) || Number(ex.defaultReps || 12) || 12;
        const setsVal =
          parseInt(ex._setsText, 10) || Number(ex.setsCount || 3) || 3;
        const weightVal = isIso
          ? 0
          : parseFloat(String(ex._weightText ?? ex.defaultWeight ?? 10).replace(',', '.')) || 0;

        return {
          ...ex,
          isIsometric: isIso,
          durationSeconds: secVal,
          defaultReps: isIso ? secVal : repVal,
          defaultWeight: weightVal,
          _secondsText: String(secVal),
          _repsText: String(repVal),
          _weightText: String(weightVal),
          lastSummary: isIso
            ? `${secVal}s • ${setsVal}×${secVal}s`
            : `${weightVal}kg • ${setsVal}×${repVal}`,
        };
      }),
    }));
  };

  const removeExercise = (idx) => {
    setEditingWorkout((prev) => ({
      ...prev,
      exercises: (prev?.exercises || []).filter((_, i) => i !== idx),
    }));
  };

  const saveWorkout = () => {
    if (!editingWorkout?.name?.trim()) {
      Alert.alert('Nome obrigatório', 'Informe o nome da ficha de treino.');
      return;
    }
    const cleanName = editingWorkout.name.trim();
    const walk = Number(editingWorkout.walkMin ?? 0) || 0;
    const run = Number(editingWorkout.runMin ?? 0) || 0;
    const computedDuration =
      editingWorkout.type === 'cardio' && (walk > 0 || run > 0)
        ? walk + run
        : Number(editingWorkout.durationMin || 40) || 40;

    const preparedExercises = (editingWorkout.exercises || []).map((ex) => {
      const rawSets = ex._setsText !== undefined ? ex._setsText : ex.setsCount;
      const sets = Math.max(1, parseInt(String(rawSets), 10) || 3);

      const rawRest = ex._restText !== undefined ? ex._restText : ex.restSeconds;
      const parsedRest = parseInt(String(rawRest ?? '').trim(), 10);
      const rest = Number.isNaN(parsedRest) ? 60 : Math.max(0, parsedRest);

      if (ex.isIsometric) {
        const rawSec =
          ex._secondsText !== undefined
            ? ex._secondsText
            : ex.durationSeconds ?? ex.defaultReps;
        const secs = Math.max(1, parseInt(String(rawSec), 10) || 45);
        const cleanEx = { ...ex };
        delete cleanEx._setsText;
        delete cleanEx._repsText;
        delete cleanEx._secondsText;
        delete cleanEx._weightText;
        delete cleanEx._restText;
        return {
          ...cleanEx,
          setsCount: sets,
          isIsometric: true,
          durationSeconds: secs,
          defaultReps: secs,
          defaultWeight: 0,
          restSeconds: rest,
          lastSummary: `${secs}s • ${sets}×${secs}s`,
        };
      }

      const rawReps = ex._repsText !== undefined ? ex._repsText : ex.defaultReps;
      const reps = Math.max(1, parseInt(String(rawReps), 10) || 12);

      const rawWeight =
        ex._weightText !== undefined ? ex._weightText : ex.defaultWeight;
      const weight =
        parseFloat(String(rawWeight ?? '0').replace(',', '.').trim()) || 0;

      const cleanEx = { ...ex };
      delete cleanEx._setsText;
      delete cleanEx._repsText;
      delete cleanEx._secondsText;
      delete cleanEx._weightText;
      delete cleanEx._restText;

      return {
        ...cleanEx,
        setsCount: sets,
        isIsometric: false,
        durationSeconds: 0,
        defaultReps: reps,
        defaultWeight: weight,
        restSeconds: rest,
        lastSummary: `${weight}kg • ${sets}×${reps}`,
      };
    });

    const prepared = {
      ...editingWorkout,
      name: cleanName,
      shortName: editingWorkout.shortName?.trim() || cleanName.split('—')[0].trim(),
      walkMin: walk,
      runMin: run,
      durationMin: computedDuration,
      estimatedMin: computedDuration,
      exercises: preparedExercises,
    };

    const exists = workouts.some((w) => w.id === prepared.id);
    const updated = exists
      ? workouts.map((w) => (w.id === prepared.id ? prepared : w))
      : [...workouts, prepared];
    if (onUpdateWorkouts) onUpdateWorkouts(updated);
    setEditingWorkout(null);
  };

  const deleteWorkout = (workout) => {
    Alert.alert('Excluir Ficha', `Remover "${workout.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          if (onUpdateWorkouts) {
            onUpdateWorkouts(workouts.filter((w) => w.id !== workout.id));
          }
        },
      },
    ]);
  };

  const handleExport = async () => {
    try {
      const path = FileSystem.documentDirectory + 'forjafit_backup.json';
      await FileSystem.writeAsStringAsync(path, JSON.stringify(appData, null, 2));
      await Sharing.shareAsync(path);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível exportar o backup.');
    }
  };

  const handleImport = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      if (res.canceled) return;
      const content = await FileSystem.readAsStringAsync(res.assets[0].uri);
      const parsed = JSON.parse(content);
      if (!Array.isArray(parsed.workouts)) {
        Alert.alert('Arquivo inválido', 'O JSON não contém uma estrutura válida de fichas.');
        return;
      }
      if (onImportAllData) onImportAllData(parsed);
      Alert.alert('Sucesso', 'Dados importados com sucesso!');
    } catch (e) {
      Alert.alert('Erro', 'Falha ao importar o arquivo JSON.');
    }
  };

  const startEditingExisting = (w) => {
    const copy = JSON.parse(JSON.stringify(w));
    if (copy.type === 'cardio' && copy.walkMin == null && copy.runMin == null) {
      const half = Math.round((Number(copy.durationMin) || 40) / 2);
      copy.walkMin = half;
      copy.runMin = Math.max(0, (Number(copy.durationMin) || 40) - half);
    }
    copy.exercises = (copy.exercises || []).map(hydrateExerciseDrafts);
    setEditingWorkout(copy);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Fichas de Treino</Text>
          <Text style={styles.subtitle}>Gerencie rotinas, cargas e backups</Text>
        </View>
        <TouchableOpacity style={styles.newBtn} onPress={openNewWorkout}>
          <Plus size={16} color="#fff" />
          <Text style={styles.newBtnText}>Nova Ficha</Text>
        </TouchableOpacity>
      </View>

      {workouts.map((w, idx) => {
        const hasIntervals = (Number(w.walkMin) || 0) > 0 || (Number(w.runMin) || 0) > 0;
        return (
          <View key={w?.id || `w-${idx}`} style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{w.name}</Text>
              {!!w.subtitle && <Text style={styles.cardSub}>{w.subtitle}</Text>}
              <Text style={styles.cardMeta}>
                {w.type === 'cardio'
                  ? hasIntervals
                    ? `Cardio • ${w.walkMin || 0} min cam. + ${w.runMin || 0} min corr. (${w.distanceKm || 6.5} km)`
                    : `Cardio • ${w.distanceKm || 6.5} km • ${w.durationMin || 40} min`
                  : `${(w.exercises || []).length} exercícios`}
              </Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => startEditingExisting(w)}
              >
                <Edit3 size={16} color={COLORS.orange} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => deleteWorkout(w)}>
                <Trash2 size={16} color={COLORS.red} />
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

      <Text style={styles.sectionLabel}>BACKUP JSON</Text>
      <View style={styles.backupRow}>
        <TouchableOpacity style={styles.backupBtn} onPress={handleExport}>
          <Download size={16} color={COLORS.orange} />
          <Text style={styles.backupText}>Exportar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backupBtn} onPress={handleImport}>
          <Upload size={16} color={COLORS.blue} />
          <Text style={styles.backupText}>Importar</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={!!editingWorkout} animationType="slide">
        {editingWorkout && (
          <View style={styles.modalWrap}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Configurar Ficha</Text>
              <TouchableOpacity onPress={() => setEditingWorkout(null)}>
                <X size={22} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Nome do Treino</Text>
              <TextInput
                style={styles.input}
                value={editingWorkout.name}
                onChangeText={(t) => setEditingWorkout({ ...editingWorkout, name: t })}
                placeholder="Ex: Treino C — Pernas"
                placeholderTextColor={COLORS.textMuted}
              />

              <Text style={styles.label}>Subtítulo / Foco</Text>
              <TextInput
                style={styles.input}
                value={editingWorkout.subtitle}
                onChangeText={(t) => setEditingWorkout({ ...editingWorkout, subtitle: t })}
                placeholder="Ex: Quadríceps, Posterior e Panturrilha"
                placeholderTextColor={COLORS.textMuted}
              />

              <View style={styles.typeRow}>
                <TouchableOpacity
                  style={[
                    styles.typeBtn,
                    editingWorkout.type === 'strength' && styles.typeBtnActive,
                  ]}
                  onPress={() => setEditingWorkout({ ...editingWorkout, type: 'strength' })}
                >
                  <Text style={styles.typeText}>Musculação</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeBtn,
                    editingWorkout.type === 'cardio' && styles.typeBtnActive,
                  ]}
                  onPress={() => setEditingWorkout({ ...editingWorkout, type: 'cardio' })}
                >
                  <Text style={styles.typeText}>Cardio</Text>
                </TouchableOpacity>
              </View>

              {editingWorkout.type === 'cardio' ? (
                <>
                  <View style={styles.grid3}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.miniLabel}>Caminhada (min)</Text>
                      <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={String(editingWorkout.walkMin ?? '')}
                        onChangeText={(t) => {
                          const w = parseInt(t, 10) || 0;
                          const r = Number(editingWorkout.runMin) || 0;
                          setEditingWorkout({
                            ...editingWorkout,
                            walkMin: w,
                            durationMin: w + r > 0 ? w + r : editingWorkout.durationMin,
                          });
                        }}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.miniLabel}>Corrida (min)</Text>
                      <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={String(editingWorkout.runMin ?? '')}
                        onChangeText={(t) => {
                          const r = parseInt(t, 10) || 0;
                          const w = Number(editingWorkout.walkMin) || 0;
                          setEditingWorkout({
                            ...editingWorkout,
                            runMin: r,
                            durationMin: w + r > 0 ? w + r : editingWorkout.durationMin,
                          });
                        }}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.miniLabel}>Distância (km)</Text>
                      <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={String(editingWorkout.distanceKm ?? '')}
                        onChangeText={(t) =>
                          setEditingWorkout({
                            ...editingWorkout,
                            distanceKm: parseFloat(String(t).replace(',', '.')) || 0,
                          })
                        }
                      />
                    </View>
                  </View>

                  <Text style={styles.label}>Duração Total (min)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={String(editingWorkout.durationMin ?? '')}
                    onChangeText={(t) =>
                      setEditingWorkout({
                        ...editingWorkout,
                        durationMin: parseInt(t, 10) || 0,
                      })
                    }
                  />
                </>
              ) : (
                <>
                  <View style={styles.exHeader}>
                    <Text style={styles.sectionLabel}>EXERCÍCIOS</Text>
                    <TouchableOpacity style={styles.addExBtn} onPress={addExercise}>
                      <Plus size={14} color="#fff" />
                      <Text style={styles.addExText}>Adicionar</Text>
                    </TouchableOpacity>
                  </View>

                  {(editingWorkout.exercises || []).map((ex, idx) => {
                    const isIso = Boolean(ex.isIsometric);
                    const setsVal = ex._setsText ?? String(ex.setsCount ?? 3);
                    const repsVal = ex._repsText ?? String(ex.defaultReps ?? 12);
                    const secVal =
                      ex._secondsText ?? String(ex.durationSeconds ?? ex.defaultReps ?? 45);
                    const weightVal = ex._weightText ?? String(ex.defaultWeight ?? 0);
                    const restVal = ex._restText ?? String(ex.restSeconds ?? 60);

                    return (
                      <View key={ex?.id || `e-${idx}`} style={styles.exCard}>
                        <View style={styles.exTop}>
                          <TextInput
                            style={[styles.input, { flex: 1, marginBottom: 0 }]}
                            value={ex.name}
                            onChangeText={(t) => updateExercise(idx, 'name', t)}
                            placeholder="Nome do exercício"
                            placeholderTextColor={COLORS.textMuted}
                          />
                          <TouchableOpacity
                            style={styles.iconBtn}
                            onPress={() => removeExercise(idx)}
                          >
                            <Trash2 size={16} color={COLORS.red} />
                          </TouchableOpacity>
                        </View>

                        <View style={styles.modeRow}>
                          <TouchableOpacity
                            style={[styles.modeBtn, !isIso && styles.modeBtnActive]}
                            onPress={() => toggleExerciseMode(idx, false)}
                          >
                            <Text style={[styles.modeText, !isIso && styles.modeTextActive]}>
                              Repetições
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.modeBtn, isIso && styles.modeBtnActive]}
                            onPress={() => toggleExerciseMode(idx, true)}
                          >
                            <Text style={[styles.modeText, isIso && styles.modeTextActive]}>
                              Segundos (Tempo)
                            </Text>
                          </TouchableOpacity>
                        </View>

                        <View style={styles.grid4}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.miniLabel}>Séries</Text>
                            <TextInput
                              style={styles.input}
                              keyboardType="numeric"
                              value={setsVal}
                              onChangeText={(t) => {
                                const cleaned = t.replace(/[^0-9]/g, '');
                                updateExercise(idx, '_setsText', cleaned);
                                updateExercise(idx, 'setsCount', parseInt(cleaned, 10) || 1);
                              }}
                            />
                          </View>

                          {isIso ? (
                            <View style={{ flex: 1 }}>
                              <Text style={styles.miniLabel}>Segundos</Text>
                              <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                value={secVal}
                                onChangeText={(t) => {
                                  const cleaned = t.replace(/[^0-9]/g, '');
                                  const s = parseInt(cleaned, 10) || 0;
                                  setEditingWorkout((prev) => ({
                                    ...prev,
                                    exercises: (prev?.exercises || []).map((item, i) =>
                                      i === idx
                                        ? {
                                            ...item,
                                            _secondsText: cleaned,
                                            _repsText: cleaned,
                                            durationSeconds: s,
                                            defaultReps: s,
                                          }
                                        : item
                                    ),
                                  }));
                                }}
                              />
                            </View>
                          ) : (
                            <>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.miniLabel}>Reps</Text>
                                <TextInput
                                  style={styles.input}
                                  keyboardType="numeric"
                                  value={repsVal}
                                  onChangeText={(t) => {
                                    const cleaned = t.replace(/[^0-9]/g, '');
                                    const r = parseInt(cleaned, 10) || 0;
                                    setEditingWorkout((prev) => ({
                                      ...prev,
                                      exercises: (prev?.exercises || []).map((item, i) =>
                                        i === idx
                                          ? {
                                              ...item,
                                              _repsText: cleaned,
                                              defaultReps: r,
                                            }
                                          : item
                                      ),
                                    }));
                                  }}
                                />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.miniLabel}>Carga</Text>
                                <TextInput
                                  style={styles.input}
                                  keyboardType="numeric"
                                  value={weightVal}
                                  onChangeText={(t) => {
                                    const cleaned = t.replace(/[^0-9.,]/g, '');
                                    const w =
                                      parseFloat(cleaned.replace(',', '.')) || 0;
                                    setEditingWorkout((prev) => ({
                                      ...prev,
                                      exercises: (prev?.exercises || []).map((item, i) =>
                                        i === idx
                                          ? {
                                              ...item,
                                              _weightText: cleaned,
                                              defaultWeight: w,
                                            }
                                          : item
                                      ),
                                    }));
                                  }}
                                />
                              </View>
                            </>
                          )}

                          <View style={{ flex: 1 }}>
                            <Text style={styles.miniLabel}>Desc. (s)</Text>
                            <TextInput
                              style={styles.input}
                              keyboardType="numeric"
                              value={restVal}
                              onChangeText={(t) => {
                                const cleaned = t.replace(/[^0-9]/g, '');
                                const parsed = parseInt(cleaned, 10);
                                setEditingWorkout((prev) => ({
                                  ...prev,
                                  exercises: (prev?.exercises || []).map((item, i) =>
                                    i === idx
                                      ? {
                                          ...item,
                                          _restText: cleaned,
                                          restSeconds: Number.isNaN(parsed)
                                            ? 0
                                            : Math.max(0, parsed),
                                        }
                                      : item
                                  ),
                                }));
                              }}
                            />
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </>
              )}

              <TouchableOpacity style={styles.saveBtn} onPress={saveWorkout}>
                <Check size={18} color="#fff" />
                <Text style={styles.saveText}>SALVAR FICHA</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 14, paddingBottom: 32 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: { color: COLORS.text, fontSize: 22, fontWeight: '900' },
  subtitle: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2 },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.orange,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },
  newBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  cardTitle: { color: COLORS.text, fontSize: 16, fontWeight: '800' },
  cardSub: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  cardMeta: { color: COLORS.textMuted, fontSize: 12, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: COLORS.cardElevated,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.9,
    marginTop: 12,
    marginBottom: 10,
  },
  backupRow: { flexDirection: 'row', gap: 10 },
  backupBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backupText: { color: COLORS.text, fontSize: 13, fontWeight: '700' },
  modalWrap: { flex: 1, backgroundColor: COLORS.bg },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: { color: COLORS.text, fontSize: 18, fontWeight: '900' },
  modalContent: { padding: 16, paddingBottom: 40 },
  label: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 6 },
  miniLabel: { color: COLORS.textMuted, fontSize: 11, marginBottom: 4 },
  input: {
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
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  typeBtnActive: { backgroundColor: COLORS.orangeDim, borderColor: COLORS.orange },
  typeText: { color: COLORS.text, fontSize: 13, fontWeight: '700' },
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  modeBtn: {
    flex: 1,
    paddingVertical: 7,
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
  exHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addExBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.orange,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addExText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  exCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  exTop: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  grid3: { flexDirection: 'row', gap: 8 },
  grid4: { flexDirection: 'row', gap: 6 },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.green,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
  },
  saveText: { color: '#fff', fontSize: 14, fontWeight: '900' },
});
