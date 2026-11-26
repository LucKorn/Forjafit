import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Timer, Plus, X, CheckCircle2 } from 'lucide-react-native';
import { COLORS } from './colors';
import { triggerRestFinishedFeedback, triggerLightTap } from './feedback';

export default function RestBar({ secondsLeft, totalSeconds, onAddTime, onDismiss, onTick }) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (secondsLeft > 0) {
      firedRef.current = false;
      const timer = setInterval(() => {
        if (onTick) onTick();
      }, 1000);
      return () => clearInterval(timer);
    } else if (secondsLeft === 0 && !firedRef.current) {
      firedRef.current = true;
      triggerRestFinishedFeedback();
    }
  }, [secondsLeft, onTick]);

  const safeSec = Math.max(0, Number(secondsLeft) || 0);
  const mins = Math.floor(safeSec / 60);
  const secs = safeSec % 60;
  const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const progress = totalSeconds > 0 ? Math.max(0, Math.min(1, safeSec / totalSeconds)) : 0;
  const isDone = safeSec === 0;

  return (
    <View style={[styles.container, isDone && styles.containerDone]}>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${progress * 100}%`,
              backgroundColor: isDone ? '#22c55e' : '#ff7a1a',
            },
          ]}
        />
      </View>

      <View style={styles.row}>
        <View style={styles.left}>
          <View style={[styles.iconBadge, isDone && styles.iconBadgeDone]}>
            {isDone ? (
              <CheckCircle2 size={22} color="#ffffff" />
            ) : (
              <Timer size={22} color="#ffffff" />
            )}
          </View>

          <View>
            <Text style={[styles.label, isDone && styles.labelDone]}>
              {isDone ? 'DESCANSO CONCLUÍDO!' : 'DESCANSO EM ANDAMENTO'}
            </Text>
            <Text style={[styles.time, isDone && styles.timeDone]}>{formatted}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.addBtn}
            activeOpacity={0.8}
            onPress={() => {
              triggerLightTap();
              if (onAddTime) onAddTime(15);
            }}
          >
            <Plus size={15} color="#ffffff" />
            <Text style={styles.addBtnText}>15s</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.closeBtn}
            activeOpacity={0.8}
            onPress={() => {
              triggerLightTap();
              if (onDismiss) onDismiss();
            }}
          >
            <X size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1d1d22',
    borderTopWidth: 2,
    borderTopColor: '#ff7a1a',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
  },
  containerDone: {
    borderTopColor: '#22c55e',
    backgroundColor: '#0e291d',
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#32323a',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#ea580c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadgeDone: {
    backgroundColor: '#16a34a',
  },
  label: {
    color: '#fdba74',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  labelDone: {
    color: '#86efac',
  },
  time: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  timeDone: {
    color: '#ffffff',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2c2c34',
    borderWidth: 1.5,
    borderColor: '#52525b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#3a1818',
    borderWidth: 1.5,
    borderColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
    
