# Progresso do Data Contract - Backend CMV Mockup

Este documento跟踪后端对`brain/freezone/data-contract.md`中定义的数据契约的实现状态。

**数据契约源文件:** `brain/freezone/data-contract.md`
**创建日期:** 2026-05-03
**状态:** ✅ 全部实现

---

## 1. Payload de Simulação Hierárquica (Sub-receitas)

### ✅ Implementado

**需求:**
- Endpoint `POST /api/simulator/simulate` deve aceitar árvore completa de composição em `novos_componentes`
- Suporte a `sub_componentes` recursivos
- Cálculo de custo bottom-up

**实现细节:**

#### Schema (`app/schemas/simulator.py`)
```python
class ComponenteSimulacao(BaseModel):
    id_componente: int
    quantidade: float
    tipo: Optional[Literal['insumo', 'receita']] = None  # NOVO
    sub_componentes: Optional[List['ComponenteSimulacao']] = None  # NOVO
```

#### Service (`app/services/simulator_service.py`)
- `_calculate_recipe_cost_from_components()` agora é recursivo
- Se `comp.sub_componentes` existir, calcula custo dos sub-componentes primeiro (bottom-up)
- Custo final = soma(custo_subcomponente * quantidade) para cada componente

#### Exemplo de Payload para Recipe Change:
```json
{
  "type": "recipe_change",
  "recipe_id": 4,
  "change_type": "absoluto",
  "change_value": 25.00,
  "novos_componentes": [
    {
      "id_componente": 10,
      "tipo": "insumo",
      "quantidade": 0.5
    },
    {
      "id_componente": 20,
      "tipo": "receita",
      "quantidade": 1.0,
      "sub_componentes": [
        {
          "id_componente": 5,
          "tipo": "insumo",
          "quantidade": 0.1
        }
      ]
    }
  ]
}
```

---

## 2. Impacto em Cascata (Recursividade)

### ✅ Implementado

**需求:**
- Ao alterar preço de um insumo, TODAS as receitas que o utilizam (direta ou indiretamente) devem ser listadas
- `GET /api/simulator/ingredients/{id}/affected-recipes` deve usar consultas recursivas

**实现细节:**

#### `affected-recipes` Endpoint
- `_get_recipes_using_ingredient()` agora delega para `_get_all_recipes_using_component()`
- Este método faz BFS (breadth-first search) na árvore de dependências
- Usa um `visited` set para evitar loops infinitos
- Retorna todas as receitas que usam o insumo, direta ou indiretamente

#### Cálculo de Custo Recursivo
- `_recalculate_recipe_cost_with_new_ingredient_price()` agora usa um CTE recursivo do PostgreSQL
- O CTE `recipe_tree` começa na receita alvo e expande recursivamente para sub-receitas
- `quantidade_acumulada` é calculada multiplicando as quantidades em cada nível
- O cálculo final considera TODOS os insumos da árvore hierárquica

#### Exemplo de Cascade:
```
Cebola (insumo)
  └── Molho de Tomate (sub-receita)
        └── Pizza Margherita (receita final)

Se Cebola muda de preço:
- affected-recipes retorna: Pizza Margherita (indireta), Molho de Tomate (direta)
- O custo é recalculado considerando a quantidade de Cebola * quantidade de Molho * quantidade de Pizza
```

---

## 3. Gráfico de Evolução: Toggle `impacted_only`

### ✅ Implementado

**需求:**
- Novo query parameter `impacted_only` (boolean, default `false`) no endpoint `GET /api/simulator/evolution`
- Se `true`: calcula custos/receitas apenas das receitas impactadas
- Se `false`: soma as vendas da rede toda

**实现细节:**

#### Router (`app/routers/api/simulator.py`)
```python
@router.get("/evolution", response_model=SimulationEvolutionResponse)
async def get_evolution(
    ...
    impacted_only: bool = Query(False, description="Se true, mostra apenas vendas das receitas impactadas"),
    ...
)
```

#### Service (`app/services/simulator_service.py`)
- `get_daily_evolution()` recebe novo parâmetro `impacted_only`
- Se `impacted_only=True` e `type="price_change"`:
  - Usa `_get_recipes_using_ingredient_direct()` em vez de `_get_recipes_using_ingredient()`
  - Isso retorna apenas receitas que usam o insumo DIRETAMENTE (sem cascade)
- Se `impacted_only=False` (default):
  - Usa `_get_recipes_using_ingredient()` que inclui cascade

---

## 📁 Arquivos Modificados

| Arquivo | Mudanças |
|---------|----------|
| `backend/app/schemas/simulator.py` | Added `tipo` and `sub_componentes` to `ComponenteSimulacao` |
| `backend/app/services/simulator_service.py` | Added recursive methods, CTE query, `impacted_only` parameter |
| `backend/app/routers/api/simulator.py` | Added `impacted_only` query parameter to `/evolution` |
| `backend/agent_knowledge/API-ROUTES.md` | Documented new features and payloads |

---

## 🔄 Fluxo de Testes Recomendado (Frontend)

### 1. Testar Recipe Change com Hierarquia
```bash
curl -X POST "http://localhost:8000/api/simulator/simulate" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "recipe_change",
    "recipe_id": 4,
    "change_type": "absoluto",
    "change_value": 25.00,
    "novos_componentes": [
      {"id_componente": 10, "tipo": "insumo", "quantidade": 0.5},
      {"id_componente": 20, "tipo": "receita", "quantidade": 1.0,
       "sub_componentes": [{"id_componente": 5, "tipo": "insumo", "quantidade": 0.1}]}
    ]
  }'
```

### 2. Testar Affected Recipes com Cascade
```bash
# Deve retornar receitas que usam o insumo DIRETA ou INDIRETAMENTE
curl "http://localhost:8000/api/simulator/ingredients/{id}/affected-recipes"
```

### 3. Testar Evolution com impacted_only
```bash
# Todas as receitas afetadas (cascata completa)
curl "http://localhost:8000/api/simulator/evolution?month=2026-04&type=price_change&ingredient_id=5&change_type=percentual&change_value=10&impacted_only=false"

# Apenas receitas diretas
curl "http://localhost:8000/api/simulator/evolution?month=2026-04&type=price_change&ingredient_id=5&change_type=percentual&change_value=10&impacted_only=true"
```

---

## 📝 Notas para Frontend

1. **Breaking Changes:** O schema de `novos_componentes` mudou - campos `tipo` e `sub_componentes` são opcionais mas permitem estrutura hierárquica

2. **Affected Recipes:** O retorno agora inclui recetas que indiretamente usam o insumo (via sub-receitas). Isso pode aumentar significativamente a lista.

3. **Evolution Toggle:** O parâmetro `impacted_only` permite mostrar ao usuário:
   - `"Rede Toda"`: todas as receitas impactadas (cascata) - default
   - `"Somente Impactadas"`: apenas receitas diretas

4. **Cálculo de Custo:** O backend agora calcula corretamente custos considerando toda a árvore de sub-receitas quando necessário.