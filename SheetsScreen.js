import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { ArrowUp, ArrowDown, Trash2, Download, Upload } from 'lucide-react-native';
import { COLORS } from './colors';
import { exportBackupJson, importBackupJson } from './storage';

export default function SheetsScreen({ appData, onUpdateWorkouts, onRestoreBackup }) {
  const moveWorkout = (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= appData.workouts.length) return;
    const list = [...appData.workouts];
    const [item] = list.splice(index, 1);
    list.splice(target, 0, item);
    onUpdateWorkouts(list);
  };

  const deleteWorkout = (id) => {
    if (appData.workouts.length <= 1) {
      Alert.alert('Aviso', 'Mantenha pelo menos uma ficha cadastrada.');
      return;
    }
    Alert.alert('Excluir Ficha', 'Tem certeza que deseja excluir esta ficha de treino?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => onUpdateWorkouts(appData.workouts.filter((w) => w.id !== id)),
      },
    ]);
  };

  const handleExport = async () => {
    try {
      await exportBackupJson(appData);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível exportar o backup.');
    }
  };

  const handleImport = async () => {
    try {
      const restored = await importBackupJson();
      if (restored) {
        onRestoreBackup(restored);
        Alert.alert('Sucesso', 'Backup restaurado com sucesso!');
      }
    } catch (e) {
      Alert.alert('Erro', 'Arquivo JSON inválido.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gerenciar Fichas</Text>
        <Text style={styles.subtitle}>Ordem da fila e backup de dados</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>ORDEM DA FILA DE TREINOS</Text>
        {appData.workouts.map((w, idx) => (
          <View
            key={w.id}
            style={[styles.card, { borderLeftColor: w.color || COLORS.orange }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.posTag}>Posição #{idx + 1}</Text>
              <Text style={styles.name}>{w.name}</Text>
              <Text style={styles.focus}>
                {w.focus} • {w.type === 'cardio' ? 'Cardio' : `${w.exercises.length} exercícios`}
              </Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => moveWorkout(idx, -1)}>
                <ArrowUp size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => moveWorkout(idx, 1)}>
                <ArrowDown size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => deleteWorkout(w.id)}>
                <Trash2 size={16} color={COLORS.red} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>BACKUP LOCAL (JSON)</Text>
        <View style={styles.backupCard}>
          <Text style={styles.backupDesc}>
            Exporte suas fichas, histórico mensal e medidas corporais para salvar no Google Drive ou
            restaurar ao trocar de celular.
          </Text>
          <View style={styles.backupRow}>
            <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
              <Download size={16} color="#09090b" />
              <Text style={styles.exportText}>Exportar JSON</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.importBtn} onPress={handleImport}>
              <Upload size={16} color={COLORS.orange} />
              <Text style={styles.importText}>Importar JSON</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: { fontSize: 21, fontWeight: '900', color: COLORS.text },
  subtitle: { fontSize: 12, color: COLORS.textMuted },
  scrollContent: { padding: 14, paddingBottom: 40 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.orange,
    letterSpacing: 1,
    marginBottom: 10,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  posTag: { fontSize: 10, fontWeight: '800', color: COLORS.orange },
  name: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginTop: 2 },
  focus: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 6 },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.cardElevated,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backupCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backupDesc: { fontSize: 12, color: COLORS.textMuted, lineHeight: 18, marginBottom: 14 },
  backupRow: { flexDirection: 'row', gap: 10 },
  exportBtn: {
    flex: 1,
    backgroundColor: COLORS.orange,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  exportText: { color: '#09090b', fontWeight: '900', fontSize: 13 },
  importBtn: {
    flex: 1,
    backgroundColor: COLORS.orangeBg,
    borderWidth: 1,
    borderColor: COLORS.orangeBorder,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  importText: { color: COLORS.orange, fontWeight: '800', fontSize: 13 },
});
