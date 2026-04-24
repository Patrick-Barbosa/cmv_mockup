import pytest
from contextlib import contextmanager
from unittest.mock import AsyncMock, MagicMock
from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.app.database.session import db_session
from backend.app.routers.api import insumos, receitas, vendas


@pytest.fixture(scope="session")
def client():
    test_app = FastAPI()
    test_app.include_router(insumos.router)
    test_app.include_router(receitas.router)
    test_app.include_router(vendas.router)

    async def override_get_session():
        yield buildMockSession()

    test_app.dependency_overrides[db_session.get_session] = override_get_session
    return TestClient(test_app)


def buildMockSession():
    session = AsyncMock()
    session.add = MagicMock()

    begin_cm = AsyncMock()
    begin_cm.__aenter__ = AsyncMock(return_value=None)
    begin_cm.__aexit__ = AsyncMock(return_value=False)
    session.begin = MagicMock(return_value=begin_cm)

    return session


@contextmanager
def overrideSession(client, session):
    async def override_get_session():
        yield session

    app = client.app
    previous = app.dependency_overrides.get(db_session.get_session)
    app.dependency_overrides[db_session.get_session] = override_get_session
    try:
        yield
    finally:
        if previous is None:
            app.dependency_overrides.pop(db_session.get_session, None)
        else:
            app.dependency_overrides[db_session.get_session] = previous
