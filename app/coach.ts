import AsyncStorage from '@react-native-async-storage/async-storage';
import type { View } from 'react-native';

/* ------------------------------------------------------------------ */
/* 初回表示の記録                                                       */
/*                                                                     */
/* 画面ごとに別のキーを持たせる。説明の内容を作り直したときは            */
/* VERSION を上げれば、既存ユーザーにも改めて表示できる。               */
/* ------------------------------------------------------------------ */

const VERSION = 'v1';
const key = (name: string) => `coach:${name}:${VERSION}`;

export type CoachName = 'home' | 'entry' | 'grammar' | 'letters';

const ALL: CoachName[] = ['home', 'entry', 'grammar', 'letters'];

export async function isCoachDone(name: CoachName): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(key(name))) === '1';
  } catch {
    // 読めない場合は「表示済み」扱いにして、繰り返し出ないようにする
    return true;
  }
}

export async function markCoachDone(name: CoachName): Promise<void> {
  try {
    await AsyncStorage.setItem(key(name), '1');
  } catch {
    // 保存に失敗しても操作は妨げない
  }
}

/** 開発中に説明をもう一度見たいとき用 */
export async function resetCoach(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(ALL.map(key));
  } catch {
    // noop
  }
}

/* ------------------------------------------------------------------ */
/* 位置の測定                                                          */
/* ------------------------------------------------------------------ */

export type Rect = { x: number; y: number; width: number; height: number };

/** ref の実座標（画面全体に対する位置）を測る */
export function measureRect(
  ref: React.RefObject<View | null>,
): Promise<Rect | null> {
  return new Promise((resolve) => {
    const node = ref.current;
    if (!node) {
      resolve(null);
      return;
    }
    node.measureInWindow((x, y, width, height) => {
      if (width === 0 && height === 0) resolve(null);
      else resolve({ x, y, width, height });
    });
  });
}
