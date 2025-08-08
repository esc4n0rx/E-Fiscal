import type { NotaBD } from '@/types/note'

export type CategorizedNote = NotaBD & {
  nova_categoria: 'padrao' | 'qualidade' | 'devolucao' | 'nao-identificado'
  nova_mensagem: string
}

export type CategorizationResult = {
  processadas: number
  padrao: number
  qualidade: number
  devolucao: number
  naoIdentificado: number
  notasReorganizadas: number
  notasAtualizadas: CategorizedNote[]
}

function gerarTextoPadrao(fornecimento: string): string {
  const remessa = '00' + fornecimento
  return `Remessa: ${remessa}; Sujeito a ICMS e Sub.Trib.; Outras Saídas; Outras Operações de Saída;`
}

function extrairIDs(texto: string): string[] {
  const regex = /\b\d{5}\b/g
  const matches = texto.match(regex) || []
  return [...new Set(matches)].sort()
}

function isTextoPadrao(mensagem: string, fornecimento: string): boolean {
  const textoPadrao = gerarTextoPadrao(fornecimento)
  const mensagemLimpa = mensagem.trim()
  
  if (mensagemLimpa === textoPadrao) {
    return true
  }
  
  const padrao2 = textoPadrao.replace('Sujeito a ICMS e Sub.Trib.', 'Isento ou não sujeito a ICMS')
  return mensagemLimpa === textoPadrao || mensagemLimpa === padrao2
}

function extrairTextosDiferentes(mensagem: string, fornecimento: string): string[] {
  const textoPadrao1 = gerarTextoPadrao(fornecimento)
  const textoPadrao2 = textoPadrao1.replace('Sujeito a ICMS e Sub.Trib.', 'Isento ou não sujeito a ICMS')
  
  const partes = mensagem.split(';').map(p => p.trim()).filter(p => p.length > 0)
  
  const partesComuns = [
    /^Remessa:\s*\d+$/,
    /^Sujeito a ICMS e Sub\.Trib\.$/,
    /^Isento ou não sujeito a ICMS$/,
    /^Outras Saídas$/,
    /^Outras Operações de Saída$/,
    /^Redução da base$/
  ]
  
  const partesDiferentes = partes.filter(parte => {
    return !partesComuns.some(regex => regex.test(parte))
  })
  
  return partesDiferentes
}

function agruparPorNotaFiscal(notas: NotaBD[]): Map<string, NotaBD[]> {
  const grupos = new Map<string, NotaBD[]>()
  
  for (const nota of notas) {
    const key = `${nota.nota_fiscal}_${nota.origem}`
    if (!grupos.has(key)) {
      grupos.set(key, [])
    }
    grupos.get(key)!.push(nota)
  }
  
  return grupos
}

function processarGrupoQualidade(grupo: NotaBD[]): CategorizedNote[] {
  if (grupo.length === 0) return []
  
  const mensagemReferencia = grupo[0].mensagem_nf || ''
  const ids = extrairIDs(mensagemReferencia)
  
  if (grupo.length === ids.length && ids.length > 0) {
    return grupo.map((nota, index) => ({
      ...nota,
      nova_categoria: 'qualidade' as const,
      nova_mensagem: ids[index]
    }))
  }
  
  else if (ids.length > 0) {
    const todosIds = ids.join('-')
    return grupo.map(nota => ({
      ...nota,
      nova_categoria: 'qualidade' as const,
      nova_mensagem: todosIds
    }))
  }
  
  else {
    return grupo.map(nota => categorizarNotaIndividual(nota))
  }
}

function categorizarNotaIndividual(nota: NotaBD): CategorizedNote {
  const mensagem = nota.mensagem_nf || ''
  const fornecimento = nota.fornecimento || ''
  
  if (isTextoPadrao(mensagem, fornecimento)) {
    return {
      ...nota,
      nova_categoria: 'nao-identificado',
      nova_mensagem: mensagem
    }
  }
  
  const textosDiferentes = extrairTextosDiferentes(mensagem, fornecimento)
  if (textosDiferentes.length > 0) {
    return {
      ...nota,
      nova_categoria: 'devolucao',
      nova_mensagem: textosDiferentes.join('; ')
    }
  }
  
  return {
    ...nota,
    nova_categoria: 'padrao',
    nova_mensagem: mensagem
  }
}

export function processarCategorizacao(notas: NotaBD[]): CategorizationResult {
  const resultado: CategorizationResult = {
    processadas: 0,
    padrao: 0,
    qualidade: 0,
    devolucao: 0,
    naoIdentificado: 0,
    notasReorganizadas: 0,
    notasAtualizadas: []
  }
  
  const gruposComIds: NotaBD[] = []
  const notasIndividuais: NotaBD[] = []
  
  for (const nota of notas) {
    const mensagem = nota.mensagem_nf || ''
    const ids = extrairIDs(mensagem)
    
    if (ids.length > 0) {
      gruposComIds.push(nota)
    } else {
      notasIndividuais.push(nota)
    }
  }
  
  if (gruposComIds.length > 0) {
    const grupos = agruparPorNotaFiscal(gruposComIds)
    
    for (const [key, grupo] of grupos) {
      const categorizadas = processarGrupoQualidade(grupo)
      
      const foiReorganizado = categorizadas.length === grupo.length && 
                             categorizadas.every(c => c.nova_categoria === 'qualidade') &&
                             categorizadas.every((c, i) => c.nova_mensagem !== grupo[i].mensagem_nf)
      
      if (foiReorganizado) {
        resultado.notasReorganizadas += categorizadas.length
      }
      
      resultado.notasAtualizadas.push(...categorizadas)
      
      for (const cat of categorizadas) {
        switch (cat.nova_categoria) {
          case 'padrao': resultado.padrao++; break
          case 'qualidade': resultado.qualidade++; break
          case 'devolucao': resultado.devolucao++; break
          case 'nao-identificado': resultado.naoIdentificado++; break
        }
      }
    }
  }
  
  for (const nota of notasIndividuais) {
    const categorizada = categorizarNotaIndividual(nota)
    resultado.notasAtualizadas.push(categorizada)
    
    switch (categorizada.nova_categoria) {
      case 'padrao': resultado.padrao++; break
      case 'qualidade': resultado.qualidade++; break
      case 'devolucao': resultado.devolucao++; break
      case 'nao-identificado': resultado.naoIdentificado++; break
    }
  }
  
  resultado.processadas = notas.length
  
  return resultado
}

export function prepararRegistrosParaBanco(notasCategorizadas: CategorizedNote[]): NotaBD[] {
  return notasCategorizadas.map(nota => ({
    ...nota,
    mensagem_nf: nota.nova_mensagem,
    categoria: nota.nova_categoria,
    tratamento: true
  }))
}