from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import List, Optional
from backend.app.schemas.common import UNIDADES_PADRAO


class ComponenteCreateRecipeModel(BaseModel):
    model_config = ConfigDict(extra='forbid')
    id_componente: int
    quantidade: float


class CreateRecipeModel(BaseModel):
    model_config = ConfigDict(extra='forbid')
    nome: str
    quantidade_base: float
    unidade: Optional[str] = None
    componentes: List[ComponenteCreateRecipeModel] = Field(..., min_length=1)

    @field_validator('unidade')
    @classmethod
    def _validateUnidade(cls, v):
        if v is not None and v not in UNIDADES_PADRAO:
            raise ValueError(f"Unidade '{v}' inválida. Opções: {UNIDADES_PADRAO}")
        return v


class EditReceitaModel(BaseModel):
    model_config = ConfigDict(extra='forbid')
    nome: Optional[str] = None
    quantidade_base: Optional[float] = None
    unidade: Optional[str] = None
    componentes: Optional[List[ComponenteCreateRecipeModel]] = None

    @field_validator('unidade')
    @classmethod
    def _validateUnidade(cls, v):
        if v is not None and v not in UNIDADES_PADRAO:
            raise ValueError(f"Unidade '{v}' inválida. Opções: {UNIDADES_PADRAO}")
        return v
