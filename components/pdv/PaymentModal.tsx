'use client'

import React, { useState, useEffect } from 'react'
import { PaymentMethodCode } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/i18n/formatters'
import { useAuthStore } from '@/lib/stores/authStore'
import MBWayQRCodeView from './MBWayQRCodeView'
import PDVQRCodeScanner from './PDVQRCodeScanner'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

export interface PaymentExtraOptions {
  consumptionType: 'DINE_IN' | 'TAKEAWAY'
  isTakeaway: boolean
  needBag: boolean
  bagQuantity: number
  bagFee: number
  totalWithBags: number
  loyaltyCustomerId?: string
  loyaltyCustomerName?: string
}

interface PaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  total: number
  tenantId?: string
  cashierUserId?: string
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
  tenantId,
  cashierUserId,
  storePhone,
  submitting,
  initialCustomerName = '',
  initialTableName,
  initialConsumptionType = 'DINE_IN',
  initialBagQuantity = 0,
  onPay,
}: PaymentModalProps) {
  const { authFetch } = useAuthStore()
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodCode | null>(null)
  const [customerName, setCustomerName] = useState(initialCustomerName)
  const [customerPhone, setCustomerPhone] = useState('')
  const [consumptionType, setConsumptionType] = useState<'DINE_IN' | 'TAKEAWAY'>(initialConsumptionType)
  const [bagQuantity, setBagQuantity] = useState<number>(initialBagQuantity)

  // Identificação Cashback (para creditar pontos e resgatar vouchers ativos)
  const [loyaltyQuery, setLoyaltyQuery] = useState('')
  const [loyaltyLoading, setLoyaltyLoading] = useState(false)
  const [loyaltyCustomer, setLoyaltyCustomer] = useState<{
    id: string
    name: string
    username: string
    phone: string
    points_balance: number
  } | null>(null)
  const [loyaltyVouchers, setLoyaltyVouchers] = useState<
    Array<{ id: string; voucher_code: string; reward_name: string; expires_at: string }>
  >([])
  const [redeemingVoucher, setRedeemingVoucher] = useState<string | null>(null)
  const [qrScannerOpen, setQrScannerOpen] = useState(false)
  const [cashbackEnabledForStore, setCashbackEnabledForStore] = useState(true)

  // Sincronizar estado inicial ao abrir o modal
  useEffect(() => {
    if (open) {
      setCustomerName(initialCustomerName || '')
      setSelectedMethod(null)
      setConsumptionType(initialConsumptionType || 'DINE_IN')
      setBagQuantity(initialBagQuantity || 0)
      setLoyaltyQuery('')
      setLoyaltyCustomer(null)
      setLoyaltyVouchers([])
      setQrScannerOpen(false)
      if (tenantId) {
        fetch('/api/loyalty/settings')
          .then((r) => r.json())
          .then((d) => {
            const disabled: string[] = Array.isArray(d?.stores?.disabled_tenant_ids)
              ? d.stores.disabled_tenant_ids
              : []
            setCashbackEnabledForStore(!disabled.includes(tenantId))
          })
          .catch(() => {})
      }
    }
  }, [open, initialCustomerName, initialConsumptionType, initialBagQuantity, tenantId])

  const handleLoyaltyLookup = async (overrideQuery?: string) => {
    const q = (overrideQuery ?? loyaltyQuery ?? customerPhone).trim()
    if (!q) {
      toast.error('Introduza o telemóvel, @username ou leia o QR Code do cliente.')
      return
    }
    setLoyaltyLoading(true)
    try {
      const res = await authFetch('/api/pdv/loyalty/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error || 'Erro ao consultar cliente Cashback.')
        return
      }
      if (!json?.customer) {
        setLoyaltyCustomer(null)
        setLoyaltyVouchers([])
        toast.error('Cliente não encontrado no programa Cashback.')
        return
      }
      setLoyaltyCustomer(json.customer)
      setLoyaltyVouchers(Array.isArray(json.active_vouchers) ? json.active_vouchers : [])
      if (!customerName.trim() || customerName.startsWith('Cliente Mesa')) {
        setCustomerName(json.customer.name)
      }
      if (!customerPhone.trim() && json.customer.phone) {
        setCustomerPhone(json.customer.phone)
      }
      toast.success(`Cliente Cashback identificado: ${json.customer.name}`)
    } catch {
      toast.error('Erro de ligação ao consultar Cashback.')
    } finally {
      setLoyaltyLoading(false)
    }
  }

  const handleRedeemInlineVoucher = async (voucherCode: string) => {
    if (!tenantId) {
      toast.error('Loja não identificada para resgate.')
      return
    }
    setRedeemingVoucher(voucherCode)
    try {
      const res = await authFetch('/api/pdv/loyalty/redeem-voucher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voucher_code: voucherCode,
          tenant_id: tenantId,
          cashier_user_id: cashierUserId || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error || 'Não foi possível validar o voucher.')
        return
      }
      setLoyaltyVouchers((prev) => prev.filter((v) => v.voucher_code !== voucherCode))
      toast.success(`Voucher ${voucherCode} validado (${json?.rewardName || 'Prémio'})!`)
    } catch {
      toast.error('Erro de ligação ao validar voucher.')
    } finally {
      setRedeemingVoucher(null)
    }
  }

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
    loyaltyCustomerId: loyaltyCustomer?.id,
    loyaltyCustomerName: loyaltyCustomer?.name,
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

            {/* Cashback do Cliente (Creditar Pontos & Vouchers Ativos) */}
            {cashbackEnabledForStore && (
            <div className="p-3 rounded-2xl border border-purple-150 dark:border-white/15 bg-purple-50/50 dark:bg-white/5 space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-black text-purple-950 dark:text-white">
                  Cashback do Cliente (opcional)
                </Label>
                {loyaltyCustomer ? (
                  <button
                    type="button"
                    onClick={() => {
                      setLoyaltyCustomer(null)
                      setLoyaltyVouchers([])
                      setLoyaltyQuery('')
                    }}
                    className="text-[11px] font-bold text-purple-700 dark:text-pink-300 hover:underline cursor-pointer"
                  >
                    Remover
                  </button>
                ) : null}
              </div>

              {!loyaltyCustomer ? (
                <div className="space-y-2">
                  {qrScannerOpen ? (
                    <PDVQRCodeScanner
                      onScan={(raw) => {
                        setQrScannerOpen(false)
                        handleLoyaltyLookup(raw)
                      }}
                      onClose={() => setQrScannerOpen(false)}
                      hint="Aponte para o QR Code do Cartão Cashback."
                    />
                  ) : (
                    <div className="flex gap-1.5">
                      <Input
                        placeholder="Telemóvel, @username ou QR"
                        value={loyaltyQuery}
                        onChange={(e) => setLoyaltyQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleLoyaltyLookup()
                          }
                        }}
                        className="h-9 text-xs rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-[#12061d]"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={loyaltyLoading}
                        onClick={() => handleLoyaltyLookup()}
                        className="h-9 px-2.5 text-xs font-bold rounded-xl border-purple-200 dark:border-white/15 cursor-pointer shrink-0"
                      >
                        {loyaltyLoading ? '...' : 'Buscar'}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setQrScannerOpen(true)}
                        className="h-9 px-2.5 bg-gradient-to-r from-purple-700 to-pink-600 text-white text-xs font-black rounded-xl cursor-pointer shrink-0"
                      >
                        Ler QR
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-black text-purple-950 dark:text-white">
                        {loyaltyCustomer.name}
                      </span>{' '}
                      <span className="text-purple-700/75 dark:text-purple-200/70">
                        ({loyaltyCustomer.username})
                      </span>
                    </div>
                    <span className="font-black font-mono text-purple-700 dark:text-pink-400">
                      {loyaltyCustomer.points_balance} pts
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">
                    Pontos desta compra serão creditados automaticamente ao confirmar o pagamento.
                  </div>
                  {loyaltyVouchers.length > 0 && (
                    <div className="space-y-1.5 pt-1.5 border-t border-purple-200/60 dark:border-white/10">
                      {loyaltyVouchers.map((v) => (
                        <div
                          key={v.id}
                          className="flex items-center justify-between gap-2 bg-white dark:bg-[#12061d] px-2.5 py-1.5 rounded-xl border border-purple-150 dark:border-white/10"
                        >
                          <div className="min-w-0">
                            <div className="text-[11px] font-black text-purple-950 dark:text-white truncate">
                              {v.reward_name}
                            </div>
                            <div className="text-[10px] font-mono text-purple-700 dark:text-pink-300">
                              {v.voucher_code}
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            disabled={redeemingVoucher === v.voucher_code}
                            onClick={() => handleRedeemInlineVoucher(v.voucher_code)}
                            className="h-7 px-2.5 bg-gradient-to-r from-purple-700 to-pink-600 text-white text-[10px] font-black rounded-lg cursor-pointer shrink-0"
                          >
                            {redeemingVoucher === v.voucher_code ? '...' : 'Validar Voucher'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            )}

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

            {/* Saco de Transporte (+0,10€ cada) - Apenas para Takeaway */}
            {consumptionType === 'TAKEAWAY' && (
              <div className="p-3 rounded-2xl border border-slate-200 dark:border-white/15 bg-slate-50/70 dark:bg-white/5 flex items-center justify-between animate-in fade-in duration-150">
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
            )}

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

