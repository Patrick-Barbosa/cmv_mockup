import { Card, CardTitle } from "@/components/ui/card"
import { ChartTooltip } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, LabelList } from "recharts"
import { ChartLegend } from "@/components/common"
import { formatBRL, formatPercent } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { SimulationResponse } from "@/lib/api"

const getImpactColorClass = (value: number) => {
  if (value > 0.0001) return "text-destructive"
  if (value < -0.0001) return "text-brand-highlight"
  return "text-brand-soft"
}

interface SimulationStoreChartsProps {
  simulationResult: SimulationResponse
}

export function SimulationStoreCharts({ simulationResult }: SimulationStoreChartsProps) {
  if (!simulationResult.store_ranking || simulationResult.store_ranking.length === 0) {
    return null
  }

  const chartData = simulationResult.store_chart_data || []
  const height = chartData.length > 10 ? chartData.length * 40 : "100%"

  return (
    <div className="grid xl:grid-cols-2 gap-6">
      <Card className="bg-brand-surface-2 border-brand-line/20 shadow-none p-6">
        <CardTitle className="mb-2">Impacto no Lucro Bruto (R$)</CardTitle>
        <ChartLegend />
        <div className="h-[400px] w-full overflow-y-auto">
          <ResponsiveContainer width="100%" height={height}>
            <BarChart
              layout="vertical"
              data={chartData.map(s => ({
                name: s.store_id,
                "Impacto R$": s.impacto_r,
                "Impacto %": s.impacto_percent,
              }))}
              margin={{ top: 5, right: 60, left: 60, bottom: 5 }}
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="hsla(var(--brand-line), 0.2)" />
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "hsl(var(--brand-muted))" }}
                width={80}
              />
              <ChartTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-brand-surface border border-brand-line/40 shadow-xl rounded-sm p-2 text-[10px]">
                        <div className="font-bold mb-1">{data.name}</div>
                        <div>Impacto R$: {formatBRL(data["Impacto R$"])}</div>
                        <div>Impacto %: {formatPercent(data["Impacto %"])}</div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar
                dataKey="Impacto R$"
                radius={[0, 8, 8, 0]}
                barSize={32}
              >
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.impacto_r < -0.0001 ? "hsl(var(--destructive))" : entry.impacto_r > 0.0001 ? "hsl(var(--brand-highlight))" : "hsl(var(--brand-muted))"} />
                ))}
                <LabelList
                  dataKey="Impacto %"
                  position="right"
                  formatter={(v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`}
                  className="fill-brand-muted text-[10px] font-bold"
                  offset={12}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="bg-brand-surface-2 border-brand-line/20 shadow-none p-6">
        <CardTitle className="mb-2">Variação do CMV (pp)</CardTitle>
        <ChartLegend />
        <div className="h-[400px] w-full overflow-y-auto">
          <ResponsiveContainer width="100%" height={height}>
            <BarChart
              layout="vertical"
              data={chartData.map(s => ({
                name: s.store_id,
                "CMV Atual": s.cmv_atual,
                "CMV Simulado": s.cmv_simulado,
                "Variação %": s.variacao_pp,
              }))}
              margin={{ top: 5, right: 60, left: 60, bottom: 5 }}
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="hsla(var(--brand-line), 0.2)" />
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "hsl(var(--brand-muted))" }}
                width={80}
              />
              <ChartTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-brand-surface border border-brand-line/40 shadow-xl rounded-sm p-2 text-[10px]">
                        <div className="font-bold mb-1">{data.name}</div>
                        <div>CMV Atual: {formatPercent(data["CMV Atual"])}</div>
                        <div>CMV Simulado: {formatPercent(data["CMV Simulado"])}</div>
                        <div className={cn("font-bold mt-1", getImpactColorClass(data["Variação %"]))}>
                          Variação: {data["Variação %"] >= 0 ? "+" : ""}{data["Variação %"].toFixed(1)}pp
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar dataKey="Variação %" radius={[0, 8, 8, 0]} barSize={32}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.variacao_pp > 0 ? "hsl(var(--destructive))" : entry.variacao_pp < 0 ? "hsl(var(--brand-highlight))" : "hsl(var(--brand-muted))"} />
                ))}
                <LabelList
                  dataKey="Variação %"
                  position="right"
                  formatter={(v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}pp`}
                  className="fill-brand-muted text-[10px] font-bold"
                  offset={12}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}
