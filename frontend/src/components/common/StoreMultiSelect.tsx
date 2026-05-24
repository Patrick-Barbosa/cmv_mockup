import { useState, useRef, useEffect } from "react"
import { Check, ChevronDown, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface StoreInfo {
  id: string
  name?: string
}

interface StoreMultiSelectProps {
  stores: StoreInfo[]
  selected: string[]
  onChange: (selected: string[]) => void
  disabled?: boolean
}

export function StoreMultiSelect({ stores, selected, onChange, disabled }: StoreMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filtered = stores.filter(
    (s) => s.id.toLowerCase().includes(search.toLowerCase()) || s.name?.toLowerCase().includes(search.toLowerCase())
  )

  const toggleStore = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id))
    } else {
      onChange([...selected, id])
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className="w-full justify-between bg-brand-surface border-brand-line/35 h-11 text-base font-normal text-left pr-8"
      >
        {selected.length === 0
          ? "Todas as lojas"
          : selected.length === 1
          ? stores.find((s) => s.id === selected[0])?.id || selected[0]
          : `${selected.length} lojas selecionadas`}
        <ChevronDown className={cn("ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform", open && "rotate-180")} />
      </Button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-brand-surface-2 border border-brand-line/20 rounded-sm shadow-lg">
          <div className="p-2 border-b border-brand-line/10">
            <input
              type="text"
              placeholder="Buscar loja..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-brand-surface border border-brand-line/20 rounded-sm px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="p-2 text-sm text-brand-muted">Nenhuma loja encontrada</p>
            ) : (
              filtered.map((store) => (
                <div
                  key={store.id}
                  onClick={() => toggleStore(store.id)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer hover:bg-brand-line/10"
                >
                  <div
                    className={cn(
                      "w-4 h-4 rounded border border-brand-line/30 flex items-center justify-center",
                      selected.includes(store.id) ? "bg-brand-primary border-brand-primary" : "bg-transparent"
                    )}
                  >
                    {selected.includes(store.id) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm text-brand-soft">{store.id}</span>
                </div>
              ))
            )}
          </div>
          {selected.length > 0 && (
            <div className="p-2 border-t border-brand-line/10">
              <button
                onClick={() => onChange([])}
                className="text-xs text-brand-muted hover:text-brand-highlight flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Limpar seleção
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}