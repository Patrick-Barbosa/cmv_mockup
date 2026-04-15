import { useEffect, useState } from "react"
import { AlertCircle, Loader2, Store } from "lucide-react"
import { FadeUp } from "@/components/ui/fade-up"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { vendasApi, IS_MOCK } from "@/lib/api"
import type { StoreAnalysisResponse, VendasFiltersResponse } from "@/lib/api"

const mockFilters: VendasFiltersResponse = {
  lojas: ["RJ-COPA", "RJ-BARRA"],
  meses: ["2026-04", "2026-03"],
}

function buildMockAnalysis(storeId: string, month: string): StoreAnalysisResponse {
  return {
    loja_id: storeId,
    mes: month,
    resumo: {
      receita_total: 1582,
      receita_vinculada: 1501,
      receita_sem_vinculo: 81,
      custo_ideal_total: 438.4,
      cmv_ideal_percentual: 29.21,
      quantidade_total: 76,
      produtos_vinculados: 4,
      produtos_sem_vinculo: 1,
    },
    produtos: [
      {
        id_produto: "PIZZA-MARG-001",
        produto_id_interno: 12,
        produto_nome: "Pizza margherita",
        produto_tipo: "receita",
        id_produto_externo: "PIZZA-MARG-001",
        vinculado: true,
        quantidade_total: 16,
        valor_total: 704,
        preco_medio: 44,
        custo_unitario_ideal: 11.8,
        custo_ideal_total: 188.8,
        cmv_ideal_percentual: 26.82,
      },
      {
        id_produto: "BROWNIE-001",
        produto_id_interno: 6,
        produto_nome: "Brownie recheado",
        produto_tipo: "receita",
        id_produto_externo: "BROWNIE-001",
        vinculado: true,
        quantidade_total: 24,
        valor_total: 300,
        preco_medio: 12.5,
        custo_unitario_ideal: 3.6,
        custo_ideal_total: 86.4,
        cmv_ideal_percentual: 28.8,
      },
      {
        id_produto: "CREPE-FRANGO-001",
        produto_id_interno: 15,
        produto_nome: "Crepe de frango",
        produto_tipo: "receita",
        id_produto_externo: "CREPE-FRANGO-001",
        vinculado: true,
        quantidade_total: 18,
        valor_total: 288,
        preco_medio: 16,
        custo_unitario_ideal: 4.9,
        custo_ideal_total: 88.2,
        cmv_ideal_percentual: 30.63,
      },
      {
        id_produto: "PRODUTO-SEM-VINCULO",
        produto_id_interno: null,
        produto_nome: null,
        produto_tipo: null,
        id_produto_externo: null,
        vinculado: false,
        quantidade_total: 9,
        valor_total: 81,
        preco_medio: 9,
        custo_unitario_ideal: null,
        custo_ideal_total: null,
        cmv_ideal_percentual: null,
      },
    ],
  }
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "—"
  }
  return `${value.toFixed(1)}%`
}

