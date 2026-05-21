from datetime import date, timedelta
from sqlalchemy import select, text
from backend.app.database.models import Produto, ComponenteReceita, Venda, LojaImposto
from backend.app.database.session import DB_SCHEMA
from backend.app.services.produto_service import ProdutoService

LOJAS = [
    "SP-PIN", "SP-CEN", "SP-MOR", "SP-VIL", "SP-BAR",
    "SP-TAT", "SP-SAN", "SP-JDA", "SP-IPO", "SP-LAP",
    "RJ-COPA", "RJ-BARRA", "RJ-TIJ", "RJ-BOT", "RJ-LBL",
    "RJ-MEI", "RJ-CMP", "RJ-NIT", "RJ-DUC", "RJ-REC",
    "MG-BHZ", "MG-CONT", "MG-BET", "MG-NOV", "MG-UBE",
    "MG-JUI", "MG-DIV", "MG-GOV", "MG-IPA", "MG-SBE",
]

PRODUTOS_VENDAVEIS = [
    ("POTE-CHOC-001", "Bolo de pote de chocolate", 13.00),
    ("BROWNIE-001", "Brownie recheado", 12.50),
    ("PIZZA-MARG-001", "Pizza margherita", 43.00),
    ("CREPE-FRANGO-001", "Crepe de frango", 15.00),
    ("TORTA-FRANGO-001", "Torta cremosa de frango", 28.00),
    ("NUTELLA-001", "Nutella", 11.00),
]


async def seed_db(session):
    print("[seed_db] Inserting real-world sample data...")

    # ── Produtos ──────────────────────────────────────────────────────────
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

    # ── Componentes de receita ────────────────────────────────────────────
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
    await session.flush()

    # ── Recomputa custos das receitas ─────────────────────────────────────
    produto_service = ProdutoService(session)
    result = await session.execute(select(Produto.id).where(Produto.tipo == 'receita'))
    receita_ids = result.scalars().all()
    for _ in range(6):
        for rid in receita_ids:
            await produto_service.recompute_recipe_cost(rid)

    # ── Geração massiva de vendas ─────────────────────────────────────────
    # Drop unique constraint temporariamente para permitir ~2M linhas
    print("[seed_db] Dropping unique constraint for bulk insert...")
    await session.execute(text(
        f'ALTER TABLE "{DB_SCHEMA}"."vendas" DROP CONSTRAINT IF EXISTS "uq_venda_data_loja_produto"'
    ))
    await session.commit()

    import random
    random.seed(42)

    print("[seed_db] Generating 2 million sales records...")
    ALVO = 2_000_000

    # Distribui por 14 meses para cobrir o mês atual (get_projection_months
    # retorna mês corrente ou anterior). Ex: em maio/2026, cobre abr/2025-maio/2026.
    from datetime import datetime
    hoje = datetime.now()
    LINHAS_POR_DIA_PROD = 30  # ~30 linhas de venda por produto por loja por dia
    MESES = []
    for i in range(13, -1, -1):
        m = hoje.month - i
        a = hoje.year
        while m < 1:
            m += 12
            a -= 1
        while m > 12:
            m -= 12
            a += 1
        MESES.append((m, a))
    PRECO_MAP = {sku: preco for sku, _, preco in PRODUTOS_VENDAVEIS}

    total_linhas = 0
    total_unidades = 0

    for mes, ano in MESES:
        start = date(ano, mes, 1)
        if mes == 12:
            end = date(ano + 1, 1, 1)
        else:
            end = date(ano, mes + 1, 1)
        end -= timedelta(days=1)

        current = start
        while current <= end:
            dia_semana = current.weekday()
            mult_fds = 2.0 if dia_semana >= 5 else 1.0

            batch = []
            for sku, _, _ in PRODUTOS_VENDAVEIS:
                preco = PRECO_MAP[sku]
                for loja in LOJAS:
                    for _ in range(LINHAS_POR_DIA_PROD):
                        qtd = random.randint(1, 5)
                        if dia_semana >= 5:
                            qtd = int(qtd * mult_fds)
                        valor = round(qtd * preco, 2)
                        batch.append({
                            "data": current,
                            "id_loja": loja,
                            "id_produto": sku,
                            "quantidade_produto": qtd,
                            "valor_total": valor,
                        })

            await session.execute(Venda.__table__.insert(), batch)
            total_linhas += len(batch)
            total_unidades += sum(r["quantidade_produto"] for r in batch)

            if total_linhas % 200_000 == 0:
                await session.commit()
                print(f"  ... {total_linhas:,} linhas ({total_unidades:,} unidades)")

            current += timedelta(days=1)

    await session.commit()
    print(f"[seed_db] ✅ {total_linhas:,} linhas de venda, {total_unidades:,} unidades vendidas")

    # ── LojaImposto ───────────────────────────────────────────────────────
    impostos_por_regiao = {"SP": 14.0, "RJ": 16.0, "MG": 12.0}
    impostos = []
    for loja in LOJAS:
        prefixo = loja.split("-")[0]
        impostos.append(LojaImposto(
            id_loja=loja,
            imposto_percentual=impostos_por_regiao.get(prefixo, 14.0),
        ))
    session.add_all(impostos)

    # Venda sem vínculo para testar endpoint skus-ausentes
    session.add(Venda(
        data=date(2026, 4, 11), id_loja='SP-PIN',
        id_produto='PRODUTO-SEM-VINCULO',
        quantidade_produto=9, valor_total=81.00,
    ))
    await session.commit()

    print(f"[seed_db] Seed concluído: {len(LOJAS)} lojas, {len(produtos)} produtos, {total_linhas:,} vendas")
