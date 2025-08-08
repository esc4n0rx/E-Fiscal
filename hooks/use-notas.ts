"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/components/store'
import { mapNotasBDToNotes, mapAbaToCategoria } from '@/lib/data-mapper'
import type { Note, NotaBD } from '@/types/note'
import type { NotasResponse, NotasFilters } from '@/app/api/notas/route'

type UseNotasOptions = {
  categoria?: 'padrao' | 'qualidade' | 'devolucao' | 'nao-identificado'
  autoFetch?: boolean
  limite?: number
}

type UseNotasReturn = {
  notes: Note[]
  loading: boolean
  error: string | null
  total: number
  refetch: () => Promise<void>
  refresh: () => Promise<void>
}

export function useNotas(options: UseNotasOptions = {}): UseNotasReturn {
  const { 
    categoria, 
    autoFetch = true, 
    limite = 1000 
  } = options

  const { filters } = useAppStore()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  const fetchNotas = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Monta os parâmetros da query
      const searchParams = new URLSearchParams()
      
      if (categoria) {
        searchParams.set('categoria', categoria)
      }
      
      if (filters.dateUpTo) {
        searchParams.set('dataUpTo', filters.dateUpTo)
      }
      
      if (filters.text.trim()) {
        searchParams.set('texto', filters.text.trim())
      }
      
      searchParams.set('limit', limite.toString())
      searchParams.set('offset', '0')

      console.log('[USE-NOTAS] Buscando notas com params:', Object.fromEntries(searchParams))

      const response = await fetch(`/api/notas?${searchParams.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`)
      }

      const result: NotasResponse = await response.json()

      if (!result.success) {
        throw new Error(result.message || 'Erro ao buscar notas')
      }

      // Converte dados do BD para formato da UI
      const notesUI = mapNotasBDToNotes(result.data)
      
      console.log(`[USE-NOTAS] Recebidas ${result.data.length} notas do BD, convertidas para ${notesUI.length} notas UI`)

      setNotes(notesUI)
      setTotal(result.total)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      console.error('[USE-NOTAS] Erro ao buscar notas:', err)
      setError(errorMessage)
      setNotes([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [categoria, filters.dateUpTo, filters.text, limite])

  // Auto-fetch quando dependências mudam
  useEffect(() => {
    if (autoFetch) {
      fetchNotas()
    }
  }, [fetchNotas, autoFetch])

  return {
    notes,
    loading,
    error,
    total,
    refetch: fetchNotas,
    refresh: fetchNotas
  }
}

/**
 * Hook para todas as abas (supervisor)
 */
export function useAllNotas(): UseNotasReturn {
  return useNotas({ categoria: undefined, limite: 5000 })
}

/**
 * Hook para aba específica
 */
export function useNotasByAba(aba: Note['aba']): UseNotasReturn {
  const categoria = mapAbaToCategoria(aba)
  return useNotas({ categoria })
}