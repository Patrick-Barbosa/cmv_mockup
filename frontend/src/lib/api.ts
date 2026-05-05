export const API_URL = import.meta.env.VITE_BACKEND_URL || ""
export const IS_MOCK = import.meta.env.VITE_USE_MOCK === "true"

interface FetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown
}

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== "undefined" && value instanceof FormData
}

export async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { method = "GET", headers, body, ...rest } = options
  const resolvedHeaders = new Headers(headers)
  const config: RequestInit = {
    method,
    headers: resolvedHeaders,
    ...rest,
  }

  if (body !== undefined) {
    if (isFormData(body)) {
      config.body = body
    } else {
      if (!resolvedHeaders.has("Content-Type")) {
        resolvedHeaders.set("Content-Type", "application/json")
      }
      config.body = JSON.stringify(body)
    }
  }

  const response = await fetch(`${API_URL}${endpoint}`, config)

  if (!response.ok) {
    let errorMessage = `Erro HTTP: ${response.status}`
    try {
      const errorData = await response.json()
      if (errorData.detail) {
        errorMessage = typeof errorData.detail === "string"
          ? errorData.detail
          : JSON.stringify(errorData.detail)
      }
    } catch {
      // empty response body
    }
    throw new Error(errorMessage)
  }

  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}

export interface ProdutoSelectAPI {
  id: number
  text: string
  tipo: string
  custo: number | null
  unidade: string | null
  quantidade_referencia: number | null
  preco_referencia: number | null
  quantidade_base: number | null
  id_produto_externo: string | null
}

export interface InsumoFullAPI extends ProdutoSelectAPI {
  nome: string
}

export interface ReceitaListItem {
  id: number
  nome: string
  tipo: string
  id_produto_externo?: string | null
}

export interface ReceitaDetalhe {
  id: number
  nome: string
  quantidade_base: number
  unidade: string
  id_produto_externo?: string | null
  componentes: ComponenteAPI[]
  custo_total: number
  preco_venda?: number | null
}

export interface ComponenteAPI {
  id_componente: number
  nome: string
  unidade: string | null
  quantidade: number
  custo_unitario: number | null
}

export interface ReceitaTreeDetalhe {
  id: number | string
  nome: string
  tipo: "receita" | "insumo"
  quantidade?: number
  unidade?: string
  custo?: number
  id_produto_externo?: string | null
  children?: ReceitaTreeDetalhe[]
}

export interface CreateInsumoPayload {
  nome: string
  unidade: string
  quantidade_referencia: number
  preco_referencia: number
  id_produto_externo?: string | null
}

export interface EditInsumoPayload {
  nome?: string
  unidade?: string
  quantidade_referencia?: number
  preco_referencia?: number
  id_produto_externo?: string | null
}

export interface ComponentePayload {
  id_componente: number
  quantidade: number
}

export interface CreateReceitaPayload {
  nome: string
  quantidade_base: number
  unidade?: string
  id_produto_externo?: string | null
  preco_venda?: number | null
  componentes: ComponentePayload[]
}

export interface EditReceitaPayload {
  nome?: string
  quantidade_base?: number
  unidade?: string
  id_produto_externo?: string | null
  preco_venda?: number | null
  componentes?: ComponentePayload[]
}

export interface VendasFiltersResponse {
  lojas: string[]
  meses: string[]
}

export interface VendasUploadResponse extends VendasFiltersResponse {
  message: string
  linhas_importadas: number
}

export type ImportStrategy = "append" | "overwrite"

export interface VendaImportRow {
  data: string
  id_loja: string
  id_produto: string
  quantidade_produto: number
  valor_total: number
}

export interface BulkImportVendasPayload {
  strategy: ImportStrategy
  rows: VendaImportRow[]
}

export interface StoreAnalysisSummary {
  receita_total: number
  receita_vinculada: number
  receita_sem_vinculo: number
  custo_ideal_total: number
  cmv_ideal_percentual: number | null
  quantidade_total: number
  produtos_vinculados: number
  produtos_sem_vinculo: number
}

export interface StoreAnalysisProduct {
  id_produto: string
  produto_id_interno: number | null
  produto_nome: string | null
  produto_tipo: string | null
  id_produto_externo: string | null
  vinculado: boolean
  quantidade_total: number
  valor_total: number
  preco_medio: number | null
  custo_unitario_ideal: number | null
  custo_ideal_total: number | null
  cmv_ideal_percentual: number | null
}

export interface StoreAnalysisResponse {
  loja_id: string
  mes: string
  resumo: StoreAnalysisSummary
  produtos: StoreAnalysisProduct[]
}

export interface ProductSalesAnalysisLine {
  mes: string
  loja_id: string
  quantidade_total: number
  valor_total: number
  preco_medio: number | null
  custo_unitario_ideal: number | null
  custo_ideal_total: number | null
  cmv_ideal_percentual: number | null
}

