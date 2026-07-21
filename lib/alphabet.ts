// 東アルメニア語 改定正書法 39文字（字母順）
// num は音声ファイル assets/alphabet/{num}.m4a に対応
export type Letter = {
  num: number; up: string; low: string; translit: string;
  name: string; desc: string; example: string; exampleNote: string;
};

export const LETTERS: Letter[] = [
  { num: 1, up: "Ա", low: "ա", translit: "a", name: "Ayb / アイブ", desc: "日本語の「ア」に近い明るい短母音 [a]。語頭・語中・語末すべての位置に現れます。", example: "արև", exampleNote: "arev（太陽）" },
  { num: 2, up: "Բ", low: "բ", translit: "b", name: "Ben / ベン", desc: "日本語の「バ」行の子音 [b]。有声両唇破裂音。英語の \"b\" と同じ。", example: "բարեվ", exampleNote: "barev（こんにちは）" },
  { num: 3, up: "Գ", low: "գ", translit: "g", name: "Gim / ギム", desc: "「ガ」行の [g]。有声軟口蓋破裂音。英語 \"go\" の g と同じ。", example: "գիրք", exampleNote: "girk'（本）" },
  { num: 4, up: "Դ", low: "դ", translit: "d", name: "Da / ダ", desc: "「ダ」行の [d]。有声歯茎破裂音。英語 \"dog\" の d。", example: "դուր", exampleNote: "dur（ドア）" },
  { num: 5, up: "Ե", low: "ե", translit: "ye/e", name: "Yech / イェチ", desc: "語頭では「イェ」[je]、語中・語末では「エ」[e]。二通りの読み方があります。", example: "երեխա", exampleNote: "yerekha（子ども）" },
  { num: 6, up: "Զ", low: "զ", translit: "z", name: "Za / ザ", desc: "「ザ」行の [z]。有声歯茎摩擦音。英語 \"zero\" の z。", example: "զբոսաշրջիկ", exampleNote: "zbosashrjik（観光客）" },
  { num: 7, up: "Է", low: "է", translit: "e", name: "E / エー", desc: "「エ」[ɛ] の広め版。語頭でも「イェ」にはなりません。", example: "է", exampleNote: "e（〜です）" },
  { num: 8, up: "Ը", low: "ը", translit: "ə", name: "Et / エット", desc: "「あいまい母音」シュワ [ə]。口を半開きにして曖昧に「ウ」と発音します。日本語にはない音。", example: "ընկեր", exampleNote: "ənker（友達）" },
  { num: 9, up: "Թ", low: "թ", translit: "t'", name: "T'o / トー", desc: "帯気音 [tʰ]。普通の「タ」より強く息を出して発音します。Տとの対比が重要。", example: "թոռ", exampleNote: "t'orr（孫）" },
  { num: 10, up: "Ժ", low: "ժ", translit: "zh", name: "Zhe / ジェ", desc: "フランス語 \"jour\" の j に相当する音 [ʒ]。口蓋化した摩擦音。", example: "ժամ", exampleNote: "zham（時間）" },
  { num: 11, up: "Ի", low: "ի", translit: "i", name: "Ini / イニ", desc: "日本語「イ」に近い高前舌母音 [i]。英語 \"see\" の母音。", example: "ինձ", exampleNote: "indz（私を）" },
  { num: 12, up: "Լ", low: "լ", translit: "l", name: "Lyun / リュン", desc: "「ラ」行の側音 [l]。舌先を上歯茎に当てる側面音です。", example: "լուսին", exampleNote: "lusin（月）" },
  { num: 13, up: "Խ", low: "խ", translit: "kh", name: "Khe / ヘ", desc: "ドイツ語 \"Bach\" の ch と同じ音 [x]。のどの奥で摩擦させる無声軟口蓋摩擦音。", example: "խաղող", exampleNote: "khaghogh（ぶどう）" },
  { num: 14, up: "Ծ", low: "ծ", translit: "ts", name: "Tsa / ツァ", desc: "「ツ」の子音部分 [ts]。無声歯茎破擦音。Ձとの有声・無声の対比。", example: "ծաղիկ", exampleNote: "tsaghik（花）" },
  { num: 15, up: "Կ", low: "կ", translit: "k", name: "Ken / ケン", desc: "無気音の [k]。英語の k より息が少ない「カ」。Քとの対比（Քは帯気音）が重要。", example: "կին", exampleNote: "kin（妻）" },
  { num: 16, up: "Հ", low: "հ", translit: "h", name: "Ho / ホ", desc: "英語 \"house\" の h と同じ無声声門摩擦音 [h]。", example: "հայ", exampleNote: "hay（アルメニア人）" },
  { num: 17, up: "Ձ", low: "ձ", translit: "dz", name: "Dza / ヅァ", desc: "有声破擦音 [dz]。Ծの有声版。英語 \"adds\" の -ds に相当します。", example: "ձուկ", exampleNote: "dzuk（魚）" },
  { num: 18, up: "Ղ", low: "ղ", translit: "gh", name: "Ghat / ガット", desc: "有声軟口蓋摩擦音 [ɣ]。フランス語の r（草の根 r）に相当。のどをうならせながら出す摩擦音。", example: "ղեկ", exampleNote: "ghek（舵）" },
  { num: 19, up: "Ճ", low: "ճ", translit: "ch", name: "Che / チェ", desc: "無気音の破擦音 [tʃ]。英語 \"church\" の ch より息が少ない「チ」。Չとの対比が重要。", example: "ճանապարհ", exampleNote: "chanaparh（道）" },
  { num: 20, up: "Մ", low: "մ", translit: "m", name: "Men / メン", desc: "両唇鼻音 [m]。日本語「マ」行の子音と同じ。", example: "մայր", exampleNote: "mayr（母）" },
  { num: 21, up: "Յ", low: "յ", translit: "y", name: "Yi / ユ", desc: "半母音 [j]。英語 \"yes\" の y。日本語「ヤ・ユ・ヨ」の最初の音と同じ。", example: "յուղ", exampleNote: "yugh（油）" },
  { num: 22, up: "Ն", low: "ն", translit: "n", name: "Nu / ヌ", desc: "歯茎鼻音 [n]。日本語「ナ」行の子音と同じ。", example: "նոր", exampleNote: "nor（新しい）" },
  { num: 23, up: "Շ", low: "շ", translit: "sh", name: "Sha / シャ", desc: "「シュ」の子音 [ʃ]。英語 \"shoe\" の sh と同じ。", example: "շուն", exampleNote: "shun（犬）" },
  { num: 24, up: "Ո", low: "ո", translit: "vo/o", name: "Vo / ヴォ", desc: "語頭では「ヴォ」[vo]、語中・語末では「オ」[o]。語頭かどうかで発音が変わります。", example: "ոսկոր", exampleNote: "voskor（骨）" },
  { num: 25, up: "Չ", low: "չ", translit: "ch'", name: "Cha / チャ", desc: "帯気音の破擦音 [tʃʰ]。Ճの帯気版。英語 \"church\" の ch に近い。", example: "չոր", exampleNote: "ch'or（乾いた）" },
  { num: 26, up: "Պ", low: "պ", translit: "p", name: "Pe / ペ", desc: "無気音の [p]。英語の p より息が少ない「パ」。Փとの対比が重要。", example: "պանիր", exampleNote: "panir（チーズ）" },
  { num: 27, up: "Ջ", low: "ջ", translit: "j", name: "Je / ジェ", desc: "有声破擦音 [dʒ]。英語 \"jump\" の j と同じ。Ճの有声版。", example: "ջուր", exampleNote: "jur（水）" },
  { num: 28, up: "Ռ", low: "ռ", translit: "rr", name: "Rra / ルラ", desc: "強い巻き舌音（震え音）[r]。スペイン語 \"perro\" のような巻き舌。Ր（弱い r）との対比。", example: "ռադիո", exampleNote: "rradio（ラジオ）" },
  { num: 29, up: "Ս", low: "ս", translit: "s", name: "Se / セ", desc: "「サ」行の無声摩擦音 [s]。英語 \"see\" の s。", example: "սիրտ", exampleNote: "sirt（心臓）" },
  { num: 30, up: "Վ", low: "վ", translit: "v", name: "Vev / ヴェフ", desc: "唇歯摩擦音 [v]。英語 \"voice\" の v。", example: "վարդ", exampleNote: "vard（バラ）" },
  { num: 31, up: "Տ", low: "տ", translit: "t", name: "Te / テ", desc: "無気音の [t]。英語の t より息が少ない「タ」。Թ（帯気版）との対比。", example: "տուն", exampleNote: "tun（家）" },
  { num: 32, up: "Ր", low: "ր", translit: "r", name: "Re / レ", desc: "弱い r 音 [ɾ]。Ռ（強い巻き舌 r）と対比して、こちらはより柔らかい「ラ」行の音。", example: "երկիր", exampleNote: "yerkir（国）" },
  { num: 33, up: "Ց", low: "ց", translit: "ts'", name: "Tso / ツォ", desc: "帯気破擦音 [tsʰ]。Ծの帯気版。息を強く出しながら「ツ」と発音します。", example: "ցավ", exampleNote: "ts'av（痛み）" },
  { num: 34, up: "ու", low: "ու", translit: "u", name: "U / ウ", desc: "「ウ」の母音 [u]。ո(U+0578)＋ւ(U+0582) の組み合わせで一音を表す特殊な文字。英語 \"food\" の oo に近い。", example: "ուտել", exampleNote: "utel（食べる）" },
  { num: 35, up: "Փ", low: "փ", translit: "p'", name: "P'yur / プユル", desc: "帯気音 [pʰ]。Պの帯気版。英語 \"pay\" の p に近い、息を強く出す「パ」。", example: "փող", exampleNote: "p'ogh（お金）" },
  { num: 36, up: "Ք", low: "ք", translit: "k'", name: "K'e / ケ", desc: "帯気音 [kʰ]。Կの帯気版。英語 \"car\" の k に近い、息を強く出す「カ」。", example: "քաղաք", exampleNote: "k'aghak'（都市）" },
  { num: 37, up: "և", low: "և", translit: "ev/yev", name: "Yev / イェフ", desc: "「エヴ」または「エフ」を表す合字。接続詞「〜と」としても使われます。", example: "և", exampleNote: "ev（〜と）" },
  { num: 38, up: "Օ", low: "օ", translit: "o", name: "O / オ", desc: "「オ」[o]。語頭でも「ヴォ」にならない純粋な「オ」。ո（U+0578）が語頭で「ヴォ」になるのに対し、Օ は常に「オ」。", example: "օր", exampleNote: "or（日）" },
  { num: 39, up: "Ֆ", low: "ֆ", translit: "f", name: "Fe / フェ", desc: "「ファ」行の [f]。外来語に多く使われる文字で、古典アルメニア語には存在しなかった。", example: "ֆուտբոլ", exampleNote: "futbol（サッカー）" },
];

// 見出し語の先頭文字マッチ（narm: 小文字化済みアルメニア語）
export function matchesLetter(narm: string, letter: Letter): boolean {
  const p = letter.low;
  if (p === 'ո') return narm.startsWith('ո') && !narm.startsWith('ու');
  return narm.startsWith(p);
}