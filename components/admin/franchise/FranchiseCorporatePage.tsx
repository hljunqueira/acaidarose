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
  Plus,
  RefreshCw,
  FileText,
  DollarSign,
  ShieldCheck,
  UserCheck,
  ArrowUpRight,
  Sliders,
  Trash2,
} from 'lucide-react'

const INITIAL_CONTRACTS: FranchiseContractData[] = [
  {
    id: 'cont-001',
    storeName: 'Açaí da Rose — Matriz (Torres Novas)',
    franchiseeName: 'Rose & Vavá Portugal Lda',
    nif: '509123456',
    startDate: '15/01/2024',
    renewalDate: '15/01/2029',
    franchiseFee: 25000.0,
    monthsActive: 18,
    royaltyPercent: 4.0,
    marketingPercent: 2.0,
    systemFeeMonthly: 0.0,
    status: 'ATIVO',
    paymentStatus: 'PAID',
    monthlyRevenue: 18450.0,
    gracePeriodNotes: 'Unidade Sede Matriz (Isenta de Taxa de Sistema)',
  },
  {
    id: 'cont-002',
    storeName: 'Açaí da Rose — Filial Lisboa (Parque das Nações)',
    franchiseeName: 'Açaí Lisboa Franquias Lda',
    nif: '509333444',
    startDate: '10/06/2024',
    renewalDate: '10/06/2029',
    franchiseFee: 25000.0,
    monthsActive: 14,
    royaltyPercent: 4.0,
    marketingPercent: 2.0,
    systemFeeMonthly: 99.0,
    status: 'ATIVO',
    paymentStatus: 'PENDING',
    monthlyRevenue: 24350.0,
  },
  {
    id: 'cont-003',
    storeName: 'Açaí da Rose — Filial Santarém',
    franchiseeName: 'Açaí Ribatejo Franquias Lda',
    nif: '509654321',
    startDate: '01/11/2025',
    renewalDate: '01/11/2030',
    franchiseFee: 25000.0,
    monthsActive: 9,
    royaltyPercent: 2.0,
    marketingPercent: 2.0,
    systemFeeMonthly: 99.0,
    status: 'ATIVO',
    paymentStatus: 'PENDING',
    monthlyRevenue: 14200.0,
    gracePeriodNotes: 'Fase de crescimento: taxa reduzida a 2%',
  },
  {
    id: 'cont-004',
    storeName: 'Açaí da Rose — Filial Aveiro',
    franchiseeName: 'Açaí Aveiro Franquias Unipessoal',
    nif: '509789123',
    startDate: '01/04/2026',
    renewalDate: '01/04/2031',
    franchiseFee: 25000.0,
    monthsActive: 4,
    royaltyPercent: 0.0,
    marketingPercent: 2.0,
    systemFeeMonthly: 99.0,
    status: 'ATIVO',
    paymentStatus: 'GRACE',
    monthlyRevenue: 12890.0,
    gracePeriodNotes: 'Carência de royalties nos 6 primeiros meses',
  },
]

