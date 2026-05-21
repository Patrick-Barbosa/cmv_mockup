import asyncio
import os
import sys
from datetime import date

# Adicionar o diretório raiz ao path para poder importar o backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from backend.app.database.session import db_session
from backend.app.services.simulator_service import SimulatorService
from backend.app.schemas.simulator import SimulationInput
from backend.app.database.models import Produto, Venda

async def reproduce():
    db_session.init()
    async with db_session.session_factory() as session:
        # 1. Escolher um insumo real que tenha receitas associadas
        query = text("""
            SELECT p.id, p.nome, p.custo, r.id_produto_externo as recipe_ext_id, r.nome as recipe_nome
            FROM dev.produtos p
            JOIN dev.componente_receita cr ON p.id = cr.id_componente
            JOIN dev.produtos r ON cr.id_receita = r.id
            WHERE p.tipo = 'insumo' AND r.id_produto_externo IS NOT NULL
            LIMIT 1
        """)
        result = await session.execute(query)
        row = result.first()
        
        if not row:
            print("Nenhum insumo com receita que tenha id_produto_externo encontrado.")
            return

        insumo_id, insumo_nome, insumo_custo, recipe_ext_id, recipe_nome = row
        print(f"Insumo: {insumo_nome} (ID: {insumo_id}), Custo atual: {insumo_custo}")
        print(f"Receita afetada: {recipe_nome} ({recipe_ext_id})")

        # Inserir uma venda fake para Maio 2026
        fake_venda = Venda(
            id_loja="RJ-COPA",
            id_produto=recipe_ext_id,
            data=date(2026, 5, 10),
            quantidade_produto=100,
            valor_total=5000.0
        )
        session.add(fake_venda)
        await session.flush()
        
        # 3. Aumentar o preço drasticamente
        new_price = insumo_custo + 1000.0
        print(f"Novo preço simulado: {new_price}")
        
        service = SimulatorService(session)
        input_data = SimulationInput(
            type="price_change",
            change_type="absoluto",
            change_value=new_price,
            ingredient_id=insumo_id,
            store_ids=None
        )
        
        response = await service.calculate_simulation(input_data)
        
        print("\n--- Resultados da Simulação ---")
        print(f"Total Network Impact: {response.total_network_impact}")
        print(f"Total Network Impact %: {response.total_network_impact_percent}")
        print(f"Current CMV: {response.current_cmv}%")
        print(f"New CMV: {response.new_cmv}%")
        print(f"CMV Diff: {response.cmv_diff}%")
        
        if response.total_network_impact < 0:
            print("\nLOGICA CONFIRMADA: O backend retorna impacto NEGATIVO para perda de lucro (aumento de custo).")
        else:
            print(f"\nLOGICA: O backend retorna impacto {response.total_network_impact} (positivo?).")
            
        await session.rollback()
    
    await db_session.close()

if __name__ == "__main__":
    asyncio.run(reproduce())
