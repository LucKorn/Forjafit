import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { Plus, Trash2, Ruler } from 'lucide-react-native';
import { COLORS } from './colors';
import { triggerLightTap } from './feedback';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export default function BodyScreen({
  profile,
  history = [],
  onSaveMonthlyRecord,
  onDeleteRecord,
  onClearHistory,
}) {
  const safeHistory = Array.isArray(history) ? history : [];

  const [heightCm, setHeightCm] = useState(String(profile?.heightCm ?? '177'));
  const [weightKg, setWeightKg] = useState(String(profile?.weightKg ?? '79'));
  const [armCm, setArmCm] = useState(String(profile?.armCm ?? '37'));
  const [chestCm, setChestCm] = useState(String(profile?.chestCm ?? '103'));
  const [waistCm, setWaistCm] = useState(String(profile?.waistCm ?? '82.5'));
  const [abdomenCm, setAbdomenCm] = useState(String(profile?.abdomenCm ?? '85.5'));
  const [thighCm, setThighCm] = useState(String(profile?.thighCm ?? '58'));
  const [calfCm, setCalfCm] = useState(String(profile?.calfCm ?? '38.5'));

  useEffect(() => {
    if (profile) {
      setHeightCm(String(profile.heightCm ?? '177'));
      setWeightKg(String(profile.weightKg ?? '79'));
      setArmCm(String(profile.armCm ?? '37'));
      setChestCm(String(profile.chestCm ?? '103'));
      setWaistCm(String(profile.waistCm ?? '82.5'));
      setAbdomenCm(String(profile.abdomenCm ?? '85.5'));
      setThighCm(String(profile.thighCm ?? '58'));
      setCalfCm(String(profile.calfCm ?? '38.5'));
    }
  }, [profile]);

  const parseNum = (val) => parseFloat(String(val || '').replace(',', '.')) || 0;

  const hNum = parseNum(heightCm) || 177;
  const wNum = parseNum(weightKg);
  const bmi = wNum > 0 && hNum > 0 ? (wNum / Math.pow(hNum / 100, 2)).toFixed(1) : '--';
  const bmiLabel =
    bmi === '--'
      ? ''
      : parseFloat(bmi) < 18.5
      ? 'Abaixo do peso'
      : parseFloat(bmi) < 25
      ? 'Peso normal'
      : 'Sobrepeso / ...';

  const handleSaveMonth = () => {
    if (wNum <= 0) {
      Alert.alert('Peso obrigatório', 'Informe o peso atual em kg.');
      return;
    }
    triggerLightTap();
    const now = new Date();
    const monthLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
    const record = {
      id: `body-${Date.now()}`,
      timestamp: now.getTime(),
      monthLabel,
      heightCm: hNum,
      weightKg: wNum,
      bmi,
      armCm: parseNum(armCm),
      chestCm: parseNum(chestCm),
      waistCm: parseNum(waistCm),
      abdomenCm: parseNum(abdomenCm),
      thighCm: parseNum(thighCm),
      calfCm: parseNum(calfCm),
    };
    if (onSaveMonthlyRecord) onSaveMonthlyRecord(record);
    Alert.alert('Salvo', `Medidas de ${monthLabel} registradas no histórico.`);
  };

  const confirmDelete = (item) => {
    triggerLightTap();
    Alert.alert('Excluir Registro', `Remover medidas de ${item.monthLabel}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => onDeleteRecord && onDeleteRecord(item.id),
      },
    ]);
  };

  const confirmClear = () => {
    triggerLightTap();
    Alert.alert('Limpar Histórico', 'Excluir todo o histórico mensal corporal?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir Tudo',
        style: 'destructive',
        onPress: () => onClearHistory && onClearHistory(),
      },
    ]);
  };

  const renderMeasureTile = (label, value, setter) => (
    <View style={styles.measureTile}>
      <Text style={styles.measureLabel}>{label}</Text>
      <TextInput
        style={styles.measureInput}
        keyboardType="numeric"
        value={value}
        onChangeText={setter}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>Antropometria & Perfil</Text>
      <Text style={styles.title}>Corpo & Medidas</Text>

      <View style={styles.topCard}>
        <View style={styles.topField}>
          <Text style={styles.topLabel}>ALTURA (CM)</Text>
          <TextInput
            style={styles.topInput}
            keyboardType="numeric"
            value={heightCm}
            onChangeText={setHeightCm}
          />
        </View>

        <View style={styles.topField}>
          <Text style={styles.topLabel}>PESO ATUAL (KG)</Text>
          <TextInput
            style={[styles.topInput, { color: COLORS.orange }]}
            keyboardType="numeric"
            value={weightKg}
            onChangeText={setWeightKg}
          />
        </View>

        <View style={styles.imcBox}>
          <Text style={styles.topLabel}>IMC ATUAL</Text>
          <Text style={styles.imcValue}>{bmi}</Text>
          {!!bmiLabel && <Text style={styles.imcSub}>{bmiLabel}</Text>}
        </View>
      </View>

      <View style={styles.circCard}>
        <View style={styles.circHeader}>
          <Text style={styles.circTitle}>Circunferências (cm)</Text>
          <View style={styles.tapeRow}>
            <Ruler size={13} color={COLORS.textMuted} />
            <Text style={styles.tapeText}>Fita métrica</Text>
          </View>
        </View>

        <View style={styles.grid2}>
          {renderMeasureTile('Braço', armCm, setArmCm)}
          {renderMeasureTile('Peitoral', chestCm, setChestCm)}
          {renderMeasureTile('Cintura', waistCm, setWaistCm)}
          {renderMeasureTile('Abdômen', abdomenCm, setAbdomenCm)}
          {renderMeasureTile('Coxa', thighCm, setThighCm)}
          {renderMeasureTile('Panturrilha', calfCm, setCalfCm)}
        </View>

        <TouchableOpacity style={styles.saveMonthBtn} onPress={handleSaveMonth}>
          <Plus size={17} color="#fff" />
          <Text style={styles.saveMonthText}>Salvar Medidas do Mês</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.histHeader}>
        <Text style={styles.histTitle}>Histórico Mensal Corporal</Text>
        {safeHistory.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={confirmClear}>
            <Trash2 size={13} color={COLORS.red} />
            <Text style={styles.clearText}>Limpar</Text>
          </TouchableOpacity>
        )}
      </View>

      {safeHistory.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Nenhum registro mensal salvo ainda.</Text>
        </View>
      ) : (
        safeHistory.map((item, idx) => (
          <View key={item?.id || `b-${idx}`} style={styles.histCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.histMonth}>{item.monthLabel}</Text>
              <Text style={styles.histDetail}>
                Peso: {item.weightKg} kg • IMC: {item.bmi || '--'}
              </Text>
              <Text style={styles.histDetail}>
                Braço {item.armCm} • Peitoral {item.chestCm} • Cintura {item.waistCm} • Abd {item.abdomenCm}
              </Text>
            </View>
            <TouchableOpacity style={styles.delBtn} onPress={() => confirmDelete(item)}>
              <Trash2 size={15} color={COLORS.red} />
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 14, paddingBottom: 32 },
  eyebrow: { color: COLORS.textSecondary, fontSize: 13 },
  title: { color: COLORS.text, fontSize: 25, fontWeight: '900', marginTop: 2, marginBottom: 14 },
  topCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 3.5,
    borderLeftColor: COLORS.orange,
    marginBottom: 14,
    gap: 10,
  },
  topField: { flex: 1 },
  topLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
    marginBottom: 6,
  },
  topInput: {
    backgroundColor: COLORS.cardElevated,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 8,
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  imcBox: { flex: 1, alignItems: 'center' },
  imcValue: { color: COLORS.text, fontSize: 20, fontWeight: '900' },
  imcSub: { color: COLORS.textMuted, fontSize: 10, marginTop: 2, textAlign: 'center' },
  circCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 18,
  },
  circHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  circTitle: { color: COLORS.text, fontSize: 17, fontWeight: '800' },
  tapeRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  tapeText: { color: COLORS.textMuted, fontSize: 12 },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  measureTile: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardElevated,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  measureLabel: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '700' },
  measureInput: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    minWidth: 56,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  saveMonthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.orange,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  saveMonthText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  histHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  histTitle: { color: COLORS.text, fontSize: 17, fontWeight: '800' },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.redDim,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  clearText: { color: COLORS.red, fontSize: 11, fontWeight: '700' },
  emptyBox: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  emptyText: { color: COLORS.textMuted, fontSize: 13 },
  histCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
    gap: 10,
  },
  histMonth: { color: COLORS.orange, fontSize: 14, fontWeight: '800' },
  histDetail: { color: COLORS.textSecondary, fontSize: 12, marginTop: 3 },
  delBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
        
