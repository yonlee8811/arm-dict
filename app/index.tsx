import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  SectionList,
  ScrollView,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  type ViewToken,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect, Stack } from 'expo-router';
import { DICT } from '../lib/useDict';
import { searchWithPos, Dir, Entry } from '../lib/dict';
import { getHistory, addHistory, clearHistory } from '../lib/store';
import { isCoachDone, markCoachDone, measureRect, resetCoach } from '../lib/coach';
import CoachMarks, { type CoachStep } from '../components/CoachMarks';

const GOLD = '#a07828';
const RED = '#c0392b';

const POS_LIST = ['全て', '名詞', '動詞', '形容詞', '副詞', 'フレーズ', '接続詞', '後置詞', '数詞', '代名詞'];

/* ------------------------------------------------------------------ */
/* 行の寸法（getItemLayout を成立させるため完全固定）                   */
/* 内訳: paddingVertical 10*2 + lineHeight 26+17+20 + border 1 = 84     */
/* ------------------------------------------------------------------ */

const ARM_LH = 26;
const LAT_LH = 17;
const JP_LH = 20;
const ROW_PAD_V = 10;
const ROW_H = ROW_PAD_V * 2 + ARM_LH + LAT_LH + JP_LH + 1;
const HEADER_H = 36;

/* ------------------------------------------------------------------ */
/* ヘッダーのボタンの位置                                               */
/*                                                                     */
/* ヘッダーはネイティブの UINavigationBar 上にあり、そこに置いた View を */
/* measureInWindow で測ると画面全体ではなくヘッダー内部の座標が返る      */
/* ことがある（左上原点になってしまう）。測るのをやめて計算で出す。      */
/*                                                                     */
/* iOS のナビゲーションバーは端から 16pt の余白を空け、アイコンの当たり  */
/* 判定は 44pt 角。実機のスクリーンショットを実測しても、右上の円の      */
/* 中心は右端から 38.2pt（= 16 + 44/2）で一致した。                     */
/*                                                                     */
/* 左の「使い方」はテキストなので横に広い。3文字ぶんと                  */
/* システムが敷く背景の余白を見込んで 80pt としている。                 */
/* ------------------------------------------------------------------ */

const NAV_BTN = 44;
const NAV_MARGIN = 16;
const HOWTO_W = 80;

/* ------------------------------------------------------------------ */
/* カテゴリー                                                           */
/* ------------------------------------------------------------------ */

type EntryWithSec = Entry & { sec?: string };

/** 動詞の -ել / -ալ は -el型 / -al型 と同じ活用型なのでまとめる */
const SEC_ALIAS: Record<string, string> = {
  '-ել': '-el型',
  '-ալ': '-al型',
};

const secOf = (e: Entry): string => {
  const raw = (e as EntryWithSec).sec || 'その他';
  return SEC_ALIAS[raw] ?? raw;
};

const SEC_ORDER: Map<string, number> = (() => {
  const m = new Map<string, number>();
  for (const e of DICT.entries as Entry[]) {
    const k = `${e.pos}\u0000${secOf(e)}`;
    if (!m.has(k)) m.set(k, m.size);
  }
  return m;
})();

type Section = { key: string; title: string; data: Entry[] };

const makeGetItemLayout = (sections: Section[]) => {
  const lengths: number[] = [];
  const offsets: number[] = [];
  let off = 0;
  for (const s of sections) {
    offsets.push(off); lengths.push(HEADER_H); off += HEADER_H;
    for (let i = 0; i < s.data.length; i += 1) {
      offsets.push(off); lengths.push(ROW_H); off += ROW_H;
    }
    offsets.push(off); lengths.push(0); // セクションフッター
  }
  const total = off;
  return (_d: unknown, index: number) => ({
    length: lengths[index] ?? 0,
    offset: offsets[index] ?? total,
    index,
  });
};

/* ------------------------------------------------------------------ */
/* ヘッダー左の「使い方」ボタン                                         */
/*                                                                     */
/* 丸い輪郭は描かない。iOS 26 はヘッダーのボタンに独自のガラス背景を     */
/* 敷くため、こちらで丸を描くと二重丸になり位置合わせが必要になる。      */
/* テキストだけにして、背景はシステムに任せる。                          */
/* ------------------------------------------------------------------ */

function HowToButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="使い方をもう一度見る"
      style={({ pressed }) => [styles.howTo, pressed && styles.howToPressed]}
    >
      <Text style={styles.howToTxt} allowFontScaling={false}>使い方</Text>
    </Pressable>
  );
}

