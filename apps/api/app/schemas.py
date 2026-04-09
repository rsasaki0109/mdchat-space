from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


def _normalize_channel_path(path: str) -> str:
    segments = [segment.strip() for segment in path.split("/") if segment.strip()]
    if not segments:
        raise ValueError("channel path must not be empty")
    return "/" + "/".join(segments)


class ChannelNode(BaseModel):
    path: str
    name: str
    depth: int
    post_count: int
    total_post_count: int
    children: list["ChannelNode"] = Field(default_factory=list)


class PostCreate(BaseModel):
    author: str = Field(min_length=1, max_length=120)
    channel: str = Field(min_length=1, max_length=255)
    body: str = Field(min_length=1)
    parent_post_id: str | None = None

    @field_validator("channel")
    @classmethod
    def validate_channel(cls, value: str) -> str:
        return _normalize_channel_path(value)

    @field_validator("author")
    @classmethod
    def validate_author(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("author must not be blank")
        return cleaned

    @field_validator("body")
    @classmethod
    def validate_body(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("body must not be blank")
        return cleaned


class PostUpdate(BaseModel):
    author: str | None = Field(default=None, max_length=120)
    body: str | None = Field(default=None, min_length=1)

    @field_validator("author")
    @classmethod
    def validate_author(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("author must not be blank")
        return cleaned

    @field_validator("body")
    @classmethod
    def validate_body(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("body must not be blank")
        return cleaned

    @model_validator(mode="after")
    def require_change(self):
        if self.author is None and self.body is None:
            raise ValueError("at least one of author or body is required")
        return self


class PostSummary(BaseModel):
    id: str
    author: str
    channel: str
    created_at: datetime
    excerpt: str
    reply_count: int
    thread_root_id: str
    parent_post_id: str | None


class ThreadPost(BaseModel):
    id: str
    author: str
    channel: str
    created_at: datetime
    updated_at: datetime
    body: str
    thread_root_id: str
    parent_post_id: str | None
    markdown_path: str


class ThreadResponse(BaseModel):
    root: ThreadPost
    posts: list[ThreadPost]


class SummarizeRequest(BaseModel):
    thread_id: str


class SummarizeResponse(BaseModel):
    thread_id: str
    summary: str


class ReplyRequest(BaseModel):
    thread_id: str
    instruction: str | None = None


class ReplyResponse(BaseModel):
    thread_id: str
    reply: str


class SearchRequest(BaseModel):
    query: str = Field(min_length=1)
    channel: str | None = None
    limit: int = Field(default=12, ge=1, le=50)

    @field_validator("channel")
    @classmethod
    def validate_channel(cls, value: str | None) -> str | None:
        if value is None or not value.strip():
            return None
        return _normalize_channel_path(value)

    @field_validator("query")
    @classmethod
    def validate_query(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("query must not be blank")
        return cleaned


class SearchHit(BaseModel):
    post_id: str
    channel: str
    author: str
    created_at: datetime
    excerpt: str
    score: float


class SearchResponse(BaseModel):
    query: str
    answer: str
    hits: list[SearchHit]


class ExportedPost(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    author: str
    channel: str
    parent_post_id: str | None
    thread_root_id: str
    created_at: datetime
    updated_at: datetime
    markdown_path: str
    body: str


ChannelNode.model_rebuild()
