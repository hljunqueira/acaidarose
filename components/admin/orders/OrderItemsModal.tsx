'use client'

import React from 'react'
import { Order } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/i18n/formatters'
import {
  User,
  Clock,
  Printer,
  Trash2,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Banknote,
  Smartphone,
  Layers,
} from 'lucide-react'

interface OrderItemsModalProps {
  order: Order | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirmPayment?: (order: Order) => void
  onDeleteOrder?: (order: Order) => void
  onPrintOrder?: (order: Order) => void
  onCallTV?: (order: Order) => void
}

export default function OrderItemsModal({
  order,
  open,
  onOpenChange,
  onConfirmPayment,
  onDeleteOrder,
  onPrintOrder,
  onCallTV,
}: OrderItemsModalProps) {
  if (!order) return null

  const isTable = order.isTableOrder !== false && !!order.tableNumber
  const isPaid = order.paymentStatus === 'PAID'
  const isWaitingPayment = !isPaid || order.status === 'WAITING_PAYMENT'

  const orderTotal =
    typeof order.total === 'number' && !isNaN(order.total)
      ? order.total
      : typeof (order as any).totalAmount === 'number'
      ? (order as any).totalAmount
      : typeof (order as any).finalAmount === 'number'
      ? (order as any).finalAmount
      : Array.isArray(order.items) && order.items.length > 0
      ? order.items.reduce((acc: number, it: any) => acc + (it.lineTotal || it.unitPrice || 0), 0)
      : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6 bg-white dark:bg-[#160228] text-slate-900 dark:text-white border border-purple-150 dark:border-white/20 rounded-3xl shadow-2xl">
        {/* Header com Ticket, Mesa e Nome */}
        <DialogHeader className="pb-3 border-b border-purple-100 dark:border-white/10 text-left">
          <DialogTitle className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-purple-950 dark:text-pink-300 font-mono">
                Ticket #{order.orderNumber || 100}
              </span>
              {isTable ? (
                <Badge className="bg-purple-700 dark:bg-pink-600 text-white font-black text-xs py-0.5 px-2 rounded-lg">
                  {order.tableNumber}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs font-bold border-purple-300 dark:border-white/20 text-purple-800 dark:text-purple-200">
                  Balcão
                </Badge>
              )}
            </div>

            <div>
              {isPaid ? (
                <Badge className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 font-black text-[10px] py-0.5 px-2">
                  ✓ {order.paymentMethod === 'MBWAY' ? 'PAGO VIA MB WAY' : 'PAGO'}
                </Badge>
              ) : (
                <Badge className="bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 font-black text-[10px] py-0.5 px-2">
                  ⏳ A PAGAR
                </Badge>
              )}
            </div>
          </DialogTitle>

          <div className="flex items-center gap-1.5 text-xs text-purple-700/80 dark:text-purple-200/70 pt-1 font-semibold">
            <User className="h-3.5 w-3.5 text-purple-700 dark:text-pink-400" />
            <span>Cliente: <strong className="text-purple-950 dark:text-white font-bold">{order.customerName || (isTable ? 'Cliente na Mesa' : 'Balcão')}</strong></span>
            {order.customerPhone && (
              <span className="font-mono text-[11px]">· Tel: {order.customerPhone}</span>
            )}
          </div>
        </DialogHeader>

        {/* Lista Detalhada de Itens da Comanda */}
        <div className="space-y-3 py-2 max-h-[360px] overflow-y-auto pr-1">
          <div className="text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-pink-300 flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" />
            <span>Composição dos Itens ({order.items?.length || 0})</span>
          </div>

          {order.items && order.items.length > 0 ? (
            order.items.map((item: any, idx: number) => {
              const bases = item.bases || []
              const toppings = item.toppings || []

              return (
                <div
                  key={item.id || idx}
                  className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-white/5 border border-purple-150 dark:border-white/10 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between font-black text-purple-950 dark:text-white">
                    <span className="text-sm">
                      {item.quantity || 1}x {item.containerName || item.container?.name || 'Açaí'}
                    </span>
                    <span className="font-mono text-purple-700 dark:text-pink-300 font-bold">
                      {formatCurrency(item.lineTotal || item.unitPrice || 0)}
                    </span>
                  </div>

                  {/* Bases & Cremes */}
                  {bases.length > 0 && (
                    <div className="text-[11px] text-purple-900 dark:text-purple-100 break-words">
                      <span className="font-bold text-purple-700/80 dark:text-purple-200/70">Bases/Cremes:</span>{' '}
                      {bases.map((b: any) => b.name).join(', ')}
                    </div>
                  )}

                  {/* Toppings / Frutas / Caldas */}
                  {toppings.length > 0 && (
                    <div className="text-[11px] text-purple-900 dark:text-purple-100 break-words">
                      <span className="font-bold text-purple-700/80 dark:text-purple-200/70">Acompanhamentos:</span>{' '}
                      {toppings.map((t: any) => t.name).join(', ')}
                    </div>
                  )}

                  {/* Observações da Montagem */}
                  {item.notes && (
                    <div className="p-2 rounded-xl bg-amber-50/70 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20 text-[10.5px] text-amber-900 dark:text-amber-200 italic flex items-center gap-1.5">
                      <AlertCircle className="h-3 w-3 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>Obs: {item.notes}</span>
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <div className="p-4 rounded-2xl bg-purple-50/40 text-center text-xs text-purple-700 dark:text-purple-300">
              Nenhum item discriminado nesta comanda.
            </div>
          )}

          {/* Observação Geral do Pedido */}
          {order.notes && (
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-xs text-amber-950 dark:text-amber-200">
              <b>Instruções do Pedido:</b> {order.notes}
            </div>
          )}
        </div>

        {/* Resumo Financeiro */}
        <div className="p-3.5 rounded-2xl bg-purple-50/80 dark:bg-white/5 border border-purple-150 dark:border-white/10 flex items-center justify-between text-xs">
          <span className="font-bold text-purple-950 dark:text-white text-sm">Valor Total do Pedido:</span>
          <span className="text-xl font-black text-purple-950 dark:text-pink-300 font-mono">
            {formatCurrency(orderTotal)}
          </span>
        </div>

        {/* Rodapé com Ações (Layout Flex-Wrap Organizado) */}
        <DialogFooter className="pt-3 border-t border-purple-100 dark:border-white/10 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {onDeleteOrder && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onDeleteOrder(order)}
                className="h-8 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 border-red-200 dark:border-red-500/30 rounded-xl cursor-pointer gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Eliminar</span>
              </Button>
            )}

            {onPrintOrder && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onPrintOrder(order)}
                className="h-8 text-xs font-bold text-purple-950 dark:text-white hover:bg-purple-50 dark:hover:bg-white/10 border-purple-200 dark:border-white/15 rounded-xl cursor-pointer gap-1"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Imprimir</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {onCallTV && (order.status === 'PREPARING' || order.status === 'READY') && (
              <Button
                type="button"
                size="sm"
                onClick={() => onCallTV(order)}
                className="h-8 px-3 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                <span>{order.status === 'READY' ? 'Re-chamar TV' : 'Chamar Smart TV'}</span>
              </Button>
            )}

            {isWaitingPayment && onConfirmPayment && (
              <Button
                type="button"
                size="sm"
                onClick={() => onConfirmPayment(order)}
                className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer gap-1"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Receber</span>
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 px-3 text-xs font-bold rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 text-purple-950 dark:text-white hover:bg-purple-50 cursor-pointer"
            >
              Fechar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
