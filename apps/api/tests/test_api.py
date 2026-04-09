from __future__ import annotations

import json
import zipfile
from io import BytesIO

from app.config import ROOT_DIR


def test_create_post_writes_markdown_file(client):
    res = client.post(
        "/posts",
        json={
            "author": "t",
            "channel": "/pytest/notes",
            "body": "# Hello pytest\n\nbody text for file check.",
        },
    )
    assert res.status_code == 200
    data = res.json()
    rel = data["markdown_path"]
    path = ROOT_DIR / rel
    assert path.is_file()
    text = path.read_text(encoding="utf-8")
    assert "Hello pytest" in text
    assert data["id"] in text


def test_reply_maintains_thread_root_id(client):
    root = client.post(
        "/posts",
        json={"author": "a", "channel": "/pytest/thread", "body": "root post"},
    ).json()
    reply = client.post(
        "/posts",
        json={
            "author": "b",
            "channel": "/pytest/thread",
            "body": "reply text",
            "parent_post_id": root["id"],
        },
    ).json()

    assert reply["thread_root_id"] == root["id"]
    assert reply["thread_root_id"] != reply["id"]

    thread = client.get(f"/thread/{reply['id']}")
    assert thread.status_code == 200
    body = thread.json()
    assert body["root"]["id"] == root["id"]
    assert len(body["posts"]) == 2


def test_export_json_shape(client):
    client.post(
        "/posts",
        json={"author": "e", "channel": "/pytest/export", "body": "export me"},
    )
    res = client.get("/export/json")
    assert res.status_code == 200
    payload = json.loads(res.text)
    assert "exported_at" in payload
    assert isinstance(payload["channels"], list)
    assert isinstance(payload["posts"], list)
    assert len(payload["posts"]) >= 1
    post0 = payload["posts"][0]
    for key in ("id", "author", "channel", "body", "markdown_path", "thread_root_id"):
        assert key in post0


def test_export_md_is_zip(client):
    client.post(
        "/posts",
        json={"author": "z", "channel": "/pytest/zip", "body": "zip content"},
    )
    res = client.get("/export/md")
    assert res.status_code == 200
    assert res.headers.get("content-type", "").startswith("application/zip")
    buf = BytesIO(res.content)
    with zipfile.ZipFile(buf) as zf:
        names = zf.namelist()
        assert any(n.endswith(".md") for n in names)


def test_ai_search_finds_post(client):
    client.post(
        "/posts",
        json={
            "author": "s",
            "channel": "/pytest/search",
            "body": "unique_snippet_ragtest token for lexical hit",
        },
    )
    res = client.post(
        "/ai/search",
        json={"query": "unique_snippet_ragtest", "channel": "/pytest"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["query"] == "unique_snippet_ragtest"
    assert len(data["hits"]) >= 1
    assert any("unique_snippet_ragtest" in h.get("excerpt", "") for h in data["hits"])
