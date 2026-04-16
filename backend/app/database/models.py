from sqlalchemy import (
  CheckConstraint,
  Column,
  Date,
  Float,
  ForeignKey,
  Index,
  Integer,
  String,
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class Produto(Base):
  __tablename__ = 'produtos'

  id = Column(Integer, primary_key=True)
  nome = Column(String, nullable=False, unique=True)
  tipo = Column(String, nullable=False)
  quantidade_base = Column(Float)
  custo = Column(Float)
  unidade = Column(String)
  quantidade_referencia = Column(Float)  # ex: 500 (g)
  preco_referencia = Column(Float)       # ex: 25.00 (R$)
  id_produto_externo = Column(String, nullable=True, index=True)
  
  __table_args__ = (
    CheckConstraint("tipo IN ('receita', 'insumo')", name="tipo_check"),
  )

  componentes = relationship("ComponenteReceita", back_populates="receita", foreign_keys='ComponenteReceita.id_receita', passive_deletes=True)
  usado_em = relationship("ComponenteReceita", back_populates="componente", foreign_keys='ComponenteReceita.id_componente', passive_deletes=True)

class ComponenteReceita(Base):
  __tablename__ = 'componente_receita'

  id_receita = Column(Integer, ForeignKey('produtos.id'), primary_key=True)
  id_componente = Column(Integer, ForeignKey('produtos.id'), primary_key=True)
  quantidade = Column(Float, nullable=False)

  receita = relationship("Produto", foreign_keys=[id_receita], back_populates="componentes")
  componente = relationship("Produto", foreign_keys=[id_componente], back_populates="usado_em")


class Venda(Base):
  __tablename__ = 'vendas'

  id = Column(Integer, primary_key=True)
  data = Column(Date, nullable=False)
  id_loja = Column(String, nullable=False)
  id_produto = Column(String, nullable=False)
  quantidade_produto = Column(Integer, nullable=False)
  valor_total = Column(Float, nullable=False)

  __table_args__ = (
    CheckConstraint("quantidade_produto > 0", name="vendas_quantidade_produto_positive"),
    CheckConstraint("valor_total >= 0", name="vendas_valor_total_non_negative"),
    Index("ix_vendas_loja_data", "id_loja", "data"),
    Index("ix_vendas_produto_data", "id_produto", "data"),
  )
