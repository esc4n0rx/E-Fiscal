export type Note = {
  id: number
  centro: string
  data: string // YYYY-MM-DD
  notaFiscal: string
  loja: string
  nomeLoja: string
  material: string
  descricao: string
  pedido: string
  quantidade: number
  umb: string
  valor: number
  remessa: string
  mensagem: string
  aba: "principal" | "qualidade" | "devolucoes" | "nao-identificado"
}

// Novo tipo para a tabela completa do BD
export type NotaBD = {
  id: number
  destino: string
  data_fornecimento: string
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
  data_upload: string
  chave: string
  tratamento: boolean
  categoria: 'padrao' | 'qualidade' | 'devolucao' | 'nao-identificado'
  created_at?: string
  updated_at?: string
}