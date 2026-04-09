# GitHub の About 欄の設定

GitHub のリポジトリページ右側の **About** は、Web 上の設定のみ反映されます（このファイルは自動同期されません）。次をコピーして貼ると楽です。

## Description（1 行・英語推奨）

```text
Markdown-first self-hosted chat — conversations stored as .md on disk, FastAPI + Next.js, export to Markdown/JSON.
```

短い版:

```text
Markdown-first chat: .md is source of truth; FastAPI + Next.js; Markdown/JSON export.
```

補足（日本語を About に載せたい場合は Website 近くの README 冒頭を参照するだけでも可）:

```text
小規模向け Markdown-first OSS チャット。本文は .md 保存、UI は API クライアント、いつでもエクスポート可能。
```

## Website

デプロイした URL がなければ空欄で問題ありません。ドキュメントのみなら README へのリンクは通常不要です。

## Topics（候補）

GitHub の About で「歯車」→ Topics から追加するか、[GitHub CLI](https://cli.github.com/) なら次のようにまとめて指定できます。

```bash
gh repo edit \
  --description "Markdown-first self-hosted chat — conversations stored as .md, FastAPI + Next.js, Markdown/JSON export." \
  --add-topic markdown --add-topic chat --add-topic fastapi --add-topic nextjs \
  --add-topic postgresql --add-topic sqlalchemy --add-topic tailwindcss \
  --add-topic self-hosted --add-topic export --add-topic oss
```

（すでに付いている topic はエラーになることがあるので、その場合は該当 `--add-topic` だけ外してください。）

## Social preview

リポジトリ **Settings → General → Social preview** で `README` 先頭付近のスクリーンショット（`docs/screenshots/`）を選ぶと、共有時の見え方が良くなります。
