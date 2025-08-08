"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Database, Loader2 } from 'lucide-react'
import CategorizationDialog from "@/components/categorization-dialog"

type Props = {
  onCategorized?: () => void
}

export default function CategorizeButton({ onCategorized }: Props) {
  const [hasUntreated, setHasUntreated] = useState(false)
  const [untreatedCount, setUntreatedCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  const checkUntreatedNotes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/categorizar-notas')
      
      if (response.ok) {
        const data = await response.json()
        setHasUntreated(data.hasUntreated)
        setUntreatedCount(data.count || 0)
      }
    } catch (error) {
      console.error('Erro ao verificar notas não tratadas:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkUntreatedNotes()
  }, [])

  const handleCategorized = () => {
    // Atualiza estado após categorização
    setHasUntreated(false)
    setUntreatedCount(0)
    
    // Callback para atualizar outros componentes
    if (onCategorized) {
      onCategorized()
    }
  }

  // Não mostra nada se não há notas não tratadas
  if (loading) {
    return (
      <Button disabled variant="outline" size="sm">
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Verificando...
      </Button>
    )
  }

  if (!hasUntreated) {
    return null
  }

  return (
    <>
      <Button 
        onClick={() => setDialogOpen(true)}
        className="bg-emerald-600 hover:bg-emerald-700 text-white"
        size="sm"
      >
        <Database className="h-4 w-4 mr-2" />
        Categorizar Notas ({untreatedCount})
      </Button>
      
      <CategorizationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onComplete={handleCategorized}
      />
    </>
  )
}