import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight, Calendar, TrendingUp, Dumbbell } from 'lucide-react-native';
import { COLORS } from './colors';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function formatMonthLabel(monthKey) {
  const [y, m] = monthKey.split('-');
  return `${MONTH_NAMES[parseInt(m, 10) - 1]} ${y}`;
}

function shiftMonth(monthKey, delta) {
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function EvolutionScreen({ history }) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const monthSessions = useMemo(
    () => history.filter((item) => item.monthKey === selectedMonth),
    [history, selectedMonth]
  );

  const totalVolume = useMemo(
    () => monthSessions.reduce((acc, s) => acc + (s.volumeKg || 0), 0),
    [monthSessions]
  );

  const weeklyBars = useMemo(() => {
    const weeks = [0, 0, 0, 0];
    monthSessions.forEach((s, i) => {
      const idx = i % 4;
      weeks[idx] += s.volumeKg > 0 ? s.volumeKg : 800;
    });
    const maxVal = Math.max(1, ...weeks);
    return weeks.map((val, i) => ({
      label: `Sem ${i + 1}`,
      value: val,
      pct: Math.round((val / maxVal) * 100),
    }));
  }, [monthSessions]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Evolução Mensal</Text>
        <Text style={styles.subtitle}>Histórico de sessões e volume levantado</Text>
      </View>

      <View style={styles.monthBar}>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => setSelectedMonth((m) => shiftMonth(m, -1))}
        >
          <ChevronLeft size={20} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.monthCenter}>
          <Calendar size={16} color={COLORS.orange} />
          <Text style={styles.monthText}>{formatMonthLabel(selectedMonth)}</Text>
        </View>

        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => setSelectedMonth((m) => shiftMonth(m, 1))}
        >
          <ChevronRight size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Dumbbell size={18} color={COLORS.orange} />
            <Text style={styles.statValue}>{monthSessions.length}</Text>
            <Text style={styles.statLabel}>Treinos no mês</Text>
          </View>
          <View style={styles.statCard}>
            <TrendingUp size={18} color={COLORS.green} />
            <Text style={styles.statValue}>{totalVolume.toLocaleString('pt-BR')} kg</Text>
            <Text style={styles.statLabel}>Volume total</Text>
          </View>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Consistência Semanal ({formatMonthLabel(selectedMonth)})</Text>
          <View style={styles.barsRow}>
            {weeklyBars.map((b) => (
              <View key={b.label} style={styles.barCol}>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { height: `${Math.max(8, b.pct)}%` },
                      b.value === 0 && { backgroundColor: COLORS.borderLight },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{b.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.sectionTitle}>SESSÕES REALIZADAS ({monthSessions.length})</Text>
        {monthSessions.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Nenhum treino registrado neste mês.</Text>
          </View>
        ) : (
          monthSessions.map((session) => (
            <View
              key={session.id}
              style={[styles.sessionCard, { borderLeftColor: session.color || COLORS.orange }]}
            >
              <View>
                <Text style={styles.sessionDate}>{session.dateLabel}</Text>
                <Text style={styles.sessionName}>{session.workoutName}</Text>
                <Text style={styles.sessionSummary}>{session.summary}</Text>
              </View>
              <View style={styles.sessionRight}>
                {session.volumeKg > 0 ? (
                  <Text style={styles.sessionVol}>{session.volumeKg} kg</Text>
                ) : (
                  <Text style={[styles.sessionVol, { color: COLORS.blue }]}>Cardio</Text>
                )}
              </View>
            </View>
          ))
        )}
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
  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: 14,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  monthText: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  scrollContent: { paddingHorizontal: 14, paddingBottom: 40 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: { fontSize: 20, fontWeight: '900', color: COLORS.text, marginTop: 8 },
  statLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  chartCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 18,
  },
  chartTitle: { fontSize: 13, fontWeight: '800', color: COLORS.text, marginBottom: 14 },
  barsRow: { flexDirection: 'row', justifyContent: 'space-around', height: 110, alignItems: 'flex-end' },
  barCol: { alignItems: 'center', flex: 1 },
  barTrack: {
    width: 28,
    height: 85,
    backgroundColor: COLORS.bg,
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: { width: '100%', backgroundColor: COLORS.orange, borderRadius: 8 },
  barLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 6, fontWeight: '700' },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.orange,
    letterSpacing: 1,
    marginBottom: 10,
  },
  emptyBox: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyText: { color: COLORS.textDim, fontSize: 13 },
  sessionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionDate: { fontSize: 11, fontWeight: '800', color: COLORS.orange },
  sessionName: { fontSize: 15, fontWeight: '800', color: COLORS.text, marginTop: 2 },
  sessionSummary: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  sessionRight: { alignItems: 'flex-end' },
  sessionVol: { fontSize: 15, fontWeight: '900', color: COLORS.green },
});
