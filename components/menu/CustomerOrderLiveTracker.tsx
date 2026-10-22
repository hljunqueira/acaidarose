'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { playOrderNotificationSound } from '@/lib/utils/soundNotification'
import { subscribeToTVCalls, TVCallEvent } from '@/lib/utils/tvBroadcast'
import { formatCurrency } from '@/lib/i18n/formatters'
import { CheckCircle2, Clock, ChefHat, Bell, X, ExternalLink } from 'lucide-react'

export interface ActiveCustomerOrder {
  orderId: string
  orderNumber: string
  customerName: string
  origin: 'BALCAO' | 'ESPLANADA'
  tableLabel: string
  tenantId: string
  status: string
  total?: number
  createdAt?: string
  notifiedReady?: boolean
}

export default function CustomerOrderLiveTracker() {
  const [activeOrder, setActiveOrder] = useState<ActiveCustomerOrder | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [readyModalOpen, setReadyModalOpen] = useState(false)

  // Carregar pedido ativo do localStorage
  const loadActiveOrder = useCallback(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem('customer_active_order')
      if (!raw) {
        setActiveOrder(null)
        return
      }
      const parsed: ActiveCustomerOrder = JSON.parse(raw)
      // Se já foi finalizado há mais de 4 horas, ignora
      if (parsed.createdAt) {
        const orderTime = new Date(parsed.createdAt).getTime()
        const now = Date.now()
        if (now - orderTime > 4 * 60 * 60 * 1000) {
          localStorage.removeItem('customer_active_order')
          setActiveOrder(null)
          return
        }
      }
      setActiveOrder(parsed)
    } catch {
      setActiveOrder(null)
    }
  }, [])

  useEffect(() => {
    loadActiveOrder()

    const handleCustomUpdate = () => loadActiveOrder()
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'customer_active_order') {
        loadActiveOrder()
      }
    }

    window.addEventListener('customer_order_updated', handleCustomUpdate)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener('customer_order_updated', handleCustomUpdate)
      window.removeEventListener('storage', handleStorage)
    }
  }, [loadActiveOrder])

  // Disparo de notificação isolada no smartphone do cliente
  const triggerReadyNotification = useCallback((orderToNotify: ActiveCustomerOrder) => {
    try {
      playOrderNotificationSound()
    } catch {}

    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([300, 150, 300, 150, 500])
      }
    } catch {}

    setReadyModalOpen(true)

    // Atualiza notifiedReady no localStorage para não tocar repetidamente
    const updated = { ...orderToNotify, notifiedReady: true }
    setActiveOrder(updated)
    try {
      localStorage.setItem('customer_active_order', JSON.stringify(updated))
    } catch {}
  }, [])

  // 1. Polling atômico dedicado a cada 3.5 segundos em /api/orders/${orderId}
  useEffect(() => {
    if (!activeOrder?.orderId) return

    // Se já estiver concluído e notificado, não precisa de polling agressivo
    if (activeOrder.status === 'COMPLETED' && activeOrder.notifiedReady) return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(activeOrder.orderId)}`, {
          cache: 'no-store',
        })
        if (!res.ok) return

        const data = await res.json()
        const serverOrder = data.order || data
        if (!serverOrder) return

        const newStatus = serverOrder.status

        if (newStatus !== activeOrder.status) {
          const updated: ActiveCustomerOrder = {
            ...activeOrder,
            status: newStatus,
          }

          // Se acabou de ficar pronto e ainda não foi notificado
          if ((newStatus === 'READY' || newStatus === 'COMPLETED') && !activeOrder.notifiedReady) {
            triggerReadyNotification(updated)
          } else {
            setActiveOrder(updated)
            localStorage.setItem('customer_active_order', JSON.stringify(updated))
          }
        }
      } catch {
        // silencia falhas pontuais de conexão
      }
    }, 3500)

    return () => clearInterval(interval)
  }, [activeOrder, triggerReadyNotification])

  // 2. Escuta de eventos de chamada de TV (com filtro estrito de isolamento por orderId/ticket)
  useEffect(() => {
    if (!activeOrder?.orderNumber) return

    const unsubscribe = subscribeToTVCalls((event: TVCallEvent) => {
      // REGRA DE ISOLAMENTO: ignora solenemente se a chamada for de outro cliente
      const isMyTicket =
        String(event.ticket).trim().toLowerCase() === String(activeOrder.orderNumber).trim().toLowerCase()
      const isMyName =
        event.customerName &&
        activeOrder.customerName &&
        event.customerName.trim().toLowerCase() === activeOrder.customerName.trim().toLowerCase()

      if (isMyTicket || isMyName) {
        triggerReadyNotification(activeOrder)
      }
    }, undefined, activeOrder.tenantId)

    return () => {
      unsubscribe()
    }
  }, [activeOrder, triggerReadyNotification])

  const handleDismiss = () => {
    try {
      localStorage.removeItem('customer_active_order')
    } catch {}
    setActiveOrder(null)
    setReadyModalOpen(false)
    setDetailsOpen(false)
  }

  if (!activeOrder) return null

  const isReady = activeOrder.status === 'READY' || activeOrder.status === 'COMPLETED'
  const isPreparing = activeOrder.status === 'PREPARING'
  const isAwaitingPayment = activeOrder.status === 'AWAITING_PAYMENT' || activeOrder.status === 'NEW'

  const getStatusBadge = () => {
    if (isReady) {
      return (
        <Badge className="bg-emerald-500 text-white dark:bg-emerald-600 font-black text-[10px] px-2 py-0.5 animate-pulse border-0">
          Pronto p/ Recolha
        </Badge>
      )
    }
    if (isPreparing) {
      return (
        <Badge className="bg-purple-700 text-white dark:bg-pink-600 font-bold text-[10px] px-2 py-0.5 border-0">
          Em Preparação
        </Badge>
      )
    }
    return (
      <Badge className="bg-amber-500 text-black font-bold text-[10px] px-2 py-0.5 border-0">
        Aguardando Pagamento
      </Badge>
    )
  }

  return (
    <>
      {/* BARRA FLUTUANTE DISCRETA ACIMA DA BOTTOM NAV */}
      <div className="fixed bottom-16 inset-x-0 z-40 px-3 sm:px-4 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          <div
            onClick={() => setDetailsOpen(true)}
            className={`cursor-pointer transition-all duration-300 rounded-2xl p-2.5 sm:p-3 shadow-xl backdrop-blur-md border flex items-center justify-between gap-3 ${
              isReady
                ? 'bg-emerald-950/90 text-white border-emerald-400/50 shadow-emerald-950/40'
                : 'bg-[#1b032e]/95 text-white border-purple-400/30 shadow-purple-950/40'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isReady ? 'bg-emerald-500 text-white' : 'bg-purple-800/80 text-pink-300'
                }`}
              >
                {isReady ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : isPreparing ? (
                  <ChefHat className="h-5 w-5 animate-pulse" />
                ) : (
                  <Clock className="h-5 w-5" />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-sm tracking-tight text-pink-300">
                    #{activeOrder.orderNumber}
                  </span>
                  <span className="text-xs font-bold truncate text-white">
                    {activeOrder.customerName}
                  </span>
                </div>
                <div className="text-[11px] text-purple-200/80 truncate">
                  {activeOrder.tableLabel} · {isReady ? 'Pode retirar!' : isPreparing ? 'A preparar açaí...' : 'Dirija-se ao caixa'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {getStatusBadge()}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[11px] font-bold text-purple-200 hover:text-white hover:bg-white/10 rounded-lg"
              >
                Ver
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE ALERTA MÁXIMO QUANDO O PEDIDO FICA PRONTO (APENAS NESTE TELEMÓVEL) */}
      <Dialog open={readyModalOpen} onOpenChange={setReadyModalOpen}>
        <DialogContent className="w-[92vw] sm:w-full max-w-sm p-6 bg-white dark:bg-[#160228] text-slate-900 dark:text-white border-2 border-emerald-500/40 rounded-3xl shadow-2xl text-center">
          <div className="mx-auto mb-3 h-14 w-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <DialogTitle className="text-xl font-black text-purple-950 dark:text-white tracking-tight">
            O seu pedido está pronto!
          </DialogTitle>

          <div className="my-4 p-4 rounded-2xl bg-purple-50 dark:bg-white/5 border border-purple-100 dark:border-white/10 space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-pink-400">
              Senha de Atendimento
            </div>
            <div className="text-3xl font-black font-mono text-purple-950 dark:text-white">
              #{activeOrder.orderNumber}
            </div>
            <div className="text-sm font-bold text-purple-900 dark:text-purple-200">
              {activeOrder.customerName}
            </div>
          </div>

          <p className="text-xs text-purple-800/90 dark:text-purple-200/90 leading-relaxed mb-4">
            {activeOrder.origin === 'BALCAO' || activeOrder.tableLabel.toLowerCase() === 'balcão'
              ? 'Por favor, dirija-se ao balcão de entrega para levantar o seu açaí.'
              : `A equipa está a encaminhar o pedido para a ${activeOrder.tableLabel}.`}
          </p>

          <DialogFooter className="flex flex-col gap-2">
            <Button
              type="button"
              onClick={handleDismiss}
              className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
            >
              Já Retirei o Pedido
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setReadyModalOpen(false)}
              className="w-full h-9 text-xs font-bold border-purple-200 dark:border-white/15 rounded-xl cursor-pointer"
            >
              Manter no Ecrã
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE DETALHES DO PEDIDO ATIVO */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="w-[92vw] sm:w-full max-w-sm p-5 bg-white dark:bg-[#160228] text-slate-900 dark:text-white border border-purple-150 dark:border-white/20 rounded-3xl shadow-xl">
          <DialogHeader className="text-left pb-2 border-b border-purple-100 dark:border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-pink-400">
                Acompanhamento em Tempo Real
              </span>
              {getStatusBadge()}
            </div>
            <DialogTitle className="text-lg font-black text-purple-950 dark:text-white mt-1">
              Pedido #{activeOrder.orderNumber}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-3 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-purple-100 dark:border-white/10">
              <span className="text-purple-700/80 dark:text-purple-300/80 font-medium">Cliente:</span>
              <span className="font-bold text-purple-950 dark:text-white">{activeOrder.customerName}</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-purple-100 dark:border-white/10">
              <span className="text-purple-700/80 dark:text-purple-300/80 font-medium">Local:</span>
              <span className="font-bold text-purple-950 dark:text-white">{activeOrder.tableLabel}</span>
            </div>

            {Boolean(activeOrder.total) && (
              <div className="flex items-center justify-between py-1.5 border-b border-purple-100 dark:border-white/10">
                <span className="text-purple-700/80 dark:text-purple-300/80 font-medium">Total:</span>
                <span className="font-bold text-purple-950 dark:text-white">{formatCurrency(activeOrder.total || 0)}</span>
              </div>
            )}

            <div className="p-3 rounded-2xl bg-purple-50/70 dark:bg-white/5 border border-purple-100 dark:border-white/10 text-[11px] text-purple-800 dark:text-purple-200 leading-relaxed">
              {isReady
                ? 'O seu pedido já se encontra pronto. Pode levantar diretamente no balcão de entrega.'
                : isPreparing
                ? 'A nossa equipa está na bancada a montar os seus recipientes com as bases e acompanhamentos escolhidos.'
                : 'O seu pedido aguarda liquidação no caixa. Apresente o seu nome ou senha para iniciar a preparação.'}
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDismiss}
              className="w-full text-xs font-bold text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-500/30 hover:bg-pink-50 dark:hover:bg-pink-950/20 rounded-xl"
            >
              Concluir / Limpar Acompanhamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
