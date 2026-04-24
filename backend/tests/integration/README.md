# Testes de integracao com Postgres

Estes testes usam uma instancia real de Postgres dedicada para testes. O banco
deve ser iniciado manualmente antes da execucao dos testes:

```bash
docker compose -f docker-compose.test.yml -p cmv_test up -d db-test
```

Com o `docker-compose.test.yml`, a URL usada pelos testes e fixa:

```bash
postgresql+asyncpg://postgres:postgres@localhost:5431/postgres
```

Para rodar:

```bash
python -m pytest backend/tests/integration
```

Para parar o banco de testes:

```bash
docker compose -f docker-compose.test.yml -p cmv_test down
```

O `docker-compose.test.yml` usa armazenamento `tmpfs`, entao os dados do banco
de testes nao persistem depois que o container e parado.

Cada teste tambem cria um schema temporario no banco, cria as tabelas reais com
`Base.metadata.create_all`, executa o teste com `AsyncSession` real e remove o
schema no final com `DROP SCHEMA ... CASCADE`.

Se o Postgres nao estiver acessivel, os testes de integracao sao pulados com
uma mensagem indicando para subir o banco de testes.
