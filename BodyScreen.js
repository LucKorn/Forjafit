import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { Scale, Plus, Trash2 } from 'lucide-react-native';
import { COLORS } from './colors';
import { triggerLightTap } from './feedback';

export default function BodyScreen({
  profile,
  history,
  onSaveRecord,
  onDeleteRecord,
  onClearBodyHistory,
}) {
  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');
  const [chest, setChest] = useState('');
  const [arm, setArm] = useState('');

  const latest = history.length > 0 ? history[0] : null;
  const heightM = (profile?.heightCm || 177) / 100;
  const bmi = latest && heightM > 0 ? (latest.weightKg / (heightM * heightM)).toFixed(1) : '--';

  const handleAdd = () => {
    const w = parseFloat(weight.replace(',', '.'));
    if (!w || w <= 0) {
      Alert.alert('Peso inválido', 'Informe seu peso atual em kg.');
      return;
    }
    triggerLightTap();
    const now = new Date();
    const months = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
    ];
    const dateLabel = `${String(now.getDate()).padStart(2, '0')} ${months[now.getMonth()]} ${now.getFullYear()}`;

    onSaveRecord({
      id: 'body-' + Date.now(),
      timestamp: now.getTime(),
      dateLabel,
      weightKg: w,
      waistCm: waist ? parseFloat(waist.replace(',', '.')) : null,
      chestCm: chest ? parseFloat(chest.replace(',', '.')) : null,
      armCm: arm ? parseFloat(arm.replace(',', '.')) : null,
    });

    setWeight('');
    setWaist('');
    setChest('');
    setArm('');
  };

  const confirmDeleteRecord = (entry) => {
    triggerLightTap();
    Alert.alert(
      'Excluir Medida Corporal',
      `Deseja remover o registro de ${entry.dateLabel} (${entry.weightKg} kg)?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => onDeleteRecord && onDeleteRecord(entry.id),
        },
      ]
    );
  };

  const confirmClearAllBody = () => {
    triggerLightTap();
    Alert.alert(
      'Limpar Histórico Corporal',
      `Deseja excluir todos os ${history.length} registros de medidas do corpo?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir Tudo',
          style: 'destructive',
          onPress: () => onClearBodyHistory && onClearBodyHistory(),
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Medidas Corporais</Text>
      <Text style={styles.subtitle}>Acompanhe peso, IMC e circunferências</Text>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.sumLabel}>Peso Atual</Text>
          <Text style={styles.sumValue}>{latest ? `${latest.weightKg} kg` : '--'}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.sumLabel}>IMC ({profile?.heightCm || 177} cm)</Text>
          <Text style={styles.sumValue}>{bmi}</Text>
        </View>
      </View>

      <View style={styles.formCard}>
        <View style={styles.formHeader}>
          <Scale size={16} color={COLORS.orange} />
          <Text style={styles.formTitle}>NOVO REGISTRO</Text>
        </View>

        <View style={styles.grid}>
          <View style={styles.field}>
            <Text style={styles.label}>Peso (kg) *</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={weight}
              onChangeText={setWeight}
              placeholder="79.0"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Cintura (cm)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={waist}
              onChangeText={setWaist}
              placeholder="84"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Tórax (cm)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={chest}
              onChangeText={setChest}
              placeholder="102"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Braço (cm)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={arm}
              onChangeText={setArm}
              placeholder="37"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
          <Plus size={16} color="#fff" />
          <Text style={styles.addBtnText}>SALVAR MEDIDA</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>HISTÓRICO DE MEDIDAS ({history.length})</Text>
        {history.length > 0 && (
          <TouchableOpacity style={styles.clearAllBtn} onPress={confirmClearAllBody}>
            <Trash2 size={13} color={COLORS.red} />
            <Text style={styles.clearAllText}>Limpar tudo</Text>
          </TouchableOpacity>
        )}
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Nenhuma medida corporal registrada.</Text>
        </View>
      ) : (
        history.map((item, idx) => {
          const prev = history[idx + 1];
          const diff = prev ? (item.weightKg - prev.weightKg).toFixed(1) : null;
          const details = [
            item.waistCm ? `Cintura: ${item.waistCm} cm` : null,
            item.chestCm ? `Tórax: ${item.chestCm} cm` : null,
            item.armCm ? `Braço: ${item.armCm} cm` : null,
          ]
            .filter(Boolean)
            .join(' • ');

          return (
            <View key={item.id} style={styles.histCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.histDate}>{item.dateLabel}</Text>
                {!!details && <Text style={styles.histDetails}>{details}</Text>}
              </View>

              <View style={styles.histRight}>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.histWeight}>{item.weightKg} kg</Text>
                  {diff !== null && (
                    <Text
                      style={[
                        styles.histDiff,
                        { color: parseFloat(diff) <= 0 ? COLORS.green : COLORS.orange },
                      ]}
                    >
                      {parseFloat(diff) > 0 ? `+${diff}` : diff} kg
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => confirmDeleteRecord(item)}
                >
                  <Trash2 size={15} color={COLORS.red} />
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, paddingBottom: 32 },
  title: { color: COLORS.text, fontSize: 22, fontWeight: '800' },
  subtitle: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2, marginBottom: 14 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sumLabel: { color: COLORS.textSecondary, fontSize: 12 },
  sumValue: { color: COLORS.text, fontSize: 20, fontWeight: '800', marginTop: 4 },
  formCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 18,
  },
  formHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  formTitle: { color: COLORS.orange, fontSize: 12, fontWeight: '800', letterSpacing: 0.8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  field: { width: '48%' },
  label: { color: COLORS.textSecondary, fontSize: 12, marginBottom: 4 },
  input: {
    backgroundColor: COLORS.cardElevated,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.orange,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 14,
  },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '900' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    color: COLORS.orange,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.redDim,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  clearAllText: {
    color: COLORS.red,
    fontSize: 11,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  emptyText: { color: COLORS.textMuted, fontSize: 13 },
  histCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
    gap: 10,
  },
  histDate: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  histDetails: { color: COLORS.textSecondary, fontSize: 12, marginTop: 3 },
  histRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  histWeight: { color: COLORS.orange, fontSize: 16, fontWeight: '800' },
  histDiff: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.cardElevated,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
    
