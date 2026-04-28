import pytest
import datetime
from uuid import uuid4
from sqlalchemy import text
from sqlalchemy.exc import OperationalError
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from backend.app.database.models import Base, Produto, Venda, LojaImposto, ComponenteReceita
from backend.app.services.venda_service import VendaService
from backend.app.services.produto_service import ProdutoService

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
async def test_get_dashboard_cmv_filters_unknown_products(postgres_session_factory):
    async with postgres_session_factory() as session:
        async with session.begin():
            # Create a known product
            p1 = Produto(
                id_produto_externo="PROD-KNOWN",
                nome="Produto Conhecido",
                tipo="insumo",
                custo=10.0,
                preco_referencia=10.0,
                quantidade_referencia=1
            )
            session.add(p1)
            
            # Create sales for a known and unknown product
            v1 = Venda(data=datetime.date(2024, 1, 15), id_loja="LOJA1", id_produto="PROD-KNOWN", quantidade_produto=2, valor_total=50.0)
            v2 = Venda(data=datetime.date(2024, 1, 16), id_loja="LOJA1", id_produto="PROD-UNKNOWN", quantidade_produto=1, valor_total=100.0)
            session.add_all([v1, v2])

        service = VendaService(session)
        dashboard = await service.get_dashboard_cmv(month="2024-01")

        # Unknown product sold for 100, known sold for 50. 
        # With INNER JOIN, only the known product should be in faturamento (50.0).
        kpis = dashboard["kpis"]
        assert kpis["faturamento"] == 50.0
        # Custo = 2 * 10 = 20.0. CMV = (20/50)*100 = 40.0%
        assert kpis["cmv_percent"] == 40.0

@pytest.mark.anyio
async def test_get_dashboard_cmv_uses_historical_taxes(postgres_session_factory):
    async with postgres_session_factory() as session:
        async with session.begin():
            # Add taxes for LOJA1 at different dates
            session.add_all([
                LojaImposto(id_loja="LOJA1", imposto_percentual=10.0, data_criacao=datetime.datetime(2024, 1, 10)),
                LojaImposto(id_loja="LOJA1", imposto_percentual=20.0, data_criacao=datetime.datetime(2024, 3, 10)),
            ])
            # Add product
            session.add(Produto(id_produto_externo="P1", nome="P1", tipo="insumo", custo=5.0))
            
            # Add sales in Jan and March
            session.add_all([
                Venda(data=datetime.date(2024, 1, 20), id_loja="LOJA1", id_produto="P1", quantidade_produto=1, valor_total=100.0),
                Venda(data=datetime.date(2024, 3, 20), id_loja="LOJA1", id_produto="P1", quantidade_produto=1, valor_total=100.0),
            ])

        service = VendaService(session)
        dashboard = await service.get_dashboard_cmv(month="2024-03")

        history = dashboard["history"]
        jan_data = next(h for h in history if h["mes"] == "2024-01")
        mar_data = next(h for h in history if h["mes"] == "2024-03")

        # Faturamento 100. Imposto 10% em Jan = 10. Imposto 20% em Mar = 20.
        assert jan_data["imposto"] == 10.0
        assert mar_data["imposto"] == 20.0

@pytest.mark.anyio
async def test_produto_service_cascades_recipe_cost(postgres_session_factory):
    async with postgres_session_factory() as session:
        async with session.begin():
            insumo1 = Produto(nome="Insumo1", tipo="insumo", custo=10.0)
            receita_base = Produto(nome="Base", tipo="receita", quantidade_base=1, custo=0)
            receita_final = Produto(nome="Final", tipo="receita", quantidade_base=1, custo=0)
            session.add_all([insumo1, receita_base, receita_final])
            await session.flush()

            # Base = 2x Insumo1
            session.add(ComponenteReceita(id_receita=receita_base.id, id_componente=insumo1.id, quantidade=2))
            # Final = 3x Base
            session.add(ComponenteReceita(id_receita=receita_final.id, id_componente=receita_base.id, quantidade=3))
            
        service = ProdutoService(session)
        
        # Test cascade function explicitly
        async with session.begin():
            await service.recompute_recipe_cost(receita_base.id)
            await service.recompute_recipe_cost(receita_final.id)
            
            # Change insumo cost
            insumo1.custo = 20.0
            await session.flush()
            
            # Cascade update
            await service.update_affected_recipes_costs(insumo1.id)
            
        async with session.begin():
            result_base = await session.get(Produto, receita_base.id)
            result_final = await session.get(Produto, receita_final.id)
            
            # Insumo = 20. Base = 2 * 20 = 40. Final = 3 * 40 = 120.
            assert result_base.custo == 40.0
            assert result_final.custo == 120.0