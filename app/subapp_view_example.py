# app/views.py
from aiohttp import web
import aiohttp_jinja2
from sqlalchemy import select
from app.database.session import get_db_session
from app.database.models import Produto

routes = web.RouteTableDef()

@routes.get('/receitas')
@aiohttp_jinja2.template('receita_home.html')
async def receitas(request):
    async with get_db_session(request) as session:
        result = await session.execute(
                select(Produto)
                .where(Produto.tipo == "receita")
        )
        
        produtos: list[Produto] = result.scalars().all()

    return {"produtos" : produtos}