export interface ProductSalesAnalysisResponse {
  produto: {
    id: number
    nome: string
    tipo: string
    id_produto_externo: string | null
    custo_unitario_ideal: number | null
  }
  possui_vinculo_externo: boolean
  linhas: ProductSalesAnalysisLine[]
}

export interface DashboardKpis {
  faturamento: number
  cmv_percent: number
  lucro_liquido: number
  lojas_alerta: number
}

export interface DashboardHistoryItem {
  mes: string
  faturamento: number
  custo: number
  imposto: number
  cmv_percent: number
  lucro_liquido: number
}

export interface DashboardWaterfallItem {
  label: string
  value: number
  type: "positive" | "negative" | "total"
}

export interface DashboardTopCustoLoja {
  loja_id: string
  custo_total: number
  imposto_total: number
  cmv_percent: number
}

export interface DashboardCmvResponse {
  kpis: DashboardKpis
  history: DashboardHistoryItem[]
  waterfall: DashboardWaterfallItem[]
  top_custo_lojas: DashboardTopCustoLoja[]
}

export type SimulationType = "price_change" | "recipe_change"
export type ChangeType = "percentual" | "absoluto"

export interface ComponenteSimulacao {
  id_componente: number
  quantidade: number
  tipo?: "insumo" | "receita"
  sub_componentes?: ComponenteSimulacao[]
}

export interface SimulationInput {
  type: SimulationType
  ingredient_id?: number
  recipe_id?: number
  change_type: ChangeType
  change_value: number
  store_ids?: string[]
  novos_componentes?: ComponenteSimulacao[]
}

export interface SimulationResult {
  recipe_id: number
  recipe_name: string
  current_cost: number
  new_cost: number
  cost_difference: number
  cost_percent_change: number
  ingredient_quantity: number
  monthly_sales_quantity: number
  monthly_revenue_current: number
  monthly_revenue_new: number
  revenue_impact: number
  revenue_impact_percent: number
}

export interface StoreImpact {
  store_id: string
  total_current_cost: number
  total_new_cost: number
  total_impact: number
  total_impact_percent: number
  affected_recipes_count: number
  gross_margin: number
  gross_margin_new: number
}

export interface SimulationResponse {
  simulation_type: string
  ingredient_name: string | null
  recipe_name: string | null
  change_applied: string
  total_network_impact: number
  total_network_impact_percent: number
  avg_impact_per_store: number
  avg_impact_per_store_percent: number
  avg_impact_per_recipe: number
  avg_impact_per_recipe_percent: number
  ingredient_impact: number
  ingredient_impact_percent: number
  results: SimulationResult[]
  store_ranking: StoreImpact[]
  projection_month: string
  projection_type: string
}

export interface AffectedRecipe {
  recipe_id: number
  recipe_name: string
  current_cost: number
}

export interface StoreInfo {
  store_id: string
}

export interface DailyEvolutionData {
  date: string
  store_id: string | null
  day_of_week: string
  current_cost_total: number
  new_cost_total: number
  sales_quantity: number
  sales_revenue: number
}

export interface EvolutionSummary {
  total_days: number
  total_current_cost: number
  total_new_cost: number
  total_impact: number
  total_impact_percent: number
  avg_daily_sales: number
  avg_daily_revenue: number
}

export interface EvolutionResponse {
  month: string
  type: string
  ingredient_name?: string
  recipe_name?: string
  daily_data: DailyEvolutionData[]
  summary: EvolutionSummary
}

export interface ProductInfoResponse {
  product_id: number
  product_name: string
  product_type: string
  preco_venda: number | null
  custo_atual: number | null
  unidade_medida: string | null
  source: string
  is_vendido: boolean
}

export const insumosApi = {
  list: () =>
    apiFetch<{ items: ProdutoSelectAPI[]; pagination: { more: boolean } }>(
      "/api/get_produtos_select2?per_page=200"
    ).then((res) =>
      res.items
        .filter((item) => item.tipo === "Insumo")
        .map((item) => ({ ...item, nome: item.text }))
    ),

  create: (payload: CreateInsumoPayload) =>
    apiFetch<{ id: number; message: string }>("/api/insumos/create", {
      method: "POST",
      body: payload,
    }),

  edit: (id: number, payload: EditInsumoPayload) =>
    apiFetch<{ id: number; message: string }>(`/api/insumos/${id}`, {
      method: "PATCH",
      body: payload,
    }),

  delete: (id: number) =>
    apiFetch<{ message: string }>(`/api/insumos/${id}`, {
      method: "DELETE",
    }),

  unidades: () => apiFetch<{ unidades: string[] }>("/api/unidades"),
}

