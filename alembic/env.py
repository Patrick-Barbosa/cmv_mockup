from __future__ import annotations

import asyncio
import os
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config

from backend.app.database.models import Base
from backend.app.database.session import DATABASE_URL, DB_SCHEMA

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata
target_metadata.schema = None if DB_SCHEMA == "public" else DB_SCHEMA


def include_object(object_, name, type_, reflected, compare_to):
    if type_ == "table" and DB_SCHEMA != "public":
        return getattr(object_, "schema", None) == DB_SCHEMA
    return True


def run_migrations_offline() -> None:
    url = DATABASE_URL
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        include_schemas=(DB_SCHEMA != "public"),
        include_object=include_object,
        version_table_schema=None if DB_SCHEMA == "public" else DB_SCHEMA,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    section = config.get_section(config.config_ini_section, {})
    section["sqlalchemy.url"] = DATABASE_URL

    connectable = async_engine_from_config(
        section,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        future=True,
    )

    async def _run() -> None:
        async with connectable.connect() as connection:
            if DB_SCHEMA != "public":
                await connection.exec_driver_sql(f'CREATE SCHEMA IF NOT EXISTS "{DB_SCHEMA}"')

            await connection.run_sync(_configure_and_run_migrations)

        await connectable.dispose()

    asyncio.run(_run())


def _configure_and_run_migrations(connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        include_schemas=(DB_SCHEMA != "public"),
        include_object=include_object,
        version_table_schema=None if DB_SCHEMA == "public" else DB_SCHEMA,
    )

    with context.begin_transaction():
        context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
