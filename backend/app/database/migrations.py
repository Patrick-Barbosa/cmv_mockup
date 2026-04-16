from __future__ import annotations

import asyncio
from pathlib import Path

from backend.app.database.session import DATABASE_URL


def _build_alembic_config():
    from alembic.config import Config

    root_dir = Path(__file__).resolve().parents[3]
    config = Config(str(root_dir / "alembic.ini"))
    config.set_main_option("script_location", str(root_dir / "alembic"))
    config.set_main_option("sqlalchemy.url", DATABASE_URL)
    return config


async def run_migrations() -> None:
    from alembic import command

    config = _build_alembic_config()
    await asyncio.to_thread(command.upgrade, config, "head")
