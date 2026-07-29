import { useAudioPlayer } from 'expo-audio';
import { Pressable, StyleSheet, Text } from 'react-native';

const GOLD = '#a07828';

/**
 * 異形の発音を鳴らすボタン。
 *
 * 見出し語の発音は WordAudioButton が id から引くが、異形の音声は
 * 見出し語の id と 1 対 1 にならないため、require() の結果を直接受け取る。
 */
export default function VariantAudioButton({ source }: { source: number }) {
  const player = useAudioPlayer(source);

  function play() {
    try {
      player.seekTo(0);
      player.play();
    } catch (e) {
      // 音声が読み込めなくても画面は機能させる
    }
  }

  return (
    <Pressable
      onPress={play}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel="この言い方の発音を再生"
      style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
    >
      <Text style={styles.icon}>🔊</Text>
      <Text style={styles.txt}>発音</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: GOLD,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexShrink: 0,
    marginLeft: 10,
  },
  pressed: { opacity: 0.6 },
  icon: { fontSize: 14 },
  txt: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
