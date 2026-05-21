import React from "react"
import { ChevronDown, ChevronRight, X, Plus, Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatBRL } from "@/lib/format"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { simulatorApi } from "@/lib/api"

interface ProductOption {
  id: number
  text: string
  tipo: "insumo" | "receita"
}

export interface Componente {
  id: string
  tipo: "insumo" | "receita"
  componenteId?: number
  quantidade: number
  quantidadeDisplay?: string
  custoUnitario?: number
  unidadeMedida?: string
  subComponentes?: Componente[]
  expanded?: boolean
}

export interface EditableTreeViewerProps {
  componentes: Componente[]
  onChange: (componentes: Componente[]) => void
  insumos: ProductOption[]
  receitas: ProductOption[]
  loading?: boolean
  selectedProductName?: string
}

export function EditableTreeViewer({
  componentes,
  onChange,
  insumos,
  receitas,
  loading = false,
  selectedProductName = "",
}: EditableTreeViewerProps) {


  const handleAddComponent = (path: number[] | null, tipo: "insumo" | "receita") => {
    const newItem: Componente = {
      id: Math.random().toString(36).slice(2, 9),
      tipo,
      componenteId: 0,
      quantidade: 0,
      quantidadeDisplay: "0",
      expanded: true,
      subComponentes: tipo === "receita" ? [] : undefined,
    }

    const addToList = (list: Componente[], p: number[] | null): Componente[] => {
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
  }

  const handleRemoveComponent = (path: number[]) => {
    const removeAt = (list: Componente[], p: number[]): Componente[] => {
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
  }

  const handleUpdateComponent = (path: number[], updates: Partial<Componente>) => {
    const updateAt = (list: Componente[], p: number[]): Componente[] => {
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
  }

  const handleSelectProduct = async (path: number[], id: number, tipo: "insumo" | "receita") => {
    try {
      const info = await simulatorApi.getProductInfo(id)
      const updates: Partial<Componente> = {
        componenteId: id,
        unidadeMedida: info.unidade_medida || "",
        custoUnitario: (tipo === "insumo" ? info.custo_atual : info.preco_venda) || 0,
      }
      if (tipo === "receita") {
        const detalhes = await fetch(`/receitas/${id}`).then((r) => r.json())
        if (detalhes.children) {
          updates.subComponentes = detalhes.children.map((c: any) => ({
            id: Math.random().toString(36).slice(2, 9),
            tipo: c.tipo,
            componenteId: Number(c.id),
            quantidade: c.quantidade || 0,
            quantidadeDisplay: (c.quantidade || 0).toString().replace(".", ","),
            custoUnitario: c.custo || 0,
            unidadeMedida: c.unidade || "",
            subComponentes: c.children && c.children.length > 0 ? [] : undefined,
            expanded: false,
          }))
        }
      }
      handleUpdateComponent(path, updates)
    } catch (err) {
      console.error(err)
    }
  }


  const renderComponents = (items: Componente[], pathPrefix: number[] = [], level = 0): React.ReactNode => {
    return items.map((item, i) => {
      const currentPath = [...pathPrefix, i]
      const hasChildren = item.tipo === "receita"
      const unitCost = item.custoUnitario || 0
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
                                  handleSelectProduct(currentPath, p.id, item.tipo)
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

  return (
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

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-brand-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando composição...
        </div>
      ) : componentes.length === 0 ? (
        <p className="text-sm text-brand-muted">Nenhum componente. Adicione insumos ou receitas.</p>
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
              {renderComponents(componentes)}
            </TableBody>
          </Table>

          <div className="flex justify-end items-center gap-4 mt-4 pt-3 border-t border-brand-line/15">
          </div>
        </>
      )}

      <div className="mt-4 flex items-center gap-2 text-sm text-brand-muted bg-brand-surface-2 rounded-sm p-3">
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <line x1="8" y1="6" x2="16" y2="6" />
          <line x1="8" y1="10" x2="16" y2="10" />
          <line x1="8" y1="14" x2="12" y2="14" />
        </svg>
        <span>Altere as quantidades dos componentes para simular o impacto no custo final da receita.</span>
      </div>
    </div>
  )
}
