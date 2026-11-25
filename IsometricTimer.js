import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Play, Square, Check } from 'lucide-react-native';
import { COLORS } from './colors';
import { triggerShortBeep, triggerTimerDone } from './feedback';

export default function IsometricTimer({ targetSeconds, done, onComplete }) {
  const target = parseInt(targetSeconds, 10) || 45;
  const [phase, setPhase] = useState('idle');
  const [timeLeft, setTimeLeft] = useState(target);

  useEffect(() => {
    if (phase === 'idle') setTimeLeft(target);
  }, [target, phase]);

  useEffect(() => {
    if (phase === 'idle') return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (phase === 'prep') {
            triggerShortBeep();
            setPhase('running');
            return target;
          } else {
            clearInterval(interval);
            setPhase('idle');
            triggerTimerDone();
            onComplete();
            return target;
          }
        }
        if (phase === 'prep') {
          triggerShortBeep();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, target]);

  const handlePress = () => {
    if (done) {
      onComplete();
      return;
    }
    if (phase === 'idle') {
      triggerShortBeep();
      setPhase('prep');
      setTimeLeft(3);
    } else {
      setPhase('idle');
      setTimeLeft(target);
    }
  };

  if (done) {
    return (
      <TouchableOpacity style={[styles.btn, styles.btnDone]} onPress={handlePress}>
        <Check size={15} color={COLORS.green} />
        <Text style={[styles.btnText, { color: COLORS.green }]}>Concluído ({target}s)</Text>
      </TouchableOpacity>
    );
  }

  if (phase === 'prep') {
    return (
      <TouchableOpacity style={[styles.btn, styles.btnPrep]} onPress={handlePress}>
        <Square size={13} color="#fbbf24" />
        <Text style={[styles.btnText, { color: '#fbbf24' }]}>Prepare-se: {timeLeft}s</Text>
      </TouchableOpacity>
    );
  }

  if (phase === 'running') {
    const pct = Math.max(0, Math.min(100, ((target - timeLeft) / target) * 100));
    return (
      <TouchableOpacity style={[styles.btn, styles.btnRunning]} onPress={handlePress}>
        <View style={[styles.fillOverlay, { width: `${pct}%` }]} />
        <Square size={13} color={COLORS.orange} />
        <Text style={[styles.btnText, { color: COLORS.text }]}>Segurando: {timeLeft}s</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.btn} onPress={handlePress}>
      <Play size={14} color={COLORS.orange} fill={COLORS.orange} />
      <Text style={styles.btnText}>Iniciar {target}s</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flex: 1,
    height: 40,
    backgroundColor: COLORS.orangeBg,
    borderWidth: 1,
    borderColor: COLORS.orangeBorder,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  btnRunning: {
    backgroundColor: '#1c1917',
    borderColor: COLORS.orange,
  },
  btnPrep: {
    backgroundColor: 'rgba(251, 191, 36, 0.14)',
    borderColor: 'rgba(251, 191, 36, 0.45)',
  },
  btnDone: {
    backgroundColor: COLORS.greenBg,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  fillOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(249, 115, 22, 0.28)',
  },
  btnText: {
    color: COLORS.orange,
    fontSize: 13,
    fontWeight: '800',
  },
});
