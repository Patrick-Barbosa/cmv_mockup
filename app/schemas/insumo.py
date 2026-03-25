from pydantic import BaseModel, ConfigDict


class CreateProductModel(BaseModel):
    model_config = ConfigDict(extra='forbid')
    nome: str
