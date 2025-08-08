"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/components/store"
import Topbar from "@/components/topbar"
import TabbedView from "@/components/tabbed-view"
import SupervisorDashboard from "@/components/supervisor-dashboard"
import type { Note } from "@/types/note"

export default function DashboardPage({
  initialData = [],
}: {
  // Next.js cannot infer props: provide default props
  initialData?: Note[]
}) {
  const router = useRouter()
  const { userName } = useAppStore()
  const isSupervisor = (userName || "").trim().toLowerCase() === "leandro"
  const [data, setData] = useState<Note[]>(initialData)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Redireciona de volta se não houver usuário
  useEffect(() => {
    if (!userName || userName.trim().length === 0) {
      router.replace("/")
    }
  }, [userName, router])

  // Carrega mock de dados do arquivo público
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch("/data/notes.json", { cache: "no-store" })
        if (!res.ok) throw new Error("Falha ao carregar dados.")
        const json: Note[] = await res.json()
        setData(json)
      } catch (e: any) {
        setError(e?.message ?? "Erro ao carregar dados.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-200">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <Topbar title={isSupervisor ? "Visão de Supervisão" : "Painel de Notas"} />
        {error && (
          <div className="mt-4 rounded-lg border border-red-800/50 bg-red-950/40 p-4 text-sm text-red-200">
            {error}
          </div>
        )}
        <div className="mt-6">
          {isSupervisor ? (
            <SupervisorDashboard data={data} loading={loading} />
          ) : (
            <TabbedView data={data} loading={loading} />
          )}
        </div>
      </div>
    </main>
  )
}
