'use client'

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Bell, BellOff, Volume2, VolumeX, Check, Clock, UtensilsCrossed, ShoppingBag, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/i18n/formatters'
import { AppViewId } from '@/components/layout/AppSidebar'

interface WaiterCallItem {
  id: string
  tenantId: string
  tableLabel: string
  reason: string
  status: string
  createdAt: string
}

interface StoreOrderItem {
  id: string
  orderNumber?: number | string
  ticketNumber?: number | string
  customerName?: string
  tableNumber?: string | number | null
  orderType?: string
  status: string
  paymentStatus?: string
  total?: number
  createdAt?: string
  items?: any[]
}

interface StoreNotificationCenterProps {
  tenantId: string
  storeName: string
  onNavigate: (view: AppViewId) => void
}

type NotificationTab = 'ALL' | 'CALLS' | 'ORDERS'

function formatRelativeTime(iso?: string): string {
  if (!iso) return 'agora'
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (diffSec < 60) return 'agora'
  const mins = Math.floor(diffSec / 60)
  if (mins < 60) return `há ${mins} min`
  const hours = Math.floor(mins / 60)
  return `há ${hours}h`
}

function getOrderStatusMeta(status: string): { label: string; className: string } {
  const s = (status || '').toUpperCase()
  if (s === 'NEW' || s === 'OPEN') {
    return {
      label: 'Novo',
      className: 'bg-pink-100 text-pink-800 dark:bg-pink-500/20 dark:text-pink-200 border-pink-200 dark:border-pink-500/30',
    }
  }
  if (s === 'PREPARING') {
    return {
      label: 'Em Preparação',
      className: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200 border-amber-200 dark:border-amber-500/30',
    }
  }
  if (s === 'READY') {
    return {
      label: 'Pronto',
      className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200 border-emerald-200 dark:border-emerald-500/30',
    }
  }
  if (s === 'AWAITING_PAYMENT') {
    return {
      label: 'Aguard. Pagamento',
      className: 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-200 border-purple-200 dark:border-purple-500/30',
    }
  }
  return {
    label: status || 'Ativo',
    className: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200 border-slate-200 dark:border-white/15',
  }
}

