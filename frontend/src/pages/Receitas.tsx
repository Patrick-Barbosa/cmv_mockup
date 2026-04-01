import { useState, useEffect } from "react"
import { FadeUp } from "@/components/ui/fade-up"
import { Edit2, Trash2, AlertCircle, Plus, Eye, Loader2 } from "lucide-react"
import type { Insumo } from "./Insumos"
import { Link } from "react-router-dom"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { IS_MOCK, insumosApi, receitasApi } from "@/lib/api"

// ── Fallback mock data ────────────────────────────────────────────────────────
const mockInsumos: Insumo[] = [
  { id: 1, nome: "Filé de Frango", unidade: "kg", qtdRef: 1, precoRef: 22.5 },
  { id: 2, nome: "Azeite Extra Virgem", unidade: "l", qtdRef: 5, precoRef: 180.0 },
  { id: 3, nome: "Tomate Pelati", unidade: "lt", qtdRef: 2.5, precoRef: 45.0 },
]

export interface ReceitaComponente {
  id: string            // local uuid, used as React key
  tipo: "insumo" | "receita"
  insumoId?: number
  receitaId?: number
  quantidade: number
}

export interface Receita {
  id: number
  nome: string
  rendimento: number    // maps to quantidade_base in backend
  unidade: string
  componentes: ReceitaComponente[]
  custoTotal?: number   // pre-computed by backend
}

const mockReceitas: Receita[] = [
  {
    id: 1,
    nome: "Molho de Tomate Rústico",
    rendimento: 2,
    unidade: "l",
    componentes: [
      { id: "c1", tipo: "insumo", insumoId: 2, quantidade: 0.1 },
      { id: "c2", tipo: "insumo", insumoId: 3, quantidade: 2.5 },
    ],
  },
]

// Helper: convert api componente (which has no tipo) to frontend ReceitaComponente
// We determine tipo by checking if id_componente is in the insumos list
function mapApiComponetes(
  apiComps: { id_componente: number; quantidade: number }[],
  insumoIds: Set<number>
): ReceitaComponente[] {
  return apiComps.map((c) => {
    const isInsumo = insumoIds.has(c.id_componente)
    return {
      id: Math.random().toString(36).slice(2, 9),
      tipo: isInsumo ? "insumo" : "receita",
      insumoId: isInsumo ? c.id_componente : undefined,
      receitaId: isInsumo ? undefined : c.id_componente,
      quantidade: c.quantidade,
    }
  })
}

