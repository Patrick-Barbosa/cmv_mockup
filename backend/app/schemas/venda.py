from enum import Enum
from datetime import date, datetime
from typing import List
from pydantic import BaseModel, ConfigDict, Field, field_validator


class ImportStrategy(str, Enum):
    APPEND = "append"
    OVERWRITE = "overwrite"


def _normalize_identifier(value):
# ... (rest of the file)
    if value is None:
        return None
    if isinstance(value, str):
        text = value.strip()
        return text or None
    if isinstance(value, int):
        return str(value)
    if isinstance(value, float):
        if value.is_integer():
            return str(int(value))
        return str(value).strip()
    text = str(value).strip()
    return text or None


class VendaImportRowModel(BaseModel):
    model_config = ConfigDict(extra='forbid')

    data: date
    id_loja: str
    id_produto: str
    quantidade_produto: int = Field(..., gt=0)
    valor_total: float = Field(..., ge=0)

    @field_validator('data', mode='before')
    @classmethod
    def _validateData(cls, value):
        if isinstance(value, datetime):
            return value.date()
        if isinstance(value, date):
            return value
        if isinstance(value, str):
            text = value.strip()
            if not text:
                raise ValueError("Data da venda é obrigatória.")
            for fmt in ("%Y-%m-%d", "%d/%m/%Y"):
                try:
                    return datetime.strptime(text, fmt).date()
                except ValueError:
                    continue
        raise ValueError("Data da venda inválida. Use uma data válida no Excel.")

    @field_validator('id_loja', 'id_produto', mode='before')
    @classmethod
    def _validateIdentifiers(cls, value):
        normalized = _normalize_identifier(value)
        if normalized is None:
            raise ValueError("Campo obrigatório.")
        return normalized

    @field_validator('quantidade_produto', mode='before')
    @classmethod
    def _validateQuantidade(cls, value):
        if isinstance(value, bool) or value is None:
            raise ValueError("Quantidade do produto deve ser um inteiro.")
        if isinstance(value, int):
            return value
        if isinstance(value, float) and value.is_integer():
            return int(value)
        if isinstance(value, str):
            text = value.strip()
            if text.isdigit():
                return int(text)
        raise ValueError("Quantidade do produto deve ser um inteiro.")

    @field_validator('valor_total', mode='before')
    @classmethod
    def _validateValorTotal(cls, value):
        if isinstance(value, bool) or value is None:
            raise ValueError("Valor total deve ser numérico.")
        if isinstance(value, (int, float)):
            return float(value)
        if isinstance(value, str):
            text = value.strip()
            if not text:
                raise ValueError("Valor total é obrigatório.")
            normalized = text.replace(".", "").replace(",", ".") if "," in text else text
            try:
                return float(normalized)
            except ValueError:
                pass
        raise ValueError("Valor total deve ser numérico.")


class AnaliseLojaParamsModel(BaseModel):
    model_config = ConfigDict(extra='forbid')

    store_id: str
    month: str

    @field_validator('store_id', mode='before')
    @classmethod
    def _validateStoreId(cls, value):
        normalized = _normalize_identifier(value)
        if normalized is None:
            raise ValueError("store_id é obrigatório.")
        return normalized

    @field_validator('month')
    @classmethod
    def _validateMonth(cls, value):
        try:
            datetime.strptime(value, "%Y-%m")
        except ValueError as exc:
            raise ValueError("month deve estar no formato YYYY-MM.") from exc
        return value


class BulkImportVendasModel(BaseModel):
    model_config = ConfigDict(extra='forbid')
    strategy: ImportStrategy
    rows: List[VendaImportRowModel]


class SkuAusenteModel(BaseModel):
    id_produto_externo: str
    quantidade_total: int
    valor_total: float
    vendas_count: int


class PaginatedSkusAusentesModel(BaseModel):
    total: int
    page: int
    size: int
    pages: int
    items: List[SkuAusenteModel]
