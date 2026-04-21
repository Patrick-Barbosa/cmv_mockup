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
- **Resposta Sucesso (200):**
  ```json
  {"id": 11, "message": "Receita criada com sucesso."}
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
