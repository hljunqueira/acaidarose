'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { RestaurantTable } from '@/types/tables'
import { CatalogData } from '@/types'
import { formatCurrency } from '@/lib/i18n/formatters'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import TableCheckoutDetail from './TableCheckoutDetail'
import PDVView from './PDVView'
import { Store, ShoppingBag } from 'lucide-react'

interface TablesHallViewProps {
  tenantId: string
  storePhone?: string | null
  currentUser: any
}

export default function TablesHallView({ tenantId, storePhone, currentUser }: TablesHallViewProps) {
  const [activeTab, setActiveTab] = useState<'MESAS' | 'BALCAO'>('MESAS')
  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [catalog, setCatalog] = useState<CatalogData>({ containers: [], bases: [], toppings: [] })
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Chamados de Garçom / Mesa
  const [waiterCalls, setWaiterCalls] = useState<Array<{
    id: string
    tableLabel: string
    reason: string
    createdAt: string
  }>>([])

  // ID da Mesa Selecionada
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)

  // Mesa Inicial para Montador
  const [montadorTable, setMontadorTable] = useState<RestaurantTable | null>(null)

  const fetchTables = useCallback(async () => {
    try {
      const [resTables, resCatalog, resCalls, resOrders] = await Promise.all([
        fetch(`/api/tables?tenantId=${encodeURIComponent(tenantId)}`),
        fetch(`/api/products?tenantId=${encodeURIComponent(tenantId)}`),
        fetch(`/api/call-waiter?tenantId=${encodeURIComponent(tenantId)}`),
        fetch(`/api/orders?tenantId=${encodeURIComponent(tenantId)}`),
      ])

      const [dataTables, dataCatalog, dataCalls, dataOrders] = await Promise.all([
        resTables.json(),
        resCatalog.json(),
        resCalls.json(),
        resOrders.json(),
      ])

      if (dataTables?.tables) {
        setTables(dataTables.tables)
      }
      if (dataCatalog) setCatalog(dataCatalog)
      if (dataCalls?.calls) setWaiterCalls(dataCalls.calls)
      if (Array.isArray(dataOrders?.orders)) {
        setOrders(dataOrders.orders)
      }
    } catch {
      // Falha suave
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  const handleResolveCall = async (callId: string) => {
    try {
      await fetch('/api/call-waiter', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId, status: 'RESOLVED' }),
      })
      setWaiterCalls((prev) => prev.filter((c) => c.id !== callId))
      toast.success('Chamado atendido!')
    } catch {
      toast.error('Erro ao atualizar chamado')
    }
  }

  useEffect(() => {
    fetchTables()
    // Polling a cada 3s para sincronização em tempo real das mesas e pedidos
    const timer = setInterval(fetchTables, 3000)
    return () => clearInterval(timer)
  }, [fetchTables])

  // Helper para obter dados de pedidos e clientes ativos de cada mesa
  const getTableActiveData = useCallback((tableNumber: number) => {
    const targetStr = String(tableNumber)
    const tableActiveOrders = orders.filter((o) => {
      const oTable = o.tableNumber ? String(o.tableNumber).replace(/^Mesa\s*/i, '').trim() : ''
      const isMatch = oTable === targetStr
      const isActive = o.status === 'NEW' || o.status === 'PREPARING' || o.status === 'READY' || o.status === 'OPEN' || o.status === 'AWAITING_PAYMENT'
      return isMatch && isActive
    })

    const isOrderPaid = (o: any) => {
      return (
        o.paymentStatus === 'PAID' ||
        o.payment_status === 'PAID' ||
        o.status === 'PAID' ||
        o.status === 'COMPLETED'
      )
    }

    const paidOrders = tableActiveOrders.filter(isOrderPaid)
    const pendingOrders = tableActiveOrders.filter((o) => !isOrderPaid(o))

    const paidAmount = paidOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0)
    const pendingAmount = pendingOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0)
    const totalValue = paidAmount + pendingAmount

    const customerNames = Array.from(
      new Set(
        tableActiveOrders
          .map((o) => o.customerName?.trim())
          .filter((name): name is string => Boolean(name && name.toLowerCase() !== 'balcão' && name.toLowerCase() !== 'balcao'))
      )
    )

    const activeItemsCount = tableActiveOrders.reduce((sum, o) => {
      if (Array.isArray(o.items)) return sum + o.items.length
      return sum + 1
    }, 0)

    const isFullyPaid = tableActiveOrders.length > 0 && pendingOrders.length === 0
    const hasPendingPayment = pendingOrders.length > 0

    return {
      activeOrders: tableActiveOrders,
      paidOrders,
      pendingOrders,
      paidAmount,
      pendingAmount,
      totalValue,
      customerNames,
      activeItemsCount,
      isOccupied: tableActiveOrders.length > 0,
      isFullyPaid,
      hasPendingPayment,
    }
  }, [orders])

  // Contadores Globais em Tempo Real
  const preparingOrdersCount = orders.filter((o) => o.status === 'PREPARING' || o.status === 'NEW').length
  const readyOrdersCount = orders.filter((o) => o.status === 'READY').length
  const activeTablesCount = tables.filter((t) => {
    const data = getTableActiveData(t.number)
    return data.isOccupied || t.status === 'OCCUPIED'
  }).length

  // Qualquer pedido com pagamento confirmado entra imediatamente no Faturamento e Vendas do Turno
  const completedOrders = orders.filter(
    (o) =>
      o.paymentStatus === 'PAID' ||
      o.payment_status === 'PAID' ||
      o.status === 'PAID' ||
      o.status === 'COMPLETED'
  )
  const salesCount = completedOrders.length
  const totalRevenue = completedOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0)

  const selectedTable = tables.find((t) => t.id === selectedTableId) || null

  const handleSelectTable = (t: RestaurantTable) => {
    setSelectedTableId(t.id)
  }

  const handleOpenFreeTable = (t: RestaurantTable) => {
    setMontadorTable(t)
    setActiveTab('BALCAO')
  }

  // Se estiver na tela detalhada de fechamento da mesa
  if (selectedTable) {
    const tableActiveInfo = getTableActiveData(selectedTable.number)
    if (tableActiveInfo.isOccupied || selectedTable.status === 'OCCUPIED') {
      return (
        <TableCheckoutDetail
          table={{
            ...selectedTable,
            total: tableActiveInfo.totalValue > 0 ? tableActiveInfo.totalValue : (selectedTable.total || 0),
          }}
          allTables={tables}
          orders={orders}
          catalog={catalog}
          storePhone={storePhone}
          onBack={() => {
            setSelectedTableId(null)
          }}
          onSelectOtherTable={(other) => setSelectedTableId(other.id)}
          onAddMoreItems={() => {
            setMontadorTable(selectedTable)
            setActiveTab('BALCAO')
            setSelectedTableId(null)
          }}
          onTableUpdated={fetchTables}
        />
      )
    }
  }

  return (
    <div className="space-y-5">
      {/* 1. Barra Superior Unificada: Abas + Contadores na Mesma Linha */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pb-3 border-b border-purple-100 dark:border-white/10">
        <div className="flex bg-white dark:bg-white/5 border border-purple-200 dark:border-white/10 p-1 rounded-2xl gap-1 shadow-xs shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('MESAS')
              setMontadorTable(null)
              setSelectedTableId(null)
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'MESAS'
                ? 'bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 text-white shadow-md shadow-purple-700/20'
                : 'text-purple-800 dark:text-purple-200/80 hover:text-purple-950 dark:hover:text-white hover:bg-purple-50 dark:hover:bg-white/5'
            }`}
          >
            <Store className="h-3.5 w-3.5" />
            <span>MESAS DO SALÃO</span>
            {activeTablesCount > 0 && (
              <Badge className="bg-white/25 text-white text-[9px] py-0 px-1.5 font-black ml-0.5 border-0">
                {activeTablesCount}
              </Badge>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('BALCAO')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'BALCAO'
                ? 'bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 text-white shadow-md shadow-purple-700/20'
                : 'text-purple-800 dark:text-purple-200/80 hover:text-purple-950 dark:hover:text-white hover:bg-purple-50 dark:hover:bg-white/5'
            }`}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>MONTADOR BALCÃO</span>
          </button>
        </div>

        {/* 4 Contadores Rápidos na mesma linha */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 flex-1 xl:max-w-3xl">
          <div className="px-3.5 py-2 rounded-2xl bg-white dark:bg-[#160228] border border-purple-100 dark:border-white/10 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-purple-900/70 dark:text-purple-200/70 uppercase">Em Preparação</div>
              <div className="text-[9px] text-purple-600 dark:text-purple-300">Cozinha / KDS</div>
            </div>
            <div className="text-xl font-black text-amber-500 font-mono">{preparingOrdersCount}</div>
          </div>

          <div className="px-3.5 py-2 rounded-2xl bg-white dark:bg-[#160228] border border-purple-100 dark:border-white/10 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-purple-900/70 dark:text-purple-200/70 uppercase">Prontos</div>
              <div className="text-[9px] text-purple-600 dark:text-purple-300">Balcão / Chamar</div>
            </div>
            <div className="text-xl font-black text-pink-600 font-mono">{readyOrdersCount}</div>
          </div>

          <div className="px-3.5 py-2 rounded-2xl bg-white dark:bg-[#160228] border border-purple-100 dark:border-white/10 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-purple-900/70 dark:text-purple-200/70 uppercase">Mesas Ativas</div>
              <div className="text-[9px] text-purple-600 dark:text-purple-300">Em Atendimento</div>
            </div>
            <div className="text-xl font-black text-purple-950 dark:text-white font-mono">{activeTablesCount}</div>
          </div>

          <div className="px-3.5 py-2 rounded-2xl bg-white dark:bg-[#160228] border border-purple-100 dark:border-white/10 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-purple-900/70 dark:text-purple-200/70 uppercase">Faturado Turno</div>
              <div className="text-[9px] text-purple-600 dark:text-purple-300">{salesCount} venda(s)</div>
            </div>
            <div className="text-sm font-black text-emerald-600 font-mono">{formatCurrency(totalRevenue)}</div>
          </div>
        </div>
      </div>

      {/* 3. Chamados de Mesa / Garçom */}
      {waiterCalls.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-500/40 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs font-black text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                {waiterCalls.length} Chamado(s) de Mesa
              </span>
            </div>
            <span className="text-[10px] text-amber-700 dark:text-amber-200 font-bold">Autoatendimento QR Code</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
            {waiterCalls.map((call) => (
              <div
                key={call.id}
                className="p-3 rounded-xl bg-white dark:bg-[#1a022d] border border-amber-300 dark:border-amber-500/30 shadow-xs flex items-center justify-between gap-2"
              >
                <div>
                  <div className="text-xs font-black text-purple-950 dark:text-white">
                    {call.tableLabel}
                  </div>
                  <div className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold">
                    {call.reason}
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => handleResolveCall(call.id)}
                  className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded-lg cursor-pointer"
                >
                  Atendido
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'BALCAO' ? (
        <div className="space-y-3">
          <PDVView
            tenantId={tenantId}
            storePhone={storePhone}
            initialTable={montadorTable}
            onBackToTables={() => {
              setActiveTab('MESAS')
              setMontadorTable(null)
              fetchTables()
            }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ========================================================= */}
          {/* SALÃO DE MESAS (LIVRES vs OCUPADAS MULTI-CLIENTE)          */}
          {/* ========================================================= */}
          <div className="lg:col-span-8 bg-white dark:bg-[#160228]/95 rounded-3xl border border-purple-150 dark:border-white/15 p-6 shadow-xs dark:shadow-xl">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-purple-100 dark:border-white/10">
              <h2 className="text-sm font-black text-purple-950 dark:text-white uppercase tracking-wider">
                Salão de Atendimento
              </h2>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-md bg-purple-700 dark:bg-pink-600 shadow-xs"></span>
                  <span className="text-purple-900/80 dark:text-purple-200/90 font-medium">Ocupada</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-md bg-purple-50 dark:bg-white/10 border border-purple-200 dark:border-white/20"></span>
                  <span className="text-purple-900/80 dark:text-purple-200/90 font-medium">Livre</span>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="py-16 text-center text-xs text-purple-700 dark:text-purple-200/70 font-bold">
                A carregar salão...
              </div>
            ) : tables.length === 0 ? (
              <div className="py-16 text-center text-xs text-purple-700/70 dark:text-purple-200/60 font-semibold">
                Nenhuma mesa configurada. Aceda ao menu "Mesas" para criar a numeração do salão.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {tables.map((t) => {
                  const tableData = getTableActiveData(t.number)
                  const isOccupied = tableData.isOccupied || t.status === 'OCCUPIED'
                  const displayTotal = tableData.totalValue > 0 ? tableData.totalValue : (t.total || 0)

                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        if (isOccupied) handleSelectTable(t)
                        else handleOpenFreeTable(t)
                      }}
                      className={`min-h-[135px] rounded-2xl border flex flex-col items-center justify-between p-4 text-center transition-all duration-150 cursor-pointer ${
                        isOccupied
                          ? 'bg-gradient-to-br from-purple-100/90 to-pink-100/90 dark:from-pink-950/80 dark:to-purple-950/90 border-purple-400 dark:border-pink-500 text-purple-950 dark:text-white shadow-md dark:shadow-pink-600/20 hover:scale-[1.02]'
                          : 'bg-purple-50/50 dark:bg-white/[0.04] text-purple-950 dark:text-white border-purple-200 dark:border-white/15 hover:border-purple-400 dark:hover:border-pink-500/50 hover:bg-purple-100/60 dark:hover:bg-white/10 hover:scale-[1.02]'
                      }`}
                    >
                      {/* Topo do Card: Número da Mesa + Badge com Status de Pagamento */}
                      <div className="flex items-center justify-between w-full">
                        <span className="text-lg font-black text-purple-950 dark:text-white">
                          Mesa {t.number}
                        </span>
                        {isOccupied ? (
                          tableData.isFullyPaid ? (
                            <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white font-extrabold text-[9px] py-0.5 px-2 rounded-full border-0 shadow-xs">
                              € {displayTotal.toFixed(2)} ✓ Pago
                            </Badge>
                          ) : (
                            <Badge className="bg-purple-700 dark:bg-pink-600 text-white font-extrabold text-[9px] py-0.5 px-2 rounded-full border-0 shadow-xs">
                              € {displayTotal.toFixed(2)}
                            </Badge>
                          )
                        ) : (
                          <Badge variant="outline" className="text-[9px] font-bold border-purple-200 dark:border-white/20 text-purple-700 dark:text-purple-300 py-0 px-1.5">
                            Livre
                          </Badge>
                        )}
                      </div>

                      {/* Corpo do Card: Nomes dos Clientes na Mesa ou Status */}
                      <div className="py-2 w-full text-center">
                        {isOccupied && tableData.customerNames.length > 0 ? (
                          <div className="space-y-0.5">
                            <div className="text-xs font-black text-purple-950 dark:text-pink-200 truncate px-1">
                              {tableData.customerNames.join(', ')}
                            </div>
                            <div className="text-[10px] text-purple-700 dark:text-purple-300 font-semibold">
                              {tableData.activeItemsCount} taça(s) em consumo
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs font-bold text-purple-700/80 dark:text-purple-200/70">
                            {isOccupied ? 'Em Consumo' : 'Disponível'}
                          </div>
                        )}
                      </div>

                      {/* Rodapé: Ação Inteligente (Ver Comanda vs Cobrar no Caixa vs + Abrir Mesa) */}
                      <div className="w-full pt-2 border-t border-purple-200/60 dark:border-white/10 text-[10.5px] font-black">
                        {isOccupied ? (
                          tableData.isFullyPaid ? (
                            <span className="text-purple-900 dark:text-pink-200 block font-black">
                              Ver Comanda ›
                            </span>
                          ) : (
                            <span className="text-emerald-700 dark:text-emerald-300 block font-black">
                              Cobrar no Caixa ›
                            </span>
                          )
                        ) : (
                          <span className="text-purple-600/70 dark:text-purple-300/60 block font-bold">
                            + Abrir Mesa
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* PAINEL LATERAL "STATUS CAIXA"                             */}
          {/* ========================================================= */}
          <div className="lg:col-span-4 bg-white dark:bg-[#160228]/95 rounded-3xl border border-purple-150 dark:border-white/15 p-6 shadow-xs dark:shadow-xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-purple-100 dark:border-white/10 mb-4">
                <h2 className="text-sm font-black text-purple-950 dark:text-white uppercase tracking-wider">
                  Status Caixa
                </h2>
                <Badge variant="outline" className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10">
                  Turno Ativo
                </Badge>
              </div>

              <div className="space-y-3">
                {/* Mesas Ativas */}
                <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-white/5 border border-purple-100 dark:border-white/10 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-purple-950 dark:text-white">Mesas Ativas</div>
                    <div className="text-[10px] text-purple-700/70 dark:text-purple-200/60 font-medium">Em atendimento no salão</div>
                  </div>
                  <div className="text-2xl font-black text-purple-950 dark:text-white font-mono">{activeTablesCount}</div>
                </div>

                {/* Vendas do Turno */}
                <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-white/5 border border-purple-100 dark:border-white/10 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-purple-950 dark:text-white">Vendas do Turno</div>
                    <div className="text-[10px] text-purple-700/70 dark:text-purple-200/60 font-medium">Comandas finalizadas</div>
                  </div>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{salesCount}</div>
                </div>

                {/* Total Faturado */}
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-emerald-950 dark:text-emerald-200">Total Faturado</div>
                    <div className="text-[10px] text-emerald-700/80 dark:text-emerald-300/70 font-medium">Recebido no turno</div>
                  </div>
                  <div className="text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
                    {formatCurrency(totalRevenue)}
                  </div>
                </div>
              </div>
            </div>

            {/* Botão Principal "Novo Pedido / Montar Açaí" */}
            <Button
              type="button"
              onClick={() => setActiveTab('BALCAO')}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-md cursor-pointer"
            >
              <span>Novo Pedido / Montar Açaí</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
