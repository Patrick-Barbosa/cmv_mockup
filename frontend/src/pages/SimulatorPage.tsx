import React, { useEffect, useState, useMemo, useCallback, useRef } from "react"
import { Calculator, Loader2, AlertCircle, ChevronDown, ChevronRight, X, Plus, Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatBRL, formatPercent, formatNumber, formatQuantity } from "@/lib/format"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { FadeUp } from "@/components/ui/fade-up"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { XAxis, YAxis, CartesianGrid, LineChart, Line, BarChart, Bar, ResponsiveContainer, Cell } from "recharts"
import { simulatorApi, vendasApi, IS_MOCK, commonApi, receitasApi } from "@/lib/api"
import { ChartLegend } from "@/components/common"
import type { SimulationInput, SimulationResponse, StoreInfo, VendasFiltersResponse, EvolutionResponse, ReceitaTreeDetalhe, ComponenteSimulacao } from "@/lib/api"

const getImpactColorClass = (value: number) => {
  if (value > 0.0001) return "text-destructive"
  if (value < -0.0001) return "text-brand-highlight"
  return "text-brand-soft"
}

const mockStores: StoreInfo[] = [
  { store_id: "RJ-COPA" },
  { store_id: "RJ-BARRA" },
  { store_id: "SP-PAULISTA" },
  { store_id: "SP-IRAJA" },
  { store_id: "BH-SAVASSI" },
  { store_id: "RS-POA" },
  { store_id: "MG-SAVASSI" },
  { store_id: "DF-ASA_SUL" },
]

const mockFilters: VendasFiltersResponse = {
  lojas: [],
  meses: ["2026-04", "2026-03", "2026-02"],
}

interface ProductOption {
  id: number
  text: string
  tipo: "insumo" | "receita"
  precoAtual?: number
}

interface Componente {
  id: string
  tipo: "insumo" | "receita"
  componenteId?: number
  quantidade: number
  quantidadeDisplay?: string // Para aceitar vírgula na digitação
  custoUnitario?: number
  unidadeMedida?: string
  subComponentes?: Componente[]
  expanded?: boolean
}

const mockInsumos: ProductOption[] = [
  { id: 1, text: "Alface", tipo: "insumo", precoAtual: 15.0 },
  { id: 2, text: "Tomate", tipo: "insumo", precoAtual: 12.5 },
  { id: 3, text: "Queijo mussarela", tipo: "insumo", precoAtual: 45.0 },
  { id: 5, text: "Pão de brioche", tipo: "insumo", precoAtual: 2.5 },
]

const mockReceitas: ProductOption[] = [
  { id: 6, text: "Hambúrguer de Wagyu", tipo: "receita", precoAtual: 28.5 },
]

const mapTreeToComponentes = (node: ReceitaTreeDetalhe): Componente[] => {
  if (!node.children) return []
  return node.children.map(c => ({
    id: Math.random().toString(36).slice(2, 9),
    tipo: c.tipo,
    componenteId: Number(c.id),
    quantidade: c.quantidade || 0,
    quantidadeDisplay: (c.quantidade || 0).toString().replace('.', ','),
    custoUnitario: c.custo || 0,
    unidadeMedida: c.unidade || '',
    subComponentes: c.children && c.children.length > 0 ? mapTreeToComponentes(c) : undefined,
    expanded: false,
  }))
}

