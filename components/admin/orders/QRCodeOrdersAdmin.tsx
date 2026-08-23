'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Order, OrderStatus } from '@/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/i18n/formatters'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/stores/authStore'
import { useFranchiseStore } from '@/lib/stores/franchiseStore'
import {
  Smartphone,
  Clock,
  CheckCircle2,
  ChefHat,
  Bell,
  RefreshCw,
  Plus,
  Search,
  Volume2,
  VolumeX,
  User,
  GripVertical,
  SlidersHorizontal,
  FileText,
  AlertCircle,
} from 'lucide-react'

import { playOrderNotificationSound } from '@/lib/utils/soundNotification'
import OrderHistoryAuditModal from './OrderHistoryAuditModal'
import OrderEditDialog from './OrderEditDialog'
import NewOrderManualModal from './NewOrderManualModal'
import SafeConfirmDialog from './SafeConfirmDialog'

interface QRCodeOrdersAdminProps {
  tenantId: string
}

interface KanbanColumn {
  id: OrderStatus
  title: string
  subtitle: string
  color: string
  bgLight: string
  borderLight: string
  accentColor: string
  icon: React.ReactNode
}

const KANBAN_COLUMNS: KanbanColumn[] = [
  {
    id: 'NEW',
    title: 'Novos Pedidos',
    subtitle: 'Comandas a aguardar aceitação',
    color: 'text-amber-950 dark:text-white',
    bgLight: 'bg-amber-500/10 dark:bg-amber-950/25 backdrop-blur-md',
    borderLight: 'border-amber-300 dark:border-amber-500/40',
    accentColor: 'bg-amber-500 text-black font-black',
    icon: <Bell className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
  },
  {
    id: 'PREPARING',
    title: 'Em Preparação',
    subtitle: 'A ser montado na copa/cozinha',
    color: 'text-purple-950 dark:text-white',
    bgLight: 'bg-purple-500/10 dark:bg-purple-950/30 backdrop-blur-md',
    borderLight: 'border-purple-300 dark:border-purple-500/40',
    accentColor: 'bg-purple-700 dark:bg-fuchsia-600 text-white font-black',
    icon: <ChefHat className="h-4 w-4 text-purple-700 dark:text-fuchsia-400" />,
  },
  {
    id: 'READY',
    title: 'Prontos p/ Entrega',
    subtitle: 'Pronto para servir à mesa/balcão',
    color: 'text-emerald-950 dark:text-white',
    bgLight: 'bg-emerald-500/10 dark:bg-emerald-950/25 backdrop-blur-md',
    borderLight: 'border-emerald-300 dark:border-emerald-500/40',
    accentColor: 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-black font-black',
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
  },
  {
    id: 'PAID',
    title: 'Finalizados',
    subtitle: 'Entregues e com conta liquidada',
    color: 'text-slate-900 dark:text-white',
    bgLight: 'bg-slate-500/10 dark:bg-white/[0.04] backdrop-blur-md',
    borderLight: 'border-slate-300 dark:border-white/20',
    accentColor: 'bg-slate-700 dark:bg-zinc-700 text-white font-black',
    icon: <FileText className="h-4 w-4 text-slate-700 dark:text-zinc-300" />,
  },
]

