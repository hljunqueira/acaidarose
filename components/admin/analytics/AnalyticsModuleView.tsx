'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  TrendingUp,
  BarChart3,
  Calendar,
  Building2,
  RefreshCw,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Layers,
  Star,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/stores/authStore'
import { useFranchiseStore } from '@/lib/stores/franchiseStore'
import { formatCurrency } from '@/lib/i18n/formatters'

export type AnalyticsTab = 'overview' | 'products' | 'toppings'

interface AnalyticsModuleViewProps {
  initialTab?: AnalyticsTab
  onTabChange?: (tab: AnalyticsTab) => void
  onNavigateToFeedback?: () => void
}

export default function AnalyticsModuleView({
  initialTab = 'overview',
  onTabChange,
  onNavigateToFeedback,
}: AnalyticsModuleViewProps) {
  const { user } = useAuthStore()
  const { tenants, currentTenant } = useFranchiseStore()

  // Governança Multi-Tenant: apenas franqueadora master pode alternar filiais
  const isMaster = user?.role === 'SUPER_ADMIN' || user?.role === 'FRANCHISOR_ADMIN'
  const defaultLoja = isMaster ? (currentTenant?.id || 'ALL') : (user?.tenantId || '')

  const [activeTab, setActiveTab] = useState<AnalyticsTab>(initialTab)
  const [selectedBranch, setSelectedBranch] = useState<string>(defaultLoja)
  const [period, setPeriod] = useState<'today' | 'yesterday' | 'month' | 'custom'>('yesterday')

  // Sub-abas de ordenação nas tabelas de Produtos e Opcionais
  const [rankingSort, setRankingSort] = useState<'most' | 'least'>('most')

  // Estados dos dados da API
  const [loading, setLoading] = useState(false)
  const [dateFormatted, setDateFormatted] = useState('')
  const [metrics, setMetrics] = useState({
    revenue: 0,
    averageTicket: 0,
    orderVolume: 0,
  })
  const [hourlyData, setHourlyData] = useState<{ hour: string; label: string; revenue: number; volume: number }[]>([])
  const [productsData, setProductsData] = useState<{
    mostSold: { name: string; quantity: number; revenue: number }[]
    leastSold: { name: string; quantity: number; revenue: number }[]
    totalItems: number
  }>({ mostSold: [], leastSold: [], totalItems: 0 })
  const [toppingsData, setToppingsData] = useState<{
    mostSold: { name: string; quantity: number; revenue: number }[]
    leastSold: { name: string; quantity: number; revenue: number }[]
    totalItems: number
  }>({ mostSold: [], leastSold: [], totalItems: 0 })
  const [ratingSummary, setRatingSummary] = useState({
    totalReviews: 0,
    averageScore: 0,
    npsScore: 0,
  })

  // Sincroniza activeTab externa caso o prop mude
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab)
  }, [initialTab])

  const handleSelectTab = (tab: AnalyticsTab) => {
    setActiveTab(tab)
    if (onTabChange) onTabChange(tab)
  }

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams()
      if (isMaster && selectedBranch && selectedBranch !== 'ALL') {
        q.set('loja', selectedBranch)
      } else if (!isMaster && user?.tenantId) {
        q.set('loja', user.tenantId)
      }
      q.set('periodo', period)

      const res = await fetch(`/api/analytics/sales?${q.toString()}`)
      if (!res.ok) throw new Error('Falha ao carregar métricas')

      const data = await res.json()
      setDateFormatted(data.dateFormatted || '')
      setMetrics(data.metrics || { revenue: 0, averageTicket: 0, orderVolume: 0 })
      setHourlyData(data.hourlyData || [])
      setProductsData(data.products || { mostSold: [], leastSold: [], totalItems: 0 })
      setToppingsData(data.toppings || { mostSold: [], leastSold: [], totalItems: 0 })
      setRatingSummary(data.customerRatingSummary || { totalReviews: 0, averageScore: 0, npsScore: 0 })
    } catch {
      toast.error('Erro ao carregar dados do Analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [selectedBranch, period])

  // Máximo valor no gráfico de 24h para escala proporcional
  const maxHourlyRevenue = useMemo(() => {
    const maxVal = Math.max(...hourlyData.map((h) => h.revenue), 0)
    return maxVal > 0 ? maxVal : 10
  }, [hourlyData])

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8 space-y-6">
      {/* 1. SELETOR DE ABAS SUPERIOR DO ANALYTICS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'Visão Geral' },
            { id: 'products', label: 'Venda de produtos' },
            { id: 'toppings', label: 'Vendas opcionais' },
          ].map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSelectTab(tab.id as AnalyticsTab)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 dark:bg-pink-600 text-white shadow-sm shadow-blue-600/20'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Governança de Lojas (Apenas Franqueadora Master) e Atualizar */}
        <div className="flex items-center gap-2.5 shrink-0">
          {isMaster && (
            <div className="flex items-center gap-1.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/15 px-3 py-1.5 rounded-xl">
              <Building2 className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="text-xs font-bold bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Todas as Lojas (Rede Global)</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadAnalytics}
            disabled={loading}
            className="h-9 px-3 rounded-xl text-xs font-bold border-slate-200 dark:border-white/15 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CONTEÚDO DA ABA SELECIONADA                                            */}
      {/* ========================================================================= */}

      {/* ------------------------------------------------------------------------- */}
      {/* ABA 1: VISÃO GERAL (Fiel à Imagem 2 do Benchmark)                         */}
      {/* ------------------------------------------------------------------------- */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Cabeçalho com Título, Subtítulo com Data e Pílulas de Filtro */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Análises
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                <span>{dateFormatted || 'Segunda-feira, 7 de setembro de 2026'}</span>
                <Info className="h-3.5 w-3.5 text-slate-400" />
              </p>
            </div>

            {/* Pílulas de Período (Fiel ao Benchmark) */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/10 w-fit">
              {[
                { id: 'today', label: 'Hoje' },
                { id: 'yesterday', label: 'Ontem' },
                { id: 'month', label: 'Este mês' },
                { id: 'custom', label: 'Customizado' },
              ].map((p) => {
                const isActive = period === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPeriod(p.id as any)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Cards de Métricas Principais (Topo) */}
          <div className="bg-white dark:bg-[#160228] p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xs space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Receita */}
              <div className="space-y-1">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Receita</span>
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono">
                  {formatCurrency(metrics.revenue)}
                </div>
                <div className="h-0.5 w-12 bg-blue-600 mt-2" />
              </div>

              {/* Ticket Médio / Pedido */}
              <div className="space-y-1">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Ticket médio/pedido</span>
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono">
                  {formatCurrency(metrics.averageTicket)}
                </div>
              </div>

              {/* Volume de Pedidos */}
              <div className="space-y-1">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Volume</span>
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono">
                  {metrics.orderVolume}
                </div>
              </div>
            </div>

            {/* Gráfico de Vendas por Horário (Timeline 24h) */}
            <div className="pt-6 border-t border-slate-100 dark:border-white/10 space-y-3">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>R$ 0,00</span>
                <span className="text-[10px] font-mono">24 Horas</span>
              </div>

              {/* Barra / Timeline Horária */}
              <div className="h-28 w-full flex items-end gap-1 pt-4 pb-2 px-1 bg-slate-50/50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                {hourlyData.map((slot) => {
                  const heightPercent = maxHourlyRevenue > 0 ? (slot.revenue / maxHourlyRevenue) * 100 : 0
                  return (
                    <div
                      key={slot.hour}
                      className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                    >
                      {/* Tooltip ao passar o mouse */}
                      <div className="absolute -top-10 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                        <div className="bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap">
                          {slot.hour}: {formatCurrency(slot.revenue)} ({slot.volume} ped.)
                        </div>
                      </div>

                      <div
                        style={{ height: `${Math.max(4, heightPercent)}%` }}
                        className={`w-full rounded-t-xs transition-all ${
                          slot.revenue > 0
                            ? 'bg-blue-600 dark:bg-pink-500 group-hover:bg-blue-700'
                            : 'bg-slate-200 dark:bg-white/10'
                        }`}
                      />
                    </div>
                  )
                })}
              </div>

              {/* Marcações do Eixo X (Horas) */}
              <div className="flex justify-between text-[10px] text-slate-400 font-mono overflow-x-auto no-scrollbar pt-1">
                {['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'].map((hr) => (
                  <span key={hr}>{hr}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Seção "Visão Geral dos Relatórios" */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Visão geral dos relatórios
            </h2>

            {/* Card de Avaliação de Clientes (Fiel à imagem de referência) */}
            <div className="bg-white dark:bg-[#160228] p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                  <span>Avaliação de clientes</span>
                  <Info className="h-3.5 w-3.5 text-slate-400" />
                </div>

                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Nota geral</span>
                  <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
                    {ratingSummary.totalReviews > 0 ? ratingSummary.averageScore.toFixed(1) : '0'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {ratingSummary.totalReviews} avaliações
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 pt-1">
                  {ratingSummary.totalReviews > 0
                    ? `NPS da unidade: ${ratingSummary.npsScore > 0 ? `+${ratingSummary.npsScore}` : ratingSummary.npsScore}`
                    : 'Sem avaliações registadas no período'}
                </div>
              </div>

              {onNavigateToFeedback && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onNavigateToFeedback}
                  className="rounded-xl text-xs font-bold border-slate-300 dark:border-white/15 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-1.5 self-start sm:self-center cursor-pointer"
                >
                  <span>Ver Todos os Feedbacks</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* ABA 2: VENDA DE PRODUTOS (Fiel à Imagem 3 do Benchmark)                   */}
      {/* ------------------------------------------------------------------------- */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Venda de produtos
            </h1>

            {/* Pílulas de Período */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/10 w-fit">
              {[
                { id: 'today', label: 'Hoje' },
                { id: 'yesterday', label: 'Ontem' },
                { id: 'month', label: 'Este mês' },
                { id: 'custom', label: 'Customizado' },
              ].map((p) => {
                const isActive = period === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPeriod(p.id as any)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tabela com Sub-abas Mais Vendidos / Menos Vendidos */}
          <div className="bg-white dark:bg-[#160228] rounded-2xl border border-slate-200 dark:border-white/10 shadow-xs overflow-hidden">
            {/* Sub-abas Internas (Mais vendidos / Menos vendidos com sublinhado) */}
            <div className="flex items-center gap-6 px-6 pt-4 border-b border-slate-100 dark:border-white/10">
              <button
                type="button"
                onClick={() => setRankingSort('most')}
                className={`pb-3 text-xs font-bold transition-all cursor-pointer relative ${
                  rankingSort === 'most'
                    ? 'text-blue-600 dark:text-pink-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <span>Mais vendidos</span>
                {rankingSort === 'most' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-pink-400 rounded-full" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setRankingSort('least')}
                className={`pb-3 text-xs font-bold transition-all cursor-pointer relative ${
                  rankingSort === 'least'
                    ? 'text-blue-600 dark:text-pink-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <span>Menos vendidos</span>
                {rankingSort === 'least' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-pink-400 rounded-full" />
                )}
              </button>
            </div>

            {/* Cabeçalho da Tabela: PRODUTO | VENDAS | RECEITA */}
            <div className="grid grid-cols-12 px-6 py-3 bg-slate-50/70 dark:bg-white/5 border-b border-slate-100 dark:border-white/10 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <div className="col-span-6">PRODUTO</div>
              <div className="col-span-3 text-center">VENDAS</div>
              <div className="col-span-3 text-right">RECEITA</div>
            </div>

            {/* Linhas ou Estado Vazio */}
            {(() => {
              const list = rankingSort === 'most' ? productsData.mostSold : productsData.leastSold
              if (list.length === 0) {
                return (
                  <div className="py-16 text-center text-xs text-slate-400 dark:text-slate-500 space-y-1">
                    <p>Nenhum produto vendido no período selecionado.</p>
                  </div>
                )
              }

              return (
                <div className="divide-y divide-slate-100 dark:divide-white/10">
                  {list.map((item, idx) => (
                    <div
                      key={`${item.name}-${idx}`}
                      className="grid grid-cols-12 px-6 py-3.5 text-xs text-slate-800 dark:text-slate-200 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors items-center"
                    >
                      <div className="col-span-6 font-bold truncate pr-2">{item.name}</div>
                      <div className="col-span-3 text-center font-mono font-semibold">{item.quantity}</div>
                      <div className="col-span-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(item.revenue)}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* ABA 3: VENDAS OPCIONAIS (Fiel à Imagem 4 do Benchmark)                     */}
      {/* ------------------------------------------------------------------------- */}
      {activeTab === 'toppings' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Vendas opcionais
            </h1>

            {/* Pílulas de Período */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/10 w-fit">
              {[
                { id: 'today', label: 'Hoje' },
                { id: 'yesterday', label: 'Ontem' },
                { id: 'month', label: 'Este mês' },
                { id: 'custom', label: 'Customizado' },
              ].map((p) => {
                const isActive = period === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPeriod(p.id as any)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tabela de Acompanhamentos com Sub-abas Mais Vendidos / Menos Vendidos */}
          <div className="bg-white dark:bg-[#160228] rounded-2xl border border-slate-200 dark:border-white/10 shadow-xs overflow-hidden">
            {/* Sub-abas Internas */}
            <div className="flex items-center gap-6 px-6 pt-4 border-b border-slate-100 dark:border-white/10">
              <button
                type="button"
                onClick={() => setRankingSort('most')}
                className={`pb-3 text-xs font-bold transition-all cursor-pointer relative ${
                  rankingSort === 'most'
                    ? 'text-blue-600 dark:text-pink-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <span>Mais vendidos</span>
                {rankingSort === 'most' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-pink-400 rounded-full" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setRankingSort('least')}
                className={`pb-3 text-xs font-bold transition-all cursor-pointer relative ${
                  rankingSort === 'least'
                    ? 'text-blue-600 dark:text-pink-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <span>Menos vendidos</span>
                {rankingSort === 'least' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-pink-400 rounded-full" />
                )}
              </button>
            </div>

            {/* Cabeçalho da Tabela: PRODUTO (ou ACOMPANHAMENTO) | VENDAS | RECEITA */}
            <div className="grid grid-cols-12 px-6 py-3 bg-slate-50/70 dark:bg-white/5 border-b border-slate-100 dark:border-white/10 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <div className="col-span-6">PRODUTO</div>
              <div className="col-span-3 text-center">VENDAS</div>
              <div className="col-span-3 text-right">RECEITA</div>
            </div>

            {/* Linhas ou Estado Vazio */}
            {(() => {
              const list = rankingSort === 'most' ? toppingsData.mostSold : toppingsData.leastSold
              if (list.length === 0) {
                return (
                  <div className="py-16 text-center text-xs text-slate-400 dark:text-slate-500 space-y-1">
                    <p>Nenhum opcional vendido no período selecionado.</p>
                  </div>
                )
              }

              return (
                <div className="divide-y divide-slate-100 dark:divide-white/10">
                  {list.map((item, idx) => (
                    <div
                      key={`${item.name}-${idx}`}
                      className="grid grid-cols-12 px-6 py-3.5 text-xs text-slate-800 dark:text-slate-200 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors items-center"
                    >
                      <div className="col-span-6 font-bold truncate pr-2">{item.name}</div>
                      <div className="col-span-3 text-center font-mono font-semibold">{item.quantity}</div>
                      <div className="col-span-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(item.revenue)}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
