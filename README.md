# アルメニア語辞書（東アルメニア語⇔日本語）iOS版

Expo (SDK 54) + React Native + TypeScript。1,898語をオフライン内蔵。

## 構成

```
arm-dict/
├─ app/
│  ├─ _layout.tsx          ルートレイアウト（Stackナビ）
│  ├─ index.tsx            検索画面（方向トグル・品詞フィルタ・結果リスト）
│  └─ entry/[id].tsx       詳細画面（例文・成句・語根・派生・関連語・活用）
├─ lib/
│  ├─ dict.ts              検索エンジン（正規化・双方向・スコア順）※型チェック済
│  └─ useDict.ts           辞書データ読み込み
├─ assets/
│  └─ dictionary.json      辞書データ（1,898語・正規化キー焼き込み済）
├─ package.json
├─ app.json
└─ tsconfig.json
```

## Windows で開発を始める（Mac到着前にここまで進められる）

1. Node.js LTS をインストール（https://nodejs.org）
2. このフォルダで依存をインストール:
   ```
   npm install
   ```
3. 開発サーバを起動:
   ```
   npm start
   ```
4. iPhone に「Expo Go」アプリを入れ、表示されたQRを読む
   → 実機で検索・詳細まで動作確認できる（Mac不要）

## 実装済みの機能

- 双方向検索（アルメニア語→日本語 / 日本語→アルメニア語トグル）
- 4種の入力に対応: アルメニア文字・ラテン転写・日本語・かな
  - ラテンは記号ゆらぎ吸収（grich' でも grich でもヒット）
  - 日本語はカタカナ/ひらがな吸収（ハハ でも はは でもヒット）
- 品詞フィルタ（名詞/動詞/形容詞/…）
- スコア順ソート（完全一致 > 前方一致 > 部分一致）
- 詳細画面: 例文・成句・語根・派生語・関連語（類義/対義）・動詞活用・後置詞の格
- 派生語/関連語はタップで該当語へジャンプ

## Mac 到着後（App Store 提出まで）

1. Xcode を App Store からインストール
2. Apple Developer Program に登録（年 $99）
3. EAS でビルド:
   ```
   npm install -g eas-cli
   eas login
   eas build:configure
   eas build --platform ios
   ```
4. App Store Connect へ提出（`eas submit --platform ios` も可）

## データ更新の流れ

`assets/dictionary.json` が正本。元の8つのJSON（nouns.json 等）を編集したら、
統合スクリプトで dictionary.json を再生成して差し替える。
正規化キー（narm/nlat/nlatl/njp/nyomi）は再生成時に自動で焼き直される。

## 未実装（今後の作り込み候補）

- お気に入り（AsyncStorage は依存に追加済み）
- 検索履歴
- 五十音索引・アルメニア文字索引ブラウズ
- 買い切り課金 or 有料アプリ設定（App Store Connect 側）
