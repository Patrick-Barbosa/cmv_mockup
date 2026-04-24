# Testes de integracao com Postgres

Estes testes usam uma instancia real de Postgres. O banco deve ser iniciado
manualmente antes da execucao dos testes:

```bash
docker compose up -d db
```

Com o `docker-compose.yml` padrao do projeto, a URL usada pelos testes e fixa:

```bash
postgresql+asyncpg://postgres:postgres@localhost:5432/cmv_00
```

Para rodar:

```bash
python -m pytest backend/tests/integration
```

Cada teste cria um schema temporario no banco, cria as tabelas reais com
`Base.metadata.create_all`, executa o teste com `AsyncSession` real e remove o
schema no final com `DROP SCHEMA ... CASCADE`.

Se o Postgres nao estiver acessivel, os testes de integracao sao pulados com
uma mensagem indicando para rodar `docker compose up -d db`.
