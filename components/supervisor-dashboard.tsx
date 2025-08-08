"use client"

import { useMemo } from "react"
import type { Note } from "@/types/note"
import Filters from "@/components/filters"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Files, DollarSign, Clock, CheckCircle2, UserIcon, RefreshCw } from 'lucide-react'
import { cn } from "@/lib/utils"
import { useAllNotas } from "@/hooks/use-notas"

// Tipos locais para enriquecer as notas com metadados de supervisão
type NoteWithMeta = Note & {
  assignedTo: string // Responsável pela nota (mock)
  dueDate: string // Data de vencimento (mock = data + 10 dias)
  overdueDays: number // Dias em atraso
  isOverdue: boolean // Está em atraso
  needsAction: boolean // Precisa tratar (heurística simples)
}

type UserAgg = {
  user: string
  count: number
  overdue: number
  totalValue: number
  perTab: {
    principal: number
    qualidade: number
    devolucoes: number
    "nao-identificado": number
  }
}

// Distribui responsáveis de forma determinística com base no id
function assignUserById(id: number): string {
  const names = ["Ana", "Bruno", "Carlos", "Daniela"]
  return names[id % names.length]
}

// Soma simples de dias
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  if (!isFinite(d.getTime())) return dateStr
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

// Diferença de dias entre hoje e uma data (hoje - dueDate)
function diffDaysFromToday(dateStr: string): number {
  const due = new Date(dateStr)
  const today = new Date()
  // Normaliza para meia-noite para evitar diferenças de hora
  const tzOff = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const ms = tzOff(today) - tzOff(due)
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

// Heurística: precisa de ação se mensagem for vazia ou indicar problema
function needsAction(msg: string): boolean {
  if (!msg) return true
  const m = msg.toLowerCase()
  return ["devolução", "devolvido", "aguardando", "risco", "divergente", "etiqueta", "sem série"].some((k) =>
    m.includes(k)
  )
}

function enrichNotes(notes: Note[]): NoteWithMeta[] {
  return notes.map((n) => {
    const due = addDays(n.data, 10)
    const overdueDays = diffDaysFromToday(due)
    const isOverdue = overdueDays > 0
    const action = needsAction(n.mensagem)
    return {
      ...n,
      assignedTo: assignUserById(n.id),
      dueDate: due,
      overdueDays,
      isOverdue,
      needsAction: action,
    }
  })
}

function formatBRL(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0)
}

