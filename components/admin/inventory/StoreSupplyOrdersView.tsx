'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, TrendingDown, Send, CheckCircle2, RefreshCw, PackageCheck, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/stores/authStore'
import { formatCurrency } from '@/lib/i18n/formatters'
import { MasterInventoryItem, SupplyOrderRow } from '@/lib/repositories/inventoryRepository'

export default function StoreSupplyOrdersView({ tenantId = '11111111-1111-1111-1111-111111111111' }: { tenantId?: string }) {
  const { authFetch } = useAuthStore()
  const [catalog, setCatalog] = useState<MasterInventoryItem[]>([])
  const [orders, setOrders] = useState<SupplyOrderRow[]>([])
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      // 1. Carrega catálogo mestre oficial
      const resCat = await authFetch('/api/inventory?scope=master')
      if (resCat.ok) {
        const data = await resCat.json()
        if (Array.isArray(data.items)) {
          setCatalog(data.items)
        }
      }

      // 2. Carrega histórico de pedidos da loja
      const resOrders = await authFetch(`/api/supply-orders?tenantId=${tenantId}`)
      if (resOrders.ok) {
        const data = await resOrders.json()
        if (Array.isArray(data.orders)) {
          setOrders(data.orders)
        }
      }
    } catch {
      toast.error('Erro ao carregar catálogo de reposição')
    } finally {
      setLoading(false)
    }
  }, [tenantId, authFetch])

  useEffect(() => {
    loadData()
  }, [loadData])

  const totalHQ = catalog.reduce((acc, item) => acc + (quantities[item.id] || 0) * item.supplyPrice, 0)
  const totalMarket = catalog.reduce((acc, item) => acc + (quantities[item.id] || 0) * item.marketPrice, 0)
  const totalSavings = totalMarket - totalHQ

  const handleSendOrder = async () => {
    const selectedItems = catalog
      .filter((it) => (quantities[it.id] || 0) > 0)
      .map((it) => ({
        itemId: it.id,
        name: it.name,
        unit: it.unit,
        quantity: quantities[it.id],
        unitPrice: it.supplyPrice,
        total: (quantities[it.id] || 0) * it.supplyPrice,
      }))

    if (selectedItems.length === 0) {
      toast.error('Selecione pelo menos um item para enviar o pedido')
      return
    }

    setSubmitting(true)
    try {
      const res = await authFetch('/api/supply-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          items: selectedItems,
          totalAmount: totalHQ,
          totalSavings,
        }),
      })

      if (!res.ok) throw new Error('Falha ao enviar pedido de reposição')
      toast.success('Pedido de reposição enviado à Matriz com sucesso!')
      setQuantities({})
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar pedido')
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmReceive = async (orderId: string, orderNumber: number) => {
    try {
      const res = await authFetch(`/api/supply-orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'DELIVERED',
          tenantId,
        }),
      })
      if (!res.ok) throw new Error('Falha ao confirmar recebimento')
      toast.success(`Carga do Pedido #${orderNumber} confirmada! Saldo creditado no estoque local.`)
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao confirmar recebimento')
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-150 dark:border-white/15">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-white/5 text-purple-700 dark:text-pink-400 border border-purple-150 dark:border-white/10 shadow-xs">
            <ShoppingCart className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-purple-950 dark:text-white tracking-tight">
              Reposição de Insumos com a Matriz
            </h1>
            <p className="text-xs sm:text-sm text-purple-700/80 dark:text-purple-200/70 font-medium">
              Tabela de preços exclusivos para franqueados e comparador de economia em tempo real
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

          <Button
            onClick={handleSendOrder}
            disabled={totalHQ === 0 || submitting}
            size="sm"
            className="h-9 bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 hover:from-purple-800 hover:to-pink-700 text-white rounded-xl text-xs font-black gap-2 cursor-pointer shadow-xs"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{submitting ? 'A enviar...' : 'Enviar Pedido à Matriz'}</span>
          </Button>
        </div>
      </div>

      {/* Banner de Economia Garantida */}
      <Card className="border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs rounded-3xl">
        <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-emerald-600 text-white shadow-md">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-black text-emerald-950 dark:text-emerald-300">
                Vantagem Exclusiva de Comprar pela Franqueadora
              </div>
              <p className="text-xs text-emerald-800 dark:text-emerald-400/80 font-medium">
                Economia estimada neste pedido vs distribuidor externo: <strong>+{formatCurrency(totalSavings)}</strong>
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-purple-700/80 dark:text-purple-300/70 font-semibold">Total do Pedido:</div>
            <div className="text-2xl font-black text-purple-950 dark:text-white font-mono">{formatCurrency(totalHQ)}</div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Insumos para Pedido */}
      <Card className="border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228] rounded-3xl overflow-hidden shadow-xs">
        <CardHeader className="p-4 sm:p-5 border-b border-purple-150 dark:border-white/10">
          <CardTitle className="text-sm font-black text-purple-950 dark:text-white">
            Catálogo Homologado para Montagem de Pedido
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-purple-50/70 dark:bg-white/5 border-b border-purple-150 dark:border-white/10 text-[11px] font-black uppercase text-purple-900/80 dark:text-purple-300/70">
                <tr>
                  <th className="py-3 px-4">Insumo Homologado</th>
                  <th className="py-3 px-4">Unidade</th>
                  <th className="py-3 px-4">Preço Mercado</th>
                  <th className="py-3 px-4">Preço Matriz</th>
                  <th className="py-3 px-4">Economia / Un</th>
                  <th className="py-3 px-4 text-center">Quantidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100 dark:divide-white/5">
                {catalog.map((item) => {
                  const savings = item.marketPrice - item.supplyPrice
                  const qty = quantities[item.id] || 0
                  return (
                    <tr key={item.id} className="hover:bg-purple-50/50 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-purple-950 dark:text-white">{item.name}</td>
                      <td className="py-3.5 px-4 font-medium text-purple-700/80 dark:text-purple-300/70">{item.unit}</td>
                      <td className="py-3.5 px-4 text-purple-700/70 dark:text-purple-300/60 line-through font-mono">
                        {formatCurrency(item.marketPrice)}
                      </td>
                      <td className="py-3.5 px-4 font-black text-purple-950 dark:text-pink-300 font-mono text-sm">
                        {formatCurrency(item.supplyPrice)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">
                        -{formatCurrency(savings)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setQuantities((prev) => ({ ...prev, [item.id]: Math.max(0, qty - 1) }))}
                            className="h-8 w-8 rounded-xl bg-purple-100 dark:bg-white/10 font-black hover:bg-purple-200 text-purple-950 dark:text-white cursor-pointer transition flex items-center justify-center"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-mono font-black text-purple-950 dark:text-white text-sm">{qty}</span>
                          <button
                            type="button"
                            onClick={() => setQuantities((prev) => ({ ...prev, [item.id]: qty + 1 }))}
                            className="h-8 w-8 rounded-xl bg-purple-100 dark:bg-white/10 font-black hover:bg-purple-200 text-purple-950 dark:text-white cursor-pointer transition flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Pedidos de Reposição da Loja */}
      {orders.length > 0 && (
        <Card className="border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228] rounded-3xl overflow-hidden shadow-xs">
          <CardHeader className="p-4 sm:p-5 border-b border-purple-150 dark:border-white/10">
            <CardTitle className="text-sm font-black text-purple-950 dark:text-white">
              Histórico de Pedidos Enviados à Matriz
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-purple-50/70 dark:bg-white/5 border-b border-purple-150 dark:border-white/10 text-[11px] font-black uppercase text-purple-900/80 dark:text-purple-300/70">
                  <tr>
                    <th className="py-3 px-4">Nº Pedido</th>
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4">Volumes</th>
                    <th className="py-3 px-4">Valor Total</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100 dark:divide-white/5">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-purple-50/50 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4 font-black font-mono text-purple-950 dark:text-white">
                        #{o.orderNumber}
                      </td>
                      <td className="py-3.5 px-4 text-purple-700/80 dark:text-purple-300/70">
                        {new Date(o.createdAt).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-purple-950 dark:text-white">
                        {o.items?.length || 0} artigos
                      </td>
                      <td className="py-3.5 px-4 font-black font-mono text-purple-950 dark:text-white">
                        {formatCurrency(o.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4">
                        {o.status === 'PENDING' && (
                          <Badge className="bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 font-bold text-[10px]">
                            Aguardando Matriz
                          </Badge>
                        )}
                        {o.status === 'SHIPPED' && (
                          <Badge className="bg-purple-500/20 text-purple-700 dark:text-pink-300 border border-purple-500/40 font-bold text-[10px]">
                            Em Transporte
                          </Badge>
                        )}
                        {o.status === 'DELIVERED' && (
                          <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 font-bold text-[10px]">
                            Recebido no Estoque
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {o.status === 'SHIPPED' && (
                          <Button
                            onClick={() => handleConfirmReceive(o.id, o.orderNumber)}
                            size="sm"
                            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer gap-1.5"
                          >
                            <PackageCheck className="h-3.5 w-3.5" />
                            <span>Confirmar Recebimento</span>
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
    </div>
  )
}
