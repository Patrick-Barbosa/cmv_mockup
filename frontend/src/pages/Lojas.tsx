import { useEffect, useState, useMemo } from "react"
import { AlertCircle, Loader2, Store, Download, TrendingUp, BarChart3, Info, ArrowUpDown } from "lucide-react"
import { FadeUp } from "@/components/ui/fade-up"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  type ChartConfig, 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart"
import { CartesianGrid, XAxis, YAxis, Bar, BarChart, LabelList, Area, AreaChart } from "recharts"
import { vendasApi, IS_MOCK } from "@/lib/api"
import type { StoreAnalysisResponse, VendasFiltersResponse, StoreAnalysisProduct } from "@/lib/api"
import * as XLSX from "xlsx"

const mockFilters: VendasFiltersResponse = {
  lojas: ["RJ-COPA", "RJ-BARRA"],
  meses: ["2026-04", "2026-03", "2026-02", "2026-01"],
}

function buildMockAnalysis(storeId: string, month: string): StoreAnalysisResponse {
  const monthFactor = month.endsWith("04") ? 1.0 : month.endsWith("03") ? 0.95 : 0.9
  const storeFactor = storeId === "RJ-COPA" ? 1.2 : 0.8
  
  return {
    loja_id: storeId,
    mes: month,
    resumo: {
      receita_total: 1582 * monthFactor * storeFactor,
      receita_vinculada: 1501 * monthFactor * storeFactor,
      receita_sem_vinculo: 81,
      custo_ideal_total: 438.4 * monthFactor * storeFactor,
      cmv_ideal_percentual: 29.21 + (Math.random() * 4 - 2),
      quantidade_total: Math.round(76 * monthFactor * storeFactor),
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
        quantidade_total: Math.round(16 * storeFactor),
        valor_total: 704 * storeFactor,
        preco_medio: 44,
        custo_unitario_ideal: 11.8,
        custo_ideal_total: 188.8 * storeFactor,
        cmv_ideal_percentual: 26.82,
      },
      {
        id_produto: "BROWNIE-001",
        produto_id_interno: 6,
        produto_nome: "Brownie recheado",
        produto_tipo: "receita",
        id_produto_externo: "BROWNIE-001",
        vinculado: true,
        quantidade_total: Math.round(24 * storeFactor),
        valor_total: 300 * storeFactor,
        preco_medio: 12.5,
        custo_unitario_ideal: 3.6,
        custo_ideal_total: 86.4 * storeFactor,
        cmv_ideal_percentual: 28.8,
      },
      {
        id_produto: "CREPE-FRANGO-001",
        produto_id_interno: 15,
        produto_nome: "Crepe de frango",
        produto_tipo: "receita",
        id_produto_externo: "CREPE-FRANGO-001",
        vinculado: true,
        quantidade_total: Math.round(18 * storeFactor),
        valor_total: 288 * storeFactor,
        preco_medio: 16,
        custo_unitario_ideal: 4.9,
        custo_ideal_total: 88.2 * storeFactor,
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

const chartConfig = {
  cmv: {
    label: "CMV Ideal %",
    color: "hsl(var(--brand-highlight))",
  },
  receita: {
    label: "Receita (R$)",
    color: "hsl(var(--brand-highlight))",
  },
} satisfies ChartConfig

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "—"
  }
  return `${value.toFixed(1)}%`
}

type SortConfig = {
  key: keyof StoreAnalysisProduct | "id_produto";
  direction: "asc" | "desc";
} | null;

export default function Lojas() {
  const [filters, setFilters] = useState<VendasFiltersResponse>(IS_MOCK ? mockFilters : { lojas: [], meses: [] })
  const [selectedStore, setSelectedStore] = useState("todas")
  const [selectedMonth, setSelectedMonth] = useState("todos")
  const [analysis, setAnalysis] = useState<StoreAnalysisResponse | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [trendData, setTrendData] = useState<any[]>([])
  const [loadingFilters, setLoadingFilters] = useState(!IS_MOCK)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)
  const [loadingTrend, setLoadingTrend] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "valor_total", direction: "desc" })

  useEffect(() => {
    if (IS_MOCK) {
      setSelectedMonth("todos")
      return
    }

    vendasApi.getFilters()
      .then((response) => {
        setFilters(response)
        setSelectedMonth("todos")
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Erro ao carregar filtros de lojas."))
      .finally(() => setLoadingFilters(false))
  }, [])

  const aggregateAnalysis = (results: StoreAnalysisResponse[], label: string = "Consolidado"): StoreAnalysisResponse => {
    if (results.length === 0) return {
      loja_id: label,
      mes: "Vários",
      resumo: { receita_total: 0, receita_vinculada: 0, receita_sem_vinculo: 0, custo_ideal_total: 0, cmv_ideal_percentual: 0, quantidade_total: 0, produtos_vinculados: 0, produtos_sem_vinculo: 0 },
      produtos: []
    }

    const aggregated: StoreAnalysisResponse = {
      loja_id: label,
      mes: results[0].mes,
      resumo: {
        receita_total: 0,
        receita_vinculada: 0,
        receita_sem_vinculo: 0,
        custo_ideal_total: 0,
        cmv_ideal_percentual: 0,
        quantidade_total: 0,
        produtos_vinculados: 0,
        produtos_sem_vinculo: 0,
      },
      produtos: []
    }

    const productMap = new Map<string, StoreAnalysisProduct>()

    results.forEach(res => {
      aggregated.resumo.receita_total += res.resumo.receita_total
      aggregated.resumo.receita_vinculada += res.resumo.receita_vinculada
      aggregated.resumo.receita_sem_vinculo += res.resumo.receita_sem_vinculo
      aggregated.resumo.custo_ideal_total += res.resumo.custo_ideal_total
      
      res.produtos.forEach(p => {
        const key = p.id_produto
        if (productMap.has(key)) {
          const existing = productMap.get(key)!
          existing.quantidade_total += p.quantidade_total
          existing.valor_total += p.valor_total
          existing.custo_ideal_total = (existing.custo_ideal_total || 0) + (p.custo_ideal_total || 0)
          existing.preco_medio = existing.valor_total / existing.quantidade_total
          existing.cmv_ideal_percentual = existing.vinculado ? (existing.custo_ideal_total / existing.valor_total) * 100 : null
        } else {
          productMap.set(key, { ...p })
        }
      })
    })

    const linkedProducts = Array.from(productMap.values()).filter(p => p.vinculado)
    const linkedQuantity = linkedProducts.reduce((acc, p) => acc + p.quantidade_total, 0)
    
    aggregated.resumo.quantidade_total = linkedQuantity 
    aggregated.resumo.cmv_ideal_percentual = (aggregated.resumo.custo_ideal_total / aggregated.resumo.receita_vinculada) * 100
    aggregated.produtos = Array.from(productMap.values())
    aggregated.resumo.produtos_vinculados = linkedProducts.length
    aggregated.resumo.produtos_sem_vinculo = aggregated.produtos.length - linkedProducts.length

    return aggregated
  }

  useEffect(() => {
    if (!selectedMonth || (selectedStore !== "todas" && !selectedStore)) return

    const loadData = async () => {
      setLoadingAnalysis(true)
      try {
        const monthsToFetch = selectedMonth === "todos" ? (IS_MOCK ? mockFilters.meses : filters.meses) : [selectedMonth]
        const storesToFetch = selectedStore === "todas" ? (IS_MOCK ? mockFilters.lojas : filters.lojas) : [selectedStore]
        
        const fetchPromises = storesToFetch.flatMap(s => 
          monthsToFetch.map(m => IS_MOCK ? Promise.resolve(buildMockAnalysis(s, m)) : vendasApi.getStoreAnalysis(s, m))
        )
        
        const results = await Promise.all(fetchPromises)
        const label = `${selectedStore === "todas" ? "Todas as Lojas" : selectedStore} · ${selectedMonth === "todos" ? "Histórico Total" : selectedMonth}`
        setAnalysis(aggregateAnalysis(results, label))
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao carregar análise consolidada.")
      } finally {
        setLoadingAnalysis(false)
      }
    }

    loadData()
  }, [selectedMonth, selectedStore, filters.lojas, filters.meses])

  useEffect(() => {
    if (filters.meses.length === 0 && !IS_MOCK) return

    const loadTrend = async () => {
      setLoadingTrend(true)
      try {
        const monthsList = IS_MOCK ? mockFilters.meses : filters.meses
        const relevantMonths = [...monthsList].reverse().slice(-6)
        
        const trendResults = await Promise.all(relevantMonths.map(async (m) => {
          if (selectedStore === "todas") {
            const storesToFetch = IS_MOCK ? mockFilters.lojas : filters.lojas
            const promises = storesToFetch.map(s => IS_MOCK ? Promise.resolve(buildMockAnalysis(s, m)) : vendasApi.getStoreAnalysis(s, m))
            const storeResults = await Promise.all(promises)
            return aggregateAnalysis(storeResults)
          } else {
            return IS_MOCK ? buildMockAnalysis(selectedStore, m) : vendasApi.getStoreAnalysis(selectedStore, m)
          }
        }))

        const formattedTrend = trendResults.map(r => ({
          mes: r.mes.split("-")[1] + "/" + r.mes.split("-")[0].slice(2),
          cmv: parseFloat(r.resumo.cmv_ideal_percentual?.toFixed(2) || "0"),
          receita: r.resumo.receita_vinculada 
        }))
        setTrendData(formattedTrend)
      } catch (e) {
        console.error("Erro ao carregar tendência:", e)
      } finally {
        setLoadingTrend(false)
      }
    }

    loadTrend()
  }, [selectedStore, filters.meses, filters.lojas])

  const sortedProdutos = useMemo(() => {
    if (!analysis) return []
    const data = [...analysis.produtos]
    if (sortConfig) {
      data.sort((a, b) => {
        const aVal = a[sortConfig.key] ?? 0
        const bVal = b[sortConfig.key] ?? 0
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1
        return 0
      })
    }
    return data
  }, [analysis, sortConfig])

  const barData = useMemo(() => {
    if (!analysis) return []
    return analysis.produtos
      .filter(p => p.vinculado)
      .sort((a, b) => (b.valor_total || 0) - (a.valor_total || 0))
      .slice(0, 10)
      .map(p => ({
        name: p.produto_nome || p.id_produto,
        receita: p.valor_total,
        cmv: p.cmv_ideal_percentual
      }))
  }, [analysis])

  const handleExport = () => {
    if (!analysis) return
    const data = analysis.produtos.map(p => ({
      "ID Produto": p.id_produto,
      "SKU Externo": p.id_produto_externo || "N/A",
      "Nome Interno": p.produto_nome || "N/A",
      "Tipo": p.produto_tipo || "N/A",
      "Quantidade": p.quantidade_total,
      "Receita Total (R$)": p.valor_total,
      "Preço Médio (R$)": p.preco_medio,
      "Custo Unitário (R$)": p.custo_unitario_ideal,
      "CMV Ideal %": p.cmv_ideal_percentual
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Base CMV Ideal")
    XLSX.writeFile(wb, `CMV_Ideal_${selectedStore}_${selectedMonth}.xlsx`)
  }

  const getStatusColor = (cmv: number | null) => {
    if (cmv === null) return "outline"
    if (cmv > 35) return "alto"
    if (cmv > 28) return "warning"
    return "success"
  }

  const toggleSort = (key: keyof StoreAnalysisProduct | "id_produto") => {
    setSortConfig(current => {
      if (current?.key === key) {
        return { key, direction: current.direction === "asc" ? "desc" : "asc" }
      }
      return { key, direction: "desc" }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <FadeUp className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-brand-muted text-[0.75rem] tracking-[0.28em] uppercase font-medium mb-2">Análise / Performance</p>
          <h1 className="text-3xl md:text-4xl font-semibold leading-tight tracking-tight">CMV ideal consolidado</h1>
          <p className="text-brand-soft text-base mt-2 leading-relaxed max-w-2xl">
            Visão gerencial de custos e margens teóricas baseadas no mix de vendas.
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleExport} 
          disabled={!analysis || loadingAnalysis}
          className="h-10 text-sm gap-2 border-brand-line/40 hover:bg-brand-surface-2 px-4"
        >
          <Download className="size-4" />
          Exportar Base
        </Button>
      </FadeUp>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-sm px-4 py-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
          <p className="text-destructive text-sm font-medium">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-destructive hover:text-destructive/80 text-sm">×</button>
        </div>
      )}

      <FadeUp delay={0.05} className="bg-brand-surface-2 border border-brand-line/20 rounded-sm p-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-brand-soft tracking-tight block">Filtro de Unidade</label>
            <Select value={selectedStore} onValueChange={setSelectedStore} disabled={loadingFilters}>
              <SelectTrigger className="w-full bg-brand-surface border-brand-line/35 h-11 text-base">
                <SelectValue placeholder="Selecione a loja" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as Lojas</SelectItem>
                {filters.lojas.map((store) => (
                  <SelectItem key={store} value={store}>{store}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-brand-soft tracking-tight block">Mês de Referência</label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={loadingFilters}>
              <SelectTrigger className="w-full bg-brand-surface border-brand-line/35 h-11 text-base">
                <SelectValue placeholder="Selecione o mês" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Meses</SelectItem>
                {filters.meses.map((month) => (
                  <SelectItem key={month} value={month}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </FadeUp>

      {loadingAnalysis ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 w-full rounded-sm" />)}
        </div>
      ) : analysis ? (
        <>
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card className="bg-brand-surface-2 border-brand-line/20 shadow-none">
              <CardHeader className="pb-2">
                <CardDescription className="text-sm uppercase tracking-wider font-medium text-brand-muted">Receita Analisada</CardDescription>
                <CardTitle className="text-4xl font-semibold text-brand-highlight tracking-tight">{formatBRL(analysis.resumo.receita_vinculada)}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-brand-muted text-sm font-medium">Faturamento vinculado a receitas</p>
              </CardContent>
            </Card>

            <Card className="bg-brand-surface-2 border-brand-line/20 shadow-none">
              <CardHeader className="pb-2">
                <CardDescription className="text-sm uppercase tracking-wider font-medium text-brand-muted">Custo Ideal Total</CardDescription>
                <CardTitle className="text-4xl font-semibold text-brand-highlight tracking-tight">{formatBRL(analysis.resumo.custo_ideal_total)}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-brand-muted text-sm font-medium">Total teórico das fichas técnicas</p>
              </CardContent>
            </Card>

            <Card className="bg-brand-surface-2 border-brand-line/20 shadow-none">
              <CardHeader className="pb-2">
                <CardDescription className="text-sm uppercase tracking-wider font-medium text-brand-muted">CMV Ideal (%)</CardDescription>
                <CardTitle className="text-4xl font-semibold text-brand-highlight tracking-tight">{formatPercent(analysis.resumo.cmv_ideal_percentual)}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-brand-muted text-sm font-medium">{analysis.resumo.produtos_vinculados} produtos processados</p>
              </CardContent>
            </Card>

            <Card className="bg-brand-surface-2 border-brand-line/20 shadow-none relative overflow-hidden group hover:border-brand-highlight/30 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-highlight/5 blur-3xl -mr-16 -mt-16 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="pb-2 relative z-10">
                <CardDescription className="text-sm uppercase tracking-wider font-medium text-brand-muted">Margem Bruta Teórica</CardDescription>
                <CardTitle className="text-4xl font-semibold text-brand-highlight tracking-tight">
                  {formatBRL(analysis.resumo.receita_vinculada - analysis.resumo.custo_ideal_total)}
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="text-brand-muted text-sm font-medium">Potencial de lucratividade</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid xl:grid-cols-2 gap-6">
            <Card className="bg-brand-surface-2 border-brand-line/20 shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-6">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-bold">Histórico de Performance</CardTitle>
                  <CardDescription className="text-base">Evolução do CMV Ideal no tempo</CardDescription>
                </div>
                <TrendingUp className="size-6 text-brand-muted" />
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[320px] w-full">
                  {loadingTrend ? (
                    <div className="flex h-full items-center justify-center">
                      <Loader2 className="size-8 animate-spin text-brand-muted" />
                    </div>
                  ) : (
                    <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 30, bottom: 20 }}>
                      <defs>
                        <linearGradient id="fillCmv" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--brand-highlight))" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="hsl(var(--brand-highlight))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsla(var(--brand-line), 0.2)" />
                      <XAxis 
                        dataKey="mes" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 13, fill: "hsl(var(--brand-muted))", fontWeight: 600 }}
                        tickMargin={16}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 13, fill: "hsl(var(--brand-muted))", fontWeight: 600 }}
                        domain={[0, 'dataMax + 10']}
                        tickMargin={16}
                      />
                      <ChartTooltip content={<ChartTooltipContent hideLabel className="bg-brand-surface border-brand-line/40 shadow-xl" />} />
                      <Area 
                        type="monotone" 
                        dataKey="cmv" 
                        stroke="hsl(var(--brand-highlight))" 
                        strokeWidth={4} 
                        fill="url(#fillCmv)"
                        dot={{ r: 5, fill: "hsl(var(--brand-highlight))" }} 
                        activeDot={{ r: 7 }}
                      />
                    </AreaChart>
                  )}
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="bg-brand-surface-2 border-brand-line/20 shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-6">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-bold">Top 10 Produtos por Faturamento</CardTitle>
                  <CardDescription className="text-base">Impacto financeiro e margem ideal</CardDescription>
                </div>
                <BarChart3 className="size-6 text-brand-muted" />
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[320px] w-full">
                  <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 60, top: 0, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={120}
                      tick={{ fontSize: 11, fill: "hsl(var(--brand-soft))", fontWeight: 500 }}
                      tickFormatter={(value) => value.length > 18 ? `${value.substring(0, 15)}...` : value}
                      axisLine={false}
                      tickLine={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent className="bg-brand-surface border-brand-line/40 shadow-xl" />} />
                    <Bar dataKey="receita" fill="hsl(var(--brand-highlight))" radius={[0, 8, 8, 0]} barSize={32}>
                      <LabelList 
                        dataKey="cmv" 
                        position="right" 
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        formatter={(v: any) => `${v?.toFixed(0)}%`}
                        className="fill-brand-muted text-sm font-bold"
                        offset={12}
                      />
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-brand-surface-2 border-brand-line/20 shadow-none overflow-hidden">
            <CardHeader className="px-6 py-6 border-b border-brand-line/10 flex flex-row items-center justify-between bg-brand-surface/25">
              <div className="space-y-1">
                <CardTitle className="text-lg font-bold">Detalhamento dos SKUs</CardTitle>
                <CardDescription className="text-base font-medium">Análise granular de performance e margens por unidade vendida</CardDescription>
              </div>
              <div className="flex items-center gap-2 text-sm font-bold text-brand-muted">
                <Info className="size-5" />
                <span>Baseado em {analysis.resumo.quantidade_total.toLocaleString()} itens vendidos</span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-brand-line/15 bg-brand-surface/50 hover:bg-brand-surface/50 h-14">
                      <TableHead onClick={() => toggleSort("id_produto")} className="cursor-pointer group text-[0.8rem] uppercase font-bold text-brand-muted transition-colors hover:text-brand-highlight px-6">
                        <div className="flex items-center gap-2">SKU Externo <ArrowUpDown className="size-4" /></div>
                      </TableHead>
                      <TableHead className="text-[0.8rem] uppercase font-bold text-brand-muted px-4">Mapeamento Interno</TableHead>
                      <TableHead onClick={() => toggleSort("quantidade_total")} className="cursor-pointer group text-right text-[0.8rem] uppercase font-bold text-brand-muted transition-colors hover:text-brand-highlight px-4">
                        <div className="flex items-center justify-end gap-2">Qtd <ArrowUpDown className="size-4" /></div>
                      </TableHead>
                      <TableHead onClick={() => toggleSort("valor_total")} className="cursor-pointer group text-right text-[0.8rem] uppercase font-bold text-brand-muted transition-colors hover:text-brand-highlight px-4">
                        <div className="flex items-center justify-end gap-2">Receita <ArrowUpDown className="size-4" /></div>
                      </TableHead>
                      <TableHead onClick={() => toggleSort("preco_medio")} className="cursor-pointer group text-right text-[0.8rem] uppercase font-bold text-brand-muted transition-colors hover:text-brand-highlight px-4 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">Preço Médio <ArrowUpDown className="size-4" /></div>
                      </TableHead>
                      <TableHead onClick={() => toggleSort("custo_unitario_ideal")} className="cursor-pointer group text-right text-[0.8rem] uppercase font-bold text-brand-muted transition-colors hover:text-brand-highlight px-4 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">Custo Ideal <ArrowUpDown className="size-4" /></div>
                      </TableHead>
                      <TableHead onClick={() => toggleSort("cmv_ideal_percentual")} className="cursor-pointer group text-right text-[0.8rem] uppercase font-bold text-brand-muted transition-colors hover:text-brand-highlight px-4 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">CMV Ideal <ArrowUpDown className="size-4" /></div>
                      </TableHead>
                      <TableHead className="h-11 text-center text-[0.8rem] uppercase font-bold text-brand-muted px-6">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedProdutos.map((item) => (
                      <TableRow key={item.id_produto} className="border-b border-brand-line/5 hover:bg-brand-highlight/5 transition-all duration-200 group h-16">
                        <TableCell className="font-bold text-[0.9rem] px-6">{item.id_produto}</TableCell>
                        <TableCell className="px-4">
                          {item.vinculado 
                            ? (
                              <div className="flex flex-col">
                                <span className="text-brand-soft text-[0.95rem] font-bold group-hover:text-brand-highlight transition-colors">{item.produto_nome}</span>
                                <span className="text-brand-muted text-[0.7rem] uppercase tracking-wider font-semibold">{item.produto_tipo} · {item.id_produto_externo}</span>
                              </div>
                            )
                            : (
                              <div className="flex flex-col">
                                <span className="text-brand-muted/40 font-bold text-xs uppercase italic">Sem mapeamento interno</span>
                                <span className="text-[0.6rem] text-brand-muted/30 uppercase font-medium">Excluído dos cálculos</span>
                              </div>
                            )
                          }
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-[0.9rem] font-medium px-4">{item.quantidade_total.toLocaleString()}</TableCell>
                        <TableCell className="text-right tabular-nums text-[0.9rem] font-bold px-4">{formatBRL(item.valor_total)}</TableCell>
                        <TableCell className="text-right tabular-nums text-[0.9rem] font-medium text-brand-soft px-4">{item.vinculado && item.preco_medio ? formatBRL(item.preco_medio) : "—"}</TableCell>
                        <TableCell className="text-right tabular-nums text-[0.9rem] font-bold text-brand-highlight px-4">{item.custo_unitario_ideal ? formatBRL(item.custo_unitario_ideal) : "—"}</TableCell>
                        <TableCell className="text-right tabular-nums text-[1.05rem] font-bold text-brand-text px-4">{formatPercent(item.cmv_ideal_percentual)}</TableCell>
                        <TableCell className="text-center px-6">
                          {item.vinculado && (
                            <Badge 
                              className={`text-[0.65rem] font-bold uppercase tracking-tight px-3 py-1 shadow-sm border-none ${
                                getStatusColor(item.cmv_ideal_percentual) === "alto" 
                                  ? "bg-amber-500/10 text-amber-500" 
                                  : getStatusColor(item.cmv_ideal_percentual) === "success"
                                  ? "bg-brand-highlight/20 text-brand-highlight"
                                  : "bg-brand-soft/15 text-brand-muted"
                              }`}
                            >
                              {item.cmv_ideal_percentual && item.cmv_ideal_percentual > 35 ? "ALTO" : item.cmv_ideal_percentual && item.cmv_ideal_percentual > 28 ? "ALERTA" : "OK"}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* TOTAL ANALISADO - Darker for contrast */}
                    <TableRow className="bg-black/40 hover:bg-black/60 h-16 border-t-2 border-brand-line/30 transition-colors">
                      <TableCell className="font-bold text-[0.9rem] px-6 text-brand-highlight">TOTAL ANALISADO</TableCell>
                      <TableCell className="px-4 font-semibold text-brand-muted italic">
                        {analysis.resumo.produtos_vinculados} itens mapeados
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-[0.95rem] font-bold px-4">
                        {analysis.resumo.quantidade_total.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-[0.95rem] font-bold px-4">
                        {formatBRL(analysis.resumo.receita_vinculada)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-[0.9rem] font-bold text-brand-soft px-4">
                        {analysis.resumo.quantidade_total > 0 
                          ? formatBRL(analysis.resumo.receita_vinculada / analysis.resumo.quantidade_total)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-[0.95rem] font-bold text-brand-highlight px-4">
                        {formatBRL(analysis.resumo.custo_ideal_total)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-[1.1rem] font-bold text-brand-text px-4">
                        {formatPercent(analysis.resumo.cmv_ideal_percentual)}
                      </TableCell>
                      <TableCell className="text-center px-6">
                        <Badge 
                          className={`text-[0.65rem] font-bold uppercase tracking-tight px-3 py-1 shadow-sm border-none ${
                            getStatusColor(analysis.resumo.cmv_ideal_percentual) === "alto" 
                              ? "bg-amber-500/10 text-amber-500" 
                              : getStatusColor(analysis.resumo.cmv_ideal_percentual) === "success"
                              ? "bg-brand-highlight/20 text-brand-highlight"
                              : "bg-brand-soft/15 text-brand-muted"
                          }`}
                        >
                          {analysis.resumo.cmv_ideal_percentual && analysis.resumo.cmv_ideal_percentual > 35 ? "ALTO" : analysis.resumo.cmv_ideal_percentual && analysis.resumo.cmv_ideal_percentual > 28 ? "ALERTA" : "OK"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <FadeUp delay={0.1} className="bg-brand-surface border border-brand-line/15 rounded-[2px] p-10 text-center">
          <Store className="size-10 text-brand-muted mx-auto mb-4 opacity-30" />
          <p className="text-brand-soft text-lg font-bold mb-2">Selecione uma loja e período para iniciar.</p>
          <p className="text-brand-muted text-sm max-w-md mx-auto">
            Aguardando seleção dos parâmetros de análise para carregar os dados financeiros consolidados.
          </p>
        </FadeUp>
      )}
    </div>
  )
}
