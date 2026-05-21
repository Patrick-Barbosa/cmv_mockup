import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { XAxis, YAxis, CartesianGrid, Area, AreaChart } from "recharts"
import { formatBRL } from "@/lib/format"
import type { EvolutionResponse } from "@/lib/api"

interface SimulationEvolutionChartProps {
  evolutionData: EvolutionResponse | null
  loadingEvolution: boolean
  impactedOnly: boolean
  setImpactedOnly: (checked: boolean) => void
}

export function SimulationEvolutionChart({
  evolutionData,
  loadingEvolution,
  impactedOnly,
  setImpactedOnly,
}: SimulationEvolutionChartProps) {
  if (!evolutionData && !loadingEvolution) return null

  return (
    <Card className="bg-brand-surface-2 border-brand-line/20 shadow-none">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold text-brand-soft">Evolução Custo</CardTitle>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-brand-primary" />
              <span className="text-sm text-brand-muted">Atual</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-brand-muted" />
              <span className="text-sm text-brand-muted">Simulado</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2 pt-1">
          <Switch
            id="impacted-only"
            checked={impactedOnly}
            onCheckedChange={setImpactedOnly}
            className="data-[state=checked]:bg-brand-highlight"
          />
          <label
            htmlFor="impacted-only"
            className="text-xs font-medium text-brand-soft cursor-pointer"
          >
            Somente impactadas
          </label>
        </div>
      </CardHeader>
      <CardContent>
        {loadingEvolution ? (
          <Skeleton className="h-[240px] w-full rounded-sm" />
        ) : evolutionData ? (
          <ChartContainer config={{}} className="h-[240px] w-full">
            <AreaChart
              data={evolutionData.daily_data
                .filter((d) => d.store_id === null)
                .map((d) => ({
                  date: d.date.split("-").reverse().join("/"),
                  day: d.date.split("-")[2],
                  current: d.current_cost_total,
                  new: d.new_cost_total,
                }))}
              margin={{ top: 20, right: 30, left: 45, bottom: 20 }}
            >
              <defs>
                <linearGradient id="fillCurrent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--brand-primary))" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="hsl(var(--brand-primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fillNew" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--brand-muted))" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="hsl(var(--brand-muted))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsla(var(--brand-line), 0.2)" />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--brand-muted))" }}
                label={{ value: "Dia do Mês", position: "insideBottom", offset: -10, style: { fontSize: 12, fill: "hsl(var(--brand-muted))" } }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--brand-muted))" }}
                tickFormatter={(v) => {
                  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`
                  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`
                  return `${v.toFixed(0)}`
                }}
                label={{ 
                  value: "Custo (R$)", 
                  angle: -90, 
                  position: "insideLeft", 
                  offset: -15, 
                  style: { textAnchor: 'middle', fill: "hsl(var(--brand-muted))", fontSize: 12 } 
                }}
              />
              <ChartTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-brand-surface border border-brand-line/40 shadow-xl rounded-sm p-3 text-sm">
                        <div className="font-semibold text-brand-soft mb-1">{data.date}</div>
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between gap-4">
                            <span className="text-brand-muted">Custo Atual:</span>
                            <span className="font-medium text-brand-primary">{formatBRL(data.current)}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-brand-muted">Custo Simulado:</span>
                            <span className="font-medium text-brand-muted">{formatBRL(data.new)}</span>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Area
                type="monotone"
                dataKey="current"
                stroke="hsl(var(--brand-primary))"
                strokeWidth={6}
                fill="url(#fillCurrent)"
                dot={false}
                activeDot={{ r: 8 }}
              />
              <Area
                type="monotone"
                dataKey="new"
                stroke="hsl(var(--brand-muted))"
                strokeWidth={6}
                strokeDasharray="5 5"
                fill="url(#fillNew)"
                dot={false}
                activeDot={{ r: 8 }}
              />
            </AreaChart>
          </ChartContainer>
        ) : null}
      </CardContent>
    </Card>
  )
}
