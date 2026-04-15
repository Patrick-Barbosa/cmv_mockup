from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional
from backend.app.schemas.common import UNIDADES_PADRAO


class CreateProductModel(BaseModel):
    model_config = ConfigDict(extra='forbid')
    nome: str
    unidade: str
    quantidade_referencia: float
    preco_referencia: float
    id_produto_externo: Optional[str] = None

    @field_validator('unidade')
    @classmethod
    def _validateUnidade(cls, v):
        if v not in UNIDADES_PADRAO:
            raise ValueError(f"Unidade '{v}' inválida. Opções: {UNIDADES_PADRAO}")
        return v

    @field_validator('quantidade_referencia')
    @classmethod
    def _validateQtdRef(cls, v):
        if v <= 0:
            raise ValueError("Quantidade de referência deve ser maior que zero.")
        return v

    @field_validator('preco_referencia')
    @classmethod
    def _validatePrecoRef(cls, v):
        if v < 0:
            raise ValueError("Preço de referência não pode ser negativo.")
        return v

    @field_validator('id_produto_externo', mode='before')
    @classmethod
    def _normalizeIdProdutoExterno(cls, v):
        if v is None:
            return None
        text = str(v).strip()
        return text or None


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
    unidade: Optional[str] = None
    quantidade_referencia: Optional[float] = None
    preco_referencia: Optional[float] = None
    id_produto_externo: Optional[str] = None

    @field_validator('unidade')
    @classmethod
    def _validateUnidade(cls, v):
        if v is not None and v not in UNIDADES_PADRAO:
            raise ValueError(f"Unidade '{v}' inválida. Opções: {UNIDADES_PADRAO}")
        return v

    @field_validator('quantidade_referencia')
    @classmethod
    def _validateQtdRef(cls, v):
        if v is not None and v <= 0:
            raise ValueError("Quantidade de referência deve ser maior que zero.")
        return v

    @field_validator('preco_referencia')
    @classmethod
    def _validatePrecoRef(cls, v):
        if v is not None and v < 0:
            raise ValueError("Preço de referência não pode ser negativo.")
        return v

    @field_validator('id_produto_externo', mode='before')
    @classmethod
    def _normalizeIdProdutoExterno(cls, v):
        if v is None:
            return None
        text = str(v).strip()
        return text or None
