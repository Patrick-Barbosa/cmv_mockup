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
from backend.app.schemas.simulator import SimulationInput, ComponenteSimulacao
from backend.app.database.models import Produto, Venda, ComponenteReceita

async def reproduce():
    db_session.init()
    async with db_session.session_factory() as session:
        # 1. Encontrar uma receita (filha) que seja componente de outra receita (pai)
        query = text("""
            SELECT child.id as child_id, child.nome as child_nome, parent.id as parent_id, parent.nome as parent_nome, parent.id_produto_externo as parent_ext_id
            FROM dev.produtos child
            JOIN dev.componente_receita cr ON child.id = cr.id_componente
            JOIN dev.produtos parent ON cr.id_receita = parent.id
            WHERE child.tipo = 'receita' AND parent.tipo = 'receita' AND parent.id_produto_externo IS NOT NULL
            LIMIT 1
        """)
        result = await session.execute(query)
        row = result.first()
        
        if not row:
            print("Nenhuma estrutura de receita pai-filha encontrada.")
            return

        child_id, child_nome, parent_id, parent_nome, parent_ext_id = row
        print(f"Estrutura encontrada: {parent_nome} ({parent_id}) usa {child_nome} ({child_id})")

        # 2. Inserir uma venda fake para a Receita PAI em Maio 2026
        fake_venda = Venda(
            id_loja="RJ-COPA",
            id_produto=parent_ext_id,
            data=date(2026, 5, 10),
            quantidade_produto=100,
            valor_total=5000.0
        )
        session.add(fake_venda)
        await session.flush()
        
        # 3. Simular mudança na composição da receita FILHA
        # Vamos manter os componentes atuais mas aumentar a quantidade de um deles drasticamente
        service = SimulatorService(session)
        comp_result = await session.execute(
            select(ComponenteReceita).where(ComponenteReceita.id_receita == child_id)
        )
        current_comps = comp_result.scalars().all()
        
        novos_componentes = [
            ComponenteSimulacao(
                id_componente=c.id_componente,
                quantidade=c.quantidade * 100 if i == 0 else c.quantidade
            )
            for i, c in enumerate(current_comps)
        ]
        
        print(f"Simulando mudança na composição de {child_nome}...")
        input_data = SimulationInput(
            type="recipe_change",
            change_type="absoluto",
            change_value=0, # Preço de venda não muda
            recipe_id=child_id,
            novos_componentes=novos_componentes,
            store_ids=None
        )
        
        response = await service.calculate_simulation(input_data)
        
        print("\n--- Resultados da Simulação ---")
        print(f"Total Network Impact: {response.total_network_impact}")
        
        # O BUG: Se Total Network Impact for 0, significa que as vendas da Receita PAI não foram afetadas
        # pelo aumento de custo da Receita FILHA.
        
        if abs(response.total_network_impact) < 0.01:
            print("\nBUG REPRODUZIDO: O impacto na receita pai não foi cascateado!")
        else:
            print(f"\nImpacto detectado: {response.total_network_impact}. Verificando se incluiu a receita pai.")
            parent_affected = any(r.recipe_id == parent_id for r in response.results)
            if not parent_affected:
                print("A receita pai NÃO está na lista de resultados afetados.")
            else:
                print("A receita pai está na lista de resultados afetados.")
            
        await session.rollback()
    
    await db_session.close()

if __name__ == "__main__":
    asyncio.run(reproduce())
