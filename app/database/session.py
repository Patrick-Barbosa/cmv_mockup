from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker, AsyncEngine
from typing import AsyncGenerator
from dotenv import load_dotenv
import os

# Carrega variáveis do arquivo .env
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:123@localhost/cmv_00")


class DatabaseSession:
    """Gerenciador de sessão do banco de dados para FastAPI."""
    
    def __init__(self):
        self.engine: AsyncEngine | None = None
        self.session_factory: async_sessionmaker | None = None
    
    def init(self):
        """Inicializa o engine e o session factory."""
        self.engine = create_async_engine(
            DATABASE_URL,
            echo=True,
            future=True
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