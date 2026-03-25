from pydantic import BaseModel, ConfigDict, Field
from typing import List


class ComponenteCreateRecipeModel(BaseModel):
    model_config = ConfigDict(extra='forbid')
    id_componente: int
    quantidade: float


class CreateRecipeModel(BaseModel):
    model_config = ConfigDict(extra='forbid')
    nome: str
    quantidade_base: float
    componentes: List[ComponenteCreateRecipeModel] = Field(..., min_length=1)
