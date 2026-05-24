import { useEffect, useMemo, useState, useCallback } from "react"
import { Link } from "react-router-dom"
import { AlertCircle, Edit2, Eye, Link2, Loader2, Plus, Trash2 } from "lucide-react"
import { FadeUp } from "@/components/ui/fade-up"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { IS_MOCK, insumosApi, receitasApi } from "@/lib/api"
import { RecipeCompositionTable, type ComponenteItem } from "@/components/simulator/RecipeCompositionTable"
import type { Insumo } from "./Insumos"

const mockInsumos: Insumo[] = [
  { id: 1, nome: "Filé de Frango", unidade: "kg", qtdRef: 1, precoRef: 22.5, idProdutoExterno: "" },
  { id: 2, nome: "Azeite Extra Virgem", unidade: "l", qtdRef: 5, precoRef: 180.0, idProdutoExterno: "" },
  { id: 3, nome: "Tomate Pelati", unidade: "lt", qtdRef: 2.5, precoRef: 45.0, idProdutoExterno: "SKU-TOMATE-001" },
]

export interface ReceitaComponente {
  id: string
  tipo: "insumo" | "receita"
  insumoId?: number
  receitaId?: number
  quantidade: number
}

export interface Receita {
  id: number
  nome: string
  rendimento: number
  unidade: string
  componentes: ReceitaComponente[]
  custoTotal?: number
  idProdutoExterno: string
}

const mockReceitas: Receita[] = [
  {
    id: 1,
    nome: "Molho de Tomate Rústico",
    rendimento: 2,
    unidade: "l",
    idProdutoExterno: "",
    componentes: [
      { id: "c1", tipo: "insumo", insumoId: 2, quantidade: 0.1 },
      { id: "c2", tipo: "insumo", insumoId: 3, quantidade: 2.5 },
    ],
  },
  {
    id: 2,
    nome: "Bolo de Pote de Chocolate",
    rendimento: 1,
    unidade: "un",
    idProdutoExterno: "POTE-CHOC-001",
    componentes: [
      { id: "c3", tipo: "insumo", insumoId: 3, quantidade: 1.5 },
    ],
  },
]

function mapApiComponentes(
  apiComps: { id_componente: number; quantidade: number }[],
  insumoIds: Set<number>
): ReceitaComponente[] {
  return apiComps.map((component) => {
    const isInsumo = insumoIds.has(component.id_componente)
    return {
      id: Math.random().toString(36).slice(2, 9),
      tipo: isInsumo ? "insumo" : "receita",
      insumoId: isInsumo ? component.id_componente : undefined,
      receitaId: isInsumo ? undefined : component.id_componente,
      quantidade: component.quantidade,
    }
  })
}

// Convert ReceitaComponente[] to ComponenteItem[] for RecipeCompositionTable
function toComponenteItems(comps: ReceitaComponente[]): ComponenteItem[] {
  return comps.map((c) => ({
    id: c.id,
    tipo: c.tipo,
    componenteId: c.tipo === "insumo" ? c.insumoId : c.receitaId,
    quantidade: c.quantidade,
    quantidadeDisplay: c.quantidade.toString().replace(".", ","),
  }))
}

