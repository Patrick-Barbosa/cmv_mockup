import { useState, useMemo } from "react"
import { FadeUp } from "@/components/ui/fade-up"
import { Edit2, Trash2, AlertCircle, Plus } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Simple mock state management inside component based on user request (keep it simple, simple cache is enough)
export interface Insumo {
  id: number
  nome: string
  unidade: string
  qtdRef: number
  precoRef: number
}

const mockInsumos: Insumo[] = [
  { id: 1, nome: "Filé de Frango", unidade: "kg", qtdRef: 1, precoRef: 22.5 },
  { id: 2, nome: "Azeite Extra Virgem", unidade: "l", qtdRef: 5, precoRef: 180.0 },
  { id: 3, nome: "Tomate Pelati", unidade: "lt", qtdRef: 2.5, precoRef: 45.0 }
]

export default function Insumos() {
  const [insumos, setInsumos] = useState<Insumo[]>(mockInsumos)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  const [nome, setNome] = useState("")
  const [unidade, setUnidade] = useState("")
  const [qtdRef, setQtdRef] = useState("")
  const [precoRef, setPrecoRef] = useState("")

  const parsedQtd = parseFloat(qtdRef)
  const parsedPreco = parseFloat(precoRef.replace(",", "."))
  
  const custoUn = !isNaN(parsedQtd) && parsedQtd > 0 && !isNaN(parsedPreco)
    ? parsedPreco / parsedQtd
    : null

  const handleSalvar = () => {
    if (!nome || !unidade || !parsedQtd || isNaN(parsedPreco)) return

    const newData: Insumo = {
      id: editingId ? editingId : Date.now(),
      nome,
      unidade,
      qtdRef: parsedQtd,
      precoRef: parsedPreco
    }

    if (editingId) {
      setInsumos(insumos.map(i => i.id === editingId ? newData : i))
      setEditingId(null)
    } else {
      setInsumos([newData, ...insumos])
    }
    handleClear()
    setIsDialogOpen(false)
  }

  const onOpenNew = () => {
    handleClear()
    setIsDialogOpen(true)
  }

  const handleEdit = (item: Insumo) => {
    setEditingId(item.id)
    setNome(item.nome)
    setUnidade(item.unidade)
    setQtdRef(item.qtdRef.toString())
    setPrecoRef(item.precoRef.toString().replace(".", ","))
    setIsDialogOpen(true)
  }

  const handleDelete = (id: number) => {
    setInsumos(insumos.filter(i => i.id !== id))
  }

  const handleClear = () => {
    setNome("")
    setUnidade("")
    setQtdRef("")
    setPrecoRef("")
    setEditingId(null)
  }

  const breakdown = useMemo(() => {
    const acc: Record<string, number> = {}
    insumos.forEach(i => { acc[i.unidade] = (acc[i.unidade] || 0) + 1 })
    return Object.entries(acc).sort((a, b) => b[1] - a[1])
  }, [insumos])

  return (
    <FadeUp>
      <div className="mb-10 flex items-center justify-between">
        <div>
          <p className="text-brand-muted text-[0.7rem] tracking-[0.28em] uppercase font-medium mb-2">Operação / Insumos</p>
          <h1 className="text-2xl md:text-3xl font-semibold leading-tight tracking-tight">Insumos</h1>
          <p className="text-brand-soft text-sm md:text-base mt-2 leading-relaxed max-w-lg">
            Cadastre os itens que alimentam o cálculo de custo da operação.
          </p>
        </div>
        <Button onClick={onOpenNew} className="hidden sm:flex bg-brand-primary text-brand-button-text hover:bg-brand-primary-hover shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          Novo insumo
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open)
        if (!open) handleClear()
      }}>
        <DialogContent className="max-w-2xl bg-brand-surface-2 border-brand-line/20 p-6 md:p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-brand-text font-medium text-lg">
              {editingId ? "Editar insumo" : "Novo insumo"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2 space-y-2">
                <Label className="text-[0.76rem] text-brand-soft tracking-[0.03em]">Nome do insumo</Label>
                <Input
                  type="text"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Ex.: Filé de frango, Azeite extra virgem…"
                  className="bg-brand-surface border-brand-line/35 focus-visible:ring-brand-highlight/10 focus-visible:border-brand-highlight/55"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[0.76rem] text-brand-soft tracking-[0.03em]">Unidade de medida</Label>
                <Select value={unidade} onValueChange={setUnidade}>
                  <SelectTrigger className="w-full bg-brand-surface border-brand-line/35 focus:ring-brand-highlight/10 focus:border-brand-highlight/55 h-10">
                    <SelectValue placeholder="Selecione…" />
                  </SelectTrigger>
                  <SelectContent>
                    {["kg", "g", "l", "ml", "un", "lt", "cx"].map(u => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[0.76rem] text-brand-soft tracking-[0.03em]">Quantidade de referência</Label>
                <Input
                  type="number"
                  value={qtdRef}
                  onChange={e => setQtdRef(e.target.value)}
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
                    onChange={e => {
                      const v = e.target.value.replace(/[^\d,]/g, '')
                      setPrecoRef(v)
                    }}
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
                      {custoUn.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/{unidade || 'un'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-brand-muted hover:text-brand-soft">
                Cancelar
              </Button>
              <Button 
                onClick={handleSalvar}
                className="bg-brand-primary text-brand-button-text hover:bg-brand-primary-hover hover:shadow-[0_0_16px_rgba(201,76,182,.14),0_0_6px_rgba(94,111,55,.2)]"
              >
                {editingId ? "Salvar alterações" : "Adicionar insumo"}
              </Button>
            </div>
        </DialogContent>
      </Dialog>

      <div className="grid lg:grid-cols-[1fr_280px] gap-8 items-start">
        <div className="flex flex-col gap-6">
          <div className="sm:hidden mb-2">
            <Button onClick={onOpenNew} className="w-full bg-brand-primary text-brand-button-text focus:ring-2 focus:ring-brand-highlight/20">
              <Plus className="w-4 h-4 mr-2" /> Novo insumo
            </Button>
          </div>
          {/* Table */}
          <div className="bg-brand-surface-2 border border-brand-line/20 rounded-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-brand-line/15 flex items-center justify-between">
              <h2 className="text-brand-soft text-sm font-medium">Insumos cadastrados</h2>
              <span className="text-brand-muted text-xs">{insumos.length} itens</span>
            </div>

            {insumos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6">
                 <AlertCircle className="w-10 h-10 text-brand-highlight opacity-30 mb-5" />
                 <p className="text-brand-soft text-sm font-medium mb-1 text-center">Nenhum insumo cadastrado ainda.</p>
                 <p className="text-brand-muted text-xs text-center max-w-xs leading-relaxed">Comece pela base de custos da sua operação.</p>
              </div>
            ) : (
              <div className="overflow-x-auto pb-4">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-brand-line/20 text-brand-muted text-[0.72rem] tracking-[0.08em] uppercase hover:bg-transparent">
                      <TableHead className="font-medium h-10">Insumo</TableHead>
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
                          <span className="px-2 py-0.5 bg-brand-surface rounded-[2px] text-[0.72rem] font-medium border border-brand-line/20">
                            {item.unidade}
                          </span>
                        </TableCell>
                        <TableCell className="text-brand-muted tabular-nums">{item.qtdRef}</TableCell>
                        <TableCell className="text-brand-text tabular-nums">
                          {item.precoRef.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </TableCell>
                        <TableCell className="text-brand-highlight font-medium tabular-nums">
                          {(item.precoRef / item.qtdRef).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/{item.unidade}
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
            )}
          </div>
        </div>

        {/* Right Sidebar Stats */}
        <div className="flex flex-col gap-4">
          <div className="bg-brand-surface-2 border border-brand-line/20 rounded-[2px] p-5">
            <p className="text-brand-muted text-[0.7rem] tracking-[0.12em] uppercase font-medium mb-3">Total cadastrado</p>
            <p className="text-brand-highlight text-3xl font-light tabular-nums">{insumos.length}</p>
            <p className="text-brand-muted text-xs mt-1">insumos na base</p>
          </div>
          <div className="bg-brand-surface border border-brand-line/15 rounded-[2px] p-5">
            <div className="flex items-start gap-3">
              <span className="text-brand-highlight mt-0.5 shrink-0">
                <AlertCircle className="w-3.5 h-3.5" />
              </span>
              <p className="text-brand-muted text-xs leading-relaxed">
                Cada insumo cadastrado aqui alimenta automaticamente o cálculo de custo das receitas.
              </p>
            </div>
          </div>
          
          {breakdown.length > 0 && (
            <div className="bg-brand-surface-2 border border-brand-line/20 rounded-[2px] p-5">
              <p className="text-brand-muted text-[0.7rem] tracking-[0.12em] uppercase font-medium mb-3">Por unidade</p>
              <div className="flex flex-col gap-2">
                {breakdown.map(([u, c]) => (
                 <div key={u} className="flex items-center justify-between">
                   <span className="text-brand-soft text-xs font-medium">{u}</span>
                   <div className="flex items-center gap-2">
                     <div className="h-1.5 rounded-full bg-brand-primary/60" style={{ width: Math.max(20, c * 18) }} />
                     <span className="text-brand-muted text-xs tabular-nums">{c}</span>
                   </div>
                 </div> 
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </FadeUp>
  )
}


