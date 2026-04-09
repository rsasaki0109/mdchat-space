from __future__ import annotations

import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session

from .auth import require_write_key
from .config import settings
from .db import SessionLocal, get_session, init_db
from .models_stamp import Stamp
from .schemas import (
    PostCreate,
    PostUpdate,
    ReplyRequest,
    ReplyResponse,
    SearchRequest,
    SearchResponse,
    StampOut,
    StampToggleRequest,
    StampToggleResponse,
    SummarizeRequest,
    SummarizeResponse,
    ThreadPost,
    ThreadResponse,
)
from .seed import seed_demo_data
from .services.ai import answer_search, generate_reply, summarize_thread
from .services.channels import get_channel_tree
from .services.posts import (
    create_post,
    delete_thread,
    get_all_export_posts,
    get_channel_posts,
    get_searchable_posts,
    get_thread,
    update_post,
)
from .services.search import search_posts
from .services.stamps import create_image_stamp, ensure_builtin_stamps, get_stamp_file_path, list_stamps, toggle_stamp_reaction


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Markdown-first chat API for small communities.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    settings.export_dir.mkdir(parents=True, exist_ok=True)
    settings.stamps_dir.mkdir(parents=True, exist_ok=True)
    init_db()
    with SessionLocal() as session:
        ensure_builtin_stamps(session)
    if settings.seed_demo_data:
        with SessionLocal() as session:
            seed_demo_data(session)


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/channels/tree")
def channels_tree(session: Session = Depends(get_session)):
    return get_channel_tree(session)


@app.get("/posts")
def channel_posts(channel: str, session: Session = Depends(get_session)):
    return get_channel_posts(session, channel)


@app.post("/posts", response_model=ThreadPost)
def post_message(
    payload: PostCreate,
    session: Session = Depends(get_session),
    _: None = Depends(require_write_key),
):
    return create_post(session, payload)


@app.patch("/posts/{post_id}", response_model=ThreadPost)
def patch_post(
    post_id: str,
    payload: PostUpdate,
    session: Session = Depends(get_session),
    _: None = Depends(require_write_key),
):
    return update_post(session, post_id, payload)


@app.delete("/posts/{thread_root_id}", status_code=204)
def remove_thread(
    thread_root_id: str,
    session: Session = Depends(get_session),
    _: None = Depends(require_write_key),
) -> None:
    delete_thread(session, thread_root_id)


@app.get("/stamps", response_model=list[StampOut])
def stamps_list(session: Session = Depends(get_session)):
    return list_stamps(session)


@app.post("/stamps", response_model=StampOut)
async def stamps_create(
    slug: str = Form(),
    label: str = Form(),
    file: UploadFile = File(),
    session: Session = Depends(get_session),
    _: None = Depends(require_write_key),
):
    content_type = file.content_type or "application/octet-stream"
    data = await file.read()
    return create_image_stamp(session, slug=slug.strip(), label=label, content_type=content_type, data=data)


@app.get("/stamps/{stamp_id}/image")
def stamps_image(stamp_id: str, session: Session = Depends(get_session)):
    stamp = session.get(Stamp, stamp_id)
    if stamp is None or stamp.kind != "image" or not stamp.image_relpath:
        raise HTTPException(status_code=404, detail="image stamp not found")
    path = get_stamp_file_path(stamp)
    if path is None:
        raise HTTPException(status_code=404, detail="image file missing")
    suffix = path.suffix.lower()
    media = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".webp": "image/webp",
    }.get(suffix, "application/octet-stream")
    return FileResponse(path, media_type=media)


@app.post("/posts/{post_id}/stamps", response_model=StampToggleResponse)
def post_stamp_toggle(post_id: str, payload: StampToggleRequest, session: Session = Depends(get_session)):
    active, count = toggle_stamp_reaction(
        session,
        post_id=post_id,
        stamp_id=payload.stamp_id,
        actor_key=payload.actor_key,
    )
    return StampToggleResponse(active=active, count=count)


@app.get("/thread/{thread_id}", response_model=ThreadResponse)
def thread_detail(thread_id: str, actor: str | None = None, session: Session = Depends(get_session)):
    return get_thread(session, thread_id, actor_key=actor)


@app.post("/ai/summarize", response_model=SummarizeResponse)
def ai_summarize(payload: SummarizeRequest, session: Session = Depends(get_session)):
    thread = get_thread(session, payload.thread_id)
    return SummarizeResponse(thread_id=thread.root.id, summary=summarize_thread(thread.posts))


@app.post("/ai/reply", response_model=ReplyResponse)
def ai_reply(payload: ReplyRequest, session: Session = Depends(get_session)):
    thread = get_thread(session, payload.thread_id)
    return ReplyResponse(thread_id=thread.root.id, reply=generate_reply(thread.posts, payload.instruction))


@app.post("/ai/search", response_model=SearchResponse)
def ai_search(payload: SearchRequest, session: Session = Depends(get_session)):
    posts = get_searchable_posts(session, payload.channel)
    hits = search_posts(payload.query, posts, payload.limit)
    return SearchResponse(query=payload.query, hits=hits, answer=answer_search(payload.query, hits))


@app.get("/export/md")
def export_markdown():
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    archive_base = settings.export_dir / f"mdchat-space-md-{timestamp}"
    archive_path = shutil.make_archive(
        str(archive_base),
        "zip",
        root_dir=settings.data_dir,
    )
    return FileResponse(
        archive_path,
        media_type="application/zip",
        filename=Path(archive_path).name,
    )


@app.get("/export/json")
def export_json(session: Session = Depends(get_session)):
    payload = {
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "channels": [node.model_dump() for node in get_channel_tree(session)],
        "posts": [post.model_dump(mode="json") for post in get_all_export_posts(session)],
    }
    content = json.dumps(payload, ensure_ascii=False, indent=2)
    file_name = f"mdchat-space-export-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}.json"
    return Response(
        content=content,
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="{file_name}"'},
    )
