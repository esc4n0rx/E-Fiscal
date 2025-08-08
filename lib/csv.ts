import type { Note } from "@/types/note"

// Converte uma lista de notas para CSV com separador ";"
export function notesToCSV(rows: Note[]): string {
  const headers = [
    "Centro",
    "Data",
    "Nota Fiscal",
    "Loja",
    "Nome Loja",
    "Material",
    "Descrição",
    "Pedido",
    "Quantidade",
    "UMB",
    "Valor",
    "Remessa",
    "Mensagem",
  ]

  const escape = (val: unknown) => {
    const s = String(val ?? "")
    // Envolve em aspas e duplica aspas internas
    const q = `"${s.replace(/"/g, '""')}"`
    return q
  }

  const body = rows
    .map((r) =>
      [
        r.centro,
        r.data,
        r.notaFiscal,
        r.loja,
        r.nomeLoja,
        r.material,
        r.descricao,
        r.pedido,
        r.quantidade,
        r.umb,
        r.valor,
        r.remessa,
        r.mensagem,
      ]
        .map(escape)
        .join(";")
    )
    .join("\n")

  return [headers.map((h) => `"${h}"`).join(";"), body].join("\n")
}

// Dispara download do CSV no navegador (mock export)
export function downloadCSV(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.setAttribute("download", filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
