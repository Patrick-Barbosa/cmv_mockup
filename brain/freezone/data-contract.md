# Contrato de Dados - Simulador (Frontend <-> Backend)

Este documento define as alterações e novos contratos necessários na API para suportar as novas funcionalidades avançadas do Simulador de CMV.

## 1. Payload de Simulação Hierárquica (Sub-receitas)
**Contexto:** O usuário poderá alterar a composição não apenas do primeiro nível da receita, mas de toda a árvore (ex: editar a quantidade de cebola dentro do molho de tomate que vai na pizza).
**Contrato:** O endpoint `POST /api/simulator/simulate` precisará aceitar uma árvore completa de composição em `novos_componentes`, ou o Frontend enviará um payload que descreva a receita final planificada ou hierárquica.
**Definição do Payload Esperado:**
```json
{
  "type": "recipe_change",
  "recipe_id": 4,
  "change_type": "absoluto",
  "change_value": 25.00,
  "novos_componentes": [
    {
      "id_componente": 10, // Id do Insumo ou Sub-receita
      "tipo": "insumo",
      "quantidade": 0.5
    },
    {
      "id_componente": 20, // Molho de tomate
      "tipo": "receita",
      "quantidade": 1.0,
      "sub_componentes": [
        {
          "id_componente": 5, // Cebola
          "tipo": "insumo",
          "quantidade": 0.1
        }
      ]
    }
  ]
}
```
*Ação BE:* Ajustar a validação do Pydantic para aceitar `sub_componentes` recursivamente e recalcular o custo *bottom-up*.

## 2. Impacto em Cascata (Recursividade)
**Contexto:** Ao alterar o preço de um insumo básico (ex: Cebola), TODAS as receitas que o utilizam (mesmo que de forma indireta via sub-receitas) devem ser listadas nos `results`.
**Contrato:** O motor de simulação e o endpoint `GET /api/simulator/ingredients/{id}/affected-recipes` devem usar consultas recursivas (CTE no banco ou expansão em código) para encontrar todas as dependências diretas e indiretas.
*Ação BE:* Garantir que a lista de `results` retorne a raiz (ex: Pizza Margherita) caso um insumo filho mude.

## 3. Gráfico de Evolução: Toggle de Filtro e CMV Diário
**Contexto:** Precisamos de um toggle no gráfico para mostrar "Somente Receitas Impactadas" vs "Rede Toda".
**Contrato:** Adicionar um novo Query Parameter no endpoint `GET /api/simulator/evolution`:
- `impacted_only` (boolean, default `false`).
- Se `true`, o Backend deve calcular `current_cost_total`, `new_cost_total` e `sales_revenue` **apenas** somando as vendas das receitas que apareceram no array de `results` da simulação. Se `false`, soma as vendas da loja inteira.
*Ação BE:* Implementar o filtro `impacted_only` na query de agrupamento de vendas.

---
**Instruções para o Backend Engineer:** Ao concluir essas tarefas, por favor retorne este documento ou envie um relatório de implementação atualizando o `API-ROUTES.md` com os schemas finais exatos para que o Frontend proceda com a integração.