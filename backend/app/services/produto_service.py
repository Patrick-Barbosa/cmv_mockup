from sqlalchemy import select, text, func, delete
from typing import Literal, Optional, TypeVar
from pydantic import BaseModel, Field, ConfigDict
from app.database.models import Produto, ComponenteReceita
from sqlalchemy.orm import load_only
from fastapi import HTTPException

# define um TypeVar que só aceita subclasses de BaseModel
T = TypeVar('T', bound=BaseModel)

class ComponentesReceitaModel(BaseModel):
    model_config = ConfigDict(
        extra='forbid',           # não permite campos além dos declarados
        validate_assignment=True,  # validações também em atribuições posteriores
        from_attributes=True
    )

    # campos tipados explicitamente
    receita_inicial: str
    profundidade: int           = Field(..., gt=0, description='inteiro > 0')
    previous_key: Optional[str] = Field(..., description="UUID anterior ou null")
    current_key: str
    id_pai: int                 = Field(..., gt=0, description='inteiro > 0')
    pai: str
    id_componente: int          = Field(..., gt=0, description='inteiro > 0')
    nome: str
    tipo: Literal['receita', 'insumo']
    quantidade_acumulada: float
    custo: Optional[float]      = None
    unidade: Optional[str]      = None

SQL_CTE_RECURSIVO_GET_COMPONENTES_RECEITA = """
WITH RECURSIVE insumos_recursivo AS (
-- passo base: pega componentes diretos da receita inicial
SELECT
    p_receita.nome AS receita_inicial,
    1 AS profundidade,
    CAST(NULL AS VARCHAR) AS previous_key,
    CAST(uuid_generate_v4() AS VARCHAR) AS current_key,
    p_receita.id AS id_pai,
    p_receita.nome AS pai,
    cr.id_componente,
    p.nome,
    p.tipo,
    cr.quantidade AS quantidade_acumulada,
    p.custo,
    p.unidade
FROM 
    componente_receita AS cr
    -- Produto insumo
    INNER JOIN produtos AS p ON
        p.id = cr.id_componente
    -- Produto receita
    INNER JOIN produtos AS p_receita ON
        cr.id_receita = p_receita.id
WHERE 
    cr.id_receita = :receita_id

UNION ALL

-- passo recursivo: trata cada componente que seja, por sua vez, uma receita
SELECT
    ir.receita_inicial,
    ir.profundidade + 1,
    ir.current_key AS previous_key,
    CAST(uuid_generate_v4() AS VARCHAR) AS current_key,
    p_receita.id AS id_pai,
    p_receita.nome AS pai,
    cr.id_componente,
    p_comp.nome,
    p_comp.tipo,
    ir.quantidade_acumulada * (cr.quantidade / coalesce(p_receita.quantidade_base, 1)),
    p_comp.custo,
    p_comp.unidade
FROM 
    insumos_recursivo AS ir -- Contém os registros da iteração anterior, id_componente
    INNER JOIN componente_receita AS cr ON 
        cr.id_receita = ir.id_componente
    -- Produto receita
    INNER JOIN produtos AS p_receita ON
        p_receita.id = ir.id_componente
    -- Produto insumo
    INNER JOIN produtos AS p_comp ON -- Produto compoenente da receita.
        p_comp.id = cr.id_componente	
)

SELECT * FROM insumos_recursivo
"""

