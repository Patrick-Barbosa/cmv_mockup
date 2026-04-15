import os
from datetime import date
from backend.app.database.session import db_session, APP_ENV, DB_SCHEMA
from backend.app.database.models import Base, Produto, ComponenteReceita, Venda
from sqlalchemy import select, text


async def init_db():
    """Inicializa o banco de dados.

    - development: recria todas as tabelas (drop + create) e popula com dados de exemplo.
    - production:  apenas cria tabelas que não existem (create_all sem drop_all).

    Note on Supabase schema routing:
      We set Base.metadata.schema explicitly so that SQLAlchemy generates DDL with
      the full schema qualifier (e.g. CREATE TABLE development.produtos ...).
      The engine's connect_args search_path handles DML (SELECT / INSERT / UPDATE).
    """

    Base.metadata.schema = None if DB_SCHEMA == "public" else DB_SCHEMA
    print(f"[init_db] APP_ENV={APP_ENV} - target schema: '{DB_SCHEMA}'")

    async with db_session.engine.begin() as conn:
        if DB_SCHEMA != "public":
            await conn.execute(text(f'CREATE SCHEMA IF NOT EXISTS "{DB_SCHEMA}"'))

        if APP_ENV == "development":
            print(f"[init_db] Dropping and recreating tables in schema '{DB_SCHEMA}'...")
            await conn.run_sync(Base.metadata.drop_all)

        await conn.run_sync(Base.metadata.create_all)
        print("[init_db] Tables ready.")

    if APP_ENV != "development":
        print("[init_db] Production mode - skipping seed data.")
        return

    async with db_session.session_factory() as session:
        produtos = [
            Produto(nome='Bolo de cenoura', tipo='receita', quantidade_base=0.450),
            Produto(nome='Massa de bolo', tipo='receita', quantidade_base=1),
            Produto(nome='Brigadeiro', tipo='receita', quantidade_base=1),
            Produto(nome='Bolo de pote de chocolate', tipo='receita', quantidade_base=0.280, unidade='kg', id_produto_externo='POTE-CHOC-001'),
            Produto(nome='Brownie recheado', tipo='receita', quantidade_base=0.180, unidade='kg', id_produto_externo='BROWNIE-001'),
            Produto(nome='Brownie base', tipo='receita', quantidade_base=1, unidade='kg'),
            Produto(nome='Ganache de chocolate', tipo='receita', quantidade_base=1, unidade='kg'),
            Produto(nome='Pizza margherita', tipo='receita', quantidade_base=1, unidade='un', id_produto_externo='PIZZA-MARG-001'),
            Produto(nome='Massa de pizza', tipo='receita', quantidade_base=1, unidade='un'),
            Produto(nome='Molho de tomate', tipo='receita', quantidade_base=1, unidade='kg'),
            Produto(nome='Crepe de frango', tipo='receita', quantidade_base=1, unidade='un', id_produto_externo='CREPE-FRANGO-001'),
            Produto(nome='Massa de crepe', tipo='receita', quantidade_base=1, unidade='kg'),
            Produto(nome='Recheio de frango', tipo='receita', quantidade_base=1, unidade='kg'),
            Produto(nome='Torta cremosa de frango', tipo='receita', quantidade_base=1.200, unidade='kg', id_produto_externo='TORTA-FRANGO-001'),
            Produto(nome='Massa de torta amanteigada', tipo='receita', quantidade_base=1, unidade='kg'),
            Produto(nome='Recheio cremoso de frango', tipo='receita', quantidade_base=1, unidade='kg'),
            Produto(nome='Refogado base', tipo='receita', quantidade_base=1, unidade='kg'),
            Produto(nome='Creme de queijo', tipo='receita', quantidade_base=1, unidade='kg'),
            Produto(nome='Nutella', tipo='insumo', unidade='g', quantidade_referencia=650, preco_referencia=32.90, custo=32.90 / 650, id_produto_externo='NUTELLA-001'),
            Produto(nome='Granulado de chocolate', tipo='insumo', unidade='g', quantidade_referencia=500, preco_referencia=8.50, custo=8.50 / 500),
            Produto(nome='Farinha de trigo', tipo='insumo', unidade='kg', quantidade_referencia=1, preco_referencia=5.90, custo=5.90),
            Produto(nome='Oleo', tipo='insumo', unidade='ml', quantidade_referencia=900, preco_referencia=9.50, custo=9.50 / 900),
            Produto(nome='Preparado de chocolate', tipo='receita', quantidade_base=1),
            Produto(nome='Chocolate em po', tipo='insumo', unidade='g', quantidade_referencia=400, preco_referencia=12.90, custo=12.90 / 400),
            Produto(nome='Leite condensado', tipo='insumo', unidade='g', quantidade_referencia=395, preco_referencia=6.50, custo=6.50 / 395),
            Produto(nome='Chocolate meio amargo', tipo='insumo', unidade='g', quantidade_referencia=1000, preco_referencia=39.90, custo=39.90 / 1000),
            Produto(nome='Creme de leite', tipo='insumo', unidade='g', quantidade_referencia=200, preco_referencia=4.20, custo=4.20 / 200),
            Produto(nome='Acucar', tipo='insumo', unidade='kg', quantidade_referencia=1, preco_referencia=4.80, custo=4.80),
            Produto(nome='Manteiga', tipo='insumo', unidade='g', quantidade_referencia=200, preco_referencia=11.90, custo=11.90 / 200),
            Produto(nome='Ovos', tipo='insumo', unidade='un', quantidade_referencia=30, preco_referencia=24.00, custo=24.00 / 30),
            Produto(nome='Leite', tipo='insumo', unidade='l', quantidade_referencia=1, preco_referencia=4.90, custo=4.90),
            Produto(nome='Fermento biologico', tipo='insumo', unidade='g', quantidade_referencia=500, preco_referencia=18.50, custo=18.50 / 500),
            Produto(nome='Sal', tipo='insumo', unidade='kg', quantidade_referencia=1, preco_referencia=3.20, custo=3.20),
            Produto(nome='Mucarela', tipo='insumo', unidade='kg', quantidade_referencia=1, preco_referencia=34.90, custo=34.90),
            Produto(nome='Tomate pelado', tipo='insumo', unidade='g', quantidade_referencia=400, preco_referencia=7.80, custo=7.80 / 400),
            Produto(nome='Manjericao', tipo='insumo', unidade='g', quantidade_referencia=100, preco_referencia=4.50, custo=4.50 / 100),
            Produto(nome='Frango desfiado', tipo='insumo', unidade='kg', quantidade_referencia=1, preco_referencia=19.90, custo=19.90),
            Produto(nome='Catupiry', tipo='insumo', unidade='g', quantidade_referencia=400, preco_referencia=14.50, custo=14.50 / 400),
            Produto(nome='Cebola', tipo='insumo', unidade='kg', quantidade_referencia=1, preco_referencia=6.20, custo=6.20),
            Produto(nome='Alho', tipo='insumo', unidade='kg', quantidade_referencia=1, preco_referencia=18.90, custo=18.90),
            Produto(nome='Molho de tomate pronto', tipo='insumo', unidade='g', quantidade_referencia=300, preco_referencia=3.90, custo=3.90 / 300),
        ]

        session.add_all(produtos)
        await session.flush()

        prod_map = {p.nome: p for p in produtos}

        componentes = [
            ComponenteReceita(receita=prod_map['Bolo de cenoura'], componente=prod_map['Massa de bolo'], quantidade=0.300),
            ComponenteReceita(receita=prod_map['Bolo de cenoura'], componente=prod_map['Nutella'], quantidade=0.050),
            ComponenteReceita(receita=prod_map['Bolo de cenoura'], componente=prod_map['Granulado de chocolate'], quantidade=0.050),
            ComponenteReceita(receita=prod_map['Massa de bolo'], componente=prod_map['Farinha de trigo'], quantidade=0.800),
            ComponenteReceita(receita=prod_map['Massa de bolo'], componente=prod_map['Oleo'], quantidade=0.100),
            ComponenteReceita(receita=prod_map['Massa de bolo'], componente=prod_map['Preparado de chocolate'], quantidade=0.100),
            ComponenteReceita(receita=prod_map['Preparado de chocolate'], componente=prod_map['Chocolate em po'], quantidade=0.700),
            ComponenteReceita(receita=prod_map['Preparado de chocolate'], componente=prod_map['Leite condensado'], quantidade=0.300),
            ComponenteReceita(receita=prod_map['Brigadeiro'], componente=prod_map['Leite condensado'], quantidade=0.790),
            ComponenteReceita(receita=prod_map['Brigadeiro'], componente=prod_map['Chocolate em po'], quantidade=0.120),
            ComponenteReceita(receita=prod_map['Brigadeiro'], componente=prod_map['Manteiga'], quantidade=0.020),
            ComponenteReceita(receita=prod_map['Bolo de pote de chocolate'], componente=prod_map['Massa de bolo'], quantidade=0.120),
            ComponenteReceita(receita=prod_map['Bolo de pote de chocolate'], componente=prod_map['Brigadeiro'], quantidade=0.100),
            ComponenteReceita(receita=prod_map['Bolo de pote de chocolate'], componente=prod_map['Granulado de chocolate'], quantidade=0.020),
            ComponenteReceita(receita=prod_map['Brownie base'], componente=prod_map['Chocolate meio amargo'], quantidade=0.350),
            ComponenteReceita(receita=prod_map['Brownie base'], componente=prod_map['Manteiga'], quantidade=0.180),
            ComponenteReceita(receita=prod_map['Brownie base'], componente=prod_map['Acucar'], quantidade=0.220),
            ComponenteReceita(receita=prod_map['Brownie base'], componente=prod_map['Ovos'], quantidade=4),
            ComponenteReceita(receita=prod_map['Brownie base'], componente=prod_map['Farinha de trigo'], quantidade=0.120),
            ComponenteReceita(receita=prod_map['Ganache de chocolate'], componente=prod_map['Chocolate meio amargo'], quantidade=0.600),
            ComponenteReceita(receita=prod_map['Ganache de chocolate'], componente=prod_map['Creme de leite'], quantidade=0.400),
            ComponenteReceita(receita=prod_map['Brownie recheado'], componente=prod_map['Brownie base'], quantidade=0.100),
            ComponenteReceita(receita=prod_map['Brownie recheado'], componente=prod_map['Ganache de chocolate'], quantidade=0.050),
            ComponenteReceita(receita=prod_map['Brownie recheado'], componente=prod_map['Brigadeiro'], quantidade=0.030),
            ComponenteReceita(receita=prod_map['Massa de pizza'], componente=prod_map['Farinha de trigo'], quantidade=0.280),
            ComponenteReceita(receita=prod_map['Massa de pizza'], componente=prod_map['Oleo'], quantidade=0.030),
            ComponenteReceita(receita=prod_map['Massa de pizza'], componente=prod_map['Fermento biologico'], quantidade=0.010),
            ComponenteReceita(receita=prod_map['Massa de pizza'], componente=prod_map['Sal'], quantidade=0.008),
            ComponenteReceita(receita=prod_map['Molho de tomate'], componente=prod_map['Tomate pelado'], quantidade=0.800),
            ComponenteReceita(receita=prod_map['Molho de tomate'], componente=prod_map['Cebola'], quantidade=0.100),
            ComponenteReceita(receita=prod_map['Molho de tomate'], componente=prod_map['Alho'], quantidade=0.020),
            ComponenteReceita(receita=prod_map['Molho de tomate'], componente=prod_map['Manjericao'], quantidade=0.015),
            ComponenteReceita(receita=prod_map['Pizza margherita'], componente=prod_map['Massa de pizza'], quantidade=1),
            ComponenteReceita(receita=prod_map['Pizza margherita'], componente=prod_map['Molho de tomate'], quantidade=0.120),
            ComponenteReceita(receita=prod_map['Pizza margherita'], componente=prod_map['Mucarela'], quantidade=0.250),
            ComponenteReceita(receita=prod_map['Pizza margherita'], componente=prod_map['Manjericao'], quantidade=0.010),
            ComponenteReceita(receita=prod_map['Massa de crepe'], componente=prod_map['Farinha de trigo'], quantidade=0.300),
            ComponenteReceita(receita=prod_map['Massa de crepe'], componente=prod_map['Leite'], quantidade=0.600),
            ComponenteReceita(receita=prod_map['Massa de crepe'], componente=prod_map['Ovos'], quantidade=3),
            ComponenteReceita(receita=prod_map['Massa de crepe'], componente=prod_map['Manteiga'], quantidade=0.030),
            ComponenteReceita(receita=prod_map['Recheio de frango'], componente=prod_map['Frango desfiado'], quantidade=0.700),
            ComponenteReceita(receita=prod_map['Recheio de frango'], componente=prod_map['Catupiry'], quantidade=0.200),
            ComponenteReceita(receita=prod_map['Recheio de frango'], componente=prod_map['Cebola'], quantidade=0.080),
            ComponenteReceita(receita=prod_map['Recheio de frango'], componente=prod_map['Molho de tomate pronto'], quantidade=0.100),
            ComponenteReceita(receita=prod_map['Crepe de frango'], componente=prod_map['Massa de crepe'], quantidade=0.180),
            ComponenteReceita(receita=prod_map['Crepe de frango'], componente=prod_map['Recheio de frango'], quantidade=0.150),
            ComponenteReceita(receita=prod_map['Massa de torta amanteigada'], componente=prod_map['Farinha de trigo'], quantidade=0.500),
            ComponenteReceita(receita=prod_map['Massa de torta amanteigada'], componente=prod_map['Manteiga'], quantidade=0.250),
            ComponenteReceita(receita=prod_map['Massa de torta amanteigada'], componente=prod_map['Ovos'], quantidade=2),
            ComponenteReceita(receita=prod_map['Massa de torta amanteigada'], componente=prod_map['Sal'], quantidade=0.010),
            ComponenteReceita(receita=prod_map['Refogado base'], componente=prod_map['Cebola'], quantidade=0.300),
            ComponenteReceita(receita=prod_map['Refogado base'], componente=prod_map['Alho'], quantidade=0.050),
            ComponenteReceita(receita=prod_map['Refogado base'], componente=prod_map['Oleo'], quantidade=0.040),
            ComponenteReceita(receita=prod_map['Creme de queijo'], componente=prod_map['Catupiry'], quantidade=0.500),
            ComponenteReceita(receita=prod_map['Creme de queijo'], componente=prod_map['Creme de leite'], quantidade=0.300),
            ComponenteReceita(receita=prod_map['Creme de queijo'], componente=prod_map['Mucarela'], quantidade=0.200),
            ComponenteReceita(receita=prod_map['Recheio cremoso de frango'], componente=prod_map['Frango desfiado'], quantidade=0.550),
            ComponenteReceita(receita=prod_map['Recheio cremoso de frango'], componente=prod_map['Refogado base'], quantidade=0.180),
            ComponenteReceita(receita=prod_map['Recheio cremoso de frango'], componente=prod_map['Creme de queijo'], quantidade=0.220),
            ComponenteReceita(receita=prod_map['Torta cremosa de frango'], componente=prod_map['Massa de torta amanteigada'], quantidade=0.450),
            ComponenteReceita(receita=prod_map['Torta cremosa de frango'], componente=prod_map['Recheio cremoso de frango'], quantidade=0.650),
        ]
        session.add_all(componentes)

        await session.commit()

        from backend.app.services.produto_service import ProdutoService
        produto_service = ProdutoService(session)
        result = await session.execute(select(Produto.id).where(Produto.tipo == 'receita'))
        receita_ids = result.scalars().all()
        for _ in range(6):
            for rid in receita_ids:
                await produto_service.recompute_recipe_cost(rid)

        vendas = [
            Venda(data=date(2026, 3, 2), id_loja='RJ-COPA', id_produto='BROWNIE-001', quantidade_produto=18, valor_total=216.00),
            Venda(data=date(2026, 3, 5), id_loja='RJ-COPA', id_produto='PIZZA-MARG-001', quantidade_produto=12, valor_total=516.00),
            Venda(data=date(2026, 3, 8),  id_loja='RJ-COPA', id_produto='CREPE-FRANGO-001', quantidade_produto=21, valor_total=315.00),
            Venda(data=date(2026, 3, 12), id_loja='RJ-BARRA', id_produto='POTE-CHOC-001', quantidade_produto=30, valor_total=390.00),
            Venda(data=date(2026, 3, 18), id_loja='RJ-BARRA', id_produto='TORTA-FRANGO-001', quantidade_produto=10, valor_total=280.00),
            Venda(data=date(2026, 3, 21), id_loja='RJ-BARRA', id_produto='NUTELLA-001', quantidade_produto=14, valor_total=154.00),
            Venda(data=date(2026, 4, 2), id_loja='RJ-COPA', id_produto='PIZZA-MARG-001', quantidade_produto=16, valor_total=704.00),
            Venda(data=date(2026, 4, 4), id_loja='RJ-COPA', id_produto='BROWNIE-001', quantidade_produto=24, valor_total=300.00),
            Venda(data=date(2026, 4, 11), id_loja='RJ-COPA', id_produto='PRODUTO-SEM-VINCULO', quantidade_produto=9, valor_total=81.00),
            Venda(data=date(2026, 4, 9), id_loja='RJ-BARRA', id_produto='CREPE-FRANGO-001', quantidade_produto=27, valor_total=432.00),
            Venda(data=date(2026, 4, 12), id_loja='RJ-BARRA', id_produto='TORTA-FRANGO-001', quantidade_produto=11, valor_total=319.00),
            Venda(data=date(2026, 4, 17), id_loja='RJ-BARRA', id_produto='POTE-CHOC-001', quantidade_produto=22, valor_total=297.00),
        ]
        session.add_all(vendas)
        await session.commit()
        print("[init_db] Seed data inserted.")
