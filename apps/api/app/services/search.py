from __future__ import annotations

import math
import re
from collections import Counter

from ..schemas import SearchHit, ThreadPost
from .markdown_store import excerpt_from_body


TOKEN_RE = re.compile(r"[A-Za-z0-9_]+|[一-龠ぁ-ゔァ-ヴー]+")
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


def tokenize(text: str) -> list[str]:
    return [token.lower() for token in TOKEN_RE.findall(text) if token.lower() not in STOP_WORDS]


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
    return len(query_tokens & body_tokens) / len(query_tokens)


def search_posts(query: str, posts: list[ThreadPost], limit: int) -> list[SearchHit]:
    query_embedding = embed(query)
    scored: list[SearchHit] = []

    for post in posts:
        semantic = cosine_similarity(query_embedding, embed(post.body))
        lexical = keyword_score(query, post.body)
        score = (semantic * 0.65) + (lexical * 0.35)
        if score <= 0:
            continue

        scored.append(
            SearchHit(
                post_id=post.id,
                channel=post.channel,
                author=post.author,
                created_at=post.created_at,
                excerpt=excerpt_from_body(post.body, limit=180),
                score=round(score, 4),
            )
        )

    scored.sort(key=lambda item: (item.score, item.created_at), reverse=True)
    return scored[:limit]
