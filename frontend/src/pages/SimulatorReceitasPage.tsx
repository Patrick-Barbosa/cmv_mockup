import React, { useEffect, useState, useMemo, useCallback, useRef } from "react"
import { Link } from "react-router-dom"
import { Calculator, Loader2, AlertCircle, ChevronDown, Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatBRL, formatPercent } from "@/lib/format"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { FadeUp } from "@/components/ui/fade-up"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { simulatorApi, vendasApi, IS_MOCK, commonApi, receitasApi } from "@/lib/api"
import { PageHeader, StatsCard, SimulationResultTable } from "@/components/common"
import { SimulationEvolutionChart } from "@/components/simulator/SimulationEvolutionChart"
import { SimulationStoreCharts } from "@/components/simulator/SimulationStoreCharts"
import { RecipeCompositionTable, type ComponenteItem } from "@/components/simulator/RecipeCompositionTable"
import type { SimulationInput, SimulationResponse, StoreInfo, VendasFiltersResponse, EvolutionResponse, ComponenteSimulacao } from "@/lib/api"

interface ProductOption {
  id: number
  text: string
  tipo: "insumo" | "receita"
  precoAtual?: number
}

const mockFilters: VendasFiltersResponse = {
  meses: ["2026-04", "2026-03", "2026-02"],
  lojas: [],
}

const mockStores: StoreInfo[] = [
  { store_id: "RJ-COPA" },
  { store_id: "RJ-BARRA" },
]

const mockInsumos: ProductOption[] = [
  { id: 1, text: "Alface", tipo: "insumo", precoAtual: 15.0 },
  { id: 2, text: "Tomate", tipo: "insumo", precoAtual: 12.5 },
  { id: 3, text: "Queijo mussarela", tipo: "insumo", precoAtual: 45.0 },
  { id: 5, text: "Pão de brioche", tipo: "insumo", precoAtual: 2.5 },
]

const mockReceitas: ProductOption[] = [
  { id: 6, text: "Hambúrguer de Wagyu", tipo: "receita", precoAtual: 28.5 },
]

