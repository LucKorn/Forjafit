import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Dumbbell, BarChart3, FolderKanban, User } from 'lucide-react-native';

import { COLORS } from './colors';
import { INITIAL_DATA } from './initialData';
import { loadAppData, saveAppData } from './storage';

import HomeScreen from './HomeScreen';
import WorkoutScreen from './WorkoutScreen';
import EvolutionScreen from './EvolutionScreen';
import SheetsScreen from './SheetsScreen';
import BodyScreen from './BodyScreen';

export default function App() {
  const [appData, setAppData] = useState(INITIAL_DATA);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('treinos');
  const [activeWorkoutId, setActiveWorkoutId] = useState(null);

  useEffect(() => {
    loadAppData().then((data) => {
      setAppData(data);
      setLoading(false);
    });
  }, []);

  const persist = (nextData) => {
    setAppData(nextData);
    saveAppData(nextData);
  };

  const handleCreateWorkout = (newWorkout) => {
    persist({
      ...appData,
      workouts: [...appData.workouts, newWorkout],
    });
  };

  const handleUpdateWorkout = (updatedWorkout) => {
    const workouts = appData.workouts.map((w) =>
      w.id === updatedWorkout.id ? updatedWorkout : w
    );
    persist({ ...appData, workouts });
  };

  const handleFinishWorkout = (finishedWorkout) => {
    let totalVolume = 0;
    let completedSetsCount = 0;

    const resetExercises = finishedWorkout.exercises.map((ex) => {
      const resetSets = ex.sets.map((s) => {
        if (s.done) {
          completedSetsCount += 1;
          if (ex.mode === 'reps') {
            totalVolume += (parseFloat(s.weight) || 0) * (parseInt(s.reps, 10) || 0);
          }
        }
        return { ...s, done: false };
      });

      const lastSet = ex.sets[ex.sets.length - 1];
      const updatedRecord =
        ex.mode === 'time'
          ? `${ex.sets.length}×${lastSet?.seconds || 45}s`
          : `${lastSet?.weight || 0}kg • ${ex.sets.length}×${lastSet?.reps || 10}`;

      return {
        ...ex,
        lastRecord: updatedRecord,
        sets: resetSets,
      };
    });

    const resetWorkout = { ...finishedWorkout, exercises: resetExercises };

    const remaining = appData.workouts.filter((w) => w.id !== finishedWorkout.id);
    const nextQueue = [...remaining, resetWorkout];

    const now = new Date();
    const monthKey = now.toISOString().slice(0, 7);
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const dateLabel = `${String(now.getDate()).padStart(2, '0')} ${months[now.getMonth()]}`;

    const newSession = {
      id: 'h_' + Date.now(),
      monthKey,
      dateLabel,
      workoutName: finishedWorkout.name,
      color: finishedWorkout.color || COLORS.orange,
      volumeKg: Math.round(totalVolume),
      durationMin: 40,
      summary:
        finishedWorkout.type === 'cardio'
          ? 'Cardio Intervalado concluído'
          : `${finishedWorkout.exercises.length} exercícios • ${completedSetsCount} séries feitas`,
    };

    persist({
      ...appData,
      workouts: nextQueue,
      history: [newSession, ...appData.history],
    });

    setActiveWorkoutId(null);
    setActiveTab('treinos');
  };

  const handleSaveBody = (updatedProfile, newEntry) => {
    persist({
      ...appData,
      bodyProfile: updatedProfile,
      bodyHistory: [newEntry, ...appData.bodyHistory],
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={COLORS.orange} />
      </View>
    );
  }

  const activeWorkout = appData.workouts.find((w) => w.id === activeWorkoutId);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <StatusBar style="light" backgroundColor={COLORS.bg} />

        {activeWorkout ? (
          <WorkoutScreen
            workout={activeWorkout}
            onBack={() => setActiveWorkoutId(null)}
            onUpdateWorkout={handleUpdateWorkout}
            onFinishWorkout={handleFinishWorkout}
          />
        ) : (
          <>
            <View style={{ flex: 1 }}>
              {activeTab === 'treinos' && (
                <HomeScreen
                  workouts={appData.workouts}
                  onSelectWorkout={(id) => setActiveWorkoutId(id)}
                  onCreateWorkout={handleCreateWorkout}
                />
              )}
              {activeTab === 'evolucao' && <EvolutionScreen history={appData.history} />}
              {activeTab === 'fichas' && (
                <SheetsScreen
                  appData={appData}
                  onUpdateWorkouts={(workouts) => persist({ ...appData, workouts })}
                  onRestoreBackup={(restored) => persist(restored)}
                />
              )}
              {activeTab === 'corpo' && (
                <BodyScreen
                  profile={appData.bodyProfile}
                  history={appData.bodyHistory}
                  onSaveRecord={handleSaveBody}
                />
              )}
            </View>

            <View style={styles.tabBar}>
              <TouchableOpacity
                style={styles.tabItem}
                onPress={() => setActiveTab('treinos')}
              >
                <Dumbbell
                  size={21}
                  color={activeTab === 'treinos' ? COLORS.orange : COLORS.textDim}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    activeTab === 'treinos' && { color: COLORS.orange },
                  ]}
                >
                  Treinos
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.tabItem}
                onPress={() => setActiveTab('evolucao')}
              >
                <BarChart3
                  size={21}
                  color={activeTab === 'evolucao' ? COLORS.orange : COLORS.textDim}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    activeTab === 'evolucao' && { color: COLORS.orange },
                  ]}
                >
                  Evolução
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.tabItem}
                onPress={() => setActiveTab('fichas')}
              >
                <FolderKanban
                  size={21}
                  color={activeTab === 'fichas' ? COLORS.orange : COLORS.textDim}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    activeTab === 'fichas' && { color: COLORS.orange },
                  ]}
                >
                  Fichas
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.tabItem}
                onPress={() => setActiveTab('corpo')}
              >
                <User
                  size={21}
                  color={activeTab === 'corpo' ? COLORS.orange : COLORS.textDim}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    activeTab === 'corpo' && { color: COLORS.orange },
                  ]}
                >
                  Corpo
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  loadingScreen: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textDim,
  },
});
