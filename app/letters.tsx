import { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { useAudioPlayer } from 'expo-audio';
import { DICT } from '../lib/useDict';
import { Entry } from '../lib/dict';
import { LETTERS, Letter, matchesLetter } from '../lib/alphabet';
import { ALPHABET_AUDIO } from '../lib/alphabetAudio';

const GOLD = '#a07828';
const RED = '#c0392b';

export default function LettersScreen() {
  const router = useRouter();
  const [sel, setSel] = useState<Letter | null>(null);
  const player = useAudioPlayer(null);

  const words = useMemo<Entry[]>(() => {
    if (!sel) return [];
    return DICT.entries
      .filter((e) => matchesLetter(e.narm, sel))
      .sort((a, b) => a.narm.localeCompare(b.narm));
  }, [sel]);

  function pick(letter: Letter) {
    setSel(letter);
    try {
      player.replace(ALPHABET_AUDIO[letter.num]);
      player.seekTo(0);
      player.play();
    } catch (e) {
      // 音声が読み込めなくても画面は機能させる
    }
  }

  function replay() {
    if (!sel) return;
    try {
      player.seekTo(0);
      player.play();
    } catch (e) {}
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Stack.Screen options={{ title: 'アルメニア文字' }} />

      {/* 文字グリッド */}
      <View style={styles.gridWrap}>
        <FlatList
          data={LETTERS}
          keyExtractor={(l) => String(l.num)}
          numColumns={8}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.cell, sel?.num === item.num && styles.cellOn]}
              onPress={() => pick(item)}
            >
              <Text style={[styles.cellTxt, sel?.num === item.num && styles.cellTxtOn]}>
                {item.up}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {sel ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
          {/* 文字の詳細 */}
          <View style={styles.detail}>
            <View style={styles.detailHead}>
              <Text style={styles.bigLetter}>
                {sel.up}
                {sel.low !== sel.up ? ' ' + sel.low : ''}
              </Text>
              <Pressable style={styles.playBtn} onPress={replay}>
                <Text style={styles.playIcon}>🔊</Text>
                <Text style={styles.playTxt}>発音</Text>
              </Pressable>
            </View>
            <Text style={styles.lname}>{sel.name}</Text>
            <Text style={styles.translit}>転写: {sel.translit}</Text>
            <Text style={styles.desc}>{sel.desc}</Text>
            <Text style={styles.example}>
              例: {sel.example}　{sel.exampleNote}
            </Text>
          </View>

          {/* この文字で始まる語 */}
          <Text style={styles.count}>
            {sel.up} で始まる語: {words.length} 件
          </Text>
          {words.map((item) => (
            <Pressable
              key={item.id}
              style={styles.row}
              onPress={() => router.push(`/entry/${item.id}`)}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
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
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.hint}>
          文字をタップすると、ネイティブ話者の発音と{'\n'}その文字で始まる単語の一覧が表示されます。
        </Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fdfcf9' },
  gridWrap: { paddingHorizontal: 8, paddingTop: 10 },
  cell: {
    flex: 1,
    aspectRatio: 1,
    margin: 2,
    borderWidth: 1,
    borderColor: 'rgba(160,120,40,0.35)',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  cellOn: { backgroundColor: GOLD, borderColor: GOLD },
  cellTxt: { fontSize: 17, color: '#3a2f1f' },
  cellTxtOn: { color: '#fff', fontWeight: '600' },
  hint: { textAlign: 'center', color: '#8a7a5c', marginTop: 36, lineHeight: 24, paddingHorizontal: 24 },
  detail: {
    margin: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(160,120,40,0.25)',
  },
  detailHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bigLetter: { fontSize: 44, color: '#2a2118' },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: GOLD,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  playIcon: { fontSize: 16 },
  playTxt: { color: '#fff', fontSize: 13, fontWeight: '600' },
  lname: { fontSize: 15, color: RED, marginTop: 6, fontWeight: '600' },
  translit: { fontSize: 13, color: '#8a7a5c', marginTop: 2, fontStyle: 'italic' },
  desc: { fontSize: 14, color: '#3a2f1f', marginTop: 10, lineHeight: 22 },
  example: { fontSize: 14, color: '#5a4d38', marginTop: 8 },
  count: { paddingHorizontal: 16, paddingVertical: 8, color: '#8a7a5c', fontSize: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(160,120,40,0.1)',
    backgroundColor: '#fdfcf9',
  },
  rowHead: { flexDirection: 'row', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' },
  arm: { fontSize: 19, color: '#2a2118', flexShrink: 1 },
  lat: { fontSize: 12, color: '#8a7a5c', fontStyle: 'italic', flexShrink: 1 },
  jp: { fontSize: 14, color: '#5a4d38', marginTop: 2 },
  badges: { alignItems: 'flex-end', gap: 4, flexShrink: 0, marginLeft: 10 },
  level: {
    fontSize: 11, color: '#fff', backgroundColor: GOLD,
    paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, overflow: 'hidden',
  },
  pos: {
    fontSize: 11, color: GOLD, borderWidth: 1, borderColor: 'rgba(160,120,40,0.4)',
    paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4,
  },
});