export default function SimulatorReceitasPage() {
  const [loading, setLoading] = useState(false)
  const [simulationResult, setSimulationResult] = useState<SimulationResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [evolutionData, setEvolutionData] = useState<EvolutionResponse | null>(null)
  const [loadingEvolution, setLoadingEvolution] = useState(false)
  const [impactedOnly, setImpactedOnly] = useState(false)
  const [lastInput, setLastInput] = useState<SimulationInput | null>(null)

  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  const [currentPrice, setCurrentPrice] = useState<number>(0)
  const [simulatedPrice, setSimulatedPrice] = useState<number | null>(null)
  const [simulatedPriceDisplay, setSimulatedPriceDisplay] = useState<string>("")
  const [selectedMonth, setSelectedMonth] = useState<string>("")
  const [selectedStores, setSelectedStores] = useState<string[]>([])

  const [availableStores, setAvailableStores] = useState<StoreInfo[]>([])
  const [filters, setFilters] = useState<VendasFiltersResponse>(IS_MOCK ? mockFilters : { lojas: [], meses: [] })
  const [loadingFilters, setLoadingFilters] = useState(!IS_MOCK)

  const [insumos, setInsumos] = useState<ProductOption[]>([])
  const [receitas, setReceitas] = useState<ProductOption[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)

  const [composicao, setComposicao] = useState<ComponenteItem[]>([])
  const [loadingComposicao, setLoadingComposicao] = useState(false)
  const [selectedProductName, setSelectedProductName] = useState<string>("")
  const [receitaOpen, setReceitaOpen] = useState(false)

  const [storeFilterOpen, setStoreFilterOpen] = useState(false)
  const [storeSearch, setStoreSearch] = useState("")
  const storeFilterRef = useRef<HTMLDivElement>(null)

  const loadInsumos = useCallback(async () => {
    if (IS_MOCK) {
      setInsumos(mockInsumos)
      return
    }
    try {
      const data = await commonApi.searchProdutos("")
      const mapped = (data as { id: number; text: string; tipo: string }[]).map((p) => ({
        id: p.id,
        text: p.text,
        tipo: p.tipo.toLowerCase().includes("insumo") ? ("insumo" as const) : ("receita" as const),
      }))
      setInsumos(mapped.filter((p) => p.tipo === "insumo"))
    } catch {
      setInsumos(mockInsumos)
    }
  }, [])

  const loadReceitas = useCallback(async () => {
    if (IS_MOCK) {
      setReceitas(mockReceitas)
      return
    }
    try {
      const data = await commonApi.searchProdutos("")
      const mapped = (data as { id: number; text: string; tipo: string }[]).map((p) => ({
        id: p.id,
        text: p.text,
        tipo: p.tipo.toLowerCase().includes("receita") ? ("receita" as const) : ("insumo" as const),
      }))
      setReceitas(mapped.filter((p) => p.tipo === "receita"))
    } catch {
      setReceitas(mockReceitas)
    }
  }, [])

  const mapComponentTree = useCallback((children: any[]): ComponenteItem[] => {
    return (children || []).map((c: any) => ({
      id: Math.random().toString(36).slice(2, 9),
      tipo: c.tipo as "insumo" | "receita",
      componenteId: Number(c.id),
      quantidade: c.quantidade || 0,
      quantidadeDisplay: (c.quantidade || 0).toString().replace(".", ","),
      custoUnitario: c.custo || 0,
      unidadeMedida: c.unidade || "",
      subComponentes: c.children && c.children.length > 0 ? mapComponentTree(c.children) : undefined,
      expanded: false,
    }))
  }, [])

  const loadComposicao = useCallback(async (id: number) => {
    setLoadingComposicao(true)
    try {
      const detalhes = await receitasApi.getTree(id)
      setComposicao(mapComponentTree(detalhes.children || []))
    } catch (err: unknown) {
      console.error("Erro ao carregar composição:", err)
    } finally {
      setLoadingComposicao(false)
    }
  }, [mapComponentTree])

  useEffect(() => {
    simulatorApi.getStores()
      .then((stores) => {
        setAvailableStores(stores)
        setSelectedStores(stores.map(s => s.store_id))
      })
      .catch(() => {
        const fallback = IS_MOCK ? mockStores : []
        setAvailableStores(fallback)
        setSelectedStores(fallback.map(s => s.store_id))
      })
  }, [])

  useEffect(() => {
    setLoadingFilters(true)
    vendasApi.getFilters()
      .then((res) => {
        setFilters(res)
        if (res.meses && res.meses.length > 0) {
          const sorted = [...res.meses].sort()
          setSelectedMonth(sorted[sorted.length - 1])
        }
      })
      .catch(() => {
        const fallback = IS_MOCK ? mockFilters : { lojas: [], meses: [] }
        setFilters(fallback)
        if (fallback.meses && fallback.meses.length > 0) {
          const sorted = [...fallback.meses].sort()
          setSelectedMonth(sorted[sorted.length - 1])
        }
      })
      .finally(() => setLoadingFilters(false))
  }, [])

  useEffect(() => {
    setLoadingProducts(true)
    Promise.all([loadInsumos(), loadReceitas()]).finally(() => setLoadingProducts(false))
  }, [loadInsumos, loadReceitas])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (storeFilterRef.current && !storeFilterRef.current.contains(event.target as Node)) {
        setStoreFilterOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleProductChange = async (productId: string) => {
    const id = Number(productId)
    setSelectedProductId(id)
    setSimulatedPrice(null)
    setSimulatedPriceDisplay("")

    const product = receitas.find((p) => p.id === id)

    if (product) {
      setSelectedProductName(product.text)
    }

    try {
      const info = await simulatorApi.getProductInfo(id)
      setCurrentPrice(info.preco_venda || 0)
    } catch (err: unknown) {
      console.error("Erro ao buscar informações do produto:", err)
      setCurrentPrice(0)
    }

    loadComposicao(id)
  }

  const filteredStores = useMemo(() => {
    if (!storeSearch) return availableStores
    const q = storeSearch.toLowerCase()
    return availableStores.filter((s) => s.store_id.toLowerCase().includes(q))
  }, [availableStores, storeSearch])

  const toggleStore = (storeId: string) => {
    if (selectedStores.includes(storeId)) {
      setSelectedStores(selectedStores.filter((s) => s !== storeId))
    } else {
      setSelectedStores([...selectedStores, storeId])
    }
  }

  const selectAllStores = () => {
    setSelectedStores(availableStores.map((s) => s.store_id))
  }

  const deselectAllStores = () => {
    setSelectedStores([])
  }

  const getStoreFilterText = () => {
    if (selectedStores.length === 0) return "Nenhuma loja selecionada"
    if (selectedStores.length === availableStores.length) return "Todas as lojas"
    return `${selectedStores.length} loja${selectedStores.length > 1 ? "s" : ""} selecionada${selectedStores.length > 1 ? "s" : ""}`
  }

  const isFormValid = useMemo(() => {
    if (!selectedProductId) return false

    const hasPriceChange = simulatedPrice !== null && simulatedPrice !== currentPrice
    if (hasPriceChange) return true

    const hasComponents = composicao.some(c => c.componenteId && c.componenteId > 0)
    if (hasComponents) return true

    return false
  }, [selectedProductId, simulatedPrice, currentPrice, composicao])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProductId || !isFormValid) return

    setLoading(true)
    setError(null)
    setSimulationResult(null)
    setEvolutionData(null)

    const changeValue = simulatedPrice !== null ? simulatedPrice : currentPrice

    const input: SimulationInput = {
      type: "recipe_change",
      change_type: "absoluto",
      change_value: changeValue,
      store_ids: selectedStores.length > 0 ? selectedStores : undefined,
      recipe_id: selectedProductId,
    }

    if (composicao.length > 0) {
      const mapToPayload = (compList: ComponenteItem[]): ComponenteSimulacao[] => {
        return compList
          .filter((c) => c.componenteId && c.componenteId > 0)
          .map((c) => ({
            id_componente: c.componenteId!,
            quantidade: c.quantidade,
            tipo: c.tipo,
            sub_componentes: c.subComponentes && c.subComponentes.length > 0 ? mapToPayload(c.subComponentes) : undefined,
          }))
      }
      input.novos_componentes = mapToPayload(composicao)
    }

    try {
      const response = await simulatorApi.simulate(input)
      setSimulationResult(response)
      setLastInput(input)

      if (selectedMonth) {
        setLoadingEvolution(true)
        try {
          const evolution = await simulatorApi.getEvolution({
            ...input,
            month: selectedMonth,
            impacted_only: impactedOnly,
          })
          setEvolutionData(evolution)
        } catch (err: unknown) {
          console.error("Erro ao buscar evolução:", err)
        } finally {
          setLoadingEvolution(false)
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao realizar simulação")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (lastInput && selectedMonth) {
      setLoadingEvolution(true)
      simulatorApi.getEvolution({
        ...lastInput,
        month: selectedMonth,
        impacted_only: impactedOnly,
      })
        .then(setEvolutionData)
        .catch((err: unknown) => console.error("Erro ao buscar evolução refetch:", err))
        .finally(() => setLoadingEvolution(false))
    }
  }, [impactedOnly, lastInput, selectedMonth])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb="Análise / Simulação / Receitas"
        title="Impacto Receita"
        description="Análise de impacto de variação de receita e composição"
        actions={
          <div className="inline-flex rounded-sm border border-brand-line/30 overflow-hidden">
            <Link
              to="/simulator/insumos"
              className="px-4 py-2 text-sm font-medium text-brand-muted hover:text-brand-soft hover:bg-brand-line/10 transition-colors"
            >
              Insumos
            </Link>
            <div className="w-px bg-brand-line/30" />
            <Link
              to="/simulator/receitas"
              className="px-4 py-2 text-sm font-medium bg-brand-highlight/10 text-brand-highlight"
            >
              Receitas
            </Link>
          </div>
        }
      />

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-sm px-4 py-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
          <p className="text-destructive text-sm font-medium">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-destructive hover:text-destructive/80 text-sm">×</button>
        </div>
      )}

      <FadeUp delay={0.05} className="bg-brand-surface-2 border border-brand-line/20 rounded-sm p-6">
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-brand-soft tracking-tight block">Receita</label>
              <Popover open={receitaOpen} onOpenChange={setReceitaOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={receitaOpen}
                    disabled={loadingProducts}
                    className="w-full justify-between bg-brand-surface border-brand-line/35 h-11 text-base font-normal text-left"
                  >
                    {loadingProducts
                      ? "Carregando..."
                      : selectedProductId
                      ? receitas.find((p) => p.id === selectedProductId)?.text || "Selecione..."
                      : "Selecione..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 border-brand-line/20 bg-brand-surface-2" align="start">
                  <Command className="bg-transparent">
                    <CommandInput placeholder="Buscar receita..." />
                    <CommandList>
                      <CommandEmpty>Nenhuma receita encontrada.</CommandEmpty>
                      <CommandGroup>
                        {receitas.map((p) => (
                          <CommandItem
                            key={p.id}
                            value={p.text}
                            onSelect={() => {
                              handleProductChange(p.id.toString())
                              setReceitaOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedProductId === p.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {p.text}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-brand-soft tracking-tight block">Preço Atual</label>
              <Input
                type="text"
                value={currentPrice > 0 ? `R$ ${currentPrice.toFixed(2)}` : ""}
                disabled
                className="bg-brand-surface-2 border-brand-line/35 h-11 text-base disabled:opacity-100"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-brand-soft tracking-tight block">Preço Simulado</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted text-base pointer-events-none">R$</span>
                <Input
                  type="text"
                  placeholder={currentPrice > 0 ? "Ex: 32,00" : "Selecione um item com preço"}
                  value={simulatedPriceDisplay}
                  disabled={!currentPrice || currentPrice === 0}
                  onChange={(e) => {
                    const val = e.target.value.replace('.', ',');
                    if (val === "" || /^[0-9]*[,]?[0-9]*$/.test(val)) {
                      setSimulatedPriceDisplay(val);
                      const numericVal = parseFloat(val.replace(',', '.'));
                      setSimulatedPrice(isNaN(numericVal) ? null : numericVal);
                    }
                  }}
                  className="bg-brand-surface border-brand-line/35 h-11 text-base pl-10 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-brand-soft tracking-tight block">Mês Simulação</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-full bg-brand-surface border-brand-line/35 h-11 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {loadingFilters ? (
                    <div className="p-2 flex items-center gap-2 text-sm text-brand-muted">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Carregando...
                    </div>
                  ) : (
                    filters.meses.map((mes) => (
                      <SelectItem key={mes} value={mes}>
                        {mes}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-brand-soft tracking-tight block">Lojas Selecionadas</label>
              <div className="relative" ref={storeFilterRef}>
                <button
                  type="button"
                  onClick={() => setStoreFilterOpen(!storeFilterOpen)}
                  className="w-full flex items-center justify-between bg-brand-surface border border-brand-line/35 h-11 px-3 rounded-sm text-sm"
                >
                  <span>{getStoreFilterText()}</span>
                  <ChevronDown className={`size-4 text-brand-muted transition-transform ${storeFilterOpen ? "rotate-180" : ""}`} />
                </button>

                {storeFilterOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-brand-surface border border-brand-line/40 rounded-sm shadow-xl z-50">
                    <div className="p-2 border-b border-brand-line/20">
                      <Input
                        value={storeSearch}
                        onChange={(e) => setStoreSearch(e.target.value)}
                        placeholder="Buscar loja..."
                        className="h-9"
                      />
                    </div>
                    <div className="flex gap-3 p-2 border-b border-brand-line/10 bg-brand-surface-2 text-xs">
                      <button type="button" onClick={selectAllStores} className="text-brand-highlight hover:underline">
                        Selecionar todas
                      </button>
                      <button type="button" onClick={deselectAllStores} className="text-brand-muted hover:underline">
                        Desmarcar todas
                      </button>
                    </div>
                    <div className="max-h-40 overflow-y-auto p-1">
                      {filteredStores.length === 0 ? (
                        <div className="p-2 text-sm text-brand-muted">Nenhuma loja encontrada</div>
                      ) : (
                        filteredStores.map((store) => (
                          <label
                            key={store.store_id}
                            className="flex items-center gap-2 px-2 py-1.5 hover:bg-brand-surface-2 rounded-sm cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedStores.includes(store.store_id)}
                              onChange={() => toggleStore(store.store_id)}
                              className="w-4 h-4 accent-brand-highlight"
                            />
                            <span className="text-sm">{store.store_id}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {selectedProductId && (
            <RecipeCompositionTable
              mode="multi"
              componentes={composicao}
              onChange={setComposicao}
              availableInsumos={insumos}
              availableReceitas={receitas}
              loading={loadingComposicao}
              selectedProductName={selectedProductName}
            />
          )}

          <div className="flex justify-start gap-4 items-center">
            <Button
              onClick={handleSubmit}
              className="bg-brand-primary hover:bg-brand-primary/90 h-11 text-base px-6"
              disabled={loading || !isFormValid}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Calculator className="mr-2 h-4 w-4" />
              Simular Impacto
            </Button>
            {!isFormValid && (
              <span className="text-xs text-brand-muted">
                Selecione uma receita e defina o valor da mudança
              </span>
            )}
          </div>
        </div>
      </FadeUp>

      {loading ? (
        <FadeUp delay={0.1}>
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 w-full rounded-sm" />)}
          </div>
        </FadeUp>
      ) : simulationResult ? (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatsCard
              label="Impacto na Rede"
              description="Variação total no resultado mensal de toda a rede com a mudança"
              value={formatBRL(simulationResult.total_network_impact)}
              variant={simulationResult.total_network_impact < -0.0001 ? "destructive" : simulationResult.total_network_impact > 0.0001 ? "highlight" : "default"}
              subtitle={`${formatPercent(simulationResult.total_network_impact_percent)} sobre a receita atual`}
            />

            <StatsCard
              label="Média por Loja"
              description="Variação média de resultado por unidade de loja"
              value={formatBRL(simulationResult.avg_impact_per_store)}
              variant={simulationResult.avg_impact_per_store < -0.0001 ? "destructive" : simulationResult.avg_impact_per_store > 0.0001 ? "highlight" : "default"}
              subtitle={`${formatPercent(simulationResult.avg_impact_per_store_percent)} sobre o custo da loja`}
            />

            <StatsCard
              label="Impacto Unitário"
              description="Variação de custo e/ou preço de venda por unidade desta receita"
              value={formatBRL(simulationResult.avg_impact_per_recipe)}
              variant={simulationResult.avg_impact_per_recipe < -0.0001 ? "destructive" : simulationResult.avg_impact_per_recipe > 0.0001 ? "highlight" : "default"}
              subtitle={`${formatPercent(simulationResult.avg_impact_per_recipe_percent)} no custo unitário`}
            />

            <StatsCard
              label="CMV Médio da Rede"
              description="CMV% projetado após a mudança na receita"
              value={formatPercent(simulationResult.new_cmv ?? 0)}
              variant={(simulationResult.cmv_diff ?? 0) > 0.0001 ? "destructive" : (simulationResult.cmv_diff ?? 0) < -0.0001 ? "highlight" : "default"}
              subtitle={`Variação de ${(simulationResult.cmv_diff ?? 0) >= 0 ? "+" : ""}${(simulationResult.cmv_diff ?? 0).toFixed(1)} p.p.`}
            />
          </div>

          <SimulationEvolutionChart
            evolutionData={evolutionData}
            loadingEvolution={loadingEvolution}
            impactedOnly={impactedOnly}
            setImpactedOnly={setImpactedOnly}
          />

          <SimulationStoreCharts simulationResult={simulationResult} />

          <SimulationResultTable
            title="Tabela de Resultados por Loja"
            type="receita"
            data={simulationResult.store_table_data || simulationResult.store_ranking.map(s => ({ ...s, revenue_current: 0, revenue_simulated: 0 }))}
          />

          {(simulationResult.recipe_table_data && simulationResult.recipe_table_data.length > 0) && (
            <SimulationResultTable
              title="Receitas Impactadas"
              type="receita"
              data={simulationResult.recipe_table_data}
            />
          )}
        </div>
      ) : (
        <FadeUp delay={0.1} className="bg-brand-surface border border-brand-line/15 rounded-sm p-10 text-center">
          <Calculator className="size-12 text-brand-muted mx-auto mb-4 opacity-30" />
          <p className="text-brand-soft text-lg font-bold mb-2">Pronto para simular</p>
          <p className="text-brand-muted text-sm max-w-md mx-auto">
            Configure os parâmetros e clique em "Simular Impacto" para ver os resultados.
          </p>
        </FadeUp>
      )}
    </div>
  )
}
