import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { processarCategorizacao, prepararRegistrosParaBanco } from '@/lib/categorization'
import type { NotaBD } from '@/types/note'
import type { CategorizationResult } from '@/lib/categorization'

export type CategorizationResponse = {
  success: boolean
  message: string
  resultado?: CategorizationResult
  tempoProcessamento?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<CategorizationResponse>> {
  const startTime = Date.now()
  
  try {
    const { data: notasNaoTratadas, error: fetchError } = await supabase
      .from('efiscal_notas')
      .select('*')
      .eq('tratamento', false)
      .order('nota_fiscal', { ascending: true })
      .order('material', { ascending: true })

    if (fetchError) {
      return NextResponse.json(
        { success: false, message: 'Erro ao buscar notas não tratadas' },
        { status: 500 }
      )
    }

    if (!notasNaoTratadas || notasNaoTratadas.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhuma nota não tratada encontrada',
        resultado: {
          processadas: 0,
          padrao: 0,
          qualidade: 0,
          devolucao: 0,
          naoIdentificado: 0,
          notasReorganizadas: 0,
          notasAtualizadas: []
        }
      })
    }

    const resultado = processarCategorizacao(notasNaoTratadas as NotaBD[])
    
    const registrosAtualizados = prepararRegistrosParaBanco(resultado.notasAtualizadas)
    
    const BATCH_SIZE = 50
    let totalAtualizados = 0
    
    for (let i = 0; i < registrosAtualizados.length; i += BATCH_SIZE) {
      const lote = registrosAtualizados.slice(i, i + BATCH_SIZE)
      
      for (const registro of lote) {
        const { error: updateError } = await supabase
          .from('efiscal_notas')
          .update({
            mensagem_nf: registro.mensagem_nf,
            categoria: registro.categoria,
            tratamento: registro.tratamento
          })
          .eq('id', registro.id)

        if (updateError) {
          return NextResponse.json(
            { success: false, message: `Erro ao atualizar registro ${registro.id}` },
            { status: 500 }
          )
        }
        
        totalAtualizados++
      }
    }

    const tempoProcessamento = `${Date.now() - startTime}ms`

    return NextResponse.json({
      success: true,
      message: 'Categorização concluída com sucesso',
      resultado: {
        ...resultado,
        processadas: notasNaoTratadas.length
      },
      tempoProcessamento
    })

  } catch (error) {
    const tempoProcessamento = `${Date.now() - startTime}ms`
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro interno durante categorização',
        tempoProcessamento
      },
      { status: 500 }
    )
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    const { count, error } = await supabase
      .from('efiscal_notas')
      .select('*', { count: 'exact', head: true })
      .eq('tratamento', false)

    if (error) {
      return NextResponse.json(
        { hasUntreated: false, count: 0, error: 'Erro ao verificar notas' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      hasUntreated: (count || 0) > 0,
      count: count || 0
    })

  } catch (error) {
    return NextResponse.json(
      { hasUntreated: false, count: 0, error: 'Erro interno' },
      { status: 500 }
    )
  }
}