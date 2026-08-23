'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Order } from '@/types'
import { formatCurrency, formatOrderNumber } from '@/lib/i18n/formatters'

interface CancelOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order | null
  onConfirmCancel: (orderId: string, reason: string) => Promise<void>
}

export default function CancelOrderDialog({
  open,
  onOpenChange,
  order,
  onConfirmCancel,
}: CancelOrderDialogProps) {
  const [reason, setReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

  if (!order) return null

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    setCancelling(true)
    try {
      await onConfirmCancel(order.id, reason)
      setReason('')
      onOpenChange(false)
    } finally {
      setCancelling(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-red-600">
            Anular Comanda {formatOrderNumber(order.orderNumber)}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Valor a estornar/anular: <b>{formatCurrency(order.total)}</b>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleConfirm} className="space-y-3">
          <div>
            <Label className="text-xs">Motivo da Anulação (Obrigatório para Auditoria)</Label>
            <Input
              required
              minLength={3}
              placeholder="Ex: Erro no pedido do cliente / Desistência"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-8 text-xs mt-1"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
              Voltar
            </Button>
            <Button type="submit" variant="destructive" size="sm" disabled={cancelling} className="text-xs">
              {cancelling ? 'A anular...' : 'Confirmar Anulação'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
