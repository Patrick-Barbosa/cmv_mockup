from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import traceback
import os

from backend.app.database.session import db_session, APP_ENV
from backend.app.database.initiliaze_db import init_db
from backend.app.database.migrations import run_migrations
from backend.app.routers import pages
from backend.app.routers.api import receitas
from backend.app.routers.api import insumos
from backend.app.routers.api import vendas


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager para inicialização e shutdown do app."""
    # Startup
    print(f"Starting CMV app in APP_ENV={APP_ENV} mode...")
    try:
        db_session.init()
        await init_db()
        if APP_ENV != "development":
            await run_migrations()
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

# CORS — read allowed origins from env; fallback to wildcard only in development
_raw_origins = os.getenv("ALLOWED_ORIGINS", "")
if _raw_origins:
    # Comma-separated list, e.g. "https://prato.vercel.app,http://localhost:8080"
    allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]
else:
    # No env var set: allow all in development, restrict to nothing in production
    # (operators should always set ALLOWED_ORIGINS in production)
    allowed_origins = ["*"] if APP_ENV == "development" else []

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(pages.router)
app.include_router(insumos.router)
app.include_router(receitas.router)
app.include_router(vendas.router)


# Global exception handler for debugging
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"Exception occurred: {exc}")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "type": type(exc).__name__}
    )
