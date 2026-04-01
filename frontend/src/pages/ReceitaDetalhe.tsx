import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { FadeUp } from "@/components/ui/fade-up"
import { ArrowLeft, ChevronRight, Box, Layers } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

import { receitasApi, IS_MOCK } from "@/lib/api"
import type { ReceitaTreeDetalhe } from "@/lib/api"
import { Loader2, AlertCircle } from "lucide-react"

// MetaNode is the same structure as ReceitaTreeDetalhe from the backend
type MetaNode = ReceitaTreeDetalhe

const mockTree: MetaNode = {
  id: "r1",
  nome: "Molho de Tomate Rústico",
  tipo: "receita",
  unidade: "l",
  quantidade: 2,
  children: [
    {
      id: "i2",
      nome: "Azeite Extra Virgem",
      tipo: "insumo",
      unidade: "l",
      quantidade: 0.1,
      custo: 18.0
    },
    {
      id: "i3",
      nome: "Tomate Pelati",
      tipo: "insumo",
      unidade: "lt",
      quantidade: 2.5,
      custo: 45.0
    }
  ]
}

function calculateNodeCost(node: MetaNode): number {
  if (!node.children || node.children.length === 0) {
    return (node.custo || 0) * (node.quantidade || 0)
  }
  return node.children.reduce((sum, child) => sum + calculateNodeCost(child), 0)
}

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function TreeNode({ node }: { node: MetaNode }) {
  const [isOpen, setIsOpen] = useState(true)
  const isRecipe = node.tipo === "receita"
  const hasChildren = node.children && node.children.length > 0
  
  let costDisplay = ""
  if (isRecipe && hasChildren) {
    costDisplay = formatBRL(calculateNodeCost(node))
  } else if (!isRecipe && node.custo != null) {
    costDisplay = formatBRL((node.custo) * (node.quantidade || 0))
  }

  return (
    <div className="relative">
      <div 
        className={`flex items-center gap-2 py-[0.55rem] px-3 border-b border-brand-line/5 transition-colors ${
          isRecipe ? "cursor-pointer hover:bg-brand-highlight/5" : "hover:bg-brand-line/5"
        }`}
        onClick={() => isRecipe && hasChildren && setIsOpen(!isOpen)}
      >
        {isRecipe && hasChildren ? (
          <Button variant="outline" size="icon" className={`w-[18px] h-[18px] rounded-sm transition-all shrink-0 ${isOpen ? "bg-brand-highlight/10 border-brand-highlight/30 text-brand-highlight tracking-widest hover:bg-brand-highlight/20 hover:text-brand-highlight" : "border-brand-line/30 text-brand-muted hover:border-brand-highlight hover:text-brand-highlight hover:bg-transparent"}`}>
            <ChevronRight className={`w-3 h-3 transition-transform ${isOpen ? "rotate-90" : ""}`} />
          </Button>
        ) : <span className="w-[18px] shrink-0" />}

        {isRecipe ? <Layers className="w-[13px] h-[13px] text-brand-highlight shrink-0" /> : <Box className="w-[13px] h-[13px] text-brand-muted shrink-0" />}
        
        <span className={`text-sm ${isRecipe ? "text-brand-soft font-medium" : "text-brand-text"}`}>
          {node.nome}
        </span>
        <span className={`px-1.5 py-0.5 text-[0.65rem] font-medium rounded-sm border ${
          isRecipe ? "bg-brand-primary/15 text-brand-highlight border-brand-primary/20" : "bg-brand-surface text-brand-muted border-brand-line/20"
        }`}>
          {node.tipo}
        </span>

        <div className="ml-auto flex items-center gap-4 text-[0.78rem]">
          {node.quantidade != null && (
            <span className="text-brand-muted tabular-nums text-xs">
              {node.quantidade} {node.unidade}
            </span>
          )}
          {costDisplay && (
            <span className="text-brand-highlight tabular-nums font-medium text-xs w-16 text-right">
              {costDisplay}
            </span>
          )}
        </div>
      </div>

      {hasChildren && isOpen && (
        <div className="ml-5 border-l border-brand-line/15">
          {node.children!.map((child, idx) => (
            <TreeNode key={`${child.id}-${idx}`} node={child} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function ReceitaDetalhe() {
  const { id } = useParams()
  
  const [receita, setReceita] = useState<MetaNode | null>(IS_MOCK ? mockTree as MetaNode : null)
  const [loading, setLoading] = useState(!IS_MOCK)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (IS_MOCK || !id) return
    
    receitasApi.getTree(id)
      .then((data) => setReceita(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <FadeUp className="flex items-center justify-center py-20 gap-3 text-brand-muted">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="text-sm">Carregando detalhes da receita...</span>
      </FadeUp>
    )
  }

  if (error) {
    return (
      <FadeUp className="flex flex-col gap-6">
        <div className="bg-red-500/10 border border-red-500/20 rounded-sm px-6 py-5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <h2 className="text-red-500 font-medium pb-1">Erro ao carregar receita</h2>
            <p className="text-red-400 text-sm leading-relaxed">{error}</p>
            <div className="mt-3">
              <Link to="/receitas" className="inline-flex items-center text-red-400 text-sm hover:text-red-300 transition-colors underline underline-offset-2">
                Voltar para receitas
              </Link>
            </div>
          </div>
        </div>
      </FadeUp>
    )
  }

  if (!receita) return null

  const totalCost = calculateNodeCost(receita)

  // flatten insumos
  const leaves: MetaNode[] = []
  const collect = (n: MetaNode) => {
    if (!n.children || n.children.length === 0) {
      if (n.tipo === "insumo") leaves.push(n)
    } else {
      n.children.forEach(collect)
    }
  }
  collect(receita)

  const summary = leaves.reduce((acc, curr) => {
    const key = `${curr.id}-${curr.unidade}`
    if (!acc[key]) {
      acc[key] = { ...curr, totalCust: (curr.custo || 0) * (curr.quantidade || 0), totalQtd: curr.quantidade || 0 }
    } else {
      acc[key].totalQtd += curr.quantidade || 0
      acc[key].totalCust += (curr.custo || 0) * (curr.quantidade || 0)
    }
    return acc
  }, {} as Record<string, typeof leaves[0] & { totalCust: number, totalQtd: number }>)

  const sortedSummary = Object.values(summary).sort((a,b) => b.totalCust - a.totalCust)

  return (
    <div className="flex flex-col gap-6">
      <header className="-mt-4 mb-4">
        <Link to="/receitas" className="inline-flex items-center gap-2 text-brand-muted text-sm hover:text-brand-highlight transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar para receitas
        </Link>
      </header>

      <FadeUp className="mb-8">
        <h1 className="text-brand-text text-xl font-semibold mb-1">{receita.nome}</h1>
        <p className="text-brand-muted text-sm">
          Rendimento: {receita.quantidade || "—"} {receita.unidade || ""} · Tipo: Receita ID {id}
        </p>
      </FadeUp>

      <div className="grid lg:grid-cols-3 gap-6">
        <FadeUp delay={0.1} className="lg:col-span-2">
          <div className="bg-brand-surface-2 border border-brand-line/20 rounded-sm overflow-hidden pb-2">
            <div className="px-6 py-4 border-b border-brand-line/15 flex items-center justify-between">
              <h2 className="text-brand-soft text-sm font-medium">Composição da receita</h2>
            </div>
            <div className="p-2">
              <TreeNode node={receita} />
            </div>
          </div>
        </FadeUp>

        <div className="flex flex-col gap-4">
          <FadeUp delay={0.2} className="bg-brand-surface-2 border border-brand-line/20 rounded-sm p-5">
            <p className="text-brand-muted text-[0.7rem] tracking-[0.12em] uppercase font-medium mb-3">Custo total</p>
            <p className="text-brand-highlight text-3xl font-light tabular-nums">{formatBRL(totalCost)}</p>
          </FadeUp>

          <FadeUp delay={0.3} className="bg-brand-surface-2 border border-brand-line/20 rounded-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-brand-line/15">
              <p className="text-brand-muted text-[0.7rem] tracking-[0.12em] uppercase font-medium">Todos os insumos (folha)</p>
            </div>
            <div className="p-3">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-brand-line/20 text-brand-muted text-[0.68rem] tracking-[0.06em] uppercase hover:bg-transparent">
                    <TableHead className="py-2.5 font-medium h-8">Insumo</TableHead>
                    <TableHead className="py-2.5 font-medium h-8 text-right">Qtd</TableHead>
                    <TableHead className="py-2.5 font-medium h-8 text-right">Custo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedSummary.map((s, idx) => (
                    <TableRow key={idx} className="border-b border-brand-line/10 last:border-0 hover:bg-brand-line/5 transition-colors">
                      <TableCell className="py-2.5">
                        <span className="text-brand-soft text-sm">{s.nome}</span>
                        <span className="text-brand-muted text-xs ml-1">({s.unidade || "—"})</span>
                      </TableCell>
                      <TableCell className="py-2.5 text-right text-brand-muted tabular-nums text-sm">{s.totalQtd}</TableCell>
                      <TableCell className="py-2.5 text-right"><span className="text-brand-highlight tabular-nums font-medium text-sm">{formatBRL(s.totalCust)}</span></TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={2} className="py-3 px-1 text-brand-muted text-xs font-semibold border-t border-brand-line/25">Total</TableCell>
                    <TableCell className="py-3 px-1 text-right text-brand-highlight tabular-nums font-semibold border-t border-brand-line/25">{formatBRL(totalCost)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </FadeUp>
        </div>
      </div>
    </div>
  )
}


