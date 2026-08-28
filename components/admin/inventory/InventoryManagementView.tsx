'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Boxes, AlertTriangle, CheckCircle2, Search, Plus, ArrowUpRight, ClipboardCheck } from 'lucide-react'
import { toast } from 'sonner'

interface InventoryItem {
  id: string
  name: string
  category: 'BASE' | 'TOPPING' | 'FRUTA' | 'EMBALAGEM'
  unit: string
  currentQty: number
  minAlertQty: number
  status: 'NORMAL' | 'ALERT' | 'CRITICAL'
}

export default function InventoryManagementView({ tenantId }: { tenantId?: string }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [checklistOpen, setChecklistOpen] = useState(false)

  const [items, setItems] = useState<InventoryItem[]>([
    { id: '1', name: 'Açaí Tradicional (Balde 10kg)', category: 'BASE', unit: 'Baldes', currentQty: 12, minAlertQty: 4, status: 'NORMAL' },
    { id: '2', name: 'Nutella Original (Balde 3kg)', category: 'TOPPING', unit: 'Baldes', currentQty: 5, minAlertQty: 2, status: 'NORMAL' },
    { id: '3', name: 'Morangos Frescos Selecionados', category: 'FRUTA', unit: 'Kg', currentQty: 1.5, minAlertQty: 3, status: 'ALERT' },
    { id: '4', name: 'Copos Biodegradáveis 500ml', category: 'EMBALAGEM', unit: 'Centenas', currentQty: 8, minAlertQty: 2, status: 'NORMAL' },
    { id: '5', name: 'Leite Condensado Nestlé (Lata 5kg)', category: 'TOPPING', unit: 'Latas', currentQty: 4, minAlertQty: 1, status: 'NORMAL' },
    { id: '6', name: 'Granola Artesanal Crocante', category: 'TOPPING', unit: 'Kg', currentQty: 9, minAlertQty: 2, status: 'NORMAL' },
  ])

  const filteredItems = items.filter((i) =>
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) || i.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleChecklistSubmit = () => {
    setChecklistOpen(false)
    toast.success('Checklist de fechamento registrado com sucesso!')
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-100 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-600/10 dark:bg-purple-500/20 text-purple-600 dark:text-pink-400">
              <Boxes className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-purple-950 dark:text-white">
                Gestão de Estoque Local
              </h1>
              <p className="text-xs sm:text-sm text-purple-700 dark:text-purple-300/70">
                Acompanhamento assistido por alertas inteligentes e checklist rápido de turno
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setChecklistOpen(true)}
            size="sm"
            className="bg-gradient-to-r from-purple-700 to-pink-600 hover:from-purple-800 hover:to-pink-700 text-white rounded-xl text-xs font-bold gap-2 cursor-pointer shadow-md"
          >
            <ClipboardCheck className="h-3.5 w-3.5" />
            <span>Checklist Rápido de Turno</span>
          </Button>
        </div>
      </div>

      {/* Alerta de Ruptura Inteligente */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-amber-950 dark:text-amber-200">Atenção ao Balcão:</span>
            <span className="text-amber-800 dark:text-amber-300/80 ml-1">
              Morango Fresco está próximo do limite mínimo estimado. Conferir bancada física.
            </span>
          </div>
        </div>
        <Badge variant="outline" className="border-amber-500/40 text-amber-600 dark:text-amber-300 text-[10px] font-bold shrink-0">
          1 Alerta Ativo
        </Badge>
      </div>

      {/* Barra de Busca */}
      <div className="relative">
        <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400" />
        <Input
          placeholder="Pesquisar insumo (ex: Nutella, Copos, Açaí, Morango)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-10 rounded-2xl border-purple-100 dark:border-white/10 bg-white/70 dark:bg-white/5 text-xs text-purple-950 dark:text-white"
        />
      </div>

      {/* Tabela de Insumos */}
      <Card className="border border-purple-100 dark:border-white/10 bg-white/70 dark:bg-[#160228]/80 backdrop-blur-md rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-purple-50/60 dark:bg-white/5 border-b border-purple-100 dark:border-white/10 text-[11px] font-black uppercase text-purple-900/70 dark:text-purple-300/70">
                <tr>
                  <th className="py-3 px-4">Insumo / Artigo</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Saldo Atual</th>
                  <th className="py-3 px-4">Limite Mínimo</th>
                  <th className="py-3 px-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100/60 dark:divide-white/5">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-purple-50/40 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-purple-950 dark:text-white">{item.name}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant="outline" className="border-purple-200 dark:border-white/10 text-[10px] font-semibold">
                        {item.category}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-black text-purple-950 dark:text-white">
                      {item.currentQty} {item.unit}
                    </td>
                    <td className="py-3.5 px-4 text-purple-700 dark:text-purple-300/70">
                      {item.minAlertQty} {item.unit}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.status === 'NORMAL' ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Normal
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold text-[11px]">
                          <AlertTriangle className="h-3.5 w-3.5" /> Conferir
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
