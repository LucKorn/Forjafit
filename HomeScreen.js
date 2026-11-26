import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Flame, ChevronRight, Plus, ArrowRight } from 'lucide-react-native';
import { COLORS } from './colors';
import { triggerLightTap } from './feedback';

const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const SHORT_MONTHS = [
  'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
  'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO',
];

export default function HomeScreen({
  workouts = [],
  history = [],
  onStartWorkout,
  onOpenNewWorkout,
}) {
  const safeWorkouts = Array.isArray(workouts) ? workouts : [];
  const safeHistory = Array.isArray(history) ? history : [];

  const now = new Date();
  const dateTitle = `${WEEKDAYS[now.getDay()]}, ${now.getDate()} de ${MONTHS[now.getMonth()]}`;

  const monthSessions = useMemo(() => {
    return safeHistory.filter((item) => {
      const d = new Date(item?.timestamp || 0);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  }, [safeHistory, now]);

  const featuredWorkout = safeWorkouts[0] || null;
  const otherWorkouts = safeWorkouts.slice(1);
  const featuredExercises = Array.isArray(featuredWorkout?.exercises)
    ? featuredWorkout.exercises
    : [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.topHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.dateText}>{dateTitle}</Text>
          <View style={styles.brandRow}>
            <Text style={styles.brandMain}>ForjaFit </Text>
            <Text style={styles.brandSub}>Casa</Text>
          </View>
        </View>

        <View style={styles.monthBadge}>
          <Text style={styles.monthBadgeLabel}>{SHORT_MONTHS[now.getMonth()]}</Text>
          <Text style={styles.monthBadgeValue}>{monthSessions.length} treinos</Text>
        </View>
      </View>

      <View style={styles.queueRow}>
        <View style={styles.queueDotRow}>
          <View style={styles.queueDot} />
          <Text style={styles.queueLabel}>PRÓXIMO DA FILA</Text>
        </View>
        <Text style={styles.queueOrder}>1º na sequência</Text>
      </View>

      {featuredWorkout && (
        <View style={styles.featuredCard}>
          <View style={styles.featuredPill}>
            <Text style={styles.featuredPillText}>EM DESTAQUE</Text>
          </View>

          <Text style={styles.featuredTitle}>{featuredWorkout.name}</Text>
          <Text style={styles.featuredMeta}>
            {featuredWorkout.type === 'cardio'
              ? `${featuredWorkout.distanceKm || 6.5} km • ~${featuredWorkout.durationMin || 40} min`
              : `${featuredExercises.length} exercícios • ~${featuredWorkout.estimatedMin || 40} min`}
          </Text>

          {featuredWorkout.type === 'cardio' ? (
            <View style={styles.chipsWrap}>
              <View style={styles.chip}>
                <Text style={styles.chipText}>{featuredWorkout.subtitle}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.chipsWrap}>
              {featuredExercises.slice(0, 3).map((ex, idx) => (
                <View key={ex?.id || `chip-${idx}`} style={styles.chip}>
                  <Text style={styles.chipText} numberOfLines={1}>
                    {ex?.name || `Exercício ${idx + 1}`}
                  </Text>
                </View>
              ))}
              {featuredExercises.length > 3 && (
                <View style={styles.chipMore}>
                  <Text style={styles.chipMoreText}>+{featuredExercises.length - 3}</Text>
                </View>
              )}
            </View>
          )}

          <TouchableOpacity
            style={styles.startBtn}
            activeOpacity={0.88}
            onPress={() => {
              triggerLightTap();
              if (onStartWorkout) onStartWorkout(featuredWorkout);
            }}
          >
            <Text style={styles.startBtnText}>Iniciar Treino</Text>
            <ArrowRight size={17} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.othersHeader}>
        <Text style={styles.othersTitle}>OUTROS TREINOS</Text>
        <TouchableOpacity
          style={styles.newWorkoutBtn}
          onPress={() => {
            triggerLightTap();
            if (onOpenNewWorkout) onOpenNewWorkout();
          }}
        >
          <Plus size={14} color={COLORS.orange} />
          <Text style={styles.newWorkoutText}>Novo Treino</Text>
        </TouchableOpacity>
      </View>

      {otherWorkouts.map((w, idx) => {
        const isCardio = w?.type === 'cardio';
        const exList = Array.isArray(w?.exercises) ? w.exercises : [];
        const accentColor = isCardio ? COLORS.blue : COLORS.green;

        return (
          <TouchableOpacity
            key={w?.id || `other-${idx}`}
            style={[styles.otherCard, { borderLeftColor: accentColor, borderLeftWidth: 3 }]}
            activeOpacity={0.85}
            onPress={() => {
              triggerLightTap();
              if (onStartWorkout) onStartWorkout(w);
            }}
          >
            <View style={[styles.seqBadge, { borderColor: accentColor }]}>
              <Text style={[styles.seqText, { color: accentColor }]}>{idx + 2}º</Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.otherName} numberOfLines={1}>
                {w?.name || `Treino ${idx + 2}`}
              </Text>
              <Text style={styles.otherMeta}>
                {isCardio
                  ? `${w?.distanceKm || 6.5} km • ~${w?.durationMin || 40} min`
                  : `${exList.length} exercícios • ~${w?.estimatedMin || 38} min`}
              </Text>
            </View>

            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        );
      })}

      {safeHistory.length > 0 && (
        <View style={styles.lastSessionBox}>
          <View style={styles.lastSessionLeft}>
            <Flame size={15} color={COLORS.orange} />
            <View>
              <Text style={styles.lastSessionLabel}>ÚLTIMA SESSÃO REGISTRADA</Text>
              <Text style={styles.lastSessionName}>
                {safeHistory[0].workoutName} • {safeHistory[0].dateLabel}
              </Text>
            </View>
          </View>
          <Text style={styles.lastSessionVol}>
            {Number(safeHistory[0].volumeKg) > 0
              ? `${Number(safeHistory[0].volumeKg).toLocaleString('pt-BR')} kg`
              : 'Cardio'}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, paddingBottom: 28 },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 18,
    gap: 12,
  },
  dateText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '500' },
  brandRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 2 },
  brandMain: { color: COLORS.text, fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  brandSub: { color: COLORS.textSecondary, fontSize: 24, fontWeight: '400' },
  monthBadge: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'flex-end',
  },
  monthBadgeLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  monthBadgeValue: { color: COLORS.orange, fontSize: 14, fontWeight: '800', marginTop: 1 },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  queueDotRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  queueDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.orange },
  queueLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.9,
  },
  queueOrder: { color: COLORS.textMuted, fontSize: 12 },
  featuredCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: COLORS.orangeBorder,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.orange,
    marginBottom: 20,
  },
  featuredPill: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.orangeDim,
    borderWidth: 1,
    borderColor: COLORS.orangeBorder,
    borderRadius: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginBottom: 10,
  },
  featuredPillText: {
    color: COLORS.orange,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  featuredTitle: {
    color: COLORS.text,
    fontSize: 21,
    fontWeight: '900',
    lineHeight: 27,
  },
  featuredMeta: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 5,
    marginBottom: 14,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    backgroundColor: COLORS.cardElevated,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 9,
    paddingHorizontal: 11,
    paddingVertical: 7,
    maxWidth: '100%',
  },
  chipText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  chipMore: {
    backgroundColor: COLORS.cardElevated,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  chipMoreText: { color: COLORS.text, fontSize: 12, fontWeight: '800' },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.orange,
    paddingVertical: 14,
    borderRadius: 12,
  },
  startBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  othersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  othersTitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  newWorkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  newWorkoutText: { color: COLORS.orange, fontSize: 12, fontWeight: '700' },
  otherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
    gap: 12,
  },
  seqBadge: {
    width: 32,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: COLORS.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seqText: { fontSize: 12, fontWeight: '800' },
  otherName: { color: COLORS.text, fontSize: 15, fontWeight: '800' },
  otherMeta: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  lastSessionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 8,
    gap: 10,
  },
  lastSessionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  lastSessionLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  lastSessionName: { color: COLORS.text, fontSize: 13, fontWeight: '700', marginTop: 1 },
  lastSessionVol: { color: COLORS.green, fontSize: 14, fontWeight: '800' },
});
                                       
