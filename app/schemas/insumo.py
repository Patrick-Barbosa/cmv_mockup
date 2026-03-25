from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional
from app.schemas.common import UNIDADES_PADRAO


class CreateProductModel(BaseModel):
    model_config = ConfigDict(extra='forbid')
    nome: str
    custo: float
    unidade: str

    @field_validator('unidade')
    @classmethod
    def _validateUnidade(cls, v):
        if v not in UNIDADES_PADRAO:
            raise ValueError(f"Unidade '{v}' inválida. Opções: {UNIDADES_PADRAO}")
        return v


class UpdateCustoModel(BaseModel):
    model_config = ConfigDict(extra='forbid')
    id: int
    custo: float
    unidade: str

    @field_validator('unidade')
    @classmethod
    def _validateUnidade(cls, v):
        if v not in UNIDADES_PADRAO:
            raise ValueError(f"Unidade '{v}' inválida. Opções: {UNIDADES_PADRAO}")
        return v


class EditInsumoModel(BaseModel):
    model_config = ConfigDict(extra='forbid')
    nome: Optional[str] = None
    custo: Optional[float] = None
    unidade: Optional[str] = None

    @field_validator('unidade')
    @classmethod
    def _validateUnidade(cls, v):
        if v is not None and v not in UNIDADES_PADRAO:
            raise ValueError(f"Unidade '{v}' inválida. Opções: {UNIDADES_PADRAO}")
        return v
