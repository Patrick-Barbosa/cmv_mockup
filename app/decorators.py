from typing import Literal
from aiohttp import web
from pydantic import BaseModel, ValidationError

def with_pydantic(
    model: type[BaseModel],
    input_type: Literal["json", "query", "form"] = "json",
    request_attr: str = "data",
    response_model: type[BaseModel] | None = None,
    tag: str | None = None,
    description: str | None = None
):
    """
    Decorator para validação automática de dados de entrada usando modelos do Pydantic em handlers do aiohttp.

    Faz o parsing e validação dos dados do request (JSON, query params ou form-data), 
    e injeta o objeto validado no atributo especificado do objeto `request` (default: `request.data`).

    Também permite anexar metadados úteis para geração automática de documentação.

    Args:
        model (Type[BaseModel]): 
            Modelo Pydantic utilizado para validar os dados de entrada.
        input_type (Literal["json", "query", "form"], optional): 
            Origem dos dados de entrada. Pode ser:
            - "json" (default): lê do corpo JSON.
            - "query": lê dos parâmetros da URL.
            - "form": lê do corpo como form-data.
        request_attr (str, optional): 
            Nome do atributo onde o objeto validado será armazenado no request. 
            Default é "data".
        response_model (Type[BaseModel] | None, optional): 
            Modelo Pydantic que representa a resposta. 
            Usado opcionalmente para gerar documentação automática.
        tag (str | None, optional): 
            Tag associada ao endpoint para organização da documentação.
        description (str | None, optional): 
            Descrição opcional do endpoint.

    Returns:
        Callable: Handler aiohttp decorado.

    Raises:
        Retorna HTTP 400 com detalhes dos erros de validação caso os dados estejam inválidos.

    Example:
        ```python
        class InputModel(BaseModel):
            name: str
            age: int

        class ResponseModel(BaseModel):
            message: str

        @with_pydantic(InputModel, response_model=ResponseModel)
        async def hello(request):
            data = request.data
            return web.json_response({"message": f"Hello {data.name}, age {data.age}"})
        ```

        Usando query params:
        ```python
        @with_pydantic(InputModel, input_type="query")
        async def hello_query(request):
            data = request.data
            return web.json_response({"message": f"Query received from {data.name}"})
        ```
    """
    def decorator(handler):
        async def wrapper(request: web.Request):
            # === validação de input separada ===
            try:
                if input_type == "json":
                    raw_data = await request.json()
                elif input_type == "query":
                    raw_data = dict(request.rel_url.query)
                else:  # form
                    raw_data = dict(await request.post())

                validated = model.model_validate(raw_data)
                setattr(request, request_attr, validated)

            except ValidationError as ve:
                # só erro de validação vira 400 com details
                return web.json_response({"errors": ve.errors()}, status=400)
            except Exception as e:
                # qualquer outro erro no parsing vira 400 genérico
                return web.json_response(
                    {"error": f"Erro ao interpretar input como {input_type}: {e}"},
                    status=400
                )

            # === chamada do handler sem capturar HTTPExceptions ===
            try:
                return await handler(request)
            except web.HTTPException:
                # deixa o aiohttp tratar (redirects, 404, etc)
                raise
            except Exception as e:
                # aqui você pode logar o erro e devolver 500, por ex.
                request.app.logger.exception("Erro no handler")
                return web.json_response(
                    {"error": "Erro interno no servidor"},
                    status=500
                )
        # wrapper._pydantic_meta = {
        #     "input_model": model,
        #     "input_type": input_type,
        #     "response_model": response_model,
        #     "tag": tag,
        #     "description": description
        # }
        return wrapper
    return decorator