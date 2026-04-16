import pytest
from unittest.mock import AsyncMock, MagicMock
from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.app.routers.api import insumos, receitas, vendas


@pytest.fixture(scope="session")
def client():
    test_app = FastAPI()
    test_app.include_router(insumos.router)
    test_app.include_router(receitas.router)
    test_app.include_router(vendas.router)
    return TestClient(test_app)


def buildMockSession():
    session = AsyncMock()
    session.add = MagicMock()

    begin_cm = AsyncMock()
    begin_cm.__aenter__ = AsyncMock(return_value=None)
    begin_cm.__aexit__ = AsyncMock(return_value=False)
    session.begin = MagicMock(return_value=begin_cm)

    return session


def buildMockFactory(session):
    cm = AsyncMock()
    cm.__aenter__ = AsyncMock(return_value=session)
    cm.__aexit__ = AsyncMock(return_value=False)
    return MagicMock(return_value=cm)
