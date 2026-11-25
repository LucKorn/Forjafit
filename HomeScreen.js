import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
} from 'react-native';
import { Play, Plus, Dumbbell, Flame, ChevronRight, X } from 'lucide-react-native';
import { COLORS } from './colors';

const PRESET_COLORS = ['#f97316', '#10b981', '#3b82f6', '#a855f7', '#ef4444'];

export default function HomeScreen({ workouts, onSelectWorkout, onCreateWorkout }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [focus, setFocus] = useState('');
  const [type, setType] = useState('strength');
  const [color, setColor] = useState('#f97316');

  const nextWorkout = workouts[0];
  const otherWorkouts = workouts.slice(1);

  const handleSaveNew = () => {
    if (!name.trim()) return;
    onCreateWorkout({
      id: 'w_' + Date.now(),
      name: name.trim(),
      focus: focus.trim() || (type === 'cardio' ? 'Cardio / Resistência' : 'Musculação Geral'),
      color,
      type,
      cardioConfig:
        type === 'cardio'
          ? { runMeters: '600', runSpeed: '12.0', walkMeters: '350', walkSpeed: '6.5', rounds: 7 }
          : undefined,
      exercises: [],
    });
    setName('');
    setFocus('');
    setType('strength');
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Flame size={20} color={COLORS.orange} fill={COLORS.orange} />
          </View>
          <View>
            <Text style={styles.appTitle}>ForjaFit</Text>
            <Text style={styles.appSubtitle}>Fila inteligente de treinos</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.newBtn} onPress={() => setModalVisible(true)}>
          <Plus size={16} color={COLORS.orange} />
          <Text style={styles.newBtnText}>Novo</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {nextWorkout && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>PRÓXIMO DA FILA</Text>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.heroCard, { borderLeftColor: nextWorkout.color || COLORS.orange }]}
              onPress={() => onSelectWorkout(nextWorkout.id)}
            >
              <View style={styles.heroTop}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>1º NA FILA • TREINO DO DIA</Text>
                </View>
                <Text style={styles.countText}>
                  {nextWorkout.type === 'cardio'
                    ? `${nextWorkout.cardioConfig?.rounds || 7} blocos`
                    : `${nextWorkout.exercises.length} exercícios`}
                </Text>
              </View>

              <Text style={styles.heroTitle}>{nextWorkout.name}</Text>
              <Text style={styles.heroFocus}>{nextWorkout.focus}</Text>

              {nextWorkout.type === 'strength' && nextWorkout.exercises.length > 0 && (
                <Text style={styles.previewList} numberOfLines={2}>
                  {nextWorkout.exercises.map((e) => e.name).join(' • ')}
                </Text>
              )}

              <View style={styles.startButton}>
                <Play size={16} color="#09090b" fill="#09090b" />
                <Text style={styles.startButtonText}>Iniciar Treino</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>OUTROS TREINOS ({otherWorkouts.length})</Text>
          <Text style={styles.helperNote}>
            Ao concluir um treino secundário, o próximo principal permanece no topo.
          </Text>

          {otherWorkouts.map((item, idx) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.8}
              style={[styles.secondaryCard, { borderLeftColor: item.color || COLORS.borderLight }]}
              onPress={() => onSelectWorkout(item.id)}
            >
              <View style={styles.secInfo}>
                <View style={styles.secTitleRow}>
                  <Text style={styles.queuePos}>#{idx + 2}</Text>
                  <Text style={styles.secTitle}>{item.name}</Text>
                </View>
                <Text style={styles.secFocus}>{item.focus}</Text>
                <Text style={styles.secMeta}>
                  {item.type === 'cardio'
                    ? 'Timer intervalado corrida/caminhada'
                    : `${item.exercises.length} exercícios cadastrados`}
                </Text>
              </View>
              <ChevronRight size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Novo Treino</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={22} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Nome da Ficha</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Treino C ou Pernas"
              placeholderTextColor={COLORS.textDim}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.inputLabel}>Foco / Descrição</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Inferiores e Ombros"
              placeholderTextColor={COLORS.textDim}
              value={focus}
              onChangeText={setFocus}
            />

            <Text style={styles.inputLabel}>Tipo de Treino</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[styles.typeBtn, type === 'strength' && styles.typeBtnActive]}
                onPress={() => setType('strength')}
              >
                <Dumbbell size={16} color={type === 'strength' ? COLORS.orange : COLORS.textMuted} />
                <Text style={[styles.typeText, type === 'strength' && { color: COLORS.orange }]}>
                  Musculação
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, type === 'cardio' && styles.typeBtnActive]}
                onPress={() => setType('cardio')}
              >
                <Flame size={16} color={type === 'cardio' ? COLORS.orange : COLORS.textMuted} />
                <Text style={[styles.typeText, type === 'cardio' && { color: COLORS.orange }]}>
                  Cardio
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Cor de Identificação</Text>
            <View style={styles.colorRow}>
              {PRESET_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setColor(c)}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: c },
                    color === c && styles.colorCircleSelected,
                  ]}
                />
              ))}
            </View>

            <TouchableOpacity style={styles.saveModalBtn} onPress={handleSaveNew}>
              <Text style={styles.saveModalText}>Criar Ficha</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.orangeBg,
    borderWidth: 1,
    borderColor: COLORS.orangeBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appTitle: { fontSize: 21, fontWeight: '900', color: COLORS.text, letterSpacing: 0.3 },
  appSubtitle: { fontSize: 12, color: COLORS.textMuted },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.orangeBg,
    borderWidth: 1,
    borderColor: COLORS.orangeBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  newBtnText: { color: COLORS.orange, fontWeight: '800', fontSize: 13 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  section: { marginBottom: 24 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.orange,
    letterSpacing: 1,
    marginBottom: 8,
  },
  helperNote: { fontSize: 12, color: COLORS.textDim, marginBottom: 10 },
  heroCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderLeftWidth: 5,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: {
    backgroundColor: COLORS.orangeBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: { color: COLORS.orange, fontSize: 10, fontWeight: '800' },
  countText: { color: COLORS.textMuted, fontSize: 12, fontWeight: '600' },
  heroTitle: { fontSize: 24, fontWeight: '900', color: COLORS.text },
  heroFocus: { fontSize: 14, color: COLORS.textMuted, marginTop: 2, marginBottom: 10 },
  previewList: {
    fontSize: 12,
    color: COLORS.textDim,
    backgroundColor: COLORS.bg,
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  startButton: {
    backgroundColor: COLORS.orange,
    borderRadius: 12,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startButtonText: { color: '#09090b', fontSize: 15, fontWeight: '900' },
  secondaryCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  secInfo: { flex: 1, paddingRight: 10 },
  secTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  queuePos: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
    backgroundColor: COLORS.cardElevated,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  secTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text },
  secFocus: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  secMeta: { fontSize: 11, color: COLORS.textDim, marginTop: 4 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.78)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderTopWidth: 1,
    borderColor: COLORS.borderLight,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 19, fontWeight: '900', color: COLORS.text },
  inputLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: COLORS.text,
    fontSize: 14,
  },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.bg,
  },
  typeBtnActive: { borderColor: COLORS.orange, backgroundColor: COLORS.orangeBg },
  typeText: { color: COLORS.textMuted, fontWeight: '700', fontSize: 13 },
  colorRow: { flexDirection: 'row', gap: 12, marginTop: 4, marginBottom: 18 },
  colorCircle: { width: 32, height: 32, borderRadius: 16 },
  colorCircleSelected: { borderWidth: 3, borderColor: '#ffffff' },
  saveModalBtn: { backgroundColor: COLORS.orange, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveModalText: { color: '#09090b', fontWeight: '900', fontSize: 15 },
});