export default function SimulatorPage() {
  const [loading, setLoading] = useState(false)
  const [simulationResult, setSimulationResult] = useState<SimulationResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [evolutionData, setEvolutionData] = useState<EvolutionResponse | null>(null)
  const [loadingEvolution, setLoadingEvolution] = useState(false)
  const [impactedOnly, setImpactedOnly] = useState(false)
  const [lastInput, setLastInput] = useState<SimulationInput | null>(null)

  const [simulationType, setSimulationType] = useState<"insumo" | "receita">("insumo")
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  const [currentPrice, setCurrentPrice] = useState<number>(0)
  const [currentUnit, setCurrentUnit] = useState<string | null>(null)
  const [simulatedPrice, setSimulatedPrice] = useState<number | null>(null)
  const [simulatedPriceDisplay, setSimulatedPriceDisplay] = useState<string>("")
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-04")
  const [selectedStores, setSelectedStores] = useState<string[]>(["RJ-COPA", "RJ-BARRA"])

  const [availableStores, setAvailableStores] = useState<StoreInfo[]>([])
  const [filters, setFilters] = useState<VendasFiltersResponse>(IS_MOCK ? mockFilters : { lojas: [], meses: [] })
  const [loadingFilters, setLoadingFilters] = useState(!IS_MOCK)

  const [insumos, setInsumos] = useState<ProductOption[]>([])
  const [receitas, setReceitas] = useState<ProductOption[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)

  const [composicao, setComposicao] = useState<Componente[]>([])
  const [componentesOriginais, setComponentesOriginais] = useState<Componente[]>([])
  const [loadingComposicao, setLoadingComposicao] = useState(false)
  const [selectedProductName, setSelectedProductName] = useState<string>("")
  const [insumoOpen, setInsumoOpen] = useState(false)
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

  const loadComposicao = useCallback(async (id: number) => {
    setLoadingComposicao(true)
    try {
      const detalhes = await receitasApi.getTree(id)
      const mapped = mapTreeToComponentes(detalhes)
      setComposicao(mapped)
      setComponentesOriginais(JSON.parse(JSON.stringify(mapped)))
    } catch (err) {
      console.error("Erro ao carregar composição:", err)
    } finally {
      setLoadingComposicao(false)
    }
  }, [])

  useEffect(() => {
    simulatorApi.getStores().then(setAvailableStores).catch(() => setAvailableStores(IS_MOCK ? mockStores : []))
  }, [])

  useEffect(() => {
    setLoadingFilters(true)
    vendasApi.getFilters().then(setFilters).catch(() => setFilters(IS_MOCK ? mockFilters : { lojas: [], meses: [] })).finally(() => setLoadingFilters(false))
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

  const handleTypeChange = (type: "insumo" | "receita") => {
    setSimulationType(type)
    setSelectedProductId(null)
    setCurrentPrice(0)
    setCurrentUnit(null)
    setSimulatedPrice(null)
    setSimulatedPriceDisplay("")
    setComposicao([])
    setComponentesOriginais([])
    setSelectedProductName("")
  }

  const handleProductChange = async (productId: string) => {
    const id = Number(productId)
    setSelectedProductId(id)
    setSimulatedPrice(null)
    setSimulatedPriceDisplay("")
    
    const product = (simulationType === "insumo" ? insumos : receitas).find((p) => p.id === id)
    
    if (product) {
      setSelectedProductName(product.text)
    }

    try {
      const info = await simulatorApi.getProductInfo(id)
      const price = simulationType === "insumo" ? info.custo_atual : info.preco_venda
      setCurrentPrice(price || 0)
      setCurrentUnit(info.unidade_medida || null)
    } catch (err) {
      console.error("Erro ao buscar informações do produto:", err)
      setCurrentPrice(0)
      setCurrentUnit(null)
    }

    if (simulationType === "receita") {
      loadComposicao(id)
    } else {
      setComposicao([])
      setComponentesOriginais([])
    }
  }

  const handleAddComponent = (path: number[] | null, tipo: "insumo" | "receita") => {
    const newComposicao = [...composicao]
    const newItem: Componente = {
      id: Math.random().toString(36).slice(2, 9),
      tipo,
      componenteId: 0,
      quantidade: 0,
      quantidadeDisplay: "0",
      expanded: true,
      subComponentes: tipo === "receita" ? [] : undefined
    }

    if (!path) {
      newComposicao.push(newItem)
    } else {
      const findAndAdd = (list: Componente[], p: number[]) => {
        if (p.length === 1) {
          if (!list[p[0]].subComponentes) list[p[0]].subComponentes = []
          list[p[0]].subComponentes!.push(newItem)
          return
        }
        findAndAdd(list[p[0]].subComponentes!, p.slice(1))
      }
      findAndAdd(newComposicao, path)
    }
    setComposicao([...newComposicao])
  }

  const handleUpdateComponent = useCallback((path: number[], updates: Partial<Componente>) => {
    setComposicao(prev => {
      const updateLevel = (list: Componente[], p: number[]): Componente[] => {
        const [index, ...rest] = p
        return list.map((item, i) => {
          if (i !== index) return item
          if (rest.length === 0) return { ...item, ...updates }
          return { ...item, subComponentes: updateLevel(item.subComponentes || [], rest) }
        })
      }
      return updateLevel(prev, path)
    })
  }, [])

  const handleComponentIdChange = async (path: number[], id: number, tipo: "insumo" | "receita") => {
    try {
      const info = await simulatorApi.getProductInfo(id)
      const updates: Partial<Componente> = {
        componenteId: id,
        unidadeMedida: info.unidade_medida || "",
        custoUnitario: (tipo === "insumo" ? info.custo_atual : info.preco_venda) || 0
      }
      if (tipo === "receita") {
        const detalhes = await receitasApi.getTree(id)
        updates.subComponentes = mapTreeToComponentes(detalhes)
      }
      handleUpdateComponent(path, updates)
    } catch (err) {
      console.error(err)
    }
  }

  const handleRemoveComponent = (path: number[]) => {
    setComposicao(prev => {
      const next = JSON.parse(JSON.stringify(prev))
      const removeDeep = (list: Componente[], p: number[]) => {
        if (p.length === 1) {
          list.splice(p[0], 1)
          return
        }
        removeDeep(list[p[0]].subComponentes!, p.slice(1))
      }
      removeDeep(next, path)
      return next
    })
  }

  const calculateComposicaoCost = useCallback((listToCalculate: Componente[]) => {
    const calculateDeep = (list: Componente[]): number => {
      return list.reduce((sum, c) => {
        const itemCost = c.tipo === "receita" && c.subComponentes && c.subComponentes.length > 0 
          ? calculateDeep(c.subComponentes) 
          : (c.custoUnitario || 0)
        return sum + c.quantidade * itemCost
      }, 0)
    }
    return calculateDeep(listToCalculate)
  }, [])

  const renderComponents = (items: Componente[], pathPrefix: number[] = [], level = 0): React.ReactNode => {
    return items.map((item, i) => {
      const currentPath = [...pathPrefix, i]
      const hasChildren = item.tipo === "receita"
      const unitCost = hasChildren && item.subComponentes?.length ? calculateComposicaoCost(item.subComponentes) : (item.custoUnitario || 0)
      const totalCost = unitCost * item.quantidade
      
      return (
        <React.Fragment key={item.id}>
          <TableRow className={level === 0 ? "border-brand-line/10 bg-transparent" : "border-brand-line/5 bg-brand-surface/30"}>
            <TableCell>
              <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 1.5}rem` }}>
                {hasChildren ? (
                  <button 
                    onClick={() => handleUpdateComponent(currentPath, { expanded: !item.expanded })}
                    className="p-0.5 hover:bg-brand-surface rounded text-brand-muted"
                  >
                    {item.expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </button>
                ) : (
                  <div className="w-4 h-4" />
                )}
                <div className="flex-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between bg-brand-surface border-brand-line/35 h-8 text-xs font-normal text-left px-2"
                      >
                        {item.componenteId
                          ? (item.tipo === "insumo" ? insumos : receitas).find((p) => p.id === item.componenteId)?.text || "Selecione..."
                          : `Selecione ${item.tipo}...`}
                        <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0 border-brand-line/20 bg-brand-surface-2" align="start">
                      <Command className="bg-transparent">
                        <CommandInput placeholder={`Buscar ${item.tipo}...`} className="text-xs" />
                        <CommandList>
                          <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
                          <CommandGroup>
                            {(item.tipo === "insumo" ? insumos : receitas).map((p) => (
                              <CommandItem
                                key={p.id}
                                value={p.text}
                                onSelect={() => {
                                  handleComponentIdChange(currentPath, p.id, item.tipo)
                                  document.body.click()
                                }}
                                className="text-xs"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-3 w-3",
                                    item.componenteId === p.id ? "opacity-100" : "opacity-0"
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
                {/* Badge de tipo - Corrigido contraste Issue 006 */}
                <span className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-[2px] text-[10px] font-bold uppercase tracking-wider",
                  item.tipo === "insumo" 
                    ? "bg-brand-primary text-brand-text" 
                    : "bg-brand-highlight text-brand-bg"
                )}>
                  {item.tipo === "insumo" ? "Insumo" : "Receita"}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Input
                  type="text"
                  value={item.quantidadeDisplay ?? item.quantidade.toString().replace('.', ',')}
                  onChange={(e) => {
                    const val = e.target.value.replace('.', ',');
                    if (val === "" || /^[0-9]*[,]?[0-9]*$/.test(val)) {
                      const numericVal = parseFloat(val.replace(',', '.'));
                      handleUpdateComponent(currentPath, {
                          quantidadeDisplay: val,
                          quantidade: isNaN(numericVal) ? 0 : numericVal
                      });
                    }
                  }}
                  className="h-8 text-xs text-right w-20 bg-brand-surface border-brand-line/35"
                />
                {item.unidadeMedida && (
                  <span className="text-xs text-brand-muted whitespace-nowrap">{item.unidadeMedida}</span>
                )}
              </div>
            </TableCell>
            <TableCell className="text-right text-brand-highlight text-xs font-medium">
              {formatBRL(unitCost)}
              {item.unidadeMedida && (
                <span className="text-brand-muted text-[10px] ml-1">/{item.unidadeMedida}</span>
              )}
            </TableCell>
            {/* Coluna Custo Total - Issue 004 */}
            <TableCell className="text-right text-brand-highlight text-xs font-bold">
              {formatBRL(totalCost)}
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveComponent(currentPath)}
                className="h-7 w-7 text-brand-muted hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
          
          {hasChildren && item.expanded && item.subComponentes && (
             renderComponents(item.subComponentes, currentPath, level + 1)
          )}
        </React.Fragment>
      )
    })
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

    if (simulationType === "receita") {
      const originalMapped = JSON.stringify(componentesOriginais.map(c => ({ id: c.componenteId, q: c.quantidade })))
      const currentMapped = JSON.stringify(composicao.map(c => ({ id: c.componenteId, q: c.quantidade })))
      if (originalMapped !== currentMapped) return true
    }

    return false
  }, [selectedProductId, simulatedPrice, currentPrice, simulationType, componentesOriginais, composicao])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProductId || !isFormValid) return

    setLoading(true)
    setError(null)
    setSimulationResult(null)
    setEvolutionData(null)

    const changeValue = simulatedPrice !== null ? simulatedPrice : currentPrice

    const input: SimulationInput = {
      type: simulationType === "insumo" ? "price_change" : "recipe_change",
      change_type: "absoluto",
      change_value: changeValue,
      store_ids: selectedStores.length > 0 ? selectedStores : undefined,
    }

    if (simulationType === "insumo") {
      input.ingredient_id = selectedProductId
    } else {
      input.recipe_id = selectedProductId
      if (composicao.length > 0) {
        const mapToPayload = (compList: Componente[]): ComponenteSimulacao[] => {
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
        } catch (err) {
          console.error("Erro ao buscar evolução:", err)
        } finally {
          setLoadingEvolution(false)
        }
      }
    } catch (err) {
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
        .catch(err => console.error("Erro ao buscar evolução refetch:", err))
        .finally(() => setLoadingEvolution(false))
    }
  }, [impactedOnly, lastInput, selectedMonth])

  const sortedSimulationResults = useMemo(() => {
    if (!simulationResult?.results) return []
    return [...simulationResult.results].sort((a, b) => b.monthly_revenue_current - a.monthly_revenue_current)
  }, [simulationResult])

  const evolutionChartData = useMemo(() => {
    if (!evolutionData?.daily_data) return []
    const hasAggregated = evolutionData.daily_data.some((d) => d.store_id === null)
    const dataToMap = hasAggregated
      ? evolutionData.daily_data.filter((d) => d.store_id === null)
      : evolutionData.daily_data

    return dataToMap.map((d) => {
      return {
        date: d.date.split("-").reverse().join("/"),
        day: d.date.split("-")[2],
        current: d.current_cost_total,
        new: d.new_cost_total,
      }
    })
  }, [evolutionData])

  const storeRankingData = useMemo(() => {
    if (!simulationResult?.store_ranking) return []
    return simulationResult.store_ranking.map(s => {
      const varPercent = s.current_cmv && s.current_cmv > 0
        ? ((s.new_cmv! / s.current_cmv) - 1) * 100
        : 0;
      return {
        name: s.store_id,
        "CMV Atual": s.current_cmv || 0,
        "CMV Simulado": s.new_cmv || 0,
        "Impacto R$": s.total_impact,
        "Impacto %": s.total_impact_percent,
        "Variação pp": s.cmv_diff || 0,
        "Variação %": varPercent
      };
    })
  }, [simulationResult])

  return (
    <div className="flex flex-col gap-6">
      <FadeUp className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-brand-muted text-[0.75rem] tracking-[0.28em] uppercase font-medium mb-2">Análise / Simulação</p>
          <h1 className="text-3xl md:text-4xl font-semibold leading-tight tracking-tight">Simulador de Custos</h1>
          <p className="text-brand-soft text-base mt-2 leading-relaxed max-w-2xl">
            Análise de impacto de variação de preço de insumos
          </p>
        </div>
      </FadeUp>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-sm px-4 py-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
          <p className="text-destructive text-sm font-medium">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-destructive hover:text-destructive/80 text-sm">×</button>
        </div>
      )}

      <FadeUp delay={0.05} className="bg-brand-surface-2 border border-brand-line/20 rounded-sm p-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-brand-soft tracking-tight block">Tipo de Simulação</label>
            <RadioGroup
              value={simulationType}
              onValueChange={(value) => handleTypeChange(value as "insumo" | "receita")}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="insumo" id="r1" className="border-brand-soft text-brand-primary" />
                <label htmlFor="r1" className="text-sm text-brand-soft font-medium cursor-pointer">
                  Insumo
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="receita" id="r2" className="border-brand-soft text-brand-primary" />
                <label htmlFor="r2" className="text-sm text-brand-soft font-medium cursor-pointer">
                  Receita
                </label>
              </div>
            </RadioGroup>
          </div>

          {simulationType === "insumo" && (
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-brand-soft tracking-tight block">Insumo</label>
                <Popover open={insumoOpen} onOpenChange={setInsumoOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={insumoOpen}
                      disabled={loadingProducts}
                      className="w-full justify-between bg-brand-surface border-brand-line/35 h-11 text-base font-normal text-left"
                    >
                      {loadingProducts
                        ? "Carregando..."
                        : selectedProductId
                        ? insumos.find((p) => p.id === selectedProductId)?.text || "Selecione..."
                        : "Selecione..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 border-brand-line/20 bg-brand-surface-2" align="start">
                    <Command className="bg-transparent">
                      <CommandInput placeholder="Buscar insumo..." />
                      <CommandList>
                        <CommandEmpty>Nenhum insumo encontrado.</CommandEmpty>
                        <CommandGroup>
                          {insumos.map((p) => (
                            <CommandItem
                              key={p.id}
                              value={p.text}
                              onSelect={() => {
                                handleProductChange(p.id.toString())
                                setInsumoOpen(false)
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
                <label className="text-sm font-medium text-brand-soft tracking-tight block">Custo Atual</label>
                <Input
                  type="text"
                  value={currentPrice > 0 ? `R$ ${currentPrice.toFixed(2)}${currentUnit ? ` / ${currentUnit}` : ""}` : ""}
                  disabled
                  className="bg-brand-surface-2 border-brand-line/35 h-11 text-base disabled:opacity-100"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-brand-soft tracking-tight block">Custo Simulado</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted text-base pointer-events-none">R$</span>
                  <Input
                    type="text"
                    placeholder="Ex: 18,00"
                    value={simulatedPriceDisplay}
                    onChange={(e) => {
                      const val = e.target.value.replace('.', ',');
                      if (val === "" || /^[0-9]*[,]?[0-9]*$/.test(val)) {
                        setSimulatedPriceDisplay(val);
                        const numericVal = parseFloat(val.replace(',', '.'));
                        setSimulatedPrice(isNaN(numericVal) ? null : numericVal);
                      }
                    }}
                    className="bg-brand-surface border-brand-line/35 h-11 text-base pl-10"
                  />
                  {currentUnit && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted text-xs pointer-events-none">
                      /{currentUnit}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {simulationType === "receita" && (
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
                    placeholder="Ex: 32,00"
                    value={simulatedPriceDisplay}
                    onChange={(e) => {
                      const val = e.target.value.replace('.', ',');
                      if (val === "" || /^[0-9]*[,]?[0-9]*$/.test(val)) {
                        setSimulatedPriceDisplay(val);
                        const numericVal = parseFloat(val.replace(',', '.'));
                        setSimulatedPrice(isNaN(numericVal) ? null : numericVal);
                      }
                    }}
                    className="bg-brand-surface border-brand-line/35 h-11 text-base pl-10"
                  />
                </div>
              </div>
            </div>
          )}

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

          {simulationType === "receita" && selectedProductId && (
            <div className="bg-brand-surface-2 border border-brand-line/20 rounded-sm p-4">
              <div className="flex flex-row items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-brand-soft">
                  Editar Composição - {selectedProductName}
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddComponent(null, "insumo")}
                    className="h-8 text-xs border-brand-highlight text-brand-highlight hover:bg-brand-highlight/10"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Adicionar insumo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddComponent(null, "receita")}
                    className="h-8 text-xs border-brand-highlight text-brand-highlight hover:bg-brand-highlight/10"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Adicionar receita
                  </Button>
                </div>
              </div>

              {loadingComposicao ? (
                <div className="flex items-center gap-2 text-sm text-brand-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando composição...
                </div>
              ) : composicao.length === 0 ? (
                <p className="text-sm text-brand-muted">Nenhum componente. Adicione insumos or receitas.</p>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-brand-line/20">
                        <TableHead className="text-brand-muted font-medium w-[45%]">Insumo</TableHead>
                        <TableHead className="text-brand-muted font-medium w-[20%]">Quantidade</TableHead>
                        <TableHead className="text-brand-muted font-medium w-[15%] text-right">Custo Unit.</TableHead>
                        <TableHead className="text-brand-muted font-medium w-[15%] text-right">Custo Total</TableHead>
                        <TableHead className="w-[5%]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {renderComponents(composicao)}
                    </TableBody>
                  </Table>

                  <div className="flex justify-end items-center gap-4 mt-4 pt-3 border-t border-brand-line/15">
                    <span className="text-sm text-brand-muted">Custo total atual:</span>
                    <span className="text-lg font-semibold text-brand-highlight">
                      {formatBRL(calculateComposicaoCost(composicao))}
                    </span>
                  </div>
                </>
              )}

              <div className="mt-4 flex items-center gap-2 text-sm text-brand-muted bg-brand-surface-2 rounded-sm p-3">
                <Calculator className="h-4 w-4 shrink-0" />
                <span>Altere as quantidades dos componentes para simular o impacto no custo final da receita.</span>
              </div>
            </div>
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
                Selecione um insumo e defina o valor da mudança
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
          <Card className="bg-brand-surface-2 border-brand-line/20 shadow-none p-6 space-y-6">
            <h2 className="text-3xl font-semibold text-brand-soft tracking-tight">Simulação - {selectedMonth}</h2>
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
              <Card className="bg-brand-surface border-brand-line/10 shadow-none">
                <CardHeader className="pb-2">
                  <CardDescription className="text-[0.75rem] uppercase tracking-wider font-medium text-brand-muted">
                    Impacto na Rede
                  </CardDescription>
                  <CardTitle className={cn(
                      "text-2xl font-semibold tracking-tight",
                      getImpactColorClass(simulationResult.total_network_impact)
                  )}>
                    {formatBRL(simulationResult.total_network_impact)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[0.8125rem] text-brand-muted">
                    {formatPercent(simulationResult.total_network_impact_percent)} de impacto
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-brand-surface border-brand-line/10 shadow-none">
                <CardHeader className="pb-2">
                  <CardDescription className="text-[0.75rem] uppercase tracking-wider font-medium text-brand-muted">
                    Impacto Médio por Loja
                  </CardDescription>
                  <CardTitle className={cn(
                      "text-2xl font-semibold tracking-tight",
                      getImpactColorClass(simulationResult.avg_impact_per_store)
                  )}>
                    {formatBRL(simulationResult.avg_impact_per_store)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[0.8125rem] text-brand-muted">
                    {formatPercent(simulationResult.avg_impact_per_store_percent)} por loja
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-brand-surface border-brand-line/10 shadow-none">
                <CardHeader className="pb-2">
                  <CardDescription className="text-[0.75rem] uppercase tracking-wider font-medium text-brand-muted">
                    Impacto Médio nas Receitas
                  </CardDescription>
                  <CardTitle className={cn(
                      "text-2xl font-semibold tracking-tight",
                      getImpactColorClass(simulationResult.avg_impact_per_recipe)
                  )}>
                    {formatBRL(simulationResult.avg_impact_per_recipe)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[0.8125rem] text-brand-muted">
                    {formatPercent(simulationResult.avg_impact_per_recipe_percent)} por receita
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-brand-surface border-brand-line/10 shadow-none">
                <CardHeader className="pb-2">
                  <CardDescription className="text-[0.75rem] uppercase tracking-wider font-medium text-brand-muted">
                      CMV Médio da Rede
                  </CardDescription>
                  <CardTitle className={cn(
                      "text-2xl font-semibold tracking-tight",
                      getImpactColorClass(simulationResult.cmv_diff ?? 0)
                  )}>
                    {formatPercent(simulationResult.new_cmv)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const cmvVar = simulationResult.current_cmv && simulationResult.current_cmv > 0
                      ? ((simulationResult.new_cmv! / simulationResult.current_cmv) - 1) * 100
                      : 0;
                    return (
                      <p className="text-[0.8125rem] text-brand-muted">
                        Variação de {cmvVar >= 0 ? "+" : ""}{cmvVar.toFixed(1)}%
                      </p>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          </Card>

          {evolutionData && (
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
                ) : evolutionData && (
                  <ChartContainer config={{}} className="h-[240px] w-full">
                    <LineChart data={evolutionChartData} margin={{ top: 20, right: 30, left: 45, bottom: 20 }}>
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
                          if (v >= 1000000) return `R$ ${(v / 1000000).toFixed(1)}M`
                          if (v >= 1000) return `R$ ${(v / 1000).toFixed(1)}k`
                          return `R$ ${v.toFixed(0)}`
                        }}
                        label={{ 
                          value: "Custo (R$)", 
                          angle: -90, 
                          position: "insideLeft", 
                          offset: 0, 
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
                      <Line
                        type="monotone"
                        dataKey="current"
                        stroke="hsl(var(--brand-primary))"
                        strokeWidth={3}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="new"
                        stroke="hsl(var(--brand-muted))"
                        strokeWidth={3}
                        strokeDasharray="5 5"
                        dot={false}
                      />
                    </LineChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          )}

          {simulationResult.store_ranking.length > 0 && (
            <div className="grid xl:grid-cols-2 gap-6">
              <Card className="bg-brand-surface-2 border-brand-line/20 shadow-none p-6">
                <CardTitle className="mb-6">Lojas R$ (%) impacto</CardTitle>
                <div className="h-[400px] w-full overflow-y-auto">
                    <ResponsiveContainer width="100%" height={storeRankingData.length > 10 ? storeRankingData.length * 40 : "100%"}>
                        <BarChart 
                            layout="vertical"
                            data={storeRankingData} 
                            margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                        >
                            <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="hsla(var(--brand-line), 0.2)" />
                            <XAxis 
                                type="number" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 10, fill: "hsl(var(--brand-muted))" }}
                            />
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
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-brand-surface border border-brand-line/40 shadow-xl rounded-sm p-2 text-[10px]">
                                                <div className="font-bold mb-1">{data.name}</div>
                                                <div>Impacto R$: {formatBRL(data["Impacto R$"])}</div>
                                                <div>Impacto %: {formatPercent(data["Impacto %"])}</div>
                                            </div>
                                        )
                                    }
                                    return null;
                                }}
                            />
                            <Bar 
                                dataKey="Impacto R$" 
                                radius={[0, 4, 4, 0]}
                            >
                                {storeRankingData.map((entry, index) => (
                                    <Cell key={index} fill={entry["Impacto R$"] > 0 ? "hsl(var(--destructive))" : entry["Impacto R$"] < 0 ? "hsl(var(--brand-highlight))" : "hsl(var(--brand-muted))"} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <ChartLegend />
              </Card>

              <Card className="bg-brand-surface-2 border-brand-line/20 shadow-none p-6">
                <CardTitle className="mb-6">Impacto CMV (%)</CardTitle>
                <div className="h-[400px] w-full overflow-y-auto">
                    <ResponsiveContainer width="100%" height={storeRankingData.length > 10 ? storeRankingData.length * 40 : "100%"}>
                        <BarChart 
                            layout="vertical"
                            data={storeRankingData} 
                            margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                        >
                            <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="hsla(var(--brand-line), 0.2)" />
                            <XAxis 
                                type="number" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 10, fill: "hsl(var(--brand-muted))" }}
                            />
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
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-brand-surface border border-brand-line/40 shadow-xl rounded-sm p-2 text-[10px]">
                                                <div className="font-bold mb-1">{data.name}</div>
                                                <div>CMV Atual: {formatPercent(data["CMV Atual"])}</div>
                                                <div>CMV Simulado: {formatPercent(data["CMV Simulado"])}</div>
                                                <div className={cn("font-bold mt-1", getImpactColorClass(data["Variação %"]))}>
                                                  Variação: {data["Variação %"] >= 0 ? "+" : ""}{data["Variação %"].toFixed(1)}%
                                                </div>
                                            </div>
                                        )
                                    }
                                    return null;
                                }}
                            />
                            <Bar dataKey="Variação %" radius={[0, 4, 4, 0]}>
                                {storeRankingData.map((entry, index) => (
                                    <Cell key={index} fill={entry["Variação %"] > 0 ? "hsl(var(--destructive))" : entry["Variação %"] < 0 ? "hsl(var(--brand-highlight))" : "hsl(var(--brand-muted))"} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <ChartLegend />
              </Card>
            </div>
          )}

          <Card className="bg-brand-surface-2 border-brand-line/20 shadow-none p-6">
            <CardTitle className="text-lg font-semibold mb-4">Tabela de Resultados por Loja</CardTitle>
            <div className="[&>div]:max-h-[440px] [&>div]:overflow-y-auto pr-2 -mr-2">
              <Table>
                <TableHeader className="sticky top-0 bg-brand-surface-2 z-10 shadow-sm shadow-brand-line/10">
                  <TableRow className="border-brand-line/20 hover:bg-transparent">
                    <TableHead className="text-brand-muted font-medium bg-brand-surface-2">Loja</TableHead>
                    <TableHead className="text-brand-muted font-medium text-right bg-brand-surface-2">Qtd. Vendido</TableHead>
                    {simulationType === "insumo" && (
                      <TableHead className="text-brand-muted font-medium text-right bg-brand-surface-2">Qtd. Insumo</TableHead>
                    )}
                    <TableHead className="text-brand-muted font-medium text-right bg-brand-surface-2">Fat. Atual</TableHead>
                    {simulationType === "receita" && (
                      <TableHead className="text-brand-muted font-medium text-right bg-brand-surface-2">Fat. Simulado</TableHead>
                    )}
                    <TableHead className="text-brand-muted font-medium text-right bg-brand-surface-2">CMV %</TableHead>
                    <TableHead className="text-brand-muted font-medium text-right bg-brand-surface-2">CMV Simulado %</TableHead>
                    <TableHead className="text-brand-muted font-medium text-right bg-brand-surface-2">Diferença %</TableHead>
                    <TableHead className="text-brand-muted font-medium text-right bg-brand-surface-2">CMV R$</TableHead>
                    <TableHead className="text-brand-muted font-medium text-right bg-brand-surface-2">CMV Simulado R$</TableHead>
                    <TableHead className="text-brand-muted font-medium text-right bg-brand-surface-2">Diferença R$</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {simulationResult.store_ranking.map((store) => {
                    // Cálculo do faturamento baseado no CMV e Custo Total (Requisito da tarefa)
                    const revenueCurrent = store.current_cmv && store.current_cmv > 0 
                      ? (store.total_current_cost / (store.current_cmv / 100)) 
                      : 0;
                    
                    // Faturamento Simulado (Espaço preparado conforme tarefa 3)
                    // Atualmente o faturamento simulado muda se o preço de venda mudar (recipe_change)
                    const revenueSimulated = store.new_cmv && store.new_cmv > 0 
                      ? (store.total_new_cost / (store.new_cmv / 100)) 
                      : revenueCurrent;

                    const costDiff = store.total_new_cost - store.total_current_cost;

                    return (
                      <TableRow key={store.store_id} className="border-brand-line/20">
                        <TableCell className="font-medium text-brand-soft">{store.store_id}</TableCell>
                        <TableCell className="text-brand-soft text-right text-xs whitespace-nowrap">{formatNumber(store.monthly_sales_quantity)}</TableCell>
                        {simulationType === "insumo" && (
                          <TableCell className="text-brand-soft text-right text-xs whitespace-nowrap">{formatQuantity(store.ingredient_quantity, currentUnit)}</TableCell>
                        )}
                        <TableCell className="text-brand-muted text-right text-xs whitespace-nowrap">{formatBRL(revenueCurrent)}</TableCell>
                        {simulationType === "receita" && (
                          <TableCell className="text-brand-muted text-right text-xs whitespace-nowrap">{formatBRL(revenueSimulated)}</TableCell>
                        )}
                        <TableCell className="text-brand-soft text-right text-xs whitespace-nowrap">{formatPercent(store.current_cmv)}</TableCell>
                        <TableCell className="text-brand-soft text-right text-xs whitespace-nowrap">{formatPercent(store.new_cmv)}</TableCell>
                        <TableCell className={cn(
                          "text-right font-bold text-xs whitespace-nowrap",
                          getImpactColorClass(store.cmv_diff ?? 0)
                        )}>
                          {(store.cmv_diff ?? 0) >= 0 ? "+" : ""}{(store.cmv_diff ?? 0).toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-brand-soft text-right text-xs whitespace-nowrap">{formatBRL(store.total_current_cost)}</TableCell>
                        <TableCell className="text-brand-soft text-right text-xs whitespace-nowrap">{formatBRL(store.total_new_cost)}</TableCell>
                        <TableCell className={cn(
                          "text-right font-bold text-xs whitespace-nowrap",
                          getImpactColorClass(costDiff)
                        )}>
                          {costDiff >= 0 ? "+" : ""}{formatBRL(costDiff)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>

          {sortedSimulationResults.length > 0 && (
            <Card className="bg-brand-surface-2 border-brand-line/20 shadow-none p-6">
              <CardTitle className="text-lg font-semibold mb-4">Receitas Impactadas</CardTitle>
              <div className="[&>div]:max-h-[440px] [&>div]:overflow-y-auto pr-2 -mr-2">
                <Table>
                  <TableHeader className="sticky top-0 bg-brand-surface-2 z-10 shadow-sm shadow-brand-line/10">
                    <TableRow className="border-brand-line/20 hover:bg-transparent">
                      <TableHead className="text-brand-muted font-medium bg-brand-surface-2">Receita</TableHead>
                      <TableHead className="text-brand-muted font-medium text-right bg-brand-surface-2">Vendas/Mês</TableHead>
                      {simulationType === "insumo" ? (
                        <TableHead className="text-brand-muted font-medium text-right bg-brand-surface-2">Qtd. Insumo</TableHead>
                      ) : null}
                      <TableHead className="text-brand-muted font-medium text-right bg-brand-surface-2">Fat. Atual</TableHead>
                      {simulationType === "receita" && (
                        <TableHead className="text-brand-muted font-medium text-right bg-brand-surface-2">Fat. Simulado</TableHead>
                      )}
                      <TableHead className="text-brand-muted font-medium text-right bg-brand-surface-2">CMV %</TableHead>
                      <TableHead className="text-brand-muted font-medium text-right bg-brand-surface-2">CMV Simulado %</TableHead>
                      <TableHead className="text-brand-muted font-medium text-right bg-brand-surface-2">Diferença %</TableHead>
                      <TableHead className="text-brand-muted font-medium text-right bg-brand-surface-2">CMV R$</TableHead>
                      <TableHead className="text-brand-muted font-medium text-right bg-brand-surface-2">CMV Simulado R$</TableHead>
                      <TableHead className="text-brand-muted font-medium text-right bg-brand-surface-2">Diferença R$</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedSimulationResults.map((item) => {
                      const cmvAtualRS = item.current_cost * item.monthly_sales_quantity;
                      const cmvSimuladoRS = item.new_cost * item.monthly_sales_quantity;
                      const difCustoRS = cmvSimuladoRS - cmvAtualRS;

                      return (
                        <TableRow key={item.recipe_id} className="border-brand-line/20">
                          <TableCell className="font-medium text-brand-soft">{item.recipe_name}</TableCell>
                          <TableCell className="text-brand-soft text-right text-xs whitespace-nowrap">{formatNumber(item.monthly_sales_quantity)}</TableCell>
                          {simulationType === "insumo" ? (
                            <TableCell className="text-brand-soft text-right text-xs whitespace-nowrap">{formatQuantity(item.ingredient_quantity, currentUnit)}</TableCell>
                          ) : null}
                          <TableCell className="text-brand-soft text-right text-xs whitespace-nowrap">{formatBRL(item.monthly_revenue_current)}</TableCell>
                          {simulationType === "receita" && (
                            <TableCell className="text-brand-soft text-right text-xs whitespace-nowrap">{formatBRL(item.monthly_revenue_new)}</TableCell>
                          )}
                          <TableCell className="text-brand-soft text-right text-xs whitespace-nowrap">{formatPercent(item.current_cmv)}</TableCell>
                          <TableCell className="text-brand-soft text-right text-xs whitespace-nowrap">{formatPercent(item.new_cmv)}</TableCell>
                          <TableCell className={cn(
                            "text-right font-bold text-xs whitespace-nowrap",
                            getImpactColorClass(item.cmv_diff ?? 0)
                          )}>
                            {(item.cmv_diff ?? 0) >= 0 ? "+" : ""}{(item.cmv_diff ?? 0).toFixed(1)}%
                          </TableCell>
                          <TableCell className="text-brand-soft text-right text-xs whitespace-nowrap">{formatBRL(cmvAtualRS)}</TableCell>
                          <TableCell className="text-brand-soft text-right text-xs whitespace-nowrap">{formatBRL(cmvSimuladoRS)}</TableCell>
                          <TableCell className={cn(
                              "text-right font-bold text-xs whitespace-nowrap",
                              getImpactColorClass(difCustoRS)
                          )}>
                            {difCustoRS >= 0 ? "+" : ""}{formatBRL(difCustoRS)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>
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
