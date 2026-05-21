---
name: project-context-analyzer
description: Busca por entidades, modelos, rotas ou componentes visuais existentes no projeto usando palavras-chave. Use quando precisar verificar se algo já foi implementado ou onde certas entidades são definidas.
---

# Project Context Analyzer

Este skill ajuda a localizar rapidamente referências a termos específicos nos arquivos mais importantes do projeto (modelos, schemas, rotas e componentes).

## Quando usar

- Antes de criar um novo modelo de dados, para ver se ele já existe.
- Ao procurar por rotas de API relacionadas a uma funcionalidade.
- Para encontrar componentes de UI que podem ser reutilizados.

## Como usar

Execute o script de análise passando a palavra-chave desejada.

### Buscar por palavra-chave

```bash
python3 scripts/analyze_context.py "insumo"
```

O script retornará uma lista de arquivos que contêm o termo, organizados por:
- `backend/app/database`: Modelos SQLAlquemy.
- `backend/app/schemas`: Schemas Pydantic.
- `backend/app/routers`: Endpoints de API.
- `frontend/src/components`: Componentes React.
