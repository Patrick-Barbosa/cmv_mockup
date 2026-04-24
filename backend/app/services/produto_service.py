from sqlalchemy import select, text, func, delete, update, case, and_, literal
from typing import Literal, Optional, TypeVar
from pydantic import BaseModel, Field, ConfigDict
from backend.app.database.models import Produto, ComponenteReceita
from backend.app.database.session import DB_SCHEMA
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

def _qualify_table(table_name: str) -> str:
    return f'"{DB_SCHEMA}".{table_name}'


SQL_CTE_RECURSIVO_GET_COMPONENTES_RECEITA = f"""
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
    {_qualify_table("componente_receita")} AS cr
    -- Produto insumo
    INNER JOIN {_qualify_table("produtos")} AS p ON
        p.id = cr.id_componente
    -- Produto receita
    INNER JOIN {_qualify_table("produtos")} AS p_receita ON
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
    INNER JOIN {_qualify_table("componente_receita")} AS cr ON 
        cr.id_receita = ir.id_componente
    -- Produto receita
    INNER JOIN {_qualify_table("produtos")} AS p_receita ON
        p_receita.id = ir.id_componente
    -- Produto insumo
    INNER JOIN {_qualify_table("produtos")} AS p_comp ON -- Produto compoenente da receita.
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
        
        raise HTTPException(status_code=404, detail=f"Receita com id={receita_id} não encontrada.")
    

    async def get_produtos_paginated_select2(self, q: str, page: int, per_page: int):
        if q and len(q) < 3:
            return {'items': [], 'pagination': {'more': False}}

        query = select(Produto).options(load_only(
            Produto.id, Produto.nome, Produto.tipo, Produto.custo,
            Produto.unidade, Produto.quantidade_referencia, Produto.preco_referencia,
            Produto.quantidade_base, Produto.id_produto_externo
        ))
        if q:
            query = query.where(Produto.nome.ilike(f"%{q}%"))

        query = (
            query
            .order_by(Produto.id)
            .offset((page-1)*per_page)
            .limit(per_page + 1)
        )

        result_items = await self.session.execute(query)
        items = result_items.scalars().all()
        has_more = len(items) > per_page
        items = items[:per_page]

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
                'id_produto_externo': p.id_produto_externo,
            } for p in items],
            'pagination': {
                'more': has_more
            }
        }

        return data

    async def ensure_external_product_id_available(
        self,
        id_produto_externo: Optional[str],
        current_product_id: Optional[int] = None,
    ) -> None:
        if not id_produto_externo:
            return

        result = await self.session.execute(
            select(Produto).where(Produto.id_produto_externo == id_produto_externo)
        )
        existing = result.scalar_one_or_none()
        if existing and existing.id != current_product_id:
            raise HTTPException(
                status_code=409,
                detail=f"id_produto_externo '{id_produto_externo}' já está vinculado ao produto '{existing.nome}'.",
            )
    

    async def create_recipe(self, payload: T) -> int:
        await self.ensure_external_product_id_available(getattr(payload, "id_produto_externo", None))

        receita = Produto(
            nome=payload.nome,
            tipo='receita',
            quantidade_base=payload.quantidade_base,
            unidade=payload.unidade,
            id_produto_externo=getattr(payload, "id_produto_externo", None),
        )
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

        return insumo

    async def edit_insumo_gramatura(
        self, insumo_id: int,
        nome: Optional[str],
        unidade: Optional[str],
        quantidade_referencia: Optional[float],
        preco_referencia: Optional[float],
        id_produto_externo: Optional[str] = None,
        update_id_produto_externo: bool = False,
    ) -> Produto:
        result = await self.session.execute(
            select(Produto).where(Produto.id == insumo_id, Produto.tipo == 'insumo')
        )
        insumo = result.scalar_one_or_none()
        if not insumo:
            raise HTTPException(status_code=404, detail=f"Insumo com id={insumo_id} não encontrado.")

        if update_id_produto_externo:
            await self.ensure_external_product_id_available(id_produto_externo, insumo_id)

        if nome is not None:
            insumo.nome = nome
        if unidade is not None:
            insumo.unidade = unidade
        if quantidade_referencia is not None:
            insumo.quantidade_referencia = quantidade_referencia
        if preco_referencia is not None:
            insumo.preco_referencia = preco_referencia
        if update_id_produto_externo:
            insumo.id_produto_externo = id_produto_externo

        # Recalcular custo unitário se ambos os valores existem
        qtd_ref = quantidade_referencia if quantidade_referencia is not None else insumo.quantidade_referencia
        preco_ref = preco_referencia if preco_referencia is not None else insumo.preco_referencia
        if qtd_ref and preco_ref is not None and qtd_ref > 0:
            insumo.custo = preco_ref / qtd_ref

        return insumo

    async def edit_insumo_gramatura_v2(
        self, insumo_id: int,
        nome: Optional[str],
        unidade: Optional[str],
        quantidade_referencia: Optional[float],
        preco_referencia: Optional[float],
        id_produto_externo: Optional[str] = None,
        update_id_produto_externo: bool = False,
    ) -> Produto:
        """Atualiza insumo com uma única operação SQL usando UPDATE ... RETURNING."""
        values_to_update = {}

        if update_id_produto_externo:
            await self.ensure_external_product_id_available(id_produto_externo, insumo_id)

        if nome is not None:
            values_to_update["nome"] = nome
        if unidade is not None:
            values_to_update["unidade"] = unidade
        if quantidade_referencia is not None:
            values_to_update["quantidade_referencia"] = quantidade_referencia
        if preco_referencia is not None:
            values_to_update["preco_referencia"] = preco_referencia
        if update_id_produto_externo:
            values_to_update["id_produto_externo"] = id_produto_externo

        qtd_expr = func.coalesce(literal(quantidade_referencia), Produto.quantidade_referencia)
        preco_expr = func.coalesce(literal(preco_referencia), Produto.preco_referencia)

        values_to_update["custo"] = case(
            (
                and_(
                    qtd_expr.is_not(None),
                    qtd_expr > 0,
                    preco_expr.is_not(None),
                ),
                preco_expr / qtd_expr,
            ),
            else_=Produto.custo,
        )

        stmt = (
            update(Produto)
            .where(Produto.id == insumo_id, Produto.tipo == 'insumo')
            .values(**values_to_update)
            .returning(Produto)
        )

        result = await self.session.execute(stmt)
        insumo = result.scalar_one_or_none()
        if not insumo:
            raise HTTPException(status_code=404, detail=f"Insumo com id={insumo_id} não encontrado.")

        return insumo

    async def get_componentes_diretos(self, receita_id: int) -> list[dict]:
        """Retorna componentes diretos (1 nível) de uma receita com dados do insumo."""
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
    async def edit_receita(
        self,
        receita_id: int,
        nome: Optional[str],
        quantidade_base: Optional[float],
        unidade: Optional[str],
        id_produto_externo: Optional[str],
        update_id_produto_externo: bool,
        componentes,
    ) -> Produto:
        result = await self.session.execute(
            select(Produto).where(Produto.id == receita_id, Produto.tipo == 'receita')
        )
        receita = result.scalar_one_or_none()
        if not receita:
            raise HTTPException(status_code=404, detail=f"Receita com id={receita_id} não encontrada.")

        if update_id_produto_externo:
            await self.ensure_external_product_id_available(id_produto_externo, receita_id)

        if nome is not None:
            receita.nome = nome
        if quantidade_base is not None:
            receita.quantidade_base = quantidade_base
        if unidade is not None:
            receita.unidade = unidade
        if update_id_produto_externo:
            receita.id_produto_externo = id_produto_externo

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

        return receita

    async def delete_receita(self, receita_id: int) -> None:
        result = await self.session.execute(
            select(Produto).where(Produto.id == receita_id, Produto.tipo == 'receita')
        )
        receita = result.scalar_one_or_none()
        if not receita:
            raise HTTPException(status_code=404, detail=f"Receita com id={receita_id} não encontrada.")

        # Check if this recipe is used as a component in another recipe
        uso_result = await self.session.execute(
            select(ComponenteReceita)
            .where(ComponenteReceita.id_componente == receita_id)
            .limit(1)
        )
        em_uso = uso_result.scalar_one_or_none()
        if em_uso:
            raise HTTPException(
                status_code=409,
                detail=f"Receita com id={receita_id} está sendo usada como componente de outra receita e não pode ser deletada."
            )

        # Remove os componentes da receita primeiro
        await self.session.execute(
            delete(ComponenteReceita).where(ComponenteReceita.id_receita == receita_id)
        )

        await self.session.delete(receita)
