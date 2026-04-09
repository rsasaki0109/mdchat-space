# mdchat-space

**Languages:** [English README](README.md) · 日本語（このファイル）

`mdchat-space` は、小規模コミュニティ向けの Markdown-first OSS チャットです。

- 本文は必ず `.md` として保存
- UI は API のクライアントに徹する
- いつでも Markdown / JSON で持ち出せる
- UI が消えても、会話はファイルとして残る

このプロジェクトの中心は「チャットを囲い込むこと」ではなく、「会話を長く使える資産にすること」です。

**GitHub の About 欄**（Description / Topics / Social preview）の推奨文と `gh` 例は、[`.github/ABOUT.md`](.github/ABOUT.md) にまとめています。

API 付きの UI は既定 **日本語**です。英語は **`/en/`** または **`?lang=en`**（例: `http://localhost:3000/en/`）。**GitHub Pages の静的デモ**は **`/ja/`** / **`/en/`** を主入り口とし、ルート **`/`** は言語選択ページです。

## UI Preview（日本語）

ダッシュボード全体（チャンネル階層・投稿一覧・スレッド）。

![Dashboard UI（日本語）](docs/screenshots/ja/dashboard.png)

スレッド表示と AI 要約（「要約」ボタン実行後）。

![Thread view with AI summary（日本語）](docs/screenshots/ja/thread-summary.png)

英語版の画面例は [`docs/screenshots/en/`](docs/screenshots/en/) と [English README](README.md) を参照してください。

## GitHub Pages（静的デモ）

API なしの**ブラウザ内デモ**は [`.github/workflows/github-pages-demo.yml`](.github/workflows/github-pages-demo.yml) が Next の静的出力を **`gh-pages` ブランチ**に push して公開します。データはそのタブの `sessionStorage` にだけ残ります。

1. まず `main` をプッシュするか **Deploy Pages demo** を 1 回走らせ、**`gh-pages` ブランチ**ができるのを待つ。
2. **Settings → Pages** で **Source** を **Deploy from a branch**、**Branch** を **`gh-pages`**、フォルダ **`/`** にして Save。
3. 以降はワークフローが `gh-pages` を更新するたびにサイトが更新される。URL 例: `https://rsasaki0109.github.io/mdchat-space/`。
4. **言語別デモ（推奨）:** 日本語 UI は **`/ja/`**、英語 UI は **`/en/`**（それぞれ別の `sessionStorage`）。ルート **`/`** では言語選択。従来どおり **`?lang=ja`** / **`?lang=en`** でも可。

**注意:** いまのワークフローは **`gh-pages` ブランチ公開**用です。Pages の Source を **GitHub Actions** のままにしていると、この方式と食い違います。**Deploy from a branch** に切り替えてください。

ローカルで同じ成果物を試す: `NEXT_PUBLIC_BASE_PATH=/<リポジトリ名> npm run build:demo`（ルート配下に置く場合は `NEXT_PUBLIC_BASE_PATH` は省略）。

## 設計原則

### 1. データ所有

各投稿は Markdown ファイルとして保存されます。本文は普通のテキストエディタで読めます。

例:

```md
---
id: 0f2d7eb9-8a77-40f5-9148-d7c2d4d6f5c4
author: ryohei
channel: /dev/backend
timestamp: 2026-04-09T01:20:00+00:00
thread_root_id: 0f2d7eb9-8a77-40f5-9148-d7c2d4d6f5c4
parent_post_id: null
---

API の後方互換とログ設計について議論するスレッドです。

メジャーバージョンアップ時の移行期間と、フィールド廃止の案内の出し方を整理したいです。
```

保存先はチャンネル階層と一致します。

```text
data/channels/general/...
data/channels/dev/backend/...
data/channels/ops/announcements/...
```

### 2. API ファースト

UI は Next.js ですが、全機能は FastAPI 経由で操作できます。

