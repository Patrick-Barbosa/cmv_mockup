import { useEffect, useState } from "react"
import { AlertCircle, ArrowLeft, Check, ChevronRight, Loader2, Search, Unlink, Link2 } from "lucide-react"
import { Link } from "react-router-dom"
import { FadeUp } from "@/components/ui/fade-up"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { motion, AnimatePresence } from "framer-motion"
import { vendasApi, commonApi, insumosApi, receitasApi, IS_MOCK } from "@/lib/api"
import type { SkuAusente } from "@/lib/api"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// MOCK DATA
const MOCK_SKUS: SkuAusente[] = [
  { id_produto_externo: "SKU-XPTO-001", quantidade_total: 150, valor_total: 4500.50, vendas_count: 12 },
  { id_produto_externo: "SKU-BACON-PREMIUM", quantidade_total: 85, valor_total: 2125.00, vendas_count: 45 },
  { id_produto_externo: "REFRI-LATA-350", quantidade_total: 1200, valor_total: 7200.00, vendas_count: 310 },
  { id_produto_externo: "SAUCE-SPECIAL-01", quantidade_total: 40, valor_total: 160.00, vendas_count: 8 },
]

interface SkuRowProps {
  sku: SkuAusente
  onAssociate: (sku: SkuAusente) => void
}

function SkuRow({ sku, onAssociate }: SkuRowProps) {
  return (
    <motion.tr
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ 
        height: 0, 
        opacity: 0,
        transition: { 
          height: { delay: 0.35, duration: 0.3, ease: "circOut" },
          opacity: { duration: 0.2 }
        }
      }}
      className="border-none group overflow-hidden"
    >
      <td colSpan={5} className="p-0 border-none">
        <motion.div
          exit={{ 
            clipPath: "inset(0 100% 0 0)",
            transition: { duration: 0.4, ease: [0.4, 0, 0.6, 1] } 
          }}
          style={{ 
            display: "table", 
            width: "100%", 
            tableLayout: "fixed",
            clipPath: "inset(0 0% 0 0)"
          }}
        >
          <div style={{ display: "table-row" }}>
            <div className="table-cell px-6 py-4 align-middle border-b border-brand-line/10 w-[35%] text-brand-text font-medium text-[0.82rem]">
              {sku.id_produto_externo}
            </div>
            
            <div className="table-cell px-6 py-4 align-middle border-b border-brand-line/10 w-[15%] text-brand-muted text-[0.82rem] tabular-nums">
              {sku.vendas_count}
            </div>

            <div className="table-cell px-6 py-4 align-middle border-b border-brand-line/10 w-[20%] text-brand-muted text-[0.82rem] tabular-nums">
              {sku.quantidade_total.toLocaleString()}
            </div>

            <div className="table-cell px-6 py-4 align-middle border-b border-brand-line/10 w-[20%] text-brand-highlight text-[0.82rem] tabular-nums font-semibold">
              {sku.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>

            <div className="table-cell px-6 py-4 align-middle border-b border-brand-line/10 text-right w-[10%]">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onAssociate(sku)}
                className="h-8 w-8 text-brand-muted hover:text-brand-highlight transition-colors rounded-[2px]"
              >
                <Link2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      </td>
    </motion.tr>
  )
}

