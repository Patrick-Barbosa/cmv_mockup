import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { AlertCircle, ArrowLeft, Box, ChevronRight, Layers, Link2, Loader2, Store } from "lucide-react"
import { FadeUp } from "@/components/ui/fade-up"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { IS_MOCK, receitasApi } from "@/lib/api"
import type { ProductSalesAnalysisResponse, ReceitaTreeDetalhe } from "@/lib/api"

type MetaNode = ReceitaTreeDetalhe

const mockTree: MetaNode = {
  id: 2,
  nome: "Brownie recheado",
  tipo: "receita",
  unidade: "un",
  quantidade: 1,
  id_produto_externo: "BROWNIE-001",
  children: [
    {
      id: 3,
      nome: "Brownie base",
      tipo: "receita",
      unidade: "kg",
      quantidade: 0.12,
      children: [
        {
          id: 10,
          nome: "Chocolate em po",
          tipo: "insumo",
          unidade: "g",
          quantidade: 30,
          custo: 0.038,
        },
        {
          id: 11,
          nome: "Farinha de trigo",
          tipo: "insumo",
          unidade: "g",
          quantidade: 60,
          custo: 0.0059,
        },
      ],
    },
    {
      id: 4,
      nome: "Brigadeiro",
      tipo: "receita",
      unidade: "kg",
      quantidade: 0.06,
      children: [
        {
          id: 12,
          nome: "Leite condensado",
          tipo: "insumo",
          unidade: "g",
          quantidade: 80,
          custo: 0.021,
        },
      ],
    },
  ],
}

const mockSalesAnalysis: ProductSalesAnalysisResponse = {
  produto: {
    id: 2,
    nome: "Brownie recheado",
    tipo: "receita",
    id_produto_externo: "BROWNIE-001",
    custo_unitario_ideal: 3.58,
  },
  possui_vinculo_externo: true,
  linhas: [
    {
      mes: "2026-04",
      loja_id: "RJ-COPA",
      quantidade_total: 24,
      valor_total: 300,
      preco_medio: 12.5,
      custo_unitario_ideal: 3.58,
      custo_ideal_total: 85.92,
      cmv_ideal_percentual: 28.64,
    },
    {
      mes: "2026-03",
      loja_id: "RJ-COPA",
      quantidade_total: 18,
      valor_total: 216,
      preco_medio: 12,
      custo_unitario_ideal: 3.58,
      custo_ideal_total: 64.44,
      cmv_ideal_percentual: 29.83,
    },
  ],
}

function calculateNodeCost(node: MetaNode): number {
  if (!node.children || node.children.length === 0) {
    return (node.custo || 0) * (node.quantidade || 0)
  }

  return node.children.reduce((sum, child) => sum + calculateNodeCost(child), 0)
}

function formatQtd(value: number) {
  return Number(value.toFixed(4)).toLocaleString("pt-BR")
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "—"
  }
  return `${value.toFixed(1)}%`
}

