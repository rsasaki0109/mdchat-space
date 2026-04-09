from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Channel(Base):
    __tablename__ = "channels"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    path: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    parent_path: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    depth: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    posts: Mapped[list["Post"]] = relationship(back_populates="channel")


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    author: Mapped[str] = mapped_column(String(120), index=True)
    channel_path: Mapped[str] = mapped_column(
        String(255),
        ForeignKey("channels.path", ondelete="RESTRICT"),
        index=True,
    )
    parent_post_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("posts.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    thread_root_id: Mapped[str] = mapped_column(String(36), index=True)
    markdown_path: Mapped[str] = mapped_column(Text)
    excerpt: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    channel: Mapped["Channel"] = relationship(back_populates="posts")
    parent: Mapped["Post | None"] = relationship(remote_side=[id], backref="replies")

    __table_args__ = (
        Index("ix_posts_channel_thread", "channel_path", "thread_root_id"),
    )
