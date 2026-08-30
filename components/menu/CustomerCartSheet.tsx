'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/i18n/formatters'
import { Plus, Minus, Trash2, CheckCircle2, ShoppingBag, Smartphone, CreditCard, Clock, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface CartItem {
  id: string
  containerId?: string
  containerName?: string
  containerWeight?: number
  container: any
  bases: any[]
  toppings: any[]
  extraBasesCount?: number
  extraToppingsCount?: number
  quantity: number
  unitPrice: number
  lineTotal: number
  notes?: string
}

interface CustomerCartSheetProps {
  open: boolean
  onClose: () => void
  cart: CartItem[]
  onUpdateQuantity: (index: number, newQty: number) => void
  onRemoveItem: (index: number) => void
  onClearCart: () => void
  tenantId?: string
  tenantName?: string
  isTable?: boolean
  tableNumber?: string | number
}

type CheckoutStep = 'CART' | 'MBWAY_WAITING' | 'SUCCESS_PAID' | 'SUCCESS_COUNTER'

export default function CustomerCartSheet({
  open,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  tenantId,
  tenantName,
  isTable,
  tableNumber,
}: CustomerCartSheetProps) {
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerNif, setCustomerNif] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'MBWAY' | 'BALCAO'>('MBWAY')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('CART')
  const [createdOrder, setCreatedOrder] = useState<any | null>(null)
  const [countdown, setCountdown] = useState<number>(240) // 4 min para autorização MB WAY

  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const activeOrderIdRef = useRef<string | null>(null)

  const cartTotal = +(cart.reduce((acc, item) => acc + (Number(item.lineTotal) || 0), 0)).toFixed(2)

  // Iniciar polling do status quando estiver aguardando MB WAY
  useEffect(() => {
    if (checkoutStep === 'MBWAY_WAITING' && (createdOrder?.id || activeOrderIdRef.current)) {
      const targetId = createdOrder?.id || activeOrderIdRef.current
      pollingTimerRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/orders/${targetId}`)
          if (res.ok) {
            const data = await res.json()
            const ord = data.order || data
            if (ord.paymentStatus === 'PAID' || ord.status === 'PREPARING' || ord.status === 'READY') {
              if (pollingTimerRef.current) clearInterval(pollingTimerRef.current)
              setCheckoutStep('SUCCESS_PAID')
              onClearCart()
              toast.success('Pagamento confirmado com sucesso! Pedido enviado para a cozinha.')
            }
          }
        } catch {
          // silencia falhas pontuais de polling
        }
      }, 3000)

      // Contador regressivo
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval)
            if (pollingTimerRef.current) clearInterval(pollingTimerRef.current)
            toast.error('Tempo limite de aprovação MB WAY expirado.')
            setCheckoutStep('CART')
            return 240
          }
          return prev - 1
        })
      }, 1000)

      return () => {
        if (pollingTimerRef.current) clearInterval(pollingTimerRef.current)
        clearInterval(countdownInterval)
      }
    }
  }, [checkoutStep, createdOrder])

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('O seu pedido está vazio')
      return
    }

    if (!customerName.trim()) {
      toast.error('Por favor, informe o seu nome para identificação no pedido')
      return
    }

    if (paymentMethod === 'MBWAY') {
      const cleanPhone = customerPhone.replace(/\D/g, '')
      if (cleanPhone.length < 9) {
        toast.error('Informe um número de telemóvel válido (9 dígitos) para o MB WAY')
        return
      }
    }

    setIsSubmitting(true)
    try {
      const itemsPayload = cart.map((item) => ({
        containerId: item.container?.id || item.containerId,
        containerName: item.container?.name || item.containerName,
        weightGrams: item.container?.weightGrams || item.containerWeight,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
        bases: item.bases?.map((b) => ({ id: b.id, name: b.name })) || [],
        toppings: item.toppings?.map((t) => ({ id: t.id, name: t.name, category: t.category, isPremium: t.isPremium })) || [],
        notes: item.notes || '',
      }))

      // Pedido inicial com status Pay-First:
      const initialStatus = paymentMethod === 'MBWAY' ? 'PENDING' : 'AWAITING_PAYMENT'

      const payload = {
        tenantId: tenantId || '11111111-1111-1111-1111-111111111111',
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || undefined,
        customerNif: customerNif.trim() || undefined,
        tableNumber: tableNumber ? Number(tableNumber) : null,
        isTableOrder: Boolean(isTable),
        paymentMethod: paymentMethod,
        paymentStatus: 'PENDING',
        status: initialStatus,
        items: itemsPayload,
        itemsJson: itemsPayload,
        subtotal: cartTotal,
        total: cartTotal,
        channel: 'QR_CODE',
        isQRCode: true,
        cashierName: 'Autoatendimento QR Code',
        notes: isTable ? `Mesa ${tableNumber} · ${paymentMethod === 'MBWAY' ? 'MB WAY' : 'Pagar no Balcão'}` : 'Balcão',
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        throw new Error('Falha ao registar o pedido no sistema')
      }

      const orderData = await res.json()
      activeOrderIdRef.current = orderData.id || orderData.order?.id
      setCreatedOrder(orderData.order || orderData)

      if (paymentMethod === 'MBWAY') {
        // Disparar cobrança MB WAY no gateway Ifthenpay
        try {
          await fetch('/api/payments/ifthenpay/mbway', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: orderData.id || orderData.order?.id,
              amount: cartTotal,
              mobileNumber: customerPhone.trim(),
              customerName: customerName.trim(),
              tableLabel: isTable && tableNumber ? `Mesa ${tableNumber}` : 'Balcão',
              tenantId,
            }),
          })
        } catch {
          // Permite prosseguir no fluxo mesmo se o sandbox gateway offline
        }

        setCountdown(240)
        setCheckoutStep('MBWAY_WAITING')
      } else {
        // Pagar no Balcão
        onClearCart()
        setCheckoutStep('SUCCESS_COUNTER')
        toast.info('Pré-pedido gerado. Dirija-se ao caixa para concluir o pagamento.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao processar o seu pedido. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Simular aprovação direta (para testes / sandbox quando o webhook não roda local)
  const handleSimulatePaymentApproval = async () => {
    const orderId = createdOrder?.id || activeOrderIdRef.current
    if (orderId) {
      try {
        await fetch(`/api/orders/${orderId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'PREPARING',
            paymentStatus: 'PAID',
          }),
        })
      } catch {
        // silencia falha de rede na simulação
      }
    }
    if (pollingTimerRef.current) clearInterval(pollingTimerRef.current)
    setCheckoutStep('SUCCESS_PAID')
    onClearCart()
    toast.success('Pagamento aprovado! Pedido despachado para a cozinha.')
  }

  const handleCloseDialog = () => {
    if (checkoutStep === 'SUCCESS_PAID' || checkoutStep === 'SUCCESS_COUNTER') {
      setCheckoutStep('CART')
      setCreatedOrder(null)
      setCustomerName('')
      setCustomerNif('')
      setCustomerPhone('')
    }
    onClose()
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleCloseDialog()}>
      <DialogContent className="w-[95vw] sm:w-full max-w-lg max-h-[92vh] overflow-hidden p-0 bg-white text-slate-900 border border-purple-100 dark:bg-[#160228] dark:text-white dark:border-white/20 rounded-3xl flex flex-col shadow-2xl transition-colors duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-purple-100 dark:border-white/10 bg-purple-50/80 dark:bg-[#1e0333]/95 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-pink-100 text-pink-600 dark:bg-pink-600/20 dark:text-pink-400">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
                {checkoutStep === 'MBWAY_WAITING'
                  ? 'Aguardando Pagamento MB WAY'
                  : checkoutStep === 'SUCCESS_PAID'
                  ? 'Pagamento Confirmado'
                  : checkoutStep === 'SUCCESS_COUNTER'
                  ? 'Pré-Pedido Registado'
                  : 'O Seu Pedido'}
              </DialogTitle>
              <span className="text-[11px] text-slate-500 dark:text-purple-200/70">
                {isTable && tableNumber ? `Mesa ${tableNumber} · ` : ''}{tenantName || 'Açaí da Rose'}
              </span>
            </div>
          </div>
        </div>

        {/* Corpo */}
        <div className="overflow-y-auto p-5 space-y-5 flex-1 text-slate-900 dark:text-white">
          {/* TELA 1: AGUARDANDO MB WAY */}
          {checkoutStep === 'MBWAY_WAITING' && (
            <div className="py-6 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-pink-100 border border-pink-300 dark:bg-pink-500/20 dark:border-pink-500/40 flex items-center justify-center text-pink-600 dark:text-pink-400 animate-pulse">
                <Smartphone className="h-8 w-8" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Autorize na sua App MB WAY</h3>
                <p className="text-xs text-slate-600 dark:text-purple-200/80 mt-1 max-w-sm mx-auto">
                  Enviámos uma solicitação de <strong>{formatCurrency(cartTotal)}</strong> para o telemóvel <strong>{customerPhone}</strong>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100 dark:bg-white/5 dark:border-white/10 max-w-xs mx-auto space-y-1">
                <div className="text-[10px] text-slate-500 dark:text-purple-300 uppercase font-bold">Tempo Restante:</div>
                <div className="text-2xl font-mono font-bold text-pink-600 dark:text-pink-400 flex items-center justify-center gap-1.5">
                  <Clock className="h-5 w-5" />
                  <span>{formatTime(countdown)}</span>
                </div>
              </div>

              {/* Botão de Sandbox / Confirmação Manual para Demonstração */}
              <div className="pt-3 max-w-sm mx-auto">
                <Button
                  type="button"
                  onClick={handleSimulatePaymentApproval}
                  className="w-full h-11 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-600/25 cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Confirmar Pagamento Imediato (Teste)</span>
                </Button>
                <p className="text-[10px] text-slate-400 dark:text-purple-300/60 mt-1.5 text-center">
                  Use este botão em ambiente de testes para avançar imediatamente para a cozinha e TV.
                </p>
              </div>
            </div>
          )}

          {/* TELA 2: SUCESSO PAGO VIA MB WAY */}
          {checkoutStep === 'SUCCESS_PAID' && (
            <div className="py-6 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 dark:bg-emerald-500/20 dark:border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-10 w-10" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Pagamento Confirmado!</h3>
                <p className="text-xs text-slate-600 dark:text-purple-200/80 mt-1">
                  O seu pedido foi recebido pela cozinha e já está a ser preparado.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100 dark:bg-white/5 dark:border-white/10 max-w-xs mx-auto space-y-1.5">
                <div className="text-[10px] text-slate-500 dark:text-purple-300 uppercase font-bold">Senha de Chamada na TV</div>
                <div className="text-3xl font-black text-pink-600 dark:text-pink-400 font-mono">
                  #{String(createdOrder?.orderNumber || createdOrder?.daily_order_seq || 1).padStart(3, '0')}
                </div>
                {isTable && tableNumber && (
                  <div className="text-xs text-slate-600 dark:text-purple-200 font-medium">
                    Mesa {tableNumber} · {customerName}
                  </div>
                )}
              </div>

              <p className="text-[11px] text-slate-500 dark:text-purple-300/80 max-w-sm mx-auto">
                Acompanhe o estado do seu açaí no ecrã da Smart TV no salão.
              </p>
            </div>
          )}

          {/* TELA 3: SUCESSO PAGAR NO BALCÃO */}
          {checkoutStep === 'SUCCESS_COUNTER' && (
            <div className="py-6 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 border border-amber-300 dark:bg-amber-500/20 dark:border-amber-500/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-10 w-10" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Pré-Pedido Registado!</h3>
                <p className="text-xs text-slate-600 dark:text-purple-200/80 mt-1 max-w-sm mx-auto">
                  Dirija-se ao caixa para efetuar o pagamento de <strong>{formatCurrency(cartTotal)}</strong>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100 dark:bg-white/5 dark:border-white/10 max-w-xs mx-auto space-y-1.5">
                <div className="text-[10px] text-amber-600 dark:text-amber-300 uppercase font-bold">Número da Comanda</div>
                <div className="text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">
                  #{String(createdOrder?.orderNumber || createdOrder?.daily_order_seq || 1).padStart(3, '0')}
                </div>
                {isTable && tableNumber && (
                  <div className="text-xs text-slate-600 dark:text-purple-200 font-medium">
                    Mesa {tableNumber} · {customerName}
                  </div>
                )}
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-500/30 text-[11px] text-amber-800 dark:text-amber-200 text-left max-w-sm mx-auto">
                <strong>Atenção:</strong> A preparação do açaí na copa terá início logo após a validação do pagamento no caixa da loja.
              </div>
            </div>
          )}

          {/* TELA 4: CARRINHO NORMAL */}
          {checkoutStep === 'CART' && (
            <>
              {cart.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="mx-auto w-12 h-12 rounded-full bg-purple-50 dark:bg-white/5 flex items-center justify-center text-purple-400 dark:text-purple-300/50">
                    <ShoppingBag className="h-6 w-6" />
                  </div>
                  <p className="text-xs text-slate-600 dark:text-purple-200/70">O seu pedido está vazio.</p>
                  <p className="text-[11px] text-slate-400 dark:text-purple-300/50">
                    Escolha uma das nossas taças para personalizar o seu açaí.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Lista de Taças */}
                  <div className="space-y-2.5">
                    {cart.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100 dark:bg-white/5 dark:border-white/10 space-y-2 text-left"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-bold text-xs text-slate-900 dark:text-white">
                              {item.container?.name || item.containerName || 'Açaí Personalizado'}
                            </div>
                            <div className="text-[10px] text-pink-600 dark:text-pink-300 font-mono font-bold mt-0.5">
                              {formatCurrency(item.unitPrice)} un.
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => onRemoveItem(idx)}
                            className="text-slate-400 hover:text-red-500 dark:text-purple-300/50 dark:hover:text-red-400 p-1 transition cursor-pointer"
                            title="Remover item"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Detalhes dos Ingredientes */}
                        <div className="text-[11px] text-slate-600 dark:text-purple-200/70 space-y-0.5 bg-white dark:bg-purple-950/30 p-2 rounded-xl border border-purple-100 dark:border-white/5">
                          {item.bases?.length > 0 && (
                            <div>
                              <span className="font-bold text-purple-900 dark:text-purple-300">Base: </span>
                              <span>{item.bases.map((b: any) => b.name).join(', ')}</span>
                            </div>
                          )}
                          {item.toppings?.length > 0 && (
                            <div>
                              <span className="font-bold text-purple-900 dark:text-purple-300">Acompanhamentos: </span>
                              <span>{item.toppings.map((t: any) => t.name).join(', ')}</span>
                            </div>
                          )}
                          {item.notes && (
                            <div>
                              <span className="font-bold text-purple-900 dark:text-purple-300">Obs: </span>
                              <span className="italic">{item.notes}</span>
                            </div>
                          )}
                        </div>

                        {/* Quantidade e Total da Linha */}
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(idx, Math.max(1, item.quantity - 1))}
                              className="h-6 w-6 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-950 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center text-xs font-bold cursor-pointer dark:text-white"
                            >
                              <Minus className="h-2.5 w-2.5" />
                            </button>
                            <span className="font-mono font-bold text-xs text-slate-900 dark:text-white px-1">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(idx, item.quantity + 1)}
                              className="h-6 w-6 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-700 flex items-center justify-center text-xs font-bold cursor-pointer text-white"
                            >
                              <Plus className="h-2.5 w-2.5" />
                            </button>
                          </div>

                          <div className="font-bold text-xs font-mono text-fuchsia-600 dark:text-fuchsia-300">
                            {formatCurrency(item.lineTotal)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Dados do Cliente */}
                  <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 dark:bg-white/5 dark:border-white/10 space-y-3 text-left">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Identificação para Chamada:</div>

                    <div className="space-y-1">
                      <label className="text-xs text-slate-600 dark:text-purple-200 font-bold">
                        O seu Nome (Obrigatório para chamada na TV):
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Ex: João Silva"
                        className="w-full h-11 px-3.5 rounded-xl bg-white border border-purple-200 dark:bg-white/5 dark:border-white/15 text-base sm:text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-purple-300/40 focus:ring-2 focus:ring-fuchsia-500 focus:outline-none font-medium"
                      />
                    </div>

                    {/* Forma de Pagamento */}
                    <div className="space-y-1.5 pt-1">
                      <label className="text-xs text-slate-600 dark:text-purple-200 font-bold">
                        Forma de Pagamento:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('MBWAY')}
                          className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                            paymentMethod === 'MBWAY'
                              ? 'bg-fuchsia-100 border-fuchsia-400 text-fuchsia-900 dark:bg-fuchsia-600/30 dark:border-fuchsia-400 dark:text-white shadow-sm'
                              : 'bg-white border-purple-100 text-slate-600 hover:bg-purple-50 dark:bg-white/5 dark:border-white/10 dark:text-purple-200/70'
                          }`}
                        >
                          <Smartphone className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                          <span>MB WAY</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMethod('BALCAO')}
                          className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                            paymentMethod === 'BALCAO'
                              ? 'bg-fuchsia-100 border-fuchsia-400 text-fuchsia-900 dark:bg-fuchsia-600/30 dark:border-fuchsia-400 dark:text-white shadow-sm'
                              : 'bg-white border-purple-100 text-slate-600 hover:bg-purple-50 dark:bg-white/5 dark:border-white/10 dark:text-purple-200/70'
                          }`}
                        >
                          <CreditCard className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          <span>No Balcão</span>
                        </button>
                      </div>
                    </div>

                    {/* Campo Telemóvel condicional para MB WAY */}
                    {paymentMethod === 'MBWAY' && (
                      <div className="space-y-1 pt-1">
                        <label className="text-xs text-slate-600 dark:text-purple-200 font-bold">
                          Nº Telemóvel MB WAY (9 dígitos):
                        </label>
                        <input
                          type="tel"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="912 345 678"
                          className="w-full h-11 px-3.5 rounded-xl bg-white border border-purple-200 dark:bg-white/5 dark:border-white/15 text-base sm:text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-purple-300/40 focus:ring-2 focus:ring-fuchsia-500 focus:outline-none font-mono"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Rodapé Fixo */}
        <div className="px-5 py-4 border-t border-purple-100 dark:border-white/10 bg-purple-50/80 dark:bg-[#1e0333] flex items-center justify-between gap-3">
          {checkoutStep !== 'CART' ? (
            <Button
              type="button"
              onClick={handleCloseDialog}
              className="w-full h-11 rounded-2xl bg-gradient-to-r from-pink-600 via-fuchsia-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-xs cursor-pointer shadow-md"
            >
              Concluir e Voltar ao Menu
            </Button>
          ) : (
            <>
              <div>
                <div className="text-[10px] text-slate-500 dark:text-purple-300 font-medium uppercase">Total do Pedido</div>
                <div className="text-xl font-bold text-fuchsia-600 dark:text-fuchsia-300 font-mono">
                  {formatCurrency(cartTotal)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  className="text-xs text-slate-600 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white cursor-pointer"
                >
                  Continuar
                </Button>
                <Button
                  type="button"
                  disabled={cart.length === 0 || isSubmitting}
                  onClick={handleCheckout}
                  className="h-11 px-5 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-purple-700 hover:from-fuchsia-500 hover:to-purple-600 text-white font-bold text-xs shadow-md shadow-fuchsia-600/30 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting
                    ? 'A processar...'
                    : paymentMethod === 'MBWAY'
                    ? 'Pagar com MB WAY'
                    : 'Concluir no Balcão'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
