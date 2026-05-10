import os
from backend.app.database.session import db_session, APP_ENV, DB_SCHEMA
from backend.app.database.models import Base
from backend.app.database.seed import seed_db
from sqlalchemy import inspect, text


def _schema_has_tables(sync_connection, schema: str) -> bool:
    inspector = inspect(sync_connection)
    return bool(inspector.get_table_names(schema=schema))


async def init_db():
    """Inicializa o banco de dados.

    - development/test: recria todas as tabelas (drop + create) e popula com dados de exemplo.
    - production: garante o schema e cria a estrutura base apenas se o schema estiver vazio.

    Note on Supabase schema routing:
      We set Base.metadata.schema explicitly so that SQLAlchemy generates DDL with
      the full schema qualifier (e.g. dev.produtos ...).
    """

    Base.metadata.schema = DB_SCHEMA
    print(f"[init_db] APP_ENV={APP_ENV} - target schema: '{DB_SCHEMA}'")

    async with db_session.engine.begin() as conn:
        await conn.execute(text(f'CREATE SCHEMA IF NOT EXISTS "{DB_SCHEMA}"'))

        if APP_ENV in ["development", "test"]:
            print(f"[init_db] Dropping and recreating tables in schema '{DB_SCHEMA}'...")
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)
            print("[init_db] Tables ready.")
        else:
            schema_has_tables = await conn.run_sync(_schema_has_tables, DB_SCHEMA)
            if not schema_has_tables:
                print(f"[init_db] Schema '{DB_SCHEMA}' vazio em produção - criando tabelas base.")
                await conn.run_sync(Base.metadata.create_all)
                print("[init_db] Base tables created in production schema.")
            else:
                print("[init_db] Persistent environment detected - schema already has tables.")

    if APP_ENV not in ["development", "test"]:
        print(f"[init_db] {APP_ENV} mode - skipping seed data.")
        return

    async with db_session.session_factory() as session:
        await seed_db(session)
        print("[init_db] Seed data process finished.")
