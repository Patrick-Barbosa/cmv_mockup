---
name: generate-spec-artifacts
description: Gera artefatos de especificação (requisitos, critérios de aceite e tarefas técnicas) em pastas organizadas por data dentro de brain/. Use após finalizar uma fase de descoberta ou planejamento de uma nova funcionalidade.
---

# Generate Spec Artifacts

Este skill automatiza a criação da estrutura de documentação para novas funcionalidades, garantindo que requisitos, critérios de aceite e tarefas técnicas sejam registrados de forma consistente.

## Quando usar

- Após discutir uma nova issue ou funcionalidade com o usuário.
- Para formalizar o plano de ação antes de iniciar a codificação.
- Quando precisar organizar o "cérebro" (brain) do projeto com especificações datadas.

## Como usar

Execute o script de geração passando os detalhes da funcionalidade.

### Gerar artefatos para uma nova Issue

```bash
python3 scripts/generate_artifacts.py \
  --title "Nome da Funcionalidade" \
  --requisitos "Descrição detalhada dos requisitos..." \
  --criterio "Critério 1" \
  --criterio "Critério 2" \
  --backend "Tarefa backend 1" \
  --frontend "Tarefa frontend 1"
```

O skill criará uma pasta em `brain/DD-MM-YY/issue-NN/` contendo:
- `00-requisitos-de-negocio.md`
- `01-criterios-de-aceite.md`
- `02-tarefas-tecnicas.md`
