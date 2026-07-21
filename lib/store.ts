// お気に入り・検索履歴の永続化（AsyncStorage）
import AsyncStorage from '@react-native-async-storage/async-storage';

const FAV_KEY = 'armdict:favorites';   // string[] （エントリID）
const HIST_KEY = 'armdict:history';    // string[] （検索語・新しい順）
const HIST_MAX = 20;

async function readList(key: string): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return [];
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

async function writeList(key: string, list: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(list));
  } catch {
    // 保存失敗時は静かに諦める（アプリ動作は継続）
  }
}

// ---- お気に入り ----
export async function getFavorites(): Promise<string[]> {
  return readList(FAV_KEY);
}

export async function isFavorite(id: string): Promise<boolean> {
  const list = await readList(FAV_KEY);
  return list.includes(id);
}

/** トグルして、新しいお気に入り状態(true=登録済み)を返す */
export async function toggleFavorite(id: string): Promise<boolean> {
  const list = await readList(FAV_KEY);
  const i = list.indexOf(id);
  let fav: boolean;
  if (i >= 0) {
    list.splice(i, 1);
    fav = false;
  } else {
    list.unshift(id); // 新しいものを先頭に
    fav = true;
  }
  await writeList(FAV_KEY, list);
  return fav;
}

// ---- 検索履歴 ----
export async function getHistory(): Promise<string[]> {
  return readList(HIST_KEY);
}

/** 検索語を履歴の先頭に追加（重複は除去、最大 HIST_MAX 件） */
export async function addHistory(q: string): Promise<void> {
  const t = q.trim();
  if (!t) return;
  const list = await readList(HIST_KEY);
  const next = [t, ...list.filter((x) => x !== t)].slice(0, HIST_MAX);
  await writeList(HIST_KEY, next);
}

export async function clearHistory(): Promise<void> {
  await writeList(HIST_KEY, []);
}
