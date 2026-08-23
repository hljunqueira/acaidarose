'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { RestaurantTable } from '@/types/tables'
import { CatalogData } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import TableCheckoutDetail from './TableCheckoutDetail'
import QuickProductSearchDialog from './QuickProductSearchDialog'
import CashierOperationsDialog from './CashierOperationsDialog'
import PDVView from './PDVView'
import { Store, ShoppingBag, Plus, RefreshCw, Printer } from 'lucide-react'

interface TablesHallViewProps {
  tenantId: string
  storePhone?: string | null
  currentUser: any
}

export default function TablesHallView({ tenantId, storePhone, currentUser }: TablesHallViewProps) {
  const [activeTab, setActiveTab] = useState<'MESAS' | 'BALCAO'>('MESAS')
  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [catalog, setCatalog] = useState<CatalogData>({ containers: [], bases: [], toppings: [] })
  const [loading, setLoading] = useState(true)

  // Chamados de Garçom / Mesa
  const [waiterCalls, setWaiterCalls] = useState<Array<{
    id: string
    tableLabel: string
    reason: string
    createdAt: string
  }>>([])

  // ID da Mesa Selecionada (ID estável evita loops de re-render)
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)

  // Mesa Inicial para Montador
  const [montadorTable, setMontadorTable] = useState<RestaurantTable | null>(null)

  // Dialogs
  const [searchOpen, setSearchOpen] = useState(false)
  const [cashierOpsOpen, setCashierOpsOpen] = useState(false)

  const fetchTables = useCallback(async () => {
    try {
      const [resTables, resCatalog, resCalls] = await Promise.all([
        fetch(`/api/tables?tenantId=${encodeURIComponent(tenantId)}`),
        fetch(`/api/products?tenantId=${encodeURIComponent(tenantId)}`),
        fetch(`/api/call-waiter?tenantId=${encodeURIComponent(tenantId)}`),
      ])

      const dataTables = await resTables.json()
      const dataCatalog = await resCatalog.json()
      const dataCalls = await resCalls.json()

      if (dataTables?.tables) {
        setTables(dataTables.tables)
      }
      if (dataCatalog) setCatalog(dataCatalog)
      if (dataCalls?.calls) setWaiterCalls(dataCalls.calls)
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
    // Polling a cada 8s para sincronização em tempo real das mesas
    const timer = setInterval(fetchTables, 8000)
    return () => clearInterval(timer)
  }, [fetchTables])

  const selectedTable = tables.find((t) => t.id === selectedTableId) || null
  const activeTablesCount = tables.filter((t) => t.status === 'OCCUPIED').length

  const handleSelectTable = (t: RestaurantTable) => {
    setSelectedTableId(t.id)
  }

  const handleOpenFreeTable = (t: RestaurantTable) => {
    setMontadorTable(t)
    setActiveTab('BALCAO')
  }

  // Se estiver na tela detalhada de fechamento da mesa
  if (selectedTable && selectedTable.status === 'OCCUPIED') {
    return (
      <TableCheckoutDetail
        table={selectedTable}
        allTables={tables}
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

  return (
    <div className="space-y-5">
      {/* Barra de Abas Superiores (MESAS vs BALCÃO) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-100 dark:border-white/10">
        <div className="flex bg-white dark:bg-white/5 border border-purple-200 dark:border-white/10 p-1 rounded-2xl gap-1 shadow-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab('MESAS')
              setMontadorTable(null)
              setSelectedTableId(null)
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'MESAS'
                ? 'bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 text-white shadow-md shadow-purple-700/20 dark:shadow-pink-600/30'
                : 'text-purple-800 dark:text-purple-200/80 hover:text-purple-950 dark:hover:text-white hover:bg-purple-50 dark:hover:bg-white/5'
            }`}
          >
            <Store className="h-3.5 w-3.5" />
            <span>MESAS DO SALÃO</span>
            {activeTablesCount > 0 && (
              <Badge className="bg-white/20 text-white text-[9px] py-0 px-1.5 font-bold ml-0.5 border-0">
                {activeTablesCount}
              </Badge>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('BALCAO')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'BALCAO'
                ? 'bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 text-white shadow-md shadow-purple-700/20 dark:shadow-pink-600/30'
                : 'text-purple-800 dark:text-purple-200/80 hover:text-purple-950 dark:hover:text-white hover:bg-purple-50 dark:hover:bg-white/5'
            }`}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>MONTADOR BALCÃO</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSearchOpen(true)}
            className="text-xs font-bold border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-purple-950 dark:text-white cursor-pointer rounded-xl h-9 shadow-xs"
          >
            Lista de Produtos
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCashierOpsOpen(true)}
            className="text-xs font-bold border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-purple-950 dark:text-white cursor-pointer rounded-xl h-9 shadow-xs"
          >
            Troco & Sangria
          </Button>
        </div>
      </div>

      {/* BANNER DE CHAMADOS DE MESA / ATENDENTE */}
      {waiterCalls.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-500/40 animate-pulse space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping" />
              <span className="text-xs font-black text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                {waiterCalls.length} Chamado(s) de Mesa Ativo(s)
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

                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      window.print()
                      toast.success(`Ticket da ${call.tableLabel} impresso!`)
                    }}
                    title="Imprimir ticket do chamado"
                    className="h-8 w-8 p-0 border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 hover:bg-amber-100 rounded-lg cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleResolveCall(call.id)}
                    className="h-8 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded-lg cursor-pointer"
                  >
                    Atendido
                  </Button>
                </div>
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
          {/* SALÃO DE MESAS (LIVRES vs OCUPADAS)                       */}
          {/* ========================================================= */}
          <div className="lg:col-span-8 bg-white dark:bg-[#160228]/95 rounded-3xl border border-purple-150 dark:border-white/15 p-6 shadow-xs dark:shadow-xl">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-purple-100 dark:border-white/10">
              <h2 className="text-sm font-black text-purple-950 dark:text-white uppercase tracking-wider">
                Salão de Atendimento
              </h2>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-md bg-purple-700 dark:bg-pink-600 shadow-xs"></span>
                  <span className="text-purple-900/80 dark:text-purple-200/90 font-medium">Ocupada (Clique p/ Ver Pedido)</span>
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                {tables.map((t) => {
                  const isOccupied = t.status === 'OCCUPIED'

                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        if (isOccupied) handleSelectTable(t)
                        else handleOpenFreeTable(t)
                      }}
                      className={`min-h-[110px] rounded-2xl border flex flex-col items-center justify-between p-3 text-center transition-all duration-150 cursor-pointer ${
                        isOccupied
                          ? 'bg-gradient-to-br from-purple-100 to-pink-100 dark:from-pink-950/80 dark:to-purple-950/90 border-purple-400 dark:border-pink-500 text-purple-950 dark:text-white shadow-md dark:shadow-pink-600/20 hover:scale-[1.02]'
                          : 'bg-purple-50/50 dark:bg-white/[0.04] text-purple-950 dark:text-white border-purple-200 dark:border-white/15 hover:border-purple-400 dark:hover:border-pink-500/50 hover:bg-purple-100/60 dark:hover:bg-white/10 hover:scale-[1.02]'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xl font-black text-purple-950 dark:text-white">
                          {t.number}
                        </span>
                        {isOccupied ? (
                          <Badge className="bg-purple-700 dark:bg-pink-600 text-white font-extrabold text-[9px] py-0.5 px-2 rounded-full border-0">
                            € {t.total?.toFixed(2) || '0.00'}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] font-bold border-purple-200 dark:border-white/20 text-purple-700 dark:text-purple-300 py-0 px-1.5">
                            Livre
                          </Badge>
                        )}
                      </div>

                      <div className="py-1">
                        <div
                          className={`text-xs font-bold truncate max-w-[130px] ${
                            isOccupied ? 'text-purple-900 dark:text-pink-200' : 'text-purple-700/80 dark:text-purple-200/70'
                          }`}
                        >
                          {t.nickname || (isOccupied ? 'Em Consumo' : 'Disponível')}
                        </div>
                      </div>

                      <div className="w-full pt-1 border-t border-purple-200/60 dark:border-white/10 text-[10px] font-black">
                        {isOccupied ? (
                          <span className="text-purple-800 dark:text-pink-300 flex items-center justify-center gap-1">
                            Ver Pedido & Receber ›
                          </span>
                        ) : (
                          <span className="text-purple-600/70 dark:text-purple-300/60">
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
              <h2 className="text-sm font-black text-purple-950 dark:text-white uppercase tracking-wider mb-4 border-b border-purple-100 dark:border-white/10 pb-2">
                Status Caixa
              </h2>

              <div className="space-y-3">
                {/* Mesas Ativas */}
                <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-white/5 border border-purple-100 dark:border-white/10 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-purple-950 dark:text-white">Mesas Ativas</div>
                    <div className="text-[10px] text-purple-700/70 dark:text-purple-200/60 font-medium">Em atendimento no salão</div>
                  </div>
                  <div className="text-2xl font-black text-purple-950 dark:text-white">{activeTablesCount}</div>
                </div>

                {/* Vendas */}
                <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-white/5 border border-purple-100 dark:border-white/10 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-purple-950 dark:text-white">Vendas do Turno</div>
                    <div className="text-[10px] text-purple-700/70 dark:text-purple-200/60 font-medium">Comandas finalizadas</div>
                  </div>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">1</div>
                </div>

                {/* Cancelamentos */}
                <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-white/5 border border-purple-100 dark:border-white/10 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-purple-950 dark:text-white">Cancelamentos</div>
                    <div className="text-[10px] text-purple-700/70 dark:text-purple-200/60 font-medium">Estornos do dia</div>
                  </div>
                  <div className="text-2xl font-black text-pink-600 dark:text-pink-400">0</div>
                </div>
              </div>
            </div>

            {/* Botão Verde "Abrir Mesa / Pedido Balcão" */}
            <Button
              type="button"
              onClick={() => setActiveTab('BALCAO')}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-md cursor-pointer gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Novo Pedido / Montar Açaí</span>
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs Auxiliares */}
      <QuickProductSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        catalog={catalog}
        onSelectProduct={() => {
          setSearchOpen(false)
          setActiveTab('BALCAO')
        }}
      />

      <CashierOperationsDialog
        open={cashierOpsOpen}
        onOpenChange={setCashierOpsOpen}
        tenantId={tenantId}
        operatorName={currentUser?.name || 'Operador Caixa'}
      />
    </div>
  )
}
