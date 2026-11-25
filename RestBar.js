import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Timer } from 'lucide-react-native';
import { COLORS } from './colors';
import { triggerTimerDone } from './feedback';

export default function RestBar({ initialSeconds, triggerId, onDismiss }) {
  const [total, setTotal] = useState(initialSeconds || 60);
  const [remaining, setRemaining] = useState(initialSeconds || 60);

  useEffect(() => {
    if (!triggerId) return;
    setTotal(initialSeconds || 60);
    setRemaining(initialSeconds || 60);
  }, [triggerId, initialSeconds]);

  useEffect(() => {
    if (!triggerId) return;
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          triggerTimerDone();
          onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [triggerId]);

  if (!triggerId) return null;

  const adjust = (delta) => {
    setRemaining((prev) => {
      const next = Math.max(5, prev + delta);
      if (next > total) setTotal(next);
      return next;
    });
  };

  const mins = String(Math.floor(remaining / 60)).padStart(2, '0');
  const secs = String(remaining % 60).padStart(2, '0');
  const pct = Math.max(0, Math.min(100, (remaining / Math.max(1, total)) * 100));

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <View style={styles.topRow}>
          <View style={styles.leftInfo}>
            <View style={styles.iconBox}>
              <Timer size={18} color={COLORS.orange} />
            </View>
            <View>
              <Text style={styles.label}>DESCANSO</Text>
              <Text style={styles.clock}>
                {mins}:{secs}
              </Text>
            </View>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity style={styles.adjBtn} onPress={() => adjust(-15)}>
              <Text style={styles.adjText}>-15s</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.adjBtn} onPress={() => adjust(15)}>
              <Text style={styles.adjText}>+15s</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.skipBtn} onPress={onDismiss}>
              <Text style={styles.skipText}>Pular</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${pct}%` }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    zIndex: 50,
  },
  container: {
    backgroundColor: '#16161a',
    borderWidth: 1.5,
    borderColor: COLORS.orange,
    borderRadius: 18,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.orangeBg,
    borderWidth: 1,
    borderColor: COLORS.orangeBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.orange,
    letterSpacing: 0.8,
  },
  clock: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  adjBtn: {
    backgroundColor: COLORS.cardElevated,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 10,
  },
  adjText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
  },
  skipBtn: {
    backgroundColor: COLORS.orangeBg,
    borderWidth: 1,
    borderColor: COLORS.orangeBorder,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  skipText: {
    color: COLORS.orange,
    fontSize: 12,
    fontWeight: '800',
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#27272a',
    borderRadius: 99,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.orange,
  },
});
