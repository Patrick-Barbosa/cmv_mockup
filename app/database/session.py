from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker, AsyncEngine
from aiohttp import web
from typing import AsyncIterator
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import os

# Carrega variáveis do arquivo .env
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

DB_KEY = web.AppKey("db_key", async_sessionmaker)
DB_ENGINE_KEY = web.AppKey("db_engine_key", AsyncEngine)


@asynccontextmanager
async def get_db_session(request: web.Request) -> AsyncIterator[AsyncSession]:
    session_factory = request.app[DB_KEY]
    async with session_factory() as session:
        yield session


async def init_db_conn(app: web.Application):
    engine = create_async_engine(
        DATABASE_URL,
        echo=True,
        future=True
    )

    session_factory = async_sessionmaker(
        bind=engine,
        expire_on_commit=False,
        class_=AsyncSession,
    )

    app[DB_ENGINE_KEY] = engine
    #app[DB_KEY] = session_factory
    # Adicionar aos subapps também, caso existam
    app[DB_KEY] = app["subapp"][DB_KEY] = session_factory

    # Cleanup ao finalizar o app
    async def close_db(app: web.Application):
        await engine.dispose()

    app.on_cleanup.append(close_db)