class ProdutoService:
    def __init__(self, session):
        self.session = session

    async def get_componentes_receita(self, receita_id: int) -> list[ComponentesReceitaModel]:
        result = await self.session.execute(
            text(SQL_CTE_RECURSIVO_GET_COMPONENTES_RECEITA),
            {"receita_id": receita_id}
        )
        # Converte cada linha num dict (chave=nome da coluna)
        rows = result.mappings().all()

        return [ComponentesReceitaModel.model_validate(r) for r in rows]
    
    async def get_receita(self, receita_id: int) -> Produto:
        result = await self.session.execute(
            select(Produto)
            .where(
                Produto.id == receita_id,
                Produto.tipo == 'receita'
            )
        )
        
        receita = result.scalar_one_or_none()
        if receita:
            return receita
        
        raise Exception(f"Receita com id={receita_id} não encontrada.")
    

    async def get_produtos_paginated_select2(self, q: str, page: int, per_page: int):
        if q and len(q) < 3:
            return {'items': [], 'pagination': {'more': False}}

        query = select(Produto).options(load_only(
            Produto.id, Produto.nome, Produto.tipo, Produto.custo,
            Produto.unidade, Produto.quantidade_referencia, Produto.preco_referencia,
            Produto.quantidade_base
        ))
        query_total = select(func.count())
        if q:
            query = query.where(Produto.nome.ilike(f"%{q}%"))
            query_total = query_total.where(Produto.nome.ilike(f"%{q}%"))

        result_total = await self.session.execute(query_total)
        total = result_total.scalar_one()

        query = (
            query
            .order_by(Produto.id)
            .offset((page-1)*per_page)
            .limit(per_page)
        )

        result_items = await self.session.execute(query)
        items = result_items.scalars().all()

        data = {
            'items': [{
                'id': p.id,
                'text': p.nome,
                'tipo': 'Insumo' if p.tipo == 'insumo' else 'Receita',
                'custo': p.custo,
                'unidade': p.unidade,
                'quantidade_referencia': p.quantidade_referencia,
                'preco_referencia': p.preco_referencia,
                'quantidade_base': p.quantidade_base,
            } for p in items],
            'pagination': {
                'more': total > page*per_page
            }
        }

        return data
    

    async def create_recipe(self, payload: T) -> int:
        receita = Produto(nome=payload.nome, tipo='receita', quantidade_base=payload.quantidade_base, unidade=payload.unidade)
        # adiciona a receita à sessão
        self.session.add(receita)
        # faz o INSERT e popula receita.id
        await self.session.flush()

        id_receita = receita.id

        # Remove duplicatas de componentes (mesmo id_componente)
        # Mantém o primeiro componente de cada id_componente
        seen = set()
        unique_components = []
        for comp in payload.componentes:
            if comp.id_componente not in seen:
                seen.add(comp.id_componente)
                unique_components.append(comp)

        # cria os links sem tocar em receita.componentes
        for comp in unique_components:
            cr = ComponenteReceita(
                id_receita=id_receita,
                id_componente=comp.id_componente,
                quantidade=comp.quantidade
            )
            self.session.add(cr)

        # não precisa de commit aqui
        return id_receita

    async def edit_insumo(self, insumo_id: int, nome: Optional[str], custo: Optional[float], unidade: Optional[str]) -> Produto:
        result = await self.session.execute(
            select(Produto).where(Produto.id == insumo_id, Produto.tipo == 'insumo')
        )
        insumo = result.scalar_one_or_none()
        if not insumo:
            raise HTTPException(status_code=404, detail=f"Insumo com id={insumo_id} não encontrado.")

        if nome is not None:
            insumo.nome = nome
        if custo is not None:
            insumo.custo = custo
        if unidade is not None:
            insumo.unidade = unidade

        await self.session.commit()
        return insumo

    async def edit_insumo_gramatura(
        self, insumo_id: int,
        nome: Optional[str],
        unidade: Optional[str],
        quantidade_referencia: Optional[float],
        preco_referencia: Optional[float],
    ) -> Produto:
        result = await self.session.execute(
            select(Produto).where(Produto.id == insumo_id, Produto.tipo == 'insumo')
        )
        insumo = result.scalar_one_or_none()
        if not insumo:
            raise HTTPException(status_code=404, detail=f"Insumo com id={insumo_id} não encontrado.")

        if nome is not None:
            insumo.nome = nome
        if unidade is not None:
            insumo.unidade = unidade
        if quantidade_referencia is not None:
            insumo.quantidade_referencia = quantidade_referencia
        if preco_referencia is not None:
            insumo.preco_referencia = preco_referencia

        # Recalcular custo unitário se ambos os valores existem
        qtd_ref = quantidade_referencia if quantidade_referencia is not None else insumo.quantidade_referencia
        preco_ref = preco_referencia if preco_referencia is not None else insumo.preco_referencia
        if qtd_ref and preco_ref is not None and qtd_ref > 0:
            insumo.custo = preco_ref / qtd_ref

        await self.session.commit()
        return insumo

    async def get_componentes_diretos(self, receita_id: int) -> list[dict]:
        """Retorna componentes diretos (1 nível) de uma receita com dados do insumo."""
        from sqlalchemy import and_
        result = await self.session.execute(
            select(
                ComponenteReceita.id_componente,
                ComponenteReceita.quantidade,
                Produto.nome,
                Produto.unidade,
                Produto.custo,
            )
            .join(Produto, Produto.id == ComponenteReceita.id_componente)
            .where(ComponenteReceita.id_receita == receita_id)
        )
        rows = result.all()
        return [
            {
                'id_componente': row.id_componente,
                'nome': row.nome,
                'unidade': row.unidade,
                'quantidade': row.quantidade,
                'custo_unitario': row.custo,
            }
            for row in rows
        ]

    async def recompute_recipe_cost(self, receita_id: int) -> None:
        """Calcula o custo da receita a partir dos componentes diretos e salva em Produto.custo."""
        componentes = await self.get_componentes_diretos(receita_id)
        custo_total = sum(
            (c['custo_unitario'] or 0) * c['quantidade']
            for c in componentes
        )
        result = await self.session.execute(
            select(Produto).where(Produto.id == receita_id)
        )
        receita = result.scalar_one_or_none()
        if receita:
            receita.custo = custo_total

    async def delete_insumo(self, insumo_id: int) -> None:
        result = await self.session.execute(
            select(Produto).where(Produto.id == insumo_id, Produto.tipo == 'insumo')
        )
        insumo = result.scalar_one_or_none()
        if not insumo:
            raise HTTPException(status_code=404, detail=f"Insumo com id={insumo_id} não encontrado.")

        # Verifica se está sendo usado em alguma receita
        uso_result = await self.session.execute(
            select(ComponenteReceita).where(ComponenteReceita.id_componente == insumo_id).limit(1)
        )
        em_uso = uso_result.scalar_one_or_none()
        if em_uso:
            raise HTTPException(
                status_code=409,
                detail=f"Insumo com id={insumo_id} está sendo usado em uma ou mais receitas e não pode ser deletado."
            )

        await self.session.delete(insumo)
        await self.session.commit()

    async def edit_receita(self, receita_id: int, nome: Optional[str], quantidade_base: Optional[float], unidade: Optional[str], componentes) -> Produto:
        result = await self.session.execute(
            select(Produto).where(Produto.id == receita_id, Produto.tipo == 'receita')
        )
        receita = result.scalar_one_or_none()
        if not receita:
            raise HTTPException(status_code=404, detail=f"Receita com id={receita_id} não encontrada.")

        if nome is not None:
            receita.nome = nome
        if quantidade_base is not None:
            receita.quantidade_base = quantidade_base
        if unidade is not None:
            receita.unidade = unidade

        if componentes is not None:
            # Remove todos os componentes atuais da receita
            await self.session.execute(
                delete(ComponenteReceita).where(ComponenteReceita.id_receita == receita_id)
            )

            # Remove duplicatas e insere os novos componentes
            seen = set()
            for comp in componentes:
                if comp.id_componente not in seen:
                    seen.add(comp.id_componente)
                    cr = ComponenteReceita(
                        id_receita=receita_id,
                        id_componente=comp.id_componente,
                        quantidade=comp.quantidade
                    )
                    self.session.add(cr)

        await self.session.commit()
        return receita

    async def delete_receita(self, receita_id: int) -> None:
        result = await self.session.execute(
            select(Produto).where(Produto.id == receita_id, Produto.tipo == 'receita')
        )
        receita = result.scalar_one_or_none()
        if not receita:
            raise HTTPException(status_code=404, detail=f"Receita com id={receita_id} não encontrada.")

        # Remove os componentes da receita primeiro
        await self.session.execute(
            delete(ComponenteReceita).where(ComponenteReceita.id_receita == receita_id)
        )

        await self.session.delete(receita)
        await self.session.commit()
