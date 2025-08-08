import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { parseXLSXFile, validateXLSXStructure } from '@/lib/xlsx-parser'
import type { UploadResponse, NotaCompleta } from '@/types/upload'

// Chave de API fixa para autenticação
const API_KEY = process.env.UPLOAD_API_KEY

if (!API_KEY) {
  throw new Error('UPLOAD_API_KEY não configurada no ambiente')
}

/**
 * Utilitário para logs estruturados
 */
function logInfo(message: string, data?: any) {
  console.log(`[UPLOAD-API] ${new Date().toISOString()} - INFO: ${message}`, data ? JSON.stringify(data, null, 2) : '')
}

function logError(message: string, error?: any) {
  console.error(`[UPLOAD-API] ${new Date().toISOString()} - ERROR: ${message}`, error)
}

function logWarning(message: string, data?: any) {
  console.warn(`[UPLOAD-API] ${new Date().toISOString()} - WARNING: ${message}`, data ? JSON.stringify(data, null, 2) : '')
}

/**
 * Verifica se as chaves já existem no banco
 */
async function getExistingKeys(chaves: string[]): Promise<Set<string>> {
  try {
    logInfo(`Verificando ${chaves.length} chaves existentes no banco`)
    
    const { data, error } = await supabase
      .from('efiscal_notas')
      .select('chave')
      .in('chave', chaves)

    if (error) {
      logError('Erro ao buscar chaves existentes no Supabase:', error)
      return new Set()
    }

    const existingKeysSet = new Set(data?.map(item => item.chave) || [])
    logInfo(`Encontradas ${existingKeysSet.size} chaves já existentes no banco`)
    
    return existingKeysSet
  } catch (error) {
    logError('Erro na consulta de chaves:', error)
    return new Set()
  }
}

/**
 * Insere novos registros no banco
 */
