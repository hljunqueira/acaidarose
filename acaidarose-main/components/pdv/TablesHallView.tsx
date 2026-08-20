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
import { Store, ShoppingBag, Plus, RefreshCw } from 'lucide-react'

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

  // Mesa Selecionada para Detalhes / Fechamento
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null)

  // Mesa Inicial para Montador
  const [montadorTable, setMontadorTable] = useState<RestaurantTable | null>(null)

  // Dialogs
  const [searchOpen, setSearchOpen] = useState(false)
  const [cashierOpsOpen, setCashierOpsOpen] = useState(false)

  const fetchTables = useCallback(async () => {
    try {
      const [resTables, resCatalog] = await Promise.all([
        fetch(`/api/tables?tenantId=${encodeURIComponent(tenantId)}`),
        fetch(`/api/products?tenantId=${encodeURIComponent(tenantId)}`),
      ])

      const dataTables = await resTables.json()
      const dataCatalog = await resCatalog.json()

      if (dataTables.tables) {
        setTables(dataTables.tables)
        // Se a mesa selecionada ainda estiver aberta, atualizar seus dados
        if (selectedTable) {
          const updated = dataTables.tables.find((t: RestaurantTable) => t.id === selectedTable.id)
          if (updated) setSelectedTable(updated)
        }
      }
      if (dataCatalog) setCatalog(dataCatalog)
    } catch {
      toast.error('Erro ao carregar salão de mesas')
    } finally {
      setLoading(false)
    }
  }, [tenantId, selectedTable])

  useEffect(() => {
    fetchTables()
    // Polling a cada 8s para sincronização em tempo real das mesas
    const timer = setInterval(fetchTables, 8000)
    return () => clearInterval(timer)
  }, [fetchTables])

  const activeTablesCount = tables.filter((t) => t.status === 'OCCUPIED').length

  const handleSelectTable = (t: RestaurantTable) => {
    setSelectedTable(t)
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
          setSelectedTable(null)
          fetchTables()
        }}
        onSelectOtherTable={(other) => setSelectedTable(other)}
        onAddMoreItems={() => {
          setMontadorTable(selectedTable)
          setActiveTab('BALCAO')
          setSelectedTable(null)
        }}
        onTableUpdated={() => {
          fetchTables()
        }}
      />
    )
  }

  return (
    <div className="space-y-5">
      {/* Barra de Abas Superiores (MESAS vs BALCÃO) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-100">
        <div className="flex bg-purple-50 p-1 rounded-2xl gap-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('MESAS')
              setMontadorTable(null)
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'MESAS'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-purple-900 hover:bg-purple-100'
            }`}
          >
            <Store className="h-3.5 w-3.5" />
            <span>MESAS DO SALÃO</span>
            {activeTablesCount > 0 && (
              <Badge className="bg-white/20 text-white text-[9px] py-0 px-1 font-bold ml-0.5">
                {activeTablesCount}
              </Badge>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('BALCAO')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'BALCAO'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-purple-900 hover:bg-purple-100'
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
            onClick={() => setCashierOpsOpen(true)}
            className="text-xs font-bold border-purple-200 text-purple-900 hover:bg-purple-50 cursor-pointer"
          >
            Troco & Sangria
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSearchOpen(true)}
            className="text-xs font-bold border-purple-200 text-purple-900 hover:bg-purple-50 cursor-pointer"
          >
            Lista de Produtos
          </Button>
        </div>
      </div>

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
          {/* 🪑 SALÃO DE MESAS (LIVRES vs OCUPADAS)                     */}
          {/* ========================================================= */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-purple-100 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black text-foreground uppercase tracking-wider">
                Salão de Atendimento
              </h2>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-md bg-purple-900"></span>
                  <span className="text-muted-foreground font-semibold">Ocupada (Clique p/ Detalhes)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-md bg-zinc-200 border border-zinc-300"></span>
                  <span className="text-muted-foreground font-semibold">Livre</span>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="py-16 text-center text-xs text-muted-foreground font-bold">
                A carregar salão...
              </div>
            ) : tables.length === 0 ? (
              <div className="py-16 text-center text-xs text-muted-foreground">
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
                      className={`h-24 rounded-2xl border-2 flex flex-col items-center justify-center p-2 text-center transition-all duration-150 cursor-pointer ${
                        isOccupied
                          ? 'bg-purple-950 text-white border-purple-900 shadow-md shadow-purple-950/20 hover:scale-[1.02]'
                          : 'bg-zinc-50/70 text-zinc-700 border-zinc-200/80 hover:border-purple-300 hover:bg-purple-50/30'
                      }`}
                    >
                      <div className={`text-2xl font-black ${isOccupied ? 'text-white' : 'text-purple-950'}`}>
                        {t.number}
                      </div>
                      <div
                        className={`text-[10px] font-semibold truncate max-w-[120px] ${
                          isOccupied ? 'text-purple-200' : 'text-muted-foreground'
                        }`}
                      >
                        {t.nickname || (isOccupied ? 'Em Consumo' : 'Disponível')}
                      </div>
                      {isOccupied && (
                        <div className="text-[10px] text-fuchsia-300 font-mono font-black mt-0.5">
                          € {t.total?.toFixed(2) || '0.00'}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* 📊 PAINEL LATERAL "STATUS CAIXA"                          */}
          {/* ========================================================= */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-purple-100 p-6 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <h2 className="text-sm font-black text-foreground uppercase tracking-wider mb-4 border-b border-purple-100 pb-2">
                Status Caixa
              </h2>

              <div className="space-y-3">
                {/* Mesas Ativas */}
                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-purple-950">Mesas Ativas</div>
                    <div className="text-[10px] text-muted-foreground">Em atendimento no salão</div>
                  </div>
                  <div className="text-2xl font-black text-purple-950">{activeTablesCount}</div>
                </div>

                {/* Vendas */}
                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-purple-950">Vendas do Turno</div>
                    <div className="text-[10px] text-muted-foreground">Comandas finalizadas</div>
                  </div>
                  <div className="text-2xl font-black text-emerald-700">1</div>
                </div>

                {/* Cancelamentos */}
                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-purple-950">Cancelamentos</div>
                    <div className="text-[10px] text-muted-foreground">Estornos do dia</div>
                  </div>
                  <div className="text-2xl font-black text-red-600">0</div>
                </div>
              </div>
            </div>

            {/* Botão Verde "Abrir Mesa / Pedido Balcão" */}
            <Button
              type="button"
              onClick={() => setActiveTab('BALCAO')}
              className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md cursor-pointer gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Novo Pedido / Montar Açaí</span>
            </Button>
          </div>
        </div>
      )}

      {/* Modais */}
      <QuickProductSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        catalog={catalog}
        onSelectProduct={(item) => {
          toast.info(`Selecionado: ${item.name}`)
        }}
      />

      <CashierOperationsDialog
        open={cashierOpsOpen}
        onOpenChange={setCashierOpsOpen}
        tenantId={tenantId}
        operatorName={currentUser?.name || 'Operador'}
        onSuccess={fetchTables}
      />
    </div>
  )
}