export default function StoreNotificationCenter({
  tenantId,
  storeName,
  onNavigate,
}: StoreNotificationCenterProps) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<NotificationTab>('ALL')
  const [calls, setCalls] = useState<WaiterCallItem[]>([])
  const [orders, setOrders] = useState<StoreOrderItem[]>([])
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true)
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>('unsupported')

  const containerRef = useRef<HTMLDivElement | null>(null)
  const seenCallIdsRef = useRef<Set<string> | null>(null)
  const seenOrderIdsRef = useRef<Set<string> | null>(null)
  const soundEnabledRef = useRef<boolean>(true)

  useEffect(() => {
    soundEnabledRef.current = soundEnabled
  }, [soundEnabled])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const savedSound = localStorage.getItem('acaidarose_notif_sound')
    if (savedSound === 'off') {
      setSoundEnabled(false)
      soundEnabledRef.current = false
    }
    if ('Notification' in window) {
      setNotifPermission(Notification.permission)
    }
  }, [])

  // Reset tracking when switching active store
  useEffect(() => {
    seenCallIdsRef.current = null
    seenOrderIdsRef.current = null
    setCalls([])
    setOrders([])
  }, [tenantId])

  // Close popover on click outside or Escape
  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const playChime = useCallback((type: 'CALL' | 'ORDER') => {
    if (!soundEnabledRef.current || typeof window === 'undefined') return
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      const playTone = (freq: number, start: number, dur: number) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start)
        gain.gain.setValueAtTime(0.16, ctx.currentTime + start)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(ctx.currentTime + start)
        osc.stop(ctx.currentTime + start + dur)
      }
      if (type === 'CALL') {
        playTone(880, 0, 0.16)
        playTone(1174.66, 0.18, 0.26)
      } else {
        playTone(659.25, 0, 0.14)
        playTone(987.77, 0.16, 0.22)
      }
    } catch {
      // Ignora bloqueio de autoplay antes de interação
    }
  }, [])

  const fireBrowserNotification = useCallback((title: string, body: string) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, { body, icon: '/favicon.png' })
      } catch {}
    }
  }, [])

  const requestPushPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    try {
      const perm = await Notification.requestPermission()
      setNotifPermission(perm)
      if (perm === 'granted') {
        toast.success('Notificações do navegador ativadas para esta loja.')
      } else {
        toast.info('Permissão de notificações não concedida no navegador.')
      }
    } catch {}
  }

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev
      if (typeof window !== 'undefined') {
        localStorage.setItem('acaidarose_notif_sound', next ? 'on' : 'off')
      }
      return next
    })
  }

  const fetchNotifications = useCallback(async () => {
    if (!tenantId) return
    try {
      const [resCalls, resOrders] = await Promise.all([
        fetch(`/api/call-waiter?tenantId=${encodeURIComponent(tenantId)}`, { cache: 'no-store' }),
        fetch(`/api/orders?tenantId=${encodeURIComponent(tenantId)}`, { cache: 'no-store' }),
      ])

      const [dataCalls, dataOrders] = await Promise.all([
        resCalls.ok ? resCalls.json() : { calls: [] },
        resOrders.ok ? resOrders.json() : { orders: [] },
      ])

      const incomingCalls: WaiterCallItem[] = Array.isArray(dataCalls?.calls) ? dataCalls.calls : []
      setCalls(incomingCalls)

      if (seenCallIdsRef.current === null) {
        seenCallIdsRef.current = new Set(incomingCalls.map((c) => String(c.id)))
      } else {
        const freshCalls = incomingCalls.filter((c) => !seenCallIdsRef.current!.has(String(c.id)))
        for (const fc of freshCalls) {
          seenCallIdsRef.current.add(String(fc.id))
          playChime('CALL')
          const label = fc.tableLabel || 'Balcão'
          const reason = fc.reason || 'Atendimento'
          toast.warning(`Chamado — ${label}: ${reason}`, { duration: 7000 })
          fireBrowserNotification(`Chamado (${storeName}) — ${label}`, reason)
        }
      }

      const rawOrders: StoreOrderItem[] = Array.isArray(dataOrders?.orders) ? dataOrders.orders : []
      const activeOrders = rawOrders
        .filter((o) => {
          const st = String(o.status || '').toUpperCase()
          return st === 'NEW' || st === 'OPEN' || st === 'PREPARING' || st === 'READY' || st === 'AWAITING_PAYMENT'
        })
        .sort((a, b) => {
          const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0
          return tb - ta
        })
        .slice(0, 25)

      setOrders(activeOrders)

      if (seenOrderIdsRef.current === null) {
        seenOrderIdsRef.current = new Set(activeOrders.map((o) => String(o.id)))
      } else {
        const freshOrders = activeOrders.filter((o) => !seenOrderIdsRef.current!.has(String(o.id)))
        for (const fo of freshOrders) {
          seenOrderIdsRef.current.add(String(fo.id))
          playChime('ORDER')
          const ticket = fo.ticketNumber || fo.orderNumber || String(fo.id).slice(0, 4)
          const origin = fo.tableNumber ? `Mesa ${String(fo.tableNumber).replace(/^Mesa\s*/i, '')}` : 'Balcão'
          const customer = fo.customerName ? ` • ${fo.customerName}` : ''
          toast.info(`Novo Pedido #${ticket} (${origin}${customer})`, { duration: 6000 })
          fireBrowserNotification(
            `Novo Pedido #${ticket} — ${storeName}`,
            `${origin}${customer} · ${formatCurrency(Number(fo.total) || 0)}`
          )
        }
      }
    } catch {
      // Falha silenciosa em polling
    }
  }, [tenantId, storeName, playChime, fireBrowserNotification])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 4000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const handleResolveCall = async (callId: string) => {
    setResolvingId(callId)
    try {
      const res = await fetch('/api/call-waiter', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId, status: 'RESOLVED' }),
      })
      if (!res.ok) throw new Error('Falha ao atualizar')
      setCalls((prev) => prev.filter((c) => c.id !== callId))
      toast.success('Chamado marcado como atendido.')
    } catch {
      toast.error('Não foi possível atender o chamado.')
    } finally {
      setResolvingId(null)
    }
  }

  const totalCount = calls.length + orders.length
  const hasCalls = calls.length > 0

  const visibleCalls = useMemo(() => (activeTab === 'ORDERS' ? [] : calls), [activeTab, calls])
  const visibleOrders = useMemo(() => (activeTab === 'CALLS' ? [] : orders), [activeTab, orders])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Central de Notificações"
        className={`relative h-8 px-2.5 sm:px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
          hasCalls
            ? 'border-pink-400 dark:border-pink-500/60 bg-pink-50 dark:bg-pink-500/15 text-pink-900 dark:text-pink-200 hover:bg-pink-100 dark:hover:bg-pink-500/25'
            : 'border-purple-200 dark:border-white/15 bg-purple-50/70 dark:bg-white/5 text-purple-900 dark:text-purple-100 hover:bg-purple-100 dark:hover:bg-white/10'
        }`}
      >
        <span className="relative flex items-center">
          <Bell className={`h-3.5 w-3.5 ${hasCalls ? 'text-pink-600 dark:text-pink-400' : 'text-purple-700 dark:text-purple-300'}`} />
          {hasCalls && (
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-pink-500 animate-ping" />
          )}
        </span>
        <span className="hidden sm:inline">Notificações</span>
        {totalCount > 0 && (
          <span
            className={`ml-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black flex items-center justify-center ${
              hasCalls
                ? 'bg-pink-600 text-white'
                : 'bg-purple-700 dark:bg-purple-500 text-white'
            }`}
          >
            {totalCount > 99 ? '99+' : totalCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[340px] sm:w-[400px] rounded-2xl border border-purple-200/80 dark:border-white/15 bg-white dark:bg-[#19032e] shadow-2xl z-50 overflow-hidden">
          {/* Cabeçalho da Central */}
          <div className="px-4 py-3 border-b border-purple-100 dark:border-white/10 flex items-center justify-between gap-2 bg-purple-50/50 dark:bg-white/[0.03]">
            <div className="min-w-0">
              <p className="text-sm font-black text-purple-950 dark:text-white leading-tight">
                Central de Notificações
              </p>
              <p className="text-[11px] text-purple-700/80 dark:text-purple-300/75 truncate">
                {storeName}
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {notifPermission === 'default' && (
                <button
                  type="button"
                  onClick={requestPushPermission}
                  className="h-7 px-2 rounded-lg border border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 text-[11px] font-bold text-purple-800 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-white/10 cursor-pointer"
                  title="Ativar notificações no navegador"
                >
                  Ativar Push
                </button>
              )}
              <button
                type="button"
                onClick={toggleSound}
                className="h-7 w-7 rounded-lg border border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 flex items-center justify-center text-purple-700 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-white/10 cursor-pointer"
                title={soundEnabled ? 'Silenciar alerta sonoro' : 'Ativar alerta sonoro'}
                aria-label={soundEnabled ? 'Silenciar alerta sonoro' : 'Ativar alerta sonoro'}
              >
                {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5 text-slate-400" />}
              </button>
            </div>
          </div>

          {/* Abas de Filtro */}
          <div className="px-3 py-2 border-b border-purple-100 dark:border-white/10 flex items-center gap-1.5 bg-white dark:bg-[#19032e]">
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-purple-700 text-white'
                  : 'text-purple-800 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-white/10'
              }`}
            >
              Tudo ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('CALLS')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'CALLS'
                  ? 'bg-pink-600 text-white'
                  : 'text-purple-800 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-white/10'
              }`}
            >
              Chamados ({calls.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ORDERS')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'ORDERS'
                  ? 'bg-purple-700 text-white'
                  : 'text-purple-800 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-white/10'
              }`}
            >
              Pedidos ({orders.length})
            </button>
          </div>

          {/* Lista de Notificações */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-purple-100/80 dark:divide-white/10">
            {visibleCalls.length === 0 && visibleOrders.length === 0 ? (
              <div className="py-10 px-6 text-center">
                <BellOff className="h-7 w-7 mx-auto text-purple-300 dark:text-purple-500/50 mb-2" />
                <p className="text-xs font-bold text-purple-950 dark:text-white">
                  Sem alertas pendentes nesta loja
                </p>
                <p className="text-[11px] text-purple-700/70 dark:text-purple-300/60 mt-0.5">
                  Novos chamados de mesa/balcão e pedidos aparecem aqui em tempo real.
                </p>
              </div>
            ) : (
              <>
                {/* Secção de Chamados */}
                {visibleCalls.length > 0 && (
                  <div>
                    <div className="px-4 py-1.5 bg-pink-50/70 dark:bg-pink-500/10 text-[10px] font-black uppercase tracking-wider text-pink-700 dark:text-pink-300">
                      Chamados de Atendimento ({visibleCalls.length})
                    </div>
                    <div className="divide-y divide-purple-100/70 dark:divide-white/5">
                      {visibleCalls.map((call) => (
                        <div
                          key={call.id}
                          className="px-4 py-3 flex items-start justify-between gap-3 hover:bg-pink-50/40 dark:hover:bg-white/[0.03] transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 text-xs font-black text-pink-700 dark:text-pink-300">
                                <UtensilsCrossed className="h-3.5 w-3.5 shrink-0" />
                                {call.tableLabel || 'Balcão'}
                              </span>
                              <span className="text-[10px] text-slate-500 dark:text-purple-300/70 flex items-center gap-0.5">
                                <Clock className="h-2.5 w-2.5" />
                                {formatRelativeTime(call.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs text-slate-700 dark:text-purple-100 mt-0.5 break-words">
                              {call.reason || 'Solicitou atendimento'}
                            </p>
                          </div>

                          <button
                            type="button"
                            disabled={resolvingId === call.id}
                            onClick={() => handleResolveCall(call.id)}
                            className="shrink-0 h-7 px-2.5 rounded-lg bg-pink-600 hover:bg-pink-700 disabled:opacity-60 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="h-3 w-3" />
                            Atender
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Secção de Pedidos Ativos */}
                {visibleOrders.length > 0 && (
                  <div>
                    <div className="px-4 py-1.5 bg-purple-50/70 dark:bg-purple-500/10 text-[10px] font-black uppercase tracking-wider text-purple-800 dark:text-purple-300">
                      Pedidos em Curso ({visibleOrders.length})
                    </div>
                    <div className="divide-y divide-purple-100/70 dark:divide-white/5">
                      {visibleOrders.map((order) => {
                        const statusMeta = getOrderStatusMeta(order.status)
                        const ticket = order.ticketNumber || order.orderNumber || String(order.id).slice(0, 4)
                        const origin = order.tableNumber
                          ? `Mesa ${String(order.tableNumber).replace(/^Mesa\s*/i, '')}`
                          : 'Balcão'
                        const itemsCount = Array.isArray(order.items) ? order.items.length : 0

                        return (
                          <button
                            key={order.id}
                            type="button"
                            onClick={() => {
                              setOpen(false)
                              onNavigate('qrcode')
                            }}
                            className="w-full text-left px-4 py-3 flex items-start justify-between gap-3 hover:bg-purple-50/50 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="inline-flex items-center gap-1 text-xs font-black text-purple-950 dark:text-white">
                                  <ShoppingBag className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                                  #{ticket} · {origin}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded-md border text-[10px] font-bold ${statusMeta.className}`}>
                                  {statusMeta.label}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-purple-200/80 mt-0.5 truncate">
                                {order.customerName ? `${order.customerName} · ` : ''}
                                {itemsCount > 0 ? `${itemsCount} ${itemsCount === 1 ? 'item' : 'itens'}` : 'Pedido ativo'}
                              </p>
                            </div>

                            <div className="text-right shrink-0">
                              <p className="text-xs font-black text-purple-950 dark:text-white font-mono">
                                {formatCurrency(Number(order.total) || 0)}
                              </p>
                              <p className="text-[10px] text-slate-500 dark:text-purple-300/70">
                                {formatRelativeTime(order.createdAt)}
                              </p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Rodapé de Navegação Rápida */}
          <div className="px-3 py-2.5 border-t border-purple-100 dark:border-white/10 bg-purple-50/40 dark:bg-white/[0.02] flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onNavigate('pdv')
              }}
              className="flex-1 h-8 px-2.5 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-[11px] font-bold text-purple-900 dark:text-purple-100 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>PDV Mesas & Balcão</span>
              <ExternalLink className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onNavigate('qrcode')
              }}
              className="flex-1 h-8 px-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Pedidos & KDS</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
