import { useEffect, useState } from "react"
import type { ChangeEvent } from "react"
import { AlertCircle, CheckCircle2, FileSpreadsheet, Loader2, Upload } from "lucide-react"
import { FadeUp } from "@/components/ui/fade-up"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { vendasApi, IS_MOCK } from "@/lib/api"
import type { VendasFiltersResponse, VendasUploadResponse } from "@/lib/api"

const EXPECTED_COLUMNS = [
  "data",
  "id_loja",
  "id_produto",
  "quantidade_produto",
  "valor_total",
]

const mockFilters: VendasFiltersResponse = {
  lojas: ["RJ-COPA", "RJ-BARRA"],
  meses: ["2026-04", "2026-03"],
}

export default function Vendas() {
  const [filters, setFilters] = useState<VendasFiltersResponse>(IS_MOCK ? mockFilters : { lojas: [], meses: [] })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadResult, setUploadResult] = useState<VendasUploadResponse | null>(null)
  const [loadingFilters, setLoadingFilters] = useState(!IS_MOCK)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (IS_MOCK) return

    vendasApi.getFilters()
      .then((response) => setFilters(response))
      .catch((e) => setError(e instanceof Error ? e.message : "Erro ao carregar filtros de vendas."))
      .finally(() => setLoadingFilters(false))
  }, [])

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    setSelectedFile(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      return
    }

    setUploading(true)
    setError(null)
    try {
      if (IS_MOCK) {
        const response: VendasUploadResponse = {
          message: "Vendas importadas com sucesso.",
          linhas_importadas: 24,
          ...mockFilters,
        }
        setUploadResult(response)
        setFilters({ lojas: response.lojas, meses: response.meses })
      } else {
        const response = await vendasApi.upload(selectedFile)
        setUploadResult(response)
        setFilters({ lojas: response.lojas, meses: response.meses })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao importar arquivo.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <FadeUp>
        <p className="text-brand-muted text-[0.7rem] tracking-[0.28em] uppercase font-medium mb-2">Operação / Vendas</p>
        <h1 className="text-2xl md:text-3xl font-semibold leading-tight tracking-tight">Importação de vendas</h1>
        <p className="text-brand-soft text-sm md:text-base mt-2 leading-relaxed max-w-2xl">
          Envie um arquivo Excel com as vendas por loja e produto. O sistema valida os tipos antes de persistir e disponibiliza os meses para análise de CMV ideal.
        </p>
      </FadeUp>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-sm px-4 py-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-red-400 text-xs">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300 text-xs">×</button>
        </div>
      )}

      <div className="grid xl:grid-cols-[1.2fr_0.8fr] gap-6 items-start">
        <FadeUp delay={0.05} className="bg-brand-surface-2 border border-brand-line/20 rounded-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-brand-line/15 flex items-center justify-between">
            <div>
              <h2 className="text-brand-soft text-sm font-medium">Arquivo de upload</h2>
              <p className="text-brand-muted text-xs mt-1">Somente `.xlsx`, com cabeçalho igual ao template.</p>
            </div>
            <FileSpreadsheet className="w-4 h-4 text-brand-highlight" />
          </div>

          <div className="p-6 flex flex-col gap-5">
            <div className="space-y-2">
              <label className="text-[0.76rem] text-brand-soft tracking-[0.03em] block">Arquivo Excel</label>
              <Input
                type="file"
                accept=".xlsx"
                onChange={handleFileChange}
                className="bg-brand-surface border-brand-line/35 file:mr-3 file:border-0 file:bg-transparent file:text-brand-soft file:text-sm file:font-medium"
              />
              <p className="text-brand-muted text-xs">
                {selectedFile ? `Selecionado: ${selectedFile.name}` : "Selecione um arquivo com as colunas esperadas."}
              </p>
            </div>

            <div className="bg-brand-surface border border-brand-line/20 rounded-[2px] p-4 flex flex-col gap-2">
              <p className="text-brand-muted text-[0.72rem] tracking-[0.12em] uppercase font-medium">Colunas obrigatórias</p>
              <div className="flex flex-wrap gap-2">
                {EXPECTED_COLUMNS.map((column) => (
                  <span
                    key={column}
                    className="px-2.5 py-1 rounded-[2px] border border-brand-highlight/20 bg-brand-highlight/10 text-brand-highlight text-xs font-medium"
                  >
                    {column}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-brand-surface border border-brand-line/15 rounded-[2px] p-4">
              <p className="text-brand-muted text-[0.72rem] tracking-[0.12em] uppercase font-medium mb-2">Regras de validação</p>
              <div className="flex flex-col gap-2 text-brand-soft text-sm leading-relaxed">
                <p>`data` precisa ser uma data válida.</p>
                <p>`quantidade_produto` deve ser inteiro positivo.</p>
                <p>`valor_total` deve ser numérico e maior ou igual a zero.</p>
                <p>Os nomes das colunas precisam bater exatamente com o modelo acima.</p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="bg-brand-primary text-brand-button-text hover:bg-brand-primary-hover"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                Importar vendas
              </Button>
            </div>
          </div>
        </FadeUp>

        <div className="flex flex-col gap-4">
          <FadeUp delay={0.1} className="bg-brand-surface-2 border border-brand-line/20 rounded-[2px] p-5">
            <p className="text-brand-muted text-[0.7rem] tracking-[0.12em] uppercase font-medium mb-3">Lojas disponíveis</p>
            {loadingFilters ? (
              <div className="flex items-center gap-2 text-brand-muted text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Carregando filtros…
              </div>
            ) : (
              <>
                <p className="text-brand-highlight text-3xl font-light tabular-nums">{filters.lojas.length}</p>
                <p className="text-brand-muted text-xs mt-1">{filters.lojas.length > 0 ? filters.lojas.join(" · ") : "Nenhuma loja importada ainda"}</p>
              </>
            )}
          </FadeUp>

          <FadeUp delay={0.15} className="bg-brand-surface-2 border border-brand-line/20 rounded-[2px] p-5">
            <p className="text-brand-muted text-[0.7rem] tracking-[0.12em] uppercase font-medium mb-3">Meses disponíveis</p>
            {loadingFilters ? (
              <div className="flex items-center gap-2 text-brand-muted text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Carregando filtros…
              </div>
            ) : (
              <>
                <p className="text-brand-highlight text-3xl font-light tabular-nums">{filters.meses.length}</p>
                <p className="text-brand-muted text-xs mt-1">{filters.meses.length > 0 ? filters.meses.join(" · ") : "Nenhum mês encontrado"}</p>
              </>
            )}
          </FadeUp>

          <FadeUp delay={0.2} className="bg-brand-surface border border-brand-line/15 rounded-[2px] p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-3.5 h-3.5 text-brand-highlight shrink-0 mt-0.5" />
              <p className="text-brand-muted text-xs leading-relaxed">
                Após importar, a página de lojas e o detalhe das receitas passam a comparar preço médio praticado contra custo ideal por mês e por loja.
              </p>
            </div>
          </FadeUp>

          {uploadResult && (
            <FadeUp delay={0.25} className="bg-brand-surface-2 border border-emerald-500/20 rounded-[2px] p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <p className="text-emerald-300 text-sm font-medium">{uploadResult.message}</p>
                  <p className="text-brand-soft text-sm">{uploadResult.linhas_importadas} linhas importadas com sucesso.</p>
                  <p className="text-brand-muted text-xs mt-1">
                    Lojas: {uploadResult.lojas.join(", ") || "—"} · Meses: {uploadResult.meses.join(", ") || "—"}
                  </p>
                </div>
              </div>
            </FadeUp>
          )}
        </div>
      </div>
    </div>
  )
}
