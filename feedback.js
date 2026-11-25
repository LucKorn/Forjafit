import { Vibration } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

function createToneBase64(frequencies, durationMs = 180) {
  const sampleRate = 22050;
  const samplesPerTone = Math.floor((sampleRate * durationMs) / 1000);
  const totalSamples = samplesPerTone * frequencies.length;
  const dataSize = totalSamples * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  frequencies.forEach((freq) => {
    for (let i = 0; i < samplesPerTone; i++) {
      const t = i / sampleRate;
      const env = Math.min(1, i / 300) * Math.min(1, (samplesPerTone - i) / 600);
      const sample = freq > 0 ? Math.sin(2 * Math.PI * freq * t) * 0.65 * env : 0;
      view.setInt16(offset, sample * 32767, true);
      offset += 2;
    }
  });

  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return 'data:audio/wav;base64,' + btoa(binary);
}

async function playFrequencies(freqs, durationMs = 170) {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    });
    const uri = createToneBase64(freqs, durationMs);
    const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch (e) {}
}

export async function triggerShortBeep() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  await playFrequencies([660], 110);
}

export async function triggerTimerDone() {
  Vibration.vibrate([0, 250, 120, 250]);
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  await playFrequencies([880, 0, 1046.5], 160);
}

export async function triggerWorkoutFinished() {
  Vibration.vibrate([0, 300, 120, 300, 120, 500]);
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  await playFrequencies([523.25, 659.25, 783.99, 1046.5], 180);
}
