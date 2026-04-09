from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import Channel, Post
from ..schemas import ChannelNode
from .markdown_store import normalize_channel_path


def ensure_channel_hierarchy(session: Session, channel_path: str) -> None:
    normalized = normalize_channel_path(channel_path)
    segments = [segment for segment in normalized.split("/") if segment]

    current_parts: list[str] = []
    for depth, segment in enumerate(segments, start=1):
        current_parts.append(segment)
        path = "/" + "/".join(current_parts)
        parent_path = "/" + "/".join(current_parts[:-1]) if depth > 1 else None

        existing = session.scalar(select(Channel).where(Channel.path == path))
        if existing is not None:
            continue

        session.add(
            Channel(
                path=path,
                name=segment,
                parent_path=parent_path,
                depth=depth,
            )
        )


def get_channel_tree(session: Session) -> list[ChannelNode]:
    channels = session.scalars(select(Channel).order_by(Channel.depth.asc(), Channel.path.asc())).all()
    counts = {
        path: count
        for path, count in session.execute(
            select(Post.channel_path, func.count(Post.id)).group_by(Post.channel_path)
        ).all()
    }

    nodes_by_path: dict[str, ChannelNode] = {}
    roots: list[ChannelNode] = []

    for channel in channels:
        node = ChannelNode(
            path=channel.path,
            name=channel.name,
            depth=channel.depth,
            post_count=counts.get(channel.path, 0),
            total_post_count=counts.get(channel.path, 0),
            children=[],
        )
        nodes_by_path[channel.path] = node

        if channel.parent_path and channel.parent_path in nodes_by_path:
            nodes_by_path[channel.parent_path].children.append(node)
        else:
            roots.append(node)

    def accumulate(node: ChannelNode) -> int:
        total = node.post_count
        for child in node.children:
            total += accumulate(child)
        node.total_post_count = total
        return total

    for root in roots:
        accumulate(root)

    return roots
