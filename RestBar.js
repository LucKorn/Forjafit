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
              backgroundColor: isDone ? COLORS.green : COLORS.orange,
            },
          ]}
        />
      </View>
      <View style={styles.row}>
        <View style={styles.left}>
          {isDone ? (
            <CheckCircle2 size={20} color={COLORS.green} />
          ) : (
            <Timer size={20} color={COLORS.orange} />
          )}
          <View>
            <Text style={styles.label}>
              {isDone ? 'DESCANSO CONCLUÍDO!' : 'DESCANSO EM ANDAMENTO'}
            </Text>
            <Text style={[styles.time, isDone && { color: COLORS.green }]}>{formatted}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              triggerLightTap();
              if (onAddTime) onAddTime(15);
            }}
          >
            <Plus size={14} color={COLORS.text} />
            <Text style={styles.addBtnText}>15s</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => {
              triggerLightTap();
              if (onDismiss) onDismiss();
            }}
          >
            <X size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.cardElevated,
    borderTopWidth: 1,
    borderTopColor: COLORS.orangeBorder,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  containerDone: {
    borderTopColor: COLORS.green,
    backgroundColor: '#0c1f17',
  },
  progressTrack: {
    height: 3,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  time: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBtnText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
    
