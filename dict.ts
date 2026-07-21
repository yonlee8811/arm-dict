// 辞書検索エンジン（東アルメニア語⇔日本語）
// dictionary.json の事前計算済み正規化キー（narm/nlat/nlatl/njp/nyomi）を使う。

export type Ex = { arm: string; lat: string; jp: string };
export type Idiom = { arm: string; lat: string; jp: string };
export type Rel = { id: string; t: 'ant' | 'syn' };

export type Entry = {
  id: string;
  arm: string;
  lat: string;
  jp: string;
  yomi: string;
  pos: string;
  sec: string;
  root: string | null;
  derivs: string[];
  rel: Rel[];
  idioms: Idiom[];
  ex: Ex[];
  level: string | null;
  // 動詞のみ
  conj?: string;
  pres?: { arm: string; lat: string };
  // 後置詞のみ
  case?: string;
  // 事前計算済み正規化キー
  narm: string;
  nlat: string;
  nlatl: string;
  njp: string;
  nyomi: string;
};

export type Dict = { meta: any; entries: Entry[] };

// 検索方向
export type Dir = 'hy2ja' | 'ja2hy';

// --- 入力側の正規化（データ側と同じ規則） ---
function armLow(s: string): string {
  let r = '';
  for (const c of s) {
    const o = c.charCodeAt(0);
    r += o >= 0x531 && o <= 0x556 ? String.fromCharCode(o + 48) : c;
  }
  return r;
}
function normLat(x: string): string {
  return x.toLowerCase().replace(/[^a-z\u0259']/g, '');
}
function normLatLoose(x: string): string {
  return normLat(x).replace(/'/g, '').replace(/rr/g, 'r');
}
function kataToHira(s: string): string {
  let r = '';
  for (const c of s) {
    const o = c.charCodeAt(0);
    r += o >= 0x30a1 && o <= 0x30f6 ? String.fromCharCode(o - 0x60) : c;
  }
  return r;
}
function normJp(x: string): string {
  return kataToHira((x || '').normalize('NFKC'));
}

// 入力がアルメニア文字を含むか（方向自動判定の補助）
function hasArmenian(s: string): boolean {
  for (const c of s) {
    const o = c.charCodeAt(0);
    if (o >= 0x531 && o <= 0x58f) return true;
  }
  return false;
}
// 入力がラテン文字を含むか
function hasLatin(s: string): boolean {
  return /[a-zA-Z]/.test(s);
}

export type Hit = { entry: Entry; score: number };

// スコア: 完全一致>前方一致>部分一致。短い見出しを優先。
function scoreField(field: string, q: string): number {
  if (!q) return 0;
  const i = field.indexOf(q);
  if (i < 0) return 0;
  if (field === q) return 100;
  if (i === 0) return 60;
  return 30;
}

/**
 * 検索本体。
 * dir='hy2ja': アルメニア語/ラテン転写で引く（見出し語→日本語）
 * dir='ja2hy': 日本語/かなで引く（意味→アルメニア語）
 * 入力の文字種から自動でも判定するが、明示 dir があればそれを優先。
 */
export function search(dict: Dict, raw: string, dir?: Dir, limit = 50): Entry[] {
  const q = raw.trim();
  if (!q) return [];

  // 方向の決定
  let d: Dir;
  if (dir) d = dir;
  else if (hasArmenian(q) || (hasLatin(q) && !/[ぁ-んァ-ヶ一-龠]/.test(q))) d = 'hy2ja';
  else d = 'ja2hy';

  const hits: Hit[] = [];

  if (d === 'hy2ja') {
    const qa = armLow(q);
    const qn = normLatLoose(q);
    for (const e of dict.entries) {
      let s = 0;
      if (qa && hasArmenian(q)) s = Math.max(s, scoreField(e.narm, qa));
      if (qn) s = Math.max(s, scoreField(e.nlatl, qn));
      if (s > 0) hits.push({ entry: e, score: s - e.arm.length * 0.1 });
    }
  } else {
    const qj = normJp(q);
    for (const e of dict.entries) {
      let s = Math.max(scoreField(e.njp, qj), scoreField(e.nyomi, qj));
      if (s > 0) hits.push({ entry: e, score: s - e.jp.length * 0.1 });
    }
  }

  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, limit).map((h) => h.entry);
}

// 品詞フィルタ付き
export function searchWithPos(
  dict: Dict,
  raw: string,
  pos: string | null,
  dir?: Dir,
  limit = 50
): Entry[] {
  const base = search(dict, raw, dir, pos ? 500 : limit);
  if (!pos) return base.slice(0, limit);
  return base.filter((e) => e.pos === pos).slice(0, limit);
}

// id で1件取得（詳細パネル・関連語ジャンプ用）
export function byId(dict: Dict, id: string): Entry | undefined {
  return dict.entries.find((e) => e.id === id);
}
