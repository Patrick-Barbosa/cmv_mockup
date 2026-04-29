import React, { useState, useEffect, useCallback, useMemo } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
  Area,
  AreaChart,
  LabelList,
  Legend,
} from "recharts"
import {
  AlertCircle,
  TrendingUp,
  Download,
  Activity,
  PieChart,
} from "lucide-react"
import { vendasApi } from "@/lib/api"
import type { DashboardCmvResponse, VendasFiltersResponse } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { FadeUp } from "@/components/ui/fade-up"
import * as XLSX from "xlsx"

const formatBRL = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return " — "
  }
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

const formatPercent = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return " — "
  }
  return `${value.toFixed(1)}%`
}

const chartConfig = {
  faturamento: {
    label: "Faturamento",
    color: "hsl(var(--brand-highlight))",
  },
  custo: {
    label: "Custo",
    color: "hsl(var(--brand-muted))",
  },
  cmv: {
    label: "CMV %",
    color: "hsl(var(--brand-highlight))",
  },
}

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<DashboardCmvResponse | null>(null)
  const [filters, setFilters] = useState<VendasFiltersResponse>({ lojas: [], meses: [] })
  
  const [selectedMonth, setSelectedMonth] = useState<string>("all")
  const [selectedStore, setSelectedStore] = useState<string>("all")

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const monthParam = selectedMonth === "all" ? undefined : selectedMonth
      const storeParam = selectedStore === "all" ? undefined : selectedStore
      
      const dashboardData = await vendasApi.getDashboardCmv(monthParam, storeParam)
      setData(dashboardData)
    } catch (err) {
      setError("Não foi possível carregar os dados financeiros no momento.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [selectedMonth, selectedStore])

  const fetchFilters = async () => {
    try {
      const filterData = await vendasApi.getFilters()
      setFilters(filterData)
    } catch (err) {
      console.error("Erro ao carregar filtros:", err)
    }
  }

  useEffect(() => {
    fetchFilters()
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleExport = () => {
    if (!data) return
    const exportData = data.top_custo_lojas.map(loja => ({
      "Loja": loja.loja_id,
      "Imposto Total": loja.imposto_total,
      "Custo Total": loja.custo_total,
      "CMV %": loja.cmv_percent
    }))
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Dashboard CMV")
    XLSX.writeFile(wb, `Dashboard_CMV_${selectedStore}_${selectedMonth}.xlsx`)
  }

  const trendData = useMemo(() => {
    if (!data) return []
    return data.history.map(h => ({
      ...h,
      mesLabel: h.mes.split("-")[1] + "/" + h.mes.split("-")[0].slice(2)
    }))
  }, [data])

  const cmvRankingData = useMemo(() => {
    if (!data) return []
    return [...data.top_custo_lojas]
      .sort((a, b) => b.cmv_percent - a.cmv_percent)
      .slice(0, 10)
  }, [data])

  const waterfallData = useMemo(() => {
    if (!data) return []
    let current = 0;
    
    const maxVal = Math.max(...data.waterfall.map(i => Math.abs(i.value)), 1);

    return data.waterfall.map((item) => {
      const val = Math.abs(item.value);
      const percent = (val / maxVal) * 100;
      
      if (item.type === "total") {
        return {
          ...item,
          transparentBase: 0,
          displayValue: val,
          percent
        };
      }
      
      const next = item.type === "negative" ? current - val : current + val;
      const base = item.type === "negative" ? next : current;
      current = next;
      
      return {
        ...item,
        transparentBase: base,
        displayValue: val,
        percent,
        isNegative: item.type === "negative"
      };
    });
  }, [data]);

  return (
    <div className="flex flex-col gap-6">
      <FadeUp className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-brand-muted text-[0.75rem] tracking-[0.28em] uppercase font-medium mb-2">Análise / Performance</p>
          <h1 className="text-3xl md:text-4xl font-semibold leading-tight tracking-tight">Dashboard de CMV</h1>
          <p className="text-brand-soft text-base mt-2 leading-relaxed max-w-2xl">
            Analise sua performance e margens em tempo real por unidade e período.
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleExport} 
          disabled={!data || loading}
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
            <Select value={selectedStore} onValueChange={setSelectedStore}>
              <SelectTrigger className="w-full bg-brand-surface border-brand-line/35 h-11 text-base">
                <SelectValue placeholder="Todas as Lojas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Lojas</SelectItem>
                {filters.lojas.map((loja) => (
                  <SelectItem key={loja} value={loja}>{loja}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-brand-soft tracking-tight block">Mês de Referência</label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full bg-brand-surface border-brand-line/35 h-11 text-base">
                <SelectValue placeholder="Todos os Meses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Meses</SelectItem>
                {filters.meses.map((mes) => (
                  <SelectItem key={mes} value={mes}>{mes}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </FadeUp>

      {loading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 w-full rounded-sm" />)}
        </div>
      ) : data ? (
        <>
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card className="bg-brand-surface-2 border-brand-line/20 shadow-none">
              <CardHeader className="pb-2">
                <CardDescription className="text-sm uppercase tracking-wider font-medium text-brand-muted">Faturamento Analisado</CardDescription>
                <CardTitle className="text-4xl font-semibold text-brand-highlight tracking-tight">{formatBRL(data.kpis.faturamento)}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-brand-muted text-sm font-medium">Receita bruta no período</p>
              </CardContent>
            </Card>

            <Card className="bg-brand-surface-2 border-brand-line/20 shadow-none">
              <CardHeader className="pb-2">
                <CardDescription className="text-sm uppercase tracking-wider font-medium text-brand-muted">CMV Ideal (%)</CardDescription>
                <CardTitle className="text-4xl font-semibold text-brand-highlight tracking-tight">{formatPercent(data.kpis.cmv_percent)}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-brand-muted text-sm font-medium">Custo de mercadoria vendida</p>
              </CardContent>
            </Card>

            <Card className="bg-brand-surface-2 border-brand-line/20 shadow-none">
              <CardHeader className="pb-2">
                <CardDescription className="text-sm uppercase tracking-wider font-medium text-brand-muted">Lucro Líquido</CardDescription>
                <CardTitle className="text-4xl font-semibold text-brand-highlight tracking-tight">
                  {formatBRL(data.kpis.lucro_liquido)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-brand-muted text-sm font-medium">Faturamento - Custo - Impostos</p>
              </CardContent>
            </Card>

            <Card className="bg-brand-surface-2 border-brand-line/20 shadow-none relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-highlight/5 blur-3xl -mr-16 -mt-16 rounded-full" />
              <CardHeader className="pb-2 relative z-10">
                <CardDescription className="text-sm uppercase tracking-wider font-medium text-brand-muted">Lojas em Alerta</CardDescription>
                <CardTitle className="text-4xl font-semibold text-brand-highlight tracking-tight">
                  {data.kpis.lojas_alerta}
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="text-brand-muted text-sm font-medium">CMV acima do limite (35%)</p>
              </CardContent>
            </Card>
          </div>

          <div className="w-full">
            <Card className="bg-brand-surface-2 border-brand-line/20 shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-bold">Evolução Histórica</CardTitle>
                  <CardDescription className="text-base">Faturamento vs Custo</CardDescription>
                </div>
                <TrendingUp className="size-6 text-brand-muted" />
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[320px] w-full">
                  <AreaChart data={trendData} margin={{ top: 40, right: 30, left: 10, bottom: 20 }}>
                    <defs>
                      <linearGradient id="fillFaturamento" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--brand-highlight))" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="hsl(var(--brand-highlight))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsla(var(--brand-line), 0.2)" />
                    <XAxis 
                      dataKey="mesLabel" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 13, fill: "hsl(var(--brand-muted))", fontWeight: 600 }}
                      tickMargin={16}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 13, fill: "hsl(var(--brand-muted))", fontWeight: 600 }}
                      tickMargin={16}
                      width={80}
                      tickFormatter={(v) => `R$ ${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 0 })}k`}
                    />
                    <ChartTooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const entryData = payload[0].payload;
                          return (
                            <div className="bg-brand-surface border border-brand-line/40 shadow-xl rounded-sm p-3 text-sm min-w-[150px]">
                              <div className="font-semibold text-brand-soft mb-2">{entryData.mesLabel}</div>
                              <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-brand-muted">Faturamento</span>
                                  <span className="font-bold text-brand-highlight">
                                    {formatBRL(entryData.faturamento)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-brand-muted">Custo</span>
                                  <span className="font-bold text-brand-muted">
                                    {formatBRL(entryData.custo)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )
                        }
                        return null;
                      }} 
                    />
                    <Legend align="left" verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '13px', fontWeight: 500, color: 'hsl(var(--brand-soft))', paddingBottom: '20px' }} />
                    <Area 
                      name="Faturamento"
                      type="monotone" 
                      dataKey="faturamento" 
                      stroke="hsl(var(--brand-highlight))" 
                      strokeWidth={4} 
                      fill="url(#fillFaturamento)"
                    >
                      <LabelList 
                        dataKey="faturamento" 
                        content={(props: { x?: number | string, y?: number | string, value?: number | string }) => {
                          const x = Number(props.x || 0);
                          const y = Number(props.y || 0);
                          const value = Number(props.value || 0);
                          const formattedValue = `R$ ${(value / 1000).toFixed(0)}k`;
                          
                          return (
                            <g transform={`translate(${x}, ${y - 15})`}>
                              <text x={0} y={0} dy={0} textAnchor="middle" className="fill-brand-highlight text-[10px] font-bold">
                                {formattedValue}
                              </text>
                            </g>
                          );
                        }}
                      />
                    </Area>
                    <Area 
                      name="Custo"
                      type="monotone" 
                      dataKey="custo" 
                      stroke="hsl(var(--brand-muted))" 
                      strokeWidth={2} 
                      fill="transparent"
                      strokeDasharray="5 5"
                    >
                      <LabelList 
                        dataKey="custo" 
                        content={(props: { x?: number | string, y?: number | string, value?: number | string, index?: number }) => {
                          const x = Number(props.x || 0);
                          const y = Number(props.y || 0);
                          const value = Number(props.value || 0);
                          const index = props.index || 0;
                          const item = trendData[index];
                          if (!item) return null;

                          const formattedValue = `R$ ${(value / 1000).toFixed(0)}k`;
                          const pct = item.faturamento ? `(${((value / item.faturamento) * 100).toFixed(1)}%)` : '';
                          
                          return (
                            <g transform={`translate(${x}, ${y + 15})`}>
                              <text x={0} y={0} dy={0} textAnchor="middle" className="fill-brand-muted text-[10px] font-bold">
                                {formattedValue}
                              </text>
                              <text x={0} y={0} dy={12} textAnchor="middle" className="fill-brand-muted text-[9px]">
                                {pct}
                              </text>
                            </g>
                          );
                        }}
                      />
                    </Area>
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid xl:grid-cols-2 gap-6">
            <Card className="bg-brand-surface-2 border-brand-line/20 shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-6">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-bold">Gráfico Cascata</CardTitle>
                  <CardDescription className="text-base">Composição de Resultado</CardDescription>
                </div>
                <Activity className="size-6 text-brand-muted" />
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[320px] w-full">
                  <BarChart data={waterfallData} margin={{ top: 30, right: 10, left: 10, bottom: 20 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsla(var(--brand-line), 0.2)" />
                    <XAxis 
                      dataKey="label" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: "hsl(var(--brand-soft))", fontWeight: 500 }}
                      tickMargin={12}
                    />
                    <YAxis hide />
                    <ChartTooltip 
                      cursor={{ fill: 'transparent' }} 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const entryData = payload[payload.length - 1].payload;
                          return (
                            <div className="bg-brand-surface border border-brand-line/40 shadow-xl rounded-sm p-3 text-sm">
                              <div className="font-semibold text-brand-soft mb-2">{entryData.label}</div>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-brand-muted">Valor</span>
                                <span className="font-bold text-brand-highlight">
                                  {formatBRL(entryData.displayValue)} 
                                  {entryData.percent !== undefined && ` (${entryData.percent.toFixed(1)}%)`}
                                </span>
                              </div>
                            </div>
                          )
                        }
                        return null;
                      }} 
                    />
                    <Bar dataKey="transparentBase" stackId="a" fill="transparent" />
                    <Bar dataKey="displayValue" stackId="a" radius={[4, 4, 0, 0]}>
                      {waterfallData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={
                            entry.type === "positive" 
                              ? "hsl(var(--brand-highlight))" 
                              : entry.type === "negative"
                              ? "hsl(var(--brand-muted))"
                              : "hsl(var(--brand-soft))"
                          } 
                        />
                      ))}
                      <LabelList 
                        dataKey="displayValue"
                        content={(props: { x?: number | string, y?: number | string, width?: number | string, value?: number | string, index?: number }) => {
                          const x = Number(props.x || 0);
                          const y = Number(props.y || 0);
                          const width = Number(props.width || 0);
                          const value = Number(props.value || 0);
                          const index = props.index || 0;
                          const item = waterfallData[index];
                          if (!item) return null;
                          
                          const formattedValue = `R$ ${(value / 1000).toFixed(1)}k`;
                          const pct = item.percent !== undefined ? `(${item.percent.toFixed(1)}%)` : '';
                          
                          return (
                            <g transform={`translate(${x + width / 2}, ${y - 5})`}>
                              <text x={0} y={0} dy={-12} textAnchor="middle" className="fill-brand-muted text-[10px] font-bold">
                                {formattedValue}
                              </text>
                              <text x={0} y={0} dy={0} textAnchor="middle" className="fill-brand-muted text-[9px]">
                                {pct}
                              </text>
                            </g>
                          );
                        }}
                      />
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="bg-brand-surface-2 border-brand-line/20 shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-6">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-bold">Ranking de CMV%</CardTitle>
                  <CardDescription className="text-base">Lojas por CMV Ideal (%)</CardDescription>
                </div>
                <PieChart className="size-6 text-brand-muted" />
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[320px] w-full">
                  <BarChart data={cmvRankingData} layout="vertical" margin={{ left: 10, right: 60, top: 0, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="loja_id" 
                      type="category" 
                      width={100}
                      tick={{ fontSize: 11, fill: "hsl(var(--brand-soft))", fontWeight: 500 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <ChartTooltip 
                      cursor={{ fill: 'transparent' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const entryData = payload[0].payload;
                          return (
                            <div className="bg-brand-surface border border-brand-line/40 shadow-xl rounded-sm p-3 text-sm min-w-[150px]">
                              <div className="font-semibold text-brand-soft mb-2">{entryData.loja_id}</div>
                              <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-brand-muted">CMV Ideal</span>
                                  <span className="font-bold text-brand-highlight">
                                    {formatPercent(entryData.cmv_percent)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-brand-muted">Custo Total</span>
                                  <span className="font-bold text-brand-muted">
                                    {formatBRL(entryData.custo_total)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )
                        }
                        return null;
                      }} 
                    />
                    <Bar dataKey="cmv_percent" radius={[0, 8, 8, 0]} barSize={24}>
                      {cmvRankingData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.cmv_percent > 35 ? "#ef4444" : "hsl(var(--brand-highlight))"} 
                        />
                      ))}
                      <LabelList 
                        dataKey="cmv_percent" 
                        content={(props: { x?: number | string, y?: number | string, width?: number | string, height?: number | string, value?: number | string, index?: number }) => {
                          const x = Number(props.x || 0);
                          const y = Number(props.y || 0);
                          const width = Number(props.width || 0);
                          const height = Number(props.height || 0);
                          const value = Number(props.value || 0);
                          const index = props.index || 0;
                          const item = cmvRankingData[index];
                          if (!item) return null;
                          
                          const formattedValue = `${value.toFixed(1)}%`;
                          const custoFormat = `R$ ${(item.custo_total / 1000).toFixed(1)}k`;
                          
                          return (
                            <g transform={`translate(${x + width + 8}, ${y + height / 2 - 5})`}>
                              <text x={0} y={0} dy={0} textAnchor="start" className="fill-brand-muted text-[10px] font-bold">
                                {formattedValue}
                              </text>
                              <text x={0} y={0} dy={12} textAnchor="start" className="fill-brand-muted text-[9px]">
                                {custoFormat}
                              </text>
                            </g>
                          );
                        }}
                      />
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <FadeUp delay={0.1} className="bg-brand-surface border border-brand-line/15 rounded-[2px] p-10 text-center">
          <Activity className="size-10 text-brand-muted mx-auto mb-4 opacity-30" />
          <p className="text-brand-soft text-lg font-bold mb-2">Dados não disponíveis.</p>
          <p className="text-brand-muted text-sm max-w-md mx-auto">
            Aguardando carregamento dos dados financeiros ou seleção de filtros.
          </p>
        </FadeUp>
      )}
    </div>
  )
}

export default Dashboard
