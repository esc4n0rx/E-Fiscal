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
