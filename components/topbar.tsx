"use client"

import { useAppStore } from "@/components/store"
import { Button } from "@/components/ui/button"
import { LogOut } from 'lucide-react'
import ThemeToggle from "@/components/theme-toggle"

export default function Topbar({
  title = "Controle de Notas",
}: {
  // Next.js default props
  title?: string
}) {
  const { userName, clearUser } = useAppStore()

  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-neutral-100">
          Bem-vindo, {userName || "Usuário"}
        </h1>
        <p className="text-sm text-neutral-400">{title}</p>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button
          variant="ghost"
          className="text-neutral-300 hover:text-white hover:bg-neutral-800"
          onClick={clearUser}
          aria-label="Sair e limpar identificação"
          title="Sair e limpar identificação"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Trocar usuário
        </Button>
      </div>
    </header>
  )
}
