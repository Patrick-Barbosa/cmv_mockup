import { useState } from "react"
import { ChevronRight, Layers, Box } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface TreeNodeData {
  id: string | number
  nome: string
  tipo: string
  quantidade?: number
  custo?: number
  unidade?: string
  children?: TreeNodeData[]
}

interface TreeViewerProps {
  nodes: TreeNodeData[]
  renderNodeContent?: (node: TreeNodeData) => React.ReactNode
}

function TreeNode({ node, depth = 0, renderNodeContent }: { node: TreeNodeData; depth?: number; renderNodeContent?: (node: TreeNodeData) => React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true)
  const isRecipe = node.tipo === "receita"
  const hasChildren = node.children && node.children.length > 0

  return (
    <div className="relative">
      <div
        className={`flex items-center gap-2 py-[0.55rem] px-3 border-b border-brand-line/5 transition-colors ${
          isRecipe && hasChildren ? "cursor-pointer hover:bg-brand-highlight/5" : "hover:bg-brand-line/5"
        }`}
        onClick={() => isRecipe && hasChildren && setIsOpen(!isOpen)}
      >
        {isRecipe && hasChildren ? (
          <Button
            variant="outline"
            size="icon"
            className={`w-[18px] h-[18px] rounded-sm transition-all shrink-0 ${
              isOpen
                ? "bg-brand-highlight/10 border-brand-highlight/30 text-brand-highlight tracking-widest hover:bg-brand-highlight/20 hover:text-brand-highlight"
                : "border-brand-line/30 text-brand-muted hover:border-brand-highlight hover:text-brand-highlight hover:bg-transparent"
            }`}
          >
            <ChevronRight className={`w-3 h-3 transition-transform ${isOpen ? "rotate-90" : ""}`} />
          </Button>
        ) : (
          <span className="w-[18px] shrink-0" />
        )}

        {isRecipe ? (
          <Layers className="w-[13px] h-[13px] text-brand-highlight shrink-0" />
        ) : (
          <Box className="w-[13px] h-[13px] text-brand-muted shrink-0" />
        )}

        {renderNodeContent ? (
          renderNodeContent(node)
        ) : (
          <>
            <span className={`text-sm ${isRecipe ? "text-brand-soft font-medium" : "text-brand-text"}`}>
              {node.nome}
            </span>
            <span
              className={`px-1.5 py-0.5 text-[0.65rem] font-medium rounded-sm border ${
                isRecipe
                  ? "bg-brand-primary/15 text-brand-highlight border-brand-primary/20"
                  : "bg-brand-surface text-brand-muted border-brand-line/20"
              }`}
            >
              {node.tipo}
            </span>
          </>
        )}
      </div>

      {hasChildren && isOpen && (
        <div className="ml-5 border-l border-brand-line/15">
          {node.children!.map((child, index) => (
            <TreeNode key={`${child.id}-${index}`} node={child} depth={depth + 1} renderNodeContent={renderNodeContent} />
          ))}
        </div>
      )}
    </div>
  )
}

export function TreeViewer({ nodes, renderNodeContent }: TreeViewerProps) {
  return (
    <div className="font-tree">
      {nodes.map((node, index) => (
        <TreeNode key={`${node.id}-${index}`} node={node} renderNodeContent={renderNodeContent} />
      ))}
    </div>
  )
}