export default function SkusAusentes() {
  const [skus, setSkus] = useState<SkuAusente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set())
  
  // Association Dialog State
  const [selectedSku, setSelectedSku] = useState<SkuAusente | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [products, setProducts] = useState<{ id: number; text: string; tipo: string }[]>([])
  const [searching, setSearching] = useState(false)
  const [associating, setAssociating] = useState(false)

  useEffect(() => {
    loadSkus()
  }, [])

  useEffect(() => {
    if (selectedSku) {
      loadProducts("")
    } else {
      setSearchQuery("")
      setProducts([])
    }
  }, [selectedSku])

  const loadSkus = async () => {
    setLoading(true)
    try {
      if (IS_MOCK) {
        await new Promise(resolve => setTimeout(resolve, 800))
        setSkus(MOCK_SKUS)
      } else {
        const response = await vendasApi.getSkusAusentes()
        setSkus(response.items || [])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar SKUs ausentes.")
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async (q: string) => {
    setSearching(true)
    try {
      const results = await commonApi.searchProdutos(q)
      setProducts(results || [])
    } catch (e) {
      console.error(e)
    } finally {
      setSearching(false)
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearchQuery(val)
    loadProducts(val)
  }

  const handleAssociate = async (produto: { id: number; text: string; tipo: string }) => {
    if (!selectedSku) return
    
    setAssociating(true)
    try {
      const idExterno = selectedSku.id_produto_externo
      
      if (!IS_MOCK) {
        if (produto.tipo.toLowerCase() === "insumo") {
          await insumosApi.edit(produto.id, { id_produto_externo: idExterno })
        } else {
          await receitasApi.edit(produto.id, { id_produto_externo: idExterno })
        }
      } else {
        await new Promise(resolve => setTimeout(resolve, 600))
      }
      
      // TOAST NO ESTILO PRATO AJUSTADO
      toast.success(`Vínculo realizado: ${idExterno}`, {
        description: `Mapeado para ${produto.text}.`,
        style: {
          background: "#5F7139",
          border: "none",
          color: "#F5F4EE",
          borderRadius: "4px",
          whiteSpace: "nowrap",
          padding: "12px 16px",
        },
        descriptionClassName: "text-[#F5F4EE]/80 text-[0.7rem] block mt-0.5",
      })
      
      setRemovingIds(prev => new Set(prev).add(idExterno))
      setSelectedSku(null)
    } catch (e) {
      toast.error("Erro na associação", {
        description: e instanceof Error ? e.message : "Tente novamente mais tarde.",
      })
    } finally {
      setAssociating(false)
    }
  }

  // Filtragem local para permitir que o AnimatePresence gerencie a saída
  const displaySkus = skus.filter(s => !removingIds.has(s.id_produto_externo))
  const pendentesCount = displaySkus.length

  return (
    <FadeUp>
      <div className="mb-10 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link to="/vendas" className="text-brand-muted hover:text-brand-highlight transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <p className="text-brand-muted text-[0.7rem] tracking-[0.28em] uppercase font-medium">Operação / Vendas / SKUs não vinculados</p>
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold leading-tight tracking-tight text-brand-text">Vincular Produtos de Venda</h1>
          <p className="text-brand-soft text-sm md:text-base mt-2 leading-relaxed max-w-lg">
            Mapeie os identificadores das suas vendas para os insumos e receitas cadastrados no Prato.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-sm px-4 py-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-red-400 text-xs">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300 text-xs">×</button>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_280px] gap-8 items-start">
        <div className="flex flex-col gap-6">
          <div className="bg-brand-surface-2 border border-brand-line/20 rounded-sm overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-brand-line/15 flex items-center justify-between bg-brand-line/5">
              <h2 className="text-brand-soft text-sm font-medium">Produtos identificados sem vínculo</h2>
              <span className="text-brand-muted text-[0.65rem] font-bold uppercase tracking-wider tabular-nums">{pendentesCount} itens restantes</span>
            </div>

            <div className="min-h-[400px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3 text-brand-muted">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-highlight" />
                  <span className="text-sm font-medium tracking-wide">Sincronizando base de vendas…</span>
                </div>
              ) : pendentesCount === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 px-6 text-center animate-in fade-in zoom-in duration-500">
                  <div className="size-12 rounded-full bg-brand-highlight/10 flex items-center justify-center mb-4 border border-brand-highlight/20">
                    <Check className="w-6 h-6 text-brand-highlight" />
                  </div>
                  <p className="text-brand-text font-semibold text-lg mb-1 tracking-tight">Base mapeada!</p>
                  <p className="text-brand-muted text-xs whitespace-nowrap leading-relaxed">Não encontramos SKUs pendentes de vinculação nos seus arquivos.</p>
                </div>
              ) : (
                <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                  <thead>
                    <tr className="text-brand-muted text-[0.72rem] tracking-[0.08em] uppercase border-b border-brand-line/20 bg-brand-line/5">
                      <th className="px-6 py-3 text-left font-medium w-[35%]">Identificação SKU</th>
                      <th className="px-6 py-3 text-left font-medium w-[15%]">Vendas</th>
                      <th className="px-6 py-3 text-left font-medium w-[20%]">Qtd. Total</th>
                      <th className="px-6 py-3 text-left font-medium w-[20%]">Valor Total</th>
                      <th className="px-6 py-3 text-right font-medium w-[10%]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence initial={false} mode="popLayout">
                      {skus.filter(s => !removingIds.has(s.id_produto_externo)).map(sku => (
                        <SkuRow
                          key={sku.id_produto_externo}
                          sku={sku}
                          onAssociate={setSelectedSku}
                        />
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-brand-surface-2 border border-brand-line/20 rounded-[2px] p-5">
            <p className="text-brand-muted text-[0.7rem] tracking-[0.12em] uppercase font-medium mb-3">Pendências</p>
            <p className="text-brand-highlight text-3xl font-light tabular-nums">
              {pendentesCount}
            </p>
            <p className="text-brand-muted text-xs mt-1">aguardando vínculo</p>
          </div>

          <div className="bg-brand-surface border border-brand-line/15 rounded-[2px] p-5">
            <div className="flex items-start gap-3">
              <Unlink className="w-4 h-4 text-brand-highlight mt-0.5 shrink-0" />
              <div className="space-y-2">
                <p className="text-brand-text text-xs font-semibold uppercase tracking-wider">Por que vincular?</p>
                <p className="text-brand-muted text-[0.75rem] leading-relaxed">
                  O Prato precisa saber qual Insumo ou Receita interna corresponde ao nome que vem do seu PDV para calcular o CMV real.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={!!selectedSku} onOpenChange={(open) => !open && setSelectedSku(null)}>
        <DialogContent className="max-w-xl bg-brand-surface-2 border-brand-line/20 p-6 md:p-8 rounded-[2px] shadow-2xl">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-brand-text font-medium text-lg flex items-center gap-2">
              <Link2 className="w-5 h-5 text-brand-highlight" />
              Vincular identificador externo
            </DialogTitle>
            <DialogDescription className="text-brand-soft mt-2 text-sm leading-relaxed">
              Escolha o produto interno que corresponde ao código:
              <span className="block mt-2 font-mono text-brand-highlight font-semibold bg-brand-surface px-3 py-2 border border-brand-line/20 rounded-[2px]">
                {selectedSku?.id_produto_externo}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
              <Input
                placeholder="Pesquisar por nome do insumo ou receita…"
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10 bg-brand-surface border-brand-line/35 focus-visible:ring-brand-highlight/10 focus-visible:border-brand-highlight/55 h-12 text-[0.82rem]"
              />
            </div>

            <div className="bg-brand-surface border border-brand-line/20 rounded-[2px] overflow-hidden">
              <div className="px-4 py-2 border-b border-brand-line/15 bg-brand-line/5">
                <span className="text-[0.65rem] uppercase tracking-widest text-brand-muted font-bold">
                  {searching ? "Buscando..." : searchQuery ? "Resultados da busca" : "Folhear itens cadastrados"}
                </span>
              </div>
              
              <ScrollArea className="h-[300px]">
                <div className="p-2 flex flex-col gap-1">
                  {products.length === 0 && !searching && (
                    <div className="py-12 text-center">
                      <p className="text-brand-muted text-sm italic">Nenhum produto encontrado.</p>
                    </div>
                  )}
                  
                  {products.map((item) => (
                    <button
                      key={`${item.tipo}-${item.id}`}
                      onClick={() => handleAssociate(item)}
                      disabled={associating}
                      className="w-full flex items-center justify-between px-3 py-3 rounded-[2px] hover:bg-brand-highlight/10 transition-colors text-left group border border-transparent hover:border-brand-highlight/20"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[0.82rem] font-medium text-brand-text group-hover:text-brand-highlight transition-colors">
                          {item.text}
                        </span>
                        <span className={cn(
                          "text-[0.62rem] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-[2px] w-fit",
                          item.tipo.toLowerCase() === 'insumo' 
                            ? "bg-brand-primary/10 text-brand-primary" 
                            : "bg-brand-highlight/10 text-brand-highlight"
                        )}>
                          {item.tipo}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-brand-muted opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          <div className="flex justify-end mt-8">
            <Button 
              variant="ghost" 
              onClick={() => setSelectedSku(null)} 
              className="text-brand-muted hover:text-brand-soft mr-auto"
            >
              Cancelar
            </Button>
            {associating && (
              <div className="flex items-center gap-2 text-brand-highlight text-sm font-medium animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                Vinculando…
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </FadeUp>
  )
}
