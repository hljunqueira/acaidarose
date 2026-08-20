'use client'

import React, { useState } from 'react'
import { CatalogData } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/i18n/formatters'

interface QuickProductSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  catalog: CatalogData
  onSelectProduct: (item: any, type: 'containers' | 'bases' | 'toppings') => void
}

export default function QuickProductSearchDialog({
  open,
  onOpenChange,
  catalog,
  onSelectProduct,
}: QuickProductSearchDialogProps) {
  const [search, setSearch] = useState('')

  const allItems = [
    ...(catalog.containers || []).map((c) => ({ ...c, type: 'containers' as const, code: `REC-${c.weightGrams}` })),
    ...(catalog.bases || []).map((b, idx) => ({ ...b, type: 'bases' as const, code: `BAS-${101 + idx}` })),
    ...(catalog.toppings || []).map((t, idx) => ({ ...t, type: 'toppings' as const, code: `TOP-${201 + idx}` })),
  ]

  const filtered = allItems.filter((it) =>
    it.name.toLowerCase().includes(search.toLowerCase()) ||
    it.code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[80vh] flex flex-col p-6">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base font-black text-foreground">
            Lista de Produtos
          </DialogTitle>
          <p className="text-[11px] text-muted-foreground">
            ⓘ Opcionais e acompanhamentos específicos são configurados diretamente no montador
          </p>
        </DialogHeader>

        {/* Barra de Pesquisa */}
        <div className="my-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquise por um item ou código..."
            autoFocus
            className="h-11 rounded-2xl text-xs"
          />
        </div>

        {/* Tabela Zebrada */}
        <div className="flex-1 overflow-y-auto border border-purple-100 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-purple-50/70 sticky top-0 border-b border-purple-100 text-purple-950 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3.5">Cód.</th>
                <th className="py-2.5 px-3.5">Item</th>
                <th className="py-2.5 px-3.5 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-muted-foreground">
                    Nenhum produto encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => (
                  <tr
                    key={item.id}
                    onClick={() => {
                      onSelectProduct(item, item.type)
                      onOpenChange(false)
                    }}
                    className={`hover:bg-purple-100/60 cursor-pointer transition-colors ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-purple-50/25'
                    }`}
                  >
                    <td className="py-3 px-3.5 font-mono font-bold text-purple-900 text-[11px]">
                      {item.code}
                    </td>
                    <td className="py-3 px-3.5 font-bold text-foreground">
                      {item.name}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-black text-purple-950">
                      {formatCurrency((item as any).precoBase ?? (item as any).precoCobrado ?? (item as any).price ?? 0)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
