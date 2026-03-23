
from jose import jwt
from aiohttp import web
from aiohttp_session import get_session
from aiocache import cached, Cache
from functools import wraps
from typing import Literal
from pydantic import BaseModel, ValidationError


# JWT_SECRET = "secret"  # Em produção, use algo mais seguro!
# JWT_ALGORITHM = "HS256"

# # Simula banco de dados
# fake_users = {
#     1: {"id": 1, "name": "João", "email": "joao@example.com"},
#     2: {"id": 2, "name": "Maria", "email": "maria@example.com"}
# }

# @cached(ttl=120, cache=Cache.MEMORY)
# async def get_user_from_db(user_id: int) -> dict | None:
#     return fake_users.get(user_id)

def require_login(auth_type: Literal["session", "bearer", "jwt"] = "session"):
    """
    Decorator que autentica o usuário e injeta em request.custom_user.

    Args:
        auth_type: Tipo de autenticação. Pode ser:
            - "session": Usa aiohttp_session e `user_id` na sessão
            - "bearer": Usa token Bearer no header (deve ser o ID do usuário)
            - "jwt": Usa JWT no header Authorization: Bearer <token>
    """
    def decorator(handler):
        @wraps(handler)
        async def wrapper(request: web.Request):
            user_id = None

            if auth_type == "session":
                session = await get_session(request)
                user_id = session.get("user_id")
            elif auth_type in {"bearer", "jwt"}:
                auth_header = request.headers.get("Authorization", "")
                if not auth_header.startswith("Bearer "):
                    return web.json_response({"error": "Token ausente ou inválido"}, status=401)

                token = auth_header.replace("Bearer ", "")

                if auth_type == "bearer":
                    if not token.isdigit():
                        return web.json_response({"error": "Token inválido (esperado ID numérico)"}, status=401)
                    user_id = int(token)

                elif auth_type == "jwt":
                    try:
                        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
                        user_id = payload.get("user_id")
                    except jwt.PyJWTError:
                        return web.json_response({"error": "JWT inválido"}, status=401)

            if not user_id:
                return web.json_response({"error": "Usuário não autenticado"}, status=401)

            user = await get_user_from_db(user_id)
            if not user:
                return web.json_response({"error": "Usuário não encontrado"}, status=401)

            setattr(request, "custom_user", user)
            return await handler(request)

        return wrapper
    return decorator


with_pydantic_doc = """
    Decorator para validação automática de entrada usando Pydantic v2 em rotas do aiohttp.

    Essa função decora um handler do aiohttp para:
      - Validar automaticamente o corpo da requisição (JSON, query params ou form-data)
      - Atribuir o dado validado como atributo do `request`
      - Retornar erros de validação como JSON no padrão do Pydantic

    Além disso, o decorator armazena metadados no handler para integração com OpenAPI.

    Args:
        model (type[BaseModel]): Modelo Pydantic usado para validar a entrada.
        input_type (Literal["json", "query", "form"], optional): 
            Tipo de entrada a ser validada. Pode ser:
              - `"json"`: body JSON
              - `"query"`: parâmetros da URL
              - `"form"`: dados do tipo `x-www-form-urlencoded`
            Default é `"json"`.
        request_attr (str, optional): Nome do atributo a ser adicionado no objeto `request`.
            Ex: se for `"data"`, você acessa depois `request.data`. Default é `"data"`.
        response_model (type[BaseModel] | None, optional): 
            Modelo Pydantic representando a resposta da rota. 
            Usado apenas para geração automática de documentação OpenAPI. Default é `None`.

    Returns:
        Callable: Handler decorado com validação automática e metadados para OpenAPI.

    Example:
        ```python
        @with_pydantic(LoginInput, input_type="json", response_model=LoginOutput)
        async def login_handler(request):
            data: LoginInput = request.data
            return web.json_response(LoginOutput(token="abc123").model_dump())
        ```
    """


def with_inutil():
    def decorator(handler):
        async def wrapper(request: web.Request):
            print("with_inutil")
            return await handler(request)

        return wrapper
    return decorator


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
            try:
                if input_type == "json":
                    raw_data = await request.json()
                elif input_type == "query":
                    raw_data = dict(request.rel_url.query)
                elif input_type == "form":
                    form = await request.post()
                    raw_data = dict(form)

                validated = model.model_validate(raw_data)
                setattr(request, request_attr, validated)
                return await handler(request)
            except ValidationError as e:
                return web.json_response({"errors": e.errors()}, status=400)
            except Exception:
                return web.json_response({"error": f"Erro ao interpretar input como {input_type}"}, status=400)

        # wrapper._pydantic_meta = {
        #     "input_model": model,
        #     "input_type": input_type,
        #     "response_model": response_model,
        #     "tag": tag,
        #     "description": description
        # }
        return wrapper
    return decorator



# # POST /usuarios
# @with_pydantic(UserIn)
# async def create_user(request: web.Request):
#     data: UserIn = request.data  # Já vem validado do decorator

#     # Simulação de persistência
#     user = UserOut(id=1, name=data.name, idade=25, permissoes=["leitor"])
#     return web.json_response(user.model_dump())