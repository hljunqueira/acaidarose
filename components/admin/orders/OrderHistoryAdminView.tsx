'use client'

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  Search,
  Download,
  Calendar,
  Building2,
  RefreshCw,
  Printer,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/stores/authStore'
import { useFranchiseStore } from '@/lib/stores/franchiseStore'
import { formatCurrency } from '@/lib/i18n/formatters'

interface OrderItemOption {
  id: string
  name: string
  price?: number
}

interface OrderItemDetail {
  id?: string
  containerId?: string
  containerName?: string
  productName?: string
  name?: string
  size?: string
  quantity: number
  unitPrice?: number
  price?: number
  lineTotal?: number
  isBagItem?: boolean
  bases?: OrderItemOption[]
  toppings?: OrderItemOption[]
  notes?: string
}

interface HistoryOrder {
  id: string
  tenantId: string
  tenantName: string
  tenantSlug: string
  orderNumber: number
  cashierId?: string | null
  cashierName?: string
  customerName?: string
  customerPhone?: string | null
  customerNif?: string | null
  subtotal: number
  vatTotal: number
  total: number
  status: string
  paymentStatus: string
  paymentMethod: string
  tableNumber?: number | null
  isTableOrder: boolean
  consumptionType: 'DINE_IN' | 'COUNTER' | 'TAKEAWAY'
  isTakeaway: boolean
  needBag: boolean
  bagQuantity: number
  bagFee: number
  cancelReason?: string | null
  cancelledAt?: string | null
  cancelledByName?: string | null
  notes?: string
  items: OrderItemDetail[]
  createdAt: string
}

interface HistorySummary {
  totalRevenue: number
  totalOrders: number
  averageTicket: number
  cancelledCount: number
  cancelledTotal: number
  grandTotalCount: number
}

interface OrderHistoryAdminViewProps {
  tenantId?: string
  currentUser?: any
  initialPeriod?: 'today' | 'yesterday' | '7d' | '30d' | 'month' | 'custom'
}

interface FilterOption {
  value: string
  label: string
}

