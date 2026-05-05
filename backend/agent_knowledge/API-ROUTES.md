# 🚀 Backend API Routes - CMV Mockup Empresa (Prato)

Este documento descreve detalhadamente os endpoints disponíveis, seus parâmetros, comportamentos e exemplos de resposta.

---

## 🥗 Insumos (`/api`)

### `GET /api/unidades`
Retorna as unidades de medida aceitas pelo sistema.
- **Resposta Sucesso (200):**
  ```json
  {"unidades": ["g", "kg", "ml", "l", "un", "cx", "pct", "tb", "ds"]}
  ```

### `POST /api/insumos/create`
Cria um novo insumo básico.
- **Argumentos (Body JSON):** `nome`, `unidade`, `quantidade_referencia`, `preco_referencia`, `id_produto_externo`.
- **Resposta Sucesso (200):**
  ```json
  {"id": 123, "message": "Insumo criado com sucesso."}
  ```
- **Erro (400):** `{"detail": "Conflict"}` (ID externo duplicado).

### `GET /api/get_produtos_select2`
Busca produtos (insumos ou receitas) de forma paginada.
- **Argumentos (Query):** `q`, `page`, `per_page`.
- **Resposta Sucesso (200):**
  ```json
  {
    "results": [{"id": 1, "text": "Alface", "tipo": "insumo"}],
    "pagination": {"more": false}
  }
  ```

### `POST /api/insumos/update_custo`
- **Resposta Sucesso (200):**
  ```json
  {"id": 1, "message": "Custo atualizado com sucesso."}
  ```

### `PATCH /api/insumos/{insumo_id}`
- **Resposta Sucesso (200):**
  ```json
  {"id": 1, "message": "Insumo atualizado com sucesso."}
  ```

---

## 📖 Receitas (`/api`)

### `GET /api/receitas/{receita_id}`
Ficha técnica detalhada.
- **Resposta Sucesso (200):**
  ```json
  {
    "id": 10,
    "nome": "Hambúrguer Gourmet",
    "quantidade_base": 1.0,
    "unidade": "un",
    "id_produto_externo": "SKU-HB-01",
    "componentes": [
      {"id_componente": 5, "nome": "Pão de Brioche", "quantidade": 1.0, "custo_unitario": 1.5, "tipo": "insumo"}
    ],
    "custo_total": 8.75
  }
  ```

### `GET /api/receitas/{receita_id}/analise-vendas`
- **Resposta Sucesso (200):**
  ```json
  [
    {"mes": "2026-04", "quantidade_vendida": 150, "receita_total": 4500.0, "custo_total_ideal": 1312.5}
  ]
  ```

### `POST /api/receitas/create`
Cria uma nova receita. O campo `preco_venda` é opcional.

- **Argumentos (Body JSON):** `nome`, `quantidade_base`, `unidade`, `id_produto_externo`, `preco_venda` (opcional), `componentes`.
- **Resposta Sucesso (200):**
  ```json
  {"id": 11, "message": "Receita criada com sucesso."}
  ```

**Exemplo com preco_venda:**
```json
{
  "nome": "Bolo de chocolate",
  "quantidade_base": 1.0,
  "unidade": "un",
  "preco_venda": 28.50,
  "componentes": [{"id_componente": 1, "quantidade": 0.5}]
}
```

### `PATCH /api/receitas/{receita_id}`
Atualiza uma receita existente. O campo `preco_venda` pode ser atualizado.

- **Argumentos (Body JSON):** Campos opcionais: `nome`, `quantidade_base`, `unidade`, `id_produto_externo`, `preco_venda`, `componentes`.
- **Resposta Sucesso (200):**
  ```json
  {"id": 4, "message": "Receita atualizada com sucesso."}
  ```

---

## 💰 Vendas e Importação (`/api`)

### `POST /api/vendas/bulk_import`
- **Resposta Sucesso (200):**
  ```json
  {"message": "Importação concluída.", "imported_count": 500}
  ```

### `POST /api/vendas/upload`
Upload via Excel.
- **Resposta Sucesso (200):**
  ```json
  {"message": "Upload processado com sucesso.", "count": 150}
  ```
- **Erro (422):**
  ```json
  {
    "detail": {
      "message": "Arquivo inválido...",
      "errors": ["Linha 2: data inválida", "Linha 5: valor_total deve ser numérico"]
    }
  }
  ```

