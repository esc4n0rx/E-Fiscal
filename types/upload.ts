export type RawNotaData = {
    destino: string
    dataFornecimento: any // Pode ser string (dd/mm/yyyy) ou number (serial Excel)
    notaFiscal: string
    origem: string
    descricaoOrigem: string
    material: string
    descricao: string
    pedido: string
    quantidade: number
    unidade: string
    valor: number
    fornecimento: string
    mensagemNF: string
  }
  
  export type NotaCompleta = {
    // Campos do arquivo
    destino: string
    data_fornecimento: string // YYYY-MM-DD format
    nota_fiscal: string
    origem: string
    descricao_origem: string
    material: string
    descricao: string
    pedido: string
    quantidade: number
    unidade: string
    valor: number
    fornecimento: string
    mensagem_nf: string
    
    // Campos automáticos
    data_upload: string // YYYY-MM-DD HH:mm:ss
    chave: string // data_fornecimento + nota_fiscal + origem + material (unicidade por item)
    tratamento: boolean // sempre false no upload
    categoria: 'padrao' | 'qualidade' | 'devolucao' | 'nao-identificado' // sempre 'padrao' no upload
  }
  
  export type UploadResponse = {
    success: boolean
    message: string
    processedCount?: number
    newRecordsCount?: number
    duplicatesCount?: number
  }