function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string
  onChange: (val: string) => void
  options: FilterOption[]
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const selectedOption = options.find((o) => o.value === value)
  const displayLabel = selectedOption ? selectedOption.label : placeholder || value

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full h-10 px-3 rounded-2xl text-xs font-bold bg-white dark:bg-[#160228] text-slate-800 dark:text-white border border-purple-200 dark:border-white/15 flex items-center justify-between gap-1.5 focus:outline-none cursor-pointer hover:border-purple-300 dark:hover:border-white/30 transition shadow-xs"
      >
        <span className="truncate text-left">{displayLabel}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180 text-purple-700 dark:text-pink-400' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-full min-w-[160px] z-50 bg-white dark:bg-[#160228] border border-purple-200 dark:border-white/15 rounded-2xl shadow-2xl max-h-64 overflow-y-auto p-1.5 space-y-0.5 animate-in fade-in slide-in-from-top-2 duration-150">
          {options.map((opt) => {
            const isSelected = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold text-left transition cursor-pointer ${
                  isSelected
                    ? 'bg-purple-100/80 dark:bg-pink-600/25 text-purple-950 dark:text-pink-300'
                    : 'text-slate-700 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-white/10'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && (
                  <Check className="h-3.5 w-3.5 text-purple-700 dark:text-pink-400 shrink-0 ml-1.5" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function OrderHistoryAdminView({
  tenantId: propTenantId,
  currentUser: propUser,
  initialPeriod = 'today',
}: OrderHistoryAdminViewProps) {
  const { user: authUser } = useAuthStore()
  const { tenants, currentTenant, setCurrentTenant } = useFranchiseStore()

  const user = propUser || authUser
  const isMaster = user?.role === 'SUPER_ADMIN' || user?.role === 'FRANCHISOR_ADMIN'
  const defaultLoja = isMaster ? (currentTenant?.id || 'ALL') : (user?.tenantId || propTenantId || '')

  // Filtros principais
  const [selectedBranch, setSelectedBranch] = useState<string>(defaultLoja)
  const [period, setPeriod] = useState<'today' | 'yesterday' | '7d' | '30d' | 'month' | 'custom'>(initialPeriod)
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return d.toISOString().slice(0, 10)
  })
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().slice(0, 10))

  // Filtros secundários
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL')
  const [consumptionFilter, setConsumptionFilter] = useState<string>('ALL')
  const [tableFilter, setTableFilter] = useState<string>('ALL')
  const [storeTableOptions, setStoreTableOptions] = useState<FilterOption[]>([])
  const [searchTerm, setSearchTerm] = useState<string>('')

  // Paginação e dados
  const [page, setPage] = useState<number>(1)
  const [limit, setLimit] = useState<number>(25)
  const [orders, setOrders] = useState<HistoryOrder[]>([])
  const [summary, setSummary] = useState<HistorySummary>({
    totalRevenue: 0,
    totalOrders: 0,
    averageTicket: 0,
    cancelledCount: 0,
    cancelledTotal: 0,
    grandTotalCount: 0,
  })
  const [totalPages, setTotalPages] = useState<number>(1)
  const [dateFormatted, setDateFormatted] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  // Modal de Detalhes da Comanda
  const [selectedOrder, setSelectedOrder] = useState<HistoryOrder | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState<boolean>(false)

  // Sincroniza filial quando storeId mudar no header global
  useEffect(() => {
    if (isMaster && currentTenant?.id && selectedBranch !== 'ALL') {
      setSelectedBranch(currentTenant.id)
    }
  }, [currentTenant?.id, isMaster])

  // Carrega mesas reais cadastradas da unidade para o filtro
  useEffect(() => {
    const targetStore = isMaster
      ? selectedBranch && selectedBranch !== 'ALL'
        ? selectedBranch
        : 'ALL'
      : user?.tenantId || 'ALL'

    fetch(`/api/tables?tenantId=${encodeURIComponent(targetStore)}`)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.tables)) {
          const map = new Map<number, string>()
          d.tables.forEach((t: any) => {
            const num = Number(t.number ?? t.table_number ?? t.tableNumber)
            if (typeof num === 'number' && !isNaN(num) && num > 0) {
              const label = t.nickname || `Mesa ${String(num).padStart(2, '0')}`
              if (!map.has(num)) {
                map.set(num, label)
              }
            }
          })
          const sorted = Array.from(map.entries()).sort((a, b) => a[0] - b[0])
          const opts: FilterOption[] = sorted.map(([num, label]) => ({
            value: String(num),
            label,
          }))
          setStoreTableOptions(opts)

          // Se a mesa atualmente filtrada não existir na nova loja, reseta suavemente para ALL
          setTableFilter((curr) => {
            if (curr === 'ALL' || curr === 'BALCAO') return curr
            const exists = opts.some((o) => o.value === curr)
            return exists ? curr : 'ALL'
          })
        }
      })
      .catch(() => {})
  }, [selectedBranch, isMaster, user?.tenantId])

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams()
      if (isMaster && selectedBranch && selectedBranch !== 'ALL') {
        q.set('loja', selectedBranch)
      } else if (!isMaster && user?.tenantId) {
        q.set('loja', user.tenantId)
      }

      q.set('periodo', period)
      if (period === 'custom') {
        q.set('startDate', startDate)
        q.set('endDate', endDate)
      }

      if (statusFilter !== 'ALL') q.set('status', statusFilter)
      if (paymentFilter !== 'ALL') q.set('paymentMethod', paymentFilter)
      if (consumptionFilter !== 'ALL') q.set('consumptionType', consumptionFilter)
      if (tableFilter !== 'ALL') q.set('mesa', tableFilter)
      if (searchTerm.trim()) q.set('q', searchTerm.trim())

      q.set('page', String(page))
      q.set('limit', String(limit))

      const res = await fetch(`/api/orders/history?${q.toString()}`)
      if (!res.ok) throw new Error('Falha ao carregar histórico de pedidos')

      const data = await res.json()
      setOrders(data.orders || [])
      setSummary(data.summary || {
        totalRevenue: 0,
        totalOrders: 0,
        averageTicket: 0,
        cancelledCount: 0,
        cancelledTotal: 0,
        grandTotalCount: 0,
      })
      setTotalPages(data.pagination?.totalPages || 1)
      setDateFormatted(data.dateFormatted || '')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao carregar dados do histórico')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [isMaster, selectedBranch, user?.tenantId, period, startDate, endDate, statusFilter, paymentFilter, consumptionFilter, tableFilter, searchTerm, page, limit])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Resetar página ao mudar filtros
  const handleFilterChange = () => {
    setPage(1)
  }

  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleString('pt-PT', {
        timeZone: 'Europe/Lisbon',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
      case 'COMPLETED':
        return (
          <Badge className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-[10px] font-bold py-0.5 px-2 rounded-lg">
            Pago
          </Badge>
        )
      case 'PREPARING':
        return (
          <Badge className="bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-pink-300 border border-purple-200 dark:border-purple-500/30 text-[10px] font-bold py-0.5 px-2 rounded-lg">
            Em Preparo
          </Badge>
        )
      case 'READY':
        return (
          <Badge className="bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 text-[10px] font-bold py-0.5 px-2 rounded-lg">
            Pronto
          </Badge>
        )
      case 'NEW':
        return (
          <Badge className="bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 text-[10px] font-bold py-0.5 px-2 rounded-lg">
            Novo
          </Badge>
        )
      case 'CANCELLED':
        return (
          <Badge className="bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 text-[10px] font-bold py-0.5 px-2 rounded-lg">
            Cancelado
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-[10px] py-0.5 px-2 font-bold">
            {status}
          </Badge>
        )
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'MBWAY':
      case 'MB_WAY':
        return 'MB WAY'
      case 'MULTIBANCO':
      case 'CARD':
        return 'Multibanco'
      case 'NUMERARIO':
      case 'CASH':
        return 'Numerário'
      default:
        return method || 'Balcão'
    }
  }

  const handlePrintReceipt = (orderId: string) => {
    window.open(`/receipt/${orderId}`, '_blank', 'width=450,height=700')
  }

  // Exportação CSV Profissional
  const handleExportCSV = () => {
    if (orders.length === 0) {
      toast.error('Nenhum pedido para exportar no período selecionado')
      return
    }

    const headers = [
      'Comanda',
      'Data e Hora',
      'Unidade / Loja',
      'Cliente',
      'Telefone',
      'NIF',
      'Tipo de Consumo',
      'Mesa',
      'Método de Pagamento',
      'Subtotal (€)',
      'IVA 13% (€)',
      'Total (€)',
      'Situação',
      'Motivo Cancelamento',
    ]

    const rows = orders.map((o) => {
      const consumptionLabel = o.consumptionType === 'TAKEAWAY' ? 'Takeaway' : o.tableNumber ? `Mesa ${o.tableNumber}` : 'Balcão'
      return [
        `"#${o.orderNumber}"`,
        `"${formatDateTime(o.createdAt)}"`,
        `"${o.tenantName || selectedBranch}"`,
        `"${o.customerName || 'Anónimo'}"`,
        `"${o.customerPhone || ''}"`,
        `"${o.customerNif || ''}"`,
        `"${consumptionLabel}"`,
        `"${o.tableNumber || ''}"`,
        `"${getPaymentMethodLabel(o.paymentMethod)}"`,
        o.subtotal.toFixed(2),
        o.vatTotal.toFixed(2),
        o.total.toFixed(2),
        `"${o.status}"`,
        `"${o.cancelReason || ''}"`,
      ]
    })

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `historico-pedidos-${period}-${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Relatório CSV de pedidos gerado com sucesso!')
  }

  const tableOptions = useMemo<FilterOption[]>(
    () => [
      { value: 'ALL', label: 'Todas as Mesas' },
      { value: 'BALCAO', label: 'Apenas Balcão' },
      ...storeTableOptions,
    ],
    [storeTableOptions]
  )

  const statusOptions: FilterOption[] = [
    { value: 'ALL', label: 'Todas Situações' },
    { value: 'PAID_OR_COMPLETED', label: 'Finalizados / Pagos' },
    { value: 'PREPARING_OR_READY', label: 'Em Preparo / Prontos' },
    { value: 'NEW', label: 'Novos Pedidos' },
    { value: 'CANCELLED', label: 'Cancelados / Anulados' },
  ]

  const paymentOptions: FilterOption[] = [
    { value: 'ALL', label: 'Todos Pagamentos' },
    { value: 'MBWAY', label: 'MB WAY' },
    { value: 'MULTIBANCO', label: 'Multibanco' },
    { value: 'NUMERARIO', label: 'Numerário' },
  ]

  const consumptionOptions: FilterOption[] = [
    { value: 'ALL', label: 'Todos Canais' },
    { value: 'DINE_IN', label: 'Mesa (Salão)' },
    { value: 'COUNTER', label: 'Balcão' },
    { value: 'TAKEAWAY', label: 'Takeaway' },
  ]

  return (
    <div className="w-full space-y-6">
      {/* 1. HEADER CORPORATIVO LIMPO */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-purple-100 dark:border-white/10">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-purple-950 dark:text-white tracking-tight">
            Histórico de Pedidos
          </h1>
          <p className="text-xs text-purple-700/80 dark:text-purple-200/70 mt-0.5">
            {dateFormatted || 'Auditoria temporal e consulta de comandas'} ·{' '}
            <strong className="text-purple-950 dark:text-white font-black">
              {summary.grandTotalCount}
            </strong>{' '}
            pedidos no filtro
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Seletor de Loja (se Franqueadora / Super Admin) */}
          {isMaster && (
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white dark:bg-white/5 border border-purple-200 dark:border-white/15">
              <Building2 className="h-3.5 w-3.5 text-purple-700 dark:text-pink-400 ml-2" />
              <select
                value={selectedBranch}
                onChange={(e) => {
                  setSelectedBranch(e.target.value)
                  handleFilterChange()
                  if (e.target.value !== 'ALL') {
                    const found = tenants.find((t) => t.id === e.target.value)
                    if (found) setCurrentTenant(found)
                  }
                }}
                className="text-xs font-bold bg-transparent text-slate-800 dark:text-white px-2 py-1.5 rounded-xl focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="text-black dark:text-white dark:bg-slate-900">
                  Todas as Unidades (Rede)
                </option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id} className="text-black dark:text-white dark:bg-slate-900">
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Botão Atualizar */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchOrders}
            disabled={loading}
            className="h-10 rounded-xl text-xs font-bold border-purple-200 dark:border-white/15 cursor-pointer bg-white dark:bg-white/5"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </Button>

          {/* Botão Exportar CSV */}
          <Button
            type="button"
            size="sm"
            onClick={handleExportCSV}
            className="h-10 rounded-xl text-xs font-bold bg-purple-900 hover:bg-purple-800 text-white cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Exportar relatório</span>
          </Button>
        </div>
      </div>

      {/* 2. CARDS DE INDICADORES / MÉTRICAS CONSOLIDADAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-[#160228] border border-purple-100 dark:border-white/10 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-purple-700/80 dark:text-purple-300">
            Faturamento do Período
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-950 dark:text-pink-300 font-mono mt-1">
            {formatCurrency(summary.totalRevenue)}
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
            {summary.totalOrders} comandas concluídas
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#160228] border border-purple-100 dark:border-white/10 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-purple-700/80 dark:text-purple-300">
            Volume de Pedidos
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono mt-1">
            {summary.grandTotalCount}
          </div>
          <div className="text-xs text-slate-500 dark:text-purple-200/70 mt-1">
            Atendimentos no filtro selecionado
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#160228] border border-purple-100 dark:border-white/10 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-purple-700/80 dark:text-purple-300">
            Ticket Médio
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono mt-1">
            {formatCurrency(summary.averageTicket)}
          </div>
          <div className="text-xs text-slate-500 dark:text-purple-200/70 mt-1">
            Por comanda concluída
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#160228] border border-purple-100 dark:border-white/10 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            Cancelados / Anulados
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 font-mono mt-1">
            {summary.cancelledCount}
          </div>
          <div className="text-xs text-rose-600/80 dark:text-rose-400/80 font-mono mt-1">
            Montante: {formatCurrency(summary.cancelledTotal)}
          </div>
        </div>
      </div>

      {/* 3. BARRA DE FILTROS TEMPORAIS (Pills de tempo) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-purple-50/70 dark:bg-white/5 border border-purple-100 dark:border-white/10">
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
          <Calendar className="h-4 w-4 text-purple-700 dark:text-pink-400 ml-1 mr-1" />
          {[
            { id: 'today', label: 'Hoje' },
            { id: 'yesterday', label: 'Ontem' },
            { id: '7d', label: '7 Dias' },
            { id: '30d', label: '30 Dias' },
            { id: 'month', label: 'Este mês' },
            { id: 'custom', label: 'Customizado' },
          ].map((p) => {
            const isActive = period === p.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setPeriod(p.id as any)
                  handleFilterChange()
                }}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  isActive
                    ? 'bg-purple-900 text-white dark:bg-pink-600 shadow-xs'
                    : 'text-purple-900 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white hover:bg-purple-100/60 dark:hover:bg-white/10'
                }`}
              >
                {p.label}
              </button>
            )
          })}
        </div>

        {/* Seletores de Data quando for Customizado */}
        {period === 'custom' && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 dark:text-purple-200 font-bold">De:</span>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                handleFilterChange()
              }}
              className="h-9 w-36 rounded-xl text-xs font-bold bg-white dark:bg-black/30 border-purple-200 dark:border-white/15"
            />
            <span className="text-slate-500 dark:text-purple-200 font-bold">Até:</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value)
                handleFilterChange()
              }}
              className="h-9 w-36 rounded-xl text-xs font-bold bg-white dark:bg-black/30 border-purple-200 dark:border-white/15"
            />
          </div>
        )}
      </div>

      {/* 4. BARRA DE FILTROS SECUNDÁRIOS & BUSCA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 relative z-20">
        {/* Busca por Texto */}
        <div className="lg:col-span-4 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            type="text"
            placeholder="Buscar por comanda (#12), cliente, NIF ou mesa..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              handleFilterChange()
            }}
            className="pl-10 h-10 rounded-2xl text-xs font-bold bg-white dark:bg-white/5 border-purple-200 dark:border-white/15"
          />
        </div>

        {/* Filtro por Mesa */}
        <div className="lg:col-span-2">
          <FilterSelect
            value={tableFilter}
            onChange={(val) => {
              setTableFilter(val)
              handleFilterChange()
            }}
            options={tableOptions}
          />
        </div>

        {/* Filtro por Situação / Status */}
        <div className="lg:col-span-2">
          <FilterSelect
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val)
              handleFilterChange()
            }}
            options={statusOptions}
          />
        </div>

        {/* Filtro por Método de Pagamento */}
        <div className="lg:col-span-2">
          <FilterSelect
            value={paymentFilter}
            onChange={(val) => {
              setPaymentFilter(val)
              handleFilterChange()
            }}
            options={paymentOptions}
          />
        </div>

        {/* Filtro por Canal de Consumo */}
        <div className="lg:col-span-2">
          <FilterSelect
            value={consumptionFilter}
            onChange={(val) => {
              setConsumptionFilter(val)
              handleFilterChange()
            }}
            options={consumptionOptions}
          />
        </div>
      </div>

      {/* 5. TABELA DE PEDIDOS */}
      <div className="rounded-3xl bg-white dark:bg-[#160228] border border-purple-100 dark:border-white/10 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-purple-50/70 dark:bg-white/5 border-b border-purple-100 dark:border-white/10 text-purple-900 dark:text-purple-200 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Comanda</th>
                <th className="py-3 px-4">Data & Hora</th>
                {selectedBranch === 'ALL' && <th className="py-3 px-4">Loja</th>}
                <th className="py-3 px-4">Cliente / Contato</th>
                <th className="py-3 px-4">Canal</th>
                <th className="py-3 px-4">Pagamento</th>
                <th className="py-3 px-4">Resumo dos Itens</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-center">Situação</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100 dark:divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan={selectedBranch === 'ALL' ? 10 : 9} className="py-12 text-center text-slate-400 dark:text-purple-200/60 font-bold">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-purple-700 dark:text-pink-400" />
                    A carregar histórico de pedidos...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={selectedBranch === 'ALL' ? 10 : 9} className="py-12 text-center text-slate-500 dark:text-purple-200/70 font-bold">
                    Nenhum pedido encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const isCancelled = o.status === 'CANCELLED'
                  const totalItems = o.items.reduce((s, it) => s + (it.quantity || 1), 0)
                  const firstItemName = o.items[0]?.containerName || o.items[0]?.productName || o.items[0]?.name || 'Taça de Açaí'

                  return (
                    <tr
                      key={o.id}
                      className={`hover:bg-purple-50/50 dark:hover:bg-white/5 transition-colors ${
                        isCancelled ? 'bg-rose-50/30 dark:bg-rose-950/10' : ''
                      }`}
                    >
                      {/* Comanda */}
                      <td className="py-3 px-4 font-mono font-black text-purple-900 dark:text-pink-300">
                        #{o.orderNumber}
                      </td>

                      {/* Data & Hora */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-purple-200/80 whitespace-nowrap">
                        {formatDateTime(o.createdAt)}
                      </td>

                      {/* Loja (quando Todas) */}
                      {selectedBranch === 'ALL' && (
                        <td className="py-3 px-4 font-semibold text-slate-800 dark:text-white truncate max-w-[140px]" title={o.tenantName}>
                          {o.tenantName}
                        </td>
                      )}

                      {/* Cliente */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white truncate max-w-[130px]">
                          {o.customerName || 'Cliente Balcão'}
                        </div>
                        {o.customerNif && (
                          <div className="text-[10px] text-slate-500 font-mono">
                            NIF: {o.customerNif}
                          </div>
                        )}
                      </td>

                      {/* Canal */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {o.consumptionType === 'TAKEAWAY' ? (
                          <Badge variant="outline" className="text-[10px] font-bold border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300">
                            Takeaway
                          </Badge>
                        ) : o.tableNumber ? (
                          <Badge variant="outline" className="text-[10px] font-bold border-purple-200 dark:border-purple-500/30 text-purple-900 dark:text-purple-200">
                            Mesa {o.tableNumber}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] font-bold border-slate-200 dark:border-white/20 text-slate-600 dark:text-slate-300">
                            Balcão
                          </Badge>
                        )}
                      </td>

                      {/* Método de Pagamento */}
                      <td className="py-3 px-4 font-semibold text-slate-700 dark:text-purple-200 whitespace-nowrap">
                        {getPaymentMethodLabel(o.paymentMethod)}
                      </td>

                      {/* Resumo dos Itens */}
                      <td className="py-3 px-4">
                        <div className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[180px]" title={firstItemName}>
                          {firstItemName}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-purple-300/80">
                          {totalItems} {totalItems === 1 ? 'item' : 'itens'} no pedido
                        </div>
                      </td>

                      {/* Total */}
                      <td className="py-3 px-4 text-right font-mono font-black text-sm whitespace-nowrap">
                        <span className={isCancelled ? 'line-through text-rose-500' : 'text-purple-950 dark:text-white'}>
                          {formatCurrency(o.total)}
                        </span>
                      </td>

                      {/* Situação */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {getStatusBadge(o.status)}
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(o)
                              setDetailsModalOpen(true)
                            }}
                            className="h-8 px-2 rounded-xl text-purple-900 dark:text-pink-400 hover:bg-purple-100/60 dark:hover:bg-white/10 cursor-pointer text-xs font-bold"
                            title="Ver detalhes da comanda"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            <span>Detalhes</span>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePrintReceipt(o.id)}
                            className="h-8 w-8 p-0 rounded-xl text-slate-600 dark:text-purple-200 hover:bg-purple-100/60 dark:hover:bg-white/10 cursor-pointer"
                            title="Imprimir 2ª via do talão"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 6. CONTROLES DE PAGINAÇÃO */}
        <div className="p-4 border-t border-purple-100 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 dark:text-purple-200 font-medium">
            A exibir <strong className="text-slate-900 dark:text-white">{orders.length}</strong> de{' '}
            <strong className="text-slate-900 dark:text-white">{summary.grandTotalCount}</strong> pedidos
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 px-3 rounded-xl border-purple-200 dark:border-white/15 text-xs font-bold cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" />
              <span>Anterior</span>
            </Button>

            <span className="font-bold text-slate-800 dark:text-white px-2">
              Página {page} de {totalPages}
            </span>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 px-3 rounded-xl border-purple-200 dark:border-white/15 text-xs font-bold cursor-pointer"
            >
              <span>Seguinte</span>
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* 7. MODAL DE DETALHES COMPLETOS DA COMANDA */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-2xl p-6 bg-white dark:bg-[#160228] text-slate-900 dark:text-white border border-purple-100 dark:border-white/10 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <div className="space-y-5">
              <DialogHeader className="pb-3 border-b border-purple-100 dark:border-white/10 flex flex-row items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-purple-950 dark:text-white font-mono">
                      Comanda #{selectedOrder.orderNumber}
                    </span>
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-purple-200/80 mt-0.5 font-mono">
                    {formatDateTime(selectedOrder.createdAt)} · {selectedOrder.tenantName}
                  </p>
                </div>
              </DialogHeader>

              {/* Informações do Cliente e Canal */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-purple-50/60 dark:bg-white/5 border border-purple-100 dark:border-white/10 text-xs">
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-500 dark:text-purple-300">Cliente</div>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedOrder.customerName || 'Cliente Balcão'}
                  </div>
                  {selectedOrder.customerPhone && (
                    <div className="text-[11px] text-slate-600 dark:text-purple-200 font-mono mt-0.5">
                      Tel: {selectedOrder.customerPhone}
                    </div>
                  )}
                  {selectedOrder.customerNif && (
                    <div className="text-[11px] text-slate-600 dark:text-purple-200 font-mono mt-0.5">
                      NIF: {selectedOrder.customerNif}
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-500 dark:text-purple-300">Consumo</div>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedOrder.consumptionType === 'TAKEAWAY'
                      ? 'Takeaway (Para levar)'
                      : selectedOrder.tableNumber
                      ? `Mesa ${selectedOrder.tableNumber}`
                      : 'Balcão'}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-purple-300/80 mt-0.5">
                    Atendente: {selectedOrder.cashierName || 'Balcão'}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-500 dark:text-purple-300">Pagamento</div>
                  <div className="font-bold text-purple-950 dark:text-pink-300 mt-0.5">
                    {getPaymentMethodLabel(selectedOrder.paymentMethod)}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-purple-300/80 mt-0.5">
                    Status: {selectedOrder.paymentStatus === 'PAID' ? 'Liquidado' : 'Pendente'}
                  </div>
                </div>
              </div>

              {/* Registro de Cancelamento (se houver) */}
              {selectedOrder.status === 'CANCELLED' && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-xs">
                  <div className="font-bold text-rose-700 dark:text-rose-400">
                    Comanda Cancelada / Anulada
                  </div>
                  <p className="text-[11px] text-rose-600 dark:text-rose-300 mt-0.5">
                    Motivo: <strong>{selectedOrder.cancelReason || 'Não informado'}</strong>
                  </p>
                  {selectedOrder.cancelledByName && (
                    <p className="text-[10px] text-rose-500 dark:text-rose-400/80 mt-0.5">
                      Cancelado por: {selectedOrder.cancelledByName} em{' '}
                      {selectedOrder.cancelledAt ? formatDateTime(selectedOrder.cancelledAt) : ''}
                    </p>
                  )}
                </div>
              )}

              {/* Lista Detalhada de Produtos e Itens */}
              <div className="space-y-2">
                <div className="text-xs font-black uppercase text-purple-950 dark:text-white">
                  Itens da Comanda ({selectedOrder.items.length})
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {selectedOrder.items.map((it, idx) => {
                    const itemName = it.containerName || it.productName || it.name || 'Taça'
                    const unitPrice = Number(it.unitPrice || it.price || 0)
                    const lineTotal = Number(it.lineTotal || unitPrice * (it.quantity || 1))

                    return (
                      <div
                        key={it.id || idx}
                        className="p-3 rounded-2xl bg-purple-50/40 dark:bg-white/5 border border-purple-100 dark:border-white/10 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-slate-900 dark:text-white">
                            {it.quantity}x {itemName} {it.size ? `(${it.size})` : ''}
                          </span>
                          <span className="font-mono text-purple-950 dark:text-pink-300">
                            {formatCurrency(lineTotal)}
                          </span>
                        </div>

                        {/* Acompanhamentos e Opcionais */}
                        {((it.bases && it.bases.length > 0) || (it.toppings && it.toppings.length > 0)) && (
                          <div className="text-[11px] text-slate-600 dark:text-purple-200/80 pl-2 border-l-2 border-purple-300 dark:border-pink-500/40 space-y-0.5">
                            {it.bases && it.bases.length > 0 && (
                              <div>
                                <span className="font-semibold text-slate-700 dark:text-purple-200">Bases: </span>
                                {it.bases.map((b) => b.name).join(', ')}
                              </div>
                            )}
                            {it.toppings && it.toppings.length > 0 && (
                              <div>
                                <span className="font-semibold text-slate-700 dark:text-purple-200">Acompanhamentos: </span>
                                {it.toppings.map((t) => t.name).join(', ')}
                              </div>
                            )}
                          </div>
                        )}

                        {it.notes && (
                          <div className="text-[10px] text-slate-500 dark:text-purple-300 italic">
                            Obs: {it.notes}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Totais Fiscais e Financeiros */}
              <div className="pt-3 border-t border-purple-100 dark:border-white/10 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-purple-200">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.bagFee > 0 && (
                  <div className="flex justify-between text-slate-600 dark:text-purple-200">
                    <span>Saco de Transporte ({selectedOrder.bagQuantity}x)</span>
                    <span className="font-mono">{formatCurrency(selectedOrder.bagFee)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500 dark:text-purple-300 text-[11px]">
                  <span>IVA Incluído (13%)</span>
                  <span className="font-mono">{formatCurrency(selectedOrder.vatTotal)}</span>
                </div>
                <div className="flex justify-between text-base font-black text-purple-950 dark:text-white pt-1 border-t border-purple-100 dark:border-white/10">
                  <span>Total</span>
                  <span className="font-mono text-purple-950 dark:text-pink-300">
                    {formatCurrency(selectedOrder.total)}
                  </span>
                </div>
              </div>

              <DialogFooter className="pt-2 flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDetailsModalOpen(false)}
                  className="h-9 px-4 rounded-xl text-xs font-bold border-purple-200 dark:border-white/15 cursor-pointer"
                >
                  Fechar
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => handlePrintReceipt(selectedOrder.id)}
                  className="h-9 px-4 rounded-xl text-xs font-bold bg-purple-900 hover:bg-purple-800 text-white cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Imprimir 2ª Via do Talão</span>
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
