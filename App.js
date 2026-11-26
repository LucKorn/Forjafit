import React, { useState, useEffect, Component } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import * as Icons from 'lucide-react-native';
import { COLORS } from './colors';
import { INITIAL_DATA } from './initialData';
import { loadAppData, saveAppData } from './storage';
import HomeScreen from './HomeScreen';
import WorkoutScreen from './WorkoutScreen';
import EvolutionScreen from './EvolutionScreen';
import SheetsScreen from './SheetsScreen';
import BodyScreen from './BodyScreen';
import RestBar from './RestBar';

const ZapIcon = Icons.Zap || View;
const ChartIcon = Icons.BarChart2 || Icons.TrendingUp || View;
const FileIcon = Icons.FileText || Icons.ClipboardList || View;
const UserIcon = Icons.User || View;

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'Erro inesperado na tela',
    };
  }

  componentDidCatch(error, info) {
    console.log('ForjaFit ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.safe}>
          <ScrollView contentContainerStyle={styles.errBox}>
            <Text style={styles.errTitle}>Ops! Ocorreu um erro na tela</Text>
            <Text style={styles.errMsg}>{this.state.errorMessage}</Text>
            <TouchableOpacity
              style={styles.errBtn}
              onPress={() => {
                this.setState({ hasError: false, errorMessage: '' });
                if (this.props.onReset) this.props.onReset();
              }}
            >
              <Text style={styles.errBtnText}>VOLTAR PARA TREINOS</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [appData, setAppData] = useState(INITIAL_DATA);
  const [activeTab, setActiveTab] = useState('treinos');
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [autoOpenNewSheet, setAutoOpenNewSheet] = useState(false);
  const [restSeconds, setRestSeconds] = useState(null);
  const [restTotal, setRestTotal] = useState(60);

  useEffect(() => {
    loadAppData().then((loaded) => {
      if (loaded) setAppData(loaded);
    });
  }, []);

  const persist = (nextData) => {
    setAppData(nextData);
    saveAppData(nextData);
  };

  const handleFinishWorkout = (sessionRecord) => {
    const currentHistory = Array.isArray(appData?.history) ? appData.history : [];
    persist({
      ...appData,
      history: [sessionRecord, ...currentHistory],
    });
    setActiveWorkout(null);
    setRestSeconds(null);
    setActiveTab('evolucao');
  };

  const handleDeleteSession = (sessionId) => {
    const currentHistory = Array.isArray(appData?.history) ? appData.history : [];
    persist({
      ...appData,
      history: currentHistory.filter((item) => item.id !== sessionId),
    });
  };

  const handleClearMonthHistory = (month, year) => {
    const currentHistory = Array.isArray(appData?.history) ? appData.history : [];
    persist({
      ...appData,
      history: currentHistory.filter((item) => {
        const d = new Date(item?.timestamp || 0);
        return !(d.getMonth() === month && d.getFullYear() === year);
      }),
    });
  };

  const handleSaveBodyMonth = (record) => {
    const currentBody = Array.isArray(appData?.bodyHistory) ? appData.bodyHistory : [];
    const nextProfile = {
      ...(appData?.bodyProfile || INITIAL_DATA.bodyProfile),
      heightCm: record.heightCm,
      weightKg: record.weightKg,
      armCm: record.armCm,
      chestCm: record.chestCm,
      waistCm: record.waistCm,
      abdomenCm: record.abdomenCm,
      thighCm: record.thighCm,
      calfCm: record.calfCm,
    };
    persist({
      ...appData,
      bodyProfile: nextProfile,
      bodyHistory: [record, ...currentBody],
    });
  };

  const handleDeleteBodyRecord = (entryId) => {
    const currentBody = Array.isArray(appData?.bodyHistory) ? appData.bodyHistory : [];
    persist({
      ...appData,
      bodyHistory: currentBody.filter((item) => item.id !== entryId),
    });
  };

  const handleClearBodyHistory = () => {
    persist({
      ...appData,
      bodyHistory: [],
    });
  };

  const startRest = (sec) => {
    const safe = Math.max(1, Number(sec) || 60);
    setRestTotal(safe);
    setRestSeconds(safe);
  };

  const resetToHome = () => {
    setActiveWorkout(null);
    setRestSeconds(null);
    setActiveTab('treinos');
  };

  return (
    <ErrorBoundary onReset={resetToHome}>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

        <View style={styles.body}>
          {activeWorkout ? (
            <WorkoutScreen
              key={activeWorkout.id || 'active-workout'}
              workout={activeWorkout}
              onFinish={handleFinishWorkout}
              onCancel={() => {
                setActiveWorkout(null);
                setRestSeconds(null);
              }}
              onStartRest={startRest}
            />
          ) : (
            <>
              {activeTab === 'treinos' && (
                <HomeScreen
                  workouts={appData?.workouts || INITIAL_DATA.workouts}
                  history={appData?.history || []}
                  onStartWorkout={(w) => {
                    if (w && typeof w === 'object') {
                      setActiveWorkout(w);
                    }
                  }}
                  onOpenNewWorkout={() => {
                    setAutoOpenNewSheet(true);
                    setActiveTab('fichas');
                  }}
                />
              )}
              {activeTab === 'evolucao' && (
                <EvolutionScreen
                  history={appData?.history || []}
                  onDeleteSession={handleDeleteSession}
                  onClearMonthHistory={handleClearMonthHistory}
                />
              )}
              {activeTab === 'fichas' && (
                <SheetsScreen
                  appData={appData}
                  onUpdateWorkouts={(workouts) => persist({ ...appData, workouts })}
                  onImportAllData={(imported) => persist(imported)}
                  autoOpenNew={autoOpenNewSheet}
                  onConsumeAutoOpen={() => setAutoOpenNewSheet(false)}
                />
              )}
              {activeTab === 'corpo' && (
                <BodyScreen
                  profile={appData?.bodyProfile || INITIAL_DATA.bodyProfile}
                  history={appData?.bodyHistory || []}
                  onSaveMonthlyRecord={handleSaveBodyMonth}
                  onDeleteRecord={handleDeleteBodyRecord}
                  onClearHistory={handleClearBodyHistory}
                />
              )}
            </>
          )}
        </View>

        {restSeconds !== null && typeof RestBar === 'function' && (
          <RestBar
            secondsLeft={restSeconds}
            totalSeconds={restTotal}
            onAddTime={(extra) => {
              setRestSeconds((prev) => (prev || 0) + extra);
              setRestTotal((prev) => prev + extra);
            }}
            onDismiss={() => setRestSeconds(null)}
            onTick={() =>
              setRestSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : 0))
            }
          />
        )}

        {!activeWorkout && (
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => setActiveTab('treinos')}
            >
              <ZapIcon
                size={20}
                color={activeTab === 'treinos' ? COLORS.orange : COLORS.textMuted}
              />
              <Text style={[styles.tabText, activeTab === 'treinos' && styles.tabTextActive]}>
                Treinos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => setActiveTab('evolucao')}
            >
              <ChartIcon
                size={20}
                color={activeTab === 'evolucao' ? COLORS.orange : COLORS.textMuted}
              />
              <Text style={[styles.tabText, activeTab === 'evolucao' && styles.tabTextActive]}>
                Evolução
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => setActiveTab('fichas')}
            >
              <FileIcon
                size={20}
                color={activeTab === 'fichas' ? COLORS.orange : COLORS.textMuted}
              />
              <Text style={[styles.tabText, activeTab === 'fichas' && styles.tabTextActive]}>
                Fichas
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => setActiveTab('corpo')}
            >
              <UserIcon
                size={20}
                color={activeTab === 'corpo' ? COLORS.orange : COLORS.textMuted}
              />
              <Text style={[styles.tabText, activeTab === 'corpo' && styles.tabTextActive]}>
                Corpo
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  body: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 8,
  },
  tabItem: { flex: 1, alignItems: 'center', gap: 3 },
  tabText: { color: COLORS.textMuted, fontSize: 11, fontWeight: '600' },
  tabTextActive: { color: COLORS.orange, fontWeight: '800' },
  errBox: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errTitle: {
    color: COLORS.orange,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  errMsg: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
  errBtn: {
    backgroundColor: COLORS.orange,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
  },
  errBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },
});
