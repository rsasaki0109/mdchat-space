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


def test_patch_post_updates_markdown(client):
    created = client.post(
        "/posts",
        json={"author": "u", "channel": "/pytest/patch", "body": "before text"},
    ).json()
    path = ROOT_DIR / created["markdown_path"]
    assert "before text" in path.read_text(encoding="utf-8")

    res = client.patch(
        f"/posts/{created['id']}",
        json={"author": "u2", "body": "after text"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["author"] == "u2"
    assert data["body"] == "after text"
    assert "after text" in path.read_text(encoding="utf-8")
    assert "u2" in path.read_text(encoding="utf-8")


def test_delete_thread_removes_rows_and_files(client):
    root = client.post(
        "/posts",
        json={"author": "d1", "channel": "/pytest/del", "body": "root"},
    ).json()
    reply = client.post(
        "/posts",
        json={
            "author": "d2",
            "channel": "/pytest/del",
            "body": "reply",
            "parent_post_id": root["id"],
        },
    ).json()

    root_path = ROOT_DIR / root["markdown_path"]
    reply_path = ROOT_DIR / reply["markdown_path"]
    assert root_path.is_file()
    assert reply_path.is_file()

    res = client.delete(f"/posts/{root['id']}")
    assert res.status_code == 204

    assert not root_path.is_file()
    assert not reply_path.is_file()
    assert client.get(f"/thread/{root['id']}").status_code == 404


def test_write_key_enforced_when_configured(client, monkeypatch):
    monkeypatch.setenv("MDCHAT_API_WRITE_KEY", "secret")
    res = client.post(
        "/posts",
        json={"author": "k", "channel": "/pytest/key", "body": "x"},
    )
    assert res.status_code == 401

    ok = client.post(
        "/posts",
        json={"author": "k", "channel": "/pytest/key", "body": "x"},
        headers={"X-API-Key": "secret"},
    )
    assert ok.status_code == 200


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
    assert any("unique_snippet_ragtest" in h.get("excerpt", "").lower() for h in data["hits"])


def test_ai_search_partial_substring(client):
    client.post(
        "/posts",
        json={
            "author": "s",
            "channel": "/pytest/substr",
            "body": "prefix UNIQUE_MIDDLE_SUFFIX tail for substring search",
        },
    )
    res = client.post("/ai/search", json={"query": "MIDDLE_SUFFIX", "channel": "/pytest"})
    assert res.status_code == 200
    hits = res.json()["hits"]
    assert len(hits) >= 1
    assert any("UNIQUE" in h.get("excerpt", "") for h in hits)


def test_ai_search_returns_multiple_hits(client):
    bodies = [
        "alpha common_hit_token logging baseline one",
        "beta paragraph with common_hit_token and more logging",
        "gamma only common_hit_token here",
    ]
    for i, body in enumerate(bodies):
        client.post(
            "/posts",
            json={"author": "u", "channel": f"/pytest/multi/{i}", "body": body},
        )
    res = client.post("/ai/search", json={"query": "common_hit_token", "limit": 15})
    assert res.status_code == 200
    assert len(res.json()["hits"]) >= 3


def test_ai_search_multiword_and_global(client):
    client.post(
        "/posts",
        json={"author": "a", "channel": "/pytest/mw/a", "body": "alpha beta gamma only in a"},
    )
    client.post(
        "/posts",
        json={"author": "b", "channel": "/pytest/mw/b", "body": "alpha beta gamma only in b"},
    )
    scoped = client.post(
        "/ai/search",
        json={"query": "alpha beta", "channel": "/pytest/mw/a"},
    ).json()["hits"]
    assert len(scoped) >= 1
    assert all("a" in h["channel"] for h in scoped)

    global_res = client.post("/ai/search", json={"query": "alpha beta", "limit": 20}).json()
    assert len(global_res["hits"]) >= 2
