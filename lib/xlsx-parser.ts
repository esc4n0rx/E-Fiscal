import * as XLSX from 'xlsx'
import type { RawNotaData, NotaCompleta } from '@/types/upload'

/**
 * Converte número serial do Excel para data JavaScript
 * O Excel conta os dias desde 1º de janeiro de 1900
 */
function excelSerialToDate(serial: number): Date {
  // Excel incorretamente considera 1900 como ano bissexto
  // Por isso subtraímos 1 se a data for após 28/02/1900
  const excelEpoch = new Date(1900, 0, 1)
  const msPerDay = 24 * 60 * 60 * 1000
  
  // Se o serial for maior que 59 (depois de 28/02/1900), subtraímos 1 dia
  // para compensar o erro do Excel sobre 1900 ser bissexto
  const adjustedSerial = serial > 59 ? serial - 1 : serial
  
  const date = new Date(excelEpoch.getTime() + (adjustedSerial - 1) * msPerDay)
  return date
}

/**
 * Formata data para YYYY-MM-DD
 */
function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Converte data do formato dd/mm/yyyy para yyyy-mm-dd
 * Também lida com números seriais do Excel
 */
function convertDateFormat(dateInput: any): string {
  
  if (!dateInput) {
    return ''
  }
  
  // Se for um número (serial do Excel)
  if (typeof dateInput === 'number') {
    try {
      // Verifica se é um número serial válido do Excel (entre 1 e 50000 aprox.)
      if (dateInput >= 1 && dateInput <= 100000) {
        const date = excelSerialToDate(dateInput)
        const formatted = formatDateToYYYYMMDD(date)
        return formatted
      } else {
        return ''
      }
    } catch (error) {
      return ''
    }
  }
  
  // Se for string, tenta converter do formato dd/mm/yyyy
  if (typeof dateInput === 'string') {
    const trimmedDate = dateInput.trim()
    
    // Verifica se parece com formato dd/mm/yyyy
    if (trimmedDate.includes('/')) {
      const parts = trimmedDate.split('/')
      if (parts.length !== 3) {
        return ''
      }
      
      const [day, month, year] = parts
      const converted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      
      // Valida se a data é válida
      const dateTest = new Date(converted)
      if (isNaN(dateTest.getTime())) {
        
        return ''
      }
      
      return converted
    } else {
      const numericValue = parseFloat(trimmedDate)
      if (!isNaN(numericValue)) {
       
        return convertDateFormat(numericValue)
      } else {
        return ''
      }
    }
  }
  
  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) {
      return ''
    }
    const formatted = formatDateToYYYYMMDD(dateInput)
    return formatted
  }
  
  return ''
}

/**
 * Gera chave única baseada em data + nota fiscal + origem + material
 * Inclui o material para garantir unicidade quando uma NF tem múltiplos itens
 */
function generateKey(dataFornecimento: string, notaFiscal: string, origem: string, material: string): string {
  const key = `${dataFornecimento}_${notaFiscal}_${origem}_${material}`.replace(/\s+/g, '_')
  return key
}

/**
 * Converte valor monetário string para number
 */