export default function SupervisorDashboard() {
  // Busca todas as notas (sem filtro de categoria)
  const { notes: data, loading, error, refresh } = useAllNotas()

  // Aplica enriquecimento (mesma lógica de filtro está no hook)
  const enrichedData = useMemo<NoteWithMeta[]>(() => {
    return enrichNotes(data)
  }, [data])

  // Agregações
  const totals = useMemo(() => {
    const totalNotes = enrichedData.length
    const totalValue = enrichedData.reduce((acc, n) => acc + (Number(n.valor) || 0), 0)
    const overdueCount = enrichedData.filter((n) => n.isOverdue).length
    const needsActionCount = enrichedData.filter((n) => n.needsAction).length
    return { totalNotes, totalValue, overdueCount, needsActionCount }
  }, [enrichedData])

  const perUser = useMemo<UserAgg[]>(() => {
    const map = new Map<string, UserAgg>()
    for (const n of enrichedData) {
      const key = n.assignedTo
      if (!map.has(key)) {
        map.set(key, {
          user: key,
          count: 0,
          overdue: 0,
          totalValue: 0,
          perTab: {
            principal: 0,
            qualidade: 0,
            devolucoes: 0,
            "nao-identificado": 0,
          },
        })
      }
      const a = map.get(key)!
      a.count += 1
      a.totalValue += Number(n.valor) || 0
      if (n.isOverdue) a.overdue += 1
      a.perTab[n.aba] += 1
    }
    // Ordena por maior quantidade
    return Array.from(map.values()).sort((a, b) => b.count - a.count)
  }, [enrichedData])

  const overdueList = useMemo(() => {
    return enrichedData
      .filter((n) => n.isOverdue)
      .sort((a, b) => b.overdueDays - a.overdueDays)
      .slice(0, 10)
  }, [enrichedData])

  return (
    <div className="space-y-4">
      {/* Filtros globais também afetam a visão de supervisor */}
      <Filters />

      {/* Indicador de erro ou carregamento */}
      {error && (
        <Card className="bg-red-950/30 border-red-800/40">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-200">
                <div className="h-2 w-2 rounded-full bg-red-500"></div>
                <span className="text-sm">Erro ao carregar dados: {error}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={refresh}
                className="text-red-200 hover:text-red-100 hover:bg-red-900/30"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Tentar novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          icon={<Files className="h-5 w-5" />}
          label="Notas Totais"
          value={totals.totalNotes.toString()}
          loading={loading}
        />
        <MetricCard
          icon={<DollarSign className="h-5 w-5" />}
          label="Valor Total"
          value={formatBRL(totals.totalValue)}
          loading={loading}
        />
        <MetricCard
          icon={<Clock className="h-5 w-5" />}
          label="Em Atraso"
          value={totals.overdueCount.toString()}
          tone="amber"
          loading={loading}
        />
        <MetricCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Para Tratar"
          value={totals.needsActionCount.toString()}
          tone="emerald"
          loading={loading}
        />
      </div>

      {/* Tabela por usuário */}
      <Card className="bg-neutral-900/60 border-neutral-800">
        <CardHeader className="border-b border-neutral-800">
          <CardTitle className="text-sm text-neutral-300 flex items-center gap-2">
            <UserIcon className="h-4 w-4" />
            Por Usuário (responsável)
            {loading && <div className="animate-spin h-4 w-4 border-2 border-neutral-500 border-t-transparent rounded-full"></div>}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-neutral-800">
                  <TableHead className="text-neutral-400">Usuário</TableHead>
                  <TableHead className="text-neutral-400">Qtd. Notas</TableHead>
                  <TableHead className="text-neutral-400">Em Atraso</TableHead>
                  <TableHead className="text-neutral-400">Valor Total</TableHead>
                  <TableHead className="text-neutral-400">Por Aba (P/Q/D/N)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-neutral-400 py-10">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin h-5 w-5 border-2 border-neutral-500 border-t-transparent rounded-full"></div>
                        Carregando dados...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-red-400 py-10">
                      Erro ao carregar dados. Verifique a conexão.
                    </TableCell>
                  </TableRow>
                ) : perUser.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-neutral-400 py-10">
                      Nenhum registro encontrado para os filtros atuais.
                    </TableCell>
                  </TableRow>
                ) : (
                  perUser.map((u) => (
                    <TableRow key={u.user} className="border-neutral-800 hover:bg-neutral-800/40">
                      <TableCell className="font-medium text-neutral-200">{u.user}</TableCell>
                      <TableCell className="text-neutral-200">{u.count}</TableCell>
                      <TableCell className="text-neutral-200">
                        <Badge
                          variant="outline"
                          className={cn(
                            "border-amber-700/40 text-amber-300 bg-amber-900/30",
                            u.overdue === 0 && "border-neutral-700 text-neutral-300 bg-neutral-800/50"
                          )}
                        >
                          {u.overdue}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-neutral-200">{formatBRL(u.totalValue)}</TableCell>
                      <TableCell className="text-neutral-300">
                        <span className="inline-flex items-center gap-1">
                          <span className="rounded-md bg-neutral-800 px-2 py-0.5 text-xs">P {u.perTab.principal}</span>
                          <span className="rounded-md bg-neutral-800 px-2 py-0.5 text-xs">Q {u.perTab.qualidade}</span>
                          <span className="rounded-md bg-neutral-800 px-2 py-0.5 text-xs">D {u.perTab.devolucoes}</span>
                          <span className="rounded-md bg-neutral-800 px-2 py-0.5 text-xs">N {u.perTab["nao-identificado"]}</span>
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="px-4 py-3 border-t border-neutral-800 text-xs text-neutral-500">
            {perUser.length} usuário(s) encontrado(s).
          </div>
        </CardContent>
      </Card>

      {/* Lista de notas em atraso */}
      <Card className="bg-neutral-900/60 border-neutral-800">
        <CardHeader className="border-b border-neutral-800">
          <CardTitle className="text-sm text-neutral-300 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Notas em Atraso (Top 10)
            {loading && <div className="animate-spin h-4 w-4 border-2 border-neutral-500 border-t-transparent rounded-full"></div>}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-neutral-800">
                  <TableHead className="text-neutral-400">Data</TableHead>
                  <TableHead className="text-neutral-400">Nota Fiscal</TableHead>
                  <TableHead className="text-neutral-400">Loja</TableHead>
                  <TableHead className="text-neutral-400">Valor</TableHead>
                  <TableHead className="text-neutral-400">Responsável</TableHead>
                  <TableHead className="text-neutral-400">Dias em atraso</TableHead>
                  <TableHead className="text-neutral-400">Mensagem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-neutral-400 py-10">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin h-5 w-5 border-2 border-neutral-500 border-t-transparent rounded-full"></div>
                        Carregando dados...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : overdueList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-neutral-400 py-10">
                      Nenhuma nota em atraso nos filtros atuais.
                    </TableCell>
                  </TableRow>
                ) : (
                  overdueList.map((n) => (
                    <TableRow key={n.id} className="border-neutral-800 hover:bg-neutral-800/40">
                      <TableCell className="text-neutral-200">{n.data}</TableCell>
                      <TableCell className="text-neutral-200">{n.notaFiscal}</TableCell>
                      <TableCell className="text-neutral-200">{n.nomeLoja}</TableCell>
                      <TableCell className="text-neutral-200">{formatBRL(Number(n.valor) || 0)}</TableCell>
                      <TableCell className="text-neutral-200">{n.assignedTo}</TableCell>
                      <TableCell className="text-neutral-200">
                        <Badge variant="outline" className="border-amber-700/40 text-amber-300 bg-amber-900/30">
                          {n.overdueDays}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-neutral-300">{n.mensagem || "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="px-4 py-3 border-t border-neutral-800 text-xs text-neutral-500">
            {overdueList.length} nota(s) listada(s).
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Pequeno componente para card de métrica
function MetricCard({
  icon,
  label,
  value,
  tone = "neutral",
  loading = false,
}: {
  icon: React.ReactNode
  label: string
  value: string
  tone?: "neutral" | "amber" | "emerald"
  loading?: boolean
}) {
  const toneClasses =
    tone === "amber"
      ? "border-amber-800/40 bg-amber-950/30 text-amber-200"
      : tone === "emerald"
      ? "border-emerald-800/40 bg-emerald-950/30 text-emerald-200"
      : "border-neutral-800 bg-neutral-900/60 text-neutral-200"
  
  return (
    <Card className={cn("border", toneClasses)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs text-neutral-400 flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-neutral-800/60 text-neutral-300">
            {icon}
          </span>
          {label}
          {loading && (
            <div className="animate-spin h-3 w-3 border border-neutral-500 border-t-transparent rounded-full"></div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-xl font-semibold tabular-nums">
          {loading ? (
            <div className="h-7 w-20 bg-neutral-800 animate-pulse rounded"></div>
          ) : (
            value
          )}
        </div>
      </CardContent>
    </Card>
  )
}