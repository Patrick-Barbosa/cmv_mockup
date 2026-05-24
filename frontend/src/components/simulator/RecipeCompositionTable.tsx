import React, { useCallback } from "react"
import { ChevronDown, ChevronRight, X, Plus, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatBRL } from "@/lib/format"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { simulatorApi, receitasApi } from "@/lib/api"

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ComponenteItem {
  id: string
  tipo: "insumo" | "receita"
  componenteId?: number
  quantidade: number
  quantidadeDisplay?: string
  custoUnitario?: number
  unidadeMedida?: string
  subComponentes?: ComponenteItem[]
  expanded?: boolean
}

export interface ProductOption {
  id: number
  text: string
  tipo: "insumo" | "receita"
  precoAtual?: number
}

export interface ReceitaOption {
  id: number
  nome: string
  rendimento: number
  unidade: string
  custoTotal?: number
  componentes?: any[]
}

interface RecipeCompositionTableProps {
  mode: "single" | "multi"
  componentes: ComponenteItem[]
  onChange: (componentes: ComponenteItem[]) => void
  availableInsumos: ProductOption[]
  availableReceitas: ProductOption[]
  editingId?: number | null
  selectedProductName?: string
  loading?: boolean
  receitasList?: ReceitaOption[]
  onRecalcCost?: (cost: number) => void
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function genId() {
  return Math.random().toString(36).slice(2, 9)
}

// ── Component ──────────────────────────────────────────────────────────────────

export function RecipeCompositionTable({
  mode,
  componentes,
  onChange,
  availableInsumos,
  availableReceitas,
  editingId,
  selectedProductName = "",
  loading = false,
  receitasList,
}: RecipeCompositionTableProps) {
  // Cost calculation is handled by the parent component via onChange

  // ── Tree operations (multi mode) ──────────────────────────────────────────

  const handleAddComponent = useCallback(
    (path: number[] | null, tipo: "insumo" | "receita") => {
      const newItem: ComponenteItem = {
        id: genId(),
        tipo,
        componenteId: 0,
        quantidade: 0,
        quantidadeDisplay: "0",
        expanded: true,
        subComponentes: tipo === "receita" ? [] : undefined,
      }

      const addToList = (list: ComponenteItem[], p: number[] | null): ComponenteItem[] => {
        if (!p) return [...list, newItem]
        return list.map((item, i) => {
          if (i !== p[0]) return item
          if (p.length === 1) {
            const subs = [...(item.subComponentes || []), newItem]
            return { ...item, subComponentes: subs }
          }
          return { ...item, subComponentes: addToList(item.subComponentes || [], p.slice(1)) }
        })
      }

      onChange(addToList(componentes, path))
    },
    [componentes, onChange]
  )

  const handleRemoveComponent = useCallback(
    (path: number[]) => {
      const removeAt = (list: ComponenteItem[], p: number[]): ComponenteItem[] => {
        if (p.length === 1) return list.filter((_, i) => i !== p[0])
        return list.map((item, i) => {
          if (i !== p[0]) return item
          return {
            ...item,
            subComponentes: item.subComponentes ? removeAt(item.subComponentes, p.slice(1)) : [],
          }
        })
      }
      onChange(removeAt(componentes, path))
    },
    [componentes, onChange]
  )

  const handleUpdateComponent = useCallback(
    (path: number[], updates: Partial<ComponenteItem>) => {
      const updateAt = (list: ComponenteItem[], p: number[]): ComponenteItem[] => {
        const [index, ...rest] = p
        return list.map((item, i) => {
          if (i !== index) return item
          if (rest.length === 0) return { ...item, ...updates }
          return {
            ...item,
            subComponentes: item.subComponentes ? updateAt(item.subComponentes, rest) : [],
          }
        })
      }
      onChange(updateAt(componentes, path))
    },
    [componentes, onChange]
  )

  const handleSelectProduct = useCallback(
    async (path: number[], id: number, tipo: "insumo" | "receita") => {
      try {
        const info = await simulatorApi.getProductInfo(id)
        const updates: Partial<ComponenteItem> = {
          componenteId: id,
          unidadeMedida: info.unidade_medida || "",
          custoUnitario: (tipo === "insumo" ? info.custo_atual : info.preco_venda) || 0,
        }
        if (tipo === "receita") {
          // Fetch tree for sub-recipes
          try {
            const tree = await receitasApi.getTree(id)
            
            const mapChildren = (children: any[]): ComponenteItem[] => {
              return (children || []).map((c: any) => ({
                id: genId(),
                tipo: c.tipo as "insumo" | "receita",
                componenteId: Number(c.id),
                quantidade: c.quantidade || 0,
                quantidadeDisplay: (c.quantidade || 0).toString().replace(".", ","),
                custoUnitario: c.custo || 0,
                unidadeMedida: c.unidade || "",
                subComponentes: c.children && c.children.length > 0 ? mapChildren(c.children) : undefined,
                expanded: false,
              }))
            }

            if (tree.children) {
              updates.subComponentes = mapChildren(tree.children)
            }
          } catch {
            // fallback: empty sub-components
            updates.subComponentes = []
          }
        }
        handleUpdateComponent(path, updates)
      } catch (err) {
        console.error(err)
      }
    },
    [handleUpdateComponent]
  )

  // ── Single mode operations ────────────────────────────────────────────────

  const handleAddSingle = (tipo: "insumo" | "receita") => {
    onChange([
      ...componentes,
      {
        id: genId(),
        tipo,
        componenteId: tipo === "insumo" ? 0 : undefined,
        quantidade: 0,
        quantidadeDisplay: "0",
      },
    ])
  }

  const handleRemoveSingle = (id: string) => {
    onChange(componentes.filter((c) => c.id !== id))
  }

  const handleUpdateSingle = (id: string, field: keyof ComponenteItem, value: unknown) => {
    onChange(componentes.map((c) => (c.id === id ? { ...c, [field]: value } : c)))
  }

  const handleSelectSingle = async (id: string, productId: number, tipo: "insumo" | "receita") => {
    try {
      const info = await simulatorApi.getProductInfo(productId)
      handleUpdateSingle(id, "componenteId", productId)
      handleUpdateSingle(id, "unidadeMedida", info.unidade_medida || "")
      handleUpdateSingle(
        id,
        "custoUnitario",
        tipo === "insumo" ? info.custo_atual : info.preco_venda || 0
      )
    } catch (err) {
      console.error(err)
    }
  }

  // Cost calculation is handled by the parent component via onChange

  // ── Render: Multi mode (tree) ─────────────────────────────────────────────

  const renderTreeComponents = (
    items: ComponenteItem[],
    pathPrefix: number[] = [],
    level = 0
  ): React.ReactNode => {
    return items.map((item, i) => {
      const currentPath = [...pathPrefix, i]
      const hasChildren = item.tipo === "receita"
      const unitCost = item.custoUnitario || 0
      const totalCost = unitCost * item.quantidade

      return (
        <React.Fragment key={item.id}>
          <TableRow
            className={level === 0 ? "border-brand-line/10 bg-transparent" : "border-brand-line/5 bg-brand-surface/30"}
          >
            <TableCell>
              <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 1.5}rem` }}>
                {hasChildren ? (
                  <button
                    onClick={() =>
                      handleUpdateComponent(currentPath, { expanded: !item.expanded })
                    }
                    className="p-0.5 hover:bg-brand-surface rounded text-brand-muted"
                  >
                    {item.expanded ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </button>
                ) : (
                  <div className="w-4 h-4" />
                )}
                <div className="flex-1">
                  <Select
                    value={item.componenteId ? item.componenteId.toString() : ""}
                    onValueChange={(val) => {
                      const pid = parseInt(val, 10)
                      handleSelectProduct(currentPath, pid, item.tipo)
                    }}
                  >
                    <SelectTrigger className="w-full h-8 bg-brand-surface border-brand-line/35 text-xs font-normal px-2">
                      <SelectValue
                        placeholder={`Selecione ${item.tipo}...`}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {(item.tipo === "insumo" ? availableInsumos : availableReceitas).map(
                        (p) => (
                          <SelectItem key={p.id} value={p.id.toString()}>
                            {p.text}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-[2px] text-[10px] font-bold uppercase tracking-wider",
                    item.tipo === "insumo"
                      ? "bg-brand-primary text-brand-text"
                      : "bg-brand-highlight text-brand-bg"
                  )}
                >
                  {item.tipo === "insumo" ? "Insumo" : "Receita"}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Input
                  type="text"
                  value={item.quantidadeDisplay ?? item.quantidade.toString().replace(".", ",")}
                  onChange={(e) => {
                    const val = e.target.value.replace(".", ",")
                    if (val === "" || /^[0-9]*[,]?[0-9]*$/.test(val)) {
                      const numericVal = parseFloat(val.replace(",", "."))
                      handleUpdateComponent(currentPath, {
                        quantidadeDisplay: val,
                        quantidade: isNaN(numericVal) ? 0 : numericVal,
                      })
                    }
                  }}
                  className="h-8 text-xs text-right w-20 bg-brand-surface border-brand-line/35"
                />
                {item.unidadeMedida && (
                  <span className="text-xs text-brand-muted whitespace-nowrap">
                    {item.unidadeMedida}
                  </span>
                )}
              </div>
            </TableCell>
            <TableCell className="text-right text-brand-highlight text-xs font-medium">
              {formatBRL(unitCost)}
              {item.unidadeMedida && (
                <span className="text-brand-muted text-[10px] ml-1">/{item.unidadeMedida}</span>
              )}
            </TableCell>
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
            <>{renderTreeComponents(item.subComponentes, currentPath, level + 1)}</>
          )}
        </React.Fragment>
      )
    })
  }

  // ── Render: Single mode (flat) ────────────────────────────────────────────

  const renderSingleComponents = (): React.ReactNode => {
    return componentes.map((component) => {
      let cost = 0
      let unitLabel = ""

      if (component.tipo === "insumo") {
        const insumo = availableInsumos.find((item) => item.id === component.componenteId)
        cost =
          insumo && component.quantidade > 0
            ? ((insumo.precoAtual || 0) * component.quantidade)
            : 0
        if (insumo) unitLabel = insumo.text.split("(")[1]?.replace(")", "") || ""
      } else {
        const subReceita = receitasList?.find((item) => item.id === component.componenteId)
        const subCost = subReceita?.custoTotal ?? 0
        cost =
          subReceita && component.quantidade > 0
            ? (subCost / (subReceita.rendimento || 1)) * component.quantidade
            : 0
        if (subReceita) unitLabel = subReceita.unidade
      }

      return (
        <div
          key={component.id}
          className="grid grid-cols-[1fr_90px_70px_30px] gap-2 items-center pb-2 border-b border-brand-line/10 last:border-0 last:pb-0"
        >
          <Select
            value={component.componenteId ? component.componenteId.toString() : ""}
            onValueChange={(val) => {
              const pid = parseInt(val, 10)
              handleSelectSingle(component.id, pid, component.tipo)
            }}
          >
            <SelectTrigger className="w-full h-8 bg-brand-surface border-brand-line/35 text-xs focus:ring-brand-highlight/10 focus:border-brand-highlight/55">
              <SelectValue placeholder={`Selecione ${component.tipo}…`} />
            </SelectTrigger>
            <SelectContent>
              {component.tipo === "insumo"
                ? availableInsumos.map((item) => (
                    <SelectItem key={item.id} value={item.id.toString()}>
                      {item.text}
                    </SelectItem>
                  ))
                : availableReceitas
                    .filter((item) => item.id !== editingId)
                    .map((item) => (
                      <SelectItem key={item.id} value={item.id.toString()}>
                        {item.text}
                      </SelectItem>
                    ))}
            </SelectContent>
          </Select>
          <div className="relative">
            <Input
              type="text"
              value={component.quantidadeDisplay ?? component.quantidade.toString().replace(".", ",")}
              onChange={(e) => {
                const val = e.target.value.replace(".", ",")
                if (val === "" || /^[0-9]*[,]?[0-9]*$/.test(val)) {
                  const numericVal = parseFloat(val.replace(",", "."))
                  handleUpdateSingle(component.id, "quantidadeDisplay", val)
                  handleUpdateSingle(
                    component.id,
                    "quantidade",
                    isNaN(numericVal) ? 0 : numericVal
                  )
                }
              }}
              className="w-full h-8 bg-brand-surface border-brand-line/35 text-xs text-right pr-8 pl-2 focus-visible:ring-brand-highlight/10 focus-visible:border-brand-highlight/55"
              placeholder="0"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-muted text-[0.65rem] pointer-events-none">
              {unitLabel}
            </span>
          </div>
          <span className="text-right text-xs text-brand-highlight font-medium tabular-nums pr-1">
            {cost > 0 ? formatBRL(cost) : "—"}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => handleRemoveSingle(component.id)}
            className="h-7 w-7 text-brand-muted hover:text-red-400 ml-auto rounded-[2px]"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      )
    })
  }

  // ── Main render ───────────────────────────────────────────────────────────

  if (mode === "multi") {
    return (
      <div className="bg-brand-surface-2 border border-brand-line/20 rounded-sm p-4">
        <div className="flex flex-row items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-brand-soft">
            Editar Composição — {selectedProductName}
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

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-brand-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando composição...
          </div>
        ) : componentes.length === 0 ? (
          <p className="text-sm text-brand-muted">
            Nenhum componente. Adicione insumos ou receitas.
          </p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="border-brand-line/20">
                  <TableHead className="text-brand-muted font-medium w-[45%]">
                    Insumo
                  </TableHead>
                  <TableHead className="text-brand-muted font-medium w-[20%]">
                    Quantidade
                  </TableHead>
                  <TableHead className="text-brand-muted font-medium w-[15%] text-right">
                    Custo Unit.
                  </TableHead>
                  <TableHead className="text-brand-muted font-medium w-[15%] text-right">
                    Custo Total
                  </TableHead>
                  <TableHead className="w-[5%]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{renderTreeComponents(componentes)}</TableBody>
            </Table>
          </>
        )}

        <div className="mt-4 flex items-center gap-2 text-sm text-brand-muted bg-brand-surface-2 rounded-sm p-3">
          <svg
            className="h-4 w-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="4" y="2" width="16" height="20" rx="2" />
            <line x1="8" y1="6" x2="16" y2="6" />
            <line x1="8" y1="10" x2="16" y2="10" />
            <line x1="8" y1="14" x2="12" y2="14" />
          </svg>
          <span>
            Altere as quantidades dos componentes para simular o impacto no custo
            final da receita.
          </span>
        </div>
      </div>
    )
  }

  // single mode
  return (
    <div className="mb-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <p className="text-brand-soft text-sm font-medium">Composição</p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleAddSingle("receita")}
            className="border-brand-highlight/30 text-brand-highlight hover:bg-brand-highlight/10 hover:border-brand-highlight/45 hover:text-brand-highlight transition-colors h-8"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar receita
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleAddSingle("insumo")}
            className="border-brand-highlight/30 text-brand-highlight hover:bg-brand-highlight/10 hover:border-brand-highlight/45 hover:text-brand-highlight transition-colors h-8"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar insumo
          </Button>
        </div>
      </div>

      {componentes.length === 0 ? (
        <div className="py-8 flex flex-col items-center justify-center border border-dashed border-brand-line/25 rounded-[2px]">
          <p className="text-brand-muted text-xs text-center">
            Adicione os insumos ou receitas que compõem este preparo.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-[1fr_90px_70px_30px] gap-2 pb-1">
            <span className="text-brand-muted text-[0.68rem] uppercase tracking-wide font-medium">
              Item
            </span>
            <span className="text-brand-muted text-[0.68rem] uppercase tracking-wide font-medium">
              Qtd
            </span>
            <span className="text-brand-muted text-[0.68rem] uppercase tracking-wide font-medium text-right pr-1">
              Custo
            </span>
          </div>
          {renderSingleComponents()}
        </div>
      )}
    </div>
  )
}
