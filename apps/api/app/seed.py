from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .models import Post
from .schemas import PostCreate
from .services.posts import create_post


def seed_demo_data(session: Session) -> None:
    existing_posts = session.scalar(select(func.count(Post.id)))
    if existing_posts:
        return

    base_time = datetime(2026, 4, 9, 1, 0, tzinfo=timezone.utc)

    welcome = create_post(
        session,
        PostCreate(
            author="ryohei",
            channel="/general",
            body="# mdchat-space へようこそ\n\nこのシステムでは投稿本文を Markdown ファイルとして保存します。UI がなくなっても会話は残ります。",
        ),
        created_at=base_time,
    )

    gnss_root = create_post(
        session,
        PostCreate(
            author="mika",
            channel="/dev/gnss",
            body="GNSS の誤差を議論するスレッドです。\n\n都市部でのマルチパスと、低速走行時のふらつきを分けて観測したいです。",
        ),
        created_at=base_time + timedelta(minutes=20),
    )

    create_post(
        session,
        PostCreate(
            author="takumi",
            channel="/dev/gnss",
            parent_post_id=gnss_root.id,
            body="まずはログを `open sky / suburban / urban canyon` に分けて保存したいです。比較の軸が揃うと後で Markdown 検索しやすくなります。",
        ),
        created_at=base_time + timedelta(minutes=30),
    )

    create_post(
        session,
        PostCreate(
            author="ryohei",
            channel="/dev/gnss",
            parent_post_id=gnss_root.id,
            body="賛成です。 `/dev/gnss/log-review` チャンネルを切って、評価観点をテンプレ化すると運用しやすいと思います。",
        ),
        created_at=base_time + timedelta(minutes=45),
    )

    create_post(
        session,
        PostCreate(
            author="sora",
            channel="/ops/announcements",
            body="今週からチャット内容はそのまま知識ベースになります。あとで読める Markdown を意識して、結論と前提を本文に残してください。",
        ),
        created_at=base_time + timedelta(minutes=60),
    )
