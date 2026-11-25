import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Dumbbell, Flame, Play, Calendar, Activity } from 'lucide-react-native';
import { COLORS } from './colors';
import { triggerLightTap } from './feedback';

export default function HomeScreen({ workouts = [], history = [], onStartWorkout }) {
  const safeWorkouts = Array.isArray(workouts) ? workouts : [];
  const safeHistory = Array.isArray(history) ? history : [];

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthSessions = safeHistory.filter((item) => {
    const d = new Date(item?.timestamp || 0);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalVolume = monthSessions.reduce((acc, s) => acc + (Number(s?.volumeKg) || 0), 0);
  const lastSession = safeHistory.length > 0 ? safeHistory[0] : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.brand}>FORJAFIT</Text>
        <Text style={styles.subtitle}>Pronto para o treino de hoje?</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Calendar size={15} color={COLORS.orange} />
            <Text style={styles.statLabel}>Este mês</Text>
          </View>
          <Text style={styles.statValue}>{monthSessions.length}</Text>
          <Text style={styles.statSub}>sessões concluídas</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Flame size={15} color={COLORS.green} />
            <Text style={styles.statLabel}>Volume mensal</Text>
          </View>
          <Text style={styles.statValue}>{totalVolume.toLocaleString('pt-BR')} kg</Text>
          <Text style={styles.statSub}>carga total levantada</Text>
        </View>
      </View>

      {lastSession && (
        <View style={styles.lastCard}>
          <Text style={styles.lastTitle}>ÚLTIMA SESSÃO</Text>
          <View style={styles.lastRow}>
            <View>
              <Text style={styles.lastName}>{lastSession.workoutName || 'Treino'}</Text>
              <Text style={styles.lastDate}>{lastSession.dateLabel || ''}</Text>
            </View>
            <Text style={styles.lastVol}>
              {(Number(lastSession.volumeKg) || 0) > 0
                ? `${lastSession.volumeKg} kg`
                : 'Cardio'}
            </Text>
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>ESCOLHER TREINO</Text>

      {safeWorkouts.map((w, idx) => {
        const isCardio = w?.type === 'cardio';
        const exList = Array.isArray(w?.exercises) ? w.exercises : [];
        const totalSets = exList.reduce((sum, ex) => sum + (parseInt(ex?.sets, 10) || 0), 0);
        return (
          <TouchableOpacity
            key={w?.id || `w-${idx}`}
            style={styles.workoutCard}
            activeOpacity={0.85}
            onPress={() => {
              triggerLightTap();
              if (onStartWorkout) onStartWorkout(w);
            }}
          >
            <View style={[styles.iconBox, isCardio && { backgroundColor: COLORS.blueDim }]}>
              {isCardio ? (
                <Activity size={20} color={COLORS.blue} />
              ) : (
                <Dumbbell size={20} color={COLORS.orange} />
              )}
            </View>

            <View style={styles.workoutInfo}>
              <Text style={styles.workoutName}>{w?.name || 'Treino'}</Text>
              {!!w?.subtitle && <Text style={styles.workoutSub}>{w.subtitle}</Text>}
              <Text style={styles.workoutMeta}>
                {isCardio
                  ? `${w?.distanceKm || 0} km • ${w?.durationMin || 0} min`
                  : `${exList.length} exercícios • ${totalSets} séries`}
              </Text>
            </View>

            <View style={[styles.playBadge, isCardio && { backgroundColor: COLORS.blue }]}>
              <Play size={14} color="#fff" fill="#fff" />
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, paddingBottom: 32 },
  header: { marginBottom: 18, marginTop: 4 },
  brand: {
    color: COLORS.orange,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  statValue: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
  },
  statSub: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  lastCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 18,
  },
  lastTitle: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  lastRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  lastDate: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  lastVol: {
    color: COLORS.green,
    fontSize: 15,
    fontWeight: '800',
  },
  sectionTitle: {
    color: COLORS.orange,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
  },
  workoutCard: {
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
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.orangeDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutInfo: { flex: 1 },
  workoutName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
  },
  workoutSub: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  workoutMeta: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  playBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
              