function TreeNode({ node }: { node: MetaNode }) {
  const [isOpen, setIsOpen] = useState(true)
  const isRecipe = node.tipo === "receita"
  const hasChildren = !!node.children && node.children.length > 0

  let costDisplay = ""
  if (isRecipe && hasChildren) {
    costDisplay = formatBRL(calculateNodeCost(node))
  } else if (!isRecipe && node.custo != null) {
    costDisplay = formatBRL(node.custo * (node.quantidade || 0))
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
              {formatQtd(node.quantidade)} {node.unidade || "un."}
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
          {node.children!.map((child, index) => (
            <TreeNode key={`${child.id}-${index}`} node={child} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function ReceitaDetalhe() {
  const { id } = useParams()

  const [receita, setReceita] = useState<MetaNode | null>(IS_MOCK ? mockTree : null)
  const [salesAnalysis, setSalesAnalysis] = useState<ProductSalesAnalysisResponse | null>(IS_MOCK ? mockSalesAnalysis : null)
  const [loading, setLoading] = useState(!IS_MOCK)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (IS_MOCK || !id) return

    setLoading(true)
    Promise.all([
      receitasApi.getTree(id),
      receitasApi.getSalesAnalysis(Number(id)),
    ])
      .then(([tree, analysis]) => {
        setReceita(tree)
        setSalesAnalysis(analysis)
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Erro ao carregar receita."))
      .finally(() => setLoading(false))
  }, [id])

  const totalCost = useMemo(() => (receita ? calculateNodeCost(receita) : 0), [receita])

  const sortedSummary = useMemo(() => {
    if (!receita) return []

    const leaves: MetaNode[] = []
    const collect = (node: MetaNode) => {
      if (!node.children || node.children.length === 0) {
        if (node.tipo === "insumo") {
          leaves.push(node)
        }
        return
      }
      node.children.forEach(collect)
    }

    collect(receita)

    const grouped = leaves.reduce((acc, current) => {
      const unit = current.unidade || "un."
      const key = `${current.id}-${unit}`
      if (!acc[key]) {
        acc[key] = {
          ...current,
          unidade: unit,
          totalCust: (current.custo || 0) * (current.quantidade || 0),
          totalQtd: current.quantidade || 0,
        }
      } else {
        acc[key].totalQtd += current.quantidade || 0
        acc[key].totalCust += (current.custo || 0) * (current.quantidade || 0)
      }
      return acc
    }, {} as Record<string, MetaNode & { totalCust: number; totalQtd: number }>)

    return Object.values(grouped).sort((a, b) => b.totalCust - a.totalCust)
  }, [receita])

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

  const latestSalesLine = salesAnalysis?.linhas[0] ?? null

  return (
    <div className="flex flex-col gap-6">
      <header className="-mt-4 mb-4">
        <Link to="/receitas" className="inline-flex items-center gap-2 text-brand-muted text-sm hover:text-brand-highlight transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar para receitas
        </Link>
      </header>

      <FadeUp className="mb-2">
        <h1 className="text-brand-text text-xl font-semibold mb-1">{receita.nome}</h1>
        <p className="text-brand-muted text-sm">
          Rendimento: {receita.quantidade ? formatQtd(receita.quantidade) : "—"} {receita.unidade || "un."}
          {receita.id_produto_externo ? ` · ID externo: ${receita.id_produto_externo}` : " · Sem vínculo externo"}
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

          <FadeUp delay={0.25} className="bg-brand-surface-2 border border-brand-line/20 rounded-sm p-5">
            <p className="text-brand-muted text-[0.7rem] tracking-[0.12em] uppercase font-medium mb-3">Vínculo de vendas</p>
            {salesAnalysis?.possui_vinculo_externo ? (
              <>
                <p className="text-brand-highlight text-sm font-medium inline-flex items-center gap-2">
                  <Link2 className="w-3.5 h-3.5" />
                  {salesAnalysis.produto.id_produto_externo}
                </p>
                <p className="text-brand-muted text-xs mt-2">
                  Custo ideal unitário: {salesAnalysis.produto.custo_unitario_ideal !== null ? formatBRL(salesAnalysis.produto.custo_unitario_ideal) : "—"}
                </p>
              </>
            ) : (
              <p className="text-brand-muted text-sm leading-relaxed">
                Esta receita ainda não possui `id_produto_externo`, então não entra no cruzamento de vendas por loja e por mês.
              </p>
            )}
          </FadeUp>

          <FadeUp delay={0.3} className="bg-brand-surface-2 border border-brand-line/20 rounded-sm p-5">
            <p className="text-brand-muted text-[0.7rem] tracking-[0.12em] uppercase font-medium mb-3">Última leitura de venda</p>
            {latestSalesLine ? (
              <>
                <p className="text-brand-highlight text-3xl font-light tabular-nums">
                  {latestSalesLine.preco_medio !== null ? formatBRL(latestSalesLine.preco_medio) : "—"}
                </p>
                <p className="text-brand-muted text-xs mt-1">{latestSalesLine.loja_id} · {latestSalesLine.mes}</p>
                <p className="text-brand-soft text-sm mt-3">
                  CMV ideal: <span className="text-brand-highlight font-medium">{formatPercent(latestSalesLine.cmv_ideal_percentual)}</span>
                </p>
              </>
            ) : (
              <p className="text-brand-muted text-sm leading-relaxed">
                Ainda não existem vendas mensais vinculadas para esta receita.
              </p>
            )}
          </FadeUp>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
        <FadeUp delay={0.35} className="bg-brand-surface-2 border border-brand-line/20 rounded-sm overflow-hidden">
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
                {sortedSummary.map((item, index) => (
                  <TableRow key={index} className="border-b border-brand-line/10 last:border-0 hover:bg-brand-line/5 transition-colors">
                    <TableCell className="py-2.5">
                      <span className="text-brand-soft text-sm">{item.nome}</span>
                      <span className="text-brand-muted text-xs ml-1">({item.unidade || "un."})</span>
                    </TableCell>
                    <TableCell className="py-2.5 text-right text-brand-muted tabular-nums text-sm">{formatQtd(item.totalQtd)}</TableCell>
                    <TableCell className="py-2.5 text-right"><span className="text-brand-highlight tabular-nums font-medium text-sm">{formatBRL(item.totalCust)}</span></TableCell>
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

        <FadeUp delay={0.4} className="bg-brand-surface-2 border border-brand-line/20 rounded-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-brand-line/15 flex items-center justify-between">
            <div>
              <p className="text-brand-muted text-[0.7rem] tracking-[0.12em] uppercase font-medium">Comparativo mensal por loja</p>
              <p className="text-brand-muted text-xs mt-1">Preço médio praticado vs. CMV ideal.</p>
            </div>
            <Store className="w-4 h-4 text-brand-highlight" />
          </div>

          {salesAnalysis && salesAnalysis.linhas.length > 0 ? (
            <div className="p-3">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-brand-line/20 text-brand-muted text-[0.68rem] tracking-[0.06em] uppercase hover:bg-transparent">
                    <TableHead className="py-2.5 font-medium h-8">Mês</TableHead>
                    <TableHead className="py-2.5 font-medium h-8">Loja</TableHead>
                    <TableHead className="py-2.5 font-medium h-8 text-right">Qtd</TableHead>
                    <TableHead className="py-2.5 font-medium h-8 text-right">Preço Médio</TableHead>
                    <TableHead className="py-2.5 font-medium h-8 text-right">Custo Ideal</TableHead>
                    <TableHead className="py-2.5 font-medium h-8 text-right">CMV Ideal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesAnalysis.linhas.map((line) => (
                    <TableRow key={`${line.mes}-${line.loja_id}`} className="border-b border-brand-line/10 last:border-0 hover:bg-brand-line/5 transition-colors">
                      <TableCell className="py-2.5 text-brand-soft text-sm">{line.mes}</TableCell>
                      <TableCell className="py-2.5 text-brand-muted text-sm">{line.loja_id}</TableCell>
                      <TableCell className="py-2.5 text-right text-brand-muted tabular-nums text-sm">{line.quantidade_total}</TableCell>
                      <TableCell className="py-2.5 text-right text-brand-text tabular-nums text-sm">{line.preco_medio !== null ? formatBRL(line.preco_medio) : "—"}</TableCell>
                      <TableCell className="py-2.5 text-right text-brand-highlight tabular-nums text-sm">{line.custo_unitario_ideal !== null ? formatBRL(line.custo_unitario_ideal) : "—"}</TableCell>
                      <TableCell className="py-2.5 text-right text-brand-highlight tabular-nums text-sm">{formatPercent(line.cmv_ideal_percentual)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-6">
              <p className="text-brand-soft text-sm font-medium mb-1">Nenhuma venda vinculada para exibir.</p>
              <p className="text-brand-muted text-xs">Importe vendas e vincule a receita com um `id_produto_externo` para habilitar esse comparativo.</p>
            </div>
          )}
        </FadeUp>
      </div>
    </div>
  )
}