- `GET /channels/tree`
- `GET /posts?channel=/dev/backend`
- `POST /posts`
- `PATCH /posts/{id}` — 既存 Markdown を書き換えつつ著者・本文を更新
- `DELETE /posts/{id}` — スレッド全体を削除（`id` は **ルート投稿**）
- `GET /thread/{id}`
- `POST /ai/summarize`
- `POST /ai/reply`
- `POST /ai/search`
- `GET /export/md`
- `GET /export/json`

### 3. エクスポート可能

- `GET /export/md`: Markdown データを zip で出力
- `GET /export/json`: チャンネル構造と全投稿を JSON で出力

### 4. シンプル設計

- PostgreSQL はメタ情報だけを持つ
- 本文は Markdown ファイルだけが正本
- 検索は Markdown 本文を直接読む
- AI はローカルな軽量ロジックをデフォルト実装し、外部 LLM は必須にしない

## アーキテクチャ

```text
apps/
  api/    FastAPI + SQLAlchemy
  web/    Next.js + Tailwind CSS
data/
  channels/  Markdown 本文
```

### バックエンド

- FastAPI
- SQLAlchemy
- PostgreSQL
- Markdown front matter 保存
- export / search / AI 補助 API

### フロントエンド

- Next.js App Router
- Tailwind CSS
- サイドバー: チャンネル階層
- メイン: 投稿一覧と新規投稿
- 右ペイン: スレッド、要約、返信生成

### AI 方針

MVP ではロックインを避けるため、外部 LLM 必須にはしていません。

- `POST /ai/search`
  - Markdown 本文に対してキーワード一致 + 簡易ベクトル類似度で検索
- `POST /ai/summarize`
  - スレッドの参加者・主要語・先頭文を使った要約
- `POST /ai/reply`
  - スレッドの流れから返信テンプレートを生成

この実装は差し替え前提です。後から OpenAI やローカル LLM に置き換えても、保存形式は変わりません。

### AI の分類メモ（議論用）

社内やコミュニティでの整理として、「**フィジカル AI** と **ノン・フィジカル AI**」の二分は、「AI とロボティクス」を並べるより議論がズレにくいことがあります。**フィジカル AI** は現実世界と観測・行動で閉ループ（センサ→推論→アクチュエータ：ロボ、組み込み、産業オートメ、一部ウェアラブル等）。**ノン・フィジカル AI** は主に情報空間（LLM エージェント、推薦、コード支援など）。ロボティクスはフィジカル側の実装手法の一種とみなし、**エッジ／クラウド** や **シミュ↔実機** は別軸にすると設計レビューがしやすいです。

## セットアップ

### 1. PostgreSQL（または Docker で API + Web まで）

**PostgreSQL のみ**（API / Web はホストで起動）:

```bash
docker compose up -d postgres
```

**API + Web + PostgreSQL**（Markdown は `channel_data` ボリュームに保存）:

```bash
docker compose up --build -d
```

- UI: `http://localhost:3000`
- API: `http://localhost:8000`

ホストから Docker 内 Postgres に繋ぐ場合の DSN 例: `postgresql+psycopg://mdchat:mdchat@localhost:5433/mdchat`

書き込み保護（任意）: `.env` に `MDCHAT_API_WRITE_KEY`、UI 用に `apps/web/.env.local` の `NEXT_PUBLIC_MDCHAT_WRITE_KEY` を同じ値で設定すると、`/posts` の `POST` / `PATCH` / `DELETE` に `X-API-Key` が必須になります。詳細は `SECURITY.md`。

AI: `AI_BACKEND=heuristic`（既定）または `openai`（`OPENAI_API_KEY` 未配線時はヒューリスティックにフォールバック）。

### 2. API を起動

```bash
cp .env.example .env
python3 -m venv .venv
source .venv/bin/activate
pip install -r apps/api/requirements.txt
cd apps/api
uvicorn app.main:app --reload --port 8000
```

初回起動時に:

- テーブルを自動作成
- `data/channels/` を自動生成
- `SEED_DEMO_DATA=true` のときデモ投稿を自動投入

