'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShoppingCart, TrendingDown, Send } from 'lucide-react'
import { toast } from 'sonner'

export default function StoreSupplyOrdersView({ tenantId }: { tenantId?: string }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({
    nutella: 2,
    acai: 4,
    copos: 2,
  })

  const catalog = [
    { id: 'nutella', name: 'Balde Nutella 3kg', marketPrice: 24.50, hqPrice: 22.50, unit: 'Balde 3kg' },
    { id: 'acai', name: 'Açaí Premium (Cx 10kg)', marketPrice: 38.00, hqPrice: 32.00, unit: 'Caixa 10kg' },
    { id: 'copos', name: 'Copos 500ml (Cx 500un)', marketPrice: 45.00, hqPrice: 39.00, unit: 'Caixa 500un' },
    { id: 'leite', name: 'Leite Condensado 5kg', marketPrice: 18.90, hqPrice: 16.50, unit: 'Lata 5kg' },
    { id: 'granola', name: 'Granola Tradicional', marketPrice: 14.50, hqPrice: 12.00, unit: 'Saco 5kg' },
  ]

  const totalHQ = catalog.reduce((acc, item) => acc + (quantities[item.id] || 0) * item.hqPrice, 0)
  const totalMarket = catalog.reduce((acc, item) => acc + (quantities[item.id] || 0) * item.marketPrice, 0)
  const totalSavings = totalMarket - totalHQ

  const handleSendOrder = () => {
    toast.success('Pedido de reposição enviado à Matriz com sucesso!')
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-100 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-600/10 dark:bg-purple-500/20 text-purple-600 dark:text-pink-400">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-purple-950 dark:text-white">
                Reposição de Insumos com a Matriz
              </h1>
              <p className="text-xs sm:text-sm text-purple-700 dark:text-purple-300/70">
                Tabela de preços exclusivos para franqueados e comparador de economia
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={handleSendOrder}
          disabled={totalHQ === 0}
          size="sm"
          className="bg-gradient-to-r from-purple-700 to-pink-600 hover:from-purple-800 hover:to-pink-700 text-white rounded-xl text-xs font-bold gap-2 cursor-pointer shadow-md shadow-pink-600/20"
        >
          <Send className="h-3.5 w-3.5" />
          <span>Enviar Pedido à Matriz</span>
        </Button>
      </div>

      {/* Banner de Economia Garantida */}
      <Card className="border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500 text-white shadow-md">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-black text-emerald-950 dark:text-emerald-300">
                Vantagem Exclusiva de Comprar pela Franqueadora
              </div>
              <p className="text-xs text-emerald-800 dark:text-emerald-400/80">
                Economia estimada neste pedido vs distribuidor externo: <strong>€ {totalSavings.toFixed(2)}</strong>
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-purple-700 dark:text-purple-300/70 font-semibold">Total do Pedido:</div>
            <div className="text-xl font-black text-purple-950 dark:text-white">€ {totalHQ.toFixed(2)}</div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Insumos */}
      <Card className="border border-purple-100 dark:border-white/10 bg-white/70 dark:bg-[#160228]/80 backdrop-blur-md rounded-2xl overflow-hidden shadow-xs">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-purple-50/60 dark:bg-white/5 border-b border-purple-100 dark:border-white/10 text-[11px] font-black uppercase text-purple-900/70 dark:text-purple-300/70">
                <tr>
                  <th className="py-3 px-4">Insumo Homologado</th>
                  <th className="py-3 px-4">Preço Mercado</th>
                  <th className="py-3 px-4">Preço Matriz</th>
                  <th className="py-3 px-4">Economia / Un</th>
                  <th className="py-3 px-4 text-center">Quantidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100/60 dark:divide-white/5">
                {catalog.map((item) => {
                  const savings = item.marketPrice - item.hqPrice
                  const qty = quantities[item.id] || 0
                  return (
                    <tr key={item.id} className="hover:bg-purple-50/40 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-purple-950 dark:text-white">{item.name}</td>
                      <td className="py-3.5 px-4 text-slate-400 line-through">€ {item.marketPrice.toFixed(2)}</td>
                      <td className="py-3.5 px-4 font-black text-purple-950 dark:text-white">€ {item.hqPrice.toFixed(2)}</td>
                      <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                        -€ {savings.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setQuantities((prev) => ({ ...prev, [item.id]: Math.max(0, qty - 1) }))}
                            className="h-7 w-7 rounded-lg bg-purple-100 dark:bg-white/10 font-bold hover:bg-purple-200 text-purple-950 dark:text-white cursor-pointer"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-bold text-purple-950 dark:text-white">{qty}</span>
                          <button
                            onClick={() => setQuantities((prev) => ({ ...prev, [item.id]: qty + 1 }))}
                            className="h-7 w-7 rounded-lg bg-purple-100 dark:bg-white/10 font-bold hover:bg-purple-200 text-purple-950 dark:text-white cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
