/**
 * SearchScreen.tsx
 * 東アルメニア語辞書アプリ — 単語検索画面
 *
 * 構成（上から順に）
 *   1. 検索フォーム
 *   2. 品詞タブ（横スクロール）
 *   3. カテゴリータブ（横スクロール・タップでそのカテゴリー先頭へスクロール）
 *   4. カテゴリー別セクションリスト（見出しは sticky）
 *
 * カテゴリーは dictionary.json の `sec` フィールドをそのまま利用します。
 * 並び順は dictionary.json の出現順 ＝ vocabulary.html の掲載順です。
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
  type SectionListData,
  type ViewToken,
} from 'react-native';

import dictionaryJson from '../assets/dictionary.json';

/* ------------------------------------------------------------------ */
/* 型                                                                  */
/* ------------------------------------------------------------------ */

export type Entry = {
  id: string;
  arm: string;
  lat: string;
  jp: string;
  yomi: string;
  pos: string;
  sec: string;
  level?: string;
  /** 正規化済みキー（dictionary.json に pre-baked 済み） */
  narm: string;
  nlat: string;
  nlatl: string;
  njp: string;
  nyomi: string;
};

type Section = { key: string; title: string; data: Entry[] };

const ENTRIES: Entry[] = (dictionaryJson as { entries: Entry[] }).entries;

/* ------------------------------------------------------------------ */
/* レイアウト定数                                                       */
/*   scrollToLocation を確実に動かすため、行とヘッダーの高さは固定。     */
/*   スタイル側の height と必ず一致させること。                          */
/* ------------------------------------------------------------------ */

const ROW_H = 76;
const HEADER_H = 38;
const GOLD = '#a07828';
const INK = '#1a1a1a';
const MUTED = '#8a8a8a';
const LINE = '#ececec';

/* ------------------------------------------------------------------ */
/* 検索クエリの正規化（dictionary.json の norm ルールに合わせる）        */
/* ------------------------------------------------------------------ */

