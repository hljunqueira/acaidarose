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
  Layers,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/stores/authStore'
import { formatCurrency } from '@/lib/i18n/formatters'
import { MasterInventoryItem, SupplyOrderRow } from '@/lib/repositories/inventoryRepository'
import InventoryItemDialog, { InventoryItemFormData } from '../inventory/InventoryItemDialog'

export default function SupplyHubView() {
  const { authFetch } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'ORDERS' | 'CATALOG'>('ORDERS')
  const [orders, setOrders] = useState<SupplyOrderRow[]>([])
  const [masterItems, setMasterItems] = useState<MasterInventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Modais do Catálogo Mestre
  const [itemDialogOpen, setItemDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItemFormData | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      // 1. Carrega pedidos B2B
      const resOrders = await authFetch('/api/supply-orders')
      if (resOrders.ok) {
        const data = await resOrders.json()
        if (Array.isArray(data.orders)) setOrders(data.orders)
      }

      // 2. Carrega catálogo mestre
      const resCatalog = await authFetch('/api/inventory?scope=master')
      if (resCatalog.ok) {
        const data = await resCatalog.json()
        if (Array.isArray(data.items)) setMasterItems(data.items)
      }
    } catch {
      toast.error('Erro ao carregar dados de abastecimento')
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  useEffect(() => {
    loadData()
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
      toast.success(`Pedido #${orderNum} despachado e Guia de Transporte gerada!`)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao despachar pedido')
    }
  }

  const handleSaveMasterItem = async (formData: InventoryItemFormData) => {
    try {
      if (formData.id) {
        const res = await authFetch(`/api/inventory/${formData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        if (!res.ok) throw new Error('Falha ao atualizar insumo mestre')
        toast.success('Insumo mestre atualizado!')
      } else {
        const res = await authFetch('/api/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        if (!res.ok) throw new Error('Falha ao cadastrar insumo mestre')
        toast.success('Novo insumo homologado cadastrado na rede!')
      }
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar insumo mestre')
    }
  }

  const handleDeleteMasterItem = async (id: string, name: string) => {
    if (!confirm(`Deseja remover "${name}" do catálogo mestre oficial da rede?`)) return
    try {
      const res = await authFetch(`/api/inventory/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Falha ao excluir insumo mestre')
      toast.success('Insumo mestre removido com sucesso!')
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao remover insumo mestre')
    }
  }

  const filteredMasterItems = masterItems.filter(
    (i) =>
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const pendingOrdersCount = orders.filter((o) => o.status === 'PENDING').length

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
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
              Gestão corporativa de insumos homologados e expedição de pedidos para as franquias
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={loadData}
            className="h-9 text-xs font-bold gap-1.5 rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-purple-950 dark:text-white cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </Button>

          {activeTab === 'CATALOG' && (
            <Button
              onClick={() => {
                setEditingItem(null)
                setItemDialogOpen(true)
              }}
              size="sm"
              className="h-9 px-3.5 bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 hover:from-purple-800 hover:to-pink-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-xs"
            >
              <span>Novo Insumo Mestre</span>
            </Button>
          )}
        </div>
      </div>

      {/* Pílulas de Navegação */}
      <div className="flex items-center gap-1.5 p-1 bg-purple-50/70 dark:bg-white/5 rounded-2xl border border-purple-150 dark:border-white/10 w-fit shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('ORDERS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'ORDERS'
              ? 'bg-gradient-to-r from-purple-700 to-pink-600 text-white shadow-xs'
              : 'text-purple-900 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white hover:bg-purple-100/50 dark:hover:bg-white/5'
          }`}
        >
          <span>Pedidos de Reposição da Rede</span>
          {pendingOrdersCount > 0 && (
            <Badge className="bg-amber-400 text-purple-950 text-[10px] font-black py-0 px-1.5">
              {pendingOrdersCount}
            </Badge>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('CATALOG')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'CATALOG'
              ? 'bg-gradient-to-r from-purple-700 to-pink-600 text-white shadow-xs'
              : 'text-purple-900 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white hover:bg-purple-100/50 dark:hover:bg-white/5'
          }`}
        >
          <span>Catálogo Mestre de Insumos ({masterItems.length})</span>
        </button>
      </div>

      {/* ABA 1: PEDIDOS DE REPOSIÇÃO B2B */}
      {activeTab === 'ORDERS' && (
        <Card className="border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228] rounded-3xl overflow-hidden shadow-xs">
          <CardHeader className="p-4 sm:p-5 border-b border-purple-150 dark:border-white/10">
            <CardTitle className="text-sm font-black text-purple-950 dark:text-white">
              Pedidos de Reposição Recebidos das Franquias
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-purple-50/70 dark:bg-white/5 border-b border-purple-150 dark:border-white/10 text-[11px] font-black uppercase text-purple-900/80 dark:text-purple-300/70">
                  <tr>
                    <th className="py-3 px-4">Nº Pedido</th>
                    <th className="py-3 px-4">Franquia Solicitante</th>
                    <th className="py-3 px-4">Data/Hora</th>
                    <th className="py-3 px-4">Volumes</th>
                    <th className="py-3 px-4">Valor Total</th>
                    <th className="py-3 px-4">Economia Gerada</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100 dark:divide-white/5">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-purple-50/50 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4 font-black text-purple-950 dark:text-white font-mono">
                        #{order.orderNumber}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-purple-900 dark:text-purple-200">
                        {order.tenantName || 'Filial Franquiada'}
                      </td>
                      <td className="py-3.5 px-4 text-purple-700/80 dark:text-purple-300/70 text-[11px]">
                        {new Date(order.createdAt).toLocaleString('pt-PT', { timeZone: 'Europe/Lisbon', dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-purple-950 dark:text-white">
                        {order.items?.length || 0} artigos
                      </td>
                      <td className="py-3.5 px-4 font-black text-purple-950 dark:text-white font-mono">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">
                        +{formatCurrency(order.totalSavings)}
                      </td>
                      <td className="py-3.5 px-4">
                        {order.status === 'PENDING' && (
                          <Badge className="bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 font-bold text-[10px]">
                            Pendente
                          </Badge>
                        )}
                        {order.status === 'SHIPPED' && (
                          <Badge className="bg-purple-500/20 text-purple-700 dark:text-pink-300 border border-purple-500/40 font-bold text-[10px]">
                            Em Trânsito
                          </Badge>
                        )}
                        {order.status === 'DELIVERED' && (
                          <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 font-bold text-[10px]">
                            Entregue
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {order.status === 'PENDING' ? (
                          <Button
                            onClick={() => handleApproveAndShip(order.id, order.orderNumber)}
                            size="sm"
                            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Despachar</span>
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              window.print()
                            }}
                            className="h-8 rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 text-purple-950 dark:text-white text-xs font-bold gap-1.5 cursor-pointer"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            <span>Guia</span>
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ABA 2: CATÁLOGO MESTRE DE INSUMOS DA FRANQUEADORA */}
      {activeTab === 'CATALOG' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400" />
            <Input
              placeholder="Pesquisar insumo mestre (ex: Açaí, Nutella, Copos)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 rounded-2xl border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228] text-xs text-purple-950 dark:text-white"
            />
          </div>

          <Card className="border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228] rounded-3xl overflow-hidden shadow-xs">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-purple-50/70 dark:bg-white/5 border-b border-purple-150 dark:border-white/10 text-[11px] font-black uppercase text-purple-900/80 dark:text-purple-300/70">
                    <tr>
                      <th className="py-3 px-4">Insumo Homologado</th>
                      <th className="py-3 px-4">Categoria</th>
                      <th className="py-3 px-4">Unidade</th>
                      <th className="py-3 px-4">Preço Mercado (€)</th>
                      <th className="py-3 px-4">Preço Matriz (€)</th>
                      <th className="py-3 px-4">Economia / Vantagem</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-100 dark:divide-white/5">
                    {filteredMasterItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-purple-700/80 dark:text-purple-300/70 text-xs font-medium">
                          Nenhum insumo mestre cadastrado no catálogo corporativo. Clique em <b>Novo Insumo Mestre</b> para cadastrar.
                        </td>
                      </tr>
                    ) : (
                      filteredMasterItems.map((item) => {
                        const diff = item.marketPrice - item.supplyPrice
                        const diffPercent = item.marketPrice > 0 ? (diff / item.marketPrice) * 100 : 0

                        return (
                          <tr key={item.id} className="hover:bg-purple-50/50 dark:hover:bg-white/5 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-purple-950 dark:text-white">
                              <div className="flex items-center gap-2">
                                <span>{item.name}</span>
                                {item.isCriticalChecklist && (
                                  <Badge className="bg-purple-100 dark:bg-pink-500/20 text-purple-800 dark:text-pink-300 text-[8px] py-0 font-bold">
                                    Checklist
                                  </Badge>
                                )}
                              </div>
                            </td>
                          <td className="py-3.5 px-4">
                            <Badge variant="outline" className="border-purple-200 dark:border-white/10 text-[10px] font-semibold text-purple-900 dark:text-purple-200">
                              {item.category}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-purple-700/80 dark:text-purple-300/70">
                            {item.unit}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-purple-700/80 dark:text-purple-300/70">
                            {formatCurrency(item.marketPrice)}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-black text-purple-950 dark:text-pink-300 text-sm">
                            {formatCurrency(item.supplyPrice)}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">
                            {diff > 0 ? `-${formatCurrency(diff)} (${diffPercent.toFixed(0)}%)` : 'Preço Base'}
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
                                title="Editar insumo mestre"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteMasterItem(item.id, item.name)}
                                className="h-7 w-7 p-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg cursor-pointer"
                                title="Excluir insumo mestre"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    }))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Cadastro/Edição Mestre */}
      <InventoryItemDialog
        open={itemDialogOpen}
        onOpenChange={setItemDialogOpen}
        item={editingItem}
        onSave={handleSaveMasterItem}
        isMaster={true}
      />
    </div>
  )
}
