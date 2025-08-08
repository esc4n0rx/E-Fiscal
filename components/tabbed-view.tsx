"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HomeIcon as House, CheckCircle, RotateCcw, HelpCircle } from 'lucide-react'
import Filters from "@/components/filters"
import NotesTable from "@/components/notes-table"
import { useNotasByAba } from "@/hooks/use-notas"

export default function TabbedView() {
  // Hooks para cada aba - busca dados específicos por categoria
  const principal = useNotasByAba('principal')
  const qualidade = useNotasByAba('qualidade')
  const devolucoes = useNotasByAba('devolucoes')
  const naoIdentificado = useNotasByAba('nao-identificado')

  return (
    <div>
      <Tabs defaultValue="principal" className="w-full">
        <div className="flex flex-col gap-3">
          <TabsList className="w-full justify-start bg-neutral-900 border border-neutral-800">
            <TabsTrigger value="principal" className="data-[state=active]:bg-neutral-800">
              <House className="h-4 w-4 mr-2" /> Principal ({principal.total})
            </TabsTrigger>
            <TabsTrigger value="qualidade" className="data-[state=active]:bg-neutral-800">
              <CheckCircle className="h-4 w-4 mr-2" /> Qualidade ({qualidade.total})
            </TabsTrigger>
            <TabsTrigger value="devolucoes" className="data-[state=active]:bg-neutral-800">
              <RotateCcw className="h-4 w-4 mr-2" /> Devoluções ({devolucoes.total})
            </TabsTrigger>
            <TabsTrigger value="nao-identificado" className="data-[state=active]:bg-neutral-800">
              <HelpCircle className="h-4 w-4 mr-2" /> Não identificado ({naoIdentificado.total})
            </TabsTrigger>
          </TabsList>

          {/* Filtros globais (afetam todas as abas) */}
          <Filters />

          <TabsContent value="principal" className="mt-0">
            <NotesTable 
              title="Principal" 
              rows={principal.notes} 
              tabKey="principal" 
              loading={principal.loading}
              error={principal.error}
              onRefresh={principal.refresh}
            />
          </TabsContent>
          
          <TabsContent value="qualidade" className="mt-0">
            <NotesTable 
              title="Qualidade" 
              rows={qualidade.notes} 
              tabKey="qualidade" 
              loading={qualidade.loading}
              error={qualidade.error}
              onRefresh={qualidade.refresh}
            />
          </TabsContent>
          
          <TabsContent value="devolucoes" className="mt-0">
            <NotesTable 
              title="Devoluções" 
              rows={devolucoes.notes} 
              tabKey="devolucoes" 
              loading={devolucoes.loading}
              error={devolucoes.error}
              onRefresh={devolucoes.refresh}
            />
          </TabsContent>
          
          <TabsContent value="nao-identificado" className="mt-0">
            <NotesTable 
              title="Não identificado" 
              rows={naoIdentificado.notes} 
              tabKey="nao-identificado" 
              loading={naoIdentificado.loading}
              error={naoIdentificado.error}
              onRefresh={naoIdentificado.refresh}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}