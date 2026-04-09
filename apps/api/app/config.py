from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


ROOT_DIR = Path(__file__).resolve().parents[3]
load_dotenv(ROOT_DIR / ".env")


def _as_bool(raw_value: str | None, default: bool) -> bool:
    if raw_value is None:
        return default
    return raw_value.strip().lower() in {"1", "true", "yes", "on"}


def _as_csv(raw_value: str | None, default: tuple[str, ...]) -> tuple[str, ...]:
    if raw_value is None:
        return default
    values = tuple(item.strip() for item in raw_value.split(",") if item.strip())
    return values or default


def _resolve_path(raw_value: str | None, default: Path) -> Path:
    if raw_value is None:
        return default
    path = Path(raw_value)
    if not path.is_absolute():
        path = ROOT_DIR / path
    return path.resolve()


@dataclass(frozen=True)
class Settings:
    app_name: str
    database_url: str
    data_dir: Path
    export_dir: Path
    cors_origins: tuple[str, ...]
    seed_demo_data: bool
    ai_backend: str
    openai_api_key: str | None


settings = Settings(
    app_name="mdchat-space API",
    database_url=os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg://mdchat:mdchat@localhost:5433/mdchat",
    ),
    data_dir=_resolve_path(os.getenv("DATA_DIR"), ROOT_DIR / "data" / "channels"),
    export_dir=(ROOT_DIR / "data" / "exports").resolve(),
    cors_origins=_as_csv(
        os.getenv("CORS_ORIGINS"),
        (
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:3030",
            "http://127.0.0.1:3030",
        ),
    ),
    seed_demo_data=_as_bool(os.getenv("SEED_DEMO_DATA"), True),
    ai_backend=(os.getenv("AI_BACKEND", "heuristic").strip().lower() or "heuristic"),
    openai_api_key=os.getenv("OPENAI_API_KEY") or None,
)
