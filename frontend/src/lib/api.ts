// Base URL reads from your .env → VITE_BACKEND_URL
// In development: http://127.0.0.1:8000
// In production:  your deployed backend URL (e.g. https://meu-backend.onrender.com)
export const API_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";

// When VITE_BACKEND_URL is not set, the app runs on mock data
export const IS_MOCK = !import.meta.env.VITE_BACKEND_URL;

// ─────────────────────────────────────────────
// Internal fetch helper
// ─────────────────────────────────────────────
interface FetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

export async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { method = "GET", headers, body, ...rest } = options;

  const config: RequestInit = {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    ...rest,
  };

  if (body !== undefined) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, config);

  if (!response.ok) {
    let errorMessage = `Erro HTTP: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        errorMessage = typeof errorData.detail === "string"
          ? errorData.detail
          : JSON.stringify(errorData.detail);
      }
    } catch (_) { /* empty response body */ }
    throw new Error(errorMessage);
  }

  if (response.status === 204) return {} as T;

  return response.json();
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export interface InsumoAPI {
  id: number;
  nome: string;
  tipo: string;
}

export interface InsumoFullAPI {
  id: number;
  text: string;          // nome
  tipo: string;
  custo: number | null;
  unidade: string | null;
  quantidade_referencia: number | null;
  preco_referencia: number | null;
  quantidade_base: number | null;
}

export interface ReceitaListItem {
  id: number;
  nome: string;
  tipo: string;
}

export interface ReceitaDetalhe {
  id: number;
  nome: string;
  quantidade_base: number;
  unidade: string;
  componentes: ComponenteAPI[];
  custo_total: number;
}

export interface ComponenteAPI {
  id_componente: number;  // field name from get_componentes_diretos
  nome: string;
  unidade: string | null;
  quantidade: number;
  custo_unitario: number | null;
  // note: tipo is NOT returned by the backend list endpoint
}

export interface ReceitaTreeDetalhe {
  id: number | string;
  nome: string;
  tipo: "receita" | "insumo";
  quantidade?: number;
  unidade?: string;
  custo?: number;
  children?: ReceitaTreeDetalhe[];
}

export interface CreateInsumoPayload {
  nome: string;
  unidade: string;
  quantidade_referencia: number;
  preco_referencia: number;
}

export interface EditInsumoPayload {
  nome: string;
  unidade: string;
  quantidade_referencia: number;
  preco_referencia: number;
}

export interface ComponentePayload {
  id_componente: number;   // field name expected by backend schema
  quantidade: number;
}

export interface CreateReceitaPayload {
  nome: string;
  quantidade_base: number;
  unidade?: string;   // Optional in backend schema
  componentes: ComponentePayload[];
}

export interface EditReceitaPayload {
  nome?: string;
  quantidade_base?: number;
  unidade?: string;   // Optional in backend schema
  componentes?: ComponentePayload[];
}

// ─────────────────────────────────────────────
// Insumos endpoints
// GET  /api/get_produtos_select2  → lista completa com todos os campos
// POST /api/insumos/create        → cria insumo
// PATCH /api/insumos/:id          → edita insumo
// DELETE /api/insumos/:id         → remove insumo
// GET  /api/unidades              → lista de unidades padrão
// ─────────────────────────────────────────────
export const insumosApi = {
  list: () =>
    apiFetch<{ items: InsumoFullAPI[]; pagination: { more: boolean } }>(
      "/api/get_produtos_select2?per_page=200"
    ).then((res) =>
      res.items
        .filter((i) => i.tipo === "Insumo")
        .map((i) => ({ ...i, nome: i.text }))
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
    apiFetch<{ message: string }>(`/api/insumos/${id}`, { method: "DELETE" }),

  unidades: () =>
    apiFetch<{ unidades: string[] }>("/api/unidades"),
};

// ─────────────────────────────────────────────
// Receitas endpoints
// GET  /receitas              → lista resumida
// GET  /api/receitas/:id      → detalhe com componentes e custo
// POST /api/receitas/create   → cria receita
// PATCH /api/receitas/:id     → edita receita
// DELETE /api/receitas/:id    → remove receita
// ─────────────────────────────────────────────
export const receitasApi = {
  list: () =>
    apiFetch<ReceitaListItem[]>("/receitas"),

  get: (id: number) =>
    apiFetch<ReceitaDetalhe>(`/api/receitas/${id}`),

  getTree: (id: number | string) =>
    apiFetch<ReceitaTreeDetalhe>(`/receitas/${id}`),

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
    apiFetch<{ message: string }>(`/api/receitas/${id}`, { method: "DELETE" }),
};
