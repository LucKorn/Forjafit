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
        {
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
        },
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
        const secVal = Number(ex.durationSeconds || ex.defaultReps || 45) || 45;
        const repVal = Number(ex.defaultReps || 12) || 12;
        return {
          ...ex,
          isIsometric: isIso,
          durationSeconds: isIso ? secVal : 0,
          defaultReps: isIso ? secVal : repVal,
          defaultWeight: isIso ? 0 : ex.defaultWeight || 10,
          lastSummary: isIso
            ? `${secVal}s • ${ex.setsCount || 3}×${secVal}s`
            : `${ex.defaultWeight || 10}kg • ${ex.setsCount || 3}×${repVal}`,
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
      const sets = Math.max(1, parseInt(ex.setsCount, 10) || 3);
      if (ex.isIsometric) {
        const secs = Math.max(1, parseInt(ex.durationSeconds ?? ex.defaultReps, 10) || 45);
        return {
          ...ex,
          setsCount: sets,
          isIsometric: true,
          durationSeconds: secs,
          defaultReps: secs,
          lastSummary: `${secs}s • ${sets}×${secs}s`,
        };
      }
      const reps = Math.max(1, parseInt(ex.defaultReps, 10) || 12);
      const weight = Number(ex.defaultWeight) || 0;
      return {
        ...ex,
        setsCount: sets,
        isIsometric: false,
        durationSeconds: 0,
        defaultReps: reps,
        defaultWeight: weight,
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
                onPress={() => {
                  const copy = JSON.parse(JSON.stringify(w));
                  if (copy.type === 'cardio' && copy.walkMin == null && copy.runMin == null) {
                    const half = Math.round((Number(copy.durationMin) || 40) / 2);
                    copy.walkMin = half;
                    copy.runMin = Math.max(0, (Number(copy.durationMin) || 40) - half);
                  }
                  setEditingWorkout(copy);
                }}
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

            <ScrollView contentContainerStyle={styles.modalContent}>
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
                              value={String(ex.setsCount)}
                              onChangeText={(t) =>
                                updateExercise(idx, 'setsCount', parseInt(t, 10) || 1)
                              }
                            />
                          </View>

                          {isIso ? (
                            <View style={{ flex: 1 }}>
                              <Text style={styles.miniLabel}>Segundos</Text>
                              <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                value={String(ex.durationSeconds ?? ex.defaultReps ?? 45)}
                                onChangeText={(t) => {
                                  const s = parseInt(t, 10) || 0;
                                  updateExercise(idx, 'durationSeconds', s);
                                  updateExercise(idx, 'defaultReps', s);
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
                                  value={String(ex.defaultReps)}
                                  onChangeText={(t) =>
                                    updateExercise(idx, 'defaultReps', parseInt(t, 10) || 10)
                                  }
                                />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.miniLabel}>Carga</Text>
                                <TextInput
                                  style={styles.input}
                                  keyboardType="numeric"
                                  value={String(ex.defaultWeight)}
                                  onChangeText={(t) =>
                                    updateExercise(
                                      idx,
                                      'defaultWeight',
                                      parseFloat(String(t).replace(',', '.')) || 0
                                    )
                                  }
                                />
                              </View>
                            </>
                          )}

                          <View style={{ flex: 1 }}>
                            <Text style={styles.miniLabel}>Desc. (s)</Text>
                            <TextInput
                              style={styles.input}
                              keyboardType="numeric"
          