export default function QRCodeOrdersAdmin({ tenantId }: QRCodeOrdersAdminProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [prevCount, setPrevCount] = useState(0)

  // Drag and Drop state
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<OrderStatus | null>(null)

  // Modal states
  const [selectedOrderForAudit, setSelectedOrderForAudit] = useState<Order | null>(null)
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState<Order | null>(null)
  const [newOrderModalOpen, setNewOrderModalOpen] = useState(false)
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null)
  const [cancelLoading, setCancelLoading] = useState(false)

  const { authFetch } = useAuthStore()
  const { currentTenant } = useFranchiseStore()

  const loadOrders = useCallback(async () => {
    try {
      const res = await authFetch(`/api/orders?tenantId=${encodeURIComponent(tenantId)}`)
      const data = await res.json()
      if (data.orders) {
        const newOrders: Order[] = data.orders
        const newCount = newOrders.filter((o) => o.status === 'NEW' || !o.status).length
        if (newCount > prevCount && prevCount > 0 && soundEnabled) {
          playOrderNotificationSound()
          toast.info('🔔 Novo pedido recebido via QR Code!')
        }
        setPrevCount(newCount)
        setOrders(newOrders)
      }
    } catch {
      toast.error('Erro ao carregar pedidos')
    } finally {
      setLoading(false)
    }
  }, [tenantId, authFetch, prevCount, soundEnabled])

  useEffect(() => {
    loadOrders()
    const interval = setInterval(loadOrders, 8000)
    return () => clearInterval(interval)
  }, [loadOrders])

  // Atualização de Status rápida
  const updateOrderStatus = async (
    orderId: string,
    status: OrderStatus,
    paymentStatus?: 'PAID' | 'PENDING'
  ) => {
    try {
      const res = await authFetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        body: JSON.stringify({
          status,
          ...(paymentStatus ? { paymentStatus } : {}),
        }),
      })
      if (!res.ok) throw new Error('Falha ao atualizar pedido')
      
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status, ...(paymentStatus ? { paymentStatus } : {}) }
            : o
        )
      )
      toast.success(`Comanda movida para: ${status}`)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar comanda')
    }
  }

  // Criação de pedido manual
  const handleCreateOrder = async (payload: any) => {
    const res = await authFetch('/api/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error('Erro ao criar comanda manual')
    loadOrders()
  }

  // Edição completa de pedido
  const handleSaveEditedOrder = async (orderId: string, updatedData: Partial<Order>) => {
    const res = await authFetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify(updatedData),
    })
    if (!res.ok) throw new Error('Erro ao salvar alterações do pedido')
    loadOrders()
  }

  // Cancelamento seguro de pedido
  const handleConfirmCancel = async () => {
    if (!orderToCancel) return
    setCancelLoading(true)
    try {
      const res = await authFetch(`/api/orders/${orderToCancel.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Erro ao cancelar comanda')
      toast.success(`Comanda #${orderToCancel.orderNumber || 100} cancelada`)
      setCancelConfirmOpen(false)
      setSelectedOrderForAudit(null)
      loadOrders()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao cancelar comanda')
    } finally {
      setCancelLoading(false)
    }
  }

  // --- Handlers de Drag and Drop (Mouse) ---
  const handleDragStart = (e: React.DragEvent, order: Order) => {
    setDraggedOrderId(order.id)
    e.dataTransfer.setData('text/plain', order.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, colStatus: OrderStatus) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverColumn !== colStatus) {
      setDragOverColumn(colStatus)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, targetStatus: OrderStatus) => {
    e.preventDefault()
    const orderId = e.dataTransfer.getData('text/plain') || draggedOrderId
    setDraggedOrderId(null)
    setDragOverColumn(null)

    if (!orderId) return
    const order = orders.find((o) => o.id === orderId)
    if (order && order.status !== targetStatus) {
      const paymentStatus: 'PAID' | 'PENDING' =
        targetStatus === 'PAID'
          ? 'PAID'
          : order.paymentStatus === 'PAID'
          ? 'PAID'
          : 'PENDING'
      await updateOrderStatus(orderId, targetStatus, paymentStatus)
    }
  }

  // Filtro de pesquisa
  const filteredOrders = orders.filter((o) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    const matchNumber = String(o.orderNumber || '').includes(q)
    const matchTable = (o.tableNumber || '').toLowerCase().includes(q)
    const matchCustomer = (o.customerName || '').toLowerCase().includes(q)
    return matchNumber || matchTable || matchCustomer
  })

  // Agrupamento por coluna Kanban
  const getOrdersForColumn = (status: OrderStatus) => {
    return filteredOrders.filter((o) => {
      if (status === 'NEW') return o.status === 'NEW' || !o.status
      return o.status === status
    })
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-4">
      {/* 1. Header Minimalista & Painel de Ações */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-3 border-b border-purple-100 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-black text-purple-950 dark:text-white tracking-tight">
              Gestão de Pedidos & Comandas
            </h1>
            <Badge className="bg-purple-100 dark:bg-pink-500/20 text-purple-800 dark:text-pink-300 border border-purple-200 dark:border-pink-500/30 text-[10px] font-black uppercase">
              {currentTenant.name}
            </Badge>
          </div>
          <p className="text-xs text-purple-700/80 dark:text-purple-200/70 mt-0.5">
            Arraste os cards com o rato entre as colunas para atualizar o fluxo de produção em tempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Busca rápida */}
          <div className="relative flex-1 md:w-60">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-purple-400 dark:text-purple-300/60" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar mesa, nº, cliente..."
              className="pl-8 h-9 text-xs rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/10 text-purple-950 dark:text-white placeholder:text-purple-400 dark:placeholder:text-purple-300/40 focus:border-purple-600 dark:focus:border-pink-500"
            />
          </div>

          {/* Toggle de Som */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setSoundEnabled(!soundEnabled)
              toast.info(soundEnabled ? 'Alertas sonoros desativados' : 'Alertas sonoros ativados')
            }}
            title={soundEnabled ? 'Silenciar alertas' : 'Ativar alertas sonoros'}
            className="h-9 px-3 rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-purple-800 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="h-3.5 w-3.5 text-purple-700 dark:text-pink-400" /> : <VolumeX className="h-3.5 w-3.5 text-purple-400 dark:text-purple-400/60" />}
          </Button>

          {/* Botão de Atualizar */}
          <Button
            size="sm"
            variant="outline"
            onClick={loadOrders}
            className="h-9 text-xs font-bold gap-1.5 rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-purple-800 dark:text-purple-100 hover:text-purple-950 dark:hover:text-white cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>

          {/* Botão + Nova Comanda */}
          <Button
            size="sm"
            onClick={() => setNewOrderModalOpen(true)}
            className="h-9 text-xs font-black bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 hover:from-purple-800 hover:to-pink-700 dark:hover:from-pink-500 dark:hover:to-purple-500 text-white gap-1.5 shadow-md shadow-purple-700/20 dark:shadow-pink-600/30 rounded-xl cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nova Comanda</span>
          </Button>
        </div>
      </div>

      {/* 2. Colunas do Kanban com Drag & Drop */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {KANBAN_COLUMNS.map((col) => {
          const colOrders = getOrdersForColumn(col.id)
          const isOver = dragOverColumn === col.id

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`flex flex-col min-h-[620px] rounded-3xl border transition-all p-3.5 space-y-3 ${
                isOver
                  ? 'border-purple-600 dark:border-pink-500 bg-purple-100/50 dark:bg-pink-950/40 shadow-xl ring-2 ring-purple-500/30 dark:ring-pink-500/30'
                  : `${col.borderLight} ${col.bgLight}`
              }`}
            >
              {/* Header da Coluna */}
              <div className="flex items-center justify-between pb-2.5 border-b border-purple-200/60 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-white/70 dark:bg-white/10 shadow-xs">
                    {col.icon}
                  </div>
                  <div>
                    <h2 className={`text-xs font-black ${col.color}`}>
                      {col.title}
                    </h2>
                    <p className="text-[10px] text-purple-800/80 dark:text-purple-100 font-semibold line-clamp-1">
                      {col.subtitle}
                    </p>
                  </div>
                </div>

                <Badge className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${col.accentColor}`}>
                  {colOrders.length}
                </Badge>
              </div>

              {/* Lista de Cards da Coluna */}
              <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[720px] pr-1">
                {colOrders.length === 0 ? (
                  <div className="h-32 border border-dashed border-purple-200 dark:border-white/20 rounded-2xl flex flex-col items-center justify-center text-center p-3 text-purple-700 dark:text-purple-200">
                    <p className="text-xs font-bold text-purple-950 dark:text-white">Sem pedidos aqui</p>
                    <p className="text-[10px] mt-0.5 text-purple-700/80 dark:text-purple-200/80">Arraste um card para esta etapa</p>
                  </div>
                ) : (
                  colOrders.map((order) => {
                    const isTable = order.isTableOrder !== false && !!order.tableNumber
                    const elapsedMinutes = Math.max(
                       0,
                       Math.floor((Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60))
                    )
                    const isDraggingThis = draggedOrderId === order.id

                    return (
                      <Card
                        key={order.id}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, order)}
                        onClick={() => setSelectedOrderForAudit(order)}
                        className={`p-3.5 bg-white dark:bg-[#18022b]/95 border border-purple-150 dark:border-white/15 rounded-2xl shadow-xs dark:shadow-lg hover:shadow-md hover:border-purple-400 dark:hover:border-pink-500/50 transition-all cursor-grab active:cursor-grabbing group relative select-none text-slate-900 dark:text-white ${
                          isDraggingThis ? 'opacity-40 scale-95 border-purple-600 dark:border-pink-500' : ''
                        }`}
                      >
                        {/* Indicador de Arraste lateral sutil */}
                        <div className="flex items-center justify-between gap-2 pb-2 border-b border-purple-100 dark:border-white/10">
                          <div className="flex items-center gap-1.5">
                            <GripVertical className="h-3.5 w-3.5 text-purple-400/60 dark:text-purple-400/40 group-hover:text-purple-700 dark:group-hover:text-pink-400 transition" />
                            <span className="font-black text-xs text-purple-950 dark:text-white">
                              #{order.orderNumber || 100}
                            </span>
                            {isTable ? (
                              <Badge className="bg-purple-700 dark:bg-pink-600 text-white font-extrabold text-[9px] py-0 px-1.5 rounded-md border-0">
                                {order.tableNumber}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[9px] font-bold border-purple-200 dark:border-white/20 text-purple-800 dark:text-purple-200 py-0 px-1.5">
                                Balcão
                              </Badge>
                            )}
                          </div>

                          <div className="text-[10px] font-bold text-purple-600 dark:text-purple-300/80 flex items-center gap-1">
                            <Clock className="h-3 w-3 text-purple-700 dark:text-pink-400" />
                            <span>{elapsedMinutes}m</span>
                          </div>
                        </div>

                        {/* Cliente e Resumo de Itens */}
                        <div className="py-2 space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-bold text-purple-950 dark:text-white">
                            <span className="truncate flex items-center gap-1">
                              <User className="h-3 w-3 text-purple-700 dark:text-pink-400 flex-shrink-0" />
                              <span className="truncate">{order.customerName || 'Cliente na Mesa'}</span>
                            </span>
                          </div>

                          {/* Lista resumida de itens */}
                          <div className="bg-purple-50/60 dark:bg-white/5 border border-purple-100 dark:border-white/10 p-2.5 rounded-xl text-[11px] text-purple-950 dark:text-purple-100 space-y-1">
                            {order.items && order.items.length > 0 ? (
                              order.items.slice(0, 2).map((item, i) => (
                                <div key={i} className="flex justify-between items-center truncate">
                                  <span className="truncate font-semibold">
                                    {item.containerEmoji || '🍨'} {item.containerName || item.container?.name || 'Açaí'}
                                  </span>
                                  <span className="font-bold text-purple-700 dark:text-pink-300 ml-1">
                                    {formatCurrency(item.lineTotal || 0)}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <div className="font-semibold">1x Açaí Personalizado</div>
                            )}
                            {order.items && order.items.length > 2 && (
                              <div className="text-[10px] text-purple-600/70 dark:text-purple-300/60 font-medium">
                                +{order.items.length - 2} outro(s) item(ns)...
                              </div>
                            )}
                          </div>

                          {order.notes && (
                            <div className="text-[10px] text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/25 px-2 py-1 rounded-lg line-clamp-1 italic font-medium flex items-center gap-1">
                              <AlertCircle className="h-3 w-3 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                              <span>{order.notes}</span>
                            </div>
                          )}
                        </div>

                        {/* Rodapé do Card: Total e Status de Pagamento */}
                        <div className="pt-2 border-t border-purple-100 dark:border-white/10 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-purple-600/70 dark:text-purple-300/60 block">Total</span>
                            <span className="text-xs font-black text-purple-950 dark:text-white font-mono">
                              {formatCurrency(order.total || order.totalAmount || 0)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {order.paymentStatus === 'PAID' ? (
                              <Badge className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 font-black text-[9px] py-0.5 px-2 rounded-md">
                                ✓ PAGO
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 font-black text-[9px] py-0.5 px-2 rounded-md">
                                AGUARDANDO PGTO
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Card>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* 3. Modal de Histórico e Auditoria do Pedido (Ao Clicar no Card) */}
      <OrderHistoryAuditModal
        order={selectedOrderForAudit}
        open={!!selectedOrderForAudit}
        onOpenChange={(open) => {
          if (!open) setSelectedOrderForAudit(null)
        }}
        onUpdateStatus={updateOrderStatus}
        onEditOrder={(order) => {
          setSelectedOrderForAudit(null)
          setSelectedOrderForEdit(order)
        }}
        onRequestCancel={(order) => {
          setOrderToCancel(order)
          setCancelConfirmOpen(true)
        }}
      />

      {/* 4. Modal de Edição Completa da Comanda */}
      <OrderEditDialog
        order={selectedOrderForEdit}
        open={!!selectedOrderForEdit}
        onOpenChange={(open) => {
          if (!open) setSelectedOrderForEdit(null)
        }}
        onSave={handleSaveEditedOrder}
      />

      {/* 5. Modal de Abertura de Nova Comanda Manual */}
      <NewOrderManualModal
        tenantId={tenantId}
        open={newOrderModalOpen}
        onOpenChange={setNewOrderModalOpen}
        onCreateOrder={handleCreateOrder}
      />

      {/* 6. Modal de Confirmação Seguro para Cancelamento */}
      <SafeConfirmDialog
        open={cancelConfirmOpen}
        onOpenChange={setCancelConfirmOpen}
        title="Cancelar Comanda Definitivamente?"
        description={`Tem a certeza que deseja cancelar a comanda #${orderToCancel?.orderNumber || 100}? Esta ação não poderá ser desfeita e o pedido será removido do painel ativo.`}
        confirmText="Sim, Cancelar Comanda"
        cancelText="Voltar"
        variant="danger"
        loading={cancelLoading}
        onConfirm={handleConfirmCancel}
      />
    </div>
  )
}
