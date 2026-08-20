'use client'

import React, { useState, useEffect } from 'react'
import { FranchiseNetworkOverview, StoreOverview, Tenant } from '@/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/stores/authStore'
import { useFranchiseStore } from '@/lib/stores/franchiseStore'
import { formatCurrency } from '@/lib/i18n/formatters'
import StoreMetricsCard from './StoreMetricsCard'
import StoreDetailsDialog from './StoreDetailsDialog'
import CreateStoreDialog from './CreateStoreDialog'
import {
  Building2,
  Plus,
  TrendingUp,
  ShoppingBag,
  Users,
  Store,
  Search,
  Sparkles,
  ShieldCheck,
  CreditCard,
} from 'lucide-react'

export default function FranchiseAdmin() {
  const [overview, setOverview] = useState<FranchiseNetworkOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedDetails, setSelectedDetails] = useState<StoreOverview | null>(null)
  const { authFetch } = useAuthStore()
  const { currentTenant, setCurrentTenant } = useFranchiseStore()

  const loadNetworkData = async () => {
    setLoading(true)
    try {
      const res = await authFetch('/api/franchise/overview')
      const data = await res.json()
      setOverview(data)
    } catch {
      toast.error('Erro ao carregar dados da rede de franquias')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNetworkData()
  }, [])

  const handleCreateStore = async (payload: any) => {
    const res = await authFetch('/api/tenants', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error('Falha ao criar loja')
    toast.success('Nova franquia criada com sucesso!')
    loadNetworkData()
  }

  const filteredStores = (overview?.stores || []).filter(
    (s) =>
      s.tenant.name.toLowerCase().includes(search.toLowerCase()) ||
      s.tenant.slug.toLowerCase().includes(search.toLowerCase()) ||
      (s.tenant.address && s.tenant.address.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header Corporativo */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-purple-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-purple-100 text-purple-800 text-xs font-black mb-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Açaí da Rose · Franqueadora Matriz</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            Gestão da Rede de Franquias
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Visão consolidada de faturamento, comandas e equipas de operadores em todas as unidades
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setCreateOpen(true)}
          className="bg-gradient-to-r from-purple-700 to-fuchsia-700 hover:from-purple-800 hover:to-fuchsia-800 text-white font-extrabold text-xs rounded-xl shadow-md gap-1.5 h-10 px-4"
        >
          <Plus className="h-4 w-4" />
          <span>Cadastrar Nova Franquia</span>
        </Button>
      </div>

      {/* 4 Cards de KPIs Consolidados da Rede */}
      {overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="p-4 sm:p-5 bg-gradient-to-br from-purple-900 to-fuchsia-950 text-white rounded-3xl border-0 shadow-xl">
            <div className="flex justify-between items-center text-purple-200 text-xs font-bold mb-2">
              <span>Faturação Total Rede</span>
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black">{formatCurrency(overview.totalRevenue)}</div>
            <div className="text-[11px] text-purple-200/80 mt-1">Consolidado do dia</div>
          </Card>

          <Card className="p-4 sm:p-5 bg-white rounded-3xl border-2 border-purple-100 shadow-sm">
            <div className="flex justify-between items-center text-muted-foreground text-xs font-bold mb-2">
              <span>Comandas Emitidas</span>
              <ShoppingBag className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-foreground">{overview.totalOrders}</div>
            <div className="text-[11px] text-muted-foreground mt-1">Ticket médio: <b>{formatCurrency(overview.networkAverageTicket)}</b></div>
          </Card>

          <Card className="p-4 sm:p-5 bg-white rounded-3xl border-2 border-purple-100 shadow-sm">
            <div className="flex justify-between items-center text-muted-foreground text-xs font-bold mb-2">
              <span>Lojas em Operação</span>
              <Store className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-foreground">{overview.activeStores}</div>
            <div className="text-[11px] text-muted-foreground mt-1">Unidades ativas na rede</div>
          </Card>

          <Card className="p-4 sm:p-5 bg-white rounded-3xl border-2 border-purple-100 shadow-sm">
            <div className="flex justify-between items-center text-muted-foreground text-xs font-bold mb-2">
              <span>Operadores Ativos</span>
              <Users className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-foreground">{overview.totalOperators}</div>
            <div className="text-[11px] text-muted-foreground mt-1">Máx. 3 operadores por loja</div>
          </Card>
        </div>
      )}

      {/* Barra de Filtro e Busca */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar loja por nome, cidade ou slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl border-purple-200"
          />
        </div>
        <div className="text-xs text-muted-foreground font-semibold self-center">
          Mostrando <b>{filteredStores.length}</b> lojas na rede
        </div>
      </div>

      {/* Grid de Lojas */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground text-sm">A carregar rede de franquias...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStores.map((storeOverview) => (
            <StoreMetricsCard
              key={storeOverview.tenant.id}
              storeOverview={storeOverview}
              isCurrent={currentTenant.id === storeOverview.tenant.id}
              onSelectStore={(selected) => {
                setCurrentTenant(selected)
                toast.success(`Loja ativa alterada para: ${selected.name}`)
              }}
              onViewDetails={(selected) => setSelectedDetails(selected)}
            />
          ))}
        </div>
      )}

      {/* Modal de Detalhes / Raio-X da Loja */}
      <StoreDetailsDialog
        open={!!selectedDetails}
        onOpenChange={(open) => !open && setSelectedDetails(null)}
        storeOverview={selectedDetails}
        onSelectStore={(selected) => {
          setCurrentTenant(selected)
          toast.success(`Loja ativa alterada para: ${selected.name}`)
        }}
      />

      {/* Modal de Criação de Franquia */}
      <CreateStoreDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSave={handleCreateStore}
      />
    </div>
  )
}
