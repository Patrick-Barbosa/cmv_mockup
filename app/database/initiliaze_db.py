
from app.database.session import DB_ENGINE_KEY, DB_KEY
from app.database.models import Base, Produto, ComponenteReceita

async def init_db(app):
    async_engine = app[DB_ENGINE_KEY]
    async_session_local = app[DB_KEY]

    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    
    # Popular o banco com dados iniciais
    async with async_session_local() as session:
        # 1) Cria todos os produtos sem especificar IDs
        produtos = [
            Produto(nome='Bolo de cenoura', tipo='receita', quantidade_base=0.450),
            Produto(nome='Massa de bolo', tipo='receita', quantidade_base=1),
            Produto(nome='Nutella', tipo='insumo'),
            Produto(nome='Granulado de chocolate', tipo='insumo'),
            Produto(nome='Farinha de trigo', tipo='insumo'),
            Produto(nome='Óleo', tipo='insumo'),
            Produto(nome='Preparado de chocolate', tipo='receita', quantidade_base=1),
            Produto(nome='Chocolate em pó', tipo='insumo'),
            Produto(nome='Leite condensado', tipo='insumo'),
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