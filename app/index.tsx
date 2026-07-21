import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { DICT } from '../lib/useDict';
import { searchWithPos, Dir, Entry } from '../lib/dict';
import { getHistory, addHistory, clearHistory } from '../lib/store';

const GOLD = '#a07828';
const RED = '#c0392b';

const POS_LIST = ['全て', '名詞', '動詞', '形容詞', '副詞', 'フレーズ', '接続詞', '後置詞', '代名詞'];

export default function Index() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [dir, setDir] = useState<Dir>('hy2ja');
  const [pos, setPos] = useState<string>('全て');
  const [history, setHistory] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      getHistory().then((h) => { if (alive) setHistory(h); });
      return () => { alive = false; };
    }, [])
  );

  function openEntry(item: Entry) {
    addHistory(q).then(() => getHistory().then(setHistory));
    router.push(`/entry/${item.id}`);
  }

  const results = useMemo<Entry[]>(() => {
    const posArg = pos === '全て' ? null : pos;
    if (!q.trim()) {
      // 検索語なし: 品詞が選ばれていればその品詞の全語を字母順で表示
      if (!posArg) return [];
      return DICT.entries
        .filter((e) => e.pos === posArg)
        .sort((a, b) => a.narm.localeCompare(b.narm));
    }
    return searchWithPos(DICT, q, posArg, dir, 80);
  }, [q, dir, pos]);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* 方向トグル */}
        <View style={styles.dirRow}>
          <Pressable
            style={[styles.dirBtn, dir === 'hy2ja' && styles.dirBtnOn]}
            onPress={() => setDir('hy2ja')}
          >
            <Text style={[styles.dirTxt, dir === 'hy2ja' && styles.dirTxtOn]}>
              アルメニア語 → 日本語
            </Text>
          </Pressable>
          <Pressable
            style={[styles.dirBtn, dir === 'ja2hy' && styles.dirBtnOn]}
            onPress={() => setDir('ja2hy')}
          >
            <Text style={[styles.dirTxt, dir === 'ja2hy' && styles.dirTxtOn]}>
              日本語 → アルメニア語
            </Text>
          </Pressable>
        </View>

        {/* 文字ブラウズ・お気に入りへの入口 */}
        <View style={styles.linkRow}>
          <Pressable style={[styles.lettersLink, { flex: 2 }]} onPress={() => router.push('/letters')}>
            <Text style={styles.lettersLinkTxt}>Ա　文字から探す（発音つき）</Text>
          </Pressable>
          <Pressable style={[styles.lettersLink, { flex: 1 }]} onPress={() => router.push('/favorites')}>
            <Text style={styles.lettersLinkTxt}>★ お気に入り</Text>
          </Pressable>
        </View>

        {/* 検索バー */}
        <View style={styles.searchWrap}>
          <TextInput
            style={styles.input}
            value={q}
            onChangeText={setQ}
            placeholder={dir === 'hy2ja' ? 'մայր / mayr' : '母 / はは'}
            placeholderTextColor="#b0a488"
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
        </View>

        {/* 品詞フィルタ */}
        <FlatList
          horizontal
          data={POS_LIST}
          keyExtractor={(x) => x}
          showsHorizontalScrollIndicator={false}
          style={styles.posBar}
          contentContainerStyle={{ paddingHorizontal: 12, gap: 8, alignItems: 'center', paddingVertical: 4 }}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.posChip, pos === item && styles.posChipOn]}
              onPress={() => setPos(item)}
            >
              <Text style={[styles.posChipTxt, pos === item && styles.posChipTxtOn]}>
                {item}
              </Text>
            </Pressable>
          )}
        />

        {/* 結果件数 */}
        {(q.trim() !== '' || pos !== '全て') && (
          <Text style={styles.count}>
            {pos !== '全て' && q.trim() === '' ? `${pos} 全 ${results.length} 語（字母順）` : `${results.length} 件`}
          </Text>
        )}

        {/* 結果リスト */}
        <FlatList
          data={results}
          keyExtractor={(e) => e.id}
          initialNumToRender={20}
          maxToRenderPerBatch={30}
          windowSize={10}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 24 }}
          ListEmptyComponent={
            q.trim() === '' ? (
              <View>
                <Text style={styles.empty}>
                  検索語を入力してください。{'\n'}
                  アルメニア文字・ラテン転写・日本語・かなで引けます。
                </Text>
                {history.length > 0 && (
                  <View style={styles.histWrap}>
                    <View style={styles.histHead}>
                      <Text style={styles.histTitle}>最近の検索</Text>
                      <Pressable onPress={() => clearHistory().then(() => setHistory([]))}>
                        <Text style={styles.histClear}>消去</Text>
                      </Pressable>
                    </View>
                    <View style={styles.histChips}>
                      {history.map((h) => (
                        <Pressable key={h} style={styles.histChip} onPress={() => setQ(h)}>
                          <Text style={styles.histChipTxt}>{h}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            ) : (
              <Text style={styles.empty}>見つかりませんでした。</Text>
            )
          }
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => openEntry(item)}>
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fdfcf9' },
  dirRow: { flexDirection: 'row', padding: 12, gap: 8 },
  dirBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(160,120,40,0.4)',
    alignItems: 'center',
  },
  dirBtnOn: { backgroundColor: GOLD, borderColor: GOLD },
  dirTxt: { color: GOLD, fontSize: 13, fontWeight: '600' },
  dirTxtOn: { color: '#fff' },
  searchWrap: { paddingHorizontal: 12 },
  lettersLink: {
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(160,120,40,0.4)',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  lettersLinkTxt: { color: GOLD, fontSize: 13, fontWeight: '600' },
  linkRow: { flexDirection: 'row', gap: 8, marginHorizontal: 12, marginBottom: 10 },
  histWrap: { marginTop: 28, paddingHorizontal: 20 },
  histHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  histTitle: { fontSize: 13, color: '#8a7a5c', fontWeight: '600' },
  histClear: { fontSize: 12, color: RED },
  histChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  histChip: {
    borderWidth: 1, borderColor: 'rgba(160,120,40,0.35)', borderRadius: 16,
    paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#fff',
  },
  histChipTxt: { color: '#5a4d38', fontSize: 13 },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(160,120,40,0.3)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    color: '#3a2f1f',
    backgroundColor: '#fff',
  },
  posBar: { marginTop: 10, minHeight: 44, maxHeight: 48, flexGrow: 0 },
  posChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(160,120,40,0.4)',
  },
  posChipOn: { backgroundColor: RED, borderColor: RED },
  posChipTxt: { color: '#8a7a5c', fontSize: 13 },
  posChipTxtOn: { color: '#fff' },
  count: { paddingHorizontal: 16, paddingVertical: 6, color: '#8a7a5c', fontSize: 12 },
  empty: { textAlign: 'center', color: '#8a7a5c', marginTop: 40, lineHeight: 22 },
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
    fontSize: 11,
    color: '#fff',
    backgroundColor: GOLD,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  pos: {
    fontSize: 11,
    color: GOLD,
    borderWidth: 1,
    borderColor: 'rgba(160,120,40,0.4)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
});
