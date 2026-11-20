'use client'

import React from 'react'
import { CartItem } from '@/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatCurrency } from '@/lib/i18n/formatters'
import { ShoppingBag, Trash2, ArrowRight, Pencil } from 'lucide-react'

interface CartSummaryProps {
  items: CartItem[]
  total: number
  onRemoveItem: (id: string) => void
  onEditItem?: (id: string) => void
  onUpdateQuantity?: (id: string, delta: number) => void
  onClearCart: () => void
  onOpenPayment: () => void
}

export default function CartSummary({
  items,
  total,
  onRemoveItem,
  onEditItem,
  onUpdateQuantity,
  onClearCart,
  onOpenPayment,
}: CartSummaryProps) {
  const hasItems = items.length > 0

  return (
    <Card className="p-5 flex flex-col h-full bg-white dark:bg-[#160228] shadow-xl rounded-3xl border-2 border-purple-100 dark:border-white/10 sticky top-20 transition-colors">
      <div className="flex items-center justify-between pb-4 border-b border-purple-100 dark:border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-purple-100 dark:bg-white/10 text-purple-700 dark:text-pink-400 flex items-center justify-center">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-purple-950 dark:text-white leading-tight">Comanda Balcão</h3>
            <span className="text-[11px] text-purple-600 dark:text-purple-300/70">{items.length} {items.length === 1 ? 'item' : 'itens'} adicionados</span>
          </div>
        </div>
        {hasItems && (
          <button
            type="button"
            onClick={onClearCart}
            className="text-xs text-purple-500 dark:text-purple-400 hover:text-red-600 dark:hover:text-red-400 font-semibold transition-colors cursor-pointer"
          >
            Limpar
          </button>
        )}
      </div>

      <ScrollArea className="flex-1 py-3 -mx-2 px-2 min-h-[180px] max-h-[380px]">
        {!hasItems ? (
          <div className="text-center py-12 px-4 flex flex-col items-center justify-center">
            <div className="h-14 w-14 rounded-2xl bg-purple-50 dark:bg-white/5 text-purple-400 dark:text-purple-300 flex items-center justify-center mb-2">
              <ShoppingBag className="h-6 w-6 text-purple-400 dark:text-pink-400" />
            </div>
            <p className="font-bold text-xs text-purple-950 dark:text-white">Comanda Vazia</p>
            <p className="text-[11px] text-purple-700/70 dark:text-purple-300/70 mt-1">Selecione itens no painel ao lado para fechar o pedido.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, idx) => {
              const isSimple = (!item.bases || item.bases.length === 0) && (!item.toppings || item.toppings.length === 0)
              const qty = item.quantity || 1

              return (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl border border-purple-100 dark:border-white/10 bg-purple-50/40 dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 transition flex justify-between items-start gap-2 shadow-2xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 font-extrabold text-xs text-purple-950 dark:text-white">
                      <span className="text-purple-600 dark:text-pink-400">{idx + 1}.</span>
                      <span className="truncate">{item.container.name}</span>
                      {qty > 1 && (
                        <span className="text-[10px] bg-purple-200/70 dark:bg-white/20 text-purple-900 dark:text-white font-black px-1.5 py-0.2 rounded-md">
                          {qty}x
                        </span>
                      )}
                      {item.packagingType && ((item.container?.weightGrams && item.container.weightGrams >= 750) || (item.container?.name || '').toLowerCase().includes('sensação') || (item.container?.name || '').toLowerCase().includes('família') || (item.container?.name || '').toLowerCase().includes('1kg')) && (
                        <span className="text-[10px] bg-purple-200/70 dark:bg-white/20 text-purple-900 dark:text-white font-black px-1.5 py-0.5 rounded-md uppercase">
                          {item.packagingType === 'CAIXA' ? 'Caixinha' : 'Taça'}
                        </span>
                      )}
                    </div>

                    {!isSimple && (
                      <div className="text-[11px] text-purple-700/80 dark:text-purple-300/80 mt-1 pl-4 space-y-0.5">
                        {item.bases && item.bases.length > 0 && (
                          <div><b>Bases:</b> {item.bases.map((b) => b.name).join(', ')}</div>
                        )}
                        {item.toppings && item.toppings.length > 0 && (
                          <div>
                            <b>Acompanhamentos:</b>{' '}
                            {item.toppings
                              .map((t) => `${t.name}${t.isPaid ? ` (+${formatCurrency(t.precoCobrado)})` : ''}`)
                              .join(', ')}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Controles de Quantidade para Itens Rápidos */}
                    {isSimple && onUpdateQuantity && (
                      <div className="flex items-center gap-2 mt-2 pl-4">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.id, -1)}
                          className="h-6 w-6 rounded-lg bg-white dark:bg-white/10 border border-purple-200 dark:border-white/15 text-purple-900 dark:text-white hover:bg-purple-100 dark:hover:bg-white/20 flex items-center justify-center font-bold text-xs cursor-pointer"
                          title="Diminuir"
                        >
                          -
                        </button>
                        <span className="text-xs font-black text-purple-950 dark:text-white min-w-[16px] text-center">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.id, 1)}
                          className="h-6 w-6 rounded-lg bg-white dark:bg-white/10 border border-purple-200 dark:border-white/15 text-purple-900 dark:text-white hover:bg-purple-100 dark:hover:bg-white/20 flex items-center justify-center font-bold text-xs cursor-pointer"
                          title="Aumentar"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col justify-between items-end gap-2 flex-shrink-0">
                    <span className="font-black text-xs text-purple-900 dark:text-white bg-purple-100 dark:bg-white/10 px-2 py-0.5 rounded-md">
                      {formatCurrency(item.lineTotal)}
                    </span>
                    <div className="flex items-center gap-1">
                      {onEditItem && (
                        <button
                          type="button"
                          onClick={() => onEditItem(item.id)}
                          className="h-6 w-6 rounded-md hover:bg-purple-100 dark:hover:bg-white/10 text-purple-700 dark:text-pink-400 flex items-center justify-center transition cursor-pointer"
                          title="Editar item do pedido"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.id)}
                        className="h-6 w-6 rounded-md hover:bg-red-100 dark:hover:bg-red-950/40 text-purple-400 dark:text-purple-400 hover:text-red-600 dark:hover:text-red-400 flex items-center justify-center transition cursor-pointer"
                        title="Remover item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>

      <div className="pt-4 border-t border-purple-100 dark:border-white/10 space-y-3 mt-auto">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-900 to-fuchsia-950 text-white flex justify-between items-center shadow-md">
          <div>
            <div className="text-[11px] text-purple-200 font-medium">Total a Pagar</div>
            <div className="text-xl font-black">{formatCurrency(total)}</div>
          </div>
          <div className="text-right text-[11px] text-purple-200">
            {items.length} {items.length === 1 ? 'item' : 'itens'}
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
