import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { ChevronLeft, ChevronRight, Calendar, Trash2 } from 'lucide-react-native';
import { COLORS } from './colors';
import { triggerLightTap } from './feedback';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export default function EvolutionScreen({ history, onDeleteSession, onClearMonthHistory }) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const changeMonth = (delta) => {
    triggerLightTap();
    let m = selectedMonth + delta;
    let y = selectedYear;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setSelectedMonth(m);
    setSelectedYear(y);
  };

  const monthSessions = useMemo(() => {
    return history.filter((item) => {
      const d = new Date(item.timestamp);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [history, selectedMonth, selectedYear]);

  const totalVolume = useMemo(
    () => monthSessions.reduce((sum, s) => sum + (s.volumeKg || 0), 0),
    [monthSessions]
  );

  const weeklyCounts = useMemo(() => {
    const weeks = [0, 0, 0, 0];
    monthSessions.forEach((s) => {
      const day = new Date(s.timestamp).getDate();
      const idx = Math.min(3, Math.floor((day - 1) / 7));
      weeks[idx] += 1;
    });
    return weeks;
  }, [monthSessions]);

  const maxWeek = Math.max(4, ...weeklyCounts);

  const confirmDeleteSession = (session) => {
    triggerLightTap();
    Alert.alert(
      'Excluir Treino Realizado',
      `Deseja remover "${session.workoutName}" (${session.dateLabel}) do histórico?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => onDeleteSession && onDeleteSession(session.id),
        },
      ]
    );
  };

  const confirmClearMonth = () => {
    triggerLightTap();
    Alert.alert(
      'Limpar Histórico do Mês',
      `Deseja excluir todos os ${monthSessions.length} registros de ${MONTH_NAMES[selectedMonth]} ${selectedYear}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir Tudo',
          style: 'destructive',
          onPress: () =>
            onClearMonthHistory && onClearMonthHistory(selectedMonth, selectedYear),
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Evolução Mensal</Text>
      <Text style={styles.subtitle}>Histórico de sessões e volume levantado</Text>

      <View style={styles.monthSelector}>
        <TouchableOpacity style={styles.navBtn} onPress={() => changeMonth(-1)}>
          <ChevronLeft size={18} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.monthLabelBox}>
          <Calendar size={16} color={COLORS.orange} />
          <Text style={styles.monthLabel}>
            {MONTH_NAMES[selectedMonth]} {selectedYear}
          </Text>
        </View>
        <TouchableOpacity style={styles.navBtn} onPress={() => changeMonth(1)}>
          <ChevronRight size={18} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{monthSessions.length}</Text>
          <Text style={styles.metricLabel}>Treinos no mês</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{totalVolume.toLocaleString('pt-BR')} kg</Text>
          <Text style={styles.metricLabel}>Volume total</Text>
        </View>
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>
          Consistência Semanal ({MONTH_NAMES[selectedMonth]} {selectedYear})
        </Text>
        <View style={styles.barsRow}>
          {weeklyCounts.map((count, i) => {
            const pct = Math.round((count / maxWeek) * 100);
            return (
              <View key={i} style={styles.barCol}>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: `${Math.max(pct, count > 0 ? 15 : 4)}%`,
                        backgroundColor: count > 0 ? COLORS.orange : COLORS.borderLight,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>Sem {i + 1}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          SESSÕES REALIZADAS ({monthSessions.length})
        </Text>
        {monthSessions.length > 0 && (
          <TouchableOpacity style={styles.clearAllBtn} onPress={confirmClearMonth}>
            <Trash2 size={13} color={COLORS.red} />
            <Text style={styles.clearAllText}>Limpar mês</Text>
          </TouchableOpacity>
        )}
      </View>

      {monthSessions.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Nenhuma sessão registrada neste mês.</Text>
        </View>
      ) : (
        monthSessions.map((session) => (
          <View key={session.id} style={styles.sessionCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sessionDate}>{session.dateLabel}</Text>
              <Text style={styles.sessionName}>{session.workoutName}</Text>
              <Text style={styles.sessionSub}>{session.summaryText}</Text>
            </View>

            <View style={styles.sessionRight}>
              {session.volumeKg > 0 ? (
                <Text style={styles.sessionVol}>{session.volumeKg} kg</Text>
              ) : (
                <Text style={[styles.sessionVol, { color: COLORS.blue }]}>Cardio</Text>
              )}

              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => confirmDeleteSession(session)}
              >
                <Trash2 size={15} color={COLORS.red} />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, paddingBottom: 32 },
  title: { color: COLORS.text, fontSize: 22, fontWeight: '800' },
  subtitle: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2, marginBottom: 14 },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabelBox: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  monthLabel: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  metricsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metricValue: { color: COLORS.text, fontSize: 20, fontWeight: '800' },
  metricLabel: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4 },
  chartCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 18,
  },
  chartTitle: { color: COLORS.text, fontSize: 14, fontWeight: '700', marginBottom: 14 },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 110,
  },
  barCol: { alignItems: 'center', gap: 8 },
  barTrack: {
    width: 24,
    height: 86,
    borderRadius: 8,
    backgroundColor: COLORS.bg,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: { width: '100%', borderRadius: 8 },
  barLabel: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '600' },
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
  sessionCard: {
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
  sessionDate: { color: COLORS.orange, fontSize: 12, fontWeight: '700' },
  sessionName: { color: COLORS.text, fontSize: 16, fontWeight: '800', marginTop: 2 },
  sessionSub: { color: COLORS.textSecondary, fontSize: 12, marginTop: 3 },
  sessionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sessionVol: { color: COLORS.green, fontSize: 15, fontWeight: '800' },
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
            
