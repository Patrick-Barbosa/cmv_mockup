from pydantic import BaseModel, Field, field_validator
from typing import Optional

UNIDADES_PADRAO = ["g", "kg", "ml", "l", "un", "cx", "pct", "tb", "ds"]


class PaginatedParamsModel(BaseModel):
    q: Optional[str] = None
    page: int = 1
    per_page: int = 20

    @field_validator('q', mode='before')
    @classmethod
    def _strip_q(cls, v):
        if isinstance(v, str):
            return v.strip()
        return v
