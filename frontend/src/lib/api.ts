export const API_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000"
export const IS_MOCK = !import.meta.env.VITE_BACKEND_URL

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
  componentes: ComponentePayload[]
}

export interface EditReceitaPayload {
  nome?: string
  quantidade_base?: number
  unidade?: string
  id_produto_externo?: string | null
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
