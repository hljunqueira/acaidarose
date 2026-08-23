'use client'

import React from 'react'
import { Order } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatOrderNumber } from '@/lib/i18n/formatters'
import { CheckCircle2, Printer, Plus } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { generateOrderReceiptUrl } from '@/lib/services/qrCodeService'

interface OrderReceiptModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order | null
  onNewOrder: () => void
}

export default function OrderReceiptModal({
  open,
  onOpenChange,
  order,
  onNewOrder,
}: OrderReceiptModalProps) {
  if (!order) return null

  const receiptUrl = generateOrderReceiptUrl(order.id)

  const handlePrint = () => {
    window.open(`/receipt/${order.id}`, '_blank', 'width=400,height=600')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-6 text-center">
        <DialogHeader className="flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <DialogTitle className="text-lg font-bold">Comanda Registada!</DialogTitle>
          <DialogDescription className="text-xs">
            Comanda <b className="text-foreground">{formatOrderNumber(order.orderNumber)}</b> finalizada com sucesso.
          </DialogDescription>
        </DialogHeader>

        <div className="my-3 p-3 bg-muted/30 rounded-xl border flex flex-col items-center">
          <div className="p-2 bg-white rounded-lg shadow-sm mb-2 border">
            <QRCodeSVG value={receiptUrl} size={110} level="M" />
          </div>
          <div className="text-[11px] text-muted-foreground">QR Code da comanda</div>
          <div className="font-bold text-sm text-purple-700 mt-1">{formatCurrency(order.total)}</div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} className="w-full text-xs font-bold gap-1.5">
            <Printer className="h-3.5 w-3.5" />
            <span>Imprimir Talão</span>
          </Button>
          <Button size="sm" onClick={onNewOrder} className="w-full text-xs font-bold bg-purple-600 hover:bg-purple-700 gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            <span>Novo Pedido</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
