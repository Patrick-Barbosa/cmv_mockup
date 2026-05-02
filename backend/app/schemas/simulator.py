from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Optional, List


class ComponenteSimulacao(BaseModel):
    model_config = ConfigDict(extra='forbid')
    id_componente: int
    quantidade: float


class SimulationInput(BaseModel):
    model_config = ConfigDict(extra='forbid')
    type: str = Field(..., description="price_change ou recipe_change")
    ingredient_id: Optional[int] = None
    recipe_id: Optional[int] = None
    change_type: str = Field(..., description="percentual ou absoluto")
    change_value: float = Field(..., description="Valor da mudança (ex: 10 para 10% ou 5.00 para R$5)")
    store_ids: Optional[List[int]] = None
    novos_componentes: Optional[List[ComponenteSimulacao]] = None

    @field_validator('type')
    @classmethod
    def _validateType(cls, v):
        if v not in ('price_change', 'recipe_change'):
            raise ValueError("Type deve ser 'price_change' ou 'recipe_change'")
        return v

    @field_validator('change_type')
    @classmethod
    def _validateChangeType(cls, v):
        if v not in ('percentual', 'absoluto'):
            raise ValueError("change_type deve ser 'percentual' ou 'absoluto'")
        return v


class SimulationResult(BaseModel):
    recipe_id: int
    recipe_name: str
    current_cost: float
    new_cost: float
    cost_difference: float
    cost_percent_change: float
    monthly_sales_quantity: float
    monthly_revenue_current: float
    monthly_revenue_new: float
    revenue_impact: float
    revenue_impact_percent: float


class StoreImpact(BaseModel):
    store_id: str
    total_current_cost: float
    total_new_cost: float
    total_impact: float
    total_impact_percent: float
    affected_recipes_count: int


class SimulationResponse(BaseModel):
    simulation_type: str
    ingredient_name: Optional[str] = None
    recipe_name: Optional[str] = None
    change_applied: str
    total_network_impact: float
    total_network_impact_percent: float
    results: List[SimulationResult]
    store_ranking: List[StoreImpact]
    projection_month: str
    projection_type: str


class AffectedRecipePreview(BaseModel):
    recipe_id: int
    recipe_name: str
    current_cost: float


class StoreInfo(BaseModel):
    store_id: str