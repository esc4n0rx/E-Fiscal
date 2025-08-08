"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HomeIcon as House, CheckCircle, RotateCcw, HelpCircle } from 'lucide-react'
import Filters from "@/components/filters"
import NotesTable from "@/components/notes-table"
import type { Note } from "@/types/note"

type Props = {
  data?: Note[]
  loading?: boolean
}

export default function TabbedView({
  data = [],
  loading = false,
}: Props) {
  // Separa dados por "aba"
  const principal = data.filter((n) => n.aba === "principal")
  const qualidade = data.filter((n) => n.aba === "qualidade")
  const devolucoes = data.filter((n) => n.aba === "devolucoes")
  const naoIdentificado = data.filter((n) => n.aba === "nao-identificado")

  return (
    <div>
      <Tabs defaultValue="principal" className="w-full">
        <div className="flex flex-col gap-3">
          <TabsList className="w-full justify-start bg-neutral-900 border border-neutral-800">
            <TabsTrigger value="principal" className="data-[state=active]:bg-neutral-800">
              <House className="h-4 w-4 mr-2" /> Principal
            </TabsTrigger>
            <TabsTrigger value="qualidade" className="data-[state=active]:bg-neutral-800">
              <CheckCircle className="h-4 w-4 mr-2" /> Qualidade
            </TabsTrigger>
            <TabsTrigger value="devolucoes" className="data-[state=active]:bg-neutral-800">
              <RotateCcw className="h-4 w-4 mr-2" /> Devoluções
            </TabsTrigger>
            <TabsTrigger value="nao-identificado" className="data-[state=active]:bg-neutral-800">
              <HelpCircle className="h-4 w-4 mr-2" /> Não identificado
            </TabsTrigger>
          </TabsList>

          {/* Filtros globais (afetam todas as abas) */}
          <Filters />

          <TabsContent value="principal" className="mt-0">
            <NotesTable title="Principal" rows={principal} tabKey="principal" loading={loading} />
          </TabsContent>
          <TabsContent value="qualidade" className="mt-0">
            <NotesTable title="Qualidade" rows={qualidade} tabKey="qualidade" loading={loading} />
          </TabsContent>
          <TabsContent value="devolucoes" className="mt-0">
            <NotesTable title="Devoluções" rows={devolucoes} tabKey="devolucoes" loading={loading} />
          </TabsContent>
          <TabsContent value="nao-identificado" className="mt-0">
            <NotesTable title="Não identificado" rows={naoIdentificado} tabKey="nao-identificado" loading={loading} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
