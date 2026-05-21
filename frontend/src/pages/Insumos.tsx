import { useEffect, useMemo, useState } from "react"
import { FadeUp } from "@/components/ui/fade-up"
import { AlertCircle, Edit2, Link2, Plus, Trash2 } from "lucide-react"
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
import { insumosApi, IS_MOCK } from "@/lib/api"
import { formatBRL, parseBRL } from "@/lib/format"

export interface Insumo {
  id: number
  nome: string
  unidade: string
  qtdRef: number
  precoRef: number
  idProdutoExterno: string
}

const UNIDADES = ["kg", "g", "l", "ml", "un", "lt", "pct", "cx"]

export default function Insumos() {
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const [nome, setNome] = useState("")
  const [unidade, setUnidade] = useState("")
  const [qtdRef, setQtdRef] = useState("")
  const [precoRef, setPrecoRef] = useState("")
  const [idProdutoExterno, setIdProdutoExterno] = useState("")

  useEffect(() => {
    insumosApi
      .list()
      .then((data) => {
        setInsumos(
          data.map((item) => ({
            id: item.id,
            nome: item.nome,
            unidade: item.unidade ?? "",
            qtdRef: item.quantidade_referencia ?? 0,
            precoRef: item.preco_referencia ?? 0,
            idProdutoExterno: item.id_produto_externo ?? "",
          }))
        )
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const parsedQtd = parseFloat(qtdRef)
  const parsedPreco = parseBRL(precoRef)
  const custoUn =
    !Number.isNaN(parsedQtd) && parsedQtd > 0 && parsedPreco !== null
      ? parsedPreco / parsedQtd
      : null

  const externalLinksCount = useMemo(
    () => insumos.filter((item) => item.idProdutoExterno.trim()).length,
    [insumos]
  )

  const breakdown = useMemo(() => {
    const acc: Record<string, number> = {}
    for (const item of insumos) {
      if (item.unidade) {
        acc[item.unidade] = (acc[item.unidade] || 0) + 1
      }
    }
    return Object.entries(acc).sort((a, b) => b[1] - a[1])
  }, [insumos])

  const handleSalvar = async () => {
    if (!nome || !unidade || !parsedQtd || parsedPreco === null) {
      return
    }

    const normalizedExternalId = idProdutoExterno.trim()
    setSaving(true)
    try {
      const payload = {
        nome,
        unidade,
        quantidade_referencia: parsedQtd,
        preco_referencia: parsedPreco,
        id_produto_externo: normalizedExternalId || null,
      }
      if (editingId) {
        await insumosApi.edit(editingId, payload)
        setInsumos((prev) =>
          prev.map((item) =>
            item.id === editingId
              ? {
                  ...item,
                  nome,
                  unidade,
                  qtdRef: parsedQtd,
                  precoRef: parsedPreco,
                  idProdutoExterno: normalizedExternalId,
                }
              : item
          )
        )
      } else {
        const res = await insumosApi.create(payload)
        setInsumos((prev) => [
          {
            id: res.id,
            nome,
            unidade,
            qtdRef: parsedQtd,
            precoRef: parsedPreco,
            idProdutoExterno: normalizedExternalId,
          },
          ...prev,
        ])
      }

      handleClear()
      setIsDialogOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar insumo.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      if (!IS_MOCK) {
        await insumosApi.delete(id)
      }
      setInsumos((prev) => prev.filter((item) => item.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao remover insumo.")
    }
  }

  const handleEdit = (item: Insumo) => {
    setEditingId(item.id)
    setNome(item.nome)
    setUnidade(item.unidade)
    setQtdRef(item.qtdRef.toString())
    setPrecoRef(item.precoRef.toString().replace(".", ","))
    setIdProdutoExterno(item.idProdutoExterno)
    setIsDialogOpen(true)
  }

  const handleClear = () => {
    setNome("")
    setUnidade("")
    setQtdRef("")
    setPrecoRef("")
    setIdProdutoExterno("")
    setEditingId(null)
  }

  const onOpenNew = () => {
    handleClear()
    setIsDialogOpen(true)
  }

  const renderForm = () => (
    <div className="grid sm:grid-cols-2 gap-5">
      <div className="sm:col-span-2 space-y-2">
        <Label className="text-[0.76rem] text-brand-soft tracking-[0.03em]">Nome do insumo</Label>
        <Input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex.: Filé de frango, Azeite extra virgem…"
          className="bg-brand-surface border-brand-line/35 focus-visible:ring-brand-highlight/10 focus-visible:border-brand-highlight/55"
        />
      </div>

      <div className="sm:col-span-2 space-y-2">
        <Label className="text-[0.76rem] text-brand-soft tracking-[0.03em]">ID do produto externo</Label>
        <Input
          type="text"
          value={idProdutoExterno}
          onChange={(e) => setIdProdutoExterno(e.target.value)}
          placeholder="Opcional. Ex.: SKU-FRANGO-001"
          className="bg-brand-surface border-brand-line/35 focus-visible:ring-brand-highlight/10 focus-visible:border-brand-highlight/55"
        />
        <p className="text-brand-muted text-[0.7rem] leading-relaxed">
          Use este campo para ligar o insumo a um `id_produto` vindo do arquivo de vendas.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-[0.76rem] text-brand-soft tracking-[0.03em]">Unidade de medida</Label>
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
        <Label className="text-[0.76rem] text-brand-soft tracking-[0.03em]">Quantidade de referência</Label>
        <Input
          type="number"
          value={qtdRef}
          onChange={(e) => setQtdRef(e.target.value)}
          placeholder="Ex.: 500, 1, 10"
          className="bg-brand-surface border-brand-line/35 focus-visible:ring-brand-highlight/10 focus-visible:border-brand-highlight/55"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-[0.76rem] text-brand-soft tracking-[0.03em]">Preço de referência</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted text-sm select-none z-10">R$</span>
          <Input
            type="text"
            value={precoRef}
            onChange={(e) => setPrecoRef(e.target.value.replace(/[^\d,]/g, ""))}
            className="pl-10 bg-brand-surface border-brand-line/35 focus-visible:ring-brand-highlight/10 focus-visible:border-brand-highlight/55"
            placeholder="0,00"
          />
        </div>
      </div>

      {custoUn !== null && (
        <div className="sm:col-span-2">
          <div className="bg-brand-surface border border-brand-line/20 rounded-[2px] px-4 py-3 flex items-center gap-2">
            <span className="text-brand-muted text-xs font-medium uppercase tracking-wide">Custo unitário:</span>
            <span className="text-brand-highlight text-sm font-semibold tabular-nums">
              {formatBRL(custoUn)}/{unidade || "un"}
            </span>
          </div>
        </div>
      )}
    </div>
  )

  const renderTable = () => (
    <div className="overflow-x-auto pb-4">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-brand-line/20 text-brand-muted text-[0.72rem] tracking-[0.08em] uppercase hover:bg-transparent">
            <TableHead className="font-medium h-10">Insumo</TableHead>
            <TableHead className="font-medium h-10">ID Externo</TableHead>
            <TableHead className="font-medium h-10">Unidade</TableHead>
            <TableHead className="font-medium h-10">Qtd Ref.</TableHead>
            <TableHead className="font-medium h-10">Preço Ref.</TableHead>
            <TableHead className="font-medium h-10">Custo/un</TableHead>
            <TableHead className="font-medium text-right h-10">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {insumos.map((item) => (
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
              <TableCell className="text-brand-muted">
                {item.unidade ? (
                  <span className="px-2 py-0.5 bg-brand-surface rounded-[2px] text-[0.72rem] font-medium border border-brand-line/20">
                    {item.unidade}
                  </span>
                ) : (
                  <span className="text-brand-muted/40 text-xs">—</span>
                )}
              </TableCell>
              <TableCell className="text-brand-muted tabular-nums">{item.qtdRef || "—"}</TableCell>
              <TableCell className="text-brand-text tabular-nums">
                {item.precoRef ? formatBRL(item.precoRef) : "—"}
              </TableCell>
              <TableCell className="text-brand-highlight font-medium tabular-nums">
                {item.qtdRef && item.precoRef
                  ? `${formatBRL(item.precoRef / item.qtdRef)}/${item.unidade}`
                  : "—"}
              </TableCell>
              <TableCell className="text-right py-2">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} className="h-8 w-8 text-brand-muted hover:text-brand-highlight transition-colors rounded-[2px]">
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 text-brand-muted hover:text-red-400 transition-colors rounded-[2px]">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )

  return (
    <FadeUp>
      <PageHeaderWithButton
        breadcrumb="Operação / Insumos"
        title="Insumos"
        description="Cadastre os itens que alimentam o cálculo de custo e, se fizer sentido, vincule o identificador externo usado nas vendas."
        buttonText="Novo insumo"
        buttonIcon={<Plus className="w-4 h-4 mr-2" />}
        onButtonClick={onOpenNew}
      />

      <ErrorAlert error={error} onDismiss={() => setError(null)} />

      <CRUDDialog
        open={isDialogOpen}
        title={editingId ? "Editar insumo" : "Novo insumo"}
        onSave={handleSalvar}
        saving={saving}
        disabled={!nome || !unidade || !parsedQtd || parsedPreco === null}
        onOpenChange={(open: boolean) => {
          setIsDialogOpen(open)
          if (!open) handleClear()
        }}
        saveText={editingId ? "Salvar alterações" : "Adicionar insumo"}
      >
        {renderForm()}
      </CRUDDialog>

      <ContentLayout
        main={
          <div className="flex flex-col gap-6">
            <div className="sm:hidden">
              <Button onClick={onOpenNew} className="w-full bg-brand-primary text-brand-button-text focus:ring-2 focus:ring-brand-highlight/20">
                <Plus className="w-4 h-4 mr-2" /> Novo insumo
              </Button>
            </div>

            <div className="bg-brand-surface-2 border border-brand-line/20 rounded-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-brand-line/15 flex items-center justify-between">
                <h2 className="text-brand-soft text-sm font-medium">Insumos cadastrados</h2>
                <span className="text-brand-muted text-xs">{insumos.length} itens</span>
              </div>

              {loading ? (
                <LoadingState type="spinner" message="Carregando insumos…" />
              ) : insumos.length === 0 ? (
                <LoadingState
                  type="empty"
                  message="Nenhum insumo cadastrado ainda."
                  icon={<AlertCircle className="w-10 h-10 text-brand-highlight opacity-30 mb-5" />}
                />
              ) : (
                renderTable()
              )}
            </div>
          </div>
        }
        sidebar={
          <StatsSidebar
            stats={[
              { label: "Total cadastrado", value: insumos.length, subtitle: "insumos na base" },
              { label: "Vínculos de venda", value: externalLinksCount, subtitle: "insumos com `id_produto_externo`" },
            ]}
          >
            <div className="bg-brand-surface border border-brand-line/15 rounded-[2px] p-5">
              <div className="flex items-start gap-3">
                <span className="text-brand-highlight mt-0.5 shrink-0">
                  <AlertCircle className="w-3.5 h-3.5" />
                </span>
                <p className="text-brand-muted text-xs leading-relaxed">
                  {IS_MOCK
                    ? "Modo demo — configure VITE_BACKEND_URL para conectar ao backend."
                    : "O vínculo externo é opcional e serve para cruzar o insumo com o arquivo de vendas por loja e por mês."}
                </p>
              </div>
            </div>

            {breakdown.length > 0 && (
              <div className="bg-brand-surface-2 border border-brand-line/20 rounded-[2px] p-5">
                <p className="text-brand-muted text-[0.7rem] tracking-[0.12em] uppercase font-medium mb-3">Por unidade</p>
                <div className="flex flex-col gap-2">
                  {breakdown.map(([unit, count]) => (
                    <div key={unit} className="flex items-center justify-between">
                      <span className="text-brand-soft text-xs font-medium">{unit}</span>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 rounded-full bg-brand-primary/60" style={{ width: Math.max(20, count * 18) }} />
                        <span className="text-brand-muted text-xs tabular-nums">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </StatsSidebar>
        }
      />
    </FadeUp>
  )
}