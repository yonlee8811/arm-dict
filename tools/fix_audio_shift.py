#!/usr/bin/env python3
"""
tools/fix_audio_shift.py

n-0406（տոլմա / tolma）が二重登録だったため、収録側でこの語が飛ばされ、
n-0406.m4a 以降の音声が1つずつ手前にずれている。それを揃え直す。

  1. n-0406.m4a 〜 最後の録音  →  番号を +1 してリネーム（降順に処理）
  2. n-0138.m4a               →  n-0406.m4a へ移動
     （n-0138 は削除する重複エントリ。その tolma の録音を n-0406 に引き継ぐ）

使い方:
    python3 tools/fix_audio_shift.py            # ドライラン（何も変更しない）
    python3 tools/fix_audio_shift.py --apply    # 実行

実行後は必ず:
    python3 tools/gen_word_audio.py             # wordAudio.ts を再生成
"""

import argparse
import json
import re
import shutil
import sys
from pathlib import Path

PIVOT = 406          # ここから後ろを +1 する
SOURCE_ID = 'n-0138'  # この録音を n-0406 へ移す
EXT = '.m4a'

FNAME_RE = re.compile(r'^n-(\d{4})([a-z]?)$')


def find_paths(root: Path):
    audio = root / 'assets' / 'audio'
    if not audio.is_dir():
        sys.exit(f'音声ディレクトリが見つかりません: {audio}')

    for cand in (root / 'assets' / 'dictionary.json',
                 root / 'dictionary.json',
                 root / 'dictionary.pretty.json'):
        if cand.is_file():
            return audio, cand
    sys.exit('dictionary.json が見つかりません')


def load_valid_ids(dict_path: Path) -> set:
    data = json.loads(dict_path.read_text(encoding='utf-8'))
    return {e['id'] for e in data['entries']}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--apply', action='store_true', help='実際にファイルを変更する')
    ap.add_argument('--root', default='.', help='リポジトリのルート（既定: カレント）')
    args = ap.parse_args()

    root = Path(args.root).resolve()
    audio, dict_path = find_paths(root)
    valid_ids = load_valid_ids(dict_path)

    print(f'音声      : {audio}')
    print(f'辞書      : {dict_path}  （{len(valid_ids)} 件の id）')
    print()

    # --- 対象ファイルの収集 ---
    shift = []   # (num, path)
    branch_after_pivot = []
    total = 0

    for p in sorted(audio.glob(f'n-*{EXT}')):
        m = FNAME_RE.match(p.stem)
        if not m:
            print(f'  ⚠ 想定外のファイル名を無視: {p.name}')
            continue
        total += 1
        num, suffix = int(m.group(1)), m.group(2)
        if num < PIVOT:
            continue
        if suffix:
            branch_after_pivot.append(p.name)
            continue
        shift.append((num, p))

    if branch_after_pivot:
        sys.exit('中断: n-%04d 以降に枝番ファイルがあります → %s\n'
                 '番号 +1 では正しくずらせません。' % (PIVOT, branch_after_pivot))

    if not shift:
        sys.exit(f'中断: n-{PIVOT:04d} 以降の音声ファイルが1つもありません。')

    source = audio / f'{SOURCE_ID}{EXT}'
    if not source.is_file():
        sys.exit(f'中断: {source.name} が見つかりません。')

    shift.sort(reverse=True)  # 降順に処理して上書きを避ける
    lo, hi = shift[-1][0], shift[0][0]

    # --- 事前検証 ---
    last_target = f'n-{hi + 1:04d}'
    if last_target not in valid_ids:
        sys.exit(f'中断: 移動先の {last_target} が辞書に存在しません。'
                 f'（末尾がはみ出します）')

    missing = [n for n in range(lo, hi + 1)
               if not (audio / f'n-{n:04d}{EXT}').is_file()]
    if missing:
        print('⚠ 連番に穴があります。ずれ方が一様でない可能性があります:')
        print('   ', ', '.join(f'n-{n:04d}' for n in missing[:20]))
        print('   （合計 %d 件）' % len(missing))
        print()

    dup = audio / f'n-{PIVOT:04d}{EXT}'
    print(f'音声ファイル総数        : {total}')
    print(f'ずらす範囲              : n-{lo:04d} 〜 n-{hi:04d}  （{len(shift)} 件）')
    print(f'ずらした後の末尾        : {last_target}{EXT}')
    print(f'{SOURCE_ID}{EXT} を移す先 : {dup.name}')
    print()

    if not args.apply:
        print('--- ドライラン（変更していません）---')
        for num, p in shift[:3]:
            print(f'  {p.name}  →  n-{num + 1:04d}{EXT}')
        print('  ...')
        for num, p in shift[-3:]:
            print(f'  {p.name}  →  n-{num + 1:04d}{EXT}')
        print(f'  {source.name}  →  {dup.name}')
        print()
        print('問題なければ --apply を付けて再実行してください。')
        return

    # --- 実行 ---
    for num, p in shift:
        dest = audio / f'n-{num + 1:04d}{EXT}'
        if dest.exists():
            sys.exit(f'中断: {dest.name} が既に存在します。処理を止めました。')
        p.rename(dest)

    shutil.move(str(source), str(dup))

    print(f'完了: {len(shift)} 件をリネーム、{SOURCE_ID} の録音を n-{PIVOT:04d} へ移しました。')
    print()
    print('次にこれを実行してください:')
    print('    python3 tools/gen_word_audio.py')


if __name__ == '__main__':
    main()