async function insertNotas(notas: NotaCompleta[]): Promise<{ success: boolean; insertedCount: number }> {
  try {
    logInfo(`Tentando inserir ${notas.length} notas no banco`)
    
    // Log da primeira nota para debug
    if (notas.length > 0) {
      logInfo('Exemplo da primeira nota a ser inserida:', {
        chave: notas[0].chave,
        destino: notas[0].destino,
        data_fornecimento: notas[0].data_fornecimento,
        nota_fiscal: notas[0].nota_fiscal,
        valor: notas[0].valor
      })
    }

    const { data, error } = await supabase
      .from('efiscal_notas')
      .insert(notas)
      .select('id')

    if (error) {
      logError('Erro do Supabase ao inserir notas:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      throw error
    }

    const insertedCount = data?.length || 0
    logInfo(`Inserção bem-sucedida: ${insertedCount} registros inseridos`)

    return {
      success: true,
      insertedCount
    }
  } catch (error) {
    logError('Erro na inserção no banco:', error)
    return {
      success: false,
      insertedCount: 0
    }
  }
}

/**
 * Valida chave de API
 */
function validateApiKey(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const apiKey = request.headers.get('x-api-key')
  
  logInfo('Validando chave de API', {
    hasAuthHeader: !!authHeader,
    hasApiKeyHeader: !!apiKey,
    authHeaderPrefix: authHeader?.substring(0, 10)
  })
  
  // Aceita tanto Authorization: Bearer <key> quanto X-API-Key: <key>
  const providedKey = authHeader?.replace('Bearer ', '') || apiKey
  
  const isValid = providedKey === API_KEY
  logInfo(`Validação de API key: ${isValid ? 'VÁLIDA' : 'INVÁLIDA'}`)
  
  return isValid
}

/**
 * Handler POST para upload de arquivo XLSX
 */
export async function POST(request: NextRequest): Promise<NextResponse<UploadResponse>> {
  const startTime = Date.now()
  logInfo('=== INÍCIO DO UPLOAD ===')
  
  try {
    // Validação da chave de API
    logInfo('Etapa 1: Validando chave de API')
    if (!validateApiKey(request)) {
      logWarning('Acesso negado: chave de API inválida')
      return NextResponse.json(
        { success: false, message: 'Chave de API inválida' },
        { status: 401 }
      )
    }
    logInfo('✓ Chave de API válida')

    // Verificação do Content-Type
    logInfo('Etapa 2: Verificando Content-Type')
    const contentType = request.headers.get('content-type')
    logInfo('Content-Type recebido:', contentType)
    
    if (!contentType?.includes('multipart/form-data')) {
      logError('Content-Type inválido', { received: contentType, expected: 'multipart/form-data' })
      return NextResponse.json(
        { success: false, message: 'Content-Type deve ser multipart/form-data' },
        { status: 400 }
      )
    }
    logInfo('✓ Content-Type válido')

    // Obtenção do arquivo
    logInfo('Etapa 3: Processando FormData')
    let formData: FormData
    try {
      formData = await request.formData()
      logInfo('✓ FormData processado com sucesso')
    } catch (error) {
      logError('Erro ao processar FormData:', error)
      return NextResponse.json(
        { success: false, message: 'Erro ao processar dados do formulário' },
        { status: 400 }
      )
    }

    // Log de todos os campos do FormData
    const formDataEntries: Record<string, any> = {}
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        formDataEntries[key] = {
          type: 'File',
          name: value.name,
          size: value.size,
          mimeType: value.type
        }
      } else {
        formDataEntries[key] = value
      }
    }
    logInfo('Campos do FormData:', formDataEntries)

    const file = formData.get('file') as File
    if (!file) {
      logError('Campo "file" não encontrado no FormData')
      return NextResponse.json(
        { success: false, message: 'Arquivo não encontrado no campo "file"' },
        { status: 400 }
      )
    }

    logInfo('Arquivo recebido:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified ? new Date(file.lastModified).toISOString() : 'N/A'
    })

    // Validação do tipo de arquivo
    logInfo('Etapa 4: Validando tipo de arquivo')
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      logError('Tipo de arquivo inválido', { fileName: file.name })
      return NextResponse.json(
        { success: false, message: 'Apenas arquivos .xlsx são aceitos' },
        { status: 400 }
      )
    }
    logInfo('✓ Tipo de arquivo válido (.xlsx)')

    // Verificação do tamanho (máximo 10MB)
    logInfo('Etapa 5: Verificando tamanho do arquivo')
    const maxSize = 10 * 1024 * 1024 // 10MB
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2)
    logInfo(`Tamanho do arquivo: ${file.size} bytes (${fileSizeMB} MB)`)
    
    if (file.size > maxSize) {
      logError('Arquivo muito grande', { 
        size: file.size, 
        maxSize, 
        sizeMB: fileSizeMB 
      })
      return NextResponse.json(
        { success: false, message: `Arquivo muito grande (${fileSizeMB}MB). Máximo 10MB permitido` },
        { status: 400 }
      )
    }
    logInfo('✓ Tamanho do arquivo válido')

    // Conversão para buffer
    logInfo('Etapa 6: Convertendo arquivo para buffer')
    let arrayBuffer: ArrayBuffer
    let buffer: Buffer
    
    try {
      arrayBuffer = await file.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
      logInfo(`✓ Arquivo convertido para buffer (${buffer.length} bytes)`)
    } catch (error) {
      logError('Erro ao converter arquivo para buffer:', error)
      return NextResponse.json(
        { success: false, message: 'Erro ao processar arquivo' },
        { status: 400 }
      )
    }

    // Validação da estrutura do arquivo
    logInfo('Etapa 7: Validando estrutura do arquivo XLSX')
    let validation: { valid: boolean; error?: string }
    try {
      validation = validateXLSXStructure(buffer)
      logInfo('Resultado da validação de estrutura:', validation)
    } catch (error) {
      logError('Erro na validação de estrutura:', error)
      return NextResponse.json(
        { success: false, message: 'Erro ao validar estrutura do arquivo' },
        { status: 400 }
      )
    }
    
    if (!validation.valid) {
      logError('Estrutura de arquivo inválida', validation)
      return NextResponse.json(
        { success: false, message: validation.error || 'Estrutura de arquivo inválida' },
        { status: 400 }
      )
    }
    logInfo('✓ Estrutura do arquivo válida')

    // Parse dos dados
    logInfo('Etapa 8: Fazendo parse dos dados do arquivo')
    let notas: NotaCompleta[]
    try {
      notas = parseXLSXFile(buffer)
      logInfo(`✓ Parse concluído: ${notas.length} registros processados`)
      
      // Log de estatísticas básicas
      if (notas.length > 0) {
        const valores = notas.map(n => n.valor).filter(v => v > 0)
        const valorTotal = valores.reduce((a, b) => a + b, 0)
        const primeiraData = notas[0]?.data_fornecimento
        const ultimaData = notas[notas.length - 1]?.data_fornecimento
        
        logInfo('Estatísticas dos dados:', {
          totalRegistros: notas.length,
          valorTotal: valorTotal.toFixed(2),
          primeiraData,
          ultimaData,
          exemploChave: notas[0]?.chave
        })
      }
    } catch (error) {
      logError('Erro no parsing do arquivo:', error)
      return NextResponse.json(
        { 
          success: false, 
          message: `Erro no processamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
        },
        { status: 400 }
      )
    }

    if (notas.length === 0) {
      logWarning('Nenhum registro válido encontrado após o parsing')
      return NextResponse.json(
        { success: false, message: 'Nenhum registro válido encontrado no arquivo' },
        { status: 400 }
      )
    }

    // Verificação de duplicatas
    logInfo('Etapa 9: Verificando duplicatas no banco')
    const chaves = notas.map(nota => nota.chave)
    logInfo(`Verificando ${chaves.length} chaves únicas`)
    
    const existingKeys = await getExistingKeys(chaves)
    
    // Filtra apenas registros novos
    const notasNovas = notas.filter(nota => !existingKeys.has(nota.chave))
    
    logInfo('Resultado da verificação de duplicatas:', {
      totalProcessados: notas.length,
      duplicatasEncontradas: notas.length - notasNovas.length,
      novosRegistros: notasNovas.length
    })

    // Inserção no banco
    let insertedCount = 0
    if (notasNovas.length > 0) {
      logInfo('Etapa 10: Inserindo novos registros no banco')
      const insertResult = await insertNotas(notasNovas)
      if (!insertResult.success) {
        logError('Falha na inserção no banco de dados')
        return NextResponse.json(
          { success: false, message: 'Erro ao salvar dados no banco' },
          { status: 500 }
        )
      }
      insertedCount = insertResult.insertedCount
      logInfo(`✓ Inserção concluída: ${insertedCount} registros salvos`)
    } else {
      logInfo('Nenhum registro novo para inserir (todos eram duplicatas)')
    }

    // Resposta de sucesso
    const totalTime = Date.now() - startTime
    const response = {
      success: true,
      message: `Processamento concluído com sucesso`,
      processedCount: notas.length,
      newRecordsCount: insertedCount,
      duplicatesCount: notas.length - insertedCount
    }

    logInfo('=== UPLOAD CONCLUÍDO COM SUCESSO ===', {
      ...response,
      tempoProcessamento: `${totalTime}ms`
    })

    return NextResponse.json(response)

  } catch (error) {
    const totalTime = Date.now() - startTime
    logError('=== ERRO GERAL NO UPLOAD ===', {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      tempoProcessamento: `${totalTime}ms`
    })
    
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * Handler GET para verificação de status da API
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  logInfo('Verificação de status da API solicitada')
  
  if (!validateApiKey(request)) {
    logWarning('Tentativa de acesso ao status com chave inválida')
    return NextResponse.json(
      { error: 'Chave de API inválida' },
      { status: 401 }
    )
  }

  const response = {
    status: 'API de upload funcionando',
    timestamp: new Date().toISOString(),
    endpoint: '/api/upload-notas',
    environment: process.env.NODE_ENV || 'unknown'
  }

  logInfo('Status verificado com sucesso', response)

  return NextResponse.json(response)
}