const DEFAULT_NETWORK_OVERVIEW: FranchiseNetworkOverview = {
  totalRevenue: 69890.0,
  totalOrders: 1420,
  networkAverageTicket: 22.07,
  totalStores: 4,
  activeStores: 4,
  totalOperators: 12,
  stores: [
    {
      tenant: {
        id: 'tenant-torres-novas',
        name: 'Açaí da Rose — Matriz Central (Torres Novas)',
        companyName: 'Rose & Vavá Portugal Lda — Franqueadora',
        slug: 'torres-novas',
        nif: '509123456',
        address: 'Av. Manuel de Figueiredo 12',
        postalCode: '2350-771',
        city: 'Torres Novas',
        phone: '+351 911 050 264',
        mbwayPhone: '+351 911 050 264',
        currency: 'EUR',
        isHeadquarters: true,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      metrics: {
        todayRevenue: 1240.5,
        todayOrdersCount: 54,
        averageTicket: 22.97,
        activeOperatorsCount: 2,
        maxOperators: 3,
        mbwaySharePercent: 68,
      },
      operators: [
        { id: 'op-1', name: 'Maria Silva (Caixa 1)', email: 'maria@acairose.pt', active: true },
        { id: 'op-2', name: 'João Santos (Caixa 2)', email: 'joao@acairose.pt', active: true },
      ],
      manager: { id: 'mgr-1', name: 'Rosane Vavá (Diretora/Gerente)', email: 'franqueadora@acairose.pt' },
    },
    {
      tenant: {
        id: 'tenant-lisboa',
        name: 'Açaí da Rose — Filial Lisboa (Parque das Nações)',
        companyName: 'Açaí Lisboa Franquias Lda',
        slug: 'lisboa',
        nif: '509333444',
        address: 'Alameda dos Oceanos 41, Parque das Nações',
        postalCode: '1990-203',
        city: 'Lisboa',
        phone: '+351 915 220 330',
        mbwayPhone: '+351 915 220 330',
        currency: 'EUR',
        isHeadquarters: false,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      metrics: {
        todayRevenue: 1890.0,
        todayOrdersCount: 82,
        averageTicket: 23.05,
        activeOperatorsCount: 2,
        maxOperators: 3,
        mbwaySharePercent: 74,
      },
      operators: [
        { id: 'op-3', name: 'Ana Pereira (Caixa 1)', email: 'ana.lisboa@acairose.pt', active: true },
        { id: 'op-4', name: 'Carlos Ribeiro (Caixa 2)', email: 'carlos.lisboa@acairose.pt', active: true },
      ],
      manager: { id: 'mgr-2', name: 'Gerente Loja 1 (Lisboa)', email: 'lisboa@acairose.pt' },
    },
    {
      tenant: {
        id: 'tenant-santarem',
        name: 'Açaí da Rose — Filial Santarém',
        companyName: 'Açaí Ribatejo Franquias Lda',
        slug: 'santarem',
        nif: '509654321',
        address: 'Rua Serpa Pinto 45, Centro Histórico',
        postalCode: '2000-046',
        city: 'Santarém',
        phone: '+351 912 880 110',
        mbwayPhone: '+351 912 880 110',
        currency: 'EUR',
        isHeadquarters: false,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      metrics: {
        todayRevenue: 980.0,
        todayOrdersCount: 45,
        averageTicket: 21.78,
        activeOperatorsCount: 2,
        maxOperators: 3,
        mbwaySharePercent: 62,
      },
      operators: [
        { id: 'op-5', name: 'Beatriz Costa (Caixa 1)', email: 'beatriz.santarem@acairose.pt', active: true },
        { id: 'op-7', name: 'Tiago Ramos (Caixa 2)', email: 'tiago.santarem@acairose.pt', active: true },
      ],
      manager: { id: 'mgr-3', name: 'Gerente Loja 2 (Santarém)', email: 'santarem@acairose.pt' },
    },
    {
      tenant: {
        id: 'tenant-aveiro',
        name: 'Açaí da Rose — Filial Aveiro',
        companyName: 'Açaí Aveiro Franquias Unipessoal',
        slug: 'aveiro',
        nif: '509789123',
        address: 'Avenida Dr. Lourenço Peixinho 85, Aveiro',
        postalCode: '3800-165',
        city: 'Aveiro',
        phone: '+351 913 550 770',
        mbwayPhone: '+351 913 550 770',
        currency: 'EUR',
        isHeadquarters: false,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      metrics: {
        todayRevenue: 1450.2,
        todayOrdersCount: 61,
        averageTicket: 23.77,
        activeOperatorsCount: 2,
        maxOperators: 3,
        mbwaySharePercent: 71,
      },
      operators: [
        { id: 'op-6', name: 'Rui Fernandes (Caixa 1)', email: 'rui.aveiro@acairose.pt', active: true },
        { id: 'op-8', name: 'Marta Neves (Caixa 2)', email: 'marta.aveiro@acairose.pt', active: true },
      ],
      manager: { id: 'mgr-4', name: 'Gerente Loja 3 (Aveiro)', email: 'aveiro@acairose.pt' },
    },
  ],
}

export default function FranchiseCorporatePage() {
  const [overview, setOverview] = useState<FranchiseNetworkOverview>(DEFAULT_NETWORK_OVERVIEW)
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [detailsStore, setDetailsStore] = useState<StoreOverview | null>(null)
  const { authFetch } = useAuthStore()
  const { currentTenant, setCurrentTenant } = useFranchiseStore()

  // Gestão de Utilizador dentro do Contexto de Cada Unidade
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>('ALL')

  // Gestão Dinâmica de Contratos & Royalties
  const [contracts, setContracts] = useState<FranchiseContractData[]>(INITIAL_CONTRACTS)
  const [editingContract, setEditingContract] = useState<FranchiseContractData | null>(null)
  const [reportOpen, setReportOpen] = useState(false)

  const handleSaveContract = (updatedContract: FranchiseContractData) => {
    setContracts((prev) =>
      prev.map((c) => (c.id === updatedContract.id ? updatedContract : c))
    )
    toast.success(`Taxas de royalties atualizadas para: ${updatedContract.storeName}`)
  }

  const loadNetworkData = async () => {
    setLoading(true)
    try {
      const res = await authFetch('/api/franchise/overview')
      const data = await res.json()
      if (data && data.stores && data.stores.length > 0) {
        setOverview(data)
      } else if (data && data.overview && data.overview.stores) {
        setOverview(data.overview)
      }
    } catch {
      // Mantém DEFAULT_NETWORK_OVERVIEW ativo
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNetworkData()
  }, [])

  const handleSaveUser = async (payload: any) => {
    try {
      const res = payload.id
        ? await authFetch(`/api/users/${payload.id}`, { method: 'PUT', body: JSON.stringify(payload) })
        : await authFetch('/api/users', { method: 'POST', body: JSON.stringify(payload) })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao guardar utilizador')
      }

      toast.success('Colaborador guardado com sucesso na unidade!')
      loadNetworkData()
    } catch (e: any) {
      toast.error(e.message || 'Erro ao salvar utilizador')
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Deseja desativar este colaborador desta unidade?')) return
    try {
      const res = await authFetch(`/api/users/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao desativar colaborador')
      toast.success('Colaborador desativado com sucesso')
      loadNetworkData()
    } catch (e: any) {
      toast.error(e.message || 'Erro ao desativar')
    }
  }

  const handleCreateStore = async (data: any) => {
    try {
      const res = await authFetch('/api/tenants', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Erro ao criar loja')
      toast.success('Nova franquia criada com sucesso!')
      loadNetworkData()
    } catch (e: any) {
      toast.error(e.message || 'Erro')
    }
  }

  const totalRoyalties = contracts.reduce((acc, c) => acc + (c.monthlyRevenue * (c.royaltyPercent / 100)), 0)
  const totalSystemFees = contracts.reduce((acc, c) => acc + (c.systemFeeMonthly ?? 99), 0)
  const totalMarketing = contracts.reduce((acc, c) => acc + (c.monthlyRevenue * (c.marketingPercent / 100)), 0)
  const totalNetworkRevenue = contracts.reduce((acc, c) => acc + c.monthlyRevenue, 0)

  return (
    <div className="space-y-5">
      {/* Header Corporativo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-purple-100 dark:border-white/10">
        <div>
          <h1 className="text-base sm:text-lg font-black text-purple-950 dark:text-white tracking-tight flex items-center gap-2">
            <Building2 className="h-5 w-5 text-purple-700 dark:text-pink-400" />
            <span>Gestão Corporativa & Franqueadora</span>
          </h1>
          <p className="text-[11px] text-purple-700/80 dark:text-purple-200/70">
            Contratos, faturamento consolidado da rede, royalties progressivos e governança de unidades
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={loadNetworkData}
            className="h-9 text-xs font-bold gap-1.5 rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-purple-950 dark:text-white cursor-pointer shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setReportOpen(true)}
            className="h-9 text-xs font-bold gap-1.5 rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-purple-950 dark:text-white cursor-pointer shadow-xs"
          >
            <FileText className="h-3.5 w-3.5 text-purple-700 dark:text-pink-400" />
            <span>Mapa Contábil</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="h-9 bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 hover:from-purple-800 hover:to-pink-700 dark:hover:from-pink-500 dark:hover:to-purple-500 text-white text-xs font-bold gap-1.5 shadow-md shadow-purple-700/20 dark:shadow-pink-600/30 rounded-xl cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nova Franquia</span>
          </Button>
        </div>
      </div>

      {/* 4 KPIs Globais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-3.5">
        <Card className="p-4 bg-gradient-to-br from-purple-800 via-purple-900 to-fuchsia-950 text-white rounded-3xl shadow-md border border-purple-700/50">
          <div className="flex justify-between items-start">
            <div className="text-xs font-bold text-purple-100">Faturamento da Rede (Mês)</div>
            <div className="p-2 rounded-xl bg-white/10 text-pink-300"><TrendingUp className="h-4 w-4" /></div>
          </div>
          <div className="text-xl sm:text-2xl font-black mt-2 tracking-tight text-white font-mono">
            {formatCurrency(totalNetworkRevenue)}
          </div>
          <div className="text-[10px] text-emerald-300 font-bold mt-1">
            ↑ +18.4% vs mês anterior
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-[#160228]/95 text-slate-900 dark:text-white rounded-3xl shadow-xs dark:shadow-xl border border-purple-150 dark:border-white/15">
          <div className="flex justify-between items-start">
            <div className="text-xs font-bold text-purple-700/80 dark:text-purple-200/70">Royalties & Sistema</div>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-white/5 text-purple-700 dark:text-pink-400"><DollarSign className="h-4 w-4" /></div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-950 dark:text-pink-300 mt-2 tracking-tight font-mono">
            {formatCurrency(totalRoyalties + totalSystemFees)}
          </div>
          <div className="text-[10px] text-purple-600/70 dark:text-purple-200/60 mt-1 font-medium">
            Royalties + Licença Sistema (€ {totalSystemFees}/mês)
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-[#160228]/95 text-slate-900 dark:text-white rounded-3xl shadow-xs dark:shadow-xl border border-purple-150 dark:border-white/15">
          <div className="flex justify-between items-start">
            <div className="text-xs font-bold text-purple-700/80 dark:text-purple-200/70">Fundo de Marketing</div>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-white/5 text-purple-700 dark:text-pink-400"><TrendingUp className="h-4 w-4" /></div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-950 dark:text-white mt-2 tracking-tight font-mono">
            {formatCurrency(totalMarketing)}
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-300 font-bold mt-1">
            ✓ 2.0% arrecadado p/ campanhas
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-[#160228]/95 text-slate-900 dark:text-white rounded-3xl shadow-xs dark:shadow-xl border border-purple-150 dark:border-white/15">
          <div className="flex justify-between items-start">
            <div className="text-xs font-bold text-purple-700/80 dark:text-purple-200/70">Equipa da Rede</div>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-white/5 text-purple-700 dark:text-pink-400"><Users className="h-4 w-4" /></div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-950 dark:text-white mt-2 tracking-tight">
            12 <span className="text-xs font-bold text-purple-700/80 dark:text-purple-200/70">caixas</span>
          </div>
          <div className="text-[10px] text-purple-700 dark:text-pink-300 font-bold mt-1">
            4 gerentes · 4 unidades ativas
          </div>
        </Card>
      </div>

      {/* Seletor de Unidades em Pílulas */}
      <div className="max-w-full overflow-x-auto no-scrollbar py-1">
        <div className="flex items-center gap-1.5 p-1 bg-purple-50/70 dark:bg-white/5 rounded-2xl border border-purple-150 dark:border-white/10 w-fit shrink-0">
          <button
            type="button"
            onClick={() => setSelectedStoreFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              selectedStoreFilter === 'ALL'
                ? 'bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 text-white shadow-xs'
                : 'text-purple-900 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white'
            }`}
          >
            Todas as Unidades ({overview?.stores.length || 4})
          </button>

          {overview?.stores.map((s) => {
            const isSelected = selectedStoreFilter === s.tenant.id
            return (
              <button
                key={s.tenant.id}
                type="button"
                onClick={() => setSelectedStoreFilter(s.tenant.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 text-white shadow-xs'
                    : 'text-purple-900 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white'
                }`}
              >
                <span>📍</span>
                <span>{s.tenant.name.replace('Açaí da Rose — ', '')}</span>
                {s.tenant.isHeadquarters && <span className="text-[9px] opacity-80">(Matriz)</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Se 'ALL', exibe grid com todos os 4 cards largos lado a lado */}
      {selectedStoreFilter === 'ALL' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <div className="p-6 rounded-3xl bg-white dark:bg-[#160228]/95 border border-purple-150 dark:border-white/15 space-y-6 shadow-xs dark:shadow-xl text-slate-900 dark:text-white">
              {/* Topo da Unidade */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-100 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-700 to-pink-600 text-white flex items-center justify-center shadow-md">
                    {tenant.isHeadquarters ? <ShieldCheck className="h-6 w-6" /> : <Store className="h-6 w-6" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-black text-purple-950 dark:text-white">{tenant.name}</h2>
                      <Badge className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-[9px] font-black uppercase">
                        {tenant.isHeadquarters ? 'Matriz Sede' : 'Franquia Ativa'}
                      </Badge>
                    </div>
                    <div className="text-xs text-purple-700/80 dark:text-purple-200/70">
                      {tenant.city || 'Portugal'} · NIF: <b className="text-purple-950 dark:text-white">{tenant.nif || '509123456'}</b> · MB WAY: <b className="text-purple-950 dark:text-pink-300">{tenant.mbwayPhone || '+351 911 050 264'}</b>
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
                    className="h-9 bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 hover:from-purple-800 hover:to-pink-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                  >
                    <span>Aceder ao PDV desta Loja</span>
                    <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              </div>

              {/* 3 Blocos de Informação com Gestão de Equipe e Royalties */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Bloco 1: Vendas Hoje */}
                <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-white/5 border border-purple-100 dark:border-white/10 space-y-3">
                  <div className="text-xs font-black uppercase text-purple-700 dark:text-pink-300 tracking-wider">
                    📊 Vendas & Faturamento Hoje
                  </div>
                  <div className="text-2xl font-black text-purple-950 dark:text-pink-300 font-mono">
                    {formatCurrency(metrics.todayRevenue)}
                  </div>
                  <div className="text-xs text-purple-700/80 dark:text-purple-200/70 space-y-1">
                    <div>Comandas Emitidas: <b>{metrics.todayOrdersCount}</b></div>
                    <div>Mix MB WAY: <b>{metrics.mbwaySharePercent}%</b></div>
                    <div>Royalties da Loja: <b>{storeContract ? `${storeContract.royaltyPercent}%` : '4.0%'}</b></div>
                  </div>
                </div>

                {/* Bloco 2: Equipa da Loja com Botão de Adicionar Colaborador */}
                <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-white/5 border border-purple-100 dark:border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-black uppercase text-purple-700 dark:text-pink-300 tracking-wider">
                      👥 Equipa da Unidade
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditingUser({ id: '', name: '', email: '', role: 'CASHIER', active: true, tenantId: tenant.id } as any)
                        setUserDialogOpen(true)
                      }}
                      className="h-6 px-2 text-[10px] font-bold rounded-lg bg-purple-700 hover:bg-purple-800 text-white gap-1 cursor-pointer"
                    >
                      <Plus className="h-2.5 w-2.5" />
                      <span>Adicionar</span>
                    </Button>
                  </div>
                  <div className="text-xs space-y-2">
                    {/* Gerente */}
                    <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-purple-100 dark:border-white/10 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-purple-950 dark:text-white flex items-center gap-1">
                          <span>{manager?.name || 'Gerente Titular'}</span>
                          <Badge className="bg-purple-100 dark:bg-pink-500/20 text-purple-800 dark:text-pink-300 text-[8px] py-0 font-bold">GERENTE</Badge>
                        </div>
                        <div className="text-[10px] text-purple-700/80 dark:text-purple-200/70 font-mono">{manager?.email || `gerente.${tenant.slug}@acairose.pt`}</div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingUser({ ...manager, role: 'TENANT_ADMIN', tenantId: tenant.id } as any)
                          setUserDialogOpen(true)
                        }}
                        className="h-6 w-6 p-0 text-purple-600 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-white/10 rounded-md"
                      >
                        <UserCheck className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Caixas */}
                    {operators.map((op, idx) => (
                      <div key={op.id} className="p-2 rounded-xl bg-white dark:bg-white/5 border border-purple-100 dark:border-white/10 flex justify-between items-center text-[11px]">
                        <div>
                          <div className="font-bold text-purple-950 dark:text-white flex items-center gap-1">
                            <span>{idx + 1}. {op.name}</span>
                            <Badge className="bg-emerald-500 text-white text-[8px] py-0">Caixa</Badge>
                          </div>
                          <div className="text-[9px] text-purple-600/70 dark:text-purple-200/60 font-mono">{op.email}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingUser({ ...op, role: 'CASHIER', tenantId: tenant.id } as any)
                              setUserDialogOpen(true)
                            }}
                            className="h-6 w-6 p-0 text-purple-600 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-white/10 rounded-md"
                          >
                            <UserCheck className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteUser(op.id)}
                            className="h-6 w-6 p-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bloco 3: Dados Fiscais & Endereço */}
                <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-white/5 border border-purple-100 dark:border-white/10 space-y-3">
                  <div className="text-xs font-black uppercase text-purple-700 dark:text-pink-300 tracking-wider">
                    🏢 Identificação Fiscal & Morada
                  </div>
                  <div className="text-xs space-y-1.5 text-purple-950 dark:text-purple-100">
                    <div><b>Empresa:</b> {tenant.companyName || 'Rose & Vavá Portugal Lda'}</div>
                    <div><b>Morada:</b> {tenant.address || 'Praça 5 de Outubro 12'}</div>
                    <div><b>Localidade:</b> {tenant.postalCode || '2350-754'} {tenant.city || 'Torres Novas'}</div>
                    <div><b>Telefone:</b> {tenant.phone || '+351 911 050 264'}</div>
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
