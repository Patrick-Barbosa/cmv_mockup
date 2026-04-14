from sqlalchemy import (
  Column, Integer, String, Float, ForeignKey, CheckConstraint, Identity
)
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, relationship, sessionmaker

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
