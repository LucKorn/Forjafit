import { Vibration } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

export const triggerRestFinishedFeedback = async () => {
  try {
    Vibration.vibrate([0, 600, 200, 600, 200, 800]);
  } catch (e) {}

  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (e) {}

  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
    const sampleRate = 8000;
    const durationSec = 0.35;
    const numSamples = Math.floor(sampleRate * durationSec);
    const freq = 880;
    const headerSize = 44;
    const totalSize = headerSize + numSamples;
    const bytes = new Uint8Array(totalSize);
    const writeStr = (offset, str) => {
      for (let i = 0; i < str.length; i++) bytes[offset + i] = str.charCodeAt(i);
    };
    const writeU32 = (offset, val) => {
      bytes[offset] = val & 0xff;
      bytes[offset + 1] = (val >> 8) & 0xff;
      bytes[offset + 2] = (val >> 16) & 0xff;
      bytes[offset + 3] = (val >> 24) & 0xff;
    };
    const writeU16 = (offset, val) => {
      bytes[offset] = val & 0xff;
      bytes[offset + 1] = (val >> 8) & 0xff;
    };
    writeStr(0, 'RIFF');
    writeU32(4, totalSize - 8);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    writeU32(16, 16);
    writeU16(20, 1);
    writeU16(22, 1);
    writeU32(24, sampleRate);
    writeU32(28, sampleRate);
    writeU16(32, 1);
    writeU16(34, 8);
    writeStr(36, 'data');
    writeU32(40, numSamples);
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const env = Math.min(1, i / 200) * Math.min(1, (numSamples - i) / 400);
      const val = 128 + Math.round(110 * env * Math.sin(2 * Math.PI * freq * t));
      bytes[headerSize + i] = val;
    }
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let b64 = '';
    for (let i = 0; i < bytes.length; i += 3) {
      const b1 = bytes[i];
      const b2 = i + 1 < bytes.length ? bytes[i + 1] : 0;
      const b3 = i + 2 < bytes.length ? bytes[i + 2] : 0;
      b64 += chars[b1 >> 2];
      b64 += chars[((b1 & 3) << 4) | (b2 >> 4)];
      b64 += i + 1 < bytes.length ? chars[((b2 & 15) << 2) | (b3 >> 6)] : '=';
      b64 += i + 2 < bytes.length ? chars[b3 & 63] : '=';
    }
    const { sound } = await Audio.Sound.createAsync(
      { uri: 'data:audio/wav;base64,' + b64 },
      { shouldPlay: true, volume: 1.0 }
    );
    setTimeout(() => {
      sound.unloadAsync().catch(() => {});
    }, 1500);
  } catch (e) {}
};

export const triggerLightTap = async () => {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (e) {
    try {
      Vibration.vibrate(40);
    } catch (_) {}
  }
};
