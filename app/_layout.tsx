import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, View } from 'react-native';

const GOLD = '#a07828';

/* ------------------------------------------------------------------ */
/* ヘッダー右上の「このアプリについて」ボタン                           */
/*                                                                     */
/* iOS 26 はナビゲーションバーのボタンに 44pt の円形ガラス背景を        */
/* 自動で描く。画面に見える外側の円は OS が描いたもので、               */
/* こちらの View はその内側に入る二重構造になっている。                  */
/*                                                                     */
/* 実測で、こちらの 26pt リングの中心がシステムの円の中心より           */
/* 横に 5pt 左へずれていた（縦は一致）。transform で見た目だけを        */
/* 右へ動かして中心を合わせる。transform はレイアウトに影響しないため、  */
/* 動かしてもシステム側の円は動かない。margin や padding だと           */
/* こちらのフレームごと動き、ガラス円も追随するため解決しない。          */
/*                                                                     */
/* NUDGE_X は iOS のバージョンによって最適値が変わりうる実測値。         */
/* ------------------------------------------------------------------ */

const RING = 26;
const BAR = 2.5;
const NUDGE_X = 5;

function InfoButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="このアプリについて"
      style={({ pressed }) => [styles.hit, pressed && styles.hitPressed]}
    >
      <View style={styles.ring}>
        <View style={styles.dot} />
        <View style={styles.stem} />
      </View>
    </Pressable>
  );
}

export default function RootLayout() {
  const router = useRouter();

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: GOLD },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '600' },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: '東アルメニア語辞書',
            headerRight: () => <InfoButton onPress={() => router.push('/about')} />,
          }}
        />
        <Stack.Screen name="entry/[id]" options={{ title: '語の詳細' }} />
        <Stack.Screen name="letters" options={{ title: 'アルメニア文字' }} />
        <Stack.Screen name="grammar" options={{ title: '文法' }} />
        <Stack.Screen name="favorites" options={{ title: 'お気に入り' }} />
        <Stack.Screen name="about" options={{ title: 'このアプリについて' }} />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  hit: { alignItems: 'center', justifyContent: 'center' },
  hitPressed: { opacity: 0.6 },

  ring: {
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: NUDGE_X }],
  },

  dot: {
    width: BAR,
    height: BAR,
    borderRadius: BAR / 2,
    backgroundColor: '#fff',
    marginBottom: 2,
  },
  stem: {
    width: BAR,
    height: 8,
    borderRadius: BAR / 2,
    backgroundColor: '#fff',
  },
});
