---
name: check-ui-guidelines
description: Lê o guia de estilos e componentes UI registrados para garantir conformidade com o Design System. Use ao criar ou modificar componentes do frontend ou quando precisar entender as regras de estilo.
---

# Check UI Guidelines

Este skill garante que todas as alterações ou criações no frontend sigam o Design System estabelecido no projeto.

## Quando usar

- Antes de criar um novo componente React.
- Ao modificar estilos CSS ou Tailwind.
- Para verificar quais componentes da biblioteca (shadcn/ui, etc) estão disponíveis.

## Como usar

Execute o script para obter um resumo do guia de estilos e da lista de componentes.

### Consultar diretrizes de UI

```bash
python3 scripts/read_ui_guidelines.py
```

O comando retornará:
- Conteúdo do `frontend/agent_knowledge/style.md`: Regras de cores, tipografia e espaçamento.
- Conteúdo do `frontend/components.json`: Configuração de componentes e aliases do projeto.
