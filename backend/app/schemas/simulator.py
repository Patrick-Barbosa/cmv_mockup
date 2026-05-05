from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Optional, List, Literal


class ComponenteSimulacao(BaseModel):
    model_config = ConfigDict(extra='forbid')
    id_componente: int
    quantidade: float
    tipo: Optional[Literal['insumo', 'receita']] = None
    sub_componentes: Optional[List['ComponenteSimulacao']] = None


ComponenteSimulacao.model_rebuild()


class SimulationInput(BaseModel):
    model_config = ConfigDict(extra='forbid')
    type: str = Field(..., description="price_change ou recipe_change")
    ingredient_id: Optional[int] = None
    recipe_id: Optional[int] = None
    change_type: str = Field(..., description="percentual ou absoluto")
    change_value: float = Field(..., description="Valor da mudança (ex: 10 para 10% ou 5.00 para R$5)")
    store_ids: Optional[List[str]] = None
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
    ingredient_quantity: float = Field(default=0.0, description="Quantidade do insumo usada na receita (na unidade do insumo)")
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
    gross_margin: float = Field(default=0.0, description="Margem bruta atual da loja em percentual ((receita - custo) / receita * 100)")
    gross_margin_new: float = Field(default=0.0, description="Margem bruta da loja após simulação em percentual")


class SimulationResponse(BaseModel):
    simulation_type: str
    ingredient_name: Optional[str] = None
    recipe_name: Optional[str] = None
    change_applied: str
    total_network_impact: float
    total_network_impact_percent: float
    avg_impact_per_store: float = Field(default=0.0, description="Impacto médio por loja em R$")
    avg_impact_per_store_percent: float = Field(default=0.0, description="Impacto médio por loja em percentual")
    avg_impact_per_recipe: float = Field(default=0.0, description="Impacto médio por receita em R$")
    avg_impact_per_recipe_percent: float = Field(default=0.0, description="Impacto médio por receita em percentual")
    ingredient_impact: float = Field(default=0.0, description="Impacto absoluto no insumo em R$ (para price_change: nova_diff * quantidade_referencia)")
    ingredient_impact_percent: float = Field(default=0.0, description="Percentual de mudança aplicada ao insumo (para price_change) ou mudança no custo da receita (para recipe_change)")
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


# Evolution Daily - Entrega 2
class DailyEvolutionData(BaseModel):
    date: str = Field(..., description="Data no formato YYYY-MM-DD")
    store_id: Optional[str] = Field(default=None, description="ID da loja (null se consolidado)")
    day_of_week: str = Field(..., description="Nome do dia da semana em português")
    current_cost_total: float = Field(default=0.0, description="Custo total das vendas neste dia (sem simulação)")
    new_cost_total: float = Field(default=0.0, description="Custo total das vendas neste dia (com simulação)")
    current_cost_avg_per_recipe: float = Field(default=0.0, description="Custo médio por receita (sem simulação)")
    new_cost_avg_per_recipe: float = Field(default=0.0, description="Custo médio por receita (com simulação)")
    sales_quantity: float = Field(default=0.0, description="Quantidade de itens vendidos neste dia")
    sales_revenue: float = Field(default=0.0, description="Faturamento deste dia")


class EvolutionSummary(BaseModel):
    total_days: int
    total_current_cost: float
    total_new_cost: float
    total_impact: float
    total_impact_percent: float
    avg_daily_sales: float
    avg_daily_revenue: float


class SimulationEvolutionResponse(BaseModel):
    month: str
    type: str
    ingredient_name: Optional[str] = None
    recipe_name: Optional[str] = None
    daily_data: List[DailyEvolutionData]
    summary: EvolutionSummary


# Product Info - Preço de Venda
class ProductInfoResponse(BaseModel):
    product_id: int
    product_name: str
    product_type: str
    preco_venda: Optional[float] = None
    custo_atual: Optional[float] = Field(default=None, description="Custo unitário atual do insumo (apenas para insumos)")
    unidade_medida: Optional[str] = Field(default=None, description="Unidade de medida do insumo (apenas para insumos)")
    source: str  # "preco_cadastrado" | "preco_medio_vendas" | "indisponivel"
    is_vendido: bool