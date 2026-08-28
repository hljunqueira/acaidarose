'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Truck,
  Package,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Check,
  RefreshCw,
  Search,
  Edit2,
  Trash2,
  TrendingDown,
  DollarSign,
  Building2,
  Store,
  Boxes,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/stores/authStore'
import { formatCurrency } from '@/lib/i18n/formatters'
import { MasterInventoryItem, SupplyOrderRow } from '@/lib/repositories/inventoryRepository'
import InventoryItemDialog, { InventoryItemFormData } from '../inventory/InventoryItemDialog'
import ConfirmActionDialog from '@/components/ui/ConfirmActionDialog'
import StoreSupplyRaioXDialog from './StoreSupplyRaioXDialog'

interface StoreSupplyCardData {
  id: string
  name: string
  nif: string
  city: string
  address: string
  isHeadquarters: boolean
  active: boolean
}

const INITIAL_STORES: StoreSupplyCardData[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Açaí da Rose — Sede Franqueadora & Matriz Aveiro',
    nif: '500123456',
    city: 'Aveiro',
    address: 'Avenida Dr. Lourenço Peixinho 85',
    isHeadquarters: true,
    active: true,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Açaí da Rose — Filial Torres Novas',
    nif: '500789012',
    city: 'Torres Novas',
    address: 'Praça 5 de Outubro 12',
    isHeadquarters: false,
    active: true,
  },
]

