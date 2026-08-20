'use client'

import React, { useState } from 'react'
import { PaymentMethodCode } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/i18n/formatters'
import MBWayQRCodeView from './MBWayQRCodeView'
import { Coins, CreditCard, Smartphone, Truck, ArrowLeft, CheckCircle2 } from 'lucide-react'

interface PaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  total: number
  storePhone?: string | null
  submitting: boolean
  onPay: (method: PaymentMethodCode, customer: { name: string; phone: string }) => void
}

const METHODS: Array<{ code: PaymentMethodCode; label: string; icon: any; hint: string }> = [
  { code: 'NUMERARIO', label: 'Numerário (Dinheiro)', icon: Coins, hint: 'Com cálculo de troco' },
  { code: 'MULTIBANCO', label: 'Multibanco (TPA)', icon: CreditCard, hint: 'Cartão de débito/crédito' },
  { code: 'MB_WAY', label: 'MB Way', icon: Smartphone, hint: 'QR Code / Telemóvel' },
  { code: 'PLATAFORMA', label: 'Takeaway / App', icon: Truck, hint: 'Uber Eats / Glovo' },
]

export default function PaymentModal({
  open,
  onOpenChange,
  total,
  storePhone,
  submitting,
  onPay,
}: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodCode | null>(null)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  
  // Cálculo de Troco para Dinheiro
  const [amountReceived, setAmountReceived] = useState<string>('')

  const handleSelectMethod = (code: PaymentMethodCode) => {
    if (code === 'MB_WAY') {
      setSelectedMethod('MB_WAY')
    } else if (code === 'NUMERARIO') {
      setSelectedMethod('NUMERARIO')
      setAmountReceived(total.toFixed(2))
    } else {
      onPay(code, { name: customerName, phone: customerPhone })
    }
  }

  const handleConfirmMBWay = () => {
    onPay('MB_WAY', { name: customerName, phone: customerPhone || storePhone || '' })
  }

  const numReceived = parseFloat(amountReceived.replace(',', '.')) || 0
  const changeDue = Math.max(0, numReceived - total)

  const handleConfirmCash = () => {
    onPay('NUMERARIO', { name: customerName, phone: customerPhone })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-black text-center text-foreground">
            {selectedMethod === 'MB_WAY'
              ? 'Pagamento por MB Way'
              : selectedMethod === 'NUMERARIO'
              ? 'Pagamento em Numerário (Dinheiro)'
              : 'Finalizar e Receber Comanda'}
          </DialogTitle>
          <DialogDescription className="text-center text-xs">
            Valor total a cobrar:{' '}
            <b className="text-purple-700 text-sm font-black">{formatCurrency(total)}</b>
          </DialogDescription>
        </DialogHeader>

        {selectedMethod === 'MB_WAY' ? (
          <div>
            <button
              type="button"
              onClick={() => setSelectedMethod(null)}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Outros métodos
            </button>
            <MBWayQRCodeView
              phone={customerPhone || storePhone || '+351 912 345 678'}
              amount={total}
              orderNumber="BALCÃO"
              onConfirm={handleConfirmMBWay}
              submitting={submitting}
            />
          </div>
        ) : selectedMethod === 'NUMERARIO' ? (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setSelectedMethod(null)}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Outros métodos
            </button>

            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 space-y-3">
              <div>
                <Label className="text-xs font-bold text-purple-950">Valor Recebido do Cliente (€):</Label>
                <Input
                  type="number"
                  step="0.10"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  className="h-10 text-base font-black text-purple-950 bg-white mt-1"
                  placeholder="0.00"
                  autoFocus
                />
              </div>

              {/* Botões de Notas Rápidas */}
              <div className="flex gap-1.5">
                {[
                  { label: 'Exato', val: total },
                  { label: '€10', val: 10 },
                  { label: '€20', val: 20 },
                  { label: '€50', val: 50 },
                ].map((note) => (
                  <button
                    key={note.label}
                    type="button"
                    onClick={() => setAmountReceived(note.val.toFixed(2))}
                    className="flex-1 py-1.5 rounded-xl border border-purple-200 bg-white text-xs font-black text-purple-900 hover:bg-purple-100 cursor-pointer"
                  >
                    {note.label}
                  </button>
                ))}
              </div>

              {/* Cálculo do Troco */}
              <div className="pt-2 border-t border-purple-200/60 flex items-center justify-between">
                <span className="text-xs font-extrabold text-muted-foreground">Troco a Devolver:</span>
                <span className="text-lg font-black text-emerald-700 font-mono">
                  {formatCurrency(changeDue)}
                </span>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleConfirmCash}
              disabled={submitting || numReceived < total}
              className="w-full h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md cursor-pointer"
            >
              {submitting ? 'A processar...' : 'Confirmar Recebimento e Emitir Recibo'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-bold">Nome do Cliente (opcional)</Label>
                <Input
                  placeholder="Ex: Maria"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="h-9 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">Telemóvel (opcional)</Label>
                <Input
                  placeholder="912 345 678"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="h-9 text-xs mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              {METHODS.map((m) => {
                const Icon = m.icon
                return (
                  <button
                    key={m.code}
                    type="button"
                    disabled={submitting}
                    onClick={() => handleSelectMethod(m.code)}
                    className="p-3 rounded-2xl border-2 border-purple-100 hover:border-purple-600 hover:bg-purple-50 transition text-left flex flex-col justify-between gap-2 group cursor-pointer"
                  >
                    <div className="h-8 w-8 rounded-xl bg-purple-100 group-hover:bg-purple-600 group-hover:text-white text-purple-700 flex items-center justify-center transition">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-extrabold text-xs leading-tight text-foreground">{m.label}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{m.hint}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