const ARMENIAN_RE = /[\u0530-\u058F\uFB13-\uFB17]/;
const LATIN_RE = /[A-Za-zə']/;

/** カタカナ → ひらがな、NFKC */
const normJp = (s: string): string =>
  s
    .normalize('NFKC')
    .replace(/[\u30A1-\u30F6]/g, (c) =>
      String.fromCharCode(c.charCodeAt(0) - 0x60),
    );

/** 小文字化して a-z / ə / アポストロフィ以外を除去 */
const normLat = (s: string): string =>
  s.toLowerCase().replace(/[^a-zə']/g, '');

/** さらにアポストロフィを落とし rr → r に畳む（ゆるい一致用） */
const normLatLoose = (s: string): string =>
  normLat(s).replace(/'/g, '').replace(/rr/g, 'r');

type Query = {
  raw: string;
  arm: string;
  lat: string;
  latl: string;
  jp: string;
};

const buildQuery = (raw: string): Query | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return {
    raw: trimmed,
    arm: ARMENIAN_RE.test(trimmed) ? trimmed : '',
    lat: LATIN_RE.test(trimmed) ? normLat(trimmed) : '',
    latl: LATIN_RE.test(trimmed) ? normLatLoose(trimmed) : '',
    jp: normJp(trimmed),
  };
};

const matches = (e: Entry, q: Query): boolean => {
  if (q.arm && e.narm.includes(q.arm)) return true;
  if (q.lat && (e.nlat.includes(q.lat) || e.nlatl.includes(q.latl))) return true;
  if (q.jp && (e.njp.includes(q.jp) || e.nyomi.includes(q.jp))) return true;
  return false;
};

/* ------------------------------------------------------------------ */
/* 品詞ごとの索引（出現順を保持）                                        */
/* ------------------------------------------------------------------ */

const { POS_LIST, BY_POS } = (() => {
  const byPos = new Map<string, Entry[]>();
  for (const e of ENTRIES) {
    let bucket = byPos.get(e.pos);
    if (!bucket) {
      bucket = [];
      byPos.set(e.pos, bucket);
    }
    bucket.push(e);
  }
  return { POS_LIST: [...byPos.keys()], BY_POS: byPos };
})();

/* ------------------------------------------------------------------ */
/* SectionList 用 getItemLayout                                        */
/*   フラット index の並びは                                            */
/*     [section0 header, ...items, section0 footer, section1 header,…] */
/*   （footer は高さ 0 のダミーとして必ず 1 枠消費する）                 */
/* ------------------------------------------------------------------ */

const makeGetItemLayout = (sections: Section[]) => {
  const offsets: number[] = [];
  const lengths: number[] = [];
  let offset = 0;

  for (const s of sections) {
    offsets.push(offset);
    lengths.push(HEADER_H);
    offset += HEADER_H;

    for (let i = 0; i < s.data.length; i += 1) {
      offsets.push(offset);
      lengths.push(ROW_H);
      offset += ROW_H;
    }

    offsets.push(offset); // section footer
    lengths.push(0);
  }

  const total = offset;
  return (_data: unknown, index: number) => ({
    length: lengths[index] ?? 0,
    offset: offsets[index] ?? total,
    index,
  });
};

/* ------------------------------------------------------------------ */
/* 画面本体                                                             */
/* ------------------------------------------------------------------ */

export default function SearchScreen() {
  const [rawQuery, setRawQuery] = useState('');
  const [pos, setPos] = useState(POS_LIST[0]);
  const [activeSec, setActiveSec] = useState<string | null>(null);

  const listRef = useRef<SectionList<Entry, Section>>(null);
  const chipScrollRef = useRef<ScrollView>(null);
  const chipXRef = useRef<Record<string, number>>({});
  /** チップタップ由来のスクロール中は onViewableItemsChanged を無視する */
  const suppressSync = useRef(false);

  const query = useMemo(() => buildQuery(rawQuery), [rawQuery]);

  /** 品詞 → 絞り込み → カテゴリー別セクション化 */
  const sections = useMemo<Section[]>(() => {
    const source = BY_POS.get(pos) ?? [];
    const filtered = query ? source.filter((e) => matches(e, query)) : source;

    // 同一 sec のエントリは元データ上で連続しているので、
    // Map の挿入順がそのまま vocabulary.html の掲載順になる。
    const grouped = new Map<string, Entry[]>();
    for (const e of filtered) {
      let bucket = grouped.get(e.sec);
      if (!bucket) {
        bucket = [];
        grouped.set(e.sec, bucket);
      }
      bucket.push(e);
    }

    return [...grouped.entries()].map(([title, data]) => ({
      key: `${pos}:${title}`,
      title,
      data,
    }));
  }, [pos, query]);

  const getItemLayout = useMemo(() => makeGetItemLayout(sections), [sections]);

  /* --- 品詞タブ切り替え --- */
  const handlePosChange = useCallback(
    (nextPos: string) => {
      if (nextPos === pos) return;
      setPos(nextPos);
      setActiveSec(null);
      chipXRef.current = {};
      chipScrollRef.current?.scrollTo({ x: 0, animated: false });
      listRef.current?.scrollToLocation({
        sectionIndex: 0,
        itemIndex: 0,
        animated: false,
      });
    },
    [pos],
  );

  /* --- カテゴリータブ → 該当カテゴリー先頭へスクロール --- */
  const handleCategoryPress = useCallback(
    (sectionIndex: number) => {
      const section = sections[sectionIndex];
      if (!section) return;

      suppressSync.current = true;
      setActiveSec(section.title);
      centerChip(section.title);

      listRef.current?.scrollToLocation({
        sectionIndex,
        itemIndex: 0, // 0 はセクション見出し自身を指す
        viewOffset: 0,
        viewPosition: 0,
        animated: true,
      });

      setTimeout(() => {
        suppressSync.current = false;
      }, 450);
    },
    [sections],
  );

  /** アクティブなチップを画面内に寄せる */
  const centerChip = useCallback((title: string) => {
    const x = chipXRef.current[title];
    if (x == null) return;
    chipScrollRef.current?.scrollTo({ x: Math.max(0, x - 24), animated: true });
  }, []);

  /* --- スクロールに追従してカテゴリータブの選択状態を更新 --- */
  const handleViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (suppressSync.current) return;
      const first = viewableItems.find((v) => v.section != null);
      const title = (first?.section as Section | undefined)?.title;
      if (title) {
        setActiveSec((prev) => (prev === title ? prev : title));
      }
    },
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 10,
    minimumViewTime: 60,
  }).current;

  /* --- レンダラ --- */

  const renderItem = useCallback(
    ({ item }: { item: Entry }) => (
      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        // 詳細画面がある場合はここで遷移
        // onPress={() => navigation.navigate('Detail', { id: item.id })}
        accessibilityRole="button"
        accessibilityLabel={`${item.arm} ${item.jp}`}
      >
        <View style={styles.rowMain}>
          <Text style={styles.arm} numberOfLines={1}>
            {item.arm}
          </Text>
          <Text style={styles.lat} numberOfLines={1}>
            {item.lat}
          </Text>
          <Text style={styles.jp} numberOfLines={1}>
            {item.jp}
          </Text>
        </View>
        {item.level ? <Text style={styles.level}>{item.level}</Text> : null}
      </Pressable>
    ),
    [],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionListData<Entry, Section> }) => (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <Text style={styles.sectionCount}>{section.data.length}</Text>
      </View>
    ),
    [],
  );

  const totalHits = useMemo(
    () => sections.reduce((n, s) => n + s.data.length, 0),
    [sections],
  );

  return (
    <View style={styles.screen}>
      {/* 1. 検索フォーム */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          value={rawQuery}
          onChangeText={setRawQuery}
          placeholder="アルメニア語・ローマ字・日本語で検索"
          placeholderTextColor={MUTED}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
          returnKeyType="search"
        />
      </View>

      {/* 2. 品詞タブ */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.posBar}
      >
        {POS_LIST.map((p) => {
          const selected = p === pos;
          return (
            <Pressable
              key={p}
              onPress={() => handlePosChange(p)}
              style={[styles.posTab, selected && styles.posTabActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
            >
              <Text style={[styles.posLabel, selected && styles.posLabelActive]}>
                {p}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* 3. カテゴリータブ */}
      {sections.length > 0 && (
        <View style={styles.chipBarWrap}>
          <ScrollView
            ref={chipScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.chipBar}
          >
            {sections.map((s, i) => {
              const selected = s.title === activeSec;
              return (
                <Pressable
                  key={s.key}
                  onPress={() => handleCategoryPress(i)}
                  onLayout={(e) => {
                    chipXRef.current[s.title] = e.nativeEvent.layout.x;
                  }}
                  style={[styles.chip, selected && styles.chipActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${s.title} へ移動`}
                >
                  <Text
                    style={[styles.chipLabel, selected && styles.chipLabelActive]}
                  >
                    {s.title}
                  </Text>
                  <Text
                    style={[styles.chipCount, selected && styles.chipCountActive]}
                  >
                    {s.data.length}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* 4. カテゴリー別リスト */}
      <SectionList
        ref={listRef}
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        getItemLayout={getItemLayout}
        stickySectionHeadersEnabled
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        initialNumToRender={16}
        maxToRenderPerBatch={24}
        windowSize={9}
        removeClippedSubviews={Platform.OS === 'android'}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScrollToIndexFailed={({ index, averageItemLength }) => {
          listRef.current
            ?.getScrollResponder()
            ?.scrollTo({ y: index * averageItemLength, animated: false });
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {query
                ? `「${query.raw}」に一致する${pos}は見つかりませんでした。`
                : 'この品詞の見出し語はまだありません。'}
            </Text>
          </View>
        }
        ListFooterComponent={
          totalHits > 0 ? (
            <Text style={styles.footer}>{totalHits} 語</Text>
          ) : null
        }
      />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* スタイル                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#ffffff' },

  searchBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  searchInput: {
    height: 42,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    color: INK,
    backgroundColor: '#f4f4f4',
  },

  posBar: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 6,
  },
  posTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#f4f4f4',
  },
  posTabActive: { backgroundColor: GOLD },
  posLabel: { fontSize: 14, color: '#555', fontWeight: '600' },
  posLabelActive: { color: '#ffffff' },

  chipBarWrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: LINE,
  },
  chipBar: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e2d7bd',
    backgroundColor: '#ffffff',
  },
  chipActive: { backgroundColor: GOLD, borderColor: GOLD },
  chipLabel: { fontSize: 13, color: GOLD, fontWeight: '600' },
  chipLabelActive: { color: '#ffffff' },
  chipCount: { fontSize: 11, color: '#b9a374' },
  chipCountActive: { color: 'rgba(255,255,255,0.85)' },

  sectionHeader: {
    height: HEADER_H,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#faf7f0',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e8dfc9',
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: GOLD },
  sectionCount: { fontSize: 12, color: '#b9a374' },

  row: {
    height: ROW_H,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: LINE,
    backgroundColor: '#ffffff',
  },
  rowPressed: { backgroundColor: '#fbf9f4' },
  rowMain: { flex: 1, justifyContent: 'center' },
  arm: { fontSize: 18, color: INK, fontWeight: '600' },
  lat: { fontSize: 12, color: MUTED, marginTop: 1 },
  jp: { fontSize: 14, color: '#444', marginTop: 2 },
  level: { fontSize: 11, color: '#b9a374', marginLeft: 12 },

  empty: { paddingTop: 48, paddingHorizontal: 32, alignItems: 'center' },
  emptyText: { fontSize: 14, color: MUTED, textAlign: 'center', lineHeight: 22 },

  footer: {
    textAlign: 'center',
    color: MUTED,
    fontSize: 12,
    paddingVertical: 24,
  },
});