export default function Receitas() {
  const [receitas, setReceitas] = useState<Receita[]>(IS_MOCK ? mockReceitas : [])
  const [availableInsumos, setAvailableInsumos] = useState<Insumo[]>(IS_MOCK ? mockInsumos : [])
  const [loading, setLoading] = useState(!IS_MOCK)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Form state
  const [nome, setNome] = useState("")
  const [rendimento, setRendimento] = useState("")
  const [unidade, setUnidade] = useState("")
  const [componentes, setComponentes] = useState<ReceitaComponente[]>([])

  // ── Load from API ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (IS_MOCK) return

    const loadData = async () => {
      try {
        // Load insumos list first (needed to determine componente tipo)
        const insumosList = await insumosApi.list()
        const mappedInsumos: Insumo[] = insumosList.map((i) => ({
          id: i.id,
          nome: i.nome,
          unidade: i.unidade ?? "",
          qtdRef: i.quantidade_referencia ?? 0,
          precoRef: i.preco_referencia ?? 0,
        }))
        setAvailableInsumos(mappedInsumos)
        const insumoIdSet = new Set(mappedInsumos.map((i) => i.id))

        // Load receitas list, then fetch full detail for each
        const receitasList = await receitasApi.list()
        const detalhes = await Promise.all(
          receitasList.map((r) => receitasApi.get(r.id))
        )

        setReceitas(
          detalhes.map((d) => ({
            id: d.id,
            nome: d.nome,
            rendimento: d.quantidade_base ?? 0,
            unidade: d.unidade ?? "",
            custoTotal: d.custo_total,
            // Map API componentes → frontend ReceitaComponente
            componentes: mapApiComponetes(
              d.componentes.map((c) => ({
                id_componente: c.id_componente,
                quantidade: c.quantidade,
              })),
              insumoIdSet
            ),
          }))
        )
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const parsedRend = parseFloat(rendimento)

  // ── Component form handlers ───────────────────────────────────────────────
  const handleAddComponent = (tipo: "insumo" | "receita") => {
    setComponentes([
      ...componentes,
      {
        id: Math.random().toString(36).slice(2, 9),
        tipo,
        insumoId: tipo === "insumo" ? 0 : undefined,
        receitaId: tipo === "receita" ? 0 : undefined,
        quantidade: 0,
      },
    ])
  }

  const handleUpdateComponent = (
    id: string,
    field: "insumoId" | "receitaId" | "quantidade",
    value: number
  ) => {
    setComponentes(componentes.map((c) => (c.id === id ? { ...c, [field]: value } : c)))
  }

  const handleRemoveComponent = (id: string) => {
    setComponentes(componentes.filter((c) => c.id !== id))
  }

  // ── Save handler ──────────────────────────────────────────────────────────
  const handleSalvar = async () => {
    const validComps = componentes.filter(
      (c) => (c.tipo === "insumo" ? !!c.insumoId : !!c.receitaId) && c.quantidade > 0
    )
    if (!nome || !parsedRend || validComps.length === 0) return

    setSaving(true)
    try {
      if (IS_MOCK) {
        const newData: Receita = {
          id: editingId ?? Date.now(),
          nome, unidade, rendimento: parsedRend, componentes: validComps,
        }
        setReceitas((prev) =>
          editingId ? prev.map((r) => (r.id === editingId ? newData : r)) : [newData, ...prev]
        )
      } else {
        // Backend payload fields: nome, quantidade_base, unidade, componentes[{id_componente, quantidade}]
        const payload = {
          nome,
          quantidade_base: parsedRend,
          unidade: unidade || undefined,
          componentes: validComps.map((c) => ({
            id_componente: (c.tipo === "insumo" ? c.insumoId : c.receitaId)!,
            quantidade: c.quantidade,
          })),
        }

        if (editingId) {
          await receitasApi.edit(editingId, payload)
          // Refetch the updated detail to get computed custo_total
          const updated = await receitasApi.get(editingId)
          const insumoIdSet = new Set(availableInsumos.map((i) => i.id))
          setReceitas((prev) =>
            prev.map((r) =>
              r.id === editingId
                ? {
                    id: updated.id,
                    nome: updated.nome,
                    rendimento: updated.quantidade_base ?? 0,
                    unidade: updated.unidade ?? "",
                    custoTotal: updated.custo_total,
                    componentes: mapApiComponetes(
                      updated.componentes.map((c) => ({ id_componente: c.id_componente, quantidade: c.quantidade })),
                      insumoIdSet
                    ),
                  }
                : r
            )
          )
        } else {
          const res = await receitasApi.create(payload)
          // Refetch the new receita to get full data including custo_total
          const created = await receitasApi.get(res.id)
          const insumoIdSet = new Set(availableInsumos.map((i) => i.id))
          setReceitas((prev) => [
            {
              id: created.id,
              nome: created.nome,
              rendimento: created.quantidade_base ?? 0,
              unidade: created.unidade ?? "",
              custoTotal: created.custo_total,
              componentes: mapApiComponetes(
                created.componentes.map((c) => ({ id_componente: c.id_componente, quantidade: c.quantidade })),
                insumoIdSet
              ),
            },
            ...prev,
          ])
        }
      }
      handleClear()
      setIsDialogOpen(false)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      if (!IS_MOCK) await receitasApi.delete(id)
      setReceitas((prev) => prev.filter((r) => r.id !== id))
    } catch (e: any) {
      setError(e.message)
    }
  }

  const handleEdit = (item: Receita) => {
    setEditingId(item.id)
    setNome(item.nome)
    setRendimento(item.rendimento?.toString() ?? "")
    setUnidade(item.unidade ?? "")
    setComponentes(item.componentes)
    setIsDialogOpen(true)
  }

  const onOpenNew = () => { handleClear(); setIsDialogOpen(true) }

  const handleClear = () => {
    setNome(""); setRendimento(""); setUnidade(""); setComponentes([]); setEditingId(null)
  }

  // Cost preview in the form (local calculation while user is editing)
  const calculateCusto = (comps: ReceitaComponente[]): number => {
    return comps.reduce((sum, c) => {
      if (c.tipo === "insumo") {
        const ins = availableInsumos.find((i) => i.id === c.insumoId)
        if (!ins || !ins.qtdRef) return sum
        return sum + (ins.precoRef / ins.qtdRef) * c.quantidade
      } else {
        const sub = receitas.find((r) => r.id === c.receitaId)
        if (!sub || sub.id === editingId) return sum
        const subCost = sub.custoTotal ?? calculateCusto(sub.componentes)
        return sum + (subCost / (sub.rendimento || 1)) * c.quantidade
      }
    }, 0)
  }

  const custoFormPreview = calculateCusto(componentes)

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <FadeUp>
      <div className="mb-10 flex items-center justify-between">
        <div>
          <p className="text-brand-muted text-[0.7rem] tracking-[0.28em] uppercase font-medium mb-2">Operação / Receitas</p>
          <h1 className="text-2xl md:text-3xl font-semibold leading-tight tracking-tight">Receitas</h1>
          <p className="text-brand-soft text-sm md:text-base mt-2 leading-relaxed max-w-lg">
            Monte receitas com insumos e outras receitas para calcular custo com precisão.
          </p>
        </div>
        <Button onClick={onOpenNew} className="hidden sm:flex bg-brand-primary text-brand-button-text hover:bg-brand-primary-hover shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Nova receita
        </Button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-sm px-4 py-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-red-400 text-xs">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300 text-xs">×</button>
        </div>
      )}

      {/* ── Edit/Create Dialog ─────────────────────────────────────────────── */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) handleClear() }}>
        <DialogContent className="max-w-2xl bg-brand-surface-2 border-brand-line/20 p-6 md:p-8 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-brand-text font-medium text-lg">
              {editingId ? "Editar receita" : "Nova receita"}
            </DialogTitle>
          </DialogHeader>

          {/* Basic fields */}
          <div className="grid sm:grid-cols-2 gap-5 mb-6">
            <div className="sm:col-span-2 space-y-2">
              <Label className="text-[0.76rem] text-brand-soft tracking-[0.03em]">Nome da receita</Label>
              <Input
                type="text" value={nome} onChange={(e) => setNome(e.target.value)}
                placeholder="Ex.: Risoto de camarão, Molho especial…"
                className="bg-brand-surface border-brand-line/35 focus-visible:ring-brand-highlight/10 focus-visible:border-brand-highlight/55"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[0.76rem] text-brand-soft tracking-[0.03em]">Rendimento (quantidade_base)</Label>
              <Input
                type="number" value={rendimento} onChange={(e) => setRendimento(e.target.value)}
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
                  {["porções", "kg", "g", "l", "ml", "un"].map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Composição */}
          <div className="mb-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <p className="text-brand-soft text-sm font-medium">Composição</p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => handleAddComponent("receita")}
                  className="border-brand-highlight/30 text-brand-highlight hover:bg-brand-highlight/10 hover:border-brand-highlight/45 hover:text-brand-highlight transition-colors h-8">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar receita
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => handleAddComponent("insumo")}
                  className="border-brand-highlight/30 text-brand-highlight hover:bg-brand-highlight/10 hover:border-brand-highlight/45 hover:text-brand-highlight transition-colors h-8">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar insumo
                </Button>
              </div>
            </div>

            {componentes.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center border border-dashed border-brand-line/25 rounded-[2px]">
                <p className="text-brand-muted text-xs text-center">Adicione os insumos ou receitas que compõem este preparo.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-[1fr_90px_70px_30px] gap-2 pb-1">
                  <span className="text-brand-muted text-[0.68rem] uppercase tracking-wide font-medium">Item</span>
                  <span className="text-brand-muted text-[0.68rem] uppercase tracking-wide font-medium">Qtd</span>
                  <span className="text-brand-muted text-[0.68rem] uppercase tracking-wide font-medium text-right pr-1">Custo</span>
                </div>
                {componentes.map((c, idx) => {
                  let cost = 0
                  let unitLabel = ""
                  if (c.tipo === "insumo") {
                    const ins = availableInsumos.find((i) => i.id === c.insumoId)
                    cost = ins && c.quantidade > 0 ? (ins.precoRef / (ins.qtdRef || 1)) * c.quantidade : 0
                    if (ins) unitLabel = ins.unidade
                  } else {
                    const sub = receitas.find((r) => r.id === c.receitaId)
                    const subCost = sub?.custoTotal ?? (sub ? calculateCusto(sub.componentes) : 0)
                    cost = sub && c.quantidade > 0 ? (subCost / (sub.rendimento || 1)) * c.quantidade : 0
                    if (sub) unitLabel = sub.unidade
                  }
                  return (
                    <FadeUp key={c.id} delay={idx * 0.05} className="grid grid-cols-[1fr_90px_70px_30px] gap-2 items-center pb-2 border-b border-brand-line/10 last:border-0 last:pb-0">
                      <Select
                        value={c.tipo === "insumo" ? (c.insumoId ? c.insumoId.toString() : "") : (c.receitaId ? c.receitaId.toString() : "")}
                        onValueChange={(val) => handleUpdateComponent(c.id, c.tipo === "insumo" ? "insumoId" : "receitaId", parseInt(val))}
                      >
                        <SelectTrigger className="w-full h-8 bg-brand-surface border-brand-line/35 text-xs focus:ring-brand-highlight/10 focus:border-brand-highlight/55">
                          <SelectValue placeholder={`Selecione ${c.tipo}…`} />
                        </SelectTrigger>
                        <SelectContent>
                          {c.tipo === "insumo"
                            ? availableInsumos.map((i) => (
                                <SelectItem key={i.id} value={i.id.toString()}>
                                  {i.nome}{i.unidade ? ` (${i.unidade})` : ""}
                                </SelectItem>
                              ))
                            : receitas.filter((r) => r.id !== editingId).map((r) => (
                                <SelectItem key={r.id} value={r.id.toString()}>
                                  {r.nome}{r.unidade ? ` (${r.unidade})` : ""}
                                </SelectItem>
                              ))}
                        </SelectContent>
                      </Select>
                      <div className="relative">
                        <Input
                          type="number"
                          value={c.quantidade || ""}
                          onChange={(e) => handleUpdateComponent(c.id, "quantidade", parseFloat(e.target.value))}
                          className="w-full h-8 bg-brand-surface border-brand-line/35 text-xs text-right pr-8 pl-2 focus-visible:ring-brand-highlight/10 focus-visible:border-brand-highlight/55"
                          placeholder="0"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-muted text-[0.65rem] pointer-events-none">{unitLabel}</span>
                      </div>
                      <span className="text-right text-xs text-brand-highlight font-medium tabular-nums pr-1">
                        {cost > 0 ? formatBRL(cost) : "—"}
                      </span>
                      <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveComponent(c.id)} className="h-7 w-7 text-brand-muted hover:text-red-400 ml-auto rounded-[2px]">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </FadeUp>
                  )
                })}
              </div>
            )}
          </div>

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

      {/* ── Table ──────────────────────────────────────────────────────────── */}
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
                      <TableHead className="font-medium h-10">Rendimento</TableHead>
                      <TableHead className="font-medium h-10">Custo Total</TableHead>
                      <TableHead className="font-medium text-right h-10">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receitas.map((item) => {
                      // Use backend-computed custo_total when available
                      const custo = item.custoTotal ?? calculateCusto(item.componentes)
                      return (
                        <TableRow key={item.id} className="border-b border-brand-line/10 hover:bg-brand-line/5 transition-colors">
                          <TableCell className="font-medium text-brand-text">{item.nome}</TableCell>
                          <TableCell className="text-brand-muted tabular-nums">
                            {item.rendimento ? `${item.rendimento} ${item.unidade}` : "—"}
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

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          <div className="bg-brand-surface-2 border border-brand-line/20 rounded-[2px] p-5">
            <p className="text-brand-muted text-[0.7rem] tracking-[0.12em] uppercase font-medium mb-3">Custo estimado</p>
            <p className="text-brand-highlight text-3xl font-light tabular-nums">{formatBRL(custoFormPreview)}</p>
            <p className="text-brand-muted text-xs mt-1">{componentes.filter((c) => (c.insumoId || c.receitaId) && c.quantidade > 0).length} itens na composição</p>
          </div>
          <div className="bg-brand-surface flex border border-brand-line/15 rounded-[2px] p-5 gap-3">
            <AlertCircle className="w-3.5 h-3.5 text-brand-highlight shrink-0 mt-0.5" />
            <p className="text-brand-muted text-xs leading-relaxed">
              {IS_MOCK
                ? "Modo demo — configure VITE_BACKEND_URL para conectar ao backend."
                : "O custo é calculado pelo backend com base nos insumos cadastrados."}
            </p>
          </div>
        </div>
      </div>
    </FadeUp>
  )
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}
