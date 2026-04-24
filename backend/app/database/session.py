from typing import Annotated, Any, AsyncGenerator

from dotenv import load_dotenv
from fastapi import Depends
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
import os

# Carrega variáveis do arquivo .env
load_dotenv()

# APP_ENV controls which Supabase schema is used and whether dev seeding runs.
# Values: "production" | "development"  (default: "development")
APP_ENV: str = os.getenv("APP_ENV", "development")

# Schema used for all table references.
# production → prd
# development → dev
DB_SCHEMA: str = "prd" if APP_ENV == "production" else "dev"

DATABASE_URL: str = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost/postgres",
)


class DatabaseSession:
    """Gerenciador de sessão do banco de dados para FastAPI."""

    def __init__(self):
        self.engine: AsyncEngine | None = None
        self.session_factory: async_sessionmaker | None = None

    def init(self):
        """Inicializa o engine e o session factory.

        We use schema_translate_map instead of search_path so that SQLAlchemy
        emits fully-qualified table names (e.g. dev.produtos) in ALL
        SQL — both DDL (CREATE TABLE) and DML (SELECT/INSERT/UPDATE).
        This works correctly through Supabase's pgBouncer pooler, which does
        not forward server_settings / search_path overrides.

        schema_translate_map={None: "dev"} means:
          "whenever a table has no explicit schema (schema=None), use 'dev'".
        """
        translate_map = {None: DB_SCHEMA}

        self.engine = create_async_engine(
            DATABASE_URL,
            echo=(APP_ENV != "production"),  # SQL logging only in dev
            future=True,
            execution_options={"schema_translate_map": translate_map},
        )

        self.session_factory = async_sessionmaker(
            bind=self.engine,
            expire_on_commit=False,
            class_=AsyncSession,
        )

    async def close(self):
        """Fecha a conexão com o banco de dados."""
        if self.engine:
            await self.engine.dispose()

    async def get_session(self) -> AsyncGenerator[AsyncSession, None]:
        """Fornece uma sessão do banco de dados.

        O async with do session_factory garante o fechamento via __aexit__,
        sem necessidade de try/finally.

        Toda operação com o banco deve abrir um bloco explícito:
            - Leitura:  async with session.begin(): ...
            - Escrita:  async with session.begin(): ...

        Para reads avulsos, prefira os helpers fetch_one() e fetch_all(),
        que encapsulam o begin() internamente e simplificam o código.
        """
        async with self.session_factory() as session:
            yield session


# Instância global para ser usada no lifespan do FastAPI
db_session = DatabaseSession()


# ---------------------------------------------------------------------------
# Helpers de leitura
# ---------------------------------------------------------------------------

# Helpers para reads AVULSOS e independentes.
# Eles abrem e fecham sua própria transação internamente.
# NUNCA os chame com uma transação já aberta na sessão — session.begin()
# vai lançar InvalidRequestError se a sessão já estiver em transação.
# Para reads dentro de um bloco existente, use session.execute() diretamente.

async def fetch_one(session: AsyncSession, stmt) -> Any | None:
    """Executa um read avulso e retorna um único resultado ou None."""
    async with session.begin():
        result = await session.execute(stmt)
        return result.scalar_one_or_none()


async def fetch_all(session: AsyncSession, stmt) -> list[Any]:
    """Executa um read avulso e retorna todos os resultados."""
    async with session.begin():
        result = await session.execute(stmt)
        return result.scalars().all()


# ---------------------------------------------------------------------------
# FastAPI dependencies
# ---------------------------------------------------------------------------

DbSession = Annotated[AsyncSession, Depends(db_session.get_session)]
