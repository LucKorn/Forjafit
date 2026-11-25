import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, SafeAreaView } from 'react-native';
import { Dumbbell, BarChart2, FolderOpen, User } from 'lucide-react-native';
import { COLORS } from './colors';
import { INITIAL_DATA } from './initialData';
import { loadAppData, saveAppData } from './storage';
import HomeScreen from './HomeScreen';
import WorkoutScreen from './WorkoutScreen';
import EvolutionScreen from './EvolutionScreen';
import SheetsScreen from './SheetsScreen';
import BodyScreen from './BodyScreen';
import RestBar from './RestBar';

export default function App() {
  const [appData, setAppData] = useState(INITIAL_DATA);
  const [activeTab, setActiveTab] = useState('treinos');
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [restSeconds, setRestSeconds] = useState(null);
  const [restTotal, setRestTotal] = useState(60);

  useEffect(() => {
    loadAppData().then((loaded) => setAppData(loaded));
  }, []);

  const persist = (nextData) => {
    setAppData(nextData);
    saveAppData(nextData);
  };

  const handleFinishWorkout = (sessionRecord) => {
    persist({
      ...appData,
      history: [sessionRecord, ...appData.history],
    });
    setActiveWorkout(null);
    setRestSeconds(null);
    setActiveTab('evolucao');
  };

  const handleDeleteSession = (sessionId) => {
    persist({
      ...appData,
      history: appData.history.filter((item) => item.id !== sessionId),
    });
  };

  const handleClearMonthHistory = (month, year) => {
    persist({
      ...appData,
      history: appData.history.filter((item) => {
        const d = new Date(item.timestamp);
        return !(d.getMonth() === month && d.getFullYear() === year);
      }),
    });
  };

  const handleSaveBody = (record) => {
    persist({
      ...appData,
      bodyHistory: [record, ...appData.bodyHistory],
    });
  };

  const handleDeleteBodyRecord = (entryId) => {
    persist({
      ...appData,
      bodyHistory: appData.bodyHistory.filter((item) => item.id !== entryId),
    });
  };

  const handleClearBodyHistory = () => {
    persist({
      ...appData,
      bodyHistory: [],
    });
  };

  const startRest = (sec) => {
    setRestTotal(sec);
    setRestSeconds(sec);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <View style={styles.body}>
        {activeWorkout ? (
          <WorkoutScreen
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
                workouts={appData.workouts}
                history={appData.history}
                onStartWorkout={(w) => setActiveWorkout(w)}
              />
            )}
            {activeTab === 'evolucao' && (
              <EvolutionScreen
                history={appData.history}
                onDeleteSession={handleDeleteSession}
                onClearMonthHistory={handleClearMonthHistory}
              />
            )}
            {activeTab === 'fichas' && (
              <SheetsScreen
                appData={appData}
                onUpdateWorkouts={(workouts) => persist({ ...appData, workouts })}
                onImportAllData={(imported) => persist(imported)}
              />
            )}
            {activeTab === 'corpo' && (
              <BodyScreen
                profile={appData.bodyProfile}
                history={appData.bodyHistory}
                onSaveRecord={handleSaveBody}
                onDeleteRecord={handleDeleteBodyRecord}
                onClearBodyHistory={handleClearBodyHistory}
              />
            )}
          </>
        )}
      </View>

      {restSeconds !== null && (
        <RestBar
          secondsLeft={restSeconds}
          totalSeconds={restTotal}
          onAddTime={(extra) => {
            setRestSeconds((prev) => (prev || 0) + extra);
            setRestTotal((prev) => prev + extra);
          }}
          onDismiss={() => setRestSeconds(null)}
          onTick={() => setRestSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : 0))}
        />
      )}

      {!activeWorkout && (
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('treinos')}
          >
            <Dumbbell
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
            <BarChart2
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
            <FolderOpen
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
            <User
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
});
                                      
