import { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import { DICT } from '../lib/useDict';
import { byId, Entry } from '../lib/dict';
import { getFavorites } from '../lib/store';

const GOLD = '#a07828';

export default function FavoritesScreen() {
  const router = useRouter();
  const [items, setItems] = useState<Entry[]>([]);

  // 画面に戻ってくるたびに再読込（詳細画面で解除した変更を反映）
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      getFavorites().then((ids) => {
        if (!alive) return;
        const list = ids
          .map((id) => byId(DICT, id))
          .filter((e): e is Entry => !!e);
        setItems(list);
      });
      return () => {
        alive = false;
      };
    }, [])
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Stack.Screen options={{ title: 'お気に入り' }} />
      <FlatList
        data={items}
        keyExtractor={(e) => e.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            お気に入りはまだありません。{'\n'}
            単語の詳細画面で ★ をタップすると登録できます。
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => router.push(`/entry/${item.id}`)}>
            <View style={{ flex: 1 }}>
              <View style={styles.rowHead}>
                <Text style={styles.arm}>{item.arm}</Text>
                <Text style={styles.lat}>{item.lat}</Text>
              </View>
              <Text style={styles.jp}>{item.jp}</Text>
            </View>
            <View style={styles.badges}>
              {item.level ? <Text style={styles.level}>{item.level}</Text> : null}
              <Text style={styles.pos}>{item.pos}</Text>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fdfcf9' },
  empty: { textAlign: 'center', color: '#8a7a5c', marginTop: 48, lineHeight: 24, paddingHorizontal: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(160,120,40,0.1)',
  },
  rowHead: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  arm: { fontSize: 20, color: '#2a2118' },
  lat: { fontSize: 13, color: '#8a7a5c', fontStyle: 'italic' },
  jp: { fontSize: 15, color: '#5a4d38', marginTop: 2 },
  badges: { alignItems: 'flex-end', gap: 4 },
  level: {
    fontSize: 11, color: '#fff', backgroundColor: GOLD,
    paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, overflow: 'hidden',
  },
  pos: {
    fontSize: 11, color: GOLD, borderWidth: 1, borderColor: 'rgba(160,120,40,0.4)',
    paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4,
  },
});
