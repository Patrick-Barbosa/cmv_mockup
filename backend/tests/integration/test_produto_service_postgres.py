from uuid import uuid4

import pytest
from sqlalchemy import select, text
from sqlalchemy.exc import OperationalError
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from backend.app.database.models import Base, ComponenteReceita, Produto
from backend.app.schemas.receita import CreateRecipeModel
from backend.app.schemas.venda import BulkImportVendasModel, ImportStrategy
from backend.app.services.produto_service import ProdutoService
from backend.app.services.venda_service import VendaService


POSTGRES_DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5431/postgres"


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture(scope="session")
def postgres_database_url():
    return POSTGRES_DATABASE_URL


@pytest.fixture
async def postgres_session_factory(postgres_database_url):
    schema = f"test_{uuid4().hex}"
    engine = create_async_engine(
        postgres_database_url,
        future=True,
        connect_args={"timeout": 2},
        execution_options={"schema_translate_map": {None: schema}},
    )

    try:
        async with engine.begin() as conn:
            await conn.execute(text(f'CREATE SCHEMA "{schema}"'))
            await conn.run_sync(Base.metadata.create_all)
    except (ConnectionRefusedError, OSError, OperationalError) as exc:
        await engine.dispose()
        pytest.skip(
            "Postgres de integracao indisponivel. "
            "Rode `docker compose -f docker-compose.test.yml -p cmv_test up -d db-test`: "
            f"{exc}"
        )

    try:
        yield async_sessionmaker(engine, expire_on_commit=False)
    finally:
        async with engine.begin() as conn:
            await conn.execute(text(f'DROP SCHEMA IF EXISTS "{schema}" CASCADE'))
        await engine.dispose()


@pytest.mark.anyio
async def test_produto_service_get_produtos_select2_uses_real_postgres(postgres_session_factory):
    async with postgres_session_factory() as session:
        async with session.begin():
            session.add_all([
                Produto(
                    nome="Farinha de Trigo",
                    tipo="insumo",
                    custo=0.01,
                    unidade="g",
                    quantidade_referencia=1000,
                    preco_referencia=10,
                    id_produto_externo="FARINHA-001",
                ),
                Produto(
                    nome="Pizza Grande",
                    tipo="receita",
                    quantidade_base=1,
                    custo=25,
                    unidade="un",
                    id_produto_externo="PIZZA-001",
                ),
            ])

        service = ProdutoService(session)
        result = await service.get_produtos_paginated_select2(q="Farinha", page=1, per_page=20)

    assert result["pagination"] == {"more": False}
    assert result["items"] == [
        {
            "id": 1,
            "text": "Farinha de Trigo",
            "tipo": "Insumo",
            "custo": 0.01,
            "unidade": "g",
            "quantidade_referencia": 1000,
            "preco_referencia": 10,
            "quantidade_base": None,
            "id_produto_externo": "FARINHA-001",
        }
    ]


@pytest.mark.anyio
async def test_produto_service_create_recipe_persists_components_and_recomputes_cost(postgres_session_factory):
    async with postgres_session_factory() as session:
        async with session.begin():
            farinha = Produto(
                nome="Farinha",
                tipo="insumo",
                custo=0.01,
                unidade="g",
                quantidade_referencia=1000,
                preco_referencia=10,
            )
            queijo = Produto(
                nome="Queijo",
                tipo="insumo",
                custo=0.05,
                unidade="g",
                quantidade_referencia=1000,
                preco_referencia=50,
            )
            session.add_all([farinha, queijo])
            await session.flush()

            service = ProdutoService(session)
            receita_id = await service.create_recipe(
                CreateRecipeModel(
                    nome="Pizza",
                    quantidade_base=1,
                    unidade="un",
                    id_produto_externo="PIZZA-001",
                    componentes=[
                        {"id_componente": farinha.id, "quantidade": 300},
                        {"id_componente": queijo.id, "quantidade": 200},
                    ],
                )
            )
            await service.recompute_recipe_cost(receita_id)

        async with session.begin():
            receita = await session.get(Produto, receita_id)
            componentes = (
                await session.execute(
                    select(ComponenteReceita).where(ComponenteReceita.id_receita == receita_id)
                )
            ).scalars().all()

    assert receita.nome == "Pizza"
    assert receita.tipo == "receita"
    assert receita.custo == 13
    assert sorted((c.id_componente, c.quantidade) for c in componentes) == [
        (farinha.id, 300),
        (queijo.id, 200),
    ]


