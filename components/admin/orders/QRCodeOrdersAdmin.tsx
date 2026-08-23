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
  Printer,
  Store,
  Layers,
  XCircle,
  Trash2,
} from 'lucide-react'

import { playOrderNotificationSound } from '@/lib/utils/soundNotification'
import OrderHistoryAuditModal from './OrderHistoryAuditModal'
import OrderEditDialog from './OrderEditDialog'
import NewOrderManualModal from './NewOrderManualModal'
import CancelReasonDialog from './CancelReasonDialog'
import OrderItemsModal from './OrderItemsModal'

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
    subtitle: 'Aguardando aceitação / preparo',
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
  {
    id: 'CANCELLED',
    title: 'Cancelados',
    subtitle: 'Comandas estornadas / canceladas',
    color: 'text-red-950 dark:text-red-300',
    bgLight: 'bg-red-500/10 dark:bg-red-950/25 backdrop-blur-md',
    borderLight: 'border-red-300 dark:border-red-500/40',
    accentColor: 'bg-red-600 dark:bg-red-700 text-white font-black',
    icon: <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />,
  },
]

export default function QRCodeOrdersAdmin({ tenantId }: QRCodeOrdersAdminProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [originFilter, setOriginFilter] = useState<'ALL' | 'TABLES' | 'COUNTER'>('ALL')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [prevCount, setPrevCount] = useState(0)

  // Drag and Drop state
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<OrderStatus | null>(null)

  // Modal states
  const [selectedOrderForAudit, setSelectedOrderForAudit] = useState<Order | null>(null)
  const [selectedOrderForItems, setSelectedOrderForItems] = useState<Order | null>(null)
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
          toast.info('Novo pedido recebido via QR Code!')
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

  // Cancelamento seguro de pedido com motivo para auditoria
  const handleConfirmCancel = async (orderId: string, reason: string) => {
    setCancelLoading(true)
    try {
      const res = await authFetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      if (!res.ok) throw new Error('Erro ao cancelar comanda')
      toast.success(`Comanda #${orderToCancel?.orderNumber || 100} cancelada: ${reason}`)
      setCancelConfirmOpen(false)
      setSelectedOrderForAudit(null)
      loadOrders()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao cancelar comanda')
    } finally {
      setCancelLoading(false)
    }
  }

  // Impressão da comanda de montagem
  const handlePrintOrder = (e: React.MouseEvent | null, order: Order) => {
    if (e) e.stopPropagation()
    if (order.paymentStatus !== 'PAID') {
      toast.error('O pedido precisa ser pago antes de emitir a comanda de produção.')
      return
    }
    window.print()
    toast.success(`Comanda #${order.orderNumber || 100} enviada para a impressora térmica!`)
  }

  // Exclusão definitiva de comanda / pedido de teste
  const handleDeleteOrderPermanently = async (order: Order) => {
    if (!confirm(`Deseja excluir a Comanda #${order.orderNumber || ''} de "${order.customerName || 'Cliente'}"?`)) return
    try {
      const res = await authFetch(`/api/orders/${order.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Exclusão direta pelo operador' }),
      })
      if (!res.ok) throw new Error('Falha ao excluir comanda')
      setOrders((prev) => prev.filter((o) => o.id !== order.id))
      setSelectedOrderForItems(null)
      setSelectedOrderForAudit(null)
      toast.success(`Comanda #${order.orderNumber || 100} excluída com sucesso!`)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir comanda')
    }
  }

  // Confirmação de Pagamento no Balcão (Dinheiro / Cartão Físico)
  const handleConfirmCounterPayment = async (order: Order) => {
    try {
      const res = await authFetch(`/api/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentStatus: 'PAID',
          paymentMethod: 'CASH',
          status: 'PREPARING',
        }),
      })
      if (!res.ok) throw new Error('Falha ao registrar pagamento')
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? { ...o, paymentStatus: 'PAID', paymentMethod: 'CASH', status: 'PREPARING' }
            : o
        )
      )
      setSelectedOrderForItems(null)
      toast.success(`✓ Pagamento do Ticket #${order.orderNumber || 100} (${order.customerName || 'Cliente'}) confirmado no caixa! Pedido em Preparação.`)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao confirmar pagamento')
    }
  }

  // --- Handlers de Drag and Drop (Cards e Scroll com Mouse) ---
  const kanbanContainerRef = React.useRef<HTMLDivElement>(null)
  const [isPanning, setIsPanning] = useState(false)
  const [panStartX, setPanStartX] = useState(0)
  const [panScrollLeft, setPanScrollLeft] = useState(0)

  const handleMouseDownOnContainer = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    // Apenas ativa arraste de rolagem se o clique não for num card, botão ou input
    if (target.closest('button, input, select, textarea, [draggable="true"]')) return

    setIsPanning(true)
    if (kanbanContainerRef.current) {
      setPanStartX(e.pageX - kanbanContainerRef.current.offsetLeft)
      setPanScrollLeft(kanbanContainerRef.current.scrollLeft)
    }
  }

  const handleMouseMoveOnContainer = (e: React.MouseEvent) => {
    if (!isPanning || !kanbanContainerRef.current) return
    e.preventDefault()
    const x = e.pageX - kanbanContainerRef.current.offsetLeft
    const walk = (x - panStartX) * 1.5
    kanbanContainerRef.current.scrollLeft = panScrollLeft - walk
  }

  const handleMouseUpOrLeaveContainer = () => {
    setIsPanning(false)
  }

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
      if (targetStatus === 'CANCELLED') {
        setOrderToCancel(order)
        setCancelConfirmOpen(true)
        return
      }

      const paymentStatus: 'PAID' | 'PENDING' =
        targetStatus === 'PAID'
          ? 'PAID'
          : order.paymentStatus === 'PAID'
          ? 'PAID'
          : 'PENDING'
      await updateOrderStatus(orderId, targetStatus, paymentStatus)
    }
  }

  // Filtro de pesquisa e de origem
  const filteredOrders = orders.filter((o) => {
    // Filtro de Origem
    const isTable = o.isTableOrder !== false && !!o.tableNumber
    if (originFilter === 'TABLES' && !isTable) return false
    if (originFilter === 'COUNTER' && isTable) return false

    // Busca textual
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

  // Helper de SLA
  const getSlaBadge = (elapsedMinutes: number) => {
    if (elapsedMinutes <= 5) {
      return {
        label: `${elapsedMinutes}m`,
        className: 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30',
        dotClass: 'bg-emerald-500',
      }
    }
    if (elapsedMinutes <= 10) {
      return {
        label: `${elapsedMinutes}m`,
        className: 'bg-amber-50 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',
        dotClass: 'bg-amber-500',
      }
    }
    return {
      label: `${elapsedMinutes}m`,
      className: 'bg-red-50 dark:bg-red-500/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-500/30 animate-pulse font-black',
      dotClass: 'bg-red-500',
    }
  }

  const countTables = orders.filter((o) => o.isTableOrder !== false && !!o.tableNumber).length
  const countCounter = orders.filter((o) => o.isTableOrder === false || !o.tableNumber).length

  return (
    <div className="w-full space-y-2.5">
      {/* Linha 1: Título e Ações Rápidas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-purple-100 dark:border-white/10">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-black text-purple-950 dark:text-white tracking-tight shrink-0">
            Pedidos & Comandas
          </h1>
        </div>

        {/* Ações Alinhadas em Linha Única */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <div className="relative w-36 sm:w-44">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-purple-400 dark:text-purple-300/60" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar..."
              className="pl-8 h-8 text-xs rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/10 text-purple-950 dark:text-white"
            />
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setSoundEnabled(!soundEnabled)
              toast.info(soundEnabled ? 'Som desativado' : 'Som de alertas ativado!')
            }}
            title={soundEnabled ? 'Silenciar alertas' : 'Ativar alertas sonoros'}
            className={`h-8 px-2.5 text-xs font-bold rounded-xl border cursor-pointer ${
              soundEnabled
                ? 'border-purple-200 dark:border-white/15 bg-white dark:bg-white/10 text-purple-950 dark:text-white'
                : 'border-red-200 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300'
            }`}
          >
            {soundEnabled ? <Volume2 className="h-3.5 w-3.5 text-purple-700 dark:text-pink-400" /> : <VolumeX className="h-3.5 w-3.5 text-red-500" />}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={loadOrders}
            className="h-8 px-2.5 text-xs font-bold rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-purple-800 dark:text-purple-100 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            size="sm"
            onClick={() => setNewOrderModalOpen(true)}
            className="h-8 text-xs font-black bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 hover:from-purple-800 hover:to-pink-700 text-white gap-1 shadow-sm rounded-xl cursor-pointer px-3"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nova Comanda</span>
          </Button>
        </div>
      </div>

      {/* Linha 2: Filtros de Origem Segmentados */}
      <div className="flex items-center gap-1.5 bg-purple-50/80 dark:bg-white/5 p-1 rounded-2xl border border-purple-150 dark:border-white/10 w-fit">
        <button
          type="button"
          onClick={() => setOriginFilter('ALL')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            originFilter === 'ALL'
              ? 'bg-purple-700 dark:bg-pink-600 text-white shadow-xs'
              : 'text-purple-900 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Todos os Pedidos</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-mono">
            {orders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setOriginFilter('TABLES')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            originFilter === 'TABLES'
              ? 'bg-purple-700 dark:bg-pink-600 text-white shadow-xs'
              : 'text-purple-900 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white'
          }`}
        >
          <Smartphone className="h-3.5 w-3.5" />
          <span>Mesas / QR Code</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-mono">
            {countTables}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setOriginFilter('COUNTER')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            originFilter === 'COUNTER'
              ? 'bg-purple-700 dark:bg-pink-600 text-white shadow-xs'
              : 'text-purple-900 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white'
          }`}
        >
          <Store className="h-3.5 w-3.5" />
          <span>Balcão / Take-Away</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-mono">
            {countCounter}
          </span>
        </button>
      </div>

      {/* 2. Colunas do Kanban com Arraste do Mouse e Cards Largos */}
      <div
        ref={kanbanContainerRef}
        onMouseDown={handleMouseDownOnContainer}
        onMouseMove={handleMouseMoveOnContainer}
        onMouseUp={handleMouseUpOrLeaveContainer}
        onMouseLeave={handleMouseUpOrLeaveContainer}
        className={`flex items-start gap-4 overflow-x-auto pb-6 pt-1 px-1 min-w-full select-none ${
          isPanning ? 'cursor-grabbing select-none' : 'cursor-grab'
        }`}
      >
        {KANBAN_COLUMNS.map((col) => {
          const colOrders = getOrdersForColumn(col.id)
          const isOver = dragOverColumn === col.id

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`flex flex-col min-h-[640px] w-[300px] md:w-[320px] xl:w-auto xl:flex-1 xl:min-w-[275px] shrink-0 xl:shrink rounded-3xl border transition-all p-3.5 space-y-3 shadow-xs ${
                isOver
                  ? 'border-purple-600 dark:border-pink-500 bg-purple-100/50 dark:bg-pink-950/40 shadow-xl ring-2 ring-purple-500/30 dark:ring-pink-500/30'
                  : `${col.borderLight} ${col.bgLight}`
              }`}
            >
              {/* Header da Coluna */}
              <div className="flex items-center justify-between pb-2 border-b border-purple-200/60 dark:border-white/10">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="p-1 rounded-lg bg-white/70 dark:bg-white/10 shadow-xs shrink-0">
                    {col.icon}
                  </div>
                  <div className="min-w-0">
                    <h2 className={`text-xs font-black truncate ${col.color}`}>
                      {col.title}
                    </h2>
                    <p className="text-[9px] text-purple-800/80 dark:text-purple-100 font-semibold truncate">
                      {col.subtitle}
                    </p>
                  </div>
                </div>

                <Badge className={`text-[10px] font-black px-2 py-0.2 rounded-full shrink-0 ml-1 ${col.accentColor}`}>
                  {colOrders.length}
                </Badge>
              </div>

              {/* Lista de Cards da Coluna */}
              <div className="flex-1 space-y-2 overflow-y-auto max-h-[720px] pr-0.5">
                {colOrders.length === 0 ? (
                  <div className="h-28 border border-dashed border-purple-200 dark:border-white/20 rounded-2xl flex flex-col items-center justify-center text-center p-3 text-purple-700 dark:text-purple-200">
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
                    const sla = getSlaBadge(elapsedMinutes)
                    const isDraggingThis = draggedOrderId === order.id
                    const isCancelled = order.status === 'CANCELLED'

                    return (
                      <Card
                        key={order.id}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, order)}
                        onClick={() => setSelectedOrderForAudit(order)}
                        className={`p-3 bg-white dark:bg-[#18022b]/95 border rounded-2xl shadow-xs dark:shadow-lg hover:shadow-md transition-all cursor-grab active:cursor-grabbing group relative select-none text-slate-900 dark:text-white ${
                          isCancelled
                            ? 'border-red-200 dark:border-red-500/30 opacity-75 bg-red-50/20'
                            : 'border-purple-150 dark:border-white/15 hover:border-purple-400 dark:hover:border-pink-500/50'
                        } ${
                          isDraggingThis ? 'opacity-40 scale-95 border-purple-600 dark:border-pink-500' : ''
                        }`}
                      >
                        {/* Header do Card */}
                        <div className="flex items-center justify-between gap-1.5 pb-1.5 border-b border-purple-100 dark:border-white/10">
                          <div className="flex items-center gap-1 min-w-0">
                            <GripVertical className="h-3 w-3 text-purple-400/60 dark:text-purple-400/40 group-hover:text-purple-700 dark:group-hover:text-pink-400 transition shrink-0" />
                            <span className="font-black text-xs text-purple-950 dark:text-white shrink-0">
                              #{order.orderNumber || 100}
                            </span>
                            {isTable ? (
                              <Badge className="bg-purple-700 dark:bg-pink-600 text-white font-extrabold text-[9px] py-0 px-1.5 rounded-md border-0 shrink-0">
                                {order.tableNumber}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[9px] font-bold border-purple-200 dark:border-white/20 text-purple-800 dark:text-purple-200 py-0 px-1.5 shrink-0">
                                Balcão
                              </Badge>
                            )}
                          </div>

                          {/* Badge Dinâmica de SLA ou Cancelado */}
                          {isCancelled ? (
                            <div className="text-[9px] font-black px-1.5 py-0.2 rounded-md border bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-300 dark:border-red-500/40 shrink-0">
                              Cancelado
                            </div>
                          ) : (
                            <div
                              className={`text-[9px] font-black px-1.5 py-0.2 rounded-full border flex items-center gap-1 shrink-0 ${sla.className}`}
                              title={`${elapsedMinutes} min desde o envio`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${sla.dotClass}`} />
                              <span>{sla.label}</span>
                            </div>
                          )}
                        </div>

                        {/* Cliente e Resumo de Itens */}
                        <div className="py-1.5 space-y-1">
                          <div className="flex items-center justify-between gap-1 text-xs font-bold text-purple-950 dark:text-white">
                            <span className="truncate flex items-center gap-1 min-w-0">
                              <User className="h-3 w-3 text-purple-700 dark:text-pink-400 shrink-0" />
                              <span className="truncate font-extrabold text-[11px]">{order.customerName || (isTable ? 'Cliente na Mesa' : 'Cliente Balcão')}</span>
                            </span>
                            {order.paymentStatus === 'PAID' && (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 shrink-0 whitespace-nowrap">
                                ✓ {order.paymentMethod === 'MBWAY' ? 'MB WAY' : 'Pago'}
                              </span>
                            )}
                          </div>

                          {/* Lista resumida de itens */}
                          <div className="bg-purple-50/60 dark:bg-white/5 border border-purple-100 dark:border-white/10 p-2 rounded-xl text-[11px] text-purple-950 dark:text-purple-100 space-y-0.5">
                            {order.items && order.items.length > 0 ? (
                              order.items.slice(0, 2).map((item, i) => (
                                <div key={i} className="flex justify-between items-center gap-1 text-[10.5px]">
                                  <span className="truncate font-semibold min-w-0">
                                    {item.quantity || 1}x {item.containerName || item.container?.name || 'Açaí'}
                                  </span>
                                  <span className="font-bold text-purple-700 dark:text-pink-300 ml-1 shrink-0 font-mono text-[10px]">
                                    {formatCurrency(item.lineTotal || 0)}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <div className="font-semibold text-[10.5px]">1x Açaí Personalizado</div>
                            )}
                            {order.items && order.items.length > 2 && (
                              <div className="text-[9px] text-purple-600/70 dark:text-purple-300/60 font-medium">
                                +{order.items.length - 2} outro(s) item(ns)...
                              </div>
                            )}
                          </div>

                          {order.cancelReason && (
                            <div className="text-[9px] text-red-800 dark:text-red-300 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-500/30 px-1.5 py-0.5 rounded-lg line-clamp-1 italic font-medium flex items-center gap-1">
                              <AlertCircle className="h-3 w-3 text-red-600 dark:text-red-400 shrink-0" />
                              <span className="truncate">Motivo: {order.cancelReason}</span>
                            </div>
                          )}

                          {order.notes && !order.cancelReason && (
                            <div className="text-[9px] text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/25 px-1.5 py-0.5 rounded-lg line-clamp-1 italic font-medium flex items-center gap-1">
                              <AlertCircle className="h-3 w-3 text-amber-600 dark:text-amber-400 shrink-0" />
                              <span className="truncate">{order.notes}</span>
                            </div>
                          )}

                          {/* Botões de Ação Rápida no Card */}
                          <div className="flex items-center justify-between gap-1 pt-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedOrderForItems(order)
                              }}
                              className="h-6 px-2 text-[10px] font-bold rounded-lg border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-white/5 text-purple-950 dark:text-white hover:bg-purple-100 dark:hover:bg-white/10 cursor-pointer gap-1"
                            >
                              <span>👁️ Ver Itens</span>
                            </Button>

                            <div className="flex items-center gap-1">
                              {order.paymentStatus !== 'PAID' && order.status !== 'CANCELLED' && (
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleConfirmCounterPayment(order)
                                  }}
                                  className="h-6 px-1.5 text-[9.5px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                                  title="Confirmar pagamento em dinheiro/cartão"
                                >
                                  <span>✓ Receber</span>
                                </Button>
                              )}

                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteOrderPermanently(order)
                                }}
                                className="h-6 w-6 p-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg cursor-pointer"
                                title="Excluir comanda"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Rodapé do Card: Total, Status de Pagamento e Impressão */}
                        <div className="pt-1.5 border-t border-purple-100 dark:border-white/10 flex items-center justify-between gap-1">
                          <div className="min-w-0 shrink-0">
                            <span className="text-[9px] text-purple-600/70 dark:text-purple-300/60 block leading-none font-medium mb-0.5">Total</span>
                            <span className="text-xs font-black text-purple-950 dark:text-white font-mono whitespace-nowrap">
                              {formatCurrency(order.total || order.totalAmount || 0)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {isCancelled ? (
                              <Badge className="bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-500/40 font-black text-[9px] py-0.5 px-1.5 rounded-md whitespace-nowrap">
                                ESTORNADO
                              </Badge>
                            ) : order.paymentStatus === 'PAID' ? (
                              <>
                                <Badge className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 font-black text-[9px] py-0.5 px-1.5 rounded-md whitespace-nowrap">
                                  PAGO
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => handlePrintOrder(e, order)}
                                  title="Imprimir comanda de montagem"
                                  className="h-6 w-6 p-0 text-purple-700 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white rounded-lg cursor-pointer shrink-0"
                                >
                                  <Printer className="h-3 w-3" />
                                </Button>
                              </>
                            ) : (
                              <Badge className="bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 font-black text-[9px] py-0.5 px-1.5 rounded-md whitespace-nowrap">
                                A PAGAR
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

      {/* Modal de Detalhes dos Itens do Pedido (Raio-X de Ingredientes) */}
      <OrderItemsModal
        order={selectedOrderForItems}
        open={Boolean(selectedOrderForItems)}
        onOpenChange={(open) => !open && setSelectedOrderForItems(null)}
        onConfirmPayment={handleConfirmCounterPayment}
        onDeleteOrder={handleDeleteOrderPermanently}
        onPrintOrder={(o) => handlePrintOrder(null, o)}
      />

      {/* 4. Modal de Histórico e Auditoria do Pedido */}
      <OrderHistoryAuditModal
        order={selectedOrderForAudit}
        open={!!selectedOrderForAudit}
        onOpenChange={(open: boolean) => !open && setSelectedOrderForAudit(null)}
        onEditOrder={(order: Order) => {
          setSelectedOrderForAudit(null)
          setSelectedOrderForEdit(order)
        }}
        onRequestCancel={(order: Order) => {
          setOrderToCancel(order)
          setCancelConfirmOpen(true)
        }}
        onUpdateStatus={updateOrderStatus}
      />

      {/* 5. Modal de Edição Completa do Pedido */}
      <OrderEditDialog
        order={selectedOrderForEdit}
        open={!!selectedOrderForEdit}
        onOpenChange={(open) => !open && setSelectedOrderForEdit(null)}
        onSave={handleSaveEditedOrder}
      />

      {/* 6. Modal de Nova Comanda Manual */}
      <NewOrderManualModal
        open={newOrderModalOpen}
        onOpenChange={setNewOrderModalOpen}
        tenantId={tenantId}
        onCreateOrder={handleCreateOrder}
      />

      {/* 7. Dialog de Cancelamento com Motivo */}
      <CancelReasonDialog
        open={cancelConfirmOpen}
        onOpenChange={setCancelConfirmOpen}
        order={orderToCancel}
        onConfirmCancel={handleConfirmCancel}
        loading={cancelLoading}
      />
    </div>
  )
}
