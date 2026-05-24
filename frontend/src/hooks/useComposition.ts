import { useState, useCallback, useMemo } from "react"
import { receitasApi } from "@/lib/api"

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

interface ReceitaTreeDetalhe {
  id: number | string
  nome: string
  tipo: "insumo" | "receita"
  quantidade?: number
  custo?: number
  unidade?: string
  children?: ReceitaTreeDetalhe[]
}

export function mapTreeToComponentes(node: ReceitaTreeDetalhe): Componente[] {
  if (!node.children) return []
  return node.children.map((c) => ({
    id: Math.random().toString(36).slice(2, 9),
    tipo: c.tipo,
    componenteId: Number(c.id),
    quantidade: c.quantidade || 0,
    quantidadeDisplay: (c.quantidade || 0).toString().replace(".", ","),
    custoUnitario: c.custo || 0,
    unidadeMedida: c.unidade || "",
    subComponentes:
      c.children && c.children.length > 0 ? mapTreeToComponentes(c) : undefined,
    expanded: false,
  }))
}

export function useComposition() {
  const [composicao, setComposicao] = useState<Componente[]>([])
  const [componentesOriginais, setComponentesOriginais] = useState<Componente[]>([])
  const [loadingComposicao, setLoadingComposicao] = useState(false)

  const loadComposicao = useCallback(
    async (id: number) => {
      setLoadingComposicao(true)
      try {
        const detalhes = await receitasApi.getTree(id)
        const mapped = mapTreeToComponentes(detalhes)
        setComposicao(mapped)
        setComponentesOriginais(JSON.parse(JSON.stringify(mapped)))
      } catch (err) {
        console.error("Erro ao carregar composição:", err)
      } finally {
        setLoadingComposicao(false)
      }
    },
    []
  )

  const addComponent = useCallback(
    (path: number[] | null, tipo: "insumo" | "receita") => {
      setComposicao((prev) => {
        const newItem: Componente = {
          id: Math.random().toString(36).slice(2, 9),
          tipo,
          componenteId: 0,
          quantidade: 0,
          quantidadeDisplay: "0",
          expanded: true,
          subComponentes: tipo === "receita" ? [] : undefined,
        }

        if (!path) {
          return [...prev, newItem]
        }

        const next = JSON.parse(JSON.stringify(prev))
        const findAndAdd = (list: Componente[], p: number[]) => {
          if (p.length === 1) {
            if (!list[p[0]].subComponentes) list[p[0]].subComponentes = []
            list[p[0]].subComponentes!.push(newItem)
            return
          }
          findAndAdd(list[p[0]].subComponentes!, p.slice(1))
        }
        findAndAdd(next, path)
        return next
      })
    },
    []
  )

  const updateComponent = useCallback(
    (path: number[], updates: Partial<Componente>) => {
      setComposicao((prev) => {
        const updateLevel = (list: Componente[], p: number[]): Componente[] => {
          const [index, ...rest] = p
          return list.map((item, i) => {
            if (i !== index) return item
            if (rest.length === 0) return { ...item, ...updates }
            return {
              ...item,
              subComponentes: updateLevel(item.subComponentes || [], rest),
            }
          })
        }
        return updateLevel(prev, path)
      })
    },
    []
  )

  const removeComponent = useCallback((path: number[]) => {
    setComposicao((prev) => {
      const next = JSON.parse(JSON.stringify(prev))
      const removeDeep = (list: Componente[], p: number[]) => {
        if (p.length === 1) {
          list.splice(p[0], 1)
          return
        }
        removeDeep(list[p[0]].subComponentes!, p.slice(1))
      }
      removeDeep(next, path)
      return next
    })
  }, [])

  const resetComposition = useCallback(() => {
    setComposicao([])
    setComponentesOriginais([])
  }, [])

  const calculateComposicaoCost = useCallback((listToCalculate: Componente[]): number => {
    const calculateDeep = (list: Componente[]): number => {
      return list.reduce((sum, c) => {
        const itemCost =
          c.tipo === "receita" && c.subComponentes && c.subComponentes.length > 0
            ? calculateDeep(c.subComponentes)
            : c.custoUnitario || 0
        return sum + c.quantidade * itemCost
      }, 0)
    }
    return calculateDeep(listToCalculate)
  }, [])

  const isCompositionChanged = useMemo(() => {
    if (componentesOriginais.length === 0 && composicao.length === 0) return false
    const originalMapped = JSON.stringify(
      componentesOriginais.map((c) => ({ id: c.componenteId, q: c.quantidade }))
    )
    const currentMapped = JSON.stringify(
      composicao.map((c) => ({ id: c.componenteId, q: c.quantidade }))
    )
    return originalMapped !== currentMapped
  }, [componentesOriginais, composicao])

  return {
    composicao,
    componentesOriginais,
    loadingComposicao,
    loadComposicao,
    addComponent,
    updateComponent,
    removeComponent,
    resetComposition,
    calculateComposicaoCost,
    isCompositionChanged,
  }
}