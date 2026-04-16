from __future__ import annotations

from alembic import op
import sqlalchemy as sa

from backend.app.database.session import DB_SCHEMA


revision = "20260415_01"
down_revision = None
branch_labels = None
depends_on = None


def _schema() -> str:
    return DB_SCHEMA


def _schema_arg() -> str | None:
    schema = _schema()
    return None if schema == "public" else schema


def _table_name(name: str) -> str:
    schema = _schema()
    if schema == "public":
        return name
    return f"{schema}.{name}"


def _inspector():
    return sa.inspect(op.get_bind())


def _table_exists(table_name: str) -> bool:
    return table_name in set(_inspector().get_table_names(schema=_schema_arg()))


def _column_names(table_name: str) -> set[str]:
    return {
        column["name"]
        for column in _inspector().get_columns(table_name, schema=_schema_arg())
    }


def _index_names(table_name: str) -> set[str]:
    return {
        index["name"]
        for index in _inspector().get_indexes(table_name, schema=_schema_arg())
    }


def upgrade() -> None:
    schema = _schema()
    schema_arg = _schema_arg()

    if schema != "public":
        op.execute(sa.text(f'CREATE SCHEMA IF NOT EXISTS "{schema}"'))

    if not _table_exists("produtos"):
        op.create_table(
            "produtos",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("nome", sa.String(), nullable=False),
            sa.Column("tipo", sa.String(), nullable=False),
            sa.Column("quantidade_base", sa.Float(), nullable=True),
            sa.Column("custo", sa.Float(), nullable=True),
            sa.Column("unidade", sa.String(), nullable=True),
            sa.Column("quantidade_referencia", sa.Float(), nullable=True),
            sa.Column("preco_referencia", sa.Float(), nullable=True),
            sa.Column("id_produto_externo", sa.String(), nullable=True),
            sa.CheckConstraint("tipo IN ('receita', 'insumo')", name="tipo_check"),
            sa.UniqueConstraint("nome"),
            schema=schema_arg,
        )

    product_columns = _column_names("produtos")
    if "id_produto_externo" not in product_columns:
        op.add_column(
            "produtos",
            sa.Column("id_produto_externo", sa.String(), nullable=True),
            schema=schema_arg,
        )

    product_indexes = _index_names("produtos")
    if "ix_produtos_id_produto_externo" not in product_indexes:
        op.create_index(
            "ix_produtos_id_produto_externo",
            "produtos",
            ["id_produto_externo"],
            unique=False,
            schema=schema_arg,
        )

    if not _table_exists("componente_receita"):
        op.create_table(
            "componente_receita",
            sa.Column("id_receita", sa.Integer(), sa.ForeignKey(_table_name("produtos.id")), primary_key=True),
            sa.Column("id_componente", sa.Integer(), sa.ForeignKey(_table_name("produtos.id")), primary_key=True),
            sa.Column("quantidade", sa.Float(), nullable=False),
            schema=schema_arg,
        )

    if not _table_exists("vendas"):
        op.create_table(
            "vendas",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("data", sa.Date(), nullable=False),
            sa.Column("id_loja", sa.String(), nullable=False),
            sa.Column("id_produto", sa.String(), nullable=False),
            sa.Column("quantidade_produto", sa.Integer(), nullable=False),
            sa.Column("valor_total", sa.Float(), nullable=False),
            sa.CheckConstraint("quantidade_produto > 0", name="vendas_quantidade_produto_positive"),
            sa.CheckConstraint("valor_total >= 0", name="vendas_valor_total_non_negative"),
            schema=schema_arg,
        )

    sales_indexes = _index_names("vendas")
    if "ix_vendas_loja_data" not in sales_indexes:
        op.create_index(
            "ix_vendas_loja_data",
            "vendas",
            ["id_loja", "data"],
            unique=False,
            schema=schema_arg,
        )
    if "ix_vendas_produto_data" not in sales_indexes:
        op.create_index(
            "ix_vendas_produto_data",
            "vendas",
            ["id_produto", "data"],
            unique=False,
            schema=schema_arg,
        )


def downgrade() -> None:
    schema_arg = _schema_arg()

    if _table_exists("vendas"):
        sales_indexes = _index_names("vendas")
        if "ix_vendas_produto_data" in sales_indexes:
            op.drop_index("ix_vendas_produto_data", table_name="vendas", schema=schema_arg)
        if "ix_vendas_loja_data" in sales_indexes:
            op.drop_index("ix_vendas_loja_data", table_name="vendas", schema=schema_arg)
        op.drop_table("vendas", schema=schema_arg)

    if _table_exists("componente_receita"):
        op.drop_table("componente_receita", schema=schema_arg)

    if _table_exists("produtos"):
        product_indexes = _index_names("produtos")
        if "ix_produtos_id_produto_externo" in product_indexes:
            op.drop_index("ix_produtos_id_produto_externo", table_name="produtos", schema=schema_arg)

        product_columns = _column_names("produtos")
        if "id_produto_externo" in product_columns:
            op.drop_column("produtos", "id_produto_externo", schema=schema_arg)
