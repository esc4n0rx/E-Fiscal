"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, AlertCircle, Clock, Database, Shuffle } from 'lucide-react'
import type { CategorizationResult } from '@/lib/categorization'
import type { CategorizationResponse } from '@/app/api/categorizar-notas/route'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: () => void
}

type ProcessingState = 'idle' | 'processing' | 'success' | 'error'

export default function CategorizationDialog({ open, onOpenChange, onComplete }: Props) {
  const [state, setState] = useState<ProcessingState>('idle')
  const [progress, setProgress] = useState(0)
  const [resultado, setResultado] = useState<CategorizationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tempoProcessamento, setTempoProcessamento] = useState<string>('')

  const startCategorization = async () => {
    setState('processing')
    setProgress(0)
    setError(null)
    
    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + Math.random() * 20, 90))
      }, 500)

      const response = await fetch('/api/categorizar-notas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`)
      }

      const data: CategorizationResponse = await response.json()

      if (data.success) {
        setState('success')
        setResultado(data.resultado || null)
        setTempoProcessamento(data.tempoProcessamento || '')
        
        setTimeout(() => {
          onComplete()
          onOpenChange(false)
          setState('idle')
          setProgress(0)
        }, 4000)
      } else {
        throw new Error(data.message)
      }

    } catch (err) {
      setState('error')
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    }
  }

  const handleClose = () => {
    if (state !== 'processing') {
      onOpenChange(false)
      setState('idle')
      setProgress(0)
      setError(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Categorização de Notas
          </DialogTitle>
          <DialogDescription>
            {state === 'idle' && 'Processar categorização automática das notas não tratadas.'}
            {state === 'processing' && 'Categorizando e reorganizando notas...'}
            {state === 'success' && 'Categorização concluída com sucesso!'}
            {state === 'error' && 'Erro durante o processamento.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {state === 'idle' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-4">
                <h4 className="text-sm font-medium text-neutral-200 mb-2">Como funciona:</h4>
                <ul className="text-xs text-neutral-400 space-y-1">
                  <li>• <strong>Padrão:</strong> Texto padrão do sistema → Não identificado</li>
                  <li>• <strong>Qualidade:</strong> IDs de 5 dígitos → Reorganiza mensagens</li>
                  <li>• <strong>Devolução:</strong> Textos fora do padrão → Extrai diferenças</li>
                </ul>
              </div>
              <Button onClick={startCategorization} className="w-full">
                <Database className="h-4 w-4 mr-2" />
                Iniciar Categorização
              </Button>
            </div>
          )}

          {state === 'processing' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-neutral-400">
                  <Clock className="h-4 w-4 animate-spin" />
                  Reorganizando notas...
                </div>
                <Progress value={progress} className="w-full" />
                <div className="text-xs text-neutral-500 text-center">
                  {progress.toFixed(0)}% concluído
                </div>
              </div>
            </div>
          )}

          {state === 'success' && resultado && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Reorganização concluída!</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded border border-neutral-800 bg-neutral-900/60 p-3">
                  <div className="text-neutral-400">Processadas</div>
                  <div className="text-lg font-semibold text-neutral-200">{resultado.processadas}</div>
                </div>
                <div className="rounded border border-blue-800/40 bg-blue-950/30 p-3">
                  <div className="text-blue-400 flex items-center gap-1">
                    <Shuffle className="h-3 w-3" />
                    Reorganizadas
                  </div>
                  <div className="text-lg font-semibold text-blue-200">{resultado.notasReorganizadas}</div>
                </div>
                <div className="rounded border border-emerald-800/40 bg-emerald-950/30 p-3">
                  <div className="text-emerald-400">Qualidade</div>
                  <div className="text-lg font-semibold text-emerald-200">{resultado.qualidade}</div>
                </div>
                <div className="rounded border border-amber-800/40 bg-amber-950/30 p-3">
                  <div className="text-amber-400">Devolução</div>
                  <div className="text-lg font-semibold text-amber-200">{resultado.devolucao}</div>
                </div>
                <div className="rounded border border-neutral-800 bg-neutral-900/60 p-3">
                  <div className="text-neutral-400">Não Identificado</div>
                  <div className="text-lg font-semibold text-neutral-200">{resultado.naoIdentificado}</div>
                </div>
                <div className="rounded border border-neutral-800 bg-neutral-900/60 p-3">
                  <div className="text-neutral-400">Padrão</div>
                  <div className="text-lg font-semibold text-neutral-200">{resultado.padrao}</div>
                </div>
              </div>
              
              {tempoProcessamento && (
                <div className="text-xs text-neutral-500 text-center">
                  Tempo de processamento: {tempoProcessamento}
                </div>
              )}
              
              <div className="text-xs text-neutral-400 text-center">
                Fechando automaticamente em alguns segundos...
              </div>
            </div>
          )}

          {state === 'error' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Erro no processamento</span>
              </div>
              
              <div className="rounded border border-red-800/40 bg-red-950/30 p-3 text-sm text-red-200">
                {error}
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Fechar
                </Button>
                <Button onClick={startCategorization} className="flex-1">
                  Tentar Novamente
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}