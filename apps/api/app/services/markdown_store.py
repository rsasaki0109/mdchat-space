from __future__ import annotations

import re
import unicodedata
from datetime import datetime
from pathlib import Path
from typing import Any

import yaml

from ..config import ROOT_DIR, settings


def normalize_channel_path(path: str) -> str:
    segments = [segment.strip() for segment in path.split("/") if segment.strip()]
    if not segments:
        raise ValueError("channel path must not be empty")
    return "/" + "/".join(segments)


def _slugify(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    normalized = normalized.lower()
    normalized = re.sub(r"[^a-z0-9]+", "-", normalized).strip("-")
    return normalized[:40] or "note"


def excerpt_from_body(body: str, limit: int = 160) -> str:
    compact = " ".join(body.strip().split())
    if len(compact) <= limit:
        return compact
    return compact[: limit - 1].rstrip() + "…"


def _resolve_markdown_path(markdown_path: str) -> Path:
    path = Path(markdown_path)
    if not path.is_absolute():
        path = ROOT_DIR / path
    return path


def _split_front_matter(markdown_text: str) -> tuple[dict[str, Any], str]:
    if not markdown_text.startswith("---\n"):
        return {}, markdown_text.strip()

    closing_index = markdown_text.find("\n---\n", 4)
    if closing_index == -1:
        return {}, markdown_text.strip()

    raw_meta = markdown_text[4:closing_index]
    body = markdown_text[closing_index + len("\n---\n") :]
    metadata = yaml.safe_load(raw_meta) or {}
    return metadata, body.strip()


def read_post_body(markdown_path: str) -> str:
    text = _resolve_markdown_path(markdown_path).read_text(encoding="utf-8")
    _, body = _split_front_matter(text)
    return body


def build_markdown_document(
    *,
    post_id: str,
    author: str,
    channel: str,
    created_at: datetime,
    thread_root_id: str,
    parent_post_id: str | None,
    body: str,
) -> str:
    metadata = {
        "id": post_id,
        "author": author,
        "channel": channel,
        "timestamp": created_at.isoformat(),
        "thread_root_id": thread_root_id,
        "parent_post_id": parent_post_id,
    }
    yaml_text = yaml.safe_dump(metadata, sort_keys=False, allow_unicode=True).strip()
    clean_body = body.strip()
    return f"---\n{yaml_text}\n---\n\n{clean_body}\n"


def write_post_markdown(
    *,
    post_id: str,
    author: str,
    channel: str,
    created_at: datetime,
    thread_root_id: str,
    parent_post_id: str | None,
    body: str,
) -> str:
    channel_path = normalize_channel_path(channel)
    channel_dir = settings.data_dir / channel_path.lstrip("/")
    channel_dir.mkdir(parents=True, exist_ok=True)

    first_line = next((line.strip("# ").strip() for line in body.splitlines() if line.strip()), "post")
    file_name = f"{created_at.strftime('%Y-%m-%d-%H%M%S')}-{_slugify(first_line)}-{post_id[:8]}.md"
    file_path = channel_dir / file_name
    markdown = build_markdown_document(
        post_id=post_id,
        author=author,
        channel=channel_path,
        created_at=created_at,
        thread_root_id=thread_root_id,
        parent_post_id=parent_post_id,
        body=body,
    )
    file_path.write_text(markdown, encoding="utf-8")
    return file_path.relative_to(ROOT_DIR).as_posix()
