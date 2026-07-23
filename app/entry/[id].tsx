import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { isFavorite, toggleFavorite } from '../../lib/store';
import { DICT } from '../../lib/useDict';
import { byId, Entry } from '../../lib/dict';

const GOLD = '#a07828';
const RED = '#c0392b';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function EntryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const e = useMemo<Entry | undefined>(() => byId(DICT, String(id)), [id]);
  const [fav, setFav] = useState(false);

  useEffect(() => {
    let alive = true;
    isFavorite(String(id)).then((v) => { if (alive) setFav(v); });
    return () => { alive = false; };
  }, [id]);

  async function onToggleFav() {
    const v = await toggleFavorite(String(id));
    setFav(v);
  }

  if (!e) {
    return (
      <View style={styles.center}>
        <Text>語が見つかりませんでした。</Text>
      </View>
    );
  }

  const relLabel = (t: string) => (t === 'ant' ? '対義' : '類義');

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Stack.Screen options={{ title: e.arm }} />

      {/* 見出し */}
      <View style={styles.head}>
        <View style={styles.headTop}>
          <Text style={styles.arm}>{e.arm}</Text>
          <Pressable onPress={onToggleFav} hitSlop={10} style={styles.favBtn}>
            <Text style={[styles.favStar, fav && styles.favStarOn]}>{fav ? '★' : '☆'}</Text>
          </Pressable>
        </View>
        <Text style={styles.lat}>{e.lat}</Text>
        <Text style={styles.jp}>{e.jp}</Text>
        <View style={styles.tags}>
          <Text style={styles.pos}>{e.pos}</Text>
          {e.level ? <Text style={styles.level}>{e.level}</Text> : null}
          {e.sec ? <Text style={styles.sec}>{e.sec}</Text> : null}
        </View>
      </View>

      {/* 動詞: 活用 */}
      {e.pos === '動詞' && (e.conj || e.pres) && (
        <Section title="活用">
          {e.conj ? <Text style={styles.body}>活用型: {e.conj}</Text> : null}
          {e.pres ? (
            <Text style={styles.body}>
              現在1人称単数: {e.pres.arm}（{e.pres.lat}）
            </Text>
          ) : null}
        </Section>
      )}

      {/* 後置詞: 支配格 */}
      {e.pos === '後置詞' && e.case ? (
        <Section title="支配する格">
          <Text style={styles.body}>{e.case}</Text>
        </Section>
      ) : null}

      {/* 例文 */}
      {e.ex.length > 0 && (
        <Section title="例文">
          {e.ex.map((x, i) => (
            <View key={i} style={styles.ex}>
              <Text style={styles.exArm}>{x.arm}</Text>
              <Text style={styles.exLat}>{x.lat}</Text>
              <Text style={styles.exJp}>{x.jp}</Text>
            </View>
          ))}
        </Section>
      )}

      {/* 成句 */}
      {e.idioms.length > 0 && (
        <Section title="成句">
          {e.idioms.map((x, i) => (
            <View key={i} style={styles.idiom}>
              <Text style={styles.idiomArm}>
                {x.arm} <Text style={styles.idiomLat}>{x.lat}</Text>
              </Text>
              <Text style={styles.idiomJp}>{x.jp}</Text>
            </View>
          ))}
        </Section>
      )}

      {/* 語根 */}
      {e.root ? (
        <Section title="語根">
          <Text style={styles.body}>{e.root}</Text>
        </Section>
      ) : null}

      {/* 派生語 */}
      {e.derivs.length > 0 && (
        <Section title="派生語・同語根">
          <View style={styles.chipWrap}>
            {e.derivs.map((did) => {
              const t = byId(DICT, did);
              if (!t) return null;
              return (
                <Pressable key={did} style={styles.chip} onPress={() => router.push(`/entry/${did}`)}>
                  <Text style={styles.chipArm}>{t.arm}</Text>
                  <Text style={styles.chipJp}>{t.jp}</Text>
                </Pressable>
              );
            })}
          </View>
        </Section>
      )}

      {/* 関連語（類義・対義） */}
      {e.rel.length > 0 && (
        <Section title="関連語">
          <View style={styles.chipWrap}>
            {e.rel.map((r) => {
              const t = byId(DICT, r.id);
              if (!t) return null;
              return (
                <Pressable key={r.id} style={styles.chip} onPress={() => router.push(`/entry/${r.id}`)}>
                  <Text style={styles.relType}>{relLabel(r.t)}</Text>
                  <Text style={styles.chipArm}>{t.arm}</Text>
                  <Text style={styles.chipJp}>{t.jp}</Text>
                </Pressable>
              );
            })}
          </View>
        </Section>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdfcf9' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  head: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(160,120,40,0.15)',
    backgroundColor: '#fff',
  },
  arm: { fontSize: 34, color: '#2a2118', flex: 1, flexShrink: 1 },
  headTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  favBtn: { padding: 4, flexShrink: 0, marginLeft: 8 },
  favStar: { fontSize: 30, color: 'rgba(160,120,40,0.45)' },
  favStarOn: { color: GOLD },
  lat: { fontSize: 16, color: '#8a7a5c', fontStyle: 'italic', marginTop: 2 },
  jp: { fontSize: 20, color: '#3a2f1f', marginTop: 8 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  pos: {
    fontSize: 12, color: GOLD, borderWidth: 1, borderColor: 'rgba(160,120,40,0.4)',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5,
  },
  level: {
    fontSize: 12, color: '#fff', backgroundColor: GOLD,
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5, overflow: 'hidden',
  },
  sec: {
    fontSize: 12, color: '#8a7a5c', backgroundColor: 'rgba(160,120,40,0.1)',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5, overflow: 'hidden',
  },
  section: { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(160,120,40,0.08)' },
  sectionTitle: { fontSize: 13, color: RED, fontWeight: '700', marginBottom: 8, letterSpacing: 1 },
  body: { fontSize: 15, color: '#3a2f1f', lineHeight: 22 },
  ex: { marginBottom: 12 },
  exArm: { fontSize: 16, color: '#2a2118' },
  exLat: { fontSize: 13, color: '#8a7a5c', fontStyle: 'italic', marginTop: 1 },
  exJp: { fontSize: 14, color: '#5a4d38', marginTop: 1 },
  idiom: { marginBottom: 10 },
  idiomArm: { fontSize: 16, color: '#2a2118' },
  idiomLat: { fontSize: 13, color: '#8a7a5c', fontStyle: 'italic' },
  idiomJp: { fontSize: 14, color: '#5a4d38', marginTop: 1 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1, borderColor: 'rgba(160,120,40,0.3)', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#fff',
  },
  chipArm: { fontSize: 15, color: '#2a2118' },
  chipJp: { fontSize: 12, color: '#8a7a5c' },
  relType: { fontSize: 10, color: RED, marginBottom: 1 },
});
