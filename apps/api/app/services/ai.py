from __future__ import annotations

from collections import Counter
import re

from ..config import settings
from ..schemas import SearchHit, ThreadPost


KEYWORD_RE = re.compile(r"[A-Za-z0-9_/+-]{2,}|[ァ-ヴー]{2,}|[一-龠]{2,}")
GENERIC_KEYWORDS = {"整理", "前提", "必要", "項目", "投稿", "論点", "スレッド", "保存"}


def _top_keywords(posts: list[ThreadPost], limit: int = 5) -> list[str]:
    counter: Counter[str] = Counter()
    for post in posts:
        for token in KEYWORD_RE.findall(post.body):
            normalized = token.lower()
            if normalized in GENERIC_KEYWORDS:
                continue
            if len(normalized) < 2:
                continue
            counter[normalized] += 1

    return [token for token, _ in counter.most_common(limit)]


def _leading_sentences(posts: list[ThreadPost], limit: int = 3) -> list[str]:
    sentences: list[str] = []
    for post in posts:
        chunks = [chunk.strip() for chunk in post.body.replace("\n", " ").split("。") if chunk.strip()]
        if not chunks:
            continue
        sentence = chunks[0]
        if len(sentence) < 10:
            continue
        if sentence not in sentences:
            sentences.append(sentence)
        if len(sentences) >= limit:
            break
    return sentences


def _heuristic_summarize_thread(posts: list[ThreadPost]) -> str:
    participants = sorted({post.author for post in posts})
    keywords = _top_keywords(posts)
    highlights = _leading_sentences(posts)

    lines = [
        "## スレッド要約",
        f"- 投稿数: {len(posts)}",
        f"- 参加者: {', '.join(participants) if participants else 'なし'}",
    ]

    if keywords:
        lines.append(f"- 主要トピック: {', '.join(keywords)}")

    if highlights:
        lines.append("")
        lines.append("## 主要ポイント")
        lines.extend(f"- {sentence}" for sentence in highlights)

    if len(posts) >= 2:
        lines.append("")
        lines.append("## 次に詰めるべきこと")
        lines.append("- 直近の論点を決めるために、前提・制約・次アクションを 1 つずつ明文化すると進めやすいです。")

    return "\n".join(lines)


def _openai_summarize_stub(posts: list[ThreadPost]) -> str | None:
    if settings.ai_backend != "openai":
        return None
    if not settings.openai_api_key:
        return None
    # Wire OpenAI or another provider here; keep Markdown storage unchanged.
    return None


def summarize_thread(posts: list[ThreadPost]) -> str:
    stub = _openai_summarize_stub(posts)
    if stub is not None:
        return stub
    return _heuristic_summarize_thread(posts)


def _heuristic_generate_reply(
    posts: list[ThreadPost],
    instruction: str | None = None,
) -> str:
    keywords = _top_keywords(posts, limit=4)
    last_post = posts[-1] if posts else None

    lines = [
        "以下の形で返すと、議論を前に進めやすいです。",
        "",
        "```md",
        "整理ありがとうございます。次の前提で進めたいです。",
    ]

    if keywords:
        lines.extend(f"- `{keyword}` の評価観点を先に固定する" for keyword in keywords[:2])

    if last_post:
        lines.append(f"- 直近の論点は `{last_post.author}` さんの投稿を起点に切り分ける")

    if instruction:
        lines.append(f"- 補足条件: {instruction.strip()}")

    lines.extend(
        [
            "",
            "必要ならこのスレッドで次を決めませんか？",
            "1. 何を確定事項にするか",
            "2. どこから先を仮説として扱うか",
            "3. 次に検証する項目",
            "```",
        ]
    )
    return "\n".join(lines)


def _openai_reply_stub(posts: list[ThreadPost], instruction: str | None) -> str | None:
    if settings.ai_backend != "openai":
        return None
    if not settings.openai_api_key:
        return None
    return None


def generate_reply(posts: list[ThreadPost], instruction: str | None = None) -> str:
    stub = _openai_reply_stub(posts, instruction)
    if stub is not None:
        return stub
    return _heuristic_generate_reply(posts, instruction)


def answer_search(query: str, hits: list[SearchHit]) -> str:
    if not hits:
        return "該当する Markdown 投稿が見つかりませんでした。別の語に分ける・表記を変える（ひらがな／カタカナ）・チャンネル範囲を広げて再検索してください。"

    lead = hits[0]
    channels = ", ".join(sorted({hit.channel for hit in hits[:5]}))
    score_note = f"（先頭の一致度スコア {lead.score:.2f}）"
    return (
        f"「{query}」に関連しそうな投稿を {len(hits)} 件列挙しました。{score_note} "
        f"主に `{lead.channel}` ほか {channels} にヒットがあります。一覧からスレに飛んで本文を確認してください。"
    )
