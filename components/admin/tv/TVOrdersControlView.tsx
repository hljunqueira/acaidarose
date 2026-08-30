'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/stores/authStore'
import { broadcastTVCall } from '@/lib/utils/tvBroadcast'
import { announceTVCall } from '@/lib/utils/soundNotification'
import { Order, OrderStatus } from '@/types'
import { toast } from 'sonner'

interface TVOrdersControlViewProps {
  tenantId?: string
}

export default function TVOrdersControlView({ tenantId }: TVOrdersControlViewProps) {
  const { authFetch } = useAuthStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [audioEnabled, setAudioEnabled] = useState(false)

  const storeSlug = tenantId === '22222222-2222-2222-2222-222222222222' 
    ? 'torres-novas' 
    : 'aveiro'

  const storeTitle = tenantId === '22222222-2222-2222-2222-222222222222' 
    ? 'Filial Torres Novas' 
    : 'Matriz Aveiro'

  const fetchLiveOrders = useCallback(async () => {
    try {
      const url = tenantId ? `/api/orders?tenantId=${tenantId}` : '/api/orders'
      const res = await authFetch(url)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data.orders)) {
          setOrders(data.orders)
        }
      }
    } catch {
      // fallback silencioso
    } finally {
      setLoading(false)
    }
  }, [tenantId, authFetch])

  useEffect(() => {
    fetchLiveOrders()
    const interval = setInterval(fetchLiveOrders, 3000)
    return () => clearInterval(interval)
  }, [fetchLiveOrders])

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const res = await authFetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Falha ao atualizar pedido')
      
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      )
      const statusLabel = status === 'READY' ? 'Pronto para Retirar' : status === 'COMPLETED' || status === 'PAID' ? 'Entregue & Finalizado' : 'Em Preparação'
      toast.success(`Pedido movido para: ${statusLabel}`)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar pedido')
    }
  }

  // Ação de Chamar na TV & Mudar status para Pronto
  const handleMarkAsReadyAndCall = async (order: Order) => {
    const ticketNum = `#${String(order.orderNumber || 1).padStart(3, '0')}`
    const clientName = order.customerName || (order.tableNumber ? `Mesa ${order.tableNumber}` : 'Balcão')

    // 1. Atualizar status no Banco de Dados
    await updateStatus(order.id, 'READY')

    // 2. Transmitir chamada de áudio e visual para a TV física
    broadcastTVCall({
      ticket: ticketNum,
      customerName: clientName,
      status: 'READY',
    })

    if (audioEnabled) {
      announceTVCall(ticketNum, clientName)
    }

    toast.success(`Senha ${ticketNum} chamada na TV do Salão!`)
  }

  // Ação de Re-chamar senha já pronta
  const handleReCall = (order: Order) => {
    const ticketNum = `#${String(order.orderNumber || 1).padStart(3, '0')}`
    const clientName = order.customerName || (order.tableNumber ? `Mesa ${order.tableNumber}` : 'Balcão')

    broadcastTVCall({
      ticket: ticketNum,
      customerName: clientName,
      status: 'READY',
    })

    if (audioEnabled) {
      announceTVCall(ticketNum, clientName)
    }

    toast.success(`Senha ${ticketNum} re-chamada na TV do Salão!`)
  }

  const handleDeliver = async (order: Order) => {
    const ticketNum = `#${String(order.orderNumber || 1).padStart(3, '0')}`
    await updateStatus(order.id, 'COMPLETED')
    toast.success(`Pedido ${ticketNum} entregue com sucesso!`)
  }

  const preparingOrders = orders.filter((o) => o.status === 'PREPARING' || o.status === 'NEW')
  const readyOrders = orders.filter((o) => o.status === 'READY')

  return (
    <div className="bg-white dark:bg-[#0c0114] text-purple-950 dark:text-white rounded-3xl p-6 border border-purple-100 dark:border-purple-900/40 shadow-xl space-y-6">
      
      {/* Top Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-purple-100 dark:border-white/10">
        <div>
          <h1 className="text-lg font-black uppercase tracking-tight text-purple-900 dark:text-white">
            Painel de Controle da TV de Senhas
          </h1>
          <p className="text-xs text-purple-600 dark:text-purple-300 font-bold uppercase tracking-widest mt-0.5">
            {storeTitle} Operação
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={() => {
              const next = !audioEnabled
              setAudioEnabled(next)
              if (next) {
                announceTVCall('Teste', 'Açaí da Rose')
              }
            }}
            className={`h-9 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              audioEnabled
                ? 'bg-pink-600 hover:bg-pink-700 text-white shadow-md shadow-pink-600/30'
                : 'bg-purple-100 dark:bg-white/10 hover:bg-purple-200 dark:hover:bg-white/15 text-purple-900 dark:text-purple-200 border border-purple-200 dark:border-white/10'
            }`}
          >
            <span>{audioEnabled ? 'Áudio Local Ativo (Computador)' : 'Ativar Áudio Local'}</span>
          </Button>
          <Button
            type="button"
            onClick={() => {
              window.open(`/tv/${storeSlug}`, '_blank')
            }}
            className="h-9 px-4 rounded-xl text-xs font-bold bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-md shadow-purple-700/20 cursor-pointer transition-all"
          >
            <span>Abrir Tela de TV (Tela Cheia)</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-purple-600 dark:text-purple-300 font-bold">
          A carregar pedidos ativos...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Coluna 1: Em Preparação */}
          <div className="rounded-2xl border border-purple-100 dark:border-white/10 p-5 bg-purple-50/20 dark:bg-white/5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-purple-100 dark:border-white/10">
              <h2 className="text-sm font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Em Preparação
              </h2>
              <Badge variant="outline" className="text-amber-600 dark:text-amber-300 border-amber-500/40 text-[10px] font-black">
                {preparingOrders.length} {preparingOrders.length === 1 ? 'pedido' : 'pedidos'}
              </Badge>
            </div>

            {preparingOrders.length === 0 ? (
              <div className="py-12 text-center text-xs text-purple-400/50">
                Nenhum pedido em preparação no momento.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {preparingOrders.map((order) => {
                  const ticketNum = `#${String(order.orderNumber || 1).padStart(3, '0')}`
                  const clientName = order.customerName?.trim() || (order.tableNumber ? `Mesa ${String(order.tableNumber).padStart(2, '0')}` : 'Balcão')
                  return (
                    <div
                      key={order.id}
                      className="p-3.5 rounded-xl bg-white dark:bg-purple-950/30 border border-purple-100 dark:border-[#2A1E3D] flex items-center justify-between shadow-sm"
                    >
                      <div className="flex flex-col">
                        <span className="font-mono font-black text-base text-purple-900 dark:text-amber-300">
                          {ticketNum}
                        </span>
                        <span className="text-[10px] font-bold text-zinc-500 dark:text-white/80 mt-0.5">
                          {clientName}
                        </span>
                      </div>
                      <Button
                        type="button"
                        onClick={() => handleMarkAsReadyAndCall(order)}
                        className="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                      >
                        Pronto & Chamar
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Coluna 2: Pronto para Retirar */}
          <div className="rounded-2xl border border-emerald-100 dark:border-emerald-500/20 p-5 bg-emerald-50/10 dark:bg-emerald-950/5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-100 dark:border-emerald-500/20">
              <h2 className="text-sm font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Pronto para Retirar
              </h2>
              <Badge className="bg-emerald-600 text-white font-black text-[10px]">
                {readyOrders.length} {readyOrders.length === 1 ? 'pedido' : 'pedidos'}
              </Badge>
            </div>

            {readyOrders.length === 0 ? (
              <div className="py-12 text-center text-xs text-purple-400/50">
                Nenhum pedido aguardando retirada.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {readyOrders.map((order) => {
                  const ticketNum = `#${String(order.orderNumber || 1).padStart(3, '0')}`
                  const clientName = order.customerName?.trim() || (order.tableNumber ? `Mesa ${String(order.tableNumber).padStart(2, '0')}` : 'Balcão')
                  return (
                    <div
                      key={order.id}
                      className="p-3.5 rounded-xl bg-white dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-between shadow-sm"
                    >
                      <div className="flex flex-col">
                        <span className="font-mono font-black text-base text-emerald-600 dark:text-emerald-300">
                          {ticketNum}
                        </span>
                        <span className="text-[10px] font-bold text-zinc-500 dark:text-white/80 mt-0.5">
                          {clientName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          onClick={() => handleReCall(order)}
                          className="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider bg-pink-600 hover:bg-pink-700 text-white cursor-pointer"
                        >
                          Chamar
                        </Button>
                        <Button
                          type="button"
                          onClick={() => handleDeliver(order)}
                          className="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider bg-zinc-800 hover:bg-zinc-900 text-white border border-zinc-700 cursor-pointer"
                        >
                          Entregar
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
