import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react-native';
import { COLORS } from './colors';
import { triggerLightTap } from './feedback';
import DarkConfirmModal from './DarkConfirmModal';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export default function EvolutionScreen({ history = [], onDeleteSession, onClearMonthHistory }) {
  const safeHistory = Array.isArray(history) ? history : [];
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [filterCode, setFilterCode] = useState('Todos');
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [clearMonthModalVisible, setClearMonthModalVisible] = useState(false);

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

  const monthAllSessions = useMemo(() => {
    return safeHistory.filter((item) => {
      const d = new Date(item?.timestamp || 0);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [safeHistory, selectedMonth, selectedYear]);

  const filteredSessions = useMemo(() => {
    if (filterCode === 'Todos') return monthAllSessions;
    return monthAllSessions.filter((s) => {
      const code = String(s?.workoutCode || s?.workoutName || '');
      if (filterCode === 'Tr. A') return /a|empurrar/i.test(code);
      if (filterCode === 'Tr. B') return /b|puxar/i.test(code);
      return true;
    });
  }, [monthAllSessions, filterCode]);

  const totalVolume = useMemo(
    () => filteredSessions.reduce((sum, s) => sum + (Number(s?.volumeKg) || 0), 0),
    [filteredSessions]
  );

  const weeklyTons = useMemo(() => {
    const weeks = [0, 0, 0, 0];
    filteredSessions.forEach((s) => {
      const day = new Date(s?.timestamp || 0).getDate();
      const idx = Math.min(3, Math.floor((day - 1) / 7));
      weeks[idx] += Number(s?.volumeKg) || 0;
    });
    return weeks.map((kg) => Number((kg / 1000).toFixed(1)));
  }, [filteredSessions]);

  const maxTon = Math.max(1, ...weeklyTons);
  const avgWeeklyKg = Math.round(totalVolume / 4);

  const confirmDelete = (session) => {
    triggerLightTap();
    setSessionToDelete(session);
  };

  const confirmClearMonth = () => {
    triggerLightTap();
    setClearMonthModalVisible(true);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.monthCard}>
        <TouchableOpacity style={styles.arrowBtn} onPress={() => changeMonth(-1)}>
          <ChevronLeft size={18} color={COLORS.text} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.monthEyebrow}>MÊS SELECIONADO</Text>
          <Text style={styles.monthTitle}>
            {MONTH_NAMES[selectedMonth]} {selectedYear}
          </Text>
        </View>
        <TouchableOpacity style={styles.arrowBtn} onPress={() => changeMonth(1)}>
          <ChevronRight size={18} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.kpiRow}>
        <View style={styles.kpiBox}>
          <Text style={styles.kpiLabel}>TREINOS</Text>
          <Text style={styles.kpiValue}>{filteredSessions.length}</Text>
          <Text style={[styles.kpiSub, { color: COLORS.green }]}>Concluídos</Text>
        </View>

        <View style={styles.kpiBox}>
          <Text style={styles.kpiLabel}>VOLUME MÊS</Text>
          <Text style={[styles.kpiValue, { color: COLORS.orange, fontSize: 17 }]}>
            {totalVolume.toLocaleString('pt-BR')} kg
          </Text>
          <Text style={styles.kpiSub}>Acumulado</Text>
        </View>

        <View style={styles.kpiBox}>
          <Text style={styles.kpiLabel}>MÉDIA SEM.</Text>
          <Text style={[styles.kpiValue, { color: COLORS.amber, fontSize: 17 }]}>
            {avgWeeklyKg.toLocaleString('pt-BR')} kg
          </Text>
          <Text style={styles.kpiSub}>Por semana</Text>
        </View>
      </View>

      <View style={styles.chartCard}>
        <View style={styles.chartTop}>
          <View>
            <Text style={styles.chartTitle}>Semanas do Mês</Text>
            <Text style={styles.chartSub}>
              {MONTH_NAMES[selectedMonth]} {selectedYear}
            </Text>
          </View>

          <View style={styles.filterGroup}>
            {['Todos', 'Tr. A', 'Tr. B'].map((pill) => {
              const active = filterCode === pill;
              return (
                <TouchableOpacity
                  key={pill}
                  style={[styles.filterPill, active && styles.filterPillActive]}
                  onPress={() => {
                    triggerLightTap();
                    setFilterCode(pill);
                  }}
                >
                  <Text
                    style={[styles.filterText, active && styles.filterTextActive]}
                  >
                    {pill}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.barsContainer}>
          {weeklyTons.map((ton, idx) => {
            const pct = Math.round((ton / maxTon) * 100);
            return (
              <View key={idx} style={styles.barColumn}>
                <Text style={styles.barValue}>{ton.toFixed(1)}t</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: `${Math.max(pct, ton > 0 ? 18 : 6)}%`,
                        backgroundColor: ton > 0 ? COLORS.orange : COLORS.borderLight,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.barWeek, ton > 0 && { color: COLORS.orange }]}>
                  Sem {idx + 1}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.sessionsHeader}>
        <Text style={styles.sessionsTitle}>Sessões do Mês</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={styles.countPill}>
            <Text style={styles.countPillText}>{filteredSessions.length} registros</Text>
          </View>
          {monthAllSessions.length > 0 && (
            <TouchableOpacity style={styles.clearBtn} onPress={confirmClearMonth}>
              <Trash2 size={13} color={COLORS.red} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {filteredSessions.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Nenhuma sessão registrada neste período.</Text>
        </View>
      ) : (
        filteredSessions.map((session, idx) => (
          <View
            key={session?.id || `s-${idx}`}
            style={[
              styles.sessionCard,
              {
                borderLeftWidth: 3,
                borderLeftColor:
                  session.type === 'cardio'
                    ? COLORS.blue
                    : /b|puxar/i.test(session.workoutName)
                    ? COLORS.green
                    : COLORS.orange,
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <View style={styles.sessionTop}>
                <Text style={styles.sessionName} numberOfLines={1}>
                  {session.workoutName}
                </Text>
                <Text style={styles.sessionDate}>{session.dateLabel}</Text>
              </View>
              <Text style={styles.sessionSummary}>{session.summaryText}</Text>
            </View>

            <TouchableOpacity
              style={styles.delBtn}
              onPress={() => confirmDelete(session)}
            >
              <Trash2 size={15} color={COLORS.red} />
            </TouchableOpacity>
          </View>
        ))
      )}

      <DarkConfirmModal
        visible={Boolean(sessionToDelete)}
        title="Excluir Treino Realizado"
        message={
          sessionToDelete
            ? `Deseja remover "${sessionToDelete.workoutName}" (${sessionToDelete.dateLabel})?`
            : ''
        }
        confirmText="Excluir"
        cancelText="Cancelar"
        destructive
        onCancel={() => setSessionToDelete(null)}
        onConfirm={() => {
          if (sessionToDelete && onDeleteSession) {
            onDeleteSession(sessionToDelete.id);
          }
          setSessionToDelete(null);
        }}
      />

      <DarkConfirmModal
        visible={clearMonthModalVisible}
        title="Limpar Mês"
        message={`Excluir todos os ${monthAllSessions.length} registros de ${MONTH_NAMES[selectedMonth]} ${selectedYear}?`}
        confirmText="Excluir Tudo"
        cancelText="Cancelar"
        destructive
        onCancel={() => setClearMonthModalVisible(false)}
        onConfirm={() => {
          if (onClearMonthHistory) {
            onClearMonthHistory(selectedMonth, selectedYear);
          }
          setClearMonthModalVisible(false);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 14, paddingBottom: 32 },
  monthCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  arrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.cardElevated,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthEyebrow: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.9,
  },
  monthTitle: { color: COLORS.text, fontSize: 17, fontWeight: '900', marginTop: 2 },
  kpiRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  kpiBox: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  kpiLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  kpiValue: { color: COLORS.text, fontSize: 22, fontWeight: '900', marginTop: 4 },
  kpiSub: { color: COLORS.textSecondary, fontSize: 11, marginTop: 2 },
  chartCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 18,
  },
  chartTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    gap: 8,
  },
  chartTitle: { color: COLORS.text, fontSize: 16, fontWeight: '800' },
  chartSub: { color: COLORS.textSecondary, fontSize: 12, marginTop: 1 },
  filterGroup: {
    flexDirection: 'row',
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  filterPillActive: { backgroundColor: COLORS.orange },
  filterText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '700' },
  filterTextActive: { color: '#fff', fontWeight: '800' },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 150,
  },
  barColumn: { alignItems: 'center', flex: 1 },
  barValue: { color: COLORS.text, fontSize: 12, fontWeight: '800', marginBottom: 6 },
  barTrack: {
    width: 44,
    height: 104,
    borderRadius: 10,
    backgroundColor: COLORS.cardElevated,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: { width: '100%', borderRadius: 10 },
  barWeek: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '700', marginTop: 8 },
  sessionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sessionsTitle: { color: COLORS.text, fontSize: 17, fontWeight: '800' },
  countPill: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countPillText: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '700' },
  clearBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: COLORS.redDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBox: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  emptyText: { color: COLORS.textSecondary, fontSize: 13 },
  sessionCard: {
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
  sessionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sessionName: { color: COLORS.text, fontSize: 15, fontWeight: '800', flex: 1 },
  sessionDate: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '700' },
  sessionSummary: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4, lineHeight: 17 },
  delBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
  
