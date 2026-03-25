from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import traceback

from app.database.session import db_session
from app.database.initiliaze_db import init_db
from app.routers import pages
from app.routers.api import insumos, receitas


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager para inicialização e shutdown do app."""
    # Startup
    print("Initializing database...")
    try:
        db_session.init()
        await init_db()
        print("Database initialized successfully!")
    except Exception as e:
        print(f"Database initialization error: {e}")
        traceback.print_exc()
        raise
    yield
    # Shutdown
    await db_session.close()


app = FastAPI(
    title="CMV Mockup Empresa",
    description="Aplicação web para gerenciamento de insumos e receitas",
    version="1.0.0",
    lifespan=lifespan
)

# Templates
templates = Jinja2Templates(directory="templates")

# Static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Routers
app.include_router(pages.router)
app.include_router(insumos.router)
app.include_router(receitas.router)


# Global exception handler for debugging
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"Exception occurred: {exc}")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "type": type(exc).__name__}
    )
