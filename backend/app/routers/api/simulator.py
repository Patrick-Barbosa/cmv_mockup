from fastapi import APIRouter, HTTPException
from backend.app.database.session import DbSession
from backend.app.services.simulator_service import SimulatorService
from backend.app.schemas.simulator import SimulationInput, SimulationResponse, AffectedRecipePreview, StoreInfo

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