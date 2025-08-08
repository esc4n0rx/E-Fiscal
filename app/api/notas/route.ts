import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { NotaBD } from '@/types/note'

export type NotasResponse = {
  success: boolean
  data: NotaBD[]
  message?: string
  total: number
}

export type NotasFilters = {
  categoria?: 'padrao' | 'qualidade' | 'devolucao' | 'nao-identificado'
  dataUpTo?: string // YYYY-MM-DD
  texto?: string
  tratamento?: boolean
  limit?: number
  offset?: number
}

/**
 * GET /api/notas - Busca notas com filtros
 * Query params:
 * - categoria: padrao|qualidade|devolucao|nao-identificado
 * - dataUpTo: YYYY-MM-DD (filtro de data até)
 * - texto: string (busca em múltiplos campos)
 * - tratamento: true|false (só notas tratadas/não tratadas)
 * - limit: número (paginação)
 * - offset: número (paginação)
 */
export async function GET(request: NextRequest): Promise<NextResponse<NotasResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse dos filtros
    const filters: NotasFilters = {
      categoria: searchParams.get('categoria') as NotasFilters['categoria'] || undefined,
      dataUpTo: searchParams.get('dataUpTo') || undefined,
      texto: searchParams.get('texto') || undefined,
      tratamento: searchParams.get('tratamento') ? searchParams.get('tratamento') === 'true' : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 1000,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0
    }


    // Constroi a query base
    let query = supabase
      .from('efiscal_notas')
      .select('*', { count: 'exact' })

    // Aplica filtros
    if (filters.categoria) {
      query = query.eq('categoria', filters.categoria)
    }

    if (filters.dataUpTo) {
      query = query.lte('data_fornecimento', filters.dataUpTo)
    }

    if (filters.tratamento !== undefined) {
      query = query.eq('tratamento', filters.tratamento)
    }

    // Filtro de texto - busca em múltiplos campos
    if (filters.texto && filters.texto.trim()) {
      const texto = filters.texto.trim().toLowerCase()
      
      // No Supabase, fazemos múltiplas queries OR usando .or()
      query = query.or(`
        destino.ilike.%${texto}%,
        nota_fiscal.ilike.%${texto}%,
        origem.ilike.%${texto}%,
        descricao_origem.ilike.%${texto}%,
        material.ilike.%${texto}%,
        descricao.ilike.%${texto}%,
        pedido.ilike.%${texto}%,
        fornecimento.ilike.%${texto}%,
        mensagem_nf.ilike.%${texto}%
      `)
    }

    // Ordenação e paginação
    query = query
      .order('data_fornecimento', { ascending: false })
      .order('created_at', { ascending: false })
      .range(filters.offset!, filters.offset! + filters.limit! - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('[NOTAS-API] Erro do Supabase:', error)
      return NextResponse.json(
        { 
          success: false, 
          data: [], 
          message: 'Erro ao buscar notas no banco de dados',
          total: 0
        },
        { status: 500 }
      )
    }


    return NextResponse.json({
      success: true,
      data: data || [],
      total: count || 0
    })

  } catch (error) {
    console.error('[NOTAS-API] Erro geral:', error)
    return NextResponse.json(
      { 
        success: false, 
        data: [], 
        message: 'Erro interno do servidor',
        total: 0
      },
      { status: 500 }
    )
  }
}