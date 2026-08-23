'use client'

import React from 'react'
import { Order } from '@/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatOrderNumber, formatDateTime } from '@/lib/i18n/formatters'
import { Printer, Ban } from 'lucide-react'

interface OrdersTableProps {
  orders: Order[]
  isAdmin: boolean
  onCancelClick: (order: Order) => void
}

export default function OrdersTable({ orders, isAdmin, onCancelClick }: OrdersTableProps) {
  const handlePrint = (id: string) => {
    window.open(`/receipt/${id}`, '_blank', 'width=400,height=600')
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-xs text-muted-foreground bg-white rounded-lg border">
        Nenhuma comanda registada nesta data.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {orders.map((order) => {
        const isCancelled = order.status === 'CANCELLED'
        return (
          <Card
            key={order.id}
            className={`p-3 bg-white border transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 ${
              isCancelled ? 'border-red-200 bg-red-50/40 opacity-75' : 'hover:border-purple-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-xs bg-muted px-2 py-1 rounded">
                {formatOrderNumber(order.orderNumber)}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-foreground">
                    {order.customerName ? `Cliente: ${order.customerName}` : 'Cliente Balcão'}
                  </span>
                  <Badge variant={isCancelled ? 'destructive' : 'secondary'} className="text-[10px] py-0">
                    {order.paymentMethod}
                  </Badge>
                  {isCancelled && <span className="text-[10px] font-bold text-red-600">ANULADA</span>}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {formatDateTime(order.createdAt)} · {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0">
              <span className={`font-extrabold text-sm ${isCancelled ? 'line-through text-muted-foreground' : 'text-purple-700'}`}>
                {formatCurrency(order.total)}
              </span>

              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => handlePrint(order.id)} title="Imprimir talão" className="h-7 w-7">
                  <Printer className="h-3.5 w-3.5" />
                </Button>
                {isAdmin && !isCancelled && (
                  <Button variant="ghost" size="icon" onClick={() => onCancelClick(order)} title="Anular comanda" className="h-7 w-7 text-red-500 hover:text-red-700">
                    <Ban className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
