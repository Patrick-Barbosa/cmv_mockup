import { useEffect, useState } from "react"
import type { ChangeEvent } from "react"
import { AlertCircle, CheckCircle2, FileSpreadsheet, Loader2, Upload, Download, Link as LinkIcon } from "lucide-react"
import { FadeUp } from "@/components/ui/fade-up"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { vendasApi, IS_MOCK } from "@/lib/api"
import type { VendasFiltersResponse, VendasUploadResponse, ImportStrategy, VendaImportRow } from "@/lib/api"
import Papa from "papaparse"
import * as XLSX from "xlsx"

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
  const [strategy, setStrategy] = useState<ImportStrategy>("append")
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const aggregateData = (rows: any[]): VendaImportRow[] => {
    const map = new Map<string, VendaImportRow>()

    rows.forEach(row => {
      // Normalize column names to lowercase/trim
      const normalizedRow: Record<string, unknown> = {}
      Object.keys(row).forEach(key => {
        normalizedRow[key.toLowerCase().trim()] = row[key]
      })

      const data = String(normalizedRow.data || "")
      const idLoja = String(normalizedRow.id_loja || "").trim()
      const idProduto = String(normalizedRow.id_produto || "").trim()
      const qtd = parseFloat(String(normalizedRow.quantidade_produto)) || 0
      const valor = parseFloat(String(normalizedRow.valor_total)) || 0

      if (!data || !idLoja || !idProduto) return

      const key = `${data}_${idLoja}_${idProduto}`
      if (map.has(key)) {
        const existing = map.get(key)!
        existing.quantidade_produto += qtd
        existing.valor_total += valor
      } else {
        map.set(key, {
          data,
          id_loja: idLoja,
          id_produto: idProduto,
          quantidade_produto: qtd,
          valor_total: valor
        })
      }
    })

    return Array.from(map.values())
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parseFile = async (file: File): Promise<any[]> => {
    const extension = file.name.split('.').pop()?.toLowerCase()

    if (extension === 'csv') {
      return new Promise((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => resolve(results.data),
          error: (err) => reject(err)
        })
      })
    } else if (extension === 'xlsx' || extension === 'xls') {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      return XLSX.utils.sheet_to_json(worksheet)
    }
    
    throw new Error("Formato de arquivo não suportado. Use .xlsx ou .csv.")
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    setError(null)
    try {
      if (IS_MOCK) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        const response: VendasUploadResponse = {
          message: "Vendas importadas com sucesso (MOCK).",
          linhas_importadas: 42,
          lojas: [...filters.lojas, "NOVA-LOJA"],
          meses: filters.meses,
        }
        setUploadResult(response)
        setFilters({ lojas: response.lojas, meses: response.meses })
      } else {
        const rawRows = await parseFile(selectedFile)
        const aggregatedRows = aggregateData(rawRows)

        if (aggregatedRows.length === 0) {
          throw new Error("Nenhum dado válido encontrado no arquivo após agregação.")
        }

        const response = await vendasApi.bulkImport({
          strategy,
          rows: aggregatedRows
        })
        
        setUploadResult(response)
        setFilters({ lojas: response.lojas, meses: response.meses })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao importar arquivo.")
    } finally {
      setUploading(false)
    }
  }

  const handleDownloadTemplate = (format: "xlsx" | "csv") => {
    vendasApi.downloadTemplate(format).catch(e => setError(e.message))
  }

  return (
    <div className="flex flex-col gap-6">
      <FadeUp>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-brand-muted text-[0.7rem] tracking-[0.28em] uppercase font-medium mb-2">Operação / Vendas</p>
            <h1 className="text-2xl md:text-3xl font-semibold leading-tight tracking-tight">Importação de vendas</h1>
            <p className="text-brand-soft text-sm md:text-base mt-2 leading-relaxed max-w-2xl">
              Envie seus dados de vendas. O sistema agrega os dados localmente por dia, loja e produto antes de enviar para o servidor.
            </p>
          </div>
          <Link to="/vendas/ausentes">
            <Button variant="outline" className="border-brand-highlight/30 text-brand-highlight hover:bg-brand-highlight/10 h-9 text-xs">
              <LinkIcon className="w-3.5 h-3.5 mr-2" />
              Ver SKUs não vinculados
            </Button>
          </Link>
        </div>
      </FadeUp>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-sm px-4 py-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-red-400 text-xs">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300 text-xs">×</button>
        </div>
      )}

      <div className="grid xl:grid-cols-[1.2fr_0.8fr] gap-6 items-start">
        <div className="flex flex-col gap-6">
          <FadeUp delay={0.05} className="bg-brand-surface-2 border border-brand-line/20 rounded-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-brand-line/15 flex items-center justify-between">
              <div>
                <h2 className="text-brand-soft text-sm font-medium">Configuração do Upload</h2>
                <p className="text-brand-muted text-xs mt-1">Selecione o arquivo e a estratégia de importação.</p>
              </div>
              <FileSpreadsheet className="w-4 h-4 text-brand-highlight" />
            </div>

            <div className="p-6 flex flex-col gap-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[0.76rem] text-brand-soft tracking-[0.03em] block">Arquivo de Vendas</label>
                  <Input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileChange}
                    className="bg-brand-surface border-brand-line/35 file:mr-3 file:border-0 file:bg-transparent file:text-brand-soft file:text-sm file:font-medium"
                  />
                  <p className="text-brand-muted text-xs">
                    {selectedFile ? `Selecionado: ${selectedFile.name}` : "Selecione .xlsx ou .csv"}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-[0.76rem] text-brand-soft tracking-[0.03em] block">Estratégia de Importação</label>
                  <Select value={strategy} onValueChange={(v) => setStrategy(v as ImportStrategy)}>
                    <SelectTrigger className="bg-brand-surface border-brand-line/35 text-brand-soft">
                      <SelectValue placeholder="Selecione a estratégia" />
                    </SelectTrigger>
                    <SelectContent className="bg-brand-surface-2 border-brand-line/20 text-brand-soft">
                      <SelectItem value="append">Adicionar novas vendas</SelectItem>
                      <SelectItem value="overwrite">Substituir dados (Loja/Dia)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-brand-surface border border-brand-line/20 rounded-[2px] p-4">
                <p className="text-brand-muted text-[0.72rem] tracking-[0.12em] uppercase font-medium mb-2">Comportamento da estratégia</p>
                <p className="text-brand-soft text-[0.82rem] leading-relaxed">
                  {strategy === "append" 
                    ? "Insere apenas novos registros. Se já existir uma venda para o mesmo dia, loja e produto, ela será ignorada (não duplica)."
                    : "Limpa as vendas existentes para as lojas e dias presentes no arquivo antes de importar. Use para corrigir ou atualizar dados de dias específicos."}
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

              <div className="flex justify-between items-center mt-2">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleDownloadTemplate("xlsx")} className="text-xs h-8">
                    <Download className="w-3 h-3 mr-1" /> Template XLSX
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDownloadTemplate("csv")} className="text-xs h-8">
                    <Download className="w-3 h-3 mr-1" /> Template CSV
                  </Button>
                </div>

                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                  className="bg-brand-primary text-brand-button-text hover:bg-brand-primary-hover"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                  Processar e Importar
                </Button>
              </div>
            </div>
          </FadeUp>

          <FadeUp delay={0.1} className="bg-brand-surface border border-brand-line/15 rounded-[2px] p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-brand-highlight shrink-0 mt-0.5" />
              <div className="text-brand-soft text-sm leading-relaxed space-y-2">
                <p className="font-medium text-brand-highlight">Dica sobre Agregação Local:</p>
                <p>
                  Você pode enviar um arquivo com múltiplas linhas para o mesmo produto no mesmo dia. 
                  O sistema somará automaticamente as quantidades e valores antes de salvar.
                </p>
              </div>
            </div>
          </FadeUp>
        </div>

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

          {uploadResult && (
            <FadeUp delay={0.25} className="bg-brand-surface-2 border border-emerald-500/20 rounded-[2px] p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <p className="text-emerald-300 text-sm font-medium">{uploadResult.message}</p>
                  <p className="text-brand-soft text-sm">{uploadResult.linhas_importadas} grupos de vendas importados.</p>
                  <div className="text-brand-muted text-xs mt-1">
                    <p>Lojas: {uploadResult.lojas.length} · Meses: {uploadResult.meses.length}</p>
                  </div>
                </div>
              </div>
            </FadeUp>
          )}
        </div>
      </div>
    </div>
  )
}
