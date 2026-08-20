'use client'

import React, { useState, useEffect } from 'react'
import { Order, OrderStatus, PaymentMethodCode } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface OrderEditDialogProps {
  order: Order | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (orderId: string, updatedData: Partial<Order>) => Promise<void>
}

export default function OrderEditDialog({
  order,
  open,
  onOpenChange,
  onSave,
}: OrderEditDialogProps) {
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [tableNumber, setTableNumber] = useState('')
  const [isTableOrder, setIsTableOrder] = useState(true)
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<OrderStatus>('NEW')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodCode>('NUMERARIO')
  const [total, setTotal] = useState<number>(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (order) {
      setCustomerName(order.customerName || '')
      setCustomerPhone(order.customerPhone || '')
      setTableNumber(order.tableNumber || '')
      setIsTableOrder(order.isTableOrder !== false)
      setNotes(order.notes || '')
      setStatus(order.status || 'NEW')
      setPaymentMethod((order.paymentMethod as PaymentMethodCode) || 'NUMERARIO')
      setTotal(order.total || order.totalAmount || 0)
    }
  }, [order])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!order) return
    setLoading(true)
    try {
      await onSave(order.id, {
        customerName: customerName.trim() || null,
        customerPhone: customerPhone.trim() || null,
        tableNumber: isTableOrder ? (tableNumber.trim() || 'Mesa 01') : null,
        isTableOrder,
        notes: notes.trim() || null,
        status,
        paymentMethod,
        total: Number(total) || 0,
      })
      toast.success('Comanda atualizada com sucesso')
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar comanda')
    } finally {
      setLoading(false)
    }
  }

  if (!order) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6 bg-white border border-purple-100 rounded-3xl shadow-2xl">
        <DialogHeader className="text-left pb-2 border-b border-purple-50">
          <DialogTitle className="text-base font-black text-foreground">
            Editar Comanda #{order.orderNumber || 100}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Altere a mesa, dados do cliente ou observações da preparação.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 my-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Tipo de Atendimento</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsTableOrder(true)}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border transition ${
                    isTableOrder
                      ? 'bg-purple-700 text-white border-purple-700'
                      : 'bg-purple-50 text-purple-900 border-purple-200'
                  }`}
                >
                  Mesa
                </button>
                <button
                  type="button"
                  onClick={() => setIsTableOrder(false)}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border transition ${
                    !isTableOrder
                      ? 'bg-purple-700 text-white border-purple-700'
                      : 'bg-purple-50 text-purple-900 border-purple-200'
                  }`}
                >
                  Balcão
                </button>
              </div>
            </div>

            {isTableOrder && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Número da Mesa</Label>
                <Input
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="Ex: Mesa 02"
                  className="rounded-xl h-9 text-xs border-purple-200"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Nome do Cliente</Label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ex: Tiago Santos"
                className="rounded-xl h-9 text-xs border-purple-200"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Contacto / Telefone</Label>
              <Input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Ex: 912 345 678"
                className="rounded-xl h-9 text-xs border-purple-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Estado do Pedido</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                className="w-full h-9 rounded-xl border border-purple-200 bg-white px-3 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                <option value="NEW">🟡 Novo Pedido</option>
                <option value="PREPARING">🟣 Em Preparação</option>
                <option value="READY">🟢 Pronto p/ Entrega</option>
                <option value="PAID">⚪ Finalizado & Pago</option>
                <option value="CANCELLED">🔴 Cancelado</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Método de Pagamento</Label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodCode)}
                className="w-full h-9 rounded-xl border border-purple-200 bg-white px-3 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                <option value="NUMERARIO">Numerário (Dinheiro)</option>
                <option value="MULTIBANCO">Multibanco (TPA)</option>
                <option value="MB_WAY">MB Way</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Observações / Detalhes de Preparação</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Sem leite condensado, caprichar no morango..."
              rows={3}
              className="w-full p-2.5 rounded-xl border border-purple-200 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Total da Comanda (€)</Label>
            <Input
              type="number"
              step="0.01"
              value={total}
              onChange={(e) => setTotal(parseFloat(e.target.value) || 0)}
              className="rounded-xl h-9 text-xs border-purple-200 font-black text-purple-900"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-purple-50">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="rounded-xl border-purple-200 text-xs font-bold"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs shadow-sm"
            >
              {loading ? 'A guardar...' : 'Guardar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