function parseValorMonetario(valor: any): number {
  if (typeof valor === 'number') return valor
  if (typeof valor !== 'string') {
    return 0
  }
  
  const cleanValue = valor
    .replace(/[R$\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
  
  const parsed = parseFloat(cleanValue) || 0
  
  if (isNaN(parsed)) {
    return 0
  }
  
  return parsed
}

function parseQuantidade(qtd: any): number {
  if (typeof qtd === 'number') return qtd
  if (typeof qtd === 'string') {
    const parsed = parseFloat(qtd.replace(',', '.'))
    return isNaN(parsed) ? 0 : parsed
  }
  return 0
}

function validateRow(row: any, rowIndex: number): boolean {
  const requiredFields = [
    { field: 'Destino', value: row['Destino'] },
    { field: 'Data Fornecimento', value: row['Data Fornecimento'] },
    { field: 'Nota Fiscal', value: row['Nota Fiscal'] },
    { field: 'Origem', value: row['Origem'] },
    { field: 'Material', value: row['Material'] }
  ]
  
  const missingFields = requiredFields.filter(f => !f.value && f.value !== 0)
  
  if (missingFields.length > 0) {
    return false
  }
  
  return true
}

function rowToRawData(row: any, rowIndex: number): RawNotaData | null {
  if (!validateRow(row, rowIndex)) return null
  
  try {
    const rawData: RawNotaData = {
      destino: String(row['Destino'] || '').trim(),
      dataFornecimento: row['Data Fornecimento'],
      notaFiscal: String(row['Nota Fiscal'] || '').trim(),
      origem: String(row['Origem'] || '').trim(),
      descricaoOrigem: String(row['Descrição Origem'] || '').trim(),
      material: String(row['Material'] || '').trim(),
      descricao: String(row['Descrição'] || '').trim(),
      pedido: String(row['Pedido'] || '').trim(),
      quantidade: parseQuantidade(row['Qtd.']),
      unidade: String(row['Un.'] || '').trim(),
      valor: parseValorMonetario(row['Valor']),
      fornecimento: String(row['Fornecimento'] || '').trim(),
      mensagemNF: String(row['Mensagem NF'] || '').trim()
    }
    
    return rawData
  } catch (error) {
    return null
  }
}

function rawDataToNotaCompleta(raw: RawNotaData, originalIndex: number): NotaCompleta | null {
  const dataFormatada = convertDateFormat(raw.dataFornecimento)
  if (!dataFormatada) {
    return null
  }
  
  const agora = new Date().toISOString().replace('T', ' ').substring(0, 19)
  
  const chave = generateKey(dataFormatada, raw.notaFiscal, raw.origem, raw.material)
  
  const notaCompleta: NotaCompleta = {
    destino: raw.destino,
    data_fornecimento: dataFormatada,
    nota_fiscal: raw.notaFiscal,
    origem: raw.origem,
    descricao_origem: raw.descricaoOrigem,
    material: raw.material,
    descricao: raw.descricao,
    pedido: raw.pedido,
    quantidade: raw.quantidade,
    unidade: raw.unidade,
    valor: raw.valor,
    fornecimento: raw.fornecimento,
    mensagem_nf: raw.mensagemNF,
    data_upload: agora,
    chave,
    tratamento: false,
    categoria: 'padrao'
  }
  
  if (originalIndex === 0) {
  }
  
  return notaCompleta
}

export function parseXLSXFile(buffer: Buffer): NotaCompleta[] {
  
  try {
    const workbook = XLSX.read(buffer, { 
      type: 'buffer',
      cellDates: false, // Importante: não converte automaticamente para Date
      cellNF: false,    // Não aplica formatação numérica automática
      cellText: false   // Não converte tudo para texto
    })
    
    
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) {
      throw new Error('Arquivo não contém planilhas')
    }
    
    const worksheet = workbook.Sheets[sheetName]
    
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
    
    // Converte para JSON mantendo os tipos originais
    const rawData = XLSX.utils.sheet_to_json(worksheet, {
      raw: true, // Mantém valores originais (números permanecem números)
      dateNF: 'dd/mm/yyyy' // Formato padrão para datas (se fossem convertidas)
    })
    
    
    if (!Array.isArray(rawData) || rawData.length === 0) {
      throw new Error('Planilha vazia ou formato inválido')
    }
    
    const validData: NotaCompleta[] = []
    let linhasProcessadas = 0
    let linhasComErro = 0
    let linhasValidas = 0
    
    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i]
      linhasProcessadas++
      
      const rawNota = rowToRawData(row, i)
      if (rawNota) {
        const notaCompleta = rawDataToNotaCompleta(rawNota, i)
        if (notaCompleta) {
          validData.push(notaCompleta)
          linhasValidas++
        } else {
          linhasComErro++
        }
      } else {
        linhasComErro++
      }
      
    
    }
    
    
    if (validData.length > 0) {
      const valores = validData.map(n => n.valor).filter(v => v > 0)
      const valorTotal = valores.reduce((a, b) => a + b, 0)
      const materiaisUnicos = new Set(validData.map(n => n.material)).size
      const origensUnicas = new Set(validData.map(n => n.origem)).size
      const datasUnicas = new Set(validData.map(n => n.data_fornecimento))
      const notasFiscaisUnicas = new Set(validData.map(n => n.nota_fiscal)).size
      
      const chavesUnicas = new Set(validData.map(n => n.chave)).size
      const temDuplicataChave = chavesUnicas !== validData.length
      
      
      if (temDuplicataChave) {
        
        const chaveCount = new Map<string, number>()
        validData.forEach(nota => {
          const count = chaveCount.get(nota.chave) || 0
          chaveCount.set(nota.chave, count + 1)
        })
        
        const duplicatas = Array.from(chaveCount.entries())
          .filter(([, count]) => count > 1)
          .slice(0, 5) 
      }
    } else {
    }
    
    return validData
  } catch (error) {
    throw new Error(`Erro no processamento do arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
  }
}

export function validateXLSXStructure(buffer: Buffer): { valid: boolean; error?: string } {
 
  
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    
    if (!sheetName) {
      return { valid: false, error: 'Arquivo não contém planilhas' }
    }

    
    const worksheet = workbook.Sheets[sheetName]
    const allData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
    
    if (allData.length === 0) {
      return { valid: false, error: 'Planilha está vazia' }
    }
    
    const headers = allData[0] as string[]
    
    const requiredHeaders = [
      'Destino',
      'Data Fornecimento',
      'Nota Fiscal',
      'Origem',
      'Descrição Origem',
      'Material',
      'Descrição',
      'Pedido',
      'Qtd.',
      'Un.',
      'Valor',
      'Fornecimento',
      'Mensagem NF'
    ]
    
    const foundHeaders = headers.map(h => h?.toString().trim()).filter(Boolean)
    const missingHeaders = requiredHeaders.filter(required => 
      !foundHeaders.some(found => found === required)
    )
    
    if (missingHeaders.length > 0) {
      return { 
        valid: false, 
        error: `Colunas obrigatórias não encontradas: ${missingHeaders.join(', ')}` 
      }
    }
    
    if (allData.length < 2) {
    }
    
    
    return { valid: true }
  } catch (error) {
    return { 
      valid: false, 
      error: `Erro na validação: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
    }
  }
}