### 3. Web UI を起動

別ターミナルで:

```bash
cp apps/web/.env.local.example apps/web/.env.local
npm install
npm run dev:web
```

ブラウザ:

- Web UI: `http://localhost:3000`
- API Docs: `http://localhost:8000/docs`

ポート `8000` が埋まっている場合は API を別ポート（例: `8010`）で起動し、`apps/web/.env.local` の `NEXT_PUBLIC_API_BASE_URL` を合わせてください。

### README 用スクショの再生成

PostgreSQL と API を起動した状態で、リポジトリルートから次を実行します（Playwright が **別ポートの Next dev** を立ち上げます）。

```bash
npm install
npm run screenshots:install
npm run screenshots
```

- 画像は `docs/screenshots/ja/` と `docs/screenshots/en/` に上書き保存されます。
- API が `8000` 以外のときは例: `MDCHAT_API_URL=http://127.0.0.1:8010 npm run screenshots`
- すでに `npm run dev:web` を動かしている場合は `MDCHAT_REUSE_WEB=1` を付けるか、一度止めてから実行してください。
- 自前で Web を起動する場合は `MDCHAT_NO_WEB_SERVER=1 MDCHAT_BASE_URL=http://localhost:3000 npm run screenshots`

スレッドが開かず `/thread` が 500 になる場合は、DB に行だけ残って `data/channels/` の Markdown が無い状態のことがあります。その場合は Postgres ボリュームを捨てて API を起動し直すと、シードが Markdown ごと再作成されます（`docker compose down -v` 後に `docker compose up -d`）。

### API テスト（SQLite・ローカルのみ）

開発用依存を入れたうえで、リポジトリルートから実行できます（システムに別の pytest プラグインが入っている場合の衝突を避けるため `PYTEST_DISABLE_PLUGIN_AUTOLOAD` を付けています）。

```bash
source .venv/bin/activate
pip install -r apps/api/requirements-dev.txt
npm run test:api
```

### E2E テスト（Playwright）

PostgreSQL と API を起動した状態で、ルートから `npm run test:e2e` を実行します（API の既定は `http://127.0.0.1:8000`。変更する場合は `MDCHAT_API_URL`）。Playwright は `playwright.config.ts` に従いポート `3030` で Next を起動します（自前の dev サーバを使う場合は `MDCHAT_NO_WEB_SERVER=1` と `MDCHAT_BASE_URL`）。テストは `/health` を確認したうえで **`POST /posts` でシード**し、日本語 UI でチャンネル選択・要約・**AI Summary** 表示まで検証します。GitHub Actions の **`e2e`** ジョブでも同じ手順を実行します（Postgres サービス + uvicorn + Playwright）。

## 実装済み MVP

- チャンネルベースのチャット
- スレッド返信
- ディレクトリ構造のチャンネル
- Markdown 投稿
- 投稿の編集（PATCH）とスレッド削除（DELETE・ルート id）
- 書き込み API の任意キー認証
- キーワード + 簡易 AI 検索
- スレッド要約
- 返信生成
- Markdown / JSON export

## API 例

### 投稿作成

```bash
curl -X POST http://localhost:8000/posts \
  -H "Content-Type: application/json" \
  -d '{
    "author": "ryohei",
    "channel": "/dev/backend",
    "body": "API の互換性ポリシーと、ログに載せる共通フィールドをそろえたいです。"
  }'
```

### AI 検索

```bash
curl -X POST http://localhost:8000/ai/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "API 互換 ログ設計",
    "channel": "/dev"
  }'
```

## なぜこの形か

一般的なチャットは UI が正本になりがちです。このプロジェクトでは逆に、

- 会話 → Markdown ファイルになる
- Markdown ファイル → 検索可能な知識になる
- 知識 → 人間にも AI にも再利用できる

という順序を固定しています。

10 年後に UI を入れ替えても、残るべきものは会話そのものです。
