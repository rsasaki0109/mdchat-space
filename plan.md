# mdchat-space Handoff Plan

## 目的

このファイルは、`mdchat-space` の現状を Cursor に引き継ぐための handoff 用ドキュメントです。

このプロジェクトの最重要原則は変えてはいけません。

- 本文の正本は必ず Markdown ファイル
- UI は API クライアントでしかない
- export を常に保証する
- データ構造は単純で、人間が直接読める

この原則を壊す変更は、たとえ機能追加のためでも避けるべきです。

---

## 現在の状態

現時点で MVP は一通り実装済みです。

### 実装済み

- FastAPI バックエンド
- PostgreSQL メタ情報管理
- Markdown ファイル永続化
- チャンネル階層
- 投稿作成
- スレッド取得
- AI 要約 API
- AI 返信生成 API
- AI 検索 API
- Markdown export
- JSON export
- Next.js UI

### 動作確認済み

以下はローカルで実際に確認済みです。

- `npm run build:web`
- `.venv/bin/python -m compileall apps/api/app`
- `GET /health`
- `GET /channels/tree`
- `GET /posts?channel=...`
- `POST /posts`
- `GET /thread/{id}`
- `POST /ai/summarize`
- `POST /ai/reply`
- `POST /ai/search`
- `GET /export/json`
- `GET /export/md`

### 未着手 / 保留

- README に UI スクリーンショットを貼る作業
- E2E テスト
- API / UI の自動テスト
- Docker 化の本格整備
- 認証
- 外部 LLM / embedding provider 差し替え

---

## リポジトリ構成

```text
mdchat-space/
  apps/
    api/
      app/
        config.py
        db.py
        main.py
        models.py
        schemas.py
        seed.py
        services/
          ai.py
          channels.py
          markdown_store.py
          posts.py
          search.py
      requirements.txt
    web/
      app/
        globals.css
        layout.tsx
        page.tsx
      components/
        channel-sidebar.tsx
        composer.tsx
        dashboard.tsx
        post-list.tsx
        thread-panel.tsx
      lib/
        api.ts
        types.ts
      package.json
  data/
    channels/
  docker-compose.yml
  README.md
  plan.md
```

---

## 設計の要点

## 1. データの正本

投稿本文の正本は `data/channels/.../*.md` です。

メタ情報は PostgreSQL にありますが、これは検索性と UI 応答を良くするための補助データであり、本文の所有権は Markdown 側にあります。

Markdown は front matter + 本文です。

例:

```md
---
id: ce66d183-f81b-4ac4-ae0c-eaee68dfbd3d
author: tester
channel: /research/rag
timestamp: '2026-04-09T06:34:14.327802+00:00'
thread_root_id: ce66d183-f81b-4ac4-ae0c-eaee68dfbd3d
parent_post_id: null
---

# RAG メモ

Markdown をそのまま検索対象にしたいです。
```

## 2. DB の責務

DB は以下を持ちます。

- チャンネルパス
- 親チャンネル
- 投稿 ID
- 投稿者
- チャンネル所属
- 親投稿 ID
- スレッド root ID
- Markdown ファイルパス
- 抜粋
- 作成時刻 / 更新時刻

DB には本文そのものを持たせていません。

## 3. AI 機能の位置づけ

AI は今のところ軽量な暫定実装です。

- 要約: スレッド参加者、主要キーワード、先頭文から構成
- 返信生成: スレッドの直近流れから返答テンプレート生成
- 検索: キーワード一致 + 簡易ベクトル類似度

重要なのは、AI の実装は差し替え可能でも保存形式は固定、という点です。

---

## バックエンド詳細

## 主要ファイル

- `apps/api/app/main.py`
  - FastAPI エントリ
  - ルーティング
  - startup 時の DB 初期化
  - seed 実行

- `apps/api/app/models.py`
  - `Channel`
  - `Post`

- `apps/api/app/services/markdown_store.py`
  - Markdown front matter 書き出し
  - Markdown 読み出し
  - excerpt 生成

- `apps/api/app/services/posts.py`
  - 投稿作成
  - スレッド取得
  - export 用投稿収集

- `apps/api/app/services/channels.py`
  - チャンネル階層の自動生成
  - チャンネルツリー組み立て

- `apps/api/app/services/search.py`
  - 簡易 embedding
  - cosine 類似度
  - lexical score

- `apps/api/app/services/ai.py`
  - 要約文生成
  - 返信文生成
  - 検索結果の説明文生成

## 現在の API 一覧

### 通常 API

- `GET /health`
- `GET /channels/tree`
- `GET /posts?channel=/path`
- `POST /posts`
- `GET /thread/{thread_id}`

### AI API

- `POST /ai/summarize`
- `POST /ai/reply`
- `POST /ai/search`

### Export API

- `GET /export/md`
- `GET /export/json`

## seed データ

startup 時に `SEED_DEMO_DATA=true` ならデモデータが入ります。

今の seed には以下があります。

- `/general`
- `/dev/backend`
- `/ops/announcements`

このおかげで UI 起動直後に最低限のデータが見えます。

---

## フロントエンド詳細

## 主要ファイル

- `apps/web/components/dashboard.tsx`
  - 画面全体の状態管理
  - API 呼び出し
  - 投稿作成
  - 返信投稿
  - AI 要約 / 返信 / 検索

- `apps/web/components/channel-sidebar.tsx`
  - チャンネルツリー表示

