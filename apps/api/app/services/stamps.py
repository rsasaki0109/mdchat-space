from __future__ import annotations

import re
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from ..config import ROOT_DIR, settings
from ..models import Post
from ..models_stamp import PostStampReaction, Stamp
from ..schemas import StampOut, StampSummary, ThreadPost


SLUG_RE = re.compile(r"^[a-z][a-z0-9-]{1,30}$")


def ensure_builtin_stamps(session: Session) -> None:
    builtins: tuple[tuple[str, str, str], ...] = (
        ("thumbsup", "いいね", "👍"),
        ("heart", "ありがとう", "❤️"),
        ("tada", "お祝い", "🎉"),
        ("eyes", "みて", "👀"),
        ("thinking", "考え中", "🤔"),
        ("raised-hands", "わーい", "🙌"),
        ("rocket", "がんばる", "🚀"),
    )
    for slug, label, emoji in builtins:
        exists = session.scalar(select(Stamp.id).where(Stamp.slug == slug))
        if exists:
            continue
        session.add(
            Stamp(
                id=str(uuid4()),
                slug=slug,
                label=label,
                kind="emoji",
                emoji_char=emoji,
                image_relpath=None,
            ),
        )
    session.commit()


def list_stamps(session: Session) -> list[StampOut]:
    rows = session.scalars(select(Stamp).order_by(Stamp.kind.asc(), Stamp.slug.asc())).all()
    return [stamp_to_out(s) for s in rows]


def stamp_to_out(stamp: Stamp) -> StampOut:
    image_url = f"/stamps/{stamp.id}/image" if stamp.kind == "image" and stamp.image_relpath else None
    return StampOut(
        id=stamp.id,
        slug=stamp.slug,
        label=stamp.label,
        kind=stamp.kind,
        emoji_char=stamp.emoji_char,
        image_url=image_url,
    )


def get_stamp_file_path(stamp: Stamp) -> Path | None:
    if not stamp.image_relpath:
        return None
    path = ROOT_DIR / stamp.image_relpath
    if not path.is_file():
        return None
    return path


def toggle_stamp_reaction(
    session: Session,
    *,
    post_id: str,
    stamp_id: str,
    actor_key: str,
) -> tuple[bool, int]:
    post = session.get(Post, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="post not found")
    stamp = session.get(Stamp, stamp_id)
    if stamp is None:
        raise HTTPException(status_code=404, detail="stamp not found")

    actor = actor_key.strip()[:64] or "guest"
    existing = session.scalar(
        select(PostStampReaction.id).where(
            PostStampReaction.post_id == post_id,
            PostStampReaction.stamp_id == stamp_id,
            PostStampReaction.actor_key == actor,
        )
    )
    if existing:
        session.execute(
            delete(PostStampReaction).where(
                PostStampReaction.post_id == post_id,
                PostStampReaction.stamp_id == stamp_id,
                PostStampReaction.actor_key == actor,
            )
        )
        session.commit()
        active = False
    else:
        session.add(
            PostStampReaction(
                id=str(uuid4()),
                post_id=post_id,
                stamp_id=stamp_id,
                actor_key=actor,
            )
        )
        session.commit()
        active = True

    count = session.scalar(
        select(func.count())
        .select_from(PostStampReaction)
        .where(PostStampReaction.post_id == post_id, PostStampReaction.stamp_id == stamp_id)
    )
    return active, int(count or 0)


def _load_stamp_map(session: Session) -> dict[str, Stamp]:
    rows = session.scalars(select(Stamp)).all()
    return {s.id: s for s in rows}


def attach_stamps_to_posts(
    session: Session,
    posts: list[ThreadPost],
    actor_key: str | None,
) -> list[ThreadPost]:
    if not posts:
        return posts
    post_ids = [p.id for p in posts]
    actor = (actor_key or "").strip()[:64] or None

    count_rows = session.execute(
        select(PostStampReaction.post_id, PostStampReaction.stamp_id, func.count(PostStampReaction.id))
        .where(PostStampReaction.post_id.in_(post_ids))
        .group_by(PostStampReaction.post_id, PostStampReaction.stamp_id)
    ).all()

    counts: dict[tuple[str, str], int] = {}
    for pid, sid, c in count_rows:
        counts[(pid, sid)] = int(c)

    reacted_pairs: set[tuple[str, str]] = set()
    if actor:
        reacted_rows = session.execute(
            select(PostStampReaction.post_id, PostStampReaction.stamp_id).where(
                PostStampReaction.post_id.in_(post_ids),
                PostStampReaction.actor_key == actor,
            )
        ).all()
        reacted_pairs = {(r[0], r[1]) for r in reacted_rows}

    stamp_map = _load_stamp_map(session)
    enriched: list[ThreadPost] = []
    for post in posts:
        summaries: list[StampSummary] = []
        for (pid, sid), cnt in counts.items():
            if pid != post.id or cnt <= 0:
                continue
            st = stamp_map.get(sid)
            if st is None:
                continue
            image_url = f"/stamps/{st.id}/image" if st.kind == "image" and st.image_relpath else None
            summaries.append(
                StampSummary(
                    stamp_id=st.id,
                    slug=st.slug,
                    label=st.label,
                    kind=st.kind,
                    emoji_char=st.emoji_char,
                    image_url=image_url,
                    count=cnt,
                    mine=(actor is not None and (post.id, sid) in reacted_pairs),
                )
            )
        summaries.sort(key=lambda s: (-s.count, s.slug))
        enriched.append(post.model_copy(update={"stamps": summaries}))
    return enriched


def create_image_stamp(
    session: Session,
    *,
    slug: str,
    label: str,
    content_type: str,
    data: bytes,
) -> StampOut:
    if not SLUG_RE.match(slug):
        raise HTTPException(
            status_code=400,
            detail="slug must match ^[a-z][a-z0-9-]{1,30}$",
        )
    slug = slug.lower()
    if session.scalar(select(Stamp.id).where(Stamp.slug == slug)):
        raise HTTPException(status_code=409, detail="stamp slug already exists")

    max_bytes = 512 * 1024
    if len(data) > max_bytes:
        raise HTTPException(status_code=400, detail="image too large (max 512KB)")

    ext_map = {
        "image/png": ".png",
        "image/jpeg": ".jpg",
        "image/gif": ".gif",
        "image/webp": ".webp",
    }
    ext = ext_map.get(content_type.split(";")[0].strip().lower())
    if ext is None:
        raise HTTPException(status_code=400, detail="use png, jpeg, gif, or webp")

    settings.stamps_dir.mkdir(parents=True, exist_ok=True)
    stamp_id = str(uuid4())
    abs_path = settings.stamps_dir / f"{stamp_id}{ext}"
    abs_path.write_bytes(data)
    rel = abs_path.resolve().relative_to(ROOT_DIR.resolve()).as_posix()

    stamp = Stamp(
        id=stamp_id,
        slug=slug,
        label=label.strip()[:120] or slug,
        kind="image",
        emoji_char=None,
        image_relpath=rel,
    )
    session.add(stamp)
    session.commit()
    session.refresh(stamp)
    return stamp_to_out(stamp)
