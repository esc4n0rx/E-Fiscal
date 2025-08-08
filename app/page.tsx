"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { UserRound } from 'lucide-react'
import { useAppStore } from "@/components/store"
import ThemeToggle from "@/components/theme-toggle"
import LoginForm from "@/components/auth/login-form"
import type { User } from "@/types/user"

export default function Page() {
  const router = useRouter()
  const { user, setUser, resetFilters } = useAppStore()

  // Se já tiver usuário logado, envia direto para o dashboard
  useEffect(() => {
    if (user && user.nome?.trim().length > 0) {
      router.replace("/dashboard")
    }
  }, [user, router])

  const handleLoginSuccess = (userData: User) => {
    // Salva usuário no estado global e reseta filtros
    setUser(userData)
    resetFilters()
    router.push("/dashboard")
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-200">
      <div className="container mx-auto px-4 py-10 md:py-16">
        <header className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center">
              <UserRound className="h-5 w-5 text-neutral-300" />
            </div>
            <span className="text-sm text-neutral-400">Controle de Notas</span>
          </div>
          <ThemeToggle />
        </header>

        <div className="mx-auto max-w-lg">
          <LoginForm onSuccess={handleLoginSuccess} />
          <p className="mt-6 text-center text-xs text-neutral-500">
            Sistema integrado com banco de dados. Seus dados ficam seguros no servidor.
          </p>
        </div>
      </div>
    </main>
  )
}