import { useEffect, useState, useMemo } from "react"
import { Download, TrendingUp, BarChart3, Info, ArrowUpDown } from "lucide-react"
import { FadeUp } from "@/components/ui/fade-up"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { CartesianGrid, XAxis, YAxis, Bar, BarChart, LabelList, Area, AreaChart } from "recharts"
import {
  PageHeader,
  ErrorAlert,
  FilterBar,
  CardSkeletons,
  StatsCard,
} from "@/components/common"
import { vendasApi } from "@/lib/api"
import { formatBRL, formatPercent } from "@/lib/format"
import type { StoreAnalysisResponse, VendasFiltersResponse, StoreAnalysisProduct } from "@/lib/api"
import * as XLSX from "xlsx"

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

type SortConfig = {
  key: keyof StoreAnalysisProduct | "id_produto"
  direction: "asc" | "desc"
} | null

export default function Lojas() {
  const [filters, setFilters] = useState<VendasFiltersResponse>({ lojas: [], meses: [] })
  const [selectedStore, setSelectedStore] = useState("todas")
  const [selectedMonth, setSelectedMonth] = useState("todos")
  const [analysis, setAnalysis] = useState<StoreAnalysisResponse | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [trendData, setTrendData] = useState<any[]>([])
  const [loadingFilters, setLoadingFilters] = useState(true)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)
  const [loadingTrend, setLoadingTrend] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "valor_total", direction: "desc" })

  useEffect(() => {
    vendasApi
      .getFilters()
      .then((response) => {
        setFilters(response)
        setSelectedMonth("todos")
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Erro ao carregar filtros de lojas."))
      .finally(() => setLoadingFilters(false))
  }, [])

  const aggregateAnalysis = (results: StoreAnalysisResponse[], label: string = "Consolidado"): StoreAnalysisResponse => {
    if (results.length === 0)
      return {
        loja_id: label,
        mes: "Vários",
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
        produtos: [],
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
      produtos: [],
    }

    const productMap = new Map<string, StoreAnalysisProduct>()

    results.forEach((res) => {
      aggregated.resumo.receita_total += res.resumo.receita_total
      aggregated.resumo.receita_vinculada += res.resumo.receita_vinculada
      aggregated.resumo.receita_sem_vinculo += res.resumo.receita_sem_vinculo
      aggregated.resumo.custo_ideal_total += res.resumo.custo_ideal_total

      res.produtos.forEach((p) => {
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

    const linkedProducts = Array.from(productMap.values()).filter((p) => p.vinculado)
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
        const monthsToFetch = selectedMonth === "todos" ? filters.meses : [selectedMonth]
        const storesToFetch = selectedStore === "todas" ? filters.lojas : [selectedStore]

        const fetchPromises = storesToFetch.flatMap((s) => monthsToFetch.map((m) => vendasApi.getStoreAnalysis(s, m)))

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
    if (filters.meses.length === 0) return

    const loadTrend = async () => {
      setLoadingTrend(true)
      try {
        const monthsList = filters.meses
        const relevantMonths = [...monthsList].reverse().slice(-6)

        const trendResults = await Promise.all(
          relevantMonths.map(async (m) => {
            if (selectedStore === "todas") {
              const storesToFetch = filters.lojas
              const promises = storesToFetch.map((s) => vendasApi.getStoreAnalysis(s, m))
              const storeResults = await Promise.all(promises)
              return aggregateAnalysis(storeResults)
            } else {
              return vendasApi.getStoreAnalysis(selectedStore, m)
            }
          })
        )

        const formattedTrend = trendResults.map((r) => ({
          mes: r.mes.split("-")[1] + "/" + r.mes.split("-")[0].slice(2),
          cmv: parseFloat(r.resumo.cmv_ideal_percentual?.toFixed(2) || "0"),
          receita: r.resumo.receita_vinculada,
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
      .filter((p) => p.vinculado)
      .sort((a, b) => (b.valor_total || 0) - (a.valor_total || 0))
      .slice(0, 10)
      .map((p) => ({
        name: p.produto_nome || p.id_produto,
        receita: p.valor_total,
        cmv: p.cmv_ideal_percentual,
      }))
  }, [analysis])

  const handleExport = () => {
    if (!analysis) return
    const data = analysis.produtos.map((p) => ({
      "ID Produto": p.id_produto,
      "SKU Externo": p.id_produto_externo || "N/A",
      "Nome Interno": p.produto_nome || "N/A",
      "Tipo": p.produto_tipo || "N/A",
      "Quantidade": p.quantidade_total,
      "Receita Total (R$)": p.valor_total,
      "Preço Médio (R$)": p.preco_medio,
      "Custo Unitário (R$)": p.custo_unitario_ideal,
      "CMV Ideal %": p.cmv_ideal_percentual,
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
    setSortConfig((current) => {
      if (current?.key === key) {
        return { key, direction: current.direction === "asc" ? "desc" : "asc" }
      }
      return { key, direction: "desc" }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb="Análise / Performance"
        title="CMV ideal consolidado"
        description="Visão gerencial de custos e margens teóricas baseadas no mix de vendas."
        actions={
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={!analysis || loadingAnalysis}
            className="h-10 text-sm gap-2 border-brand-line/40 hover:bg-brand-surface-2 px-4"
          >
            <Download className="size-4" />
            Exportar Base
          </Button>
        }
      />

      <ErrorAlert error={error} onDismiss={() => setError(null)} />

      <FilterBar
        stores={filters.lojas}
        months={filters.meses}
        selectedStore={selectedStore}
        selectedMonth={selectedMonth}
        onStoreChange={setSelectedStore}
        onMonthChange={setSelectedMonth}
        loading={loadingFilters}
      />

      {loadingAnalysis ? (
        <CardSkeletons count={4} />
      ) : analysis ? (
        <>
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatsCard
              label="Receita Analisada"
              value={formatBRL(analysis.resumo.receita_vinculada)}
              subtitle="Faturamento vinculado a receitas"
              variant="highlight"
            />

            <StatsCard
              label="Custo Ideal Total"
              value={formatBRL(analysis.resumo.custo_ideal_total)}
              subtitle="Total teórico das fichas técnicas"
              variant="highlight"
            />

            <StatsCard
              label="CMV Ideal (%)"
              value={formatPercent(analysis.resumo.cmv_ideal_percentual)}
              subtitle={`${analysis.resumo.produtos_vinculados} produtos processados`}
              variant="highlight"
            />

            <StatsCard
              label="Margem Bruta Teórica"
              value={formatBRL(analysis.resumo.receita_vinculada - analysis.resumo.custo_ideal_total)}
              subtitle="Potencial de lucratividade"
              variant="highlight"
            />
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
                      <Skeleton className="h-8 w-8 rounded-full animate-spin" />
                    </div>
                  ) : (
                    <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 30, bottom: 20 }}>
                      <defs>
                        <linearGradient id="fillCmv" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--brand-highlight))" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="hsl(var(--brand-highlight))" stopOpacity={0} />
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
                        domain={["dataMax + 10", 0]}
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
                      tickFormatter={(value) => (value.length > 18 ? `${value.substring(0, 15)}...` : value)}
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
                      <TableHead
                        onClick={() => toggleSort("id_produto")}
                        className="cursor-pointer group text-[0.8rem] uppercase font-bold text-brand-muted transition-colors hover:text-brand-highlight px-6"
                      >
                        <div className="flex items-center gap-2">
                          SKU Externo <ArrowUpDown className="size-4" />
                        </div>
                      </TableHead>
                      <TableHead className="text-[0.8rem] uppercase font-bold text-brand-muted px-4">Mapeamento Interno</TableHead>
                      <TableHead
                        onClick={() => toggleSort("quantidade_total")}
                        className="cursor-pointer group text-right text-[0.8rem] uppercase font-bold text-brand-muted transition-colors hover:text-brand-highlight px-4"
                      >
                        <div className="flex items-center justify-end gap-2">
                          Qtd <ArrowUpDown className="size-4" />
                        </div>
                      </TableHead>
                      <TableHead
                        onClick={() => toggleSort("valor_total")}
                        className="cursor-pointer group text-right text-[0.8rem] uppercase font-bold text-brand-muted transition-colors hover:text-brand-highlight px-4"
                      >
                        <div className="flex items-center justify-end gap-2">
                          Receita <ArrowUpDown className="size-4" />
                        </div>
                      </TableHead>
                      <TableHead
                        onClick={() => toggleSort("preco_medio")}
                        className="cursor-pointer group text-right text-[0.8rem] uppercase font-bold text-brand-muted transition-colors hover:text-brand-highlight px-4 whitespace-nowrap"
                      >
                        <div className="flex items-center justify-end gap-2">
                          Preço Médio <ArrowUpDown className="size-4" />
                        </div>
                      </TableHead>
                      <TableHead
                        onClick={() => toggleSort("custo_unitario_ideal")}
                        className="cursor-pointer group text-right text-[0.8rem] uppercase font-bold text-brand-muted transition-colors hover:text-brand-highlight px-4 whitespace-nowrap"
                      >
                        <div className="flex items-center justify-end gap-2">
                          Custo Ideal <ArrowUpDown className="size-4" />
                        </div>
                      </TableHead>
                      <TableHead
                        onClick={() => toggleSort("cmv_ideal_percentual")}
                        className="cursor-pointer group text-right text-[0.8rem] uppercase font-bold text-brand-muted transition-colors hover:text-brand-highlight px-4 whitespace-nowrap"
                      >
                        <div className="flex items-center justify-end gap-2">
                          CMV Ideal <ArrowUpDown className="size-4" />
                        </div>
                      </TableHead>
                      <TableHead className="h-11 text-center text-[0.8rem] uppercase font-bold text-brand-muted px-6">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedProdutos.map((item) => (
                      <TableRow key={item.id_produto} className="border-b border-brand-line/5 hover:bg-brand-highlight/5 transition-all duration-200 group h-16">
                        <TableCell className="font-bold text-[0.9rem] px-6">{item.id_produto}</TableCell>
                        <TableCell className="px-4">
                          {item.vinculado ? (
                            <div className="flex flex-col">
                              <span className="text-brand-soft text-[0.95rem] font-bold group-hover:text-brand-highlight transition-colors">
                                {item.produto_nome}
                              </span>
                              <span className="text-brand-muted text-[0.7rem] uppercase tracking-wider font-semibold">
                                {item.produto_tipo} · {item.id_produto_externo}
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col">
                              <span className="text-brand-muted/40 font-bold text-xs uppercase italic">Sem mapeamento interno</span>
                              <span className="text-[0.6rem] text-brand-muted/30 uppercase font-medium">Excluído dos cálculos</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-[0.9rem] font-medium px-4">{item.quantidade_total.toLocaleString()}</TableCell>
                        <TableCell className="text-right tabular-nums text-[0.9rem] font-bold px-4">{formatBRL(item.valor_total)}</TableCell>
                        <TableCell className="text-right tabular-nums text-[0.9rem] font-medium text-brand-soft px-4">
                          {item.vinculado && item.preco_medio ? formatBRL(item.preco_medio) : "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-[0.9rem] font-bold text-brand-highlight px-4">
                          {item.custo_unitario_ideal ? formatBRL(item.custo_unitario_ideal) : "—"}
                        </TableCell>
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
                              {item.cmv_ideal_percentual && item.cmv_ideal_percentual > 35
                                ? "ALTO"
                                : item.cmv_ideal_percentual && item.cmv_ideal_percentual > 28
                                ? "ALERTA"
                                : "OK"}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-black/40 hover:bg-black/60 h-16 border-t-2 border-brand-line/30 transition-colors">
                      <TableCell className="font-bold text-[0.9rem] px-6 text-brand-highlight">TOTAL ANALISADO</TableCell>
                      <TableCell className="px-4 font-semibold text-brand-muted italic">{analysis.resumo.produtos_vinculados} itens mapeados</TableCell>
                      <TableCell className="text-right tabular-nums text-[0.95rem] font-bold px-4">{analysis.resumo.quantidade_total.toLocaleString()}</TableCell>
                      <TableCell className="text-right tabular-nums text-[0.95rem] font-bold px-4">{formatBRL(analysis.resumo.receita_vinculada)}</TableCell>
                      <TableCell className="text-right tabular-nums text-[0.9rem] font-bold text-brand-soft px-4">
                        {analysis.resumo.quantidade_total > 0 ? formatBRL(analysis.resumo.receita_vinculada / analysis.resumo.quantidade_total) : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-[0.95rem] font-bold text-brand-highlight px-4">{formatBRL(analysis.resumo.custo_ideal_total)}</TableCell>
                      <TableCell className="text-right tabular-nums text-[1.1rem] font-bold text-brand-text px-4">{formatPercent(analysis.resumo.cmv_ideal_percentual)}</TableCell>
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
                          {analysis.resumo.cmv_ideal_percentual && analysis.resumo.cmv_ideal_percentual > 35
                            ? "ALTO"
                            : analysis.resumo.cmv_ideal_percentual && analysis.resumo.cmv_ideal_percentual > 28
                            ? "ALERTA"
                            : "OK"}
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
          <div className="flex flex-col items-center justify-center">
            <p className="text-brand-soft text-lg font-bold mb-2">Selecione uma loja e período para iniciar.</p>
            <p className="text-brand-muted text-sm max-w-md">Aguardando seleção dos parâmetros de análise para carregar os dados financeiros consolidados.</p>
          </div>
        </FadeUp>
      )}
    </div>
  )
}