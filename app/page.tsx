"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { UserRound, ArrowRight } from 'lucide-react'
import { useAppStore } from "@/components/store"
import ThemeToggle from "@/components/theme-toggle"

export default function Page() {
  const router = useRouter()
  const { userName, setUserName, resetFilters } = useAppStore()
  const [name, setName] = useState(userName ?? "")

  // Se já tiver nome salvo, envia direto para o dashboard
  useEffect(() => {
    if (userName && userName.trim().length > 0) {
      router.replace("/dashboard")
    }
  }, [userName, router])

  const handleConfirm = () => {
    if (!name.trim()) return
    // Salva nome no estado global e reseta filtros
    setUserName(name.trim())
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
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-neutral-100">Identificação</CardTitle>
              <CardDescription className="text-neutral-400">
                Digite seu nome para personalizar sua experiência.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="nome" className="text-sm font-medium text-neutral-300">
                  Digite seu Nome
                </label>
                <Input
                  id="nome"
                  placeholder="Ex.: Maria Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleConfirm()
                  }}
                  className="bg-neutral-950 border-neutral-800 text-neutral-100 placeholder:text-neutral-500"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleConfirm}
                  disabled={!name.trim()}
                  className="bg-neutral-100 text-neutral-900 hover:bg-white disabled:opacity-50"
                >
                  Confirmar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
          <p className="mt-6 text-center text-xs text-neutral-500">
            Este é um mock sem backend. Seu nome e filtros ficam apenas no seu navegador.
          </p>
        </div>
      </div>
    </main>
  )
}
