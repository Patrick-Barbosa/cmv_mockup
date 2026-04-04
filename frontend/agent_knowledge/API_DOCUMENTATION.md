# CMV Backend API Documentation

This document contains the complete API reference for the CMV (Custo de Mercado em Vendas) application. It includes all available endpoints, required parameters, and example payloads for the frontend agent.

**Base URL:** `http://localhost:8000/api` (development) or your production domain

---

## Insumos (Ingredients/Supplies) Endpoints

### 1. Get Standard Units

Retrieves all available unit options used throughout the application.

- **Method:** `GET`
- **Route:** `/api/unidades`
- **Authentication:** None required
- **Query Parameters:** None
- **Request Body:** None

**Response:**
```json
{
  "unidades": ["g", "kg", "ml", "l", "un", "cx", "pct", "tb", "ds"]
}
```

**Description of Units:**
- `g` - grams
- `kg` - kilograms
- `ml` - milliliters
- `l` - liters
- `un` - units
- `cx` - boxes
- `pct` - packets
- `tb` - tablespoons
- `ds` - dozens

---

### 2. Create Insumo (Ingredient)

Creates a new ingredient in the system with cost calculation.

- **Method:** `POST`
- **Route:** `/api/insumos/create`
- **Authentication:** None required

**Request Body (Required):**
```typescript
{
  nome: string;                    // Product name
  unidade: string;                 // Unit (must be from unidades list)
  quantidade_referencia: float;    // Reference quantity (must be > 0)
  preco_referencia: float;         // Reference price (must be >= 0)
}
```

**Validation Rules:**
- `nome`: Required, cannot be empty
- `unidade`: Required, must be one of the available units
- `quantidade_referencia`: Required, must be greater than 0
- `preco_referencia`: Required, must be non-negative (>= 0)

**Example Request:**
```bash
curl -X POST http://localhost:8000/api/insumos/create \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Farinha de Trigo",
    "unidade": "kg",
    "quantidade_referencia": 1,
    "preco_referencia": 5.50
  }'
```

**Example Response (Success):**
```json
{
  "id": 1,
  "message": "Insumo criado com sucesso."
}
```

**Example Response (Error - Invalid Unit):**
```json
{
  "detail": [
    {
      "type": "string_pattern",
      "loc": ["body", "unidade"],
      "msg": "Unidade 'xyz' inválida. Opções: ['g', 'kg', 'ml', 'l', 'un', 'cx', 'pct', 'tb', 'ds']"
    }
  ]
}
```

---

### 3. Get Products for Select2

Retrieves a paginated list of products for use in select dropdowns.

- **Method:** `GET`
- **Route:** `/api/get_produtos_select2`
- **Authentication:** None required

**Query Parameters:**
```typescript
{
  q?: string;           // Search query (optional)
  page?: int = 1;       // Page number (default: 1)
  per_page?: int = 20;  // Items per page (default: 20)
}
```

**Example Request:**
```bash
curl "http://localhost:8000/api/get_produtos_select2?q=farinha&page=1&per_page=20"
```

**Example Response:**
```json
{
  "data": [
    {
      "id": 1,
      "text": "Farinha de Trigo"
    },
    {
      "id": 2,
      "text": "Farinha de Milho"
    }
  ],
  "pagination": {
    "more": false
  }
}
```

---

### 4. Update Insumo Cost

Updates the cost and unit of an existing ingredient.

- **Method:** `POST`
- **Route:** `/api/insumos/update_custo`
- **Authentication:** None required

**Request Body (Required):**
```typescript
{
  id: int;        // Product ID to update
  custo: float;   // New unit cost
  unidade: string; // Unit (must be from unidades list)
}
```

**Example Request:**
```bash
curl -X POST http://localhost:8000/api/insumos/update_custo \
  -H "Content-Type: application/json" \
  -d '{
    "id": 1,
    "custo": 5.75,
    "unidade": "kg"
  }'
```

**Example Response:**
```json
{
  "id": 1,
  "message": "Custo atualizado com sucesso."
}
```

---

### 5. Edit Insumo (Full Update)

Fully updates an ingredient with new values for name, unit, reference quantity, and reference price.

- **Method:** `PATCH`
- **Route:** `/api/insumos/{insumo_id}`
- **Authentication:** None required
- **Path Parameters:** `insumo_id` (integer, required)

