# Diretrizes e Boas Práticas para Pull Requests (PRs)

Este documento define os padrões adotados para a criação e revisão de Pull Requests no projeto **Prato (CMV Mockup Empresa)**.

## 👥 Papéis Padrão (Defaults)

Caso não seja especificado o contrário no momento da criação do PR, devem ser adotados os seguintes papéis por padrão:

- **Assignee (Encarregado):** `@Patrick-Barbosa` (Responsável pelo desenvolvimento/execução da tarefa).
- **Reviewer (Revisor):** `@DedecoSantos` (Responsável por aprovar as mudanças submetidas).

## ✅ Boas Práticas para PRs

1. **Título Descritivo e Padronizado:** Utilize [Conventional Commits](https://www.conventionalcommits.org/); inicie o título com o tipo (ex: `feat:`, `fix:`, `docs:`, `refactor:`).
2. **Descrição Completa:** Todo PR deve responder claramente:
   - *O que foi feito?* (Liste as mudanças principais).
   - *Por que foi feito?* (Contexto, bug corrigido ou regra de negócio).
3. **Revisão de Código:** O autor do PR deve garantir que o código foi testado localmente. Testes de integração devem ser incluídos caso a funcionalidade afete regras de negócio centrais (ex: CMV).
4. **Resolução de Conflitos:** Antes de pedir a revisão, certifique-se de que a branch do PR está atualizada com a `main` e sem conflitos.
5. **Acompanhamento:** Qualquer ajuste solicitado pelo revisor deve ser discutido na thread e as correções enviadas para a mesma branch.
6. **Branch com Commits:** Antes de criar o PR, certifique-se de que a branch contém commits e foi pushed para o repositório remoto.

## ⚙️ Configuração do PR (Obligatório)

Ao criar um PR, configure **todas** as propriedades diretamente na interface do GitHub:

| Propriedade | Como Configurar | Obrigatório |
|-------------|-----------------|-------------|
| **Assignee** | Sidebar → Assignees → selecione `@Patrick-Barbosa` | ✅ Sim |
| **Reviewer** | Sidebar → Reviewers → adicione `@DedecoSantos` | ✅ Sim |
| **Labels** | Sidebar → Labels → selecione `backend`, `feature`, etc. | ✅ Sim |

⚠️ **Importante:** Não use comentários para solicitar assignee, reviewer ou labels. Configure diretamente nas propriedades do PR para que a notificação seja automática.

## 🏷️ Utilização de Labels (Etiquetas)

As labels ajudam a categorizar o contexto, o escopo e o tipo de mudança que o PR carrega. Ao abrir um PR, utilize a combinação correta de labels listadas abaixo:

- **Escopo do Sistema:** Use `frontend`, `backend`, `api`, `dashboard`, `devops` para indicar que parte do sistema foi tocada.
- **Tipo da Mudança:** Use `feature` (nova funcionalidade), `fix` (correção de erro), `refact` (melhoria ou reestruturação sem mudar comportamento) e `documentation`.
- **Status do PR:** `review` (quando precisar especificamente de análise extra), `question` (quando aguardar resposta).

### Lista de Labels Existentes no Repositório Hoje:

- `api`
- `backend`
- `bug` (Algo não está funcionando)
- `dashboard`
- `devops`
- `documentation` (Melhorias na documentação)
- `duplicate` (A issue/PR é repetida)
- `enhancement` (Nova funcionalidade/pedido)
- `feature`
- `fix`
- `frontend`
- `good first issue` (Bom para iniciantes)
- `help wanted` (Precisa de atenção extra)
- `invalid` (Não parece correto)
- `prompt`
- `question` (Informação adicional solicitada)
- `refact`
- `review`
- `wontfix` (Não será implementado/corrigido)
