#!/usr/bin/env python3
"""
assets/audio/ にある .m4a を走査して lib/wordAudio.ts を再生成する。

録音が届くたびに実行する:
    python3 tools/gen_word_audio.py

- ファイル名は辞書の id と一致している必要がある（例: n-0223a.m4a）
- 辞書に存在しない id のファイルがあればエラーで止まる
- 未録音の語はマップに載らず、アプリ側で再生ボタンが出ない
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AUDIO_DIR = ROOT / "assets" / "audio"
DICT_PATH = ROOT / "assets" / "dictionary.json"
OUT_PATH = ROOT / "lib" / "wordAudio.ts"

HEADER = """// 自動生成ファイル — 直接編集しないこと。
// 再生成: python3 tools/gen_word_audio.py
//
// React Native の require は静的パスしか解決できないため、
// 録音済みの音声を全件ここに列挙する。
// 未録音の語はキーが存在せず、WordAudioButton が何も描画しない。

export const WORD_AUDIO: Record<string, number> = {
"""

FOOTER = """};

export function hasAudio(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(WORD_AUDIO, id);
}

/** 録音済み件数（進捗表示などに使える） */
export const AUDIO_COUNT = Object.keys(WORD_AUDIO).length;
"""


def main() -> int:
    if not AUDIO_DIR.is_dir():
        print(f"音声ディレクトリがありません: {AUDIO_DIR}", file=sys.stderr)
        return 1
    if not DICT_PATH.is_file():
        print(f"辞書がありません: {DICT_PATH}", file=sys.stderr)
        return 1

    dictionary = json.loads(DICT_PATH.read_text(encoding="utf-8"))
    valid_ids = {e["id"] for e in dictionary["entries"]}

    stems = sorted(p.stem for p in AUDIO_DIR.glob("*.m4a"))
    if not stems:
        print(f"音声ファイルが見つかりません: {AUDIO_DIR}", file=sys.stderr)
        return 1

    unknown = [s for s in stems if s not in valid_ids]
    if unknown:
        print("辞書に存在しない id の音声があります:", file=sys.stderr)
        for u in unknown:
            print(f"  {u}.m4a", file=sys.stderr)
        return 1

    body = "".join(
        f"  '{s}': require('../assets/audio/{s}.m4a'),\n" for s in stems
    )
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(HEADER + body + FOOTER, encoding="utf-8")

    print(f"{OUT_PATH.relative_to(ROOT)} を生成しました")
    print(f"  録音済み: {len(stems)} / {len(valid_ids)} 語 "
          f"({len(stems) / len(valid_ids) * 100:.1f}%)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
