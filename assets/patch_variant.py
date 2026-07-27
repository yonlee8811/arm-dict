#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
patch2: ութանասուն を「規範外だが広く使われる口語形」として正式に収録する
  grammar.html / grammarHtml.ts : 数詞表に併記 + 注記を記述的な文面に差し替え
  dictionary.json               : n-0224c に var / note フィールドを追加
前提: patch_site.py / patch_numbers.py 適用済みのファイルに対して実行する
"""
import io, json, re

# ===============================================================
# 共通パーツ
# ===============================================================

# --- 数詞表 80 行：ութսուն を主、ութանասուն を従として併記 -------
OLD_ROW = (
    '80</td><td style="padding:.3rem .5rem;'
    'border-bottom:1px solid rgba(201,169,110,.07)">'
    '<ruby>ութսուն<rt>ut\'sun</rt></ruby></td>'
)
NEW_ROW = (
    '80</td><td style="padding:.3rem .5rem;'
    'border-bottom:1px solid rgba(201,169,110,.07)">'
    '<ruby>ութսուն<rt>ut\'sun</rt></ruby>'
    '<br><span style="font-size:.72rem;color:var(--muted)">'
    '／<ruby>ութանասուն<rt>ut\'anasun</rt></ruby>（口語）</span></td>'
)

# --- 旧注記（patch1 で入れた規範寄りの文面） ---------------------
OLD_NOTE = (
    '<div style="background:rgba(0,0,0,.06);border-left:2px solid rgba(201,169,110,.3);'
    'padding:.6rem .9rem;margin-bottom:1.5rem;font-size:.79rem;'
    'color:rgba(44,26,14,.75);line-height:1.8">'
    '<strong style="color:var(--gold)">80 のよくある誤用</strong>\u3000'
    '80 を <ruby>ութանասուն<rt>ut\'anasun</rt></ruby> と言う話者は実際に多くいますが、'
    'これは 70 の <ruby>յոթանասուն<rt>yot\'anasun</rt></ruby> からの類推による誤用とされ、'
    'アルメニアの辞書・教科書はいずれも <strong><ruby>ութսուն<rt>ut\'sun</rt></ruby></strong> を正しい形とします。'
    '成分 <ruby>-սուն<rt>-sun</rt></ruby> が「10」を表し、'
    '70 は古典語属格 <ruby>յոթան<rt>yot\'an</rt></ruby>＋連結母音 ա＋սուն、'
    '80 は <ruby>ութ<rt>ut\'</rt></ruby>＋սուն という構成の違いによります。'
    '現地で耳にする形として覚えておくとよいでしょう。</div>'
)

# --- 新注記：記述的な文面（両形を対等に提示し、使い分けを示す） --
NEW_NOTE = (
    '<div style="background:rgba(0,0,0,.06);border-left:2px solid rgba(201,169,110,.3);'
    'padding:.6rem .9rem;margin-bottom:1.5rem;font-size:.79rem;'
    'color:rgba(44,26,14,.75);line-height:1.8">'
    '<strong style="color:var(--gold)">80 には2つの言い方がある</strong>\u3000'
    '80 は <strong><ruby>ութսուն<rt>ut\'sun</rt></ruby></strong> と '
    '<strong><ruby>ութանասուն<rt>ut\'anasun</rt></ruby></strong> の2つの形で言われます。'
    '辞書・教科書・公文書で用いられる規範形は <ruby>ութսուն<rt>ut\'sun</rt></ruby> ですが、'
    '話し言葉では <ruby>ութանասուն<rt>ut\'anasun</rt></ruby> も母語話者に広く使われており、'
    '現地では日常的に耳にします（84 なら <ruby>ութսունչորս<rt>ut\'sunch\'ors</rt></ruby>／'
    '<ruby>ութանասունչորս<rt>ut\'anasunch\'ors</rt></ruby>）。'
    '<ruby>ութանասուն<rt>ut\'anasun</rt></ruby> は 70 の '
    '<ruby>յոթանասուն<rt>yot\'anasun</rt></ruby> からの類推で生じた形で、'
    '規範的には誤りとされます（-<ruby>սուն<rt>sun</rt></ruby> が「10」を表し、'
    '70 は古典語属格 <ruby>յոթան<rt>yot\'an</rt></ruby>＋ա＋սուն、'
    '80 は <ruby>ութ<rt>ut\'</rt></ruby>＋սուն という構成の違いによります）。'
    '<strong>書くときは <ruby>ութսուն<rt>ut\'sun</rt></ruby>、'
    '聞き取りでは両方</strong>を覚えておくと現地で困りません。</div>'
)

report = []

# ===============================================================
# 1) grammar.html / grammarHtml.ts（同一の HTML 断片を共有）
# ===============================================================
for f in ('grammar.html', 'grammarHtml.ts'):
    s = io.open(f, encoding='utf-8').read()
    n0 = len(s)

    assert s.count(OLD_ROW) == 1, '%s: 80 行が 1 件でない (%d)' % (f, s.count(OLD_ROW))
    assert s.count(OLD_NOTE) == 1, '%s: 旧注記が 1 件でない (%d)' % (f, s.count(OLD_NOTE))
    s = s.replace(OLD_ROW, NEW_ROW, 1)
    s = s.replace(OLD_NOTE, NEW_NOTE, 1)

    assert s.count(NEW_ROW) == 1 and s.count(NEW_NOTE) == 1
    assert 'よくある誤用' not in s
    # 見出し(表の主形)は ութսուն のまま、84 の主表記も ութսունչորս のまま
    assert '84:<ruby>ութսունչորս<rt>ut\'sunch\'ors</rt></ruby>' in s
    assert s.count('ութանասունչորս') == 1, '%s: ութանասունչորս は注記内 1 件のみ' % f
    # タグ開閉
    assert s.count('<div') == s.count('</div>')
    assert s.count('<ruby>') == s.count('</ruby>') == s.count('<rt>') == s.count('</rt>')
    assert s.count('<span') == s.count('</span>')
    io.open(f, 'w', encoding='utf-8').write(s)
    report.append((f, n0, len(s)))

# ===============================================================
# 2) dictionary.json : n-0224c に var / note を追加
# ===============================================================
f = 'dictionary.json'
raw = io.open(f, encoding='utf-8').read()
n0 = len(raw)
d = json.loads(raw)
assert json.dumps(d, ensure_ascii=False, separators=(',', ':')) == raw, '整形差異あり'

E = d['entries']
e = next(x for x in E if x['id'] == 'n-0224c')
assert e['arm'] == 'ութսուն' and e['lat'] == 'ut\'sun'
assert 'var' not in e and 'note' not in e, '既に適用済み'

NOTE_JP = (
    '80 には ութսուն と ութանասուն の2つの言い方があります。'
    '規範形は ութսուն ですが、話し言葉では ութանասուն も母語話者に広く使われ、'
    '現地では日常的に耳にします。ութանասուն は 70 の յոթանասուն からの類推で生じた形で、'
    '規範的には誤りとされます。書くときは ութսուն を使い、'
    '聞き取りでは両方を覚えておくと安心です。'
)

# 挿入位置：ex の直後・level の前（既存フィールド順は維持）
new_e = {}
for k, v in e.items():
    new_e[k] = v
    if k == 'ex':
        new_e['var'] = [{
            'arm':   'ութանասուն',
            'lat':   'ut\'anasun',
            'label': '口語',
            'narm':  'ութանասուն',
            'nlat':  'ut\'anasun',
            'nlatl': 'utanasun',      # ' 除去、rr→r（本語は該当なし）
        }]
        new_e['note'] = NOTE_JP
E[E.index(e)] = new_e

out = json.dumps(d, ensure_ascii=False, separators=(',', ':'))

# --- 事後検証 ---
d2 = json.loads(out)
e2 = next(x for x in d2['entries'] if x['id'] == 'n-0224c')
assert e2['arm'] == 'ութսուն' and e2['narm'] == 'ութսուն' and e2['nlatl'] == 'utsun'
assert e2['var'][0]['arm'] == 'ութանասուն' and e2['var'][0]['nlatl'] == 'utanasun'
assert list(e2.keys()).index('var') == list(e2.keys()).index('ex') + 1
assert len(d2['entries']) == 1904 and d2['meta']['entries'] == 1904
assert len(set(x['id'] for x in d2['entries'])) == 1904
# var/note を持つのはこの 1 件だけ
assert sum('var' in x for x in d2['entries']) == 1
assert sum('note' in x for x in d2['entries']) == 1
# 検索キー衝突なし（既存の narm/nlat/nlatl と variant キーが被らない）
for k, val in (('narm','ութանասուն'), ('nlat','ut\'anasun'), ('nlatl','utanasun')):
    assert not any(x[k] == val for x in d2['entries']), '%s=%s が既存見出しと衝突' % (k, val)
# 正書法
for x in d2['entries']:
    for fld in ('arm', 'narm'):
        assert not re.search(r'[\u0400-\u04FF\u0600-\u06FF]', x[fld]), x['id']

io.open(f, 'w', encoding='utf-8').write(out)
report.append((f, n0, len(out)))

print('%-18s %10s %10s' % ('file', 'before', 'after'))
for r in report:
    print('%-18s %10d %10d' % r)
print('OK')
