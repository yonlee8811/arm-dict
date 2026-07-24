import { useEffect, useState } from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { WORD_AUDIO, hasAudio } from '../lib/wordAudio';

const GOLD = '#a07828';

type Props = {
  /** 辞書エントリの id（音声ファイル名と同一） */
  id: string;
  /** 小さめ表示にする（一覧の行内など） */
  compact?: boolean;
};

/**
 * 単語の発音を再生するボタン。
 * 未録音の語では何も描画しない（null を返す）。
 */
export default function WordAudioButton({ id, compact = false }: Props) {
  const available = hasAudio(id);
  const player = useAudioPlayer(available ? WORD_AUDIO[id] : null);
  const status = useAudioPlayerStatus(player);
  const [failed, setFailed] = useState(false);

  // マナーモードでも再生されるようにする（iOS）
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  // id が変わったら差し替える
  useEffect(() => {
    if (!available) return;
    try {
      player.replace(WORD_AUDIO[id]);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [id, available]);

  if (!available || failed) return null;

  const loading = !status.isLoaded;

  function play() {
    try {
      player.seekTo(0);
      player.play();
    } catch {
      setFailed(true);
    }
  }

  return (
    <Pressable
      onPress={play}
      hitSlop={8}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel="発音を再生"
      style={[styles.btn, compact && styles.btnCompact, loading && styles.btnDisabled]}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <>
          <Text style={[styles.icon, compact && styles.iconCompact]}>🔊</Text>
          {!compact && <Text style={styles.label}>発音</Text>}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: GOLD,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 76,
    minHeight: 36,
  },
  btnCompact: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 40,
    minHeight: 32,
    gap: 0,
  },
  btnDisabled: { opacity: 0.5 },
  icon: { fontSize: 16 },
  iconCompact: { fontSize: 15 },
  label: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