**Request Body (All Optional - omit fields you don't want to update):**
```typescript
{
  nome?: string;                   // New product name
  unidade?: string;                // New unit
  quantidade_referencia?: float;   // New reference quantity (must be > 0 if provided)
  preco_referencia?: float;        // New reference price (must be >= 0 if provided)
}
```

**Example Request (Update name and unit):**
```bash
curl -X PATCH http://localhost:8000/api/insumos/1 \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Farinha Premium",
    "unidade": "kg"
  }'
```

**Example Response:**
```json
{
  "id": 1,
  "message": "Insumo atualizado com sucesso."
}
```

---

### 6. Delete Insumo

Deletes an ingredient from the system.

- **Method:** `DELETE`
- **Route:** `/api/insumos/{insumo_id}`
- **Authentication:** None required
- **Path Parameters:** `insumo_id` (integer, required)
- **Request Body:** None

**Example Request:**
```bash
curl -X DELETE http://localhost:8000/api/insumos/1
```

**Example Response:**
```json
{
  "message": "Insumo deletado com sucesso."
}
```

---

## Receitas (Recipes) Endpoints

### 1. Get Recipe Details

Retrieves a specific recipe with all its components and calculates the total cost.

- **Method:** `GET`
- **Route:** `/api/receitas/{receita_id}`
- **Authentication:** None required
- **Path Parameters:** `receita_id` (integer, required)

**Example Request:**
```bash
curl "http://localhost:8000/api/receitas/1"
```

**Example Response:**
```json
{
  "id": 1,
  "nome": "Bolo de Chocolate",
  "quantidade_base": 2,
  "unidade": "un",
  "componentes": [
    {
      "id_componente": 1,
      "nome_componente": "Farinha de Trigo",
      "quantidade": 500,
      "custo_unitario": 5.50,
      "custo_total": 2750
    },
    {
      "id_componente": 2,
      "nome_componente": "Açúcar",
      "quantidade": 200,
      "custo_unitario": 3.00,
      "custo_total": 600
    }
  ],
  "custo_total": 3350
}
```

---

### 2. Create Recipe

Creates a new recipe with its components.

- **Method:** `POST`
- **Route:** `/api/receitas/create`
- **Authentication:** None required

**Request Body (Required):**
```typescript
{
  nome: string;                              // Recipe name
  quantidade_base: float;                    // Base quantity produced
  unidade?: string;                          // Unit (optional, from unidades list)
  componentes: Array<{                       // At least 1 component required
    id_componente: int;                      // ID of the ingredient
    quantidade: float;                       // Quantity used
  }>
}
```

**Validation Rules:**
- `nome`: Required, cannot be empty
- `quantidade_base`: Required, must be > 0
- `unidade`: Optional, must be from available units if provided
- `componentes`: Required, must have at least 1 component

**Example Request:**
```bash
curl -X POST http://localhost:8000/api/receitas/create \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Bolo de Chocolate",
    "quantidade_base": 2,
    "unidade": "un",
    "componentes": [
      {
        "id_componente": 1,
        "quantidade": 500
      },
      {
        "id_componente": 2,
        "quantidade": 200
      }
    ]
  }'
```

**Example Response:**
```json
{
  "id": 1,
  "message": "Receita criada com sucesso."
}
```

**Example Response (Error - No components):**
```json
{
  "detail": [
    {
      "type": "list_min_length",
      "loc": ["body", "componentes"],
      "msg": "List should have at least 1 item after validation, not 0"
    }
  ]
}
```

---

### 3. Edit Recipe

Updates an existing recipe and its components.

- **Method:** `PATCH`
- **Route:** `/api/receitas/{receita_id}`
- **Authentication:** None required
- **Path Parameters:** `receita_id` (integer, required)

**Request Body (All Optional):**
```typescript
{
  nome?: string;                             // New recipe name
  quantidade_base?: float;                   // New base quantity
  unidade?: string;                          // New unit
  componentes?: Array<{                      // New components list
    id_componente: int;
    quantidade: float;
  }>
}
```

**Example Request (Update components):**
```bash
curl -X PATCH http://localhost:8000/api/receitas/1 \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Bolo de Chocolate Premium",
    "componentes": [
      {
        "id_componente": 1,
        "quantidade": 600
      },
      {
        "id_componente": 2,
        "quantidade": 250
      },
      {
        "id_componente": 3,
        "quantidade": 100
      }
    ]
  }'
```

**Example Response:**
```json
{
  "id": 1,
  "message": "Receita atualizada com sucesso."
}
```

---

### 4. Delete Recipe

Deletes a recipe from the system.

- **Method:** `DELETE`
- **Route:** `/api/receitas/{receita_id}`
- **Authentication:** None required
- **Path Parameters:** `receita_id` (integer, required)
- **Request Body:** None

**Example Request:**
```bash
curl -X DELETE http://localhost:8000/api/receitas/1
```

**Example Response:**
```json
{
  "message": "Receita deletada com sucesso."
}
```

---

## Error Handling

All errors follow this format:

**Standard Error Response:**
```json
{
  "detail": "Error description"
}
```

**Validation Error Response:**
```json
{
  "detail": [
    {
      "type": "validation_error_type",
      "loc": ["field_path"],
      "msg": "Error message"
    }
  ]
}
```

**Common HTTP Status Codes:**
- `200 OK` - Successful GET request
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid input or conflict (e.g., duplicate name)
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Validation error
- `500 Internal Server Error` - Server error

---

## Notes for Frontend Agent

1. **Cost Calculation:** When creating/updating recipes, the system automatically recalculates total costs based on ingredient unit costs and quantities.

2. **Unit Constraints:** Always validate units against the list from `/api/unidades` endpoint before sending to API.

3. **Pagination:** Use `get_produtos_select2` for large lists to avoid performance issues. Default page size is 20.

4. **Search:** The `get_produtos_select2` endpoint strips whitespace from search queries automatically.

5. **Component Management:** When updating recipes, provide the complete list of components - partial updates will replace the entire component list.

6. **Error Responses:** Always check response status codes and handle both validation errors (422) and business logic errors (400) appropriately.

7. **CORS:** The API is configured with CORS middleware. Check `ALLOWED_ORIGINS` environment variable for production deployments.
