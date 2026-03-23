from sqlalchemy import select, text, func
from typing import Literal, Optional, TypeVar
from pydantic import BaseModel, Field, ConfigDict
from app.database.models import Produto, ComponenteReceita
from sqlalchemy.orm import load_only

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
    cr.quantidade AS quantidade_acumulada
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
    ir.quantidade_acumulada * (cr.quantidade / coalesce(p_receita.quantidade_base, 1))
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

        query = select(Produto).options(load_only(Produto.id, Produto.nome, Produto.tipo))
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
            'items': [{'id': p.id, 'text': p.nome, "tipo": 'Insumo' if p.tipo == 'insumo' else 'Receita'} for p in items],
            'pagination': {
                'more': total > page*per_page
            }
        }
        
        return data
    

    async def create_recipe(self, payload: T) -> int:
        receita = Produto(nome=payload.nome, tipo='receita', quantidade_base=payload.quantidade_base)
        # adiciona a receita à sessão
        self.session.add(receita)
        # faz o INSERT e popula receita.id
        await self.session.flush()

        id_receita = receita.id

        # cria os links sem tocar em receita.componentes
        for comp in payload.componentes:
            cr = ComponenteReceita(
                id_receita=id_receita,
                id_componente=comp.id_componente,
                quantidade=comp.quantidade
            )
            self.session.add(cr)

        # não precisa de commit aqui
        return id_receita
            