// Convert ComponenteItem[] back to ReceitaComponente[] for saving
function fromComponenteItems(items: ComponenteItem[]): ReceitaComponente[] {
  return items.map((c) => ({
    id: c.id,
    tipo: c.tipo,
    insumoId: c.tipo === "insumo" ? c.componenteId : undefined,
    receitaId: c.tipo === "receita" ? c.componenteId : undefined,
    quantidade: c.quantidade,
  }))
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export default function Receitas() {
  const [receitas, setReceitas] = useState<Receita[]>(IS_MOCK ? mockReceitas : [])
  const [availableInsumos, setAvailableInsumos] = useState<Insumo[]>(IS_MOCK ? mockInsumos : [])
  const [loading, setLoading] = useState(!IS_MOCK)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const [nome, setNome] = useState("")
  const [rendimento, setRendimento] = useState("")
  const [unidade, setUnidade] = useState("")
  const [idProdutoExterno, setIdProdutoExterno] = useState("")
  const [componentes, setComponentes] = useState<ReceitaComponente[]>([])
  const [composicaoItems, setComposicaoItems] = useState<ComponenteItem[]>([])

  // Product options for RecipeCompositionTable
  const availableInsumosOptions = useMemo(
    () => availableInsumos.map((i) => ({ id: i.id, text: `${i.nome}${i.unidade ? ` (${i.unidade})` : ""}`, tipo: "insumo" as const, precoAtual: i.qtdRef ? i.precoRef / i.qtdRef : 0 })),
    [availableInsumos]
  )

  const availableReceitasOptions = useMemo(
    () => receitas.map((r) => ({ id: r.id, text: `${r.nome}${r.unidade ? ` (${r.unidade})` : ""}`, tipo: "receita" as const, precoAtual: r.custoTotal })),
    [receitas]
  )

  // Sync componentes -> composicaoItems when dialog opens
  const syncComposicaoItems = useCallback((comps: ReceitaComponente[]) => {
    setComposicaoItems(toComponenteItems(comps))
  }, [])

  // Sync composicaoItems -> componentes when saving
  const syncComponentes = useCallback((items: ComponenteItem[]) => {
    setComposicaoItems(items)
    setComponentes(fromComponenteItems(items))
  }, [])

  useEffect(() => {
    if (IS_MOCK) return

    const loadData = async () => {
      try {
        const insumosList = await insumosApi.list()
        const mappedInsumos: Insumo[] = insumosList.map((item) => ({
          id: item.id,
          nome: item.nome,
          unidade: item.unidade ?? "",
          qtdRef: item.quantidade_referencia ?? 0,
          precoRef: item.preco_referencia ?? 0,
          idProdutoExterno: item.id_produto_externo ?? "",
        }))

        setAvailableInsumos(mappedInsumos)
        const insumoIdSet = new Set(mappedInsumos.map((item) => item.id))

        const receitasList = await receitasApi.list()
        const detalhes = await Promise.all(receitasList.map((item) => receitasApi.get(item.id)))

        setReceitas(detalhes.map((detalhe) => ({
          id: detalhe.id,
          nome: detalhe.nome,
          rendimento: detalhe.quantidade_base ?? 0,
          unidade: detalhe.unidade ?? "",
          custoTotal: detalhe.custo_total,
          idProdutoExterno: detalhe.id_produto_externo ?? "",
          componentes: mapApiComponentes(
            detalhe.componentes.map((component) => ({
              id_componente: component.id_componente,
              quantidade: component.quantidade,
            })),
            insumoIdSet,
          ),
        })))
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao carregar receitas.")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const parsedRendimento = parseFloat(rendimento)
  const linkedRecipes = useMemo(
    () => receitas.filter((receita) => receita.idProdutoExterno.trim()).length,
    [receitas],
  )

  const calculateCusto = (items: ReceitaComponente[]): number => {
    return items.reduce((sum, item) => {
      if (item.tipo === "insumo") {
        const insumo = availableInsumos.find((entry) => entry.id === item.insumoId)
        if (!insumo || !insumo.qtdRef) return sum
        return sum + (insumo.precoRef / insumo.qtdRef) * item.quantidade
      }

      const receitaFilha = receitas.find((entry) => entry.id === item.receitaId)
      if (!receitaFilha || receitaFilha.id === editingId) return sum
      const custoFilho = receitaFilha.custoTotal ?? calculateCusto(receitaFilha.componentes)
      return sum + (custoFilho / (receitaFilha.rendimento || 1)) * item.quantidade
    }, 0)
  }

  const custoFormPreview = calculateCusto(componentes)

  const handleSalvar = async () => {
    const validComps = componentes.filter(
      (component) =>
        (component.tipo === "insumo" ? !!component.insumoId : !!component.receitaId) &&
        component.quantidade > 0
    )

    if (!nome || !parsedRendimento || validComps.length === 0) {
      return
    }

    const normalizedExternalId = idProdutoExterno.trim()
    setSaving(true)
    try {
      if (IS_MOCK) {
        const nextReceita: Receita = {
          id: editingId ?? Date.now(),
          nome,
          unidade,
          rendimento: parsedRendimento,
          componentes: validComps,
          idProdutoExterno: normalizedExternalId,
        }
        setReceitas((prev) =>
          editingId
            ? prev.map((item) => (item.id === editingId ? nextReceita : item))
            : [nextReceita, ...prev]
        )
      } else {
        const payload = {
          nome,
          quantidade_base: parsedRendimento,
          unidade: unidade || undefined,
          id_produto_externo: normalizedExternalId || null,
          componentes: validComps.map((component) => ({
            id_componente: (component.tipo === "insumo" ? component.insumoId : component.receitaId)!,
            quantidade: component.quantidade,
          })),
        }

        if (editingId) {
          await receitasApi.edit(editingId, payload)
          const updated = await receitasApi.get(editingId)
          const insumoIdSet = new Set(availableInsumos.map((item) => item.id))

          setReceitas((prev) =>
            prev.map((item) =>
              item.id === editingId
                ? {
                    id: updated.id,
                    nome: updated.nome,
                    rendimento: updated.quantidade_base ?? 0,
                    unidade: updated.unidade ?? "",
                    custoTotal: updated.custo_total,
                    idProdutoExterno: updated.id_produto_externo ?? "",
                    componentes: mapApiComponentes(
                      updated.componentes.map((component) => ({
                        id_componente: component.id_componente,
                        quantidade: component.quantidade,
                      })),
                      insumoIdSet,
                    ),
                  }
                : item
            )
          )
        } else {
          const res = await receitasApi.create(payload)
          const created = await receitasApi.get(res.id)
          const insumoIdSet = new Set(availableInsumos.map((item) => item.id))

          setReceitas((prev) => [
            {
              id: created.id,
              nome: created.nome,
              rendimento: created.quantidade_base ?? 0,
              unidade: created.unidade ?? "",
              custoTotal: created.custo_total,
              idProdutoExterno: created.id_produto_externo ?? "",
              componentes: mapApiComponentes(
                created.componentes.map((component) => ({
                  id_componente: component.id_componente,
                  quantidade: component.quantidade,
                })),
                insumoIdSet,
              ),
            },
            ...prev,
          ])
        }
      }

      handleClear()
      setIsDialogOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar receita.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      if (!IS_MOCK) {
        await receitasApi.delete(id)
      }
      setReceitas((prev) => prev.filter((item) => item.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao remover receita.")
    }
  }

  const handleEdit = (item: Receita) => {
    setEditingId(item.id)
    setNome(item.nome)
    setRendimento(item.rendimento?.toString() ?? "")
    setUnidade(item.unidade ?? "")
    setIdProdutoExterno(item.idProdutoExterno)
    setComponentes(item.componentes)
    syncComposicaoItems(item.componentes)
    setIsDialogOpen(true)
  }

  const handleClear = () => {
    setNome("")
    setRendimento("")
    setUnidade("")
    setIdProdutoExterno("")
    setComponentes([])
    setComposicaoItems([])
    setEditingId(null)
  }

  const onOpenNew = () => {
    handleClear()
    setIsDialogOpen(true)
  }

  return (
    <FadeUp>
      <div className="mb-10 flex items-center justify-between">
        <div>
          <p className="text-brand-muted text-[0.7rem] tracking-[0.28em] uppercase font-medium mb-2">Operação / Receitas</p>
          <h1 className="text-2xl md:text-3xl font-semibold leading-tight tracking-tight">Receitas</h1>
          <p className="text-brand-soft text-sm md:text-base mt-2 leading-relaxed max-w-lg">
            Monte receitas com insumos e outras receitas, calcule o custo ideal e conecte os produtos vendidos pelo identificador externo.
          </p>
        </div>
        <Button onClick={onOpenNew} className="hidden sm:flex bg-brand-primary text-brand-button-text hover:bg-brand-primary-hover shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Nova receita
        </Button>
      </div>

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-sm px-4 py-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-red-400 text-xs">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300 text-xs">×</button>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) handleClear() }}>
        <DialogContent className="max-w-2xl bg-brand-surface-2 border-brand-line/20 p-6 md:p-8 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-brand-text font-medium text-lg">
              {editingId ? "Editar receita" : "Nova receita"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid sm:grid-cols-2 gap-5 mb-6">
            <div className="sm:col-span-2 space-y-2">
              <Label className="text-[0.76rem] text-brand-soft tracking-[0.03em]">Nome da receita</Label>
              <Input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex.: Risoto de camarão, Molho especial…"
                className="bg-brand-surface border-brand-line/35 focus-visible:ring-brand-highlight/10 focus-visible:border-brand-highlight/55"
              />
            </div>

            <div className="sm:col-span-2 space-y-2">
              <Label className="text-[0.76rem] text-brand-soft tracking-[0.03em]">ID do produto externo</Label>
              <Input
                type="text"
                value={idProdutoExterno}
                onChange={(e) => setIdProdutoExterno(e.target.value)}
                placeholder="Opcional. Ex.: PIZZA-MARG-001"
                className="bg-brand-surface border-brand-line/35 focus-visible:ring-brand-highlight/10 focus-visible:border-brand-highlight/55"
              />
              <p className="text-brand-muted text-[0.7rem] leading-relaxed">
                Esse campo permite relacionar a receita às vendas importadas por produto e loja.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-[0.76rem] text-brand-soft tracking-[0.03em]">Rendimento (quantidade_base)</Label>
              <Input
                type="number"
                value={rendimento}
                onChange={(e) => setRendimento(e.target.value)}
                placeholder="Ex.: 1, 4, 500"
                className="bg-brand-surface border-brand-line/35 focus-visible:ring-brand-highlight/10 focus-visible:border-brand-highlight/55"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[0.76rem] text-brand-soft tracking-[0.03em]">Unidade</Label>
              <Select value={unidade} onValueChange={setUnidade}>
                <SelectTrigger className="w-full bg-brand-surface border-brand-line/35 focus:ring-brand-highlight/10 focus:border-brand-highlight/55 h-10">
                  <SelectValue placeholder="Selecione…" />
                </SelectTrigger>
                <SelectContent>
                  {["porções", "kg", "g", "l", "ml", "un", "pct"].map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <RecipeCompositionTable
            mode="single"
            componentes={composicaoItems}
            onChange={syncComponentes}
            availableInsumos={availableInsumosOptions}
            availableReceitas={availableReceitasOptions}
            editingId={editingId}
            receitasList={receitas}
          />

          <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-brand-line/15">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-brand-muted hover:text-brand-soft">
              Cancelar
            </Button>
            <Button
              onClick={handleSalvar}
              disabled={saving}
              className="bg-brand-primary text-brand-button-text hover:bg-brand-primary-hover hover:shadow-[0_0_16px_rgba(201,76,182,.14),0_0_6px_rgba(94,111,55,.2)]"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editingId ? "Salvar alterações" : "Adicionar receita"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid lg:grid-cols-[1fr_260px] gap-8 items-start">
        <div className="flex flex-col gap-6">
          <div className="sm:hidden mb-2">
            <Button onClick={onOpenNew} className="w-full bg-brand-primary text-brand-button-text focus:ring-2 focus:ring-brand-highlight/20">
              <Plus className="w-4 h-4 mr-2" /> Nova receita
            </Button>
          </div>

          <div className="bg-brand-surface-2 border border-brand-line/20 rounded-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-brand-line/15 flex items-center justify-between">
              <h2 className="text-brand-soft text-sm font-medium">Receitas cadastradas</h2>
              <span className="text-brand-muted text-xs">{receitas.length} itens</span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16 gap-2 text-brand-muted">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Carregando receitas…</span>
              </div>
            ) : receitas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <AlertCircle className="w-10 h-10 text-brand-highlight opacity-30 mb-5" />
                <p className="text-brand-soft text-sm font-medium mb-1 text-center">Nenhuma receita cadastrada ainda.</p>
                <p className="text-brand-muted text-xs text-center max-w-xs leading-relaxed">Estruture seus preparos para começar a calcular custo real.</p>
              </div>
            ) : (
              <div className="overflow-x-auto pb-4">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-brand-line/20 text-brand-muted text-[0.72rem] tracking-[0.08em] uppercase hover:bg-transparent">
                      <TableHead className="font-medium h-10">Receita</TableHead>
                      <TableHead className="font-medium h-10">ID Externo</TableHead>
                      <TableHead className="font-medium h-10">Rendimento</TableHead>
                      <TableHead className="font-medium h-10">Custo Total</TableHead>
                      <TableHead className="font-medium text-right h-10">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receitas.map((item) => {
                      const custo = item.custoTotal ?? calculateCusto(item.componentes)
                      return (
                        <TableRow key={item.id} className="border-b border-brand-line/10 hover:bg-brand-line/5 transition-colors">
                          <TableCell className="font-medium text-brand-text">{item.nome}</TableCell>
                          <TableCell className="text-brand-muted">
                            {item.idProdutoExterno
                              ? <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-highlight/10 text-brand-highlight rounded-[2px] text-[0.72rem] font-medium border border-brand-highlight/20"><Link2 className="w-3 h-3" />{item.idProdutoExterno}</span>
                              : <span className="text-brand-muted/40 text-xs">—</span>
                            }
                          </TableCell>
                          <TableCell className="text-brand-muted tabular-nums">
                            {item.rendimento ? `${item.rendimento} ${item.unidade || "un."}` : "—"}
                          </TableCell>
                          <TableCell className="text-brand-highlight font-medium tabular-nums">
                            {custo > 0 ? formatBRL(custo) : "—"}
                          </TableCell>
                          <TableCell className="text-right py-2">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-brand-muted hover:text-brand-highlight hover:bg-transparent transition-colors rounded-[2px]" title="Ver detalhes">
                                <Link to={`/receitas/${item.id}`}><Eye className="w-3.5 h-3.5" /></Link>
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} className="h-8 w-8 text-brand-muted hover:text-brand-highlight hover:bg-transparent transition-colors rounded-[2px]" title="Editar">
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 text-brand-muted hover:text-red-400 hover:bg-transparent transition-colors rounded-[2px]" title="Excluir">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-brand-surface-2 border border-brand-line/20 rounded-[2px] p-5">
            <p className="text-brand-muted text-[0.7rem] tracking-[0.12em] uppercase font-medium mb-3">Custo estimado</p>
            <p className="text-brand-highlight text-3xl font-light tabular-nums">{formatBRL(custoFormPreview)}</p>
            <p className="text-brand-muted text-xs mt-1">{componentes.filter((item) => (item.insumoId || item.receitaId) && item.quantidade > 0).length} itens na composição</p>
          </div>

          <div className="bg-brand-surface-2 border border-brand-line/20 rounded-[2px] p-5">
            <p className="text-brand-muted text-[0.7rem] tracking-[0.12em] uppercase font-medium mb-3">Produtos vinculados</p>
            <p className="text-brand-highlight text-3xl font-light tabular-nums">{linkedRecipes}</p>
            <p className="text-brand-muted text-xs mt-1">receitas com `id_produto_externo`</p>
          </div>

          <div className="bg-brand-surface flex border border-brand-line/15 rounded-[2px] p-5 gap-3">
            <AlertCircle className="w-3.5 h-3.5 text-brand-highlight shrink-0 mt-0.5" />
            <p className="text-brand-muted text-xs leading-relaxed">
              {IS_MOCK
                ? "Modo demo — configure VITE_BACKEND_URL para conectar ao backend."
                : "As receitas vinculadas passam a aparecer nas análises mensais de vendas por loja e no detalhe da própria receita."}
            </p>
          </div>
        </div>
      </div>
    </FadeUp>
  )
}