### `GET /api/vendas/filtros`
- **Resposta Sucesso (200):**
  ```json
  {
    "stores": ["LOJA-01", "LOJA-02"],
    "months": ["2026-03", "2026-04"]
  }
  ```

### `GET /api/vendas/analise-loja`
- **Resposta Sucesso (200):**
  ```json
  {
    "store_id": "LOJA-01",
    "month": "2026-04",
    "total_sales": 25000.0,
    "total_cost_ideal": 8500.0,
    "cmv_ideal": 34.0,
    "products_analysis": [...]
  }
  ```

### `GET /api/vendas/skus-ausentes`
Lista SKUs que constam nas vendas mas não estão mapeados no sistema.
- **Argumentos (Query):** `page` (default 1), `size` (default 50).
- **Resposta Sucesso (200):**
  ```json
  {
    "total": 120,
    "page": 1,
    "size": 50,
    "pages": 3,
    "items": [
      {
        "id_produto_externo": "SKU-999",
        "quantidade_total": 500,
        "valor_total": 12500.50,
        "vendas_count": 45
      }
    ]
  }
  ```

### `GET /api/vendas/dashboard-cmv`
Retorna dados consolidados globais de faturamento, custo (CMV), impostos médios (14% ou por loja) e lucro líquido para alimentar o Dashboard.
- **Argumentos (Query):** `month` (opcional, YYYY-MM), `store_id` (opcional).
- **Resposta Sucesso (200):**
  ```json
  {
    "kpis": {
      "faturamento": 250000.0,
      "cmv_percent": 34.5,
      "lucro_liquido": 128750.0,
      "lojas_alerta": 3
    },
    "history": [
      {
        "mes": "2026-03",
        "faturamento": 200000.0,
        "custo": 65000.0,
        "imposto": 28000.0,
        "cmv_percent": 32.5,
        "lucro_liquido": 107000.0
      }
    ],
    "waterfall": [
      {"label": "Faturamento", "value": 250000.0, "type": "positive"},
      {"label": "Custo Insumos", "value": -86250.0, "type": "negative"},
      {"label": "Impostos", "value": -35000.0, "type": "negative"},
      {"label": "Lucro Líquido", "value": 128750.0, "type": "total"}
    ],
    "top_custo_lojas": [
      {
        "loja_id": "LOJA-01",
        "custo_total": 45000.0,
        "imposto_total": 15000.0,
        "cmv_percent": 38.0
      }
    ]
  }
  ```

---

## 🧮 Simulador de Impactos (`/api/simulator`)

### `POST /api/simulator/simulate`
Simula o impacto financeiro de mudança de preço de insumo ou mudança de fórmula de receita.

**Argumentos (Body JSON):**
- `type` (string): `"price_change"` ou `"recipe_change"`
- `ingredient_id` (int, opcional): ID do insumo (obrigatório se type=price_change)
- `recipe_id` (int, opcional): ID da receita (obrigatório se type=recipe_change)
- `change_type` (string): `"percentual"` ou `"absoluto"`
- `change_value` (float): Valor da mudança
- `store_ids` (array[string], opcional): Lista de IDs de lojas para filtrar (ex: ["RJ-COPA", "RJ-BARRA"])
- `novos_componentes` (array[object], opcional): Lista de componentes (obrigatório se type=recipe_change)
  - `id_componente` (int): ID do componente
  - `quantidade` (float): Quantidade
  - `tipo` (string, opcional): "insumo" ou "receita" (para hierarquia)
  - `sub_componentes` (array[object], opcional): Sub-componentes para cálculo bottom-up (quando tipo=receita)

**Resposta Sucesso (200):**
```json
{
  "simulation_type": "price_change",
  "ingredient_name": "Nutella",
  "recipe_name": null,
  "change_applied": "+10.0% (0.05 -> 0.06)",
  "total_network_impact": 0.0,
  "total_network_impact_percent": 0.0,
  "avg_impact_per_store": 0.0,
  "avg_impact_per_store_percent": 0.0,
  "avg_impact_per_recipe": 0.0,
  "avg_impact_per_recipe_percent": 0.0,
  "ingredient_impact": 0.01,
  "ingredient_impact_percent": 10.0,
  "results": [
    {
      "recipe_id": 1,
      "recipe_name": "Bolo de cenoura",
      "current_cost": 1.42,
      "new_cost": 1.42,
      "cost_difference": 0.0,
      "cost_percent_change": 0.02,
      "ingredient_quantity": 0.05,
      "monthly_sales_quantity": 0.0,
      "monthly_revenue_current": 0.0,
      "monthly_revenue_new": 0.0,
      "revenue_impact": 0.0,
      "revenue_impact_percent": 0.02
    }
  ],
  "store_ranking": [
    {
      "store_id": "RJ-COPA",
      "total_current_cost": 168.48,
      "total_new_cost": 182.4,
      "total_impact": 13.92,
      "total_impact_percent": 8.26,
      "affected_recipes_count": 1,
      "gross_margin": 76.1,
      "gross_margin_new": 74.1
    }
  ],
  "projection_month": "2026-04",
  "projection_type": "last_complete"
}
```

