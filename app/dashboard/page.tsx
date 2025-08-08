"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/components/store"
import Topbar from "@/components/topbar"
import TabbedView from "@/components/tabbed-view"
import SupervisorDashboard from "@/components/supervisor-dashboard"

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAppStore()
  const isSupervisor = user?.role === 'supervisor'

  // Redireciona de volta se não houver usuário
  useEffect(() => {
    if (!user || !user.nome?.trim().length) {
      router.replace("/")
    }
  }, [user, router])

  // Mostra loading enquanto não carregou o usuário
  if (!user) {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-200">
        <div className="container mx-auto px-4 py-6 md:py-8">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-neutral-400">Carregando...</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-200">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <Topbar title={isSupervisor ? "Visão de Supervisão" : "Painel de Notas"} />
        <div className="mt-6">
          {isSupervisor ? (
            <SupervisorDashboard data={[]} loading={false} />
          ) : (
            <TabbedView data={[]} loading={false} />
          )}
        </div>
      </div>
    </main>
  )
}