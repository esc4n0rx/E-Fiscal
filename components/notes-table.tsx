"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Download, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react'
import { useAppStore } from "@/components/store"
import { downloadCSV, notesToCSV } from "@/lib/csv"
import type { Note } from "@/types/note"

// Colunas fixas conforme especificação
const COLUMNS: { key: keyof Note; label: string }[] = [
  { key: "centro", label: "Centro" },
  { key: "data", label: "Data" },
  { key: "notaFiscal", label: "Nota Fiscal" },
  { key: "loja", label: "Loja" },
  { key: "nomeLoja", label: "Nome Loja" },
  { key: "material", label: "Material" },
  { key: "descricao", label: "Descrição" },
  { key: "pedido", label: "Pedido" },
  { key: "quantidade", label: "Quantidade" },
  { key: "umb", label: "UMB" },
  { key: "valor", label: "Valor" },
  { key: "remessa", label: "Remessa" },
  { key: "mensagem", label: "Mensagem" },
]

type Props = {
  title?: string
  rows?: Note[]
  tabKey?: string
  loading?: boolean
  error?: string | null
  onRefresh?: () => void
}

export default function NotesTable({
  title = "Tabela",
  rows = [],
  tabKey = "principal",
  loading = false,
  error = null,
  onRefresh,
}: Props) {
  const { filters } = useAppStore()
  // Estado local para marcar linhas tratadas. Guarda IDs.
  const [treated, setTreated] = useState<Set<number>>(new Set())

  const toggleTreated = (id: number) => {
    setTreated((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Função de filtro por data e texto (aplicado no backend via API, mas mantém lógica local para compatibilidade)
  const filtered = useMemo(() => {
    const text = filters.text.trim().toLowerCase()
    const dateUpTo = filters.dateUpTo ? new Date(filters.dateUpTo) : null
    return rows.filter((r) => {
      // Filtro por data (<= dateUpTo)
      if (dateUpTo) {
        const rd = new Date(r.data)
        if (isFinite(rd.getTime()) && rd > dateUpTo) return false
      }
      if (!text) return true
      // Busca por texto em múltiplos campos
      const hay = [
        r.centro,
        r.data,
        r.notaFiscal,
        r.loja,
        r.nomeLoja,
        r.material,
        r.descricao,
        r.pedido,
        String(r.quantidade),
        r.umb,
        String(r.valor),
        r.remessa,
        r.mensagem,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return hay.includes(text)
    })
  }, [rows, filters])

  const handleExport = () => {
    const csv = notesToCSV(filtered)
    const filename = `notas-${tabKey}.csv`
    downloadCSV(filename, csv)
  }

  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-900/60 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
        <h3 className="text-sm font-medium text-neutral-300 flex items-center gap-2">
          {title}
          {loading && (
            <div className="animate-spin h-4 w-4 border-2 border-neutral-500 border-t-transparent rounded-full"></div>
          )}
        </h3>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
              className="text-neutral-300 hover:text-white hover:bg-neutral-800"
              aria-label="Atualizar dados"
              title="Atualizar dados"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExport}
            disabled={loading || filtered.length === 0}
            className="text-neutral-300 hover:text-white hover:bg-neutral-800"
            aria-label="Exportar tabela (CSV)"
            title="Exportar tabela (CSV)"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Indicador de erro */}
      {error && (
        <div className="mx-4 mt-3 p-3 rounded-lg border border-red-800/50 bg-red-950/40 flex items-center gap-2 text-red-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="text-sm">Erro: {error}</span>
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              className="ml-auto text-red-200 hover:text-red-100 hover:bg-red-900/30"
            >
              Tentar novamente
            </Button>
          )}
        </div>
      )}

      <div className="relative w-full overflow-auto">
        <table className="w-full caption-bottom text-sm">
          <thead className="bg-neutral-950/60 border-b border-neutral-800">
            <tr>
              <th scope="col" className="sticky left-0 z-10 bg-neutral-950/60 px-3 py-2 text-left text-xs font-medium text-neutral-400 border-r border-neutral-800">
                Tratada
              </th>
              {COLUMNS.map((c) => (
                <th
                  key={c.key as string}
                  scope="col"
                  className="px-3 py-2 text-left text-xs font-medium text-neutral-400"
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {loading ? (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="px-3 py-10 text-center text-neutral-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin h-5 w-5 border-2 border-neutral-500 border-t-transparent rounded-full"></div>
                    Carregando dados...
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="px-3 py-10 text-center text-red-400">
                  Erro ao carregar dados. {onRefresh && "Clique em 'Atualizar' para tentar novamente."}
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="px-3 py-10 text-center text-neutral-400">
                  {rows.length === 0 
                    ? "Nenhum registro encontrado nesta categoria."
                    : "Nenhum registro encontrado para os filtros atuais."
                  }
                </td>
              </tr>
            ) : (
              filtered.map((row) => {
                const isTreated = treated.has(row.id)
                return (
                  <tr
                    key={row.id}
                    className={`hover:bg-neutral-800/40 ${
                      isTreated ? "bg-emerald-950/40" : ""
                    }`}
                  >
                    <td className="sticky left-0 z-10 bg-neutral-900/60 px-3 py-2 border-r border-neutral-800 align-middle">
                      <button
                        onClick={() => toggleTreated(row.id)}
                        className={`inline-flex items-center rounded-md border px-2 py-1 text-xs ${
                          isTreated
                            ? "border-emerald-700/40 bg-emerald-900/40 text-emerald-300"
                            : "border-neutral-700 bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                        }`}
                        aria-pressed={isTreated}
                        aria-label={isTreated ? "Desmarcar como tratada" : "Marcar como tratada"}
                        title={isTreated ? "Desmarcar como tratada" : "Marcar como tratada"}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        {isTreated ? "Tratada" : "Marcar"}
                      </button>
                    </td>
                    {COLUMNS.map((c) => (
                      <td key={`${row.id}-${c.key as string}`} className="px-3 py-2 align-middle text-neutral-200">
                        {c.key === "valor"
                          ? new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(Number(row.valor ?? 0))
                          : String(row[c.key] ?? "")}
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-neutral-800 text-xs text-neutral-500">
        {loading ? (
          "Carregando..."
        ) : error ? (
          `Erro ao carregar dados`
        ) : (
          `${filtered.length} linha(s) exibida(s) de ${rows.length} total.`
        )}
      </div>
    </section>
  )
}