# mdchat-space

**Languages:** English (this file) · [日本語 README](README.ja.md)

`mdchat-space` is a Markdown-first, self-hosted chat backend and UI for small communities.

- Message bodies are always stored as `.md` files on disk.
- The web UI is a thin API client.
- You can export everything as Markdown (zip) or JSON at any time.
- If the UI goes away, conversations still exist as plain files.

The goal is not to trap chats inside a product, but to keep conversations as durable, portable assets.

For GitHub **About** (description, topics, social preview) and `gh` examples, see [`.github/ABOUT.md`](.github/ABOUT.md).

The UI defaults to **Japanese**. Append **`?lang=en`** to the URL for English labels (for example `http://localhost:3000/?lang=en`).

## UI preview (English)

Full dashboard (channel tree, thread list, composer). Captured with `?lang=en`.

![Dashboard UI (English)](docs/screenshots/en/dashboard.png)

Thread view after **Summarize**.

![Thread view with AI summary (English)](docs/screenshots/en/thread-summary.png)

Japanese screenshots live in [`docs/screenshots/ja/`](docs/screenshots/ja/); see [`README.ja.md`](README.ja.md).

## Design principles

### 1. Data ownership

Each post is a Markdown file with YAML front matter. You can read and edit bodies in any text editor.

Example:

```md
---
id: 0f2d7eb9-8a77-40f5-9148-d7c2d4d6f5c4
author: ryohei
channel: /dev/gnss
timestamp: 2026-04-09T01:20:00+00:00
thread_root_id: 0f2d7eb9-8a77-40f5-9148-d7c2d4d6f5c4
parent_post_id: null
---

GNSS の誤差を議論するスレッドです。

都市部でのマルチパスと、低速走行時のふらつきを分けて観測したいです。
```

On disk, paths mirror channel paths:

```text
data/channels/general/...
data/channels/dev/gnss/...
data/channels/ops/announcements/...
```

### 2. API-first

The UI is Next.js, but every feature is available through the FastAPI HTTP API.

- `GET /channels/tree`
- `GET /posts?channel=/dev/gnss`
- `POST /posts`
- `GET /thread/{id}`
- `POST /ai/summarize`
- `POST /ai/reply`
- `POST /ai/search`
- `GET /export/md`
- `GET /export/json`

### 3. Exportable by design

- `GET /export/md` — zip archive of Markdown under `data/channels/`
- `GET /export/json` — channels tree plus all posts with bodies

### 4. Simple storage model

- PostgreSQL holds metadata (channels, post ids, excerpts, thread structure).
- Markdown files are the **source of truth** for bodies.
- Search reads Markdown content from disk.
- Default “AI” features use small, local heuristics so external LLMs are optional.

## Architecture

```text
apps/
  api/    FastAPI + SQLAlchemy
  web/    Next.js + Tailwind CSS
data/
  channels/  Markdown bodies
```

### Backend

- FastAPI, SQLAlchemy, PostgreSQL
- Posts written as front matter + Markdown body
- Export, search, and lightweight AI helper endpoints

### Frontend

- Next.js App Router, Tailwind CSS
- Left: channel tree
- Center: composer and thread list
- Right: thread reader, summarize, reply draft

### AI (MVP)

To avoid vendor lock-in, external LLMs are not required.

- `POST /ai/search` — keyword matching plus a simple embedding similarity score over Markdown bodies
- `POST /ai/summarize` — heuristics from participants, salient terms, and early lines
- `POST /ai/reply` — template-style reply from recent thread context

These implementations are meant to be swapped later (OpenAI, local LLMs, pgvector, and so on) without changing how posts are stored.

## Setup

### 1. Start PostgreSQL

```bash
docker compose up -d
```

Default DSN: `postgresql+psycopg://mdchat:mdchat@localhost:5433/mdchat`

### 2. Run the API

```bash
cp .env.example .env
python3 -m venv .venv
source .venv/bin/activate
pip install -r apps/api/requirements.txt
cd apps/api
uvicorn app.main:app --reload --port 8000
```

On first startup the API will:

- Create tables
- Ensure `data/channels/` exists
- Seed demo threads when `SEED_DEMO_DATA=true`

### 3. Run the web UI

In another terminal:

```bash
cp apps/web/.env.local.example apps/web/.env.local
npm install
npm run dev:web
```

Open:

- Web UI: `http://localhost:3000`
- API docs: `http://localhost:8000/docs`

If port `8000` is already taken, run the API on another port (e.g. `8010`) and set `NEXT_PUBLIC_API_BASE_URL` in `apps/web/.env.local` to match.

### Regenerate README screenshots

With PostgreSQL and the API running, from the repo root (Playwright starts Next on a separate dev port):

```bash
npm install
npm run screenshots:install
npm run screenshots
```

- Images are written to `docs/screenshots/ja/` and `docs/screenshots/en/` (two locales).
- If the API is not on port 8000: `MDCHAT_API_URL=http://127.0.0.1:8010 npm run screenshots`
- If you already run `npm run dev:web`, stop it or set `MDCHAT_REUSE_WEB=1`, or Playwright’s dev server may conflict.
- To use only your own dev server: `MDCHAT_NO_WEB_SERVER=1 MDCHAT_BASE_URL=http://localhost:3000 npm run screenshots`

If `/thread` returns 500 while the UI loads channels, the database rows may exist without matching Markdown files under `data/channels/`. In that case reset the Postgres volume and restart so seeding recreates files: `docker compose down -v`, then `docker compose up -d`.

### API tests (SQLite, local)

```bash
source .venv/bin/activate
pip install -r apps/api/requirements-dev.txt
npm run test:api
```

`PYTEST_DISABLE_PLUGIN_AUTOLOAD=1` is set in the npm script to avoid broken third-party pytest plugins on some machines.

### E2E tests (Playwright)

With PostgreSQL and the API running, execute `npm run test:e2e` from the repo root (default API `http://127.0.0.1:8000`, override with `MDCHAT_API_URL`). Playwright starts Next.js on port `3030` via `playwright.config.ts` unless `MDCHAT_NO_WEB_SERVER=1` and `MDCHAT_BASE_URL` point at your own dev server. The spec checks `/health`, **seeds a post through `POST /posts`**, then drives the Japanese UI (channel click, summarize, **AI Summary**). CI does not run this job yet; it needs a live API and Postgres.

## MVP feature set

- Channel-based chat and directory-shaped channel paths
- Threaded replies
- Markdown posts
- Keyword + lightweight vector-style search over bodies
- Thread summarize and reply draft helpers
- Markdown zip + JSON export

## API examples

### Create a post

```bash
curl -X POST http://localhost:8000/posts \
  -H "Content-Type: application/json" \
  -d '{
    "author": "ryohei",
    "channel": "/dev/gnss",
    "body": "GNSS の誤差について、都市部のログを先に見たいです。"
  }'
```

### AI search

```bash
curl -X POST http://localhost:8000/ai/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "GNSS 誤差 ログ保存",
    "channel": "/dev"
  }'
```

## Why Markdown-first

Many chat products implicitly treat the UI or vendor cloud as the source of truth. Here the order is fixed:

1. Conversation → Markdown files on disk  
2. Markdown files → searchable, shareable knowledge  
3. Knowledge → reusable for people and tools  

Swap the UI in ten years; what should survive is the conversation archive itself.
