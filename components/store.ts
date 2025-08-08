"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User } from "@/types/user"

// Tipos do estado global
type Filters = {
  // Data limite (YYYY-MM-DD). Por padrão, hoje.
  dateUpTo: string
  // Texto de busca (aplica em múltiplas colunas)
  text: string
}

type AppState = {
  user: User | null
  filters: Filters
  setUser: (user: User | null) => void
  setFilterText: (text: string) => void
  setFilterDateUpTo: (date: string) => void
  resetFilters: () => void
  clearUser: () => void
}

// Helper para formatar "YYYY-MM-DD"
function formatDateYYYYMMDD(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

const defaultFilters: Filters = {
  dateUpTo: formatDateYYYYMMDD(new Date()),
  text: "",
}

// Estado global com persistência em localStorage
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      filters: defaultFilters,
      setUser: (user) => set({ user }),
      setFilterText: (text) =>
        set((state) => ({ filters: { ...state.filters, text } })),
      setFilterDateUpTo: (date) =>
        set((state) => ({ filters: { ...state.filters, dateUpTo: date } })),
      resetFilters: () => set({ filters: defaultFilters }),
      clearUser: () => set({ user: null, filters: defaultFilters }),
    }),
    {
      name: "controle-notas-app",
      version: 2,
      partialize: (state) => ({
        user: state.user,
        filters: state.filters,
      }),
    }
  )
)