**Campos novos (Maio/2026):**
| Campo | Tipo | Descrição |
|---|---|---|
| `avg_impact_per_store` | float | Impacto médio por loja em R$ |
| `avg_impact_per_store_percent` | float | Impacto médio por loja em percentual |
| `avg_impact_per_recipe` | float | Impacto médio por receita em R$ |
| `avg_impact_per_recipe_percent` | float | Impacto médio por receita em percentual |
| `ingredient_impact` | float | Impacto absoluto no insumo em R$ (diferença de preço * quantidade referência) |
| `ingredient_impact_percent` | float | Percentual de mudança aplicada ao insumo |
| `ingredient_quantity` (em results) | float | Quantidade do insumo usada na receita |
| `gross_margin` (em store_ranking) | float | Margem bruta atual da loja em % |
| `gross_margin_new` (em store_ranking) | float | Margem bruta após simulação em % |

**Exemplo de Payload - Price Change:**
```json
{
  "type": "price_change",
  "ingredient_id": 19,
  "change_type": "percentual",
  "change_value": 10.0
}
```

**Exemplo de Payload - Recipe Change (Hierárquico - Maio/2026):**
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

**Nota (Maio/2026):** O endpoint agora suporta:
- `sub_componentes` recursivos para árvores de recipeas hierárquicas
- Cálculo de custo bottom-up (sub-componentes são calculados primeiro)
- O campo `tipo` é opcional; se não fornecido, o componente é tratado como insumo

---

### `GET /api/simulator/ingredients/{ingredient_id}/affected-recipes`
Lista todas as receitas afetadas por mudança neste insumo (útil para preview antes de simular).

**Argumentos (Path):** `ingredient_id` (int)

**Comportamento (Maio/2026):**
- Retorna TODAS as receitas que usam o insumo, direta ou indiretamente (via sub-receitas)
- Ou seja, se o insumo é usado em uma sub-receita que é usada em uma receita, esta também será retornada
- Isso garante que o gráfico de impacto mostre o efeito cascata completo

**Resposta Sucesso (200):**
```json
[
  {
    "recipe_id": 1,
    "recipe_name": "Bolo de cenoura",
    "current_cost": 1.42
  }
]
```

---

### `GET /api/simulator/stores`
Lista lojas disponíveis para filtragem.

**Resposta Sucesso (200):**
```json
[
  {"store_id": "RJ-BARRA"},
  {"store_id": "RJ-COPA"}
]
```

---

### `GET /api/simulator/evolution`
Retorna dados de evolução diária para gráfico de linha comparando cenário atual vs novo.

**Argumentos (Query):**
| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|------------|
| `month` | string | ✅ | Mês no formato YYYY-MM (ex: "2026-04") |
| `type` | string | ✅ | "price_change" ou "recipe_change" |
| `ingredient_id` | int | condicional | Obrigatório se type=price_change |
| `recipe_id` | int | condicional | Obrigatório se type=recipe_change |
| `change_type` | string | ✅ | "percentual" ou "absoluto" |
| `change_value` | float | ✅ | Valor da mudança |
| `store_ids` | string[] | opcional | Lista de lojas para filtrar |
| `impacted_only` | boolean | opcional | Se true, mostra apenas vendas das receitas impactadas (default: false) |

**Nota (Maio/2026):** O parâmetro `impacted_only`:
- `false` (default): Mostra custos e vendas da rede completa de receitas afetadas (cascata)
- `true`: Mostra apenas custos e vendas das receitas que usam diretamente o insumo/receita alterado(a)

