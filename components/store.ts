"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

// Tipos do estado global
type Filters = {
  // Data limite (YYYY-MM-DD). Por padrão, hoje.
  dateUpTo: string
  // Texto de busca (aplica em múltiplas colunas)
  text: string
}

type AppState = {
  userName: string
  filters: Filters
  setUserName: (name: string) => void
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
      userName: "",
      filters: defaultFilters,
      setUserName: (name) => set({ userName: name }),
      setFilterText: (text) =>
        set((state) => ({ filters: { ...state.filters, text } })),
      setFilterDateUpTo: (date) =>
        set((state) => ({ filters: { ...state.filters, dateUpTo: date } })),
      resetFilters: () => set({ filters: defaultFilters }),
      clearUser: () => set({ userName: "", filters: defaultFilters }),
    }),
    {
      name: "controle-notas-app",
      version: 1,
      partialize: (state) => ({
        userName: state.userName,
        filters: state.filters,
      }),
    }
  )
)
