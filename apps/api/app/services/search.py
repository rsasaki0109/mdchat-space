from __future__ import annotations

import math
import re
import unicodedata
from collections import Counter

from ..schemas import SearchHit, ThreadPost
from .markdown_store import excerpt_from_body


TOKEN_RE = re.compile(r"[A-Za-z0-9_-]+|[一-龠ぁ-ゔァ-ヴー]+")
STOP_WORDS = {
    "the",
    "and",
    "for",
    "with",
    "that",
    "this",
    "from",
    "です",
    "ます",
    "する",
    "した",
    "して",
    "ある",
    "いる",
    "こと",
    "それ",
    "これ",
}


def normalize_text(text: str) -> str:
    return unicodedata.normalize("NFKC", text).casefold()


def tokenize(text: str) -> list[str]:
    normalized = normalize_text(text)
    return [token for token in TOKEN_RE.findall(normalized) if token not in STOP_WORDS]


def embed(text: str, dimensions: int = 128) -> list[float]:
    vector = [0.0] * dimensions
    frequencies = Counter(tokenize(text))
    for token, count in frequencies.items():
        slot = hash(token) % dimensions
        vector[slot] += float(count)

    norm = math.sqrt(sum(value * value for value in vector))
    if norm == 0:
        return vector
    return [value / norm for value in vector]


def cosine_similarity(left: list[float], right: list[float]) -> float:
    return sum(l * r for l, r in zip(left, right))


def keyword_score(query: str, body: str) -> float:
    query_tokens = set(tokenize(query))
    body_tokens = set(tokenize(body))
    if not query_tokens or not body_tokens:
        return 0.0
    overlap = len(query_tokens & body_tokens)
    return overlap / len(query_tokens)


def phrase_substring_score(query: str, body: str) -> float:
    """How much of the query (whitespace-separated chunks) appears inside the body."""
    raw = query.strip()
    if len(raw) < 1:
        return 0.0
    qn = normalize_text(raw)
    bn = normalize_text(body)
    if len(qn) < 2 and qn not in bn:
        return 0.0
    if qn in bn:
        return 1.0
    parts = [p for p in re.split(r"[\s　]+", qn) if len(p) >= 1]
    if not parts:
        return 0.0
    hits = sum(1 for p in parts if p in bn)
    return hits / len(parts)


def substring_density_score(query: str, body: str) -> float:
    """Soft score when the full normalized query appears as a substring (incl. CJK)."""
    qn = normalize_text(query.strip())
    bn = normalize_text(body)
    if len(qn) < 2:
        return 0.0
    if qn in bn:
        return min(1.0, 0.55 + 0.45 * (len(qn) / max(len(bn), 1)))
    return 0.0


def excerpt_around_match(body: str, query: str, radius: int = 90) -> str:
    """Snippet centered on the first match (NFKC + case-insensitive regex)."""
    raw = query.strip()
    if not raw:
        return excerpt_from_body(body, limit=radius * 2)

    nb = unicodedata.normalize("NFKC", body)
    terms = [raw] + [t for t in re.split(r"[\s　]+", raw) if len(t) >= 1]
    idx = -1
    needle_len = 0
    for term in terms:
        nt = unicodedata.normalize("NFKC", term)
        if len(nt) < 1:
            continue
        m = re.search(re.escape(nt), nb, re.IGNORECASE)
        if m:
            idx = m.start()
            needle_len = max(1, m.end() - m.start())
            break

    if idx < 0:
        return excerpt_from_body(body, limit=radius * 2)

    start = max(0, idx - radius)
    end = min(len(nb), idx + needle_len + radius)
    snippet = nb[start:end].replace("\n", " ").strip()
    prefix = "…" if start > 0 else ""
    suffix = "…" if end < len(nb) else ""
    return prefix + snippet + suffix


def combined_score(query: str, body: str) -> float:
    phrase = phrase_substring_score(query, body)
    sub_d = substring_density_score(query, body)
    lex = keyword_score(query, body)
    sem = cosine_similarity(embed(query), embed(body))

    # Phrase / substring dominate for IME and code-like tokens; semantic ties break lexical ties.
    return (
        phrase * 0.42
        + sub_d * 0.18
        + lex * 0.22
        + sem * 0.18
    )


def search_posts(query: str, posts: list[ThreadPost], limit: int) -> list[SearchHit]:
    scored: list[tuple[float, SearchHit]] = []

    for post in posts:
        score = combined_score(query, post.body)
        if phrase_substring_score(query, post.author) or phrase_substring_score(query, post.channel):
            score = min(1.0, score + 0.1)
        if score <= 0.01:
            continue

        excerpt = excerpt_around_match(post.body, query)
        scored.append(
            (
                score,
                SearchHit(
                    post_id=post.id,
                    channel=post.channel,
                    author=post.author,
                    created_at=post.created_at,
                    excerpt=excerpt,
                    score=round(score, 4),
                ),
            )
        )

    scored.sort(key=lambda item: (-item[0], item[1].created_at))
    return [hit for _, hit in scored[:limit]]
