from __future__ import annotations

import os
import shutil
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[3]
_TEST_HOME = REPO_ROOT / "tmp" / "pytest-mdchat"
_TEST_HOME.mkdir(parents=True, exist_ok=True)

os.environ["DATABASE_URL"] = f"sqlite+pysqlite:///{(_TEST_HOME / 'api.db').resolve()}"
os.environ["DATA_DIR"] = str((_TEST_HOME / "channels").relative_to(REPO_ROOT))
os.environ["STAMPS_DIR"] = str((_TEST_HOME / "stamps").relative_to(REPO_ROOT))
os.environ["SEED_DEMO_DATA"] = "false"


@pytest.fixture(scope="module")
def client():
    from fastapi.testclient import TestClient
    from app.main import app

    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(autouse=True)
def _reset_db():
    from app.config import settings
    from app.db import Base, SessionLocal, engine

    import app.models  # noqa: F401
    import app.models_stamp  # noqa: F401

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    from app.services.stamps import ensure_builtin_stamps

    with SessionLocal() as session:
        ensure_builtin_stamps(session)
    if settings.data_dir.exists():
        shutil.rmtree(settings.data_dir)
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    settings.export_dir.mkdir(parents=True, exist_ok=True)
    if settings.stamps_dir.exists():
        shutil.rmtree(settings.stamps_dir)
    settings.stamps_dir.mkdir(parents=True, exist_ok=True)
    yield