**Resposta Sucesso (200):**
```json
{
  "month": "2026-04",
  "type": "price_change",
  "ingredient_name": "Nutella",
  "daily_data": [
    {
      "date": "2026-04-01",
      "store_id": "RJ-COPA",
      "day_of_week": "terça",
      "current_cost_total": 625.00,
      "new_cost_total": 687.50,
      "current_cost_avg_per_recipe": 1.42,
      "new_cost_avg_per_recipe": 1.56,
      "sales_quantity": 425,
      "sales_revenue": 6375.00
    },
    {
      "date": "2026-04-01",
      "store_id": "RJ-BARRA",
      "day_of_week": "terça",
      "current_cost_total": 625.00,
      "new_cost_total": 687.50,
      "current_cost_avg_per_recipe": 1.42,
      "new_cost_avg_per_recipe": 1.56,
      "sales_quantity": 425,
      "sales_revenue": 6375.00
    },
    {
      "date": "2026-04-01",
      "store_id": null,
      "day_of_week": "terça",
      "current_cost_total": 1250.00,
      "new_cost_total": 1375.00,
      "current_cost_avg_per_recipe": 1.42,
      "new_cost_avg_per_recipe": 1.56,
      "sales_quantity": 850,
      "sales_revenue": 12750.00
    }
  ],
  "summary": {
    "total_days": 30,
    "total_current_cost": 37500.00,
    "total_new_cost": 41250.00,
    "total_impact": 3750.00,
    "total_impact_percent": 10.0,
    "avg_daily_sales": 1250.0,
    "avg_daily_revenue": 18750.00
  }
}
```

**Nota:** Quando `store_ids` tiver mais de 1 loja, a resposta incluirá uma entrada por loja (`store_id` preenchido) + uma entrada consolidada (`store_id: null`).

---

### `GET /api/simulator/product-info/{product_id}`
Retorna informações de preço de venda de um produto/receita para o simulador.

**Argumentos (Path):** `product_id` (int)

**Lógica de busca:**
1. Se `preco_venda` está cadastrado no produto → retorna ele (source: "preco_cadastrado")
2. Se não tem `preco_venda` mas tem vendas → calcula preco_medio das vendas (source: "preco_medio_vendas")
3. Se não tem vendas → retorna is_vendido: false (source: "indisponivel")

**Resposta Sucesso (200) - preco_venda cadastrado:**
```json
{
  "product_id": 4,
  "product_name": "Bolo de cenoura",
  "product_type": "receita",
  "preco_venda": 28.50,
  "custo_atual": null,
  "unidade_medida": null,
  "source": "preco_cadastrado",
  "is_vendido": true
}
```

**Resposta Sucesso (200) - insumo com custo:**
```json
{
  "product_id": 10,
  "product_name": "Farinha de Trigo",
  "product_type": "insumo",
  "preco_venda": null,
  "custo_atual": 5.50,
  "unidade_medida": "kg",
  "source": "indisponivel",
  "is_vendido": false
}
```

**Resposta Sucesso (200) - indisponivel:**
```json
{
  "product_id": 4,
  "product_name": "Bolo de cenoura",
  "product_type": "receita",
  "preco_venda": 25.00,
  "source": "preco_medio_vendas",
  "is_vendido": true
}
```

**Resposta Sucesso (200) - indisponivel:**
```json
{
  "product_id": 4,
  "product_name": "Bolo de cenoura",
  "product_type": "receita",
  "preco_venda": null,
  "source": "indisponivel",
  "is_vendido": false
}
```

---

## 🏠 Endpoints de Base (Legacy/View)

### `GET /receitas/{id}`
Árvore hierárquica recursiva.
- **Resposta Sucesso (200):**
  ```json
  {
    "id": 10,
    "nome": "Hambúrguer Gourmet",
    "children": [
      {
        "id": 5, "nome": "Pão", "tipo": "insumo", "custo": 1.5, "children": []
      },
      {
        "id": 20, "nome": "Molho Especial", "tipo": "receita", "children": [...]
      }
    ]
  }
  ```

---

## ⚠️ Respostas de Erro Comuns

| Código | Nome | Significado / Exemplo de Payload |
| :--- | :--- | :--- |
| **400** | Bad Request | Dados malformatados ou erro de integridade. `{"detail": "..."}` |
| **404** | Not Found | Recurso não encontrado. `{"detail": "Not Found"}` |
| **422** | Unprocessable Entity | Erro de validação de campos. `{"detail": [{"loc": [...], "msg": "...", "type": "..."}]}` |
| **500** | Internal Error | Erro inesperado no servidor. `{"detail": "...", "type": "..."}` |
