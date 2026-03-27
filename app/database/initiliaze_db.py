
from app.database.session import db_session
from app.database.models import Base, Produto, ComponenteReceita
from contextlib import asynccontextmanager
from sqlalchemy import select


async def init_db():
    """Inicializa o banco de dados: drop, create e populates com dados de exemplo."""
    
    async with db_session.engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    # Popular o banco com dados iniciais
    async with db_session.session_factory() as session:
        # 1) Cria todos os produtos sem especificar IDs
        produtos = [
            Produto(nome='Bolo de cenoura', tipo='receita', quantidade_base=0.450),
            Produto(nome='Massa de bolo', tipo='receita', quantidade_base=1),
            Produto(nome='Nutella', tipo='insumo', unidade='g', quantidade_referencia=650, preco_referencia=32.90, custo=32.90/650),
            Produto(nome='Granulado de chocolate', tipo='insumo', unidade='g', quantidade_referencia=500, preco_referencia=8.50, custo=8.50/500),
            Produto(nome='Farinha de trigo', tipo='insumo', unidade='kg', quantidade_referencia=1, preco_referencia=5.90, custo=5.90),
            Produto(nome='Óleo', tipo='insumo', unidade='ml', quantidade_referencia=900, preco_referencia=9.50, custo=9.50/900),
            Produto(nome='Preparado de chocolate', tipo='receita', quantidade_base=1),
            Produto(nome='Chocolate em pó', tipo='insumo', unidade='g', quantidade_referencia=400, preco_referencia=12.90, custo=12.90/400),
            Produto(nome='Leite condensado', tipo='insumo', unidade='g', quantidade_referencia=395, preco_referencia=6.50, custo=6.50/395),
        ]

        # outros_produtos_teste = [Produto(nome=f"Produto_{i}", tipo="insumo") for i in range(100)]
        # produtos.extend(outros_produtos_teste)
        # session.add_all(produtos)

        # 2) Flush para obter IDs sem dar commit
        await session.flush()

        # 3) Mapeia por nome para facilitar na hora de criar componentes
        prod_map = {p.nome: p for p in produtos}

        # 4) Cria os componentes referenciando os próprios objetos
        componentes = [
            ComponenteReceita(receita=prod_map['Bolo de cenoura'],
                            componente=prod_map['Massa de bolo'],
                            quantidade=0.300),
            ComponenteReceita(receita=prod_map['Bolo de cenoura'],
                            componente=prod_map['Nutella'],
                            quantidade=0.050),
            ComponenteReceita(receita=prod_map['Bolo de cenoura'],
                            componente=prod_map['Granulado de chocolate'],
                            quantidade=0.050),
            ComponenteReceita(receita=prod_map['Massa de bolo'],
                            componente=prod_map['Farinha de trigo'],
                            quantidade=0.800),
            ComponenteReceita(receita=prod_map['Massa de bolo'],
                            componente=prod_map['Óleo'],
                            quantidade=0.100),
            ComponenteReceita(receita=prod_map['Massa de bolo'],
                            componente=prod_map['Preparado de chocolate'],
                            quantidade=0.100),
            ComponenteReceita(receita=prod_map['Preparado de chocolate'],
                            componente=prod_map['Chocolate em pó'],
                            quantidade=0.700),
            ComponenteReceita(receita=prod_map['Preparado de chocolate'],
                            componente=prod_map['Leite condensado'],
                            quantidade=0.300),
        ]
        session.add_all(componentes)

        # 5) Finalmente comita tudo de uma vez só
        await session.commit()

        # 6) Calcula o custo das receitas (2 passes para receitas aninhadas)
        from app.services.produto_service import ProdutoService
        produto_service = ProdutoService(session)
        result = await session.execute(select(Produto.id).where(Produto.tipo == 'receita'))
        receita_ids = result.scalars().all()
        for _ in range(2):
            for rid in receita_ids:
                await produto_service.recompute_recipe_cost(rid)
        await session.commit()