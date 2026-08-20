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
    color: 'text-amber-700',
    bgLight: 'bg-amber-50/50',
    borderLight: 'border-amber-200/80',
    accentColor: 'bg-amber-500 text-white',
    icon: <Bell className="h-4 w-4 text-amber-600" />,
  },
  {
    id: 'PREPARING',
    title: 'Em Preparação',
    subtitle: 'A ser montado na copa/cozinha',
    color: 'text-purple-700',
    bgLight: 'bg-purple-50/50',
    borderLight: 'border-purple-200/80',
    accentColor: 'bg-purple-600 text-white',
    icon: <ChefHat className="h-4 w-4 text-purple-600" />,
  },
  {
    id: 'READY',
    title: 'Prontos p/ Entrega',
    subtitle: 'Pronto para servir à mesa/balcão',
    color: 'text-emerald-700',
    bgLight: 'bg-emerald-50/50',
    borderLight: 'border-emerald-200/80',
    accentColor: 'bg-emerald-600 text-white',
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
  },
  {
    id: 'PAID',
    title: 'Finalizados',
    subtitle: 'Entregues e com conta liquidada',
    color: 'text-zinc-700',
    bgLight: 'bg-zinc-50/60',
    borderLight: 'border-zinc-200/80',
    accentColor: 'bg-zinc-800 text-white',
    icon: <FileText className="h-4 w-4 text-zinc-600" />,
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-3 border-b border-purple-100">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black text-foreground tracking-tight">
              Gestão de Pedidos & Comandas
            </h1>
            <Badge className="bg-purple-100 text-purple-800 text-[10px] font-black uppercase">
              {currentTenant.name}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Arraste os cards com o rato entre as colunas para atualizar o fluxo de produção em tempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Busca rápida */}
          <div className="relative flex-1 md:w-60">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar mesa, nº, cliente..."
              className="pl-8 h-8.5 text-xs rounded-xl border-purple-200 bg-white"
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
            className="h-8.5 px-2.5 rounded-xl border-purple-200 text-purple-900 hover:bg-purple-50"
          >
            {soundEnabled ? <Volume2 className="h-3.5 w-3.5 text-purple-700" /> : <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />}
          </Button>

          {/* Botão de Atualizar */}
          <Button
            size="sm"
            variant="outline"
            onClick={loadOrders}
            className="h-8.5 text-xs font-bold gap-1.5 rounded-xl border-purple-200 hover:bg-purple-50 text-purple-950"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>

          {/* Botão + Nova Comanda */}
          <Button
            size="sm"
            onClick={() => setNewOrderModalOpen(true)}
            className="h-8.5 text-xs font-black bg-purple-700 hover:bg-purple-800 text-white gap-1.5 shadow-sm rounded-xl"
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
              className={`flex flex-col min-h-[620px] rounded-3xl border-2 transition-all p-3 space-y-3 ${
                isOver
                  ? 'border-purple-600 bg-purple-50/80 shadow-md ring-2 ring-purple-500/20'
                  : `${col.borderLight} ${col.bgLight}`
              }`}
            >
              {/* Header da Coluna */}
              <div className="flex items-center justify-between pb-2 border-b border-purple-100/70">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-white shadow-2xs">
                    {col.icon}
                  </div>
                  <div>
                    <h2 className={`text-xs font-black ${col.color}`}>
                      {col.title}
                    </h2>
                    <p className="text-[10px] text-muted-foreground line-clamp-1">
                      {col.subtitle}
                    </p>
                  </div>
                </div>

                <Badge className={`text-[10px] font-black px-2 py-0.5 rounded-full ${col.accentColor}`}>
                  {colOrders.length}
                </Badge>
              </div>

              {/* Lista de Cards da Coluna */}
              <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[720px] pr-1">
                {colOrders.length === 0 ? (
                  <div className="h-32 border-2 border-dashed border-purple-200/60 rounded-2xl flex flex-col items-center justify-center text-center p-3 text-muted-foreground/70">
                    <p className="text-xs font-bold">Sem pedidos aqui</p>
                    <p className="text-[10px] mt-0.5">Arraste um card para esta etapa</p>
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
                        className={`p-3.5 bg-white border border-purple-100/90 rounded-2xl shadow-2xs hover:shadow-md hover:border-purple-300 transition-all cursor-grab active:cursor-grabbing group relative select-none ${
                          isDraggingThis ? 'opacity-40 scale-95 border-purple-500' : ''
                        }`}
                      >
                        {/* Indicador de Arraste lateral sutil */}
                        <div className="flex items-center justify-between gap-2 pb-2 border-b border-purple-50">
                          <div className="flex items-center gap-1.5">
                            <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-purple-500 transition" />
                            <span className="font-black text-xs text-foreground">
                              #{order.orderNumber || 100}
                            </span>
                            {isTable ? (
                              <Badge className="bg-purple-700 text-white font-extrabold text-[9px] py-0 px-1.5 rounded-md">
                                {order.tableNumber}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[9px] font-bold border-purple-200 text-purple-900 py-0 px-1.5">
                                Balcão
                              </Badge>
                            )}
                          </div>

                          <div className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3 text-purple-500" />
                            <span>{elapsedMinutes}m</span>
                          </div>
                        </div>

                        {/* Cliente e Resumo de Itens */}
                        <div className="py-2 space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-bold text-foreground">
                            <span className="truncate flex items-center gap-1">
                              <User className="h-3 w-3 text-purple-600 flex-shrink-0" />
                              <span className="truncate">{order.customerName || 'Cliente na Mesa'}</span>
                            </span>
                          </div>

                          {/* Lista resumida de itens */}
                          <div className="bg-purple-50/40 p-2 rounded-xl text-[11px] text-purple-950 space-y-1">
                            {order.items && order.items.length > 0 ? (
                              order.items.slice(0, 2).map((item, i) => (
                                <div key={i} className="flex justify-between items-center truncate">
                                  <span className="truncate font-semibold">
                                    {item.containerEmoji || '🍨'} {item.containerName || item.container?.name || 'Açaí'}
                                  </span>
                                  <span className="font-bold text-purple-700 ml-1">
                                    {formatCurrency(item.lineTotal || 0)}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <div className="font-semibold">1x Açaí Personalizado</div>
                            )}
                            {order.items && order.items.length > 2 && (
                              <div className="text-[10px] text-muted-foreground font-medium">
                                +{order.items.length - 2} outro(s) item(ns)...
                              </div>
                            )}
                          </div>

                          {order.notes && (
                            <div className="text-[10px] text-amber-800 bg-amber-50 px-2 py-1 rounded-lg line-clamp-1 italic font-medium flex items-center gap-1">
                              <AlertCircle className="h-3 w-3 text-amber-600 flex-shrink-0" />
                              <span>{order.notes}</span>
                            </div>
                          )}
                        </div>

                        {/* Rodapé do Card: Total e Status de Pagamento */}
                        <div className="pt-2 border-t border-purple-50 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-muted-foreground block">Total</span>
                            <span className="text-xs font-black text-purple-900 font-mono">
                              {formatCurrency(order.total || order.totalAmount || 0)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {order.paymentStatus === 'PAID' ? (
                              <Badge className="bg-emerald-600 text-white font-black text-[9px] py-0.5 px-2 rounded-md shadow-2xs border-0">
                                ✓ PAGO
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-500 text-white font-black text-[9px] py-0.5 px-2 rounded-md shadow-2xs border-0">
                                AGUARDANDO PGTO
                              </Badge>
                            )}
                            <span className="text-[10px] text-purple-700 font-bold group-hover:underline">
                              ›
                            </span>
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
