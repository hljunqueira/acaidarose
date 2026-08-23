'use client'

import React, { useState, useEffect } from 'react'
import { StoreOverview, FranchiseNetworkOverview } from '@/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { formatCurrency } from '@/lib/i18n/formatters'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/stores/authStore'
import { useFranchiseStore } from '@/lib/stores/franchiseStore'
import StoreMetricsCard from './StoreMetricsCard'
import CreateStoreDialog from './CreateStoreDialog'
import StoreDetailsDialog from './StoreDetailsDialog'
import {
  Building2,
  TrendingUp,
  Store,
  Users,
  CreditCard,
  Plus,
  RefreshCw,
  FileText,
  DollarSign,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  ArrowUpRight,
  Send,
} from 'lucide-react'

export default function FranchiseCorporatePage() {
  const [overview, setOverview] = useState<FranchiseNetworkOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [detailsStore, setDetailsStore] = useState<StoreOverview | null>(null)
  const [syncing, setSyncing] = useState(false)
  const { authFetch } = useAuthStore()
  const { currentTenant, setCurrentTenant } = useFranchiseStore()

  const loadNetworkData = async () => {
    setLoading(true)
    try {
      const res = await authFetch('/api/franchise/overview')
      const data = await res.json()
      if (data.overview) {
        setOverview(data.overview)
      }
    } catch {
      toast.error('Erro ao carregar dados da franqueadora')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNetworkData()
  }, [])

  const handleSyncAll = async () => {
    setSyncing(true)
    try {
      const res = await authFetch('/api/products/sync-all', { method: 'POST' })
      if (!res.ok) throw new Error('Erro ao sincronizar')
      toast.success('Cardápio master e regras sincronizados com todas as franquias!')
    } catch (e: any) {
      toast.error(e.message || 'Erro')
    } finally {
      setSyncing(false)
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

  const contracts = [
    {
      id: 'cont-001',
      storeName: 'Açaí da Rose — Matriz (Torres Novas)',
      franchiseeName: 'Rose & Vavá Portugal Lda',
      nif: '509123456',
      startDate: '15/01/2024',
      renewalDate: '15/01/2029',
      franchiseFee: 25000.00,
      monthsActive: 18,
      royaltyPercent: 4.0, // > 12 meses = 4%
      marketingPercent: 2.0,
      status: 'ATIVO',
      monthlyRevenue: 18450.00,
    },
    {
      id: 'cont-002',
      storeName: 'Açaí da Rose — Filial Aveiro',
      franchiseeName: 'Açaí Aveiro Franquias Unipessoal',
      nif: '509654321',
      startDate: '01/04/2026',
      renewalDate: '01/04/2031',
      franchiseFee: 25000.00,
      monthsActive: 4,
      royaltyPercent: 0.0, // <= 6 meses = 0% carência
      marketingPercent: 2.0,
      status: 'ATIVO',
      monthlyRevenue: 12890.00,
    },
  ]

  const totalRoyalties = contracts.reduce((acc, c) => acc + (c.monthlyRevenue * (c.royaltyPercent / 100)), 0)
  const totalNetworkRevenue = contracts.reduce((acc, c) => acc + c.monthlyRevenue, 0)
  const totalFranchiseFees = contracts.reduce((acc, c) => acc + (c.franchiseFee || 25000), 0)

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
            Contratos, faturamento consolidado da rede e royalties progressivos
          </p>
        </div>

        <div className="flex items-center gap-2">
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
            onClick={() => setCreateOpen(true)}
            className="h-9 bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 hover:from-purple-800 hover:to-pink-700 dark:hover:from-pink-500 dark:hover:to-purple-500 text-white text-xs font-bold gap-1.5 shadow-md shadow-purple-700/20 dark:shadow-pink-600/30 rounded-xl cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nova Franquia</span>
          </Button>
        </div>
      </div>

      {/* 4 KPIs Globais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="p-4 bg-gradient-to-br from-purple-800 via-purple-900 to-fuchsia-950 text-white rounded-3xl shadow-md border border-purple-700/50">
          <div className="flex justify-between items-start">
            <div className="text-xs font-bold text-purple-100">Faturamento da Rede (Mês)</div>
            <div className="p-2 rounded-xl bg-white/10 text-pink-300"><TrendingUp className="h-4 w-4" /></div>
          </div>
          <div className="text-2xl font-black mt-2 tracking-tight text-white">
            {formatCurrency(totalNetworkRevenue)}
          </div>
          <div className="text-[10px] text-emerald-300 font-bold mt-1">
            ↑ +18.4% vs mês anterior
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-[#160228]/95 text-slate-900 dark:text-white rounded-3xl shadow-xs dark:shadow-xl border border-purple-150 dark:border-white/15">
          <div className="flex justify-between items-start">
            <div className="text-xs font-bold text-purple-700/80 dark:text-purple-200/70">Royalties a Receber</div>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-white/5 text-purple-700 dark:text-pink-400"><DollarSign className="h-4 w-4" /></div>
          </div>
          <div className="text-2xl font-black text-purple-950 dark:text-pink-300 mt-2 tracking-tight font-mono">
            {formatCurrency(totalRoyalties)}
          </div>
          <div className="text-[10px] text-purple-600/70 dark:text-purple-200/60 mt-1 font-medium">
            Apuração automática sobre faturamento
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-[#160228]/95 text-slate-900 dark:text-white rounded-3xl shadow-xs dark:shadow-xl border border-purple-150 dark:border-white/15">
          <div className="flex justify-between items-start">
            <div className="text-xs font-bold text-purple-700/80 dark:text-purple-200/70">Unidades Franqueadas</div>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-white/5 text-purple-700 dark:text-pink-400"><Store className="h-4 w-4" /></div>
          </div>
          <div className="text-2xl font-black text-purple-950 dark:text-white mt-2 tracking-tight">
            {overview?.totalStores || 2} <span className="text-xs font-bold text-purple-700/80 dark:text-purple-200/70">lojas</span>
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-300 font-bold mt-1">
            ✓ 100% das unidades ativas
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-[#160228]/95 text-slate-900 dark:text-white rounded-3xl shadow-xs dark:shadow-xl border border-purple-150 dark:border-white/15">
          <div className="flex justify-between items-start">
            <div className="text-xs font-bold text-purple-700/80 dark:text-purple-200/70">Operadores Ativos</div>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-white/5 text-purple-700 dark:text-pink-400"><Users className="h-4 w-4" /></div>
          </div>
          <div className="text-2xl font-black text-purple-950 dark:text-white mt-2 tracking-tight">
            {overview?.totalOperators || 6} <span className="text-xs font-bold text-purple-700/80 dark:text-purple-200/70">caixas</span>
          </div>
          <div className="text-[10px] text-purple-700 dark:text-pink-300 font-bold mt-1">
            Cota de 3 operadores / loja
          </div>
        </Card>
      </div>

      {/* Abas do Módulo Corporativo */}
      <Tabs defaultValue="stores" className="space-y-4">
        <TabsList className="bg-purple-50/70 dark:bg-white/5 p-1.5 rounded-2xl border border-purple-200 dark:border-white/10 flex flex-wrap h-auto gap-1 shadow-xs">
          <TabsTrigger value="stores" className="text-xs font-bold rounded-xl text-purple-800 dark:text-purple-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-700 data-[state=active]:to-pink-600 dark:data-[state=active]:from-pink-600 dark:data-[state=active]:to-purple-600 data-[state=active]:text-white">
            🏪 Unidades da Rede
          </TabsTrigger>
          <TabsTrigger value="requests" className="text-xs font-bold rounded-xl text-purple-800 dark:text-purple-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-700 data-[state=active]:to-pink-600 dark:data-[state=active]:from-pink-600 dark:data-[state=active]:to-purple-600 data-[state=active]:text-white">
            📩 Solicitações de Lojas
          </TabsTrigger>
          <TabsTrigger value="contracts" className="text-xs font-bold rounded-xl text-purple-800 dark:text-purple-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-700 data-[state=active]:to-pink-600 dark:data-[state=active]:from-pink-600 dark:data-[state=active]:to-purple-600 data-[state=active]:text-white">
            📄 Contratos & Royalties
          </TabsTrigger>
          <TabsTrigger value="financial" className="text-xs font-bold rounded-xl text-purple-800 dark:text-purple-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-700 data-[state=active]:to-pink-600 dark:data-[state=active]:from-pink-600 dark:data-[state=active]:to-purple-600 data-[state=active]:text-white">
            💰 Financeiro Consolidado
          </TabsTrigger>
          <TabsTrigger value="label" className="text-xs font-bold rounded-xl text-purple-800 dark:text-purple-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-700 data-[state=active]:to-pink-600 dark:data-[state=active]:from-pink-600 dark:data-[state=active]:to-purple-600 data-[state=active]:text-white">
            🏷️ Rótulo & Selos Oficiais
          </TabsTrigger>
          <TabsTrigger value="sync" className="text-xs font-bold rounded-xl text-purple-800 dark:text-purple-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-700 data-[state=active]:to-pink-600 dark:data-[state=active]:from-pink-600 dark:data-[state=active]:to-purple-600 data-[state=active]:text-white">
            🔄 Central de Sincronismo
          </TabsTrigger>
        </TabsList>

        {/* 1. Unidades */}
        <TabsContent value="stores" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </TabsContent>

        {/* 1.5 Solicitações de Lojas (Governança da Franqueadora) */}
        <TabsContent value="requests" className="space-y-4">
          <Card className="p-6 bg-white dark:bg-[#160228]/95 border border-purple-150 dark:border-white/15 rounded-3xl space-y-4 text-slate-900 dark:text-white shadow-xs dark:shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm text-purple-950 dark:text-white">Solicitações de Produtos e Preços das Franquias</h3>
                <p className="text-xs text-purple-700/80 dark:text-purple-200/70 mt-0.5">
                  Pedidos enviados pelos gerentes de lojas para aprovação da Holding Açaí da Rose.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-white/5 border border-purple-100 dark:border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 text-white">
                      REAJUSTE DE PREÇO
                    </span>
                    <span className="font-black text-xs text-purple-950 dark:text-white">Açaí 500g</span>
                    <span className="text-xs font-mono font-bold text-purple-700 dark:text-pink-300">De € 12,90 para € 13,50</span>
                  </div>
                  <div className="text-xs text-purple-900 dark:text-purple-200 font-medium">
                    Loja Solicitante: <b className="text-purple-950 dark:text-white">Açaí da Rose — Filial Aveiro</b>
                  </div>
                  <div className="text-xs text-purple-700/80 dark:text-purple-200/60 italic">
                    "Ajuste devido ao custo local de distribuição de frutas frescas em Aveiro."
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    onClick={() => toast.success('Solicitação de preço aprovada e sincronizada com a unidade Aveiro!')}
                    className="h-9 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                  >
                    Aprovar Alteração
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toast.info('Solicitação recusada.')}
                    className="h-9 border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 text-purple-950 dark:text-white font-bold text-xs rounded-xl hover:bg-purple-50 dark:hover:bg-white/10 cursor-pointer shadow-xs"
                  >
                    Recusar
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* 2. Contratos */}
        <TabsContent value="contracts" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contracts.map((c) => (
              <Card key={c.id} className="p-5 bg-white dark:bg-[#160228]/95 border border-purple-150 dark:border-white/15 rounded-3xl space-y-3 text-slate-900 dark:text-white shadow-xs dark:shadow-xl">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-black text-sm text-purple-950 dark:text-white">{c.storeName}</div>
                    <div className="text-xs text-purple-700/80 dark:text-purple-200/70 mt-0.5">Razão Social: <b className="text-purple-950 dark:text-white">{c.franchiseeName}</b></div>
                    <div className="text-[11px] text-purple-600/80 dark:text-purple-200/60">NIF / Contribuinte: {c.nif}</div>
                  </div>
                  <Badge className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-[10px] font-bold">
                    {c.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-purple-100 dark:border-white/10 text-xs">
                  <div>
                    <span className="text-purple-700/80 dark:text-purple-200/70">Início:</span> <b className="text-purple-950 dark:text-white">{c.startDate}</b>
                  </div>
                  <div>
                    <span className="text-purple-700/80 dark:text-purple-200/70">Renovação:</span> <b className="text-purple-950 dark:text-white">{c.renewalDate}</b>
                  </div>
                  <div>
                    <span className="text-purple-700/80 dark:text-purple-200/70">Royalties:</span> <b className="text-purple-700 dark:text-pink-300 font-bold">{c.royaltyPercent}%</b>
                  </div>
                  <div>
                    <span className="text-purple-700/80 dark:text-purple-200/70">Fundo Mkt:</span> <b className="text-purple-950 dark:text-white">{c.marketingPercent}%</b>
                  </div>
                </div>

                <div className="pt-2 border-t border-purple-100 dark:border-white/10 flex justify-between items-center text-xs">
                  <span className="text-purple-700/80 dark:text-purple-200/70">Royalties este mês:</span>
                  <span className="font-black text-sm text-purple-950 dark:text-pink-300 font-mono">
                    {formatCurrency(c.monthlyRevenue * (c.royaltyPercent / 100))}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 3. Financeiro */}
        <TabsContent value="financial" className="space-y-4">
          <Card className="p-6 bg-white dark:bg-[#160228]/95 border border-purple-150 dark:border-white/15 rounded-3xl space-y-4 text-slate-900 dark:text-white shadow-xs dark:shadow-xl">
            <h3 className="font-black text-sm text-purple-950 dark:text-white">Demonstrativo de Faturamento da Rede</h3>
            <div className="divide-y divide-purple-100 dark:divide-white/10 text-xs">
              {contracts.map((c) => (
                <div key={c.id} className="py-3 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-purple-950 dark:text-white">{c.storeName}</div>
                    <div className="text-[11px] text-purple-700/80 dark:text-purple-200/70">Royalties aplicados: {c.royaltyPercent}%</div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-sm text-purple-950 dark:text-white font-mono">{formatCurrency(c.monthlyRevenue)}</div>
                    <div className="text-[11px] text-purple-700 dark:text-pink-300 font-bold font-mono">Repasse Franqueadora: {formatCurrency(c.monthlyRevenue * (c.royaltyPercent / 100))}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* 4. Rótulo Oficial & Selos Técnicos */}
        <TabsContent value="label" className="space-y-4">
          <Card className="p-6 bg-white dark:bg-[#160228]/95 border border-purple-150 dark:border-white/15 rounded-3xl space-y-6 text-slate-900 dark:text-white shadow-xs dark:shadow-xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-purple-100 dark:border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-base text-purple-950 dark:text-white">Rótulo Oficial do Balde & Padrão de Identidade Visual</h3>
                  <Badge className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-[10px] font-black uppercase">5,2L / 4,5 KG</Badge>
                </div>
                <p className="text-xs text-purple-700/80 dark:text-purple-200/70 mt-1">
                  Especificações do documento oficial <i>Rótulo Açaiteria - Rosane LDA</i> para baldes de distribuição e marketing das franquias.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-purple-50/60 dark:bg-white/5 border border-purple-150 dark:border-white/10 text-slate-900 dark:text-white text-right">
                <div className="text-[10px] uppercase font-black text-purple-700 dark:text-pink-400">Distribuição Oficial</div>
                <div className="font-black text-xs text-purple-950 dark:text-white">Açaí da Rosane LDA</div>
                <div className="text-[11px] text-purple-700/80 dark:text-purple-200/70">+351 911 050 264 · +351 249 825 131</div>
              </div>
            </div>

            {/* As 2 Frases Oficiais da Marca */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-800 to-purple-950 text-white space-y-2 shadow-md border border-purple-700/40">
                <Badge className="bg-amber-400 text-purple-950 font-black text-[9px] uppercase">Rótulo do Balde</Badge>
                <div className="font-black text-lg text-fuchsia-200">
                  "O sabor que abraça a alma"
                </div>
                <p className="text-[11px] text-purple-200/80">
                  Slogan oficial impresso na embalagem master de 5,2L (4,5kg) em todas as unidades franqueadas.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-r from-fuchsia-900 to-purple-950 text-white space-y-2 shadow-md border border-purple-700/40">
                <Badge className="bg-pink-400 text-purple-950 font-black text-[9px] uppercase">Banner & Fachada</Badge>
                <div className="font-black text-lg text-pink-200 uppercase tracking-tight">
                  "Açaí não se explica: se experimenta, se apaixona e repete."
                </div>
                <p className="text-[11px] text-purple-200/80">
                  Frase institucional de impacto aplicada nos banners de entrada, totens e cardápio digital do cliente.
                </p>
              </div>
            </div>

            {/* Selos Oficiais e Tabela Nutricional */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
              {/* Selos de Qualidade */}
              <div className="md:col-span-5 space-y-3">
                <h4 className="font-black text-xs uppercase tracking-wider text-purple-700 dark:text-pink-300">Selos de Conformidade Alimentar</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-purple-50/60 dark:bg-white/5 border border-purple-150 dark:border-white/10 text-purple-950 dark:text-white font-bold flex items-center gap-2">
                    <span>🌱</span> 100% VEGAN
                  </div>
                  <div className="p-2.5 rounded-xl bg-purple-50/60 dark:bg-white/5 border border-purple-150 dark:border-white/10 text-purple-950 dark:text-white font-bold flex items-center gap-2">
                    <span>🍇</span> Fruit Rich (Antioxidants)
                  </div>
                  <div className="p-2.5 rounded-xl bg-purple-50/60 dark:bg-white/5 border border-purple-150 dark:border-white/10 text-purple-950 dark:text-white font-bold flex items-center gap-2">
                    <span>🥛</span> Dairy Free (Sem Leite)
                  </div>
                  <div className="p-2.5 rounded-xl bg-purple-50/60 dark:bg-white/5 border border-purple-150 dark:border-white/10 text-purple-950 dark:text-white font-bold flex items-center gap-2">
                    <span>🌾</span> Gluten Free (Sem Glúten)
                  </div>
                  <div className="p-2.5 rounded-xl bg-purple-50/60 dark:bg-white/5 border border-purple-150 dark:border-white/10 text-purple-950 dark:text-white font-bold flex items-center gap-2">
                    <span>🛡️</span> Preservatives Free
                  </div>
                  <div className="p-2.5 rounded-xl bg-purple-50/60 dark:bg-white/5 border border-purple-150 dark:border-white/10 text-purple-950 dark:text-white font-bold flex items-center gap-2">
                    <span>🧬</span> GMO Free (Sem OGM)
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-purple-50/60 dark:bg-white/5 border border-purple-150 dark:border-white/10 text-[11px] text-purple-900 dark:text-purple-200/90 space-y-1 mt-3">
                  <div className="font-bold text-purple-950 dark:text-white">Ingredientes Oficiais (PT):</div>
                  <p>
                    Polpa de Açaí premium, Água, Glucose, Açúcar demerara, Extrato natural de Guaraná, Estabilizante (goma de guar, goma tara, Carboximetilcelulose), Dextrose, Maltodextrina e Ácido cítrico.
                  </p>
                </div>
              </div>

              {/* Tabela Nutricional */}
              <div className="md:col-span-7 space-y-3">
                <h4 className="font-black text-xs uppercase tracking-wider text-purple-700 dark:text-pink-300">Informação Nutricional Oficial (Porção 100g)</h4>
                <div className="border border-purple-150 dark:border-white/15 rounded-2xl overflow-hidden shadow-xs dark:shadow-lg">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-purple-100/70 dark:bg-white/10 text-purple-950 dark:text-white text-[11px] uppercase">
                      <tr>
                        <th className="p-2.5">Componente</th>
                        <th className="p-2.5 text-right">Quantidade (100g)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-100 dark:divide-white/10 font-medium text-slate-900 dark:text-white">
                      <tr className="bg-purple-50/40 dark:bg-white/5">
                        <td className="p-2.5">Valor Energético / Energia</td>
                        <td className="p-2.5 text-right font-black text-purple-800 dark:text-pink-300">111 kcal / 469 kJ</td>
                      </tr>
                      <tr>
                        <td className="p-2.5">Proteínas</td>
                        <td className="p-2.5 text-right font-mono text-purple-900 dark:text-purple-200">0,5 g</td>
                      </tr>
                      <tr>
                        <td className="p-2.5">Lípidos (dos quais saturados)</td>
                        <td className="p-2.5 text-right font-mono text-purple-900 dark:text-purple-200">2,3 g (0,6 g)</td>
                      </tr>
                      <tr>
                        <td className="p-2.5">Hidratos de Carbono (dos quais açúcares)</td>
                        <td className="p-2.5 text-right font-mono text-purple-900 dark:text-purple-200">20,9 g (20,7 g)</td>
                      </tr>
                      <tr>
                        <td className="p-2.5">Fibra Alimentar</td>
                        <td className="p-2.5 text-right font-mono text-purple-900 dark:text-purple-200">2,5 g</td>
                      </tr>
                      <tr>
                        <td className="p-2.5">Cálcio / Vitamina C / Potássio</td>
                        <td className="p-2.5 text-right font-mono text-purple-900 dark:text-purple-200">103 mg / 13 mg / 28,2 mg</td>
                      </tr>
                      <tr>
                        <td className="p-2.5">Sal</td>
                        <td className="p-2.5 text-right font-mono text-purple-900 dark:text-purple-200">0,05 g</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* 5. Sincronismo */}
        <TabsContent value="sync" className="space-y-4">
          <Card className="p-6 bg-white dark:bg-[#160228]/95 border border-purple-150 dark:border-white/15 rounded-3xl space-y-6 text-slate-900 dark:text-white shadow-xs dark:shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-purple-100 dark:border-white/10">
              <div>
                <h3 className="font-black text-base text-purple-950 dark:text-white flex items-center gap-2">
                  <span>⚡ Central de Replicação Master do Cardápio</span>
                  <Badge className="bg-amber-400 text-purple-950 font-black text-[10px] py-0.5 px-2 border-0">
                    Franqueadora Global
                  </Badge>
                </h3>
                <p className="text-xs text-purple-700/80 dark:text-purple-200/70 mt-1">
                  Transmita instantaneamente novos produtos, fotos de estúdio e regras de preços para toda a rede de franquias.
                </p>
              </div>

              <Button
                onClick={handleSyncAll}
                disabled={syncing}
                className="bg-gradient-to-r from-purple-700 via-purple-800 to-pink-600 dark:from-pink-600 dark:via-fuchsia-600 dark:to-purple-600 hover:from-purple-800 hover:to-pink-700 text-white font-black text-xs h-11 px-5 rounded-2xl shadow-lg shadow-purple-700/20 dark:shadow-pink-600/30 gap-2 cursor-pointer transition hover:scale-105"
              >
                <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                <span>{syncing ? 'A Replicar Cardápio...' : 'Replicar para Todas as Lojas'}</span>
              </Button>
            </div>

            {/* Resumo do Catálogo Master */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-white/5 border border-purple-150 dark:border-white/10 text-center">
                <div className="text-xl font-black text-purple-950 dark:text-white">5 Copos</div>
                <div className="text-[10px] text-purple-700 dark:text-purple-300/80 font-bold uppercase mt-0.5">
                  250g a 1Kg (Fotos 8K)
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-white/5 border border-purple-150 dark:border-white/10 text-center">
                <div className="text-xl font-black text-purple-950 dark:text-white">6 Bases</div>
                <div className="text-[10px] text-purple-700 dark:text-purple-300/80 font-bold uppercase mt-0.5">
                  Puro & Cremes
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-white/5 border border-purple-150 dark:border-white/10 text-center">
                <div className="text-xl font-black text-purple-950 dark:text-white">6 Frutas</div>
                <div className="text-[10px] text-purple-700 dark:text-purple-300/80 font-bold uppercase mt-0.5">
                  Frutas Frescas
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-white/5 border border-purple-150 dark:border-white/10 text-center">
                <div className="text-xl font-black text-purple-950 dark:text-white">16 Toppings</div>
                <div className="text-[10px] text-purple-700 dark:text-purple-300/80 font-bold uppercase mt-0.5">
                  Crocantes & Caldas
                </div>
              </div>
            </div>

            {/* Lojas Receptoras Conectadas */}
            <div className="space-y-2.5">
              <div className="text-xs font-black uppercase text-purple-950 dark:text-white tracking-wider flex items-center justify-between">
                <span>Unidades Receptoras Ativas ({overview?.stores?.length || 3})</span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">● Rede 100% Online</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(overview?.stores || []).map((s: StoreOverview) => (
                  <div
                    key={s.tenant.id}
                    className="p-4 rounded-2xl bg-white dark:bg-white/[0.04] border border-purple-150 dark:border-white/10 hover:border-pink-500/40 transition flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-purple-950 dark:text-white">
                          {s.tenant.name}
                        </span>
                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[9px] py-0 px-1.5 border-0">
                          Ativa
                        </Badge>
                      </div>
                      <div className="text-[11px] text-purple-700 dark:text-purple-300/70 mt-1">
                        {s.tenant.city || 'Portugal'} · {s.tenant.address}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-purple-100 dark:border-white/10 flex items-center justify-between text-[10px] text-purple-600 dark:text-purple-300/60 font-semibold">
                      <span>Status do Cardápio:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">Sincronizado</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <CreateStoreDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSave={handleCreateStore}
      />
      
      <StoreDetailsDialog
        open={!!detailsStore}
        onOpenChange={(o) => !o && setDetailsStore(null)}
        storeOverview={detailsStore}
        onSelectStore={(t) => {
          setCurrentTenant(t)
          setDetailsStore(null)
          toast.success(`Loja ativa alterada para: ${t.name}`)
        }}
      />
    </div>
  )
}
