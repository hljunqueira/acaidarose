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
import CreateStoreDialog, { CreateStoreFormData } from './CreateStoreDialog'
import StoreDetailsDialog from './StoreDetailsDialog'
import EditRoyaltyDialog, { FranchiseContractData } from './EditRoyaltyDialog'
import ConfirmActionDialog from '@/components/ui/ConfirmActionDialog'
import FranchiseFeesManagerDialog, { FranchiseFeeCharge } from './FranchiseFeesManagerDialog'
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
  Sliders,
} from 'lucide-react'

export default function FranchiseCorporateView() {
  const { authFetch } = useAuthStore()
  const { currentTenant, setCurrentTenant } = useFranchiseStore()
  const [overview, setOverview] = useState<FranchiseNetworkOverview>({
    totalRevenue: 0,
    totalOrders: 0,
    networkAverageTicket: 0,
    totalStores: 0,
    activeStores: 0,
    totalOperators: 0,
    stores: [],
  })
  const [contracts, setContracts] = useState<FranchiseContractData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>('ALL')

  // Modais de Controle
  const [createOpen, setCreateOpen] = useState(false)
  const [detailsStore, setDetailsStore] = useState<StoreOverview | null>(null)
  const [editingContract, setEditingContract] = useState<FranchiseContractData | null>(null)
  const [reportOpen, setReportOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [feesManagerOpen, setFeesManagerOpen] = useState(false)

  // Diálogo de Confirmação Customizado (Sem janelas nativas Windows)
  const [confirmState, setConfirmState] = useState<{
    open: boolean
    title: string
    description?: string
    confirmLabel?: string
    cancelLabel?: string
    variant?: 'destructive' | 'default' | 'success'
    onConfirm: () => Promise<void> | void
    loading?: boolean
  }>({
    open: false,
    title: '',
    onConfirm: () => {},
  })

  const [customFees, setCustomFees] = useState<FranchiseFeeCharge[]>([])

  const loadNetworkData = async () => {
    setLoading(true)
    try {
      const res = await authFetch('/api/franchise/overview')
      if (res.ok) {
        const data = await res.json()
        const netOverview = data.overview || data
        setOverview(netOverview)

        if (Array.isArray(netOverview.stores)) {
          const dynamicContracts: FranchiseContractData[] = netOverview.stores.map((s: StoreOverview) => {
            const isHq = !!s.tenant.isHeadquarters
            const rev = s.metrics?.todayRevenue || 0
            const royaltyPct = s.tenant.royaltyPercentage !== undefined ? s.tenant.royaltyPercentage : (isHq ? 0 : 5)
            const mktPct = s.tenant.marketingFundPercentage !== undefined ? s.tenant.marketingFundPercentage : 1
            const sysFee = s.tenant.systemFeeMonthly !== undefined ? Number(s.tenant.systemFeeMonthly) : 0

            return {
              id: `cont-${s.tenant.id.slice(0, 8)}`,
              storeName: s.tenant.name,
              franchiseeName: s.tenant.companyName || (isHq ? 'Rose & Vavá Portugal Lda — Sede Franqueadora' : `${s.tenant.name} Lda`),
              nif: s.tenant.nif || '500000000',
              startDate: s.tenant.createdAt ? new Date(s.tenant.createdAt).toLocaleDateString('pt-PT') : '01/01/2024',
              renewalDate: new Date(Date.now() + 5 * 365 * 24 * 3600 * 1000).toLocaleDateString('pt-PT'),
              franchiseFee: isHq ? 0 : 25000.0,
              monthsActive: Math.max(1, Math.floor((Date.now() - new Date(s.tenant.createdAt || Date.now()).getTime()) / (30 * 24 * 3600 * 1000))),
              royaltyPercent: royaltyPct,
              marketingPercent: mktPct,
              systemFeeMonthly: sysFee,
              status: s.tenant.active ? 'ATIVO' : 'SUSPENSO',
              paymentStatus: 'PAID',
              monthlyRevenue: rev,
              gracePeriodNotes: isHq ? 'Unidade Sede Matriz (Isenta de Taxa de Sistema)' : undefined,
            }
          })
          setContracts(dynamicContracts)
        }
      }
    } catch {
      toast.error('Erro ao atualizar dados corporativos da rede')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNetworkData()
  }, [])

  const handleCreateStore = async (data: CreateStoreFormData) => {
    try {
      const res = await authFetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Falha ao criar unidade')

      // Registar contrato imediatamente na tabela da Franqueadora
      const newContract: FranchiseContractData = {
        id: `cont-${Date.now()}`,
        storeName: data.name,
        franchiseeName: data.companyName,
        nif: data.nif,
        startDate: data.startDate,
        renewalDate: new Date(Date.now() + data.renewalYears * 365 * 24 * 3600 * 1000).toLocaleDateString('pt-PT'),
        franchiseFee: data.franchiseFee,
        monthsActive: 1,
        royaltyPercent: data.royaltyPercent,
        marketingPercent: data.marketingPercent,
        systemFeeMonthly: data.systemFeeMonthly,
        status: 'ATIVO',
        paymentStatus: 'PAID',
        monthlyRevenue: 0.0,
      }
      setContracts((prev) => [...prev, newContract])

      toast.success('Nova franquia criada e contrato homologado com sucesso!')
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

  const handleDeleteUser = (userId: string, userName?: string) => {
    setConfirmState({
      open: true,
      title: 'Remover Utilizador da Filial',
      description: `Deseja realmente revogar o acesso de ${userName || 'deste utilizador'}? Esta ação não pode ser desfeita.`,
      confirmLabel: 'Sim, Remover Acesso',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          const res = await authFetch(`/api/users/${userId}`, { method: 'DELETE' })
          if (!res.ok) throw new Error('Falha ao remover utilizador')
          toast.success('Utilizador removido com sucesso!')
          setConfirmState((prev) => ({ ...prev, open: false }))
          loadNetworkData()
        } catch (err: any) {
          toast.error(err.message || 'Erro ao remover utilizador')
        }
      },
    })
  }

  const totalRoyalties = contracts.reduce((acc, c) => acc + (c.monthlyRevenue * (c.royaltyPercent / 100)), 0)
  const totalSystemFees = contracts.reduce((acc, c) => acc + (Number(c.systemFeeMonthly) || 0), 0)
  const totalMarketing = contracts.reduce((acc, c) => acc + (c.monthlyRevenue * (c.marketingPercent / 100)), 0)
  const totalNetworkRevenue = contracts.reduce((acc, c) => acc + c.monthlyRevenue, 0)

  return (
    <div className="space-y-6">
      {/* Header Corporativo com Alinhamento Perfeito dos Botões */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-purple-150 dark:border-white/15">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-black text-purple-950 dark:text-white tracking-tight flex items-center gap-2.5">
            <Building2 className="h-6 w-6 text-purple-700 dark:text-pink-400 shrink-0" />
            <span>Gestão Corporativa & Franqueadora</span>
          </h1>
          <p className="text-xs sm:text-sm text-purple-700/80 dark:text-purple-200/70 font-medium mt-0.5">
            Contratos, faturação consolidada da rede, royalties, licença de sistema e taxas customizadas pela franqueadora
          </p>
        </div>

        {/* Barra Unificada e Alinhada de Ações */}
        <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={loadNetworkData}
            className="h-9 px-3 text-xs font-bold gap-1.5 rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-purple-950 dark:text-white cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setFeesManagerOpen(true)}
            className="h-9 px-3 text-xs font-bold gap-1.5 rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-purple-950 dark:text-white cursor-pointer shadow-2xs"
          >
            <Sliders className="h-3.5 w-3.5 text-purple-700 dark:text-pink-400" />
            <span>Gerir Cobranças & Taxas</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setReportOpen(true)}
            className="h-9 px-3 text-xs font-bold gap-1.5 rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-purple-950 dark:text-white cursor-pointer shadow-2xs"
          >
            <FileText className="h-3.5 w-3.5 text-purple-700 dark:text-pink-400" />
            <span>Mapa Contábil</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="h-9 px-4 bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 hover:from-purple-800 hover:to-pink-700 text-white text-xs font-black rounded-xl cursor-pointer transition shadow-md"
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
            {formatCurrency(totalNetworkRevenue || overview.totalRevenue)}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
            {overview.totalOrders} pedidos realizados
          </div>
        </Card>

        {/* KPI 2 */}
        <Card className="p-5 bg-white dark:bg-[#160228] text-purple-950 dark:text-white rounded-3xl border border-purple-150 dark:border-white/15 shadow-xs">
          <div className="flex justify-between items-start">
            <div className="text-xs text-purple-700/80 dark:text-purple-300/70 font-bold">Royalties & Licença de Sistema</div>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-white/5 text-purple-700 dark:text-pink-400 border border-purple-150 dark:border-white/10">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-950 dark:text-white mt-2 tracking-tight font-mono">
            {formatCurrency(totalRoyalties + totalSystemFees)}
          </div>
          <div className="text-[11px] text-purple-600/80 dark:text-purple-200/70 font-medium mt-1">
            Royalties + Licença de Sistema configuráveis por loja
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
            Arrecadação p/ campanhas nacionais
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
            {overview.totalOperators || 5} <span className="text-xs font-normal text-purple-700/70 dark:text-purple-300/60">colaboradores</span>
          </div>
          <div className="text-[11px] text-purple-600/80 dark:text-purple-200/70 font-medium mt-1">
            {overview.activeStores || 2} unidades ativas conectadas
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

      <FranchiseFeesManagerDialog
        open={feesManagerOpen}
        onOpenChange={setFeesManagerOpen}
        fees={customFees}
        onSaveFees={(updated) => setCustomFees(updated)}
        stores={overview.stores.map((s) => ({ id: s.tenant.id, name: s.tenant.name }))}
      />

      <ConfirmActionDialog
        open={confirmState.open}
        onOpenChange={(o) => setConfirmState((prev) => ({ ...prev, open: o }))}
        title={confirmState.title}
        description={confirmState.description}
        confirmLabel={confirmState.confirmLabel}
        cancelLabel={confirmState.cancelLabel}
        variant={confirmState.variant}
        onConfirm={confirmState.onConfirm}
        loading={confirmState.loading}
      />
    </div>
  )
}
