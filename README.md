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

## GitHub Pages (static demo)

A **browser-only** demo (no API server) is built by [`.github/workflows/github-pages-demo.yml`](.github/workflows/github-pages-demo.yml), which pushes a static export to the **`gh-pages` branch**. Data lives in `sessionStorage` for that tab only.

1. Push to `main` (or run **Deploy Pages demo** once) so the **`gh-pages` branch** is created.
2. **Settings → Pages**: **Source** = **Deploy from a branch**, **Branch** = **`gh-pages`**, folder **`/`**. Save.
3. If you change workflow or assets, re-run the workflow; the site updates on push to `gh-pages`. Public URL: `https://<user>.github.io/<repo>/` (example: `https://rsasaki0109.github.io/mdchat-space/`).
4. English labels: append **`?lang=en`**.

Do **not** set Pages **Source** to **GitHub Actions** for this repo unless you switch the workflow back to `deploy-pages`; mismatch causes deploy errors.

Local build: `NEXT_PUBLIC_BASE_PATH=/<repo> npm run build:demo` (omit `NEXT_PUBLIC_BASE_PATH` for root hosting).

## Design principles

### 1. Data ownership

Each post is a Markdown file with YAML front matter. You can read and edit bodies in any text editor.

Example:

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

On disk, paths mirror channel paths:

```text
data/channels/general/...
data/channels/dev/backend/...
data/channels/ops/announcements/...
```

### 2. API-first

The UI is Next.js, but every feature is available through the FastAPI HTTP API.

- `GET /channels/tree`
- `GET /posts?channel=/dev/backend`
- `POST /posts`
- `PATCH /posts/{id}` — update author/body (rewrites the existing Markdown file)
- `DELETE /posts/{id}` — delete an entire thread (`id` must be the **root** post id)
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

### AI taxonomy (community note)

For internal discussions, a **physical vs non-physical** split is often clearer than lumping “AI” with “robotics” alone: **physical AI** closes the loop with the real world (sense → decide → act: robots, embedded systems, factory automation, and some wearables). **Non-physical AI** stays mainly in the information domain (LLMs, recommender stacks, coding assistants). Robotics is then an implementation family under the physical side, alongside edge/cloud and sim-to-real as separate axes.

## Setup

### 1. Start PostgreSQL (or the full Docker stack)

**PostgreSQL only** (run the API and web on the host):

```bash
docker compose up -d postgres
```

**API + web + PostgreSQL** (all containers; Markdown lives in the `channel_data` volume):

```bash
docker compose up --build -d
```

- UI: `http://localhost:3000`
- API: `http://localhost:8000`

When the API runs on the host against Docker Postgres, default DSN: `postgresql+psycopg://mdchat:mdchat@localhost:5433/mdchat`

Optional write protection: set `MDCHAT_API_WRITE_KEY` in `.env` (and `NEXT_PUBLIC_MDCHAT_WRITE_KEY` in `apps/web/.env.local` for the stock UI). Mutating `POST`/`PATCH`/`DELETE` on `/posts` then require header `X-API-Key` with the same value. See `SECURITY.md`.

AI backends: `AI_BACKEND=heuristic` (default) or `openai` (stub until you wire `OPENAI_API_KEY` in `apps/api/app/services/ai.py`).

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

With PostgreSQL and the API running, execute `npm run test:e2e` from the repo root (default API `http://127.0.0.1:8000`, override with `MDCHAT_API_URL`). Playwright starts Next.js on port `3030` via `playwright.config.ts` unless `MDCHAT_NO_WEB_SERVER=1` and `MDCHAT_BASE_URL` point at your own dev server. The spec checks `/health`, **seeds a post through `POST /posts`**, then drives the Japanese UI (channel click, summarize, **AI Summary**). GitHub Actions runs the same flow in the **`e2e`** job (Postgres service + uvicorn + Playwright).

## MVP feature set

- Channel-based chat and directory-shaped channel paths
- Threaded replies
- Markdown posts
- Edit posts (PATCH) and delete whole threads (DELETE root id)
- Optional API key on write routes
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
    "channel": "/dev/backend",
    "body": "API の互換性ポリシーと、ログに載せる共通フィールドをそろえたいです。"
  }'
```

### AI search

```bash
curl -X POST http://localhost:8000/ai/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "API 互換 ログ設計",
    "channel": "/dev"
  }'
```

## Why Markdown-first

Many chat products implicitly treat the UI or vendor cloud as the source of truth. Here the order is fixed:

1. Conversation → Markdown files on disk  
2. Markdown files → searchable, shareable knowledge  
3. Knowledge → reusable for people and tools  

Swap the UI in ten years; what should survive is the conversation archive itself.