export const receitasApi = {
  list: () => apiFetch<ReceitaListItem[]>("/receitas"),

  get: (id: number) => apiFetch<ReceitaDetalhe>(`/api/receitas/${id}`),

  getTree: (id: number | string) => apiFetch<ReceitaTreeDetalhe>(`/receitas/${id}`),

  getSalesAnalysis: (id: number) =>
    apiFetch<ProductSalesAnalysisResponse>(`/api/receitas/${id}/analise-vendas`),

  create: (payload: CreateReceitaPayload) =>
    apiFetch<{ id: number; message: string }>("/api/receitas/create", {
      method: "POST",
      body: payload,
    }),

  edit: (id: number, payload: EditReceitaPayload) =>
    apiFetch<{ id: number; message: string }>(`/api/receitas/${id}`, {
      method: "PATCH",
      body: payload,
    }),

  delete: (id: number) =>
    apiFetch<{ message: string }>(`/api/receitas/${id}`, {
      method: "DELETE",
    }),
}

export interface SkuAusente {
  id_produto_externo: string
  quantidade_total: number
  valor_total: number
  vendas_count: number
}

export interface SkusAusentesResponse {
  total: number
  page: number
  size: number
  pages: number
  items: SkuAusente[]
}

export const vendasApi = {
  upload: (file: File) => {
    const formData = new FormData()
    formData.append("file", file)

    return apiFetch<VendasUploadResponse>("/api/vendas/upload", {
      method: "POST",
      body: formData,
    })
  },

  getFilters: () => apiFetch<VendasFiltersResponse>("/api/vendas/filtros"),

  getStoreAnalysis: (storeId: string, month: string) =>
    apiFetch<StoreAnalysisResponse>(
      `/api/vendas/analise-loja?store_id=${encodeURIComponent(storeId)}&month=${encodeURIComponent(month)}`
    ),

  bulkImport: (payload: BulkImportVendasPayload) =>
    apiFetch<VendasUploadResponse>("/api/vendas/bulk_import", {
      method: "POST",
      body: payload,
    }),

  getSkusAusentes: (page = 1, size = 50) =>
    apiFetch<SkusAusentesResponse>(`/api/vendas/skus-ausentes?page=${page}&size=${size}`),

  getDashboardCmv: (month?: string, storeId?: string) => {
    const params = new URLSearchParams()
    if (month) params.append("month", month)
    if (storeId) params.append("store_id", storeId)
    const queryString = params.toString()
    return apiFetch<DashboardCmvResponse>(
      `/api/vendas/dashboard-cmv${queryString ? `?${queryString}` : ""}`
    )
  },

  downloadTemplate: async (format: "xlsx" | "csv") => {
    const response = await fetch(`${API_URL}/api/vendas/template?format=${format}`)
    if (!response.ok) throw new Error("Erro ao baixar template")
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `template_vendas.${format}`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  },
}

export const commonApi = {
  searchProdutos: async (q: string) => {
    if (IS_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 400))
      const mockResults = [
        { id: 1, text: "Hambúrguer de Wagyu", tipo: "Receita" },
        { id: 2, text: "Pão de Brioche", tipo: "Insumo" },
        { id: 3, text: "Queijo Cheddar Inglês", tipo: "Insumo" },
        { id: 4, text: "Molho Especial Prato", tipo: "Receita" },
        { id: 5, text: "Batata Rústica", tipo: "Insumo" },
      ]
      return mockResults.filter((r) =>
        r.text.toLowerCase().includes(q.toLowerCase())
      )
    }

    type Select2Response = {
      results?: { id: number; text: string; tipo: string }[]
      items?: { id: number; text: string; tipo: string }[]
    }

    return apiFetch<Select2Response>(
      `/api/get_produtos_select2?q=${encodeURIComponent(q)}&per_page=100`
    ).then((res) => res.items || res.results || [])
  },
}

export const simulatorApi = {
  simulate: (input: SimulationInput) =>
    apiFetch<SimulationResponse>("/api/simulator/simulate", {
      method: "POST",
      body: input,
    }),

  getAffectedRecipes: (ingredientId: number) =>
    apiFetch<AffectedRecipe[]>(`/api/simulator/ingredients/${ingredientId}/affected-recipes`),

  getStores: () => apiFetch<StoreInfo[]>("/api/simulator/stores"),

  getEvolution: (params: SimulationInput & { month: string; impacted_only?: boolean }) => {
    const searchParams = new URLSearchParams()
    searchParams.append("month", params.month)
    searchParams.append("type", params.type)
    searchParams.append("change_type", params.change_type)
    searchParams.append("change_value", params.change_value.toString())
    if (params.ingredient_id) searchParams.append("ingredient_id", params.ingredient_id.toString())
    if (params.recipe_id) searchParams.append("recipe_id", params.recipe_id.toString())
    if (params.store_ids) searchParams.append("store_ids", params.store_ids.join(","))
    if (params.impacted_only !== undefined) searchParams.append("impacted_only", params.impacted_only.toString())
    return apiFetch<EvolutionResponse>(`/api/simulator/evolution?${searchParams.toString()}`)
  },

  getProductInfo: (productId: number) =>
    apiFetch<ProductInfoResponse>(`/api/simulator/product-info/${productId}`),
}
