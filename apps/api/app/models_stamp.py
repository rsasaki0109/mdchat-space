from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, Index, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Stamp(Base):
    __tablename__ = "stamps"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    slug: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    label: Mapped[str] = mapped_column(String(120))
    kind: Mapped[str] = mapped_column(String(16), index=True)  # emoji | image
    emoji_char: Mapped[str | None] = mapped_column(String(8), nullable=True)
    image_relpath: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class PostStampReaction(Base):
    __tablename__ = "post_stamp_reactions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    post_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("posts.id", ondelete="CASCADE"),
        index=True,
    )
    stamp_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("stamps.id", ondelete="CASCADE"),
        index=True,
    )
    actor_key: Mapped[str] = mapped_column(String(64), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    __table_args__ = (
        UniqueConstraint("post_id", "stamp_id", "actor_key", name="uq_post_stamp_actor"),
        Index("ix_post_stamp_post_stamp", "post_id", "stamp_id"),
    )
