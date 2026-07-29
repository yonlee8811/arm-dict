import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import type { Rect } from '../lib/coach';

const RED = '#c0392b';
const GOLD = '#a07828';

export type ArrowDir = 'up' | 'down' | 'left' | 'right';

export type CoachStep = {
  key: string;
  /** 説明文の見出し */
  title: string;
  /** 説明文 */
  text: string;
  /** 指し示す対象の矩形。null なら画面中央にカードだけ出す */
  rect?: Rect | null;
  /** 矢印が向く方向 */
  arrow?: ArrowDir;
  /**
   * outside   : 対象の外側に置いて対象を指す（既定）
   * insideEnd : 対象の内側の端に置く。横スクロールできることを示すときに使う
   */
  placement?: 'outside' | 'insideEnd';
};

type Props = {
  visible: boolean;
  steps: CoachStep[];
  onDone: () => void;
};

const ARROW_BOX = 76;   // 矢印を収める正方形。回転しても切れない大きさ
const SHAFT_LEN = 34;
const SHAFT_W = 5;
const HEAD_W = 11;      // 三角形の半幅
const HEAD_H = 16;

/* ------------------------------------------------------------------ */
/* 赤い矢印                                                            */
/* 既定では下向き。コンテナごと回して他の向きにする。                    */
/* ------------------------------------------------------------------ */

function Arrow({ dir }: { dir: ArrowDir }) {
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: 1,
          duration: 620,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: 620,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bounce]);

  const rotate = { down: '0deg', left: '90deg', up: '180deg', right: '270deg' }[dir];
  const shift = bounce.interpolate({ inputRange: [0, 1], outputRange: [-7, 7] });

  return (
    <Animated.View
      style={[
        styles.arrowBox,
        { transform: [{ rotate }, { translateY: shift }] },
      ]}
    >
      <View style={styles.shaft} />
      <View style={styles.head} />
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */

export default function CoachMarks({ visible, steps, onDone }: Props) {
  const { width: W, height: H } = useWindowDimensions();
  const [i, setI] = useState(0);
  const fade = useRef(new Animated.Value(0)).current;

  const step = steps[i];

  useEffect(() => {
    if (!visible) return;
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 240,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [i, visible, fade]);

  const next = () => {
    if (i + 1 < steps.length) setI(i + 1);
    else finish();
  };

  const finish = () => {
    setI(0);
    onDone();
  };

  /* --- スポットライト（対象の周囲4枚で覆い、対象だけ素通しにする） --- */
  const shades = useMemo(() => {
    const r = step?.rect;
    if (!r) return [{ key: 'all', style: StyleSheet.absoluteFillObject }];
    const pad = 6;
    const x = Math.max(0, r.x - pad);
    const y = Math.max(0, r.y - pad);
    const w = Math.min(W - x, r.width + pad * 2);
    const h = Math.min(H - y, r.height + pad * 2);
    return [
      { key: 't', style: { left: 0, top: 0, width: W, height: y } },
      { key: 'b', style: { left: 0, top: y + h, width: W, height: Math.max(0, H - y - h) } },
      { key: 'l', style: { left: 0, top: y, width: x, height: h } },
      { key: 'r', style: { left: x + w, top: y, width: Math.max(0, W - x - w), height: h } },
    ];
  }, [step, W, H]);

  /* --- 矢印の位置 --- */
  const arrowPos = useMemo(() => {
    const r = step?.rect;
    const dir = step?.arrow;
    if (!r || !dir) return null;
    const inside = step?.placement === 'insideEnd';
    const half = ARROW_BOX / 2;
    const gap = 40;
    let cx = r.x + r.width / 2;
    let cy = r.y + r.height / 2;

    if (dir === 'down') cy = r.y - gap;
    if (dir === 'up') cy = r.y + r.height + gap;
    if (dir === 'right') cx = inside ? r.x + r.width - half : r.x - gap;
    if (dir === 'left') cx = inside ? r.x + half : r.x + r.width + gap;

    return {
      left: Math.min(Math.max(4, cx - half), W - ARROW_BOX - 4),
      top: Math.min(Math.max(4, cy - half), H - ARROW_BOX - 4),
    };
  }, [step, W, H]);

  /* --- 説明カードの位置。対象の下に余裕がなければ上に出す --- */
  const cardPos = useMemo(() => {
    const r = step?.rect;
    if (!r) return { top: H / 2 - 110 };
    const below = r.y + r.height + 96;
    if (below + 190 < H) return { top: below };
    return { top: Math.max(90, r.y - 96 - 190) };
  }, [step, H]);

  if (!visible || !step) return null;

  const last = i === steps.length - 1;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={finish}>
      <Pressable style={StyleSheet.absoluteFill} onPress={next}>
        {shades.map((s) => (
          <View key={s.key} pointerEvents="none" style={[styles.shade, s.style as object]} />
        ))}

        {step.rect ? (
          <View
            pointerEvents="none"
            style={[
              styles.halo,
              {
                left: step.rect.x - 6,
                top: step.rect.y - 6,
                width: step.rect.width + 12,
                height: step.rect.height + 12,
              },
            ]}
          />
        ) : null}

        {arrowPos ? (
          <View pointerEvents="none" style={[styles.arrowWrap, arrowPos]}>
            <Arrow dir={step.arrow!} />
          </View>
        ) : null}

        <Animated.View
          pointerEvents="box-none"
          style={[styles.card, cardPos, { opacity: fade }]}
        >
          <Text style={styles.step}>
            {i + 1} / {steps.length}
          </Text>
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.body}>{step.text}</Text>

          <View style={styles.row}>
            <Pressable onPress={finish} hitSlop={10}>
              <Text style={styles.skip}>スキップ</Text>
            </Pressable>
            <Pressable onPress={next} style={styles.nextBtn} hitSlop={10}>
              <Text style={styles.nextTxt}>{last ? 'はじめる' : '次へ'}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  shade: { position: 'absolute', backgroundColor: 'rgba(20,14,4,0.72)' },

  halo: {
    position: 'absolute',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: RED,
  },

  arrowWrap: {
    position: 'absolute',
    width: ARROW_BOX,
    height: ARROW_BOX,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowBox: { alignItems: 'center', justifyContent: 'center' },
  shaft: {
    width: SHAFT_W,
    height: SHAFT_LEN,
    backgroundColor: RED,
    borderTopLeftRadius: SHAFT_W / 2,
    borderTopRightRadius: SHAFT_W / 2,
  },
  head: {
    width: 0,
    height: 0,
    borderLeftWidth: HEAD_W,
    borderRightWidth: HEAD_W,
    borderTopWidth: HEAD_H,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: RED,
    marginTop: -1,
  },

  card: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: '#fffdf8',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(160,120,40,0.35)',
  },
  step: { fontSize: 11, color: '#b9a374', marginBottom: 4 },
  title: { fontSize: 16, fontWeight: '700', color: GOLD, marginBottom: 6 },
  body: { fontSize: 14, lineHeight: 22, color: '#5a4d38' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  skip: { fontSize: 13, color: '#8a7a5c', paddingVertical: 6, paddingRight: 12 },
  nextBtn: {
    backgroundColor: GOLD,
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 8,
  },
  nextTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
