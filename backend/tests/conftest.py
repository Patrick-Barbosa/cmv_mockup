import pytest
from unittest.mock import AsyncMock, MagicMock
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.routers.api import insumos, receitas


@pytest.fixture(scope="session")
def client():
    test_app = FastAPI()
    test_app.include_router(insumos.router)
    test_app.include_router(receitas.router)
    return TestClient(test_app)


def buildMockSession():
    """Cria um AsyncMock de sessão SQLAlchemy com add síncrono."""
    session = AsyncMock()
    session.add = MagicMock()

    # begin() deve retornar um async context manager diretamente (não uma coroutine)
    begin_cm = AsyncMock()
    begin_cm.__aenter__ = AsyncMock(return_value=None)
    begin_cm.__aexit__ = AsyncMock(return_value=False)
    session.begin = MagicMock(return_value=begin_cm)

    return session


def buildMockFactory(session):
    """Cria um mock de session_factory que retorna a sessão fornecida."""
    cm = AsyncMock()
    cm.__aenter__ = AsyncMock(return_value=session)
    cm.__aexit__ = AsyncMock(return_value=False)
    return MagicMock(return_value=cm)
