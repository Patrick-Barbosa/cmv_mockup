from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from backend.app.database.session import DbSession
from backend.app.services.simulator_service import SimulatorService
from backend.app.schemas.simulator import (
    SimulationInput, SimulationResponse, AffectedRecipePreview, StoreInfo,
    SimulationEvolutionResponse, ProductInfoResponse
)

router = APIRouter(prefix="/api/simulator", tags=["Simulador"])


@router.post("/simulate", response_model=SimulationResponse)
async def create_simulation(
    input_data: SimulationInput,
    session: DbSession
):
    """
    Cria uma simulação de impacto

    - **type**: price_change ou recipe_change
    - **ingredient_id**: ID do insumo (obrigatório se type=price_change)
    - **recipe_id**: ID da receita (obrigatório se type=recipe_change)
    - **change_type**: percentual ou absoluto
    - **change_value**: Valor da mudança
    - **store_ids**: Lista opcional de IDs de lojas para filtrar
    - **novos_componentes**: Lista de componentes (obrigatório se type=recipe_change)

    Retorna impacto completo na rede com ranking por loja.
    """
    import traceback as tb
    try:
        async with session.begin():
            service = SimulatorService(session)
            result = await service.calculate_simulation(input_data)
            return result
    except HTTPException:
        raise
    except Exception as e:
        full_trace = ''.join(tb.format_exception(type(e), e, e.__traceback__))
        print(f"[DEBUG] Exception in create_simulation: {e}")
        print(f"[DEBUG] Traceback: {full_trace}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/ingredients/{ingredient_id}/affected-recipes", response_model=list[AffectedRecipePreview])
async def get_affected_recipes(ingredient_id: int, session: DbSession):
    """
    Lista todas as receitas que seriam afetadas por mudança neste insumo
    Útil para preview antes de simular.
    """
    try:
        async with session.begin():
            service = SimulatorService(session)
            result = await service.get_affected_recipes(ingredient_id)
            return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/stores")
async def get_stores(session: DbSession):
    """
    Lista lojas disponíveis para filtragem
    """
    try:
        async with session.begin():
            service = SimulatorService(session)
            stores = await service.get_stores()
            return stores
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/evolution", response_model=SimulationEvolutionResponse)
async def get_evolution(
    month: str = Query(..., description="Mês no formato YYYY-MM (ex: 2026-04)"),
    type: str = Query(..., description="price_change ou recipe_change"),
    ingredient_id: Optional[int] = Query(None, description="ID do insumo (obrigatório se type=price_change)"),
    recipe_id: Optional[int] = Query(None, description="ID da receita (obrigatório se type=recipe_change)"),
    change_type: str = Query(..., description="percentual ou absoluto"),
    change_value: float = Query(..., description="Valor da mudança"),
    store_ids: Optional[str] = Query(None, description="Lista de lojas separadas por vírgula (ex: RJ-COPA,RJ-BARRA)"),
    impacted_only: bool = Query(False, description="Se true, mostra apenas vendas das receitas impactadas"),
    session: DbSession = None
):
    """
    Retorna dados de evolução diária para gráfico de linha comparando cenário atual vs novo.
    """
    store_id_list = None
    if store_ids:
        store_id_list = [s.strip() for s in store_ids.split(",") if s.strip()]
    
    try:
        async with session.begin():
            service = SimulatorService(session)
            result = await service.get_daily_evolution(
                month=month,
                type=type,
                ingredient_id=ingredient_id,
                recipe_id=recipe_id,
                change_type=change_type,
                change_value=change_value,
                store_ids=store_id_list,
                impacted_only=impacted_only
            )
            return result
    except HTTPException:
        raise
    except Exception as e:
        import traceback as tb
        full_trace = ''.join(tb.format_exception(type(e), e, e.__traceback__))
        print(f"[DEBUG] Exception in get_evolution: {e}")
        print(f"[DEBUG] Traceback: {full_trace}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/product-info/{product_id}", response_model=ProductInfoResponse)
async def get_product_info(product_id: int, session: DbSession):
    """
    Retorna informações de preço de venda de um produto/receita.
    - Se tem preco_venda cadastrado: retorna ele (source: preco_cadastrado)
    - Se não tem: busca preco_medio das vendas (source: preco_medio_vendas)
    - Se não há vendas: retorna is_vendido: false (source: indisponivel)
    """
    try:
        async with session.begin():
            service = SimulatorService(session)
            result = await service.get_product_info(product_id)
            return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))