export default function SupplyHubView() {
  const { authFetch } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'STORES_ORDERS' | 'CATALOG'>('STORES_ORDERS')
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>('ALL')
  const [orders, setOrders] = useState<SupplyOrderRow[]>([])
  const [masterItems, setMasterItems] = useState<MasterInventoryItem[]>([])
  const [stores, setStores] = useState<StoreSupplyCardData[]>(INITIAL_STORES)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Modais de Gestão
  const [itemDialogOpen, setItemDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItemFormData | null>(null)
  const [selectedStoreForRaioX, setSelectedStoreForRaioX] = useState<StoreSupplyCardData | null>(null)

  const [confirmState, setConfirmState] = useState<{
    open: boolean
    title: string
    description?: string
    onConfirm: () => Promise<void> | void
  }>({
    open: false,
    title: '',
    onConfirm: () => {},
  })

  const loadData = useCallback(async (isManual = false) => {
    setLoading(true)
    try {
      // 1. Carrega pedidos B2B
      const resOrders = await authFetch('/api/supply-orders')
      if (resOrders.ok) {
        const data = await resOrders.json()
        if (Array.isArray(data.orders)) setOrders(data.orders)
      }

      // 2. Carrega catálogo de insumos
      const resCatalog = await authFetch('/api/inventory?scope=master')
      if (resCatalog.ok) {
        const data = await resCatalog.json()
        if (Array.isArray(data.items)) setMasterItems(data.items)
      }

      // 3. Carrega lojas ativas
      const resStores = await authFetch('/api/franchise/overview')
      if (resStores.ok) {
        const data = await resStores.json()
        if (data.overview?.stores) {
          const mapped = data.overview.stores.map((s: any) => ({
            id: s.tenant.id,
            name: s.tenant.name,
            nif: s.tenant.nif,
            city: s.tenant.city,
            address: s.tenant.address,
            isHeadquarters: s.tenant.isHeadquarters,
            active: s.tenant.active,
          }))
          setStores(mapped)
        }
      }
      if (isManual) toast.success('Central de abastecimento atualizada!')
    } catch {
      if (isManual) toast.error('Erro ao sincronizar abastecimento')
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  useEffect(() => {
    loadData(false)
  }, [loadData])

  const handleApproveAndShip = async (id: string, orderNum: number) => {
    try {
      const res = await authFetch(`/api/supply-orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'SHIPPED' }),
      })
      if (!res.ok) throw new Error('Falha ao despachar pedido')
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: 'SHIPPED' } : o))
      )
      toast.success(`Pedido #${orderNum} despachado e Guia de Transporte emitida!`)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao despachar pedido')
    }
  }

  const handleSaveHomologatedItem = async (formData: InventoryItemFormData) => {
    try {
      if (formData.id) {
        const res = await authFetch(`/api/inventory/${formData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        if (!res.ok) throw new Error('Falha ao atualizar insumo')
        toast.success('Insumo homologado atualizado com sucesso!')
      } else {
        const res = await authFetch('/api/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        if (!res.ok) throw new Error('Falha ao cadastrar insumo')
        toast.success('Novo insumo homologado cadastrado na rede!')
      }
      loadData(false)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar insumo')
    }
  }

  const handleDeleteItem = (id: string, name: string) => {
    setConfirmState({
      open: true,
      title: 'Remover Insumo do Catálogo B2B',
      description: `Deseja realmente excluir "${name}" do catálogo homologado da rede? As filiais não poderão mais requisitá-lo.`,
      onConfirm: async () => {
        try {
          const res = await authFetch(`/api/inventory/${id}`, { method: 'DELETE' })
          if (!res.ok) throw new Error('Falha ao excluir insumo')
          toast.success('Insumo removido do catálogo com sucesso!')
          setConfirmState((prev) => ({ ...prev, open: false }))
          loadData(false)
        } catch (err: any) {
          toast.error(err.message || 'Erro ao remover insumo')
        }
      },
    })
  }

  // Cálculos Globais de Gestão
  const totalB2BRevenue = orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0)
  const totalNetworkSavings = orders.reduce((acc, o) => acc + (o.totalSavings || 0), 0)
  const pendingOrdersCount = orders.filter((o) => o.status === 'PENDING').length
  const totalHomologatedItems = masterItems.length

  // Filtragem
  const filteredOrders = orders.filter((o) => {
    const orderStoreName = o.tenantName || ''
    const matchesSearch =
      orderStoreName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(o.orderNumber).includes(searchTerm)
    const matchesStore =
      selectedStoreFilter === 'ALL' ||
      orderStoreName.toLowerCase().includes(
        stores.find((s) => s.id === selectedStoreFilter)?.name.toLowerCase() || ''
      )
    return matchesSearch && matchesStore
  })

  const filteredItems = masterItems.filter(
    (i) =>
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Header Corporativo com Alinhamento Perfeito */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-150 dark:border-white/15">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-white/5 text-purple-700 dark:text-pink-400 border border-purple-150 dark:border-white/10 shadow-xs">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-purple-950 dark:text-white tracking-tight">
              Central de Abastecimento & Expedição
            </h1>
            <p className="text-xs sm:text-sm text-purple-700/80 dark:text-purple-200/70 font-medium">
              Gestão de insumos homologados, pedidos de reposição e acompanhamento de abastecimento por loja
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={() => loadData(true)}
            disabled={loading}
            className="h-9 px-3 text-xs font-bold gap-1.5 rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-purple-950 dark:text-white cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </Button>

          {activeTab === 'CATALOG' && (
            <Button
              size="sm"
              onClick={() => {
                setEditingItem(null)
                setItemDialogOpen(true)
              }}
              className="h-9 px-3.5 bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 hover:from-purple-800 hover:to-pink-700 text-white font-black text-xs rounded-xl cursor-pointer shadow-md"
            >
              <span>Novo Insumo Homologado</span>
            </Button>
          )}
        </div>
      </div>

      {/* 4 Cards de Gestão Executiva (KPIs Globais) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 bg-white dark:bg-[#160228] text-purple-950 dark:text-white rounded-3xl border border-purple-150 dark:border-white/15 shadow-xs">
          <div className="flex justify-between items-start">
            <div className="text-xs text-purple-700/80 dark:text-purple-300/70 font-bold">
              Faturação B2B da Rede
            </div>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-white/5 text-purple-700 dark:text-pink-400 border border-purple-150 dark:border-white/10">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black mt-2 tracking-tight text-purple-950 dark:text-white font-mono">
            {formatCurrency(totalB2BRevenue)}
          </div>
          <div className="text-[11px] text-purple-600/80 dark:text-purple-200/70 font-medium mt-1">
            Volume total fornecido às filiais
          </div>
        </Card>

        <Card className="p-5 bg-white dark:bg-[#160228] text-purple-950 dark:text-white rounded-3xl border border-purple-150 dark:border-white/15 shadow-xs">
          <div className="flex justify-between items-start">
            <div className="text-xs text-purple-700/80 dark:text-purple-300/70 font-bold">
              Encomendas Pendentes
            </div>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-2 tracking-tight">
            {pendingOrdersCount} <span className="text-xs font-normal text-purple-700/70 dark:text-purple-300/60">pedidos</span>
          </div>
          <div className="text-[11px] text-amber-800 dark:text-amber-300/80 font-semibold mt-1">
            Aguardando expedição na matriz
          </div>
        </Card>

        <Card className="p-5 bg-white dark:bg-[#160228] text-purple-950 dark:text-white rounded-3xl border border-purple-150 dark:border-white/15 shadow-xs">
          <div className="flex justify-between items-start">
            <div className="text-xs text-purple-700/80 dark:text-purple-300/70 font-bold">
              Economia Gerada p/ a Rede
            </div>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2 tracking-tight font-mono">
            {formatCurrency(totalNetworkSavings)}
          </div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-300/70 font-semibold mt-1">
            Diferença apurada vs mercado
          </div>
        </Card>

        <Card className="p-5 bg-white dark:bg-[#160228] text-purple-950 dark:text-white rounded-3xl border border-purple-150 dark:border-white/15 shadow-xs">
          <div className="flex justify-between items-start">
            <div className="text-xs text-purple-700/80 dark:text-purple-300/70 font-bold">
              Insumos Homologados
            </div>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-white/5 text-purple-700 dark:text-pink-400 border border-purple-150 dark:border-white/10">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-950 dark:text-white mt-2 tracking-tight">
            {totalHomologatedItems} <span className="text-xs font-normal text-purple-700/70 dark:text-purple-300/60">itens</span>
          </div>
          <div className="text-[11px] text-purple-600/80 dark:text-purple-200/70 font-medium mt-1">
            Disponíveis no catálogo B2B
          </div>
        </Card>
      </div>

      {/* Navegação por Abas Limpas */}
      <div className="flex gap-2 p-1 bg-purple-50/70 dark:bg-white/5 rounded-2xl w-fit border border-purple-150 dark:border-white/10">
        <button
          type="button"
          onClick={() => setActiveTab('STORES_ORDERS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'STORES_ORDERS'
              ? 'bg-purple-700 dark:bg-pink-600 text-white shadow-xs'
              : 'text-purple-900 dark:text-purple-200/80 hover:text-purple-950 dark:hover:text-white'
          }`}
        >
          Raio-X por Loja & Encomendas
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('CATALOG')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'CATALOG'
              ? 'bg-purple-700 dark:bg-pink-600 text-white shadow-xs'
              : 'text-purple-900 dark:text-purple-200/80 hover:text-purple-950 dark:hover:text-white'
          }`}
        >
          Catálogo de Insumos B2B ({masterItems.length})
        </button>
      </div>

      {/* CONTEÚDO DA ABA 1: RAIO-X POR LOJA & ENCOMENDAS */}
      {activeTab === 'STORES_ORDERS' && (
        <div className="space-y-6">
          {/* Pílulas de Filtro por Unidade */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => setSelectedStoreFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-full font-bold transition-all cursor-pointer shrink-0 ${
                selectedStoreFilter === 'ALL'
                  ? 'bg-purple-700 dark:bg-pink-600 text-white shadow-xs'
                  : 'bg-white dark:bg-white/5 border border-purple-150 dark:border-white/10 text-purple-950 dark:text-purple-200/80 hover:bg-purple-50 dark:hover:bg-white/10'
              }`}
            >
              Todas as Unidades ({stores.length})
            </button>

            {stores.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedStoreFilter(s.id)}
                className={`px-3.5 py-1.5 rounded-full font-bold transition-all cursor-pointer shrink-0 ${
                  selectedStoreFilter === s.id
                    ? 'bg-purple-700 dark:bg-pink-600 text-white shadow-xs'
                    : 'bg-white dark:bg-white/5 border border-purple-150 dark:border-white/10 text-purple-950 dark:text-purple-200/80 hover:bg-purple-50 dark:hover:bg-white/10'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>

          {/* Cards de Raio-X de Abastecimento por Loja */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {stores
              .filter((s) => selectedStoreFilter === 'ALL' || s.id === selectedStoreFilter)
              .map((store) => {
                const storeOrdersList = orders.filter((o) => {
                  const name = o.tenantName || ''
                  return (
                    name.toLowerCase().includes(store.name.toLowerCase()) ||
                    store.name.toLowerCase().includes(name.toLowerCase())
                  )
                })
                const storeSpent = storeOrdersList.reduce((acc, o) => acc + (o.totalAmount || 0), 0)
                const storeSavings = storeOrdersList.reduce((acc, o) => acc + (o.totalSavings || 0), 0)
                const storePendingCount = storeOrdersList.filter((o) => o.status === 'PENDING').length

                return (
                  <Card
                    key={store.id}
                    className="p-5 bg-white dark:bg-[#160228] text-purple-950 dark:text-white rounded-3xl border border-purple-150 dark:border-white/15 shadow-xs space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-white/5 text-purple-700 dark:text-pink-400 border border-purple-150 dark:border-white/10">
                          {store.isHeadquarters ? (
                            <Building2 className="h-5 w-5" />
                          ) : (
                            <Store className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-black text-purple-950 dark:text-white">
                            {store.name}
                          </div>
                          <div className="text-xs text-purple-700/80 dark:text-purple-200/70 font-medium">
                            {store.city} · NIF: <span className="font-mono font-bold">{store.nif}</span>
                          </div>
                        </div>
                      </div>

                      <Badge
                        className={`text-[10px] font-bold ${
                          store.isHeadquarters
                            ? 'bg-purple-700 text-white'
                            : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        {store.isHeadquarters ? 'Matriz HQ' : 'Filial Ativa'}
                      </Badge>
                    </div>

                    {/* Métricas Internas do Raio-X */}
                    <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-purple-50/60 dark:bg-white/5 border border-purple-100 dark:border-white/10 text-center">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-purple-700/80 dark:text-purple-300/70">
                          Consumo Insumos
                        </div>
                        <div className="text-sm font-black text-purple-950 dark:text-white font-mono mt-0.5">
                          {formatCurrency(storeSpent)}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] uppercase font-bold text-purple-700/80 dark:text-purple-300/70">
                          Encomendas
                        </div>
                        <div className="text-sm font-black text-purple-950 dark:text-white mt-0.5">
                          {storeOrdersList.length}{' '}
                          {storePendingCount > 0 && (
                            <span className="text-xs font-bold text-amber-600">
                              ({storePendingCount} pend.)
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300">
                          Economia Gerada
                        </div>
                        <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                          +{formatCurrency(storeSavings)}
                        </div>
                      </div>
                    </div>

                    {/* Botão de Ação do Card */}
                    <div className="pt-1 flex items-center justify-between">
                      <div className="text-xs text-purple-700/80 dark:text-purple-300/70 font-medium">
                        {store.address}
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedStoreForRaioX(store)}
                        className="h-8 px-3 rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 text-xs font-bold text-purple-950 dark:text-white hover:bg-purple-50 dark:hover:bg-white/10 cursor-pointer shadow-2xs"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1 text-purple-700 dark:text-pink-400" />
                        <span>Ver Raio-X de Suprimentos</span>
                      </Button>
                    </div>
                  </Card>
                )
              })}
          </div>

          {/* Tabela de Encomendas Recebidas das Franquias */}
          <Card className="border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228] rounded-3xl overflow-hidden shadow-xs">
            <CardHeader className="p-4 sm:p-5 border-b border-purple-150 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-black text-purple-950 dark:text-white">
                  Fila de Encomendas Recebidas das Franquias
                </CardTitle>
                <p className="text-xs text-purple-700/80 dark:text-purple-200/70 font-medium mt-0.5">
                  Reposições solicitadas pelas filiais aguardando despacho e emissão de guia
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
                <Input
                  placeholder="Pesquisar por pedido ou loja..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-8 text-xs rounded-xl border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228] text-purple-950 dark:text-white"
                />
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-purple-50/70 dark:bg-white/5 border-b border-purple-150 dark:border-white/10 text-[11px] font-black uppercase text-purple-900/80 dark:text-purple-300/70">
                    <tr>
                      <th className="py-3 px-4">Nº Pedido</th>
                      <th className="py-3 px-4">Franquia Solicitante</th>
                      <th className="py-3 px-4">Data / Hora (Portugal)</th>
                      <th className="py-3 px-4">Volumes</th>
                      <th className="py-3 px-4">Valor Total</th>
                      <th className="py-3 px-4">Economia Gerada</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-100 dark:divide-white/5">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="py-8 text-center text-purple-700/80 dark:text-purple-300/70 text-xs font-medium"
                        >
                          Nenhuma encomenda de reposição encontrada.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => (
                        <tr
                          key={order.id}
                          className="hover:bg-purple-50/50 dark:hover:bg-white/5 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-mono font-black text-purple-950 dark:text-white">
                            #{order.orderNumber}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-purple-950 dark:text-white">
                            {order.tenantName || 'Filial'}
                          </td>
                          <td className="py-3.5 px-4 text-purple-700/80 dark:text-purple-300/70 text-[11px]">
                            {new Date(order.createdAt).toLocaleString('pt-PT', {
                              timeZone: 'Europe/Lisbon',
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-purple-950 dark:text-white">
                            {order.items?.length || 0} volumes
                          </td>
                          <td className="py-3.5 px-4 font-mono font-black text-purple-950 dark:text-pink-300 text-sm">
                            {formatCurrency(order.totalAmount)}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            +{formatCurrency(order.totalSavings || 0)}
                          </td>
                          <td className="py-3.5 px-4">
                            {order.status === 'PENDING' && (
                              <Badge className="bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                                Pendente
                              </Badge>
                            )}
                            {order.status === 'SHIPPED' && (
                              <Badge className="bg-purple-500/20 text-purple-700 dark:text-pink-300 border border-purple-500/40 text-[10px] font-bold">
                                Em Transporte
                              </Badge>
                            )}
                            {order.status === 'DELIVERED' && (
                              <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                                Entregue
                              </Badge>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {order.status === 'PENDING' ? (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleApproveAndShip(order.id, order.orderNumber)
                                }
                                className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs"
                              >
                                <Check className="h-3.5 w-3.5 mr-1" />
                                <span>Despachar Carga</span>
                              </Button>
                            ) : (
                              <Badge variant="outline" className="text-[10px] font-bold border-purple-200 dark:border-white/15">
                                Guia Emitida
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CONTEÚDO DA ABA 2: CATÁLOGO DE INSUMOS B2B */}
      {activeTab === 'CATALOG' && (
        <Card className="border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228] rounded-3xl overflow-hidden shadow-xs">
          <CardHeader className="p-4 sm:p-5 border-b border-purple-150 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-black text-purple-950 dark:text-white">
                Catálogo de Insumos Homologados da Rede
              </CardTitle>
              <p className="text-xs text-purple-700/80 dark:text-purple-200/70 font-medium mt-0.5">
                Tabela de preços de venda B2B e comparação com o mercado oficial
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
              <Input
                placeholder="Pesquisar insumo ou categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-8 text-xs rounded-xl border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228] text-purple-950 dark:text-white"
              />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-purple-50/70 dark:bg-white/5 border-b border-purple-150 dark:border-white/10 text-[11px] font-black uppercase text-purple-900/80 dark:text-purple-300/70">
                  <tr>
                    <th className="py-3 px-4">Insumo Homologado</th>
                    <th className="py-3 px-4">Categoria</th>
                    <th className="py-3 px-4">Preço Venda B2B</th>
                    <th className="py-3 px-4">Preço Mercado</th>
                    <th className="py-3 px-4">Economia Franqueado</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100 dark:divide-white/5">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-8 text-center text-purple-700/80 dark:text-purple-300/70 text-xs font-medium"
                      >
                        Nenhum insumo homologado encontrado.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const savings = (item.marketPrice || 0) - (item.supplyPrice || 0)
                      const savingsPercent =
                        item.marketPrice && item.marketPrice > 0
                          ? Math.round((savings / item.marketPrice) * 100)
                          : 0

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-purple-50/50 dark:hover:bg-white/5 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-bold text-purple-950 dark:text-white">
                            <div>{item.name}</div>
                            <div className="text-[10px] text-purple-700/70 dark:text-purple-300/60 font-mono">
                              Unidade: {item.unit}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge
                              variant="outline"
                              className="text-[10px] font-bold border-purple-200 dark:border-white/15"
                            >
                              {item.category}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-black text-purple-950 dark:text-pink-300 text-sm">
                            {formatCurrency(item.supplyPrice || 0)}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-purple-700/60 dark:text-purple-300/60">
                            {formatCurrency(item.marketPrice || 0)}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {savings > 0 ? (
                              <span>
                                +{formatCurrency(savings)} ({savingsPercent}%)
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingItem({
                                    id: item.id,
                                    name: item.name,
                                    category: item.category,
                                    unit: item.unit,
                                    marketPrice: item.marketPrice,
                                    supplyPrice: item.supplyPrice,
                                    isCriticalChecklist: item.isCriticalChecklist,
                                  })
                                  setItemDialogOpen(true)
                                }}
                                className="h-7 w-7 p-0 text-purple-700 dark:text-pink-400 hover:bg-purple-50 dark:hover:bg-white/10 rounded-lg cursor-pointer"
                                title="Editar insumo"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteItem(item.id, item.name)}
                                className="h-7 w-7 p-0 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg cursor-pointer"
                                title="Excluir insumo"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
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
          </CardContent>
        </Card>
      )}

      {/* Modal de Cadastro / Edição de Insumo */}
      <InventoryItemDialog
        open={itemDialogOpen}
        onOpenChange={setItemDialogOpen}
        item={editingItem}
        onSave={handleSaveHomologatedItem}
        isMaster={true}
      />

      {/* Modal de Raio-X Detalhado de Abastecimento da Loja */}
      {selectedStoreForRaioX && (
        <StoreSupplyRaioXDialog
          open={!!selectedStoreForRaioX}
          onOpenChange={(o) => !o && setSelectedStoreForRaioX(null)}
          storeName={selectedStoreForRaioX.name}
          storeNif={selectedStoreForRaioX.nif}
          storeCity={selectedStoreForRaioX.city}
          orders={orders}
          onApproveOrder={handleApproveAndShip}
        />
      )}

      {/* Modal Customizado de Confirmação */}
      <ConfirmActionDialog
        open={confirmState.open}
        onOpenChange={(o) => setConfirmState((prev) => ({ ...prev, open: o }))}
        title={confirmState.title}
        description={confirmState.description}
        confirmLabel="Excluir Insumo"
        variant="destructive"
        onConfirm={confirmState.onConfirm}
      />
    </div>
  )
}
