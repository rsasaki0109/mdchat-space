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

    api_thread_root = create_post(
        session,
        PostCreate(
            author="mika",
            channel="/dev/backend",
            body="API の後方互換とログ設計についてのスレッドです。\n\nメジャーバージョンを上げるときの移行期間と、フィールド廃止の案内の出し方を整理したいです。",
        ),
        created_at=base_time + timedelta(minutes=20),
    )

    create_post(
        session,
        PostCreate(
            author="takumi",
            channel="/dev/backend",
            parent_post_id=api_thread_root.id,
            body="リクエストIDをログに載せて、同じユーザーセッションを追いやすくしたいです。保存期間は本番と検証で分けたほうが安全だと思います。",
        ),
        created_at=base_time + timedelta(minutes=30),
    )

    create_post(
        session,
        PostCreate(
            author="ryohei",
            channel="/dev/backend",
            parent_post_id=api_thread_root.id,
            body="賛成です。`/dev/backend/observability` チャンネルを切って、チェックリストを Markdown テンプレ化すると運用しやすいと思います。",
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