export default function Index() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: SCREEN_W } = useWindowDimensions();

  const [q, setQ] = useState('');
  const [dir, setDir] = useState<Dir>('hy2ja');
  const [pos, setPos] = useState<string>('全て');
  const [history, setHistory] = useState<string[]>([]);
  const [activeSec, setActiveSec] = useState<string | null>(null);

  const listRef = useRef<SectionList<Entry, Section>>(null);
  const chipScrollRef = useRef<ScrollView>(null);
  const chipXRef = useRef<Record<string, number>>({});
  const suppressSync = useRef(false);
  const releaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---------------- 操作説明 ---------------- */

  const searchRef = useRef<View>(null);
  const posBarRef = useRef<View>(null);
  const lettersRef = useRef<View>(null);
  const grammarRef = useRef<View>(null);
  const [coachSteps, setCoachSteps] = useState<CoachStep[] | null>(null);
  const coachStarted = useRef(false);

  /** 対象の位置を測って説明を組み立て、表示する */
  const showCoach = useCallback(async () => {
    const [search, posBar, letters, grammar] = await Promise.all([
      measureRect(searchRef),
      measureRect(posBarRef),
      measureRect(lettersRef),
      measureRect(grammarRef),
    ]);

    // ヘッダーのボタンは測らず、ナビゲーションバーの仕様から算出する
    const info = {
      x: SCREEN_W - NAV_MARGIN - NAV_BTN,
      y: insets.top,
      width: NAV_BTN,
      height: NAV_BTN,
    };
    const howTo = {
      x: NAV_MARGIN - 6,
      y: insets.top,
      width: HOWTO_W,
      height: NAV_BTN,
    };

    const steps: CoachStep[] = [
      {
        key: 'search',
        title: '4通りの引き方',
        text: 'アルメニア文字・ラテン転写・日本語・かなのどれでも検索できます。転写のアポストロフィや重子音の有無、カタカナとひらがなの違いも自動で吸収します。',
        rect: search,
        arrow: 'up',
      },
      {
        key: 'browse',
        title: '眺めるだけでも',
        text: '検索しなくても、品詞タブを選べばその品詞の見出し語がカテゴリー別に並びます。引きたい語が決まっていないときは、こちらから探すのが楽しいです。',
        rect: posBar,
        arrow: 'up',
      },
      {
        key: 'posScroll',
        title: 'タブは右へ続きます',
        text: 'フレーズの先にも接続詞・後置詞・数詞・代名詞があります。タブの列を右へスワイプしてください。',
        rect: posBar,
        arrow: 'right',
        placement: 'insideEnd',
      },
      {
        key: 'letters',
        title: '39文字の発音',
        text: 'アルメニア文字の一覧です。文字をタップすると読み方の解説と、その文字で始まる語の一覧が開きます。',
        rect: letters,
        arrow: 'up',
      },
      {
        key: 'grammar',
        title: '文法の解説',
        text: '名詞の7つの格変化、動詞の活用、後置詞やリエゾンなどをまとめています。通信がなくても読めます。',
        rect: grammar,
        arrow: 'up',
      },
      {
        key: 'audio',
        title: '母語話者の発音',
        text: '単語をタップすると詳細が開きます。見出しの右上にあるスピーカーのボタンを押すと、アルメニア語母語話者による発音が再生されます。',
        rect: null,
      },
      {
        key: 'info',
        title: 'アプリについて',
        text: '右上のこのボタンから、収録内容や使い方の説明を開けます。',
        rect: info,
        arrow: 'up',
      },
      {
        key: 'howto',
        title: 'いつでも見返せます',
        text: 'この説明は左上の「使い方」からいつでも呼び出せます。文字・文法・語の詳細の説明も、あわせてもう一度表示されます。',
        rect: howTo,
        arrow: 'up',
      },
    ];

    // 測れなかった対象は飛ばす。audio は指す先が別画面なので文言のみ。
    setCoachSteps(steps.filter((s) => s.rect != null || s.key === 'audio'));
  }, [SCREEN_W, insets.top]);

  /* 初回起動時 */
  useEffect(() => {
    if (coachStarted.current) return;
    coachStarted.current = true;

    let alive = true;
    (async () => {
      if (await isCoachDone('home')) return;
      // 画面が組み上がってから実座標を測る
      await new Promise((r) => setTimeout(r, 600));
      if (!alive) return;
      await showCoach();
    })();
    return () => { alive = false; };
  }, [showCoach]);

  /**
   * ヘッダー左の「使い方」から呼ぶ。
   * ホームの説明を出し直すと同時に、他の3画面の表示済み記録も消す。
   * 次に文字・文法・語の詳細を開いたとき、それぞれの説明が再び出る。
   * ホームだけをやり直したい場合は resetCoach() の行を削除する。
   */
  const replayCoach = useCallback(async () => {
    await resetCoach();
    await showCoach();
  }, [showCoach]);

  const closeCoach = useCallback(() => {
    setCoachSteps(null);
    markCoachDone('home');
  }, []);

  /* ---------------------------------------------------- */

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      getHistory().then((h) => { if (alive) setHistory(h); });
      return () => { alive = false; };
    }, [])
  );

  useEffect(() => () => {
    if (releaseTimer.current) clearTimeout(releaseTimer.current);
  }, []);

  function openEntry(item: Entry) {
    if (q.trim()) {
      addHistory(q).then(() => getHistory().then(setHistory));
    }
    router.push(`/entry/${item.id}`);
  }

  const results = useMemo<Entry[]>(() => {
    const posArg = pos === '全て' ? null : pos;
    if (!q.trim()) {
      if (!posArg) return [];
      const list = DICT.entries.filter((e) => e.pos === posArg);
      if (posArg === '数詞') {
        return list.sort((a, b) => {
          const na = Number(a.jp), nb = Number(b.jp);
          const aNum = Number.isFinite(na), bNum = Number.isFinite(nb);
          if (aNum && bNum) return na - nb;
          if (aNum) return -1;
          if (bNum) return 1;
          return 0;
        });
      }
      return list;
    }
    return searchWithPos(DICT, q, posArg, dir, 80);
  }, [q, dir, pos]);

  const browse = q.trim() === '' && pos !== '全て';

  const sections = useMemo<Section[]>(() => {
    if (!browse) return [];
    const grouped = new Map<string, Entry[]>();
    for (const e of results) {
      const sec = secOf(e);
      let bucket = grouped.get(sec);
      if (!bucket) { bucket = []; grouped.set(sec, bucket); }
      bucket.push(e);
    }
    return [...grouped.entries()]
      .sort((a, b) =>
        (SEC_ORDER.get(`${pos}\u0000${a[0]}`) ?? 0) -
        (SEC_ORDER.get(`${pos}\u0000${b[0]}`) ?? 0))
      .map(([title, data]) => ({ key: `${pos}\u0000${title}`, title, data }));
  }, [browse, results, pos]);

  const getItemLayout = useMemo(() => makeGetItemLayout(sections), [sections]);

  const centerChip = useCallback((key: string) => {
    const x = chipXRef.current[key];
    if (x == null) return;
    chipScrollRef.current?.scrollTo({ x: Math.max(0, x - 24), animated: true });
  }, []);

  const jumpToSection = useCallback((sectionIndex: number, section: Section) => {
    suppressSync.current = true;
    setActiveSec(section.key);
    centerChip(section.key);
    listRef.current?.scrollToLocation({
      sectionIndex, itemIndex: 0, viewOffset: 0, viewPosition: 0, animated: false,
    });
    if (releaseTimer.current) clearTimeout(releaseTimer.current);
    releaseTimer.current = setTimeout(() => { suppressSync.current = false; }, 400);
  }, [centerChip]);

  useEffect(() => {
    suppressSync.current = false;
    setActiveSec(sections.length > 0 ? sections[0].key : null);
    chipXRef.current = {};
    chipScrollRef.current?.scrollTo({ x: 0, animated: false });
  }, [pos, browse]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (suppressSync.current) return;
      const first = viewableItems.find((v) => v.section != null);
      const key = (first?.section as Section | undefined)?.key;
      if (!key) return;
      setActiveSec((prev) => {
        if (prev === key) return prev;
        const x = chipXRef.current[key];
        if (x != null) chipScrollRef.current?.scrollTo({ x: Math.max(0, x - 24), animated: true });
        return key;
      });
    },
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 10,
    minimumViewTime: 80,
  }).current;

  const renderRow = useCallback(({ item }: { item: Entry }) => (
    <Pressable style={styles.row} onPress={() => openEntry(item)}>
      <View style={styles.rowMain}>
        <Text style={styles.arm} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} allowFontScaling={false}>
          {item.arm}
        </Text>
        <Text style={styles.lat} numberOfLines={1} allowFontScaling={false}>{item.lat}</Text>
        <Text style={styles.jp} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} allowFontScaling={false}>
          {item.jp}
        </Text>
      </View>
      <View style={styles.badges}>
        {item.level ? <Text style={styles.level} allowFontScaling={false}>{item.level}</Text> : null}
        <Text style={styles.pos} allowFontScaling={false}>{item.pos}</Text>
      </View>
    </Pressable>
  ), [q]);

  const renderSectionHeader = useCallback(({ section }: { section: Section }) => (
    <View style={styles.secHead}>
      <Text style={styles.secHeadTxt} allowFontScaling={false}>{section.title}</Text>
      <Text style={styles.secHeadNum} allowFontScaling={false}>{section.data.length}</Text>
    </View>
  ), []);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* ヘッダー左に「使い方」を足す。title と headerRight は _layout.tsx 側の指定が残る */}
      <Stack.Screen
        options={{
          headerLeft: () => <HowToButton onPress={replayCoach} />,
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* 方向トグル */}
        <View style={styles.dirRow}>
          <Pressable style={[styles.dirBtn, dir === 'hy2ja' && styles.dirBtnOn]} onPress={() => setDir('hy2ja')}>
            <Text style={[styles.dirTxt, dir === 'hy2ja' && styles.dirTxtOn]}>アルメニア語 → 日本語</Text>
          </Pressable>
          <Pressable style={[styles.dirBtn, dir === 'ja2hy' && styles.dirBtnOn]} onPress={() => setDir('ja2hy')}>
            <Text style={[styles.dirTxt, dir === 'ja2hy' && styles.dirTxtOn]}>日本語 → アルメニア語</Text>
          </Pressable>
        </View>

        {/* 文字ブラウズ・文法・お気に入りへの入口 */}
        <View style={styles.linkRow}>
          <Pressable ref={lettersRef} collapsable={false} style={[styles.lettersLink, { flex: 1 }]} onPress={() => router.push('/letters')}>
            <Text style={styles.lettersLinkTxt}>Ա 文字・発音</Text>
          </Pressable>
          <Pressable ref={grammarRef} collapsable={false} style={[styles.lettersLink, { flex: 1 }]} onPress={() => router.push('/grammar')}>
            <Text style={styles.lettersLinkTxt}>📖 文法</Text>
          </Pressable>
          <Pressable style={[styles.lettersLink, { flex: 1 }]} onPress={() => router.push('/favorites')}>
            <Text style={styles.lettersLinkTxt}>★ お気に入り</Text>
          </Pressable>
        </View>

        {/* 検索バー */}
        <View ref={searchRef} collapsable={false} style={styles.searchWrap}>
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
        <View ref={posBarRef} collapsable={false}>
          <FlatList
            horizontal
            data={POS_LIST}
            keyExtractor={(x) => x}
            showsHorizontalScrollIndicator={false}
            style={styles.posBar}
            contentContainerStyle={{ paddingHorizontal: 12, gap: 8, alignItems: 'center', paddingVertical: 4 }}
            renderItem={({ item }) => (
              <Pressable style={[styles.posChip, pos === item && styles.posChipOn]} onPress={() => setPos(item)}>
                <Text style={[styles.posChipTxt, pos === item && styles.posChipTxtOn]}>{item}</Text>
              </Pressable>
            )}
          />
        </View>

        {/* 結果件数 */}
        {(q.trim() !== '' || pos !== '全て') && (
          <Text style={styles.count}>
            {browse
              ? `${pos} 全 ${results.length} 語 ／ ${sections.length} カテゴリー`
              : `${results.length} 件`}
          </Text>
        )}

        {/* カテゴリータブ */}
        {browse && sections.length > 1 && (
          <View style={styles.secBarWrap}>
            <ScrollView
              ref={chipScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.secBar}
            >
              {sections.map((s, i) => {
                const on = s.key === activeSec;
                return (
                  <Pressable
                    key={s.key}
                    onPress={() => jumpToSection(i, s)}
                    onLayout={(e) => { chipXRef.current[s.key] = e.nativeEvent.layout.x; }}
                    style={[styles.secChip, on && styles.secChipOn]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={`${s.title} へ移動`}
                  >
                    <Text style={[styles.secChipTxt, on && styles.secChipTxtOn]}>{s.title}</Text>
                    <Text style={[styles.secChipNum, on && styles.secChipNumOn]}>{s.data.length}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* 結果リスト */}
        {browse ? (
          <SectionList
            ref={listRef}
            style={{ flex: 1 }}
            sections={sections}
            keyExtractor={(e) => e.id}
            renderItem={renderRow}
            renderSectionHeader={renderSectionHeader}
            getItemLayout={getItemLayout}
            stickySectionHeadersEnabled
            initialNumToRender={16}
            maxToRenderPerBatch={24}
            windowSize={9}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 24 }}
            onViewableItemsChanged={handleViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
          />
        ) : (
          <FlatList
            data={results}
            keyExtractor={(e) => e.id}
            getItemLayout={(_, index) => ({ length: ROW_H, offset: ROW_H * index, index })}
            initialNumToRender={16}
            maxToRenderPerBatch={24}
            windowSize={9}
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
            renderItem={renderRow}
          />
        )}
      </KeyboardAvoidingView>

      {/* 操作説明 */}
      <CoachMarks
        visible={coachSteps !== null}
        steps={coachSteps ?? []}
        onDone={closeCoach}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fdfcf9' },

  /* ヘッダー左「使い方」 */
  howTo: { paddingHorizontal: 4, paddingVertical: 4 },
  howToPressed: { opacity: 0.6 },
  howToTxt: { color: '#fff', fontSize: 15, fontWeight: '600' },

  dirRow: { flexDirection: 'row', padding: 12, gap: 8 },
  dirBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1,
    borderColor: 'rgba(160,120,40,0.4)', alignItems: 'center',
  },
  dirBtnOn: { backgroundColor: GOLD, borderColor: GOLD },
  dirTxt: { color: GOLD, fontSize: 13, fontWeight: '600' },
  dirTxtOn: { color: '#fff' },
  searchWrap: { paddingHorizontal: 12 },
  lettersLink: {
    paddingVertical: 10, borderRadius: 8, borderWidth: 1,
    borderColor: 'rgba(160,120,40,0.4)', alignItems: 'center', backgroundColor: '#fff',
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
    borderWidth: 1, borderColor: 'rgba(160,120,40,0.3)', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 18,
    color: '#3a2f1f', backgroundColor: '#fff',
  },
  posBar: { marginTop: 10, minHeight: 44, maxHeight: 48, flexGrow: 0 },
  posChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(160,120,40,0.4)',
  },
  posChipOn: { backgroundColor: RED, borderColor: RED },
  posChipTxt: { color: '#8a7a5c', fontSize: 13 },
  posChipTxtOn: { color: '#fff' },

  secBarWrap: {
    borderTopWidth: 1, borderBottomWidth: 1,
    borderColor: 'rgba(160,120,40,0.15)', backgroundColor: '#fffdf8',
  },
  secBar: { paddingHorizontal: 12, paddingVertical: 8, gap: 6, alignItems: 'center' },
  secChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 11, paddingVertical: 5, borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(160,120,40,0.35)', backgroundColor: '#fff',
  },
  secChipOn: { backgroundColor: GOLD, borderColor: GOLD },
  secChipTxt: { color: GOLD, fontSize: 12.5, fontWeight: '600' },
  secChipTxtOn: { color: '#fff' },
  secChipNum: { color: '#b9a374', fontSize: 11 },
  secChipNumOn: { color: 'rgba(255,255,255,0.85)' },

  secHead: {
    height: HEADER_H, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16,
    backgroundColor: '#f6f1e6', borderBottomWidth: 1,
    borderBottomColor: 'rgba(160,120,40,0.2)',
  },
  secHeadTxt: { color: GOLD, fontSize: 13, fontWeight: '700' },
  secHeadNum: { color: '#b9a374', fontSize: 11 },

  count: { paddingHorizontal: 16, paddingVertical: 6, color: '#8a7a5c', fontSize: 12 },
  empty: { textAlign: 'center', color: '#8a7a5c', marginTop: 40, lineHeight: 22 },

  row: {
    height: ROW_H, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: ROW_PAD_V,
    borderBottomWidth: 1, borderBottomColor: 'rgba(160,120,40,0.1)',
    backgroundColor: '#fdfcf9',
  },
  rowMain: { flex: 1, minWidth: 0 },
  arm: { fontSize: 20, lineHeight: ARM_LH, color: '#2a2118' },
  lat: { fontSize: 13, lineHeight: LAT_LH, color: '#8a7a5c', fontStyle: 'italic' },
  jp: { fontSize: 15, lineHeight: JP_LH, color: '#5a4d38' },
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
