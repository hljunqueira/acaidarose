'use client'

import React from 'react'
import { Order, OrderStatus } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/i18n/formatters'
import {
  Clock,
  User,
  Phone,
  Printer,
  Edit,
  Trash2,
  CheckCircle2,
  ChefHat,
  CreditCard,
  Calendar,
  AlertCircle,
} from 'lucide-react'

interface OrderHistoryAuditModalProps {
  order: Order | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdateStatus: (orderId: string, status: OrderStatus, paymentStatus?: 'PAID' | 'PENDING') => void
  onEditOrder: (order: Order) => void
  onRequestCancel: (order: Order) => void
}

export default function OrderHistoryAuditModal({
  order,
  open,
  onOpenChange,
  onUpdateStatus,
  onEditOrder,
  onRequestCancel,
}: OrderHistoryAuditModalProps) {
  if (!order) return null

  const isTable = order.isTableOrder !== false && !!order.tableNumber
  const isNew = order.status === 'NEW' || !order.status || order.status === 'WAITING_PAYMENT' || order.status === 'OPEN'
  const isPrep = order.status === 'PREPARING'
  const isReady = order.status === 'READY'
  const isPaid = order.status === 'PAID' || order.status === 'COMPLETED'
  const isCancelled = order.status === 'CANCELLED'

  const getStatusBadge = () => {
    if (isNew) return <Badge className="bg-amber-500 text-white font-bold text-[11px] px-2.5 py-0.5 rounded-lg border-0">Novo Pedido</Badge>
    if (isPrep) return <Badge className="bg-purple-600 text-white font-bold text-[11px] px-2.5 py-0.5 rounded-lg border-0">Em Preparação</Badge>
    if (isReady) return <Badge className="bg-emerald-600 text-white font-bold text-[11px] px-2.5 py-0.5 rounded-lg border-0">Pronto para Retirar</Badge>
    if (isPaid) return <Badge className="bg-zinc-800 text-white font-bold text-[11px] px-2.5 py-0.5 rounded-lg border-0">Finalizado & Entregue</Badge>
    if (isCancelled) return <Badge className="bg-red-600 text-white font-bold text-[11px] px-2.5 py-0.5 rounded-lg border-0">Cancelado</Badge>
    return <Badge variant="secondary">Pendente</Badge>
  }

  const getPaymentMethodLabel = () => {
    switch (order.paymentMethod) {
      case 'MB_WAY':
      case 'MBWAY':
        return 'MB WAY'
      case 'MULTIBANCO':
      case 'CARD':
        return 'Multibanco (TPA)'
      case 'NUMERARIO':
      case 'CASH':
        return 'Numerário'
      case 'COUNTER_CASH_OR_CARD':
        return 'No Balcão / Caixa'
      default:
        return order.paymentMethod || 'A Definir'
    }
  }

  const handlePrint = () => {
    window.open(`/receipt/${order.id}`, '_blank')
  }

  const elapsedMinutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60))
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 bg-white border border-purple-100/80 rounded-3xl shadow-xl">
        {/* 1. Header Minimalista */}
        <DialogHeader className="pb-3 border-b border-gray-100 space-y-2 text-left">
          <DialogTitle className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-foreground tracking-tight">
                Comanda #{order.orderNumber || 100}
              </span>
              {isTable ? (
                <Badge className="bg-purple-100 text-purple-900 font-bold text-[11px] px-2 py-0.5 rounded-md border border-purple-200">
                  {order.tableNumber}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[11px] font-semibold border-gray-200 text-gray-700 py-0.5">
                  Balcão / Para Levar
                </Badge>
              )}
            </div>

            <div>{getStatusBadge()}</div>
          </DialogTitle>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-purple-600" />
              {new Date(order.createdAt).toLocaleDateString('pt-PT')} às{' '}
              {new Date(order.createdAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-purple-600" />
              Decorrido: <b>{elapsedMinutes} min</b>
            </span>
          </div>
        </DialogHeader>

        {/* 2. Informações de Cliente e Pagamento */}
        <div className="grid grid-cols-2 gap-2.5 py-1">
          <div className="p-3 rounded-2xl bg-gray-50/70 border border-gray-100 space-y-0.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Cliente
            </div>
            <div className="text-xs font-bold text-foreground truncate flex items-center gap-1">
              <User className="h-3 w-3 text-purple-600 flex-shrink-0" />
              <span className="truncate">{order.customerName || 'Cliente na Mesa'}</span>
            </div>
            {order.customerPhone && (
              <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Phone className="h-3 w-3 text-purple-500" />
                <span>{order.customerPhone}</span>
              </div>
            )}
          </div>

          <div className="p-3 rounded-2xl bg-gray-50/70 border border-gray-100 space-y-0.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Pagamento
            </div>
            <div className="text-xs font-bold text-foreground flex items-center gap-1">
              <CreditCard className="h-3 w-3 text-purple-600 flex-shrink-0" />
              <span>{getPaymentMethodLabel()}</span>
            </div>
            <div className="text-[11px] text-muted-foreground">
              {order.paymentStatus === 'PAID' ? (
                <span className="text-emerald-700 font-bold">Liquidado</span>
              ) : (
                <span className="text-amber-700 font-bold">Pendente</span>
              )}
            </div>
          </div>
        </div>

        {/* 3. Observações da Cozinha (se houver) */}
        {order.notes && (
          <div className="p-2.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Observação:</span>{' '}
              <span className="italic">{order.notes}</span>
            </div>
          </div>
        )}

        {/* 4. Itens da Comanda (Minimalista, Limpo e Adaptável) */}
        <div className="space-y-2 pt-1">
          <div className="text-[11px] font-black uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>Itens do Pedido ({order.items && order.items.length > 0 ? order.items.length : 1})</span>
          </div>

          <div className="space-y-2">
            {order.items && order.items.length > 0 ? (
              order.items.map((item, idx) => {
                const freeToppings = (item.toppings || []).filter((t: any) => !t.isPremium && (!t.precoCobrado || t.precoCobrado === 0))
                const premiumToppings = (item.toppings || []).filter((t: any) => t.isPremium || t.precoCobrado > 0)
                const bases = item.bases || []

                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl border border-gray-100 bg-white border-l-4 border-l-purple-600 space-y-2.5 shadow-2xs"
                  >
                    {/* Linha Principal do Item */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-foreground">
                          {item.containerName || item.container?.name || 'Açaí Personalizado'}
                        </span>
                        <Badge variant="secondary" className="text-[10px] font-bold py-0 px-1.5">
                          1x
                        </Badge>
                      </div>

                      <span className="text-xs font-black text-foreground">
                        {formatCurrency(item.lineTotal || order.total || 0)}
                      </span>
                    </div>

                    {/* Bases e Ingredientes agrupados de forma limpa */}
                    <div className="space-y-1.5 text-xs text-muted-foreground pl-1">
                      {bases.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="text-[10px] font-bold uppercase text-purple-900 mr-1">Bases:</span>
                          {bases.map((b: any, bIdx: number) => (
                            <span key={bIdx} className="bg-purple-50 text-purple-950 px-2 py-0.5 rounded-lg text-[11px] font-medium border border-purple-100">
                              {b.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {freeToppings.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="text-[10px] font-bold uppercase text-gray-600 mr-1">Adicionais:</span>
                          {freeToppings.map((t: any, tIdx: number) => (
                            <span key={tIdx} className="bg-gray-50 text-gray-800 px-2 py-0.5 rounded-lg text-[11px] border border-gray-100 font-medium">
                              {t.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {premiumToppings.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 pt-0.5">
                          <span className="text-[10px] font-bold uppercase text-amber-900 mr-1">Especiais:</span>
                          {premiumToppings.map((t: any, tIdx: number) => (
                            <span key={tIdx} className="bg-amber-50 text-amber-950 px-2 py-0.5 rounded-lg text-[11px] border border-amber-200/80 font-bold">
                              {t.name} (+{formatCurrency(t.precoCobrado || t.precoExtra || 1.0)})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="p-3.5 rounded-2xl border border-gray-100 bg-white border-l-4 border-l-purple-600 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-foreground">
                    1x Açaí Personalizado Especial
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Comanda emitida digitalmente
                  </div>
                </div>
                <span className="text-xs font-black text-foreground">
                  {formatCurrency(order.total || order.totalAmount || 0)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 5. Total a Pagar Minimalista */}
        <div className="p-3.5 rounded-2xl bg-gray-50/70 border border-gray-100 flex items-center justify-between mt-2">
          <div>
            <span className="text-xs font-bold text-muted-foreground block">Total a Pagar</span>
            <span className="text-[10px] text-muted-foreground">IVA incluído à taxa legal</span>
          </div>
          <span className="text-lg font-black text-purple-900">
            {formatCurrency(order.total || order.totalAmount || 0)}
          </span>
        </div>

        {/* 6. Barra de Ações */}
        <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="rounded-xl text-xs font-bold gap-1.5 h-8.5 border-gray-200 hover:bg-gray-50 text-foreground"
            >
              <Printer className="h-3.5 w-3.5 text-purple-600" />
              <span>Imprimir Talão</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onEditOrder(order)}
              className="rounded-xl text-xs font-bold gap-1.5 h-8.5 border-gray-200 hover:bg-gray-50 text-foreground"
            >
              <Edit className="h-3.5 w-3.5 text-purple-600" />
              <span>Editar</span>
            </Button>

            {!isCancelled && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRequestCancel(order)}
                className="rounded-xl text-xs font-bold gap-1.5 h-8.5 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Cancelar</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isNew && (
              <Button
                size="sm"
                onClick={() => {
                  onUpdateStatus(order.id, 'PREPARING')
                  onOpenChange(false)
                }}
                className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold h-8.5 rounded-xl gap-1.5 shadow-2xs"
              >
                <ChefHat className="h-3.5 w-3.5" />
                <span>Preparar</span>
              </Button>
            )}

            {isPrep && (
              <Button
                size="sm"
                onClick={() => {
                  onUpdateStatus(order.id, 'READY')
                  onOpenChange(false)
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-8.5 rounded-xl gap-1.5 shadow-2xs"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Pronto</span>
              </Button>
            )}

            {isReady && (
              <Button
                size="sm"
                onClick={() => {
                  onUpdateStatus(order.id, 'PAID', 'PAID')
                  onOpenChange(false)
                }}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold h-8.5 rounded-xl gap-1.5 shadow-2xs"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Concluir</span>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
