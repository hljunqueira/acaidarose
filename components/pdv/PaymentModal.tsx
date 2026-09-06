'use client'

import React, { useState, useEffect } from 'react'
import { PaymentMethodCode } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/i18n/formatters'
import MBWayQRCodeView from './MBWayQRCodeView'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

export interface PaymentExtraOptions {
  consumptionType: 'DINE_IN' | 'TAKEAWAY'
  isTakeaway: boolean
  needBag: boolean
  bagQuantity: number
  bagFee: number
  totalWithBags: number
}

interface PaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  total: number
  storePhone?: string | null
  submitting: boolean
  initialCustomerName?: string
  initialTableName?: string
  initialConsumptionType?: 'DINE_IN' | 'TAKEAWAY'
  initialBagQuantity?: number
  onPay: (
    method: PaymentMethodCode,
    customer: { name: string; phone: string },
    options?: PaymentExtraOptions
  ) => void
}

const METHODS: Array<{ code: PaymentMethodCode; label: string; hint: string }> = [
  { code: 'NUMERARIO', label: 'Numerário (Dinheiro)', hint: 'Com cálculo de troco' },
  { code: 'MULTIBANCO', label: 'Multibanco (TPA)', hint: 'Cartão de débito/crédito' },
  { code: 'MB_WAY', label: 'MB Way', hint: 'QR Code / Telemóvel' },
  { code: 'PLATAFORMA', label: 'Takeaway / App', hint: 'Uber Eats / Glovo' },
]

