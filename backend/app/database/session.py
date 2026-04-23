from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker, AsyncEngine
from typing import AsyncGenerator
from dotenv import load_dotenv
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
    "postgresql+asyncpg://postgres:123@localhost/cmv_00",
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
        """Dependency que fornece sessões do banco de dados."""
        async with self.session_factory() as session:
            try:
                yield session
            finally:
                await session.close()


# Instância global para ser usada no lifespan do FastAPI
db_session = DatabaseSession()
