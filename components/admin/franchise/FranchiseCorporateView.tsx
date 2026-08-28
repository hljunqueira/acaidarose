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
      operators: [
        { id: 'op-1', name: 'Rui Fernandes (Caixa 1)', email: 'rui.aveiro@acaidarose.pt', active: true },
        { id: 'op-2', name: 'Marta Neves (Caixa 2)', email: 'marta.aveiro@acaidarose.pt', active: true },
      ],
      manager: { id: 'mgr-1', name: 'Diretoria Franqueadora', email: 'franqueadora@acaidarose.pt' },
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
        phone: '+351 911 050 264',
        mbwayPhone: '+351 911 050 264',
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
      operators: [
        { id: 'op-3', name: 'Ana Silva (Caixa 1)', email: 'ana.torresnovas@acaidarose.pt', active: true },
      ],
      manager: { id: 'mgr-2', name: 'Gerente Torres Novas', email: 'gerente.torresnovas@acaidarose.pt' },
    },
  ],
}

export default function FranchiseCorporateView() {
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#2A1E3D]">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Building2 className="h-5 w-5 text-purple-400" />
            <span>Gestão Corporativa & Franqueadora</span>
          </h1>
          <p className="text-xs text-gray-400">
            Contratos, faturamento consolidado da rede, royalties progressivos e governança de unidades
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={loadNetworkData}
            className="h-9 text-xs font-medium gap-1.5 rounded-lg border-[#2A1E3D] bg-[#160F24] hover:bg-[#2A1E3D] text-white cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setReportOpen(true)}
            className="h-9 text-xs font-medium gap-1.5 rounded-lg border-[#2A1E3D] bg-[#160F24] hover:bg-[#2A1E3D] text-white cursor-pointer"
          >
            <FileText className="h-3.5 w-3.5 text-purple-400" />
            <span>Mapa Contábil</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="h-9 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium gap-1.5 rounded-lg cursor-pointer transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nova Franquia</span>
          </Button>
        </div>
      </div>

      {/* 4 KPIs Globais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-3.5">
        <Card className="p-4 bg-[#160F24] text-white rounded-2xl border border-[#2A1E3D]">
          <div className="flex justify-between items-start">
            <div className="text-xs text-gray-400 font-medium">Faturamento da Rede (Mês)</div>
            <div className="p-2 rounded-lg bg-purple-950/50 text-purple-300 border border-purple-800/30"><TrendingUp className="h-4 w-4" /></div>
          </div>
          <div className="text-xl sm:text-2xl font-bold mt-2 tracking-tight text-white font-mono">
            {formatCurrency(totalNetworkRevenue)}
          </div>
          <div className="text-[11px] text-emerald-400 font-medium mt-1">
            ↑ +18.4% vs mês anterior
          </div>
        </Card>

        <Card className="p-4 bg-[#160F24] text-white rounded-2xl border border-[#2A1E3D]">
          <div className="flex justify-between items-start">
            <div className="text-xs text-gray-400 font-medium">Royalties & Sistema</div>
            <div className="p-2 rounded-lg bg-purple-950/50 text-purple-300 border border-purple-800/30"><DollarSign className="h-4 w-4" /></div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white mt-2 tracking-tight font-mono">
            {formatCurrency(totalRoyalties + totalSystemFees)}
          </div>
          <div className="text-[11px] text-gray-400 mt-1">
            Royalties + Licença Sistema (€ {totalSystemFees}/mês)
          </div>
        </Card>

        <Card className="p-4 bg-[#160F24] text-white rounded-2xl border border-[#2A1E3D]">
          <div className="flex justify-between items-start">
            <div className="text-xs text-gray-400 font-medium">Fundo de Marketing</div>
            <div className="p-2 rounded-lg bg-purple-950/50 text-purple-300 border border-purple-800/30"><TrendingUp className="h-4 w-4" /></div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white mt-2 tracking-tight font-mono">
            {formatCurrency(totalMarketing)}
          </div>
          <div className="text-[11px] text-emerald-400 font-medium mt-1">
            1.0% arrecadado p/ campanhas
          </div>
        </Card>

        <Card className="p-4 bg-[#160F24] text-white rounded-2xl border border-[#2A1E3D]">
          <div className="flex justify-between items-start">
            <div className="text-xs text-gray-400 font-medium">Equipa da Rede</div>
            <div className="p-2 rounded-lg bg-purple-950/50 text-purple-300 border border-purple-800/30"><Users className="h-4 w-4" /></div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white mt-2 tracking-tight">
            6 <span className="text-xs font-normal text-gray-400">colaboradores</span>
          </div>
          <div className="text-[11px] text-purple-300 mt-1">
            2 gerentes · 2 unidades ativas
          </div>
        </Card>
      </div>

      {/* Seletor de Unidades em Pílulas */}
      <div className="max-w-full overflow-x-auto no-scrollbar py-1">
        <div className="flex items-center gap-1.5 p-1 bg-[#160F24] rounded-xl border border-[#2A1E3D] w-fit shrink-0">
          <button
            type="button"
            onClick={() => setSelectedStoreFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 ${
              selectedStoreFilter === 'ALL'
                ? 'bg-purple-600 text-white'
                : 'text-gray-300 hover:text-white'
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
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <span>{s.tenant.name.replace('Açaí da Rose — ', '')}</span>
                {s.tenant.isHeadquarters && <span className="text-[10px] opacity-80">(Matriz)</span>}
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
            <div className="p-6 rounded-2xl bg-[#160F24] border border-[#2A1E3D] space-y-6 text-white">
              {/* Topo da Unidade */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2A1E3D]">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-purple-950 border border-purple-800/40 text-purple-300 flex items-center justify-center">
                    {tenant.isHeadquarters ? <ShieldCheck className="h-5 w-5" /> : <Store className="h-5 w-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-white">{tenant.name}</h2>
                      <Badge className="bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 text-[10px] font-semibold">
                        {tenant.isHeadquarters ? 'Matriz Sede' : 'Franquia Ativa'}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-400">
                      {tenant.city || 'Portugal'} · NIF: <b className="text-white">{tenant.nif || '500123456'}</b> · MB WAY: <b className="text-purple-300">{tenant.mbwayPhone || '+351 913 550 770'}</b>
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
                    className="h-9 bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs rounded-lg transition"
                  >
                    <span>Aceder ao PDV desta Loja</span>
                    <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              </div>

              {/* 3 Blocos de Informação */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Bloco 1: Vendas Hoje */}
                <div className="p-4 rounded-xl bg-[#0A0612] border border-[#2A1E3D] space-y-3">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Vendas & Faturamento Hoje
                  </div>
                  <div className="text-2xl font-bold text-white font-mono">
                    {formatCurrency(metrics.todayRevenue)}
                  </div>
                  <div className="text-xs text-gray-400 space-y-1">
                    <div>Comandas Emitidas: <b className="text-white">{metrics.todayOrdersCount}</b></div>
                    <div>Mix MB WAY: <b className="text-white">{metrics.mbwaySharePercent}%</b></div>
                    <div>Royalties da Loja: <b className="text-white">{storeContract ? `${storeContract.royaltyPercent}%` : '5.0%'}</b></div>
                  </div>
                </div>

                {/* Bloco 2: Equipa da Loja */}
                <div className="p-4 rounded-xl bg-[#0A0612] border border-[#2A1E3D] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Equipa da Unidade
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditingUser({ id: '', name: '', email: '', role: 'CASHIER', active: true, tenantId: tenant.id } as any)
                        setUserDialogOpen(true)
                      }}
                      className="h-6 px-2 text-[10px] font-medium rounded-md bg-purple-600 hover:bg-purple-700 text-white gap-1"
                    >
                      <Plus className="h-2.5 w-2.5" />
                      <span>Adicionar</span>
                    </Button>
                  </div>
                  <div className="text-xs space-y-2">
                    {/* Gerente */}
                    <div className="p-2.5 rounded-lg bg-[#160F24] border border-[#2A1E3D] flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-white flex items-center gap-1">
                          <span>{manager?.name || 'Gerente Titular'}</span>
                          <Badge className="bg-purple-950 text-purple-300 border border-purple-800 text-[9px] py-0 font-medium">GERENTE</Badge>
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono">{manager?.email || `gerente.${tenant.slug}@acaidarose.pt`}</div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingUser({ ...manager, role: 'TENANT_ADMIN', tenantId: tenant.id } as any)
                          setUserDialogOpen(true)
                        }}
                        className="h-6 w-6 p-0 text-purple-300 hover:bg-purple-950 rounded-md"
                      >
                        <UserCheck className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Caixas */}
                    {operators.map((op, idx) => (
                      <div key={op.id} className="p-2 rounded-lg bg-[#160F24] border border-[#2A1E3D] flex justify-between items-center text-xs">
                        <div>
                          <div className="font-medium text-white flex items-center gap-1">
                            <span>{idx + 1}. {op.name}</span>
                            <Badge className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[9px] py-0">Caixa</Badge>
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono">{op.email}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingUser({ ...op, role: 'CASHIER', tenantId: tenant.id } as any)
                              setUserDialogOpen(true)
                            }}
                            className="h-6 w-6 p-0 text-purple-300 hover:bg-purple-950 rounded-md"
                          >
                            <UserCheck className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteUser(op.id)}
                            className="h-6 w-6 p-0 text-red-400 hover:bg-red-950 rounded-md"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bloco 3: Dados Fiscais & Morada */}
                <div className="p-4 rounded-xl bg-[#0A0612] border border-[#2A1E3D] space-y-3">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Identificação Fiscal & Morada
                  </div>
                  <div className="text-xs space-y-1.5 text-gray-300">
                    <div><b>Empresa:</b> {tenant.companyName || 'Rose & Vavá Portugal Lda'}</div>
                    <div><b>Morada:</b> {tenant.address || 'Avenida Dr. Lourenço Peixinho 85'}</div>
                    <div><b>Localidade:</b> {tenant.postalCode || '3800-165'} {tenant.city || 'Aveiro'}</div>
                    <div><b>Telefone:</b> {tenant.phone || '+351 913 550 770'}</div>
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