export default function PaymentModal({
  open,
  onOpenChange,
  total,
  storePhone,
  submitting,
  initialCustomerName = '',
  initialTableName,
  initialConsumptionType = 'DINE_IN',
  initialBagQuantity = 0,
  onPay,
}: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodCode | null>(null)
  const [customerName, setCustomerName] = useState(initialCustomerName)
  const [customerPhone, setCustomerPhone] = useState('')
  const [consumptionType, setConsumptionType] = useState<'DINE_IN' | 'TAKEAWAY'>(initialConsumptionType)
  const [bagQuantity, setBagQuantity] = useState<number>(initialBagQuantity)

  // Sincronizar estado inicial ao abrir o modal
  useEffect(() => {
    if (open) {
      setCustomerName(initialCustomerName || '')
      setSelectedMethod(null)
      setConsumptionType(initialConsumptionType || 'DINE_IN')
      setBagQuantity(initialBagQuantity || 0)
    }
  }, [open, initialCustomerName, initialConsumptionType, initialBagQuantity])

  // Cálculo de taxas de saco de transporte (0.10€ cada)
  const bagFee = +(bagQuantity * 0.10).toFixed(2)
  const effectiveTotal = +(total + bagFee).toFixed(2)

  // Cálculo de Troco para Dinheiro
  const [amountReceived, setAmountReceived] = useState<string>('')

  const getExtraOptions = (): PaymentExtraOptions => ({
    consumptionType,
    isTakeaway: consumptionType === 'TAKEAWAY',
    needBag: bagQuantity > 0,
    bagQuantity,
    bagFee,
    totalWithBags: effectiveTotal,
  })

  const handleSelectMethod = (code: PaymentMethodCode) => {
    if (!customerName.trim()) {
      toast.error('Por favor, introduza o nome do cliente para a chamada de senha.')
      return
    }
    if (code === 'MB_WAY') {
      setSelectedMethod('MB_WAY')
    } else if (code === 'NUMERARIO') {
      setSelectedMethod('NUMERARIO')
      setAmountReceived(effectiveTotal.toFixed(2))
    } else {
      onPay(code, { name: customerName.trim(), phone: customerPhone }, getExtraOptions())
    }
  }

  const handleConfirmMBWay = () => {
    if (!customerName.trim()) {
      toast.error('Por favor, introduza o nome do cliente para a chamada de senha.')
      return
    }
    onPay('MB_WAY', { name: customerName.trim(), phone: customerPhone || storePhone || '' }, getExtraOptions())
  }

  const numReceived = parseFloat(amountReceived.replace(',', '.')) || 0
  const changeDue = Math.max(0, +(numReceived - effectiveTotal).toFixed(2))

  const handleConfirmCash = () => {
    if (!customerName.trim()) {
      toast.error('Por favor, introduza o nome do cliente para a chamada de senha.')
      return
    }
    onPay('NUMERARIO', { name: customerName.trim(), phone: customerPhone }, getExtraOptions())
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6 bg-white dark:bg-[#160228] text-slate-900 dark:text-white border border-purple-150 dark:border-white/20 rounded-3xl">
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
            <b className="text-purple-700 dark:text-pink-400 text-sm font-black">{formatCurrency(effectiveTotal)}</b>
            {bagFee > 0 && (
              <span className="block text-[11px] text-muted-foreground mt-0.5">
                (Inclui {bagQuantity}x Saco de Transporte: +{formatCurrency(bagFee)})
              </span>
            )}
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
              amount={effectiveTotal}
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

            <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-white/5 border border-purple-100 dark:border-white/10 space-y-3">
              <div>
                <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">Valor Recebido do Cliente (€):</Label>
                <Input
                  type="number"
                  step="0.10"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  className="h-10 text-base font-black text-purple-950 dark:text-white bg-white dark:bg-[#1f0337] mt-1"
                  placeholder="0.00"
                  autoFocus
                />
              </div>

              {/* Botões de Notas Rápidas */}
              <div className="flex gap-1.5">
                {[
                  { label: 'Exato', val: effectiveTotal },
                  { label: '€10', val: 10 },
                  { label: '€20', val: 20 },
                  { label: '€50', val: 50 },
                ].map((note) => (
                  <button
                    key={note.label}
                    type="button"
                    onClick={() => setAmountReceived(note.val.toFixed(2))}
                    className="flex-1 py-1.5 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-white/10 text-xs font-black text-purple-900 dark:text-white hover:bg-purple-100 dark:hover:bg-white/20 cursor-pointer"
                  >
                    {note.label}
                  </button>
                ))}
              </div>

              {/* Cálculo do Troco */}
              <div className="pt-2 border-t border-purple-200/60 dark:border-white/10 flex items-center justify-between">
                <span className="text-xs font-extrabold text-muted-foreground">Troco a Devolver:</span>
                <span className="text-lg font-black text-emerald-700 dark:text-emerald-400 font-mono">
                  {formatCurrency(changeDue)}
                </span>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleConfirmCash}
              disabled={submitting || numReceived < effectiveTotal}
              className="w-full h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md cursor-pointer"
            >
              {submitting ? 'A processar...' : 'Confirmar Recebimento e Emitir Recibo'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Identificação do Cliente */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-black text-purple-950 dark:text-purple-200">
                  Nome do Cliente <span className="text-pink-600">* (Obrigatório)</span>
                </Label>
                <Input
                  placeholder="Ex: Maria"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className={`h-9 text-xs mt-1 font-semibold ${
                    !customerName.trim()
                      ? 'border-pink-300 dark:border-pink-500/50 focus-visible:ring-pink-500'
                      : 'border-purple-200 dark:border-white/20'
                  }`}
                  autoFocus
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Telemóvel (opcional)</Label>
                <Input
                  placeholder="912 345 678"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="h-9 text-xs mt-1 border-purple-200 dark:border-white/20"
                />
              </div>
            </div>

            {/* Tipo de Consumo (Local vs Takeaway) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tipo de Consumo
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setConsumptionType('DINE_IN')
                    setBagQuantity(0)
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer border text-center ${
                    consumptionType === 'DINE_IN'
                      ? 'bg-purple-900 text-white dark:bg-pink-600 border-purple-900 dark:border-pink-600 shadow-xs'
                      : 'bg-white dark:bg-white/5 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-white/15 hover:bg-slate-50'
                  }`}
                >
                  Consumo no Local
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConsumptionType('TAKEAWAY')
                    if (bagQuantity === 0) setBagQuantity(1)
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer border text-center ${
                    consumptionType === 'TAKEAWAY'
                      ? 'bg-purple-900 text-white dark:bg-pink-600 border-purple-900 dark:border-pink-600 shadow-xs'
                      : 'bg-white dark:bg-white/5 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-white/15 hover:bg-slate-50'
                  }`}
                >
                  Levar para Casa
                </button>
              </div>
            </div>

            {/* Saco de Transporte (+0,10€ cada) */}
            <div className="p-3 rounded-2xl border border-slate-200 dark:border-white/15 bg-slate-50/70 dark:bg-white/5 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Saco de Transporte
                </div>
                <div className="text-[11px] text-slate-700 dark:text-slate-300">
                  +0,10€ por unidade
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBagQuantity((q) => Math.max(0, q - 1))}
                  disabled={bagQuantity <= 0}
                  className="w-7 h-7 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-white/10 text-slate-700 dark:text-white font-black text-xs hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
                  title="Diminuir sacos"
                >
                  -
                </button>
                <span className="w-6 text-center text-xs font-black font-mono text-slate-900 dark:text-white">
                  {bagQuantity}
                </span>
                <button
                  type="button"
                  onClick={() => setBagQuantity((q) => q + 1)}
                  className="w-7 h-7 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-white/10 text-slate-700 dark:text-white font-black text-xs hover:bg-slate-100 cursor-pointer flex items-center justify-center"
                  title="Aumentar sacos"
                >
                  +
                </button>
              </div>
            </div>

            {/* Lista Limpa de Métodos de Pagamento (Sem Ícones Supérfluos) */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {METHODS.map((m) => (
                <button
                  key={m.code}
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSelectMethod(m.code)}
                  className="p-3 rounded-2xl border border-slate-200 dark:border-white/15 hover:border-purple-600 dark:hover:border-pink-500 hover:bg-purple-50/50 dark:hover:bg-white/5 transition text-left flex flex-col justify-between gap-1 cursor-pointer"
                >
                  <div className="font-extrabold text-xs leading-tight text-foreground">{m.label}</div>
                  <div className="text-[10px] text-muted-foreground">{m.hint}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

