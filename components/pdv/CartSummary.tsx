'use client'

import React from 'react'
import { CartItem } from '@/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatCurrency } from '@/lib/i18n/formatters'
import { ShoppingBag, Trash2, ArrowRight } from 'lucide-react'

interface CartSummaryProps {
  items: CartItem[]
  total: number
  onRemoveItem: (id: string) => void
  onClearCart: () => void
  onOpenPayment: () => void
}

export default function CartSummary({
  items,
  total,
  onRemoveItem,
  onClearCart,
  onOpenPayment,
}: CartSummaryProps) {
  const hasItems = items.length > 0

  return (
    <Card className="p-5 flex flex-col h-full bg-white shadow-xl rounded-3xl border-2 border-purple-100 sticky top-20">
      <div className="flex items-center justify-between pb-4 border-b border-purple-100">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-foreground leading-tight">Comanda Balcão</h3>
            <span className="text-[11px] text-muted-foreground">{items.length} {items.length === 1 ? 'item' : 'itens'} adicionados</span>
          </div>
        </div>
        {hasItems && (
          <button
            type="button"
            onClick={onClearCart}
            className="text-xs text-muted-foreground hover:text-red-600 font-semibold transition-colors"
          >
            Limpar
          </button>
        )}
      </div>

      <ScrollArea className="flex-1 py-3 -mx-2 px-2 min-h-[180px] max-h-[380px]">
        {!hasItems ? (
          <div className="text-center py-12 px-4 flex flex-col items-center justify-center">
            <div className="h-14 w-14 rounded-2xl bg-purple-50 text-purple-300 flex items-center justify-center text-2xl mb-2">
              🍧
            </div>
            <p className="font-bold text-xs text-foreground">Comanda Vazia</p>
            <p className="text-[11px] text-muted-foreground mt-1">Monte um açaí no painel ao lado para fechar o pedido.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="p-3 rounded-2xl border border-purple-100 bg-purple-50/40 hover:bg-purple-50 transition flex justify-between items-start gap-2 shadow-2xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 font-extrabold text-xs text-foreground">
                    <span className="text-purple-600">{idx + 1}.</span>
                    <span>{item.container.emoji}</span>
                    <span className="truncate">{item.container.name}</span>
                  </div>

                  <div className="text-[11px] text-muted-foreground mt-1 pl-4 space-y-0.5">
                    <div><b>Bases:</b> {item.bases.map((b) => b.name).join(', ')}</div>
                    {item.toppings.length > 0 && (
                      <div>
                        <b>Toppings:</b>{' '}
                        {item.toppings
                          .map((t) => `${t.name}${t.isPaid ? ` (+${formatCurrency(t.precoCobrado)})` : ''}`)
                          .join(', ')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col justify-between items-end gap-2 flex-shrink-0">
                  <span className="font-black text-xs text-purple-900 bg-purple-100 px-2 py-0.5 rounded-md">
                    {formatCurrency(item.lineTotal)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.id)}
                    className="h-6 w-6 rounded-md hover:bg-red-100 text-muted-foreground hover:text-red-600 flex items-center justify-center transition"
                    title="Remover item"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="pt-4 border-t border-purple-100 space-y-3 mt-auto">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-900 to-fuchsia-950 text-white flex justify-between items-center shadow-md">
          <div>
            <div className="text-[11px] text-purple-200 font-medium">Total a Pagar</div>
            <div className="text-xl font-black">{formatCurrency(total)}</div>
          </div>
          <div className="text-right text-[11px] text-purple-200">
            {items.length} {items.length === 1 ? 'açaí' : 'açaís'}
          </div>
        </div>

        <Button
          onClick={onOpenPayment}
          disabled={!hasItems}
          size="lg"
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-extrabold text-sm shadow-lg shadow-fuchsia-600/30 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
        >
          <span>Avançar para Pagamento</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}
