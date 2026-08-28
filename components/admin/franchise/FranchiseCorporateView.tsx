'use client'

import React, { useState, useEffect } from 'react'
import { StoreOverview, FranchiseNetworkOverview, User } from '@/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/i18n/formatters'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/stores/authStore'
import { useFranchiseStore } from '@/lib/stores/franchiseStore'
import StoreMetricsCard from './StoreMetricsCard'
import CreateStoreDialog from './CreateStoreDialog'
import StoreDetailsDialog from './StoreDetailsDialog'
import EditRoyaltyDialog, { FranchiseContractData } from './EditRoyaltyDialog'
import FranchiseReportDialog from './FranchiseReportDialog'
import UserEditDialog from '../users/UserEditDialog'
import {
  Building2,
  TrendingUp,
  Store,
  Users,
  RefreshCw,
  FileText,
  DollarSign,
  ShieldCheck,
  UserCheck,
  ArrowUpRight,
  Trash2,
} from 'lucide-react'

const INITIAL_CONTRACTS: FranchiseContractData[] = [
  {
    id: 'cont-001',
    storeName: 'Açaí da Rose — Sede Franqueadora & Matriz Aveiro',
    franchiseeName: 'Rose & Vavá Portugal Lda — Sede Corporativa',
    nif: '500123456',
    startDate: '15/01/2024',
    renewalDate: '15/01/2029',
    franchiseFee: 25000.0,
    monthsActive: 24,
    royaltyPercent: 0.0,
    marketingPercent: 1.0,
    systemFeeMonthly: 0.0,
    status: 'ATIVO',
    paymentStatus: 'PAID',
    monthlyRevenue: 28450.0,
    gracePeriodNotes: 'Unidade Sede Matriz (Isenta de Taxa de Sistema)',
  },
  {
    id: 'cont-002',
    storeName: 'Açaí da Rose — Filial Torres Novas',
    franchiseeName: 'Açaí Torres Novas Franquias Lda',
    nif: '500789012',
    startDate: '10/06/2024',
    renewalDate: '10/06/2029',
    franchiseFee: 25000.0,
    monthsActive: 14,
    royaltyPercent: 5.0,
    marketingPercent: 1.0,
    systemFeeMonthly: 99.0,
    status: 'ATIVO',
    paymentStatus: 'PAID',
    monthlyRevenue: 24350.0,
  },
]

