from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .models import Post
from .schemas import PostCreate
from .services.posts import create_post


def _thread(
    session: Session,
    *,
    author: str,
    channel: str,
    body: str,
    at: datetime,
    replies: list[tuple[str, str]],
) -> None:
    root = create_post(
        session,
        PostCreate(author=author, channel=channel, body=body),
        created_at=at,
    )
    parent_id = root.id
    t = at
    for ra, rb in replies:
        t += timedelta(minutes=6)
        msg = create_post(
            session,
            PostCreate(
                author=ra,
                channel=channel,
                body=rb,
                parent_post_id=parent_id,
            ),
            created_at=t,
        )
        parent_id = msg.id


def seed_demo_data(session: Session) -> None:
    existing_posts = session.scalar(select(func.count(Post.id)))
    if existing_posts:
        return

    t0 = datetime(2026, 4, 9, 1, 0, tzinfo=timezone.utc)

    create_post(
        session,
        PostCreate(
            author="ryohei",
            channel="/general",
            body="# mdchat-space へようこそ\n\nこのシステムでは投稿本文を Markdown ファイルとして保存します。UI がなくなっても会話は残ります。",
        ),
        created_at=t0,
    )

    # --- /general（複数スレッド）---
    _thread(
        session,
        author="yuki",
        channel="/general",
        body="# 今週の OSS リリース観測\n\n**Releases / Security** を先に読むコツ、SBOM の差分の残し方。",
        at=t0 + timedelta(minutes=5),
        replies=[
            ("ken", "**Watch は Releases only**。**Dependabot の CVE リンク** から辿ると早いです。"),
            ("mika", "パッチ適用順は **チケットに書いてからマージ** のルールにしました。"),
        ],
    )
    _thread(
        session,
        author="aya",
        channel="/general",
        body="# ライセンス変更の切り分け\n\nどのバイナリに何のライセンスが乗るかを **表** にすると議論がズレにくい。",
        at=t0 + timedelta(minutes=25),
        replies=[
            ("jun", "SPDX と `NOTICE` の **社内テンプレ** を法務と共有しています。"),
        ],
    )
    _thread(
        session,
        author="sota",
        channel="/general",
        body="# CI: main 直コミット禁止\n\n**PR 必須**、**squash merge**、緊急時の bypass ルール。",
        at=t0 + timedelta(minutes=45),
        replies=[
            ("rina", "**Revert PR** の手順は runbook にリンクしています。"),
        ],
    )
    _thread(
        session,
        author="marin",
        channel="/general",
        body=(
            "# AI の分類: フィジカル vs ノン・フィジカル\n\n"
            "「AI とロボティクス」より、**現実世界と観測・行動で閉ループするか**で切ると、要件と失敗モードの話が噛み合いやすい。\n\n"
            "- **フィジカル AI**: ロボ、組み込み、ライン制御、一部ウェアラブル\n"
            "- **ノン・フィジカル AI**: LLM エージェント、推薦、コード支援など"
        ),
        at=t0 + timedelta(minutes=65),
        replies=[
            (
                "ken",
                "補助軸は **エッジ／クラウド** と **シミュ↔実機**。ロボはフィジカル側の実装の一種に寄せている。",
            ),
            (
                "tomo",
                "境界はグラデーション。**API 越しに現場デバイスを動かす**ときはラベルを一度チームで固定した。",
            ),
        ],
    )

    # --- /dev/backend ---
    api_thread_root = create_post(
        session,
        PostCreate(
            author="mika",
            channel="/dev/backend",
            body="API の後方互換とログ設計についてのスレッドです。\n\nメジャーバージョンを上げるときの移行期間と、フィールド廃止の案内の出し方を整理したいです。",
        ),
        created_at=t0 + timedelta(minutes=20),
    )
    create_post(
        session,
        PostCreate(
            author="takumi",
            channel="/dev/backend",
            parent_post_id=api_thread_root.id,
            body="リクエストIDをログに載せて、同じユーザーセッションを追いやすくしたいです。保存期間は本番と検証で分けたほうが安全だと思います。",
        ),
        created_at=t0 + timedelta(minutes=30),
    )
    create_post(
        session,
        PostCreate(
            author="ryohei",
            channel="/dev/backend",
            parent_post_id=api_thread_root.id,
            body="賛成です。`/dev/backend/observability` チャンネルを切って、チェックリストを Markdown テンプレ化すると運用しやすいと思います。",
        ),
        created_at=t0 + timedelta(minutes=45),
    )

    _thread(
        session,
        author="kenta",
        channel="/dev/backend",
        body="# レート制限とログの切り出し\n\nまず **ステータス行** だけ抜くと追跡が速い。",
        at=t0 + timedelta(minutes=55),
        replies=[
            ("dai", "**Retry-After** をテーブルにして README へ。"),
            ("nao", "サーキットブレーカーの **半開** メトリクスを Grafana に。"),
        ],
    )
    _thread(
        session,
        author="eri",
        channel="/dev/backend",
        body="# DB マイグレーションのレビュー\n\n**ロック時間** とバックフィルの **バッチサイズ**。",
        at=t0 + timedelta(minutes=75),
        replies=[
            ("tomo", "大規模テーブルは **オンライン DDL** の可否を先に確認。"),
        ],
    )
    _thread(
        session,
        author="meilen",
        channel="/dev/backend",
        body="# キャッシュ TTL の階層\n\n読み多・整合性クリティカルで **Redis 層** を分ける。",
        at=t0 + timedelta(minutes=95),
        replies=[
            ("mika", "Invalidate は **イベント** + 定期フル同期のハイブリッド。"),
        ],
    )

    # --- /ops/announcements ---
    create_post(
        session,
        PostCreate(
            author="sora",
            channel="/ops/announcements",
            body="今週からチャット内容はそのまま知識ベースになります。あとで読める Markdown を意識して、結論と前提を本文に残してください。",
        ),
        created_at=t0 + timedelta(minutes=60),
    )
    _thread(
        session,
        author="jun",
        channel="/ops/announcements",
        body="# メンテナンス予告（テンプレ）\n\n**UTC 日時**・影響範囲・ロールバック方針。",
        at=t0 + timedelta(minutes=110),
        replies=[
            ("aya", "読み取り専用モード **判定条件** を追記しました。"),
        ],
    )
    _thread(
        session,
        author="rina",
        channel="/ops/announcements",
        body="# バックアップ保持期間の変更\n\n法務確認済み。**リストア演習** は来週。",
        at=t0 + timedelta(minutes=130),
        replies=[],
    )

    # --- /product/roadmap, /dev/docs, /ops/runbook ---
    _thread(
        session,
        author="aya",
        channel="/product/roadmap",
        body="# 今四半期のリリース方針\n\n破壊的変更は **リリースノート冒頭**。**ログ後方互換** は同ファイルの運用節へ。",
        at=t0 + timedelta(minutes=70),
        replies=[
            ("kenta", "顧客向け **メール草案** は別チャンネルでレビュー。"),
        ],
    )
    _thread(
        session,
        author="tomo",
        channel="/product/roadmap",
        body="# 機能フラグ廃止スケジュール\n\n**強制オン日** とメトリクス閾値。",
        at=t0 + timedelta(minutes=88),
        replies=[
            ("dai", "オフに戻す手順も **同じ表** に。"),
        ],
    )
    _thread(
        session,
        author="nao",
        channel="/product/roadmap",
        body="# モバイル β のロードマップ\n\n**オフライン** と **プッシュ** の段階リリース。",
        at=t0 + timedelta(minutes=105),
        replies=[],
    )

    _thread(
        session,
        author="kenta",
        channel="/dev/docs",
        body="# API リファレンスとログの例\n\nエンドポイントごとに **リクエスト例** と **失敗時ログコード** を表で。",
        at=t0 + timedelta(minutes=80),
        replies=[
            ("eri", "**4xx/5xx** で「ユーザー向け表示」「内部メモ」を分離。"),
        ],
    )
    _thread(
        session,
        author="sota",
        channel="/dev/docs",
        body="# 認証フロー（Mermaid）\n\n**トークン寿命** とクロックスキュー注意。",
        at=t0 + timedelta(minutes=100),
        replies=[
            ("yuki", "OpenAPI **example** と双方向同期の運用メモ。"),
        ],
    )
    _thread(
        session,
        author="mika",
        channel="/dev/docs",
        body="# エラーコード命名規約\n\n`ERR_*` と **HTTP ステータス** のマッピング表。",
        at=t0 + timedelta(minutes=118),
        replies=[],
    )

    _thread(
        session,
        author="jun",
        channel="/ops/runbook",
        body="# 障害時ファーストレスポンス\n\n**ログをそのまま貼る**。**リリース直後** はログレベル runbook へ。",
        at=t0 + timedelta(minutes=90),
        replies=[
            ("marin", "**ステークホルダー通知** テンプレは status@ 下書き。"),
        ],
    )
    _thread(
        session,
        author="dai",
        channel="/ops/runbook",
        body="# 証明書更新 Runbook\n\n**90/30/7 日** アラートと確認コマンド。",
        at=t0 + timedelta(minutes=102),
        replies=[
            ("takumi", "社内 CA と **Let’s Encrypt** で手順分岐。"),
        ],
    )
    _thread(
        session,
        author="rina",
        channel="/ops/runbook",
        body="# 依存サービス障害時の降格モード\n\n**フラグ** と **キャッシュ TTL** の緊急値。",
        at=t0 + timedelta(minutes=120),
        replies=[],
    )

    # --- /oss/news ---
    _thread(
        session,
        author="marin",
        channel="/oss/news",
        body="# OSS 短報の書き方\n\n**CHANGELOG 一行** + **リリース日** + セキュリティ有無。",
        at=t0 + timedelta(minutes=40),
        replies=[
            ("eri", "CVE は **GHSA リンク** も貼る。"),
        ],
    )
    _thread(
        session,
        author="aya",
        channel="/oss/news",
        body="# メジャーアップ検知の運用\n\n**Renovate グループ** と週次レビュー。",
        at=t0 + timedelta(minutes=68),
        replies=[
            ("ken", "Breaking は **マイグレーション章リンク** を PR に。"),
        ],
    )
    _thread(
        session,
        author="meilen",
        channel="/oss/news",
        body="# メンテナンスモード宣言の増加\n\n**アーカイブ方針** と推奨フォークの確認項目。",
        at=t0 + timedelta(minutes=92),
        replies=[],
    )

    create_post(
        session,
        PostCreate(
            author="meilen",
            channel="/general",
            body="雑談: 外部 API のレート制限に引っかかったとき、**どのログ項目を見るか** で迷子になりがち。リトライ回数とレスポンス本文だけ最初にメモしてから深掘りしたいです。",
        ),
        created_at=t0 + timedelta(minutes=100),
    )
