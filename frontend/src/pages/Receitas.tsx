import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { AlertCircle, Edit2, Eye, Link2, Plus, Trash2 } from "lucide-react"
import { FadeUp } from "@/components/ui/fade-up"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  PageHeaderWithButton,
  ErrorAlert,
  LoadingState,
  ContentLayout,
  StatsSidebar,
  CRUDDialog,
} from "@/components/common"
import { insumosApi, receitasApi } from "@/lib/api"
import { formatBRL } from "@/lib/format"
import type { Insumo } from "./Insumos"

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
  precoVenda?: number | null
}

function mapApiComponentes(apiComps: { id_componente: number; quantidade: number }[], insumoIds: Set<number>): ReceitaComponente[] {
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

const UNIDADES = ["porções", "kg", "g", "l", "ml", "un", "pct"]

export default function Receitas() {
  const [receitas, setReceitas] = useState<Receita[]>([])
  const [availableInsumos, setAvailableInsumos] = useState<Insumo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const [nome, setNome] = useState("")
  const [rendimento, setRendimento] = useState("")
  const [unidade, setUnidade] = useState("")
  const [idProdutoExterno, setIdProdutoExterno] = useState("")
  const [precoVenda, setPrecoVenda] = useState("")
  const [componentes, setComponentes] = useState<ReceitaComponente[]>([])

  useEffect(() => {
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

        setReceitas(
          detalhes.map((detalhe) => ({
            id: detalhe.id,
            nome: detalhe.nome,
            rendimento: detalhe.quantidade_base ?? 0,
            unidade: detalhe.unidade ?? "",
            custoTotal: detalhe.custo_total,
            idProdutoExterno: detalhe.id_produto_externo ?? "",
            precoVenda: detalhe.preco_venda ?? null,
            componentes: mapApiComponentes(
              detalhe.componentes.map((component) => ({
                id_componente: component.id_componente,
                quantidade: component.quantidade,
              })),
              insumoIdSet
            ),
          }))
        )
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao carregar receitas.")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const parsedRendimento = parseFloat(rendimento)
  const linkedRecipes = useMemo(() => receitas.filter((receita) => receita.idProdutoExterno.trim()).length, [receitas])

  const handleAddComponent = (tipo: "insumo" | "receita") => {
    setComponentes((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2, 9),
        tipo,
        insumoId: tipo === "insumo" ? 0 : undefined,
        receitaId: tipo === "receita" ? 0 : undefined,
        quantidade: 0,
      },
    ])
  }

  const handleUpdateComponent = (id: string, field: "insumoId" | "receitaId" | "quantidade", value: number) => {
    setComponentes((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const handleRemoveComponent = (id: string) => {
    setComponentes((prev) => prev.filter((item) => item.id !== id))
  }

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
      (component) => (component.tipo === "insumo" ? !!component.insumoId : !!component.receitaId) && component.quantidade > 0
    )

    if (!nome || !parsedRendimento || validComps.length === 0) {
      return
    }

    const normalizedExternalId = idProdutoExterno.trim()
    setSaving(true)
    try {
      const payload = {
        nome,
        quantidade_base: parsedRendimento,
        unidade: unidade || undefined,
        id_produto_externo: normalizedExternalId || null,
        preco_venda: precoVenda ? parseFloat(precoVenda) : null,
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
                  precoVenda: updated.preco_venda ?? null,
                  componentes: mapApiComponentes(
                    updated.componentes.map((component) => ({
                      id_componente: component.id_componente,
                      quantidade: component.quantidade,
                    })),
                    insumoIdSet
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
            precoVenda: created.preco_venda ?? null,
            componentes: mapApiComponentes(
              created.componentes.map((component) => ({
                id_componente: component.id_componente,
                quantidade: component.quantidade,
              })),
              insumoIdSet
            ),
          },
          ...prev,
        ])
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
      await receitasApi.delete(id)
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
    setPrecoVenda(item.precoVenda?.toString() ?? "")
    setComponentes(item.componentes)
    setIsDialogOpen(true)
  }

  const handleClear = () => {
    setNome("")
    setRendimento("")
    setUnidade("")
    setIdProdutoExterno("")
    setPrecoVenda("")
    setComponentes([])
    setEditingId(null)
  }

  const onOpenNew = () => {
    handleClear()
    setIsDialogOpen(true)
  }

  const validComps = componentes.filter((c) => (c.tipo === "insumo" ? !!c.insumoId : !!c.receitaId) && c.quantidade > 0)
  const isFormValid = nome && parsedRendimento && validComps.length > 0

  return (
    <FadeUp>
      <PageHeaderWithButton
        breadcrumb="Operação / Receitas"
        title="Receitas"
        description="Monte receitas com insumos e outras receitas, calcule o custo ideal e conecte os produtos vendidos pelo identificador externo."
        buttonText="Nova receita"
        buttonIcon={<Plus className="w-4 h-4 mr-2" />}
        onButtonClick={onOpenNew}
      />

      <ErrorAlert error={error} onDismiss={() => setError(null)} />

      <CRUDDialog
        open={isDialogOpen}
        title={editingId ? "Editar receita" : "Nova receita"}
        onSave={handleSalvar}
        saving={saving}
        disabled={!isFormValid}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) handleClear()
        }}
        saveText={editingId ? "Salvar alterações" : "Adicionar receita"}
        maxWidth="2xl"
      >
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
            <p className="text-brand-muted text-[0.7rem] leading-relaxed">Esse campo permite relacionar a receita às vendas importadas por produto e loja.</p>
          </div>

          <div className="space-y-2">
            <Label className="text-[0.76rem] text-brand-soft tracking-[0.03em]">Rendimento</Label>
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
                {UNIDADES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[0.76rem] text-brand-soft tracking-[0.03em]">Preço de Venda (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={precoVenda}
              onChange={(e) => setPrecoVenda(e.target.value)}
              placeholder="Ex.: 28,90"
              className="bg-brand-surface border-brand-line/35 focus-visible:ring-brand-highlight/10 focus-visible:border-brand-highlight/55"
            />
            <p className="text-brand-muted text-[0.7rem] leading-relaxed">Opcional. Usado no Simulador para simular impacto no preço de venda.</p>
          </div>
        </div>

        <div className="mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <p className="text-brand-soft text-sm font-medium">Composição</p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => handleAddComponent("receita")} className="border-brand-highlight/30 text-brand-highlight hover:bg-brand-highlight/10 hover:border-brand-highlight/45 hover:text-brand-highlight transition-colors h-8">
                <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar receita
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => handleAddComponent("insumo")} className="border-brand-highlight/30 text-brand-highlight hover:bg-brand-highlight/10 hover:border-brand-highlight/45 hover:text-brand-highlight transition-colors h-8">
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
              {componentes.map((component, index) => {
                let cost = 0
                let unitLabel = ""

                if (component.tipo === "insumo") {
                  const insumo = availableInsumos.find((item) => item.id === component.insumoId)
                  cost = insumo && component.quantidade > 0 ? (insumo.precoRef / (insumo.qtdRef || 1)) * component.quantidade : 0
                  if (insumo) unitLabel = insumo.unidade
                } else {
                  const subReceita = receitas.find((item) => item.id === component.receitaId)
                  const subCost = subReceita?.custoTotal ?? (subReceita ? calculateCusto(subReceita.componentes) : 0)
                  cost = subReceita && component.quantidade > 0 ? (subCost / (subReceita.rendimento || 1)) * component.quantidade : 0
                  if (subReceita) unitLabel = subReceita.unidade
                }

                return (
                  <FadeUp key={component.id} delay={index * 0.05} className="grid grid-cols-[1fr_90px_70px_30px] gap-2 items-center pb-2 border-b border-brand-line/10 last:border-0 last:pb-0">
                    <Select
                      value={component.tipo === "insumo" ? (component.insumoId ? component.insumoId.toString() : "") : component.receitaId ? component.receitaId.toString() : ""}
                      onValueChange={(value) => handleUpdateComponent(component.id, component.tipo === "insumo" ? "insumoId" : "receitaId", parseInt(value, 10))}
                    >
                      <SelectTrigger className="w-full h-8 bg-brand-surface border-brand-line/35 text-xs focus:ring-brand-highlight/10 focus:border-brand-highlight/55">
                        <SelectValue placeholder={`Selecione ${component.tipo}…`} />
                      </SelectTrigger>
                      <SelectContent>
                        {component.tipo === "insumo"
                          ? availableInsumos.map((item) => (
                              <SelectItem key={item.id} value={item.id.toString()}>
                                {item.nome}{item.unidade ? ` (${item.unidade})` : ""}
                              </SelectItem>
                            ))
                          : receitas.filter((item) => item.id !== editingId).map((item) => (
                              <SelectItem key={item.id} value={item.id.toString()}>
                                {item.nome}{item.unidade ? ` (${item.unidade})` : ""}
                              </SelectItem>
                            ))}
                      </SelectContent>
                    </Select>
                    <div className="relative">
                      <Input
                        type="number"
                        value={component.quantidade || ""}
                        onChange={(e) => handleUpdateComponent(component.id, "quantidade", parseFloat(e.target.value))}
                        className="w-full h-8 bg-brand-surface border-brand-line/35 text-xs text-right pr-8 pl-2 focus-visible:ring-brand-highlight/10 focus-visible:border-brand-highlight/55"
                        placeholder="0"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-muted text-[0.65rem] pointer-events-none">{unitLabel}</span>
                    </div>
                    <span className="text-right text-xs text-brand-highlight font-medium tabular-nums pr-1">{cost > 0 ? formatBRL(cost) : "—"}</span>
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveComponent(component.id)} className="h-7 w-7 text-brand-muted hover:text-red-400 ml-auto rounded-[2px]">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </FadeUp>
                )
              })}
            </div>
          )}
        </div>
      </CRUDDialog>

      <ContentLayout
        main={
          <div className="flex flex-col gap-6">
            <div className="sm:hidden">
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
                <LoadingState type="spinner" message="Carregando receitas…" />
              ) : receitas.length === 0 ? (
                <LoadingState
                  type="empty"
                  message="Nenhuma receita cadastrada ainda."
                  icon={<AlertCircle className="w-10 h-10 text-brand-highlight opacity-30 mb-5" />}
                />
              ) : (
                <div className="overflow-x-auto pb-4">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-brand-line/20 text-brand-muted text-[0.72rem] tracking-[0.08em] uppercase hover:bg-transparent">
                        <TableHead className="font-medium h-10">Receita</TableHead>
                        <TableHead className="font-medium h-10">ID Externo</TableHead>
                        <TableHead className="font-medium h-10">Rendimento</TableHead>
                        <TableHead className="font-medium h-10">Custo Total</TableHead>
                        <TableHead className="font-medium h-10">Preço Venda</TableHead>
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
                              {item.idProdutoExterno ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-highlight/10 text-brand-highlight rounded-[2px] text-[0.72rem] font-medium border border-brand-highlight/20">
                                  <Link2 className="w-3 h-3" />
                                  {item.idProdutoExterno}
                                </span>
                              ) : (
                                <span className="text-brand-muted/40 text-xs">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-brand-muted tabular-nums">{item.rendimento ? `${item.rendimento} ${item.unidade || "un."}` : "—"}</TableCell>
                            <TableCell className="text-brand-highlight font-medium tabular-nums">{custo > 0 ? formatBRL(custo) : "—"}</TableCell>
                            <TableCell className="text-brand-highlight font-medium tabular-nums">{item.precoVenda ? formatBRL(item.precoVenda) : "—"}</TableCell>
                            <TableCell className="text-right py-2">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-brand-muted hover:text-brand-highlight hover:bg-transparent transition-colors rounded-[2px]" title="Ver detalhes">
                                  <Link to={`/receitas/${item.id}`}>
                                    <Eye className="w-3.5 h-3.5" />
                                  </Link>
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
        }
        sidebar={
          <StatsSidebar
            stats={[
              { label: "Custo estimado", value: formatBRL(custoFormPreview), subtitle: `${componentes.filter((item) => (item.insumoId || item.receitaId) && item.quantidade > 0).length} itens na composição` },
              { label: "Produtos vinculados", value: linkedRecipes, subtitle: "receitas com `id_produto_externo`" },
            ]}
          >
            <div className="bg-brand-surface flex border border-brand-line/15 rounded-[2px] p-5 gap-3">
              <AlertCircle className="w-3.5 h-3.5 text-brand-highlight shrink-0 mt-0.5" />
              <p className="text-brand-muted text-xs leading-relaxed">As receitas vinculadas passam a aparecer nas análises mensais de vendas por loja e no detalhe da própria receita.</p>
            </div>
          </StatsSidebar>
        }
      />
    </FadeUp>
  )
}