@pytest.mark.anyio
async def test_venda_service_bulk_import_append_ignores_duplicate_sales(postgres_session_factory):
    async with postgres_session_factory() as session:
        service = VendaService(session)

        async with session.begin():
            first_result = await service.bulk_import(
                BulkImportVendasModel.model_validate({
                    "strategy": ImportStrategy.APPEND,
                    "rows": [
                        {
                            "data": "2026-04-01",
                            "id_loja": "RJ-COPA",
                            "id_produto": "PIZZA-001",
                            "quantidade_produto": 10,
                            "valor_total": 250,
                        }
                    ],
                })
            )

        async with session.begin():
            second_result = await service.bulk_import(
                BulkImportVendasModel.model_validate({
                    "strategy": ImportStrategy.APPEND,
                    "rows": [
                        {
                            "data": "2026-04-01",
                            "id_loja": "RJ-COPA",
                            "id_produto": "PIZZA-001",
                            "quantidade_produto": 99,
                            "valor_total": 999,
                        }
                    ],
                })
            )

        async with session.begin():
            analysis = await service.get_store_month_analysis("RJ-COPA", "2026-04")

    assert first_result["linhas_importadas"] == 1
    assert second_result["linhas_importadas"] == 1
    assert analysis["resumo"]["quantidade_total"] == 10
    assert analysis["resumo"]["receita_total"] == 250


@pytest.mark.anyio
async def test_venda_service_analysis_and_missing_skus_use_real_aggregations(postgres_session_factory):
    async with postgres_session_factory() as session:
        async with session.begin():
            session.add(
                Produto(
                    nome="Pizza Grande",
                    tipo="receita",
                    quantidade_base=1,
                    custo=25,
                    unidade="un",
                    id_produto_externo="PIZZA-001",
                )
            )
            await VendaService(session).bulk_import(
                BulkImportVendasModel.model_validate({
                    "strategy": ImportStrategy.APPEND,
                    "rows": [
                        {
                            "data": "2026-04-01",
                            "id_loja": "RJ-COPA",
                            "id_produto": "PIZZA-001",
                            "quantidade_produto": 10,
                            "valor_total": 250,
                        },
                        {
                            "data": "2026-04-02",
                            "id_loja": "RJ-COPA",
                            "id_produto": "SKU-AUSENTE",
                            "quantidade_produto": 5,
                            "valor_total": 100,
                        },
                    ],
                })
            )

        async with session.begin():
            service = VendaService(session)
            analysis = await service.get_store_month_analysis("RJ-COPA", "2026-04")
            missing = await service.get_missing_skus(page=1, size=50)

    assert analysis["resumo"] == {
        "receita_total": 350.0,
        "receita_vinculada": 250.0,
        "receita_sem_vinculo": 100.0,
        "custo_ideal_total": 250.0,
        "cmv_ideal_percentual": 100.0,
        "quantidade_total": 15,
        "produtos_vinculados": 1,
        "produtos_sem_vinculo": 1,
    }
    assert missing == {
        "total": 1,
        "page": 1,
        "size": 50,
        "pages": 1,
        "items": [
            {
                "id_produto_externo": "SKU-AUSENTE",
                "quantidade_total": 5,
                "valor_total": 100.0,
                "vendas_count": 1,
            }
        ],
    }
