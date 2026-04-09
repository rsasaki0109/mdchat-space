from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import Post
from ..schemas import ExportedPost, PostCreate, PostSummary, ThreadPost, ThreadResponse
from .channels import ensure_channel_hierarchy
from .markdown_store import excerpt_from_body, normalize_channel_path, read_post_body, write_post_markdown


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def create_post(
    session: Session,
    payload: PostCreate,
    *,
    created_at: datetime | None = None,
) -> ThreadPost:
    now = created_at or _utc_now()
    post_id = str(uuid4())
    channel_path = normalize_channel_path(payload.channel)
    parent_id = payload.parent_post_id

    parent_post: Post | None = None
    if parent_id:
        parent_post = session.get(Post, parent_id)
        if parent_post is None:
            raise HTTPException(status_code=404, detail="parent post not found")
        channel_path = parent_post.channel_path

    ensure_channel_hierarchy(session, channel_path)

    thread_root_id = parent_post.thread_root_id if parent_post else post_id
    markdown_path = write_post_markdown(
        post_id=post_id,
        author=payload.author,
        channel=channel_path,
        created_at=now,
        thread_root_id=thread_root_id,
        parent_post_id=parent_id,
        body=payload.body,
    )

    post = Post(
        id=post_id,
        author=payload.author,
        channel_path=channel_path,
        parent_post_id=parent_id,
        thread_root_id=thread_root_id,
        markdown_path=markdown_path,
        excerpt=excerpt_from_body(payload.body),
        created_at=now,
        updated_at=now,
    )
    session.add(post)
    session.commit()
    session.refresh(post)
    return thread_post_from_model(post)


def thread_post_from_model(post: Post) -> ThreadPost:
    return ThreadPost(
        id=post.id,
        author=post.author,
        channel=post.channel_path,
        created_at=post.created_at,
        updated_at=post.updated_at,
        body=read_post_body(post.markdown_path),
        thread_root_id=post.thread_root_id,
        parent_post_id=post.parent_post_id,
        markdown_path=post.markdown_path,
    )


def get_channel_posts(session: Session, channel_path: str) -> list[PostSummary]:
    normalized = normalize_channel_path(channel_path)
    posts = session.scalars(
        select(Post)
        .where(Post.channel_path == normalized, Post.parent_post_id.is_(None))
        .order_by(Post.created_at.desc())
    ).all()

    if not posts:
        return []

    counts = {
        thread_root_id: count
        for thread_root_id, count in session.execute(
            select(Post.thread_root_id, func.count(Post.id))
            .where(Post.thread_root_id.in_([post.id for post in posts]))
            .group_by(Post.thread_root_id)
        ).all()
    }

    return [
        PostSummary(
            id=post.id,
            author=post.author,
            channel=post.channel_path,
            created_at=post.created_at,
            excerpt=post.excerpt,
            reply_count=max(counts.get(post.id, 1) - 1, 0),
            thread_root_id=post.thread_root_id,
            parent_post_id=post.parent_post_id,
        )
        for post in posts
    ]


def get_thread(session: Session, thread_or_post_id: str) -> ThreadResponse:
    seed_post = session.get(Post, thread_or_post_id)
    if seed_post is None:
        raise HTTPException(status_code=404, detail="post not found")

    root_id = seed_post.thread_root_id
    posts = session.scalars(
        select(Post)
        .where(Post.thread_root_id == root_id)
        .order_by(Post.created_at.asc())
    ).all()
    if not posts:
        raise HTTPException(status_code=404, detail="thread not found")

    root = next(post for post in posts if post.id == root_id)
    return ThreadResponse(
        root=thread_post_from_model(root),
        posts=[thread_post_from_model(post) for post in posts],
    )


def get_all_export_posts(session: Session) -> list[ExportedPost]:
    posts = session.scalars(select(Post).order_by(Post.created_at.asc())).all()
    return [
        ExportedPost(
            id=post.id,
            author=post.author,
            channel=post.channel_path,
            parent_post_id=post.parent_post_id,
            thread_root_id=post.thread_root_id,
            created_at=post.created_at,
            updated_at=post.updated_at,
            markdown_path=post.markdown_path,
            body=read_post_body(post.markdown_path),
        )
        for post in posts
    ]


def get_searchable_posts(session: Session, channel_prefix: str | None = None) -> list[ThreadPost]:
    query = select(Post).order_by(Post.created_at.desc())
    if channel_prefix:
        normalized = normalize_channel_path(channel_prefix)
        query = query.where(Post.channel_path.startswith(normalized))

    posts = session.scalars(query).all()
    return [thread_post_from_model(post) for post in posts]
