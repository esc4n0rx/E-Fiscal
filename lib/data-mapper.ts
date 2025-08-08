import type { NotaBD, Note } from '@/types/note'

/**
 * Mapeia dados do banco (NotaBD) para formato da UI (Note)
 */
export function mapNotaBDToNote(notaBD: NotaBD): Note {
  return {
    id: notaBD.id,
    centro: notaBD.destino, // Mapeamento: destino → centro
    data: notaBD.data_fornecimento,
    notaFiscal: notaBD.nota_fiscal,
    loja: notaBD.origem, // Mapeamento: origem → loja
    nomeLoja: notaBD.descricao_origem, // Mapeamento: descricao_origem → nomeLoja
    material: notaBD.material,
    descricao: notaBD.descricao,
    pedido: notaBD.pedido,
    quantidade: notaBD.quantidade,
    umb: notaBD.unidade, // Mapeamento: unidade → umb
    valor: notaBD.valor,
    remessa: notaBD.fornecimento, // Mapeamento: fornecimento → remessa
    mensagem: notaBD.mensagem_nf, // Mapeamento: mensagem_nf → mensagem
    aba: mapCategoriaToAba(notaBD.categoria)
  }
}

/**
 * Mapeia categoria do BD para aba da UI
 */
export function mapCategoriaToAba(categoria: NotaBD['categoria']): Note['aba'] {
  const mapping: Record<NotaBD['categoria'], Note['aba']> = {
    'padrao': 'principal',
    'qualidade': 'qualidade',
    'devolucao': 'devolucoes',
    'nao-identificado': 'nao-identificado'
  }
  return mapping[categoria]
}

/**
 * Mapeia aba da UI para categoria do BD
 */
export function mapAbaToCategoria(aba: Note['aba']): NotaBD['categoria'] {
  const mapping: Record<Note['aba'], NotaBD['categoria']> = {
    'principal': 'padrao',
    'qualidade': 'qualidade',
    'devolucoes': 'devolucao',
    'nao-identificado': 'nao-identificado'
  }
  return mapping[aba]
}

/**
 * Converte lista de notas do BD para formato da UI
 */
export function mapNotasBDToNotes(notasBD: NotaBD[]): Note[] {
  return notasBD.map(mapNotaBDToNote)
}

/**
 * Filtra notas por aba (para compatibilidade)
 */
export function filterNotesByAba(notes: Note[], aba: Note['aba']): Note[] {
  return notes.filter(note => note.aba === aba)
}