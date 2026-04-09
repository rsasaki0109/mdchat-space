from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from ..models import Post
from ..schemas import ExportedPost, PostCreate, PostSummary, PostUpdate, ThreadPost, ThreadResponse
from .channels import ensure_channel_hierarchy
from .markdown_store import (
    excerpt_from_body,
    normalize_channel_path,
    read_post_body,
    rewrite_post_markdown,
    unlink_post_markdown,
    write_post_markdown,
)


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


def update_post(session: Session, post_id: str, payload: PostUpdate) -> ThreadPost:
    post = session.get(Post, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="post not found")

    current_body = read_post_body(post.markdown_path)
    new_author = payload.author if payload.author is not None else post.author
    new_body = payload.body if payload.body is not None else current_body

    try:
        rewrite_post_markdown(post.markdown_path, author=new_author, body=new_body)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="markdown file not found") from None

    post.author = new_author
    post.excerpt = excerpt_from_body(new_body)
    post.updated_at = _utc_now()
    session.commit()
    session.refresh(post)
    return thread_post_from_model(post)


def delete_thread(session: Session, thread_root_id: str) -> None:
    root = session.get(Post, thread_root_id)
    if root is None:
        raise HTTPException(status_code=404, detail="post not found")
    if root.parent_post_id is not None:
        raise HTTPException(
            status_code=400,
            detail="DELETE /posts/{id} expects the thread root id; use GET /thread/{any_post_id} to find it",
        )

    posts = session.scalars(select(Post).where(Post.thread_root_id == thread_root_id)).all()
    if not posts:
        raise HTTPException(status_code=404, detail="thread not found")

    paths = [p.markdown_path for p in posts]
    session.execute(delete(Post).where(Post.thread_root_id == thread_root_id))
    session.commit()
    for markdown_path in paths:
        unlink_post_markdown(markdown_path)


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
