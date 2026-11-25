import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Save } from 'lucide-react-native';
import { COLORS } from './colors';
import { triggerShortBeep } from './feedback';

export default function BodyScreen({ profile, history, onSaveRecord }) {
  const [form, setForm] = useState(profile);

  const heightM = (parseFloat(form.heightCm) || 0) / 100;
  const weight = parseFloat(form.weightKg) || 0;
  const bmi = heightM > 0 && weight > 0 ? (weight / (heightM * heightM)).toFixed(1) : '--';

  const getBmiLabel = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return '';
    if (num < 18.5) return 'Abaixo do peso';
    if (num < 25) return 'Peso normal';
    if (num < 30) return 'Sobrepeso';
    return 'Obesidade';
  };

  const updateField = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleSave = () => {
    triggerShortBeep();
    const now = new Date();
    const monthKey = now.toISOString().slice(0, 7);
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const dateLabel = `${String(now.getDate()).padStart(2, '0')} ${months[now.getMonth()]} ${now.getFullYear()}`;

    const newEntry = {
      id: 'b_' + Date.now(),
      monthKey,
      dateLabel,
      weightKg: parseFloat(form.weightKg) || 0,
      bmi,
      waistCm: form.waistCm,
      armCm: form.armCm,
      chestCm: form.chestCm,
    };

    onSaveRecord(form, newEntry);
    Alert.alert('Medidas Salvas', 'Registro corporal adicionado ao histórico.');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Medidas & Perfil</Text>
        <Text style={styles.subtitle}>Peso, altura, IMC e circunferências</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.bmiCard}>
          <View>
            <Text style={styles.bmiTag}>ÍNDICE DE MASSA CORPORAL (IMC)</Text>
            <Text style={styles.bmiValue}>{bmi}</Text>
            <Text style={styles.bmiStatus}>{getBmiLabel(bmi)}</Text>
          </View>
          <View style={styles.hwBadge}>
            <Text style={styles.hwText}>{form.weightKg || '--'} kg</Text>
            <Text style={styles.hwSub}>{form.heightCm || '--'} cm</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>DADOS ATUAIS</Text>
          <View style={styles.grid}>
            <View style={styles.fieldBox}>
              <Text style={styles.label}>Peso (kg)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(form.weightKg)}
                onChangeText={(v) => updateField('weightKg', v)}
              />
            </View>
            <View style={styles.fieldBox}>
              <Text style={styles.label}>Altura (cm)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(form.heightCm)}
                onChangeText={(v) => updateField('heightCm', v)}
              />
            </View>
            <View style={styles.fieldBox}>
              <Text style={styles.label}>Peitoral (cm)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(form.chestCm)}
                onChangeText={(v) => updateField('chestCm', v)}
              />
            </View>
            <View style={styles.fieldBox}>
              <Text style={styles.label}>Braço (cm)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(form.armCm)}
                onChangeText={(v) => updateField('armCm', v)}
              />
            </View>
            <View style={styles.fieldBox}>
              <Text style={styles.label}>Cintura (cm)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(form.waistCm)}
                onChangeText={(v) => updateField('waistCm', v)}
              />
            </View>
            <View style={styles.fieldBox}>
              <Text style={styles.label}>Abdômen (cm)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(form.abdomenCm)}
                onChangeText={(v) => updateField('abdomenCm', v)}
              />
            </View>
            <View style={styles.fieldBox}>
              <Text style={styles.label}>Coxa (cm)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(form.thighCm)}
                onChangeText={(v) => updateField('thighCm', v)}
              />
            </View>
            <View style={styles.fieldBox}>
              <Text style={styles.label}>Panturrilha (cm)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(form.calfCm)}
                onChangeText={(v) => updateField('calfCm', v)}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Save size={18} color="#09090b" />
            <Text style={styles.saveBtnText}>Salvar Registro</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.historyHeader}>HISTÓRICO DE AVALIAÇÕES</Text>
        {history.map((item, idx) => {
          const prev = history[idx + 1];
          const diff = prev ? (item.weightKg - prev.weightKg).toFixed(1) : null;
          return (
            <View key={item.id} style={styles.histCard}>
              <View>
                <Text style={styles.histDate}>{item.dateLabel}</Text>
                <Text style={styles.histMetrics}>
                  Braço: {item.armCm}cm • Cintura: {item.waistCm}cm • Peito: {item.chestCm}cm
                </Text>
              </View>
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
            </View>
          );
        })}
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
  bmiCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.orangeBorder,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  bmiTag: { fontSize: 10, fontWeight: '800', color: COLORS.orange, letterSpacing: 0.8 },
  bmiValue: { fontSize: 30, fontWeight: '900', color: COLORS.text, marginTop: 2 },
  bmiStatus: { fontSize: 12, fontWeight: '700', color: COLORS.green },
  hwBadge: {
    backgroundColor: COLORS.bg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  hwText: { fontSize: 16, fontWeight: '900', color: COLORS.text },
  hwSub: { fontSize: 12, color: COLORS.textMuted },
  formCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 18,
  },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: COLORS.orange, letterSpacing: 1, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  fieldBox: { width: '48%' },
  label: { fontSize: 11, color: COLORS.textMuted, fontWeight: '700', marginBottom: 4 },
  input: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
  },
  saveBtn: {
    backgroundColor: COLORS.orange,
    borderRadius: 12,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  saveBtnText: { color: '#09090b', fontWeight: '900', fontSize: 14 },
  historyHeader: { fontSize: 11, fontWeight: '800', color: COLORS.orange, letterSpacing: 1, marginBottom: 10 },
  histCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  histDate: { fontSize: 13, fontWeight: '800', color: COLORS.text },
  histMetrics: { fontSize: 11, color: COLORS.textMuted, marginTop: 3 },
  histWeight: { fontSize: 16, fontWeight: '900', color: COLORS.text },
  histDiff: { fontSize: 11, fontWeight: '800', marginTop: 2 },
});