const DEFAULT_NETWORK_OVERVIEW: FranchiseNetworkOverview = {
  totalRevenue: 52800.0,
  totalOrders: 2150,
  networkAverageTicket: 24.55,
  totalStores: 2,
  activeStores: 2,
  totalOperators: 6,
  stores: [
    {
      tenant: {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Açaí da Rose — Sede Franqueadora & Matriz Aveiro',
        companyName: 'Rose & Vavá Portugal Lda — Franqueadora',
        slug: 'aveiro',
        nif: '500123456',
        address: 'Avenida Dr. Lourenço Peixinho 85',
        postalCode: '3800-165',
        city: 'Aveiro',
        phone: '+351 913 550 770',
        mbwayPhone: '+351 913 550 770',
        currency: 'EUR',
        isHeadquarters: true,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      metrics: {
        todayRevenue: 1840.0,
        todayOrdersCount: 78,
        averageTicket: 23.58,
        activeOperatorsCount: 3,
        maxOperators: 4,
        mbwaySharePercent: 76,
      },
      manager: {
        id: 'usr-1',
        name: 'Henrique Linhares Junqueira',
        email: 'henrique@acaidarose.pt',
        role: 'SUPER_ADMIN',
        active: true,
      },
      operators: [
        { id: 'usr-1', name: 'Henrique Junqueira', email: 'henrique@acaidarose.pt', role: 'SUPER_ADMIN', active: true },
        { id: 'usr-2', name: 'Rosemeri Linhares', email: 'rose@acaidarose.pt', role: 'TENANT_ADMIN', active: true },
        { id: 'usr-3', name: 'Operador Aveiro 1', email: 'caixa1.aveiro@acaidarose.pt', role: 'CASHIER', active: true },
      ],
    },
    {
      tenant: {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Açaí da Rose — Filial Torres Novas',
        companyName: 'Açaí Torres Novas Franquias Lda',
        slug: 'torres-novas',
        nif: '500789012',
        address: 'Praça 5 de Outubro 12',
        postalCode: '2350-754',
        city: 'Torres Novas',
        phone: '+351 912 345 678',
        mbwayPhone: '+351 912 345 678',
        currency: 'EUR',
        isHeadquarters: false,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      metrics: {
        todayRevenue: 1350.0,
        todayOrdersCount: 56,
        averageTicket: 24.1,
        activeOperatorsCount: 2,
        maxOperators: 3,
        mbwaySharePercent: 68,
      },
      manager: {
        id: 'usr-4',
        name: 'Gerente Torres Novas',
        email: 'gerente.tn@acaidarose.pt',
        role: 'TENANT_ADMIN',
        active: true,
      },
      operators: [
        { id: 'usr-4', name: 'Gerente Torres Novas', email: 'gerente.tn@acaidarose.pt', role: 'TENANT_ADMIN', active: true },
        { id: 'usr-5', name: 'Operador TN 1', email: 'caixa1.tn@acaidarose.pt', role: 'CASHIER', active: true },
      ],
    },
  ],
}

export default function FranchiseCorporateView() {
  const { authFetch } = useAuthStore()
  const { currentTenant, setCurrentTenant } = useFranchiseStore()
  const [overview, setOverview] = useState<FranchiseNetworkOverview>(DEFAULT_NETWORK_OVERVIEW)
  const [contracts, setContracts] = useState<FranchiseContractData[]>(INITIAL_CONTRACTS)
  const [loading, setLoading] = useState(false)
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>('ALL')

  // Modais de Controle
  const [createOpen, setCreateOpen] = useState(false)
  const [detailsStore, setDetailsStore] = useState<StoreOverview | null>(null)
  const [editingContract, setEditingContract] = useState<FranchiseContractData | null>(null)
  const [reportOpen, setReportOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [userDialogOpen, setUserDialogOpen] = useState(false)

  const loadNetworkData = async () => {
    setLoading(true)
    try {
      const res = await authFetch('/api/franchise/overview')
      if (res.ok) {
        const data = await res.json()
        if (data.overview) setOverview(data.overview)
      }
    } catch {
      // Fallback gracioso para dados locais
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNetworkData()
  }, [])

  const handleCreateStore = async (data: any) => {
    try {
      const res = await authFetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Falha ao criar unidade')
      toast.success('Nova franquia criada com sucesso!')
      loadNetworkData()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar franquia')
    }
  }

  const handleSaveContract = (updated: FranchiseContractData) => {
    setContracts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
    toast.success(`Contrato da unidade atualizado com sucesso!`)
  }

  const handleSaveUser = async (user: User) => {
    try {
      const method = user.id ? 'PUT' : 'POST'
      const url = user.id ? `/api/users/${user.id}` : '/api/users'
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      })
      if (!res.ok) throw new Error('Falha ao salvar utilizador')
      toast.success(user.id ? 'Utilizador atualizado com sucesso!' : 'Novo operador cadastrado!')
      setUserDialogOpen(false)
      loadNetworkData()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar utilizador')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Deseja realmente remover o acesso deste utilizador?')) return
    try {
      const res = await authFetch(`/api/users/${userId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Falha ao remover utilizador')
      toast.success('Utilizador removido com sucesso!')
      loadNetworkData()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao remover utilizador')
    }
  }

  const totalRoyalties = contracts.reduce((acc, c) => acc + (c.monthlyRevenue * (c.royaltyPercent / 100)), 0)
  const totalSystemFees = contracts.reduce((acc, c) => acc + (c.systemFeeMonthly ?? 99), 0)
  const totalMarketing = contracts.reduce((acc, c) => acc + (c.monthlyRevenue * (c.marketingPercent / 100)), 0)
  const totalNetworkRevenue = contracts.reduce((acc, c) => acc + c.monthlyRevenue, 0)

  return (
    <div className="space-y-6">
      {/* Header Corporativo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-purple-150 dark:border-white/15">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-purple-950 dark:text-white tracking-tight flex items-center gap-2.5">
            <Building2 className="h-6 w-6 text-purple-700 dark:text-pink-400" />
            <span>Gestão Corporativa & Franqueadora</span>
          </h1>
          <p className="text-xs sm:text-sm text-purple-700/80 dark:text-purple-200/70 font-medium mt-0.5">
            Contratos, faturamento consolidado da rede, royalties progressivos e governança de unidades
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={loadNetworkData}
            className="h-9 text-xs font-bold gap-1.5 rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-purple-950 dark:text-white cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setReportOpen(true)}
            className="h-9 text-xs font-bold gap-1.5 rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-purple-950 dark:text-white cursor-pointer shadow-2xs"
          >
            <FileText className="h-3.5 w-3.5 text-purple-700 dark:text-pink-400" />
            <span>Mapa Contábil</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="h-9 px-3.5 bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 hover:from-purple-800 hover:to-pink-700 text-white text-xs font-black rounded-xl cursor-pointer transition shadow-xs"
          >
            <span>Nova Franquia</span>
          </Button>
        </div>
      </div>

      {/* 4 KPIs Globais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <Card className="p-5 bg-white dark:bg-[#160228] text-purple-950 dark:text-white rounded-3xl border border-purple-150 dark:border-white/15 shadow-xs">
          <div className="flex justify-between items-start">
            <div className="text-xs text-purple-700/80 dark:text-purple-300/70 font-bold">Faturamento da Rede (Mês)</div>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-white/5 text-purple-700 dark:text-pink-400 border border-purple-150 dark:border-white/10">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black mt-2 tracking-tight text-purple-950 dark:text-white font-mono">
            {formatCurrency(totalNetworkRevenue)}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
            +18.4% vs mês anterior
          </div>
        </Card>

        {/* KPI 2 */}
        <Card className="p-5 bg-white dark:bg-[#160228] text-purple-950 dark:text-white rounded-3xl border border-purple-150 dark:border-white/15 shadow-xs">
          <div className="flex justify-between items-start">
            <div className="text-xs text-purple-700/80 dark:text-purple-300/70 font-bold">Royalties & Sistema</div>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-white/5 text-purple-700 dark:text-pink-400 border border-purple-150 dark:border-white/10">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-950 dark:text-white mt-2 tracking-tight font-mono">
            {formatCurrency(totalRoyalties + totalSystemFees)}
          </div>
          <div className="text-[11px] text-purple-600/80 dark:text-purple-200/70 font-medium mt-1">
            Royalties + Licença Sistema (€ {totalSystemFees}/mês)
          </div>
        </Card>

        {/* KPI 3 */}
        <Card className="p-5 bg-white dark:bg-[#160228] text-purple-950 dark:text-white rounded-3xl border border-purple-150 dark:border-white/15 shadow-xs">
          <div className="flex justify-between items-start">
            <div className="text-xs text-purple-700/80 dark:text-purple-300/70 font-bold">Fundo de Marketing</div>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-white/5 text-purple-700 dark:text-pink-400 border border-purple-150 dark:border-white/10">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-950 dark:text-white mt-2 tracking-tight font-mono">
            {formatCurrency(totalMarketing)}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
            1.0% arrecadado p/ campanhas
          </div>
        </Card>

        {/* KPI 4 */}
        <Card className="p-5 bg-white dark:bg-[#160228] text-purple-950 dark:text-white rounded-3xl border border-purple-150 dark:border-white/15 shadow-xs">
          <div className="flex justify-between items-start">
            <div className="text-xs text-purple-700/80 dark:text-purple-300/70 font-bold">Equipa da Rede</div>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-white/5 text-purple-700 dark:text-pink-400 border border-purple-150 dark:border-white/10">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-950 dark:text-white mt-2 tracking-tight">
            6 <span className="text-xs font-normal text-purple-700/70 dark:text-purple-300/60">colaboradores</span>
          </div>
          <div className="text-[11px] text-purple-600/80 dark:text-purple-200/70 font-medium mt-1">
            2 gerentes · 2 unidades ativas
          </div>
        </Card>
      </div>

      {/* Seletor de Unidades em Pílulas */}
      <div className="max-w-full overflow-x-auto no-scrollbar py-1">
        <div className="flex items-center gap-1.5 p-1 bg-purple-50/70 dark:bg-white/5 rounded-2xl border border-purple-150 dark:border-white/10 w-fit shrink-0">
          <button
            type="button"
            onClick={() => setSelectedStoreFilter('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              selectedStoreFilter === 'ALL'
                ? 'bg-gradient-to-r from-purple-700 to-pink-600 text-white shadow-xs'
                : 'text-purple-900 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white hover:bg-purple-100/50 dark:hover:bg-white/5'
            }`}
          >
            Todas as Unidades ({overview?.stores.length || 2})
          </button>

          {overview?.stores.map((s) => {
            const isSelected = selectedStoreFilter === s.tenant.id
            return (
              <button
                key={s.tenant.id}
                type="button"
                onClick={() => setSelectedStoreFilter(s.tenant.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-gradient-to-r from-purple-700 to-pink-600 text-white shadow-xs'
                    : 'text-purple-900 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white hover:bg-purple-100/50 dark:hover:bg-white/5'
                }`}
              >
                <span>{s.tenant.name.replace('Açaí da Rose — ', '')}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Se 'ALL', exibe grid com todos os cards */}
      {selectedStoreFilter === 'ALL' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
          {overview?.stores.map((s) => (
            <StoreMetricsCard
              key={s.tenant.id}
              storeOverview={s}
              isCurrent={currentTenant.id === s.tenant.id}
              onSelectStore={(t) => {
                setCurrentTenant(t)
                toast.success(`Loja ativa: ${t.name}`)
              }}
              onViewDetails={(st) => setDetailsStore(st)}
            />
          ))}
        </div>
      ) : (
        /* Ficha da Unidade Selecionada com Gestão de Equipa Direta */
        (() => {
          const selectedStore = overview?.stores.find((s) => s.tenant.id === selectedStoreFilter)
          if (!selectedStore) return null
          const { tenant, metrics, operators, manager } = selectedStore
          const storeContract = contracts.find((c) => c.storeName.includes(tenant.city || '') || c.id.includes(tenant.slug || '')) || contracts[0]

          return (
            <div className="p-6 rounded-3xl bg-white dark:bg-[#160228] border border-purple-150 dark:border-white/15 space-y-6 text-purple-950 dark:text-white shadow-xs">
              {/* Topo da Unidade */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-150 dark:border-white/10">
                <div className="flex items-center gap-3.5">
                  <div className="h-12 w-12 rounded-2xl bg-purple-50 dark:bg-white/5 border border-purple-150 dark:border-white/10 text-purple-700 dark:text-pink-400 flex items-center justify-center shadow-xs">
                    {tenant.isHeadquarters ? <ShieldCheck className="h-6 w-6" /> : <Store className="h-6 w-6" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-black text-purple-950 dark:text-white">{tenant.name}</h2>
                      <Badge className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-[10px] font-bold">
                        {tenant.isHeadquarters ? 'Matriz Sede' : 'Franquia Ativa'}
                      </Badge>
                    </div>
                    <div className="text-xs text-purple-700/80 dark:text-purple-200/70 mt-0.5">
                      {tenant.city || 'Portugal'} · NIF: <b className="text-purple-950 dark:text-white">{tenant.nif || '500123456'}</b> · MB WAY: <b className="text-purple-700 dark:text-pink-400">{tenant.mbwayPhone || '+351 913 550 770'}</b>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setCurrentTenant(tenant)
                      toast.success(`Loja ativa: ${tenant.name}`)
                    }}
                    className="h-9 bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 hover:from-purple-800 hover:to-pink-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <span>Aceder ao PDV desta Loja</span>
                    <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              </div>

              {/* 3 Blocos de Informação */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Bloco 1: Vendas Hoje */}
                <div className="p-4 rounded-2xl bg-purple-50/40 dark:bg-white/5 border border-purple-150 dark:border-white/10 space-y-3">
                  <div className="text-xs font-bold text-purple-700/80 dark:text-purple-300/70 uppercase tracking-wider">
                    Vendas & Faturamento Hoje
                  </div>
                  <div className="text-2xl font-black text-purple-950 dark:text-white font-mono">
                    {formatCurrency(metrics.todayRevenue)}
                  </div>
                  <div className="text-xs text-purple-700/80 dark:text-purple-200/70 space-y-1 font-medium">
                    <div>Comandas Emitidas: <b className="text-purple-950 dark:text-white">{metrics.todayOrdersCount}</b></div>
                    <div>Mix MB WAY: <b className="text-purple-950 dark:text-white">{metrics.mbwaySharePercent}%</b></div>
                    <div>Royalties da Loja: <b className="text-purple-950 dark:text-white">{storeContract ? `${storeContract.royaltyPercent}%` : '5.0%'}</b></div>
                  </div>
                </div>

                {/* Bloco 2: Equipa da Loja */}
                <div className="p-4 rounded-2xl bg-purple-50/40 dark:bg-white/5 border border-purple-150 dark:border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-purple-700/80 dark:text-purple-300/70 uppercase tracking-wider">
                      Equipa da Unidade
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditingUser({ id: '', name: '', email: '', role: 'CASHIER', active: true, tenantId: tenant.id } as any)
                        setUserDialogOpen(true)
                      }}
                      className="h-7 px-2.5 text-[10px] font-bold rounded-lg bg-purple-700 hover:bg-purple-800 text-white cursor-pointer"
                    >
                      <span>Adicionar Operador</span>
                    </Button>
                  </div>
                  <div className="text-xs space-y-2">
                    {/* Gerente */}
                    <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-purple-150 dark:border-white/10 flex items-center justify-between shadow-2xs">
                      <div>
                        <div className="font-bold text-purple-950 dark:text-white flex items-center gap-1.5">
                          <span>{manager?.name || 'Gerente Titular'}</span>
                          <Badge className="bg-purple-100 dark:bg-pink-500/20 text-purple-800 dark:text-pink-300 text-[8px] py-0 font-bold">GERENTE</Badge>
                        </div>
                        <div className="text-[10px] text-purple-700/80 dark:text-purple-200/70 font-mono">{manager?.email || `gerente.${tenant.slug}@acaidarose.pt`}</div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingUser({ ...manager, role: 'TENANT_ADMIN', tenantId: tenant.id } as any)
                          setUserDialogOpen(true)
                        }}
                        className="h-7 w-7 p-0 text-purple-700 dark:text-pink-400 hover:bg-purple-50 dark:hover:bg-white/10 rounded-lg cursor-pointer"
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {/* Caixas */}
                    {operators.map((op, idx) => (
                      <div key={op.id} className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-purple-150 dark:border-white/10 flex justify-between items-center text-xs shadow-2xs">
                        <div>
                          <div className="font-bold text-purple-950 dark:text-white flex items-center gap-1.5">
                            <span>{idx + 1}. {op.name}</span>
                            <Badge className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[8px] py-0 font-bold">Caixa</Badge>
                          </div>
                          <div className="text-[10px] text-purple-700/80 dark:text-purple-200/70 font-mono">{op.email}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingUser({ ...op, role: 'CASHIER', tenantId: tenant.id } as any)
                              setUserDialogOpen(true)
                            }}
                            className="h-7 w-7 p-0 text-purple-700 dark:text-pink-400 hover:bg-purple-50 dark:hover:bg-white/10 rounded-lg cursor-pointer"
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteUser(op.id)}
                            className="h-7 w-7 p-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bloco 3: Dados Fiscais & Morada */}
                <div className="p-4 rounded-2xl bg-purple-50/40 dark:bg-white/5 border border-purple-150 dark:border-white/10 space-y-3">
                  <div className="text-xs font-bold text-purple-700/80 dark:text-purple-300/70 uppercase tracking-wider">
                    Identificação Fiscal & Morada
                  </div>
                  <div className="text-xs space-y-2 text-purple-800 dark:text-purple-200 font-medium">
                    <div><b className="text-purple-950 dark:text-white">Empresa:</b> {tenant.companyName || 'Rose & Vavá Portugal Lda'}</div>
                    <div><b className="text-purple-950 dark:text-white">Morada:</b> {tenant.address || 'Avenida Dr. Lourenço Peixinho 85'}</div>
                    <div><b className="text-purple-950 dark:text-white">Localidade:</b> {tenant.postalCode || '3800-165'} {tenant.city || 'Aveiro'}</div>
                    <div><b className="text-purple-950 dark:text-white">Telefone:</b> {tenant.phone || '+351 913 550 770'}</div>
                  </div>
                </div>
              </div>
            </div>
          )
        })()
      )}

      {/* Modais */}
      <CreateStoreDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSave={handleCreateStore}
      />
      
      <StoreDetailsDialog
        open={!!detailsStore}
        onOpenChange={(o) => !o && setDetailsStore(null)}
        storeOverview={detailsStore}
        contract={
          detailsStore
            ? contracts.find(
                (c) =>
                  c.storeName.toLowerCase().includes(detailsStore.tenant.city?.toLowerCase() || '') ||
                  c.id.includes(detailsStore.tenant.slug || '')
              ) || contracts[0]
            : undefined
        }
        onSelectStore={(t) => {
          setCurrentTenant(t)
          setDetailsStore(null)
          toast.success(`Loja ativa alterada para: ${t.name}`)
        }}
        onAddUserForStore={(tenantId) => {
          setEditingUser({ id: '', name: '', email: '', role: 'CASHIER', active: true, tenantId } as any)
          setUserDialogOpen(true)
        }}
        onEditUser={(u) => {
          setEditingUser(u)
          setUserDialogOpen(true)
        }}
        onDeleteUser={handleDeleteUser}
        onEditContract={(c) => setEditingContract(c)}
      />

      <UserEditDialog
        open={userDialogOpen}
        onOpenChange={setUserDialogOpen}
        user={editingUser}
        onSave={handleSaveUser}
      />

      <EditRoyaltyDialog
        open={!!editingContract}
        onOpenChange={(o) => !o && setEditingContract(null)}
        contract={editingContract}
        onSave={handleSaveContract}
      />

      <FranchiseReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        contracts={contracts}
      />
    </div>
  )
}
