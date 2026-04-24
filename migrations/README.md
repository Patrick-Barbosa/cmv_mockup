# Manual SQL Migrations

Este projeto não usa mais Alembic.

As mudanças de schema e de dados em banco persistente devem ser feitas com SQL manual, versionado em `migrations/versions/`.

Motivo principal:

- O projeto usa Supabase em produção.
- Durante os testes, o fluxo automatizado com Alembic executado pela aplicação apresentou comportamento inconsistente ao passar pelo pooler do Supabase.
- O SQL manual executado diretamente no banco funcionou de forma previsível.

Decisão adotada:

- A aplicação não executa migrations automaticamente no startup.
- Cada migration deve ser um arquivo `.sql` numerado dentro de `migrations/versions/`.
- A aplicação e o banco são evoluídos manualmente, com execução explícita dos scripts.

Convenção sugerida de nomes:

- `20260423_01_clone_public_to_prd.sql`
- `20260424_01_add_index_to_vendas.sql`

Fluxo recomendado:

1. Criar um novo arquivo SQL em `migrations/versions/`.
2. Escrever o SQL de `up` de forma idempotente quando possível.
3. Revisar e executar manualmente no banco alvo.
4. Registrar no pull request o arquivo executado e o ambiente onde foi aplicado.

Observações:

- Para mudanças sensíveis em produção, prefira testar antes em ambiente isolado.
- Quando o banco estiver atrás do pooler do Supabase, prefira execução manual com conexão apropriada e validação explícita após cada script.