export default function Lojas() {
  const [filters, setFilters] = useState<VendasFiltersResponse>(IS_MOCK ? mockFilters : { lojas: [], meses: [] })
  const [selectedStore, setSelectedStore] = useState(IS_MOCK ? mockFilters.lojas[0] : "")
  const [selectedMonth, setSelectedMonth] = useState(IS_MOCK ? mockFilters.meses[0] : "")
  const [analysis, setAnalysis] = useState<StoreAnalysisResponse | null>(
    IS_MOCK ? buildMockAnalysis(mockFilters.lojas[0], mockFilters.meses[0]) : null
  )
  const [loadingFilters, setLoadingFilters] = useState(!IS_MOCK)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (IS_MOCK) return

    vendasApi.getFilters()
      .then((response) => {
        setFilters(response)
        setSelectedStore((current) => current || response.lojas[0] || "")
        setSelectedMonth((current) => current || response.meses[0] || "")
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Erro ao carregar filtros de lojas."))
      .finally(() => setLoadingFilters(false))
  }, [])

  useEffect(() => {
    if (!selectedStore || !selectedMonth) {
      return
    }

    if (IS_MOCK) {
      setAnalysis(buildMockAnalysis(selectedStore, selectedMonth))
      return
    }

    setLoadingAnalysis(true)
    vendasApi.getStoreAnalysis(selectedStore, selectedMonth)
      .then((response) => setAnalysis(response))
      .catch((e) => setError(e instanceof Error ? e.message : "Erro ao carregar análise da loja."))
      .finally(() => setLoadingAnalysis(false))
  }, [selectedMonth, selectedStore])

  return (
    <div className="flex flex-col gap-6">
      <FadeUp>
        <p className="text-brand-muted text-[0.7rem] tracking-[0.28em] uppercase font-medium mb-2">Análise / Lojas</p>
        <h1 className="text-2xl md:text-3xl font-semibold leading-tight tracking-tight">CMV ideal por loja</h1>
        <p className="text-brand-soft text-sm md:text-base mt-2 leading-relaxed max-w-2xl">
          Compare o faturamento mensal da loja com o custo ideal das receitas e produtos vinculados às vendas importadas.
        </p>
      </FadeUp>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-sm px-4 py-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-red-400 text-xs">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300 text-xs">×</button>
        </div>
      )}

      <FadeUp delay={0.05} className="bg-brand-surface-2 border border-brand-line/20 rounded-sm p-5">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[0.76rem] text-brand-soft tracking-[0.03em] block">Loja</label>
            <Select value={selectedStore} onValueChange={setSelectedStore} disabled={loadingFilters || filters.lojas.length === 0}>
              <SelectTrigger className="w-full bg-brand-surface border-brand-line/35 focus:ring-brand-highlight/10 focus:border-brand-highlight/55 h-10">
                <SelectValue placeholder="Selecione a loja" />
              </SelectTrigger>
              <SelectContent>
                {filters.lojas.map((store) => (
                  <SelectItem key={store} value={store}>{store}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-[0.76rem] text-brand-soft tracking-[0.03em] block">Mês</label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={loadingFilters || filters.meses.length === 0}>
              <SelectTrigger className="w-full bg-brand-surface border-brand-line/35 focus:ring-brand-highlight/10 focus:border-brand-highlight/55 h-10">
                <SelectValue placeholder="Selecione o mês" />
              </SelectTrigger>
              <SelectContent>
                {filters.meses.map((month) => (
                  <SelectItem key={month} value={month}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </FadeUp>

      {loadingAnalysis ? (
        <FadeUp delay={0.1} className="flex items-center justify-center py-16 gap-2 text-brand-muted">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Carregando análise da loja…</span>
        </FadeUp>
      ) : analysis ? (
        <>
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            <FadeUp delay={0.1} className="bg-brand-surface-2 border border-brand-line/20 rounded-[2px] p-5">
              <p className="text-brand-muted text-[0.7rem] tracking-[0.12em] uppercase font-medium mb-3">Receita total</p>
              <p className="text-brand-highlight text-3xl font-light tabular-nums">{formatBRL(analysis.resumo.receita_total)}</p>
              <p className="text-brand-muted text-xs mt-1">{analysis.loja_id} · {analysis.mes}</p>
            </FadeUp>

            <FadeUp delay={0.15} className="bg-brand-surface-2 border border-brand-line/20 rounded-[2px] p-5">
              <p className="text-brand-muted text-[0.7rem] tracking-[0.12em] uppercase font-medium mb-3">Custo ideal total</p>
              <p className="text-brand-highlight text-3xl font-light tabular-nums">{formatBRL(analysis.resumo.custo_ideal_total)}</p>
              <p className="text-brand-muted text-xs mt-1">Somente produtos vinculados</p>
            </FadeUp>

            <FadeUp delay={0.2} className="bg-brand-surface-2 border border-brand-line/20 rounded-[2px] p-5">
              <p className="text-brand-muted text-[0.7rem] tracking-[0.12em] uppercase font-medium mb-3">CMV ideal mensal</p>
              <p className="text-brand-highlight text-3xl font-light tabular-nums">{formatPercent(analysis.resumo.cmv_ideal_percentual)}</p>
              <p className="text-brand-muted text-xs mt-1">{analysis.resumo.produtos_vinculados} produtos vinculados</p>
            </FadeUp>

            <FadeUp delay={0.25} className="bg-brand-surface-2 border border-brand-line/20 rounded-[2px] p-5">
              <p className="text-brand-muted text-[0.7rem] tracking-[0.12em] uppercase font-medium mb-3">Receita sem vínculo</p>
              <p className="text-brand-highlight text-3xl font-light tabular-nums">{formatBRL(analysis.resumo.receita_sem_vinculo)}</p>
              <p className="text-brand-muted text-xs mt-1">{analysis.resumo.produtos_sem_vinculo} produtos sem mapeamento</p>
            </FadeUp>
          </div>

          <FadeUp delay={0.3} className="bg-brand-surface-2 border border-brand-line/20 rounded-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-brand-line/15 flex items-center justify-between">
              <div>
                <h2 className="text-brand-soft text-sm font-medium">Detalhamento por produto</h2>
                <p className="text-brand-muted text-xs mt-1">Sempre consolidado por mês e por loja.</p>
              </div>
              <Store className="w-4 h-4 text-brand-highlight" />
            </div>

            {analysis.produtos.length === 0 ? (
              <div className="py-16 px-6 text-center">
                <p className="text-brand-soft text-sm font-medium mb-1">Nenhum produto encontrado para este filtro.</p>
                <p className="text-brand-muted text-xs">Importe vendas para começar a analisar a loja.</p>
              </div>
            ) : (
              <div className="overflow-x-auto pb-4">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-brand-line/20 text-brand-muted text-[0.72rem] tracking-[0.08em] uppercase hover:bg-transparent">
                      <TableHead className="font-medium h-10">Produto vendido</TableHead>
                      <TableHead className="font-medium h-10">Mapeamento</TableHead>
                      <TableHead className="font-medium h-10 text-right">Qtd</TableHead>
                      <TableHead className="font-medium h-10 text-right">Receita</TableHead>
                      <TableHead className="font-medium h-10 text-right">Preço Médio</TableHead>
                      <TableHead className="font-medium h-10 text-right">Custo Ideal</TableHead>
                      <TableHead className="font-medium h-10 text-right">CMV Ideal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analysis.produtos.map((item) => (
                      <TableRow key={item.id_produto} className="border-b border-brand-line/10 hover:bg-brand-line/5 transition-colors">
                        <TableCell className="font-medium text-brand-text">{item.id_produto}</TableCell>
                        <TableCell className="text-brand-muted">
                          {item.vinculado && item.produto_nome
                            ? (
                              <div className="flex flex-col">
                                <span className="text-brand-soft text-sm">{item.produto_nome}</span>
                                <span className="text-brand-muted text-xs">{item.produto_tipo} · {item.id_produto_externo}</span>
                              </div>
                            )
                            : <span className="text-red-300 text-xs">Sem vínculo com produto interno</span>
                          }
                        </TableCell>
                        <TableCell className="text-right text-brand-muted tabular-nums">{item.quantidade_total}</TableCell>
                        <TableCell className="text-right text-brand-text tabular-nums">{formatBRL(item.valor_total)}</TableCell>
                        <TableCell className="text-right text-brand-text tabular-nums">{item.preco_medio !== null ? formatBRL(item.preco_medio) : "—"}</TableCell>
                        <TableCell className="text-right text-brand-highlight tabular-nums">{item.custo_unitario_ideal !== null ? formatBRL(item.custo_unitario_ideal) : "—"}</TableCell>
                        <TableCell className="text-right text-brand-highlight tabular-nums">{formatPercent(item.cmv_ideal_percentual)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </FadeUp>
        </>
      ) : (
        <FadeUp delay={0.1} className="bg-brand-surface border border-brand-line/15 rounded-[2px] p-6">
          <p className="text-brand-soft text-sm font-medium mb-1">Nenhum dado de vendas disponível ainda.</p>
          <p className="text-brand-muted text-xs">Importe um arquivo em Vendas para habilitar a análise por loja.</p>
        </FadeUp>
      )}
    </div>
  )
}
