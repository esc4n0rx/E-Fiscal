"use client"

import { useAppStore } from "@/components/store"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calendar, Search, X } from 'lucide-react'

export default function Filters({
  showReset = true,
}: {
  // Next.js default props
  showReset?: boolean
}) {
  const { filters, setFilterText, setFilterDateUpTo, resetFilters } = useAppStore()

  return (
    <section
      aria-label="Filtros"
      className="mb-4 rounded-xl border border-neutral-800 bg-neutral-900/60 p-3"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Filtro por texto */}
        <div className="flex flex-col">
          <label className="text-xs text-neutral-400 mb-1" htmlFor="filter-text">
            Filtro por texto
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <Input
              id="filter-text"
              placeholder="Buscar em Centro, NF, Loja, Material, etc."
              value={filters.text}
              onChange={(e) => setFilterText(e.target.value)}
              className="pl-9 bg-neutral-950 border-neutral-800 text-neutral-100 placeholder:text-neutral-500"
            />
          </div>
        </div>

        {/* Filtro por data (até) */}
        <div className="flex flex-col">
          <label className="text-xs text-neutral-400 mb-1" htmlFor="filter-date">
            Mostrar até a data
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <Input
              id="filter-date"
              type="date"
              value={filters.dateUpTo}
              onChange={(e) => setFilterDateUpTo(e.target.value)}
              className="pl-9 bg-neutral-950 border-neutral-800 text-neutral-100"
            />
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-end gap-2">
          {showReset && (
            <Button
              variant="ghost"
              onClick={resetFilters}
              className="w-full md:w-auto text-neutral-300 hover:text-white hover:bg-neutral-800"
              aria-label="Limpar filtros"
              title="Limpar filtros"
            >
              <X className="h-4 w-4 mr-2" />
              Limpar filtros
            </Button>
          )}
        </div>
      </div>
      <p className="mt-2 text-[11px] text-neutral-500">
        Os dados são carregados via mock até a data selecionada. Você pode alterar os filtros a qualquer momento.
      </p>
    </section>
  )
}