- `apps/web/components/post-list.tsx`
  - スレッド一覧表示

- `apps/web/components/thread-panel.tsx`
  - スレッド本文
  - AI 要約表示
  - 返信生成表示
  - 返信フォーム

- `apps/web/components/composer.tsx`
  - 新規投稿フォーム

- `apps/web/lib/api.ts`
  - API クライアント

## UI の現在の特徴

- 左: チャンネル階層
- 中: 新規投稿フォーム + スレッド一覧
- 右: スレッドビュー + AI 補助

UI は MVP としては十分ですが、まだ以下の粗さがあります。

- 初回表示時に自動で最初のスレッドを開かない
- README 用スクリーンショットが未掲載
- スレッドが長いと情報密度が高い
- test id や E2E 向け整備がまだない

---

## 直近でやるべきこと

優先度順です。

## P0

### 1. README に UI スクリーンショットを追加

理由:

- OSS として見た目が伝わらない
- GitHub 上で第一印象が弱い
- 今の UI は十分見せられる段階にある

実施方針:

- `docs/screenshots/` を作る
- UI をローカル起動して実スクショを撮る
- `README.md` の上部に `## UI Preview` を追加
- 画像を 1 枚または 2 枚貼る

推奨:

- 1 枚目: 全体ダッシュボード
- 2 枚目: スレッドを開いた状態 + AI 要約表示

補足:

- 今はまだこの作業はやっていない
- Playwright 等で自動生成できる状態にしておくと再撮影が楽

### 2. UI の初期体験を改善

理由:

- 初回表示で右ペインが空になる
- README スクショも映えにくい

推奨対応:

- 初回ロード時に最初のスレッドを自動選択
- チャンネル切り替え時も、対象チャンネルに root 投稿があれば自動選択

## P1

### 3. API テスト追加

最低限ほしいもの:

- post 作成時に Markdown が生成される
- thread_root_id が正しく維持される
- export/json が期待フォーマットを返す
- export/md が zip を返す
- ai/search が最低限ヒットする

### 4. UI テスト追加

最低限ほしいもの:

- チャンネルツリーが描画される
- 投稿一覧が描画される
- 投稿作成が成功する
- 要約ボタンで要約が表示される

## P2

### 5. AI 実装の差し替え可能化

今はローカル heuristic 実装だが、将来的には以下に差し替えたい。

- OpenAI API
- ローカル LLM
- pgvector / 外部 vector DB

ただし、このときも Markdown-first を壊してはいけない。

AI の責務は「本文を便利に読むこと」であり、「本文の正本になること」ではない。

---

## Cursor に渡すときの最初の作業順

Cursor にはまず以下の順で作業させるのが良いです。

1. `README.md` に UI Preview セクションを追加する
2. `docs/screenshots/` を作成する
3. UI 初期表示で最初のスレッドを自動選択する
4. Playwright 等でスクリーンショットを撮る
5. README に画像を貼る
6. 可能なら撮影スクリプトを `scripts/` に残す

---

## Cursor への具体的な依頼文

以下をそのまま Cursor に投げれば作業に入りやすいです。

```md
mdchat-space の handoff です。

前提:
- 本文の正本は Markdown ファイル
- UI は API クライアント
- export を壊さない
- 保存形式を複雑化しない

まずは README を強くしてください。

やってほしいこと:
1. UI の初回表示で最初のスレッドが自動で開くようにする
2. README に載せるための UI スクリーンショットを撮る
3. `docs/screenshots/` に画像を書き出す
4. `README.md` の上部に UI Preview セクションを追加して画像を貼る
5. 可能なら再撮影用の簡単なスクリプトも追加する

制約:
- Markdown-first 原則は壊さない
- UI とデータを密結合しない
- 読みやすさ優先
- 変更は小さく、意図が明確な形にする
```

---

## 起動コマンド

## API

```bash
cp .env.example .env
python3 -m venv .venv
source .venv/bin/activate
pip install -r apps/api/requirements.txt
docker compose up -d
cd apps/api
uvicorn app.main:app --reload --port 8000
```

## Web

```bash
cp apps/web/.env.local.example apps/web/.env.local
npm install
npm run dev:web
```

---

## 注意事項

### 1. ローカル環境では 8000 番が埋まっていることがある

その場合は API を `8010` などで起動し、`apps/web/.env.local` の `NEXT_PUBLIC_API_BASE_URL` を合わせること。

### 2. export 系は壊しやすい

保存形式やレスポンス形式を変えると README / 今後のインポータ設計に影響するので、変更時は慎重に。

### 3. 本文は DB に入れない

ここを崩すと、このプロジェクトの思想が崩れる。

### 4. 今はテストがない

今後の変更で壊れやすいので、P1 で補うべき。

---

## 追加で将来検討してよいこと

- 投稿編集 API
- 投稿削除 API
- チャンネル作成 / リネーム API
- Markdown 添付ファイル設計
- OpenAI / local LLM 切替
- 検索結果のスレッド単位集約
- スレッド要約の保存
- RSS / static export

ただし、何を足しても「会話が Markdown ファイルとして残る」という核は維持すること。

---

## handoff 結論

今の `mdchat-space` は、MVP としてはすでに動いています。

次にやるべきことは「機能を増やすこと」よりも、

- README の見栄えを上げる
- UI の初回体験を改善する
- 最低限の自動テストを入れる

です。

次の担当者は、まず README スクリーンショット対応から始めるのが最も費用対効果が高いです。
