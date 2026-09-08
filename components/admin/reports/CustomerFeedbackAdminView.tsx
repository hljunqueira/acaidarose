'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Star,
  ThumbsUp,
  Meh,
  ThumbsDown,
  MessageSquare,
  Search,
  Download,
  Calendar,
  Building2,
  RefreshCw,
  Clock,
  User,
  Phone,
  Trash2,
  AlertTriangle,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/stores/authStore'
import { useFranchiseStore } from '@/lib/stores/franchiseStore'
import SatisfactionSurveyManagerModal from '../surveys/SatisfactionSurveyManagerModal'

interface FeedbackItem {
  id: string
  tenantId: string
  tenantName?: string
  orderId?: string | null
  score: number
  comment?: string
  customerName?: string
  customerPhone?: string | null
  tableNumber?: string | null
  criteriaScores?: Record<string, number>
  language?: string
  createdAt: string
}

interface RatingsSummary {
  totalReviews: number
  totalCount?: number
  averageScore: number
  npsScore: number
  promotersPercent: number
  passivesPercent: number
  detractorsPercent: number
  criteriaAverages: Record<string, number>
}

export default function CustomerFeedbackAdminView() {
  const { user } = useAuthStore()
  const { tenants, currentTenant, setCurrentTenant } = useFranchiseStore()

  // Governança Multi-Tenant: apenas franqueadora pode alternar filiais
  const isMaster = user?.role === 'SUPER_ADMIN' || user?.role === 'FRANCHISOR_ADMIN'
  const storeId = isMaster ? (currentTenant?.id || '') : (user?.tenantId || '')

  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([])
  const [summary, setSummary] = useState<RatingsSummary | null>(null)
  const [loading, setLoading] = useState(false)

  // Filtros
  const [selectedBranch, setSelectedBranch] = useState<string>(storeId || 'ALL')
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7d' | '30d'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [surveyModalOpen, setSurveyModalOpen] = useState(false)

  // Modais de Segurança (sem window.confirm nativo)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [feedbackToDelete, setFeedbackToDelete] = useState<FeedbackItem | null>(null)
  const [deletingOne, setDeletingOne] = useState(false)

  // Sincroniza selectedBranch quando o storeId mudar
  useEffect(() => {
    if (!isMaster) {
      setSelectedBranch(user?.tenantId || '')
    }
  }, [isMaster, user?.tenantId])

  const loadFeedbacks = async () => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams()
      if (isMaster && selectedBranch && selectedBranch !== 'ALL') {
        queryParams.set('loja', selectedBranch)
      } else if (!isMaster && user?.tenantId) {
        queryParams.set('loja', user.tenantId)
      }

      const res = await fetch(`/api/ratings?${queryParams.toString()}`)
      if (!res.ok) throw new Error('Falha ao carregar feedbacks')

      const data = await res.json()
      const itemsList = Array.isArray(data.ratings)
        ? data.ratings
        : Array.isArray(data.reviews)
        ? data.reviews
        : []

      setFeedbacks(itemsList)

      const summaryObj = data.summary || data.metrics || null
      setSummary(summaryObj)
    } catch {
      toast.error('Erro ao carregar feedbacks dos clientes')
      setFeedbacks([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFeedbacks()
  }, [selectedBranch])

  // Filtragem local por busca e data
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((f) => {
      // Filtro de data
      if (dateFilter !== 'all') {
        const itemDate = new Date(f.createdAt)
        const now = new Date()
        if (dateFilter === 'today') {
          if (itemDate.toDateString() !== now.toDateString()) return false
        } else if (dateFilter === '7d') {
          const past7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          if (itemDate < past7) return false
        } else if (dateFilter === '30d') {
          const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          if (itemDate < past30) return false
        }
      }

      // Filtro de texto
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase()
        const matchName = (f.customerName || '').toLowerCase().includes(term)
        const matchComment = (f.comment || '').toLowerCase().includes(term)
        const matchPhone = (f.customerPhone || '').toLowerCase().includes(term)
        const matchTable = (f.tableNumber || '').toLowerCase().includes(term)
        if (!matchName && !matchComment && !matchPhone && !matchTable) return false
      }

      return true
    })
  }, [feedbacks, dateFilter, searchTerm])

  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleString('pt-PT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  // Confirmação de Exclusão de 1 Feedback
  const handleConfirmDeleteOne = async () => {
    if (!feedbackToDelete) return
    setDeletingOne(true)
    try {
      const res = await fetch(`/api/ratings?id=${encodeURIComponent(feedbackToDelete.id)}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Falha ao eliminar avaliação')

      toast.success('Avaliação eliminada com sucesso!')
      setDeleteModalOpen(false)
      setFeedbackToDelete(null)
      loadFeedbacks()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao eliminar avaliação')
    } finally {
      setDeletingOne(false)
    }
  }



  // Exportação CSV
  const handleExportCSV = () => {
    if (filteredFeedbacks.length === 0) {
      toast.error('Nenhum dado para exportar no período selecionado')
      return
    }

    const headers = [
      'ID',
      'Data / Hora',
      'Loja',
      'Cliente',
      'Telefone',
      'Mesa',
      'Nota Geral',
      'Classificação NPS',
      'Critérios',
      'Comentário',
      'Idioma',
    ]

    const rows = filteredFeedbacks.map((f) => {
      const npsType = f.score === 5 ? 'Promotor' : f.score === 4 ? 'Neutro' : 'Detrator'
      const criteriaStr = f.criteriaScores
        ? Object.entries(f.criteriaScores)
            .map(([k, v]) => `${k}:${v}`)
            .join(' | ')
        : ''

      return [
        `"${f.id}"`,
        `"${formatDateTime(f.createdAt)}"`,
        `"${f.tenantName || selectedBranch}"`,
        `"${f.customerName || 'Anónimo'}"`,
        `"${f.customerPhone || ''}"`,
        `"${f.tableNumber || 'Balcão'}"`,
        f.score,
        `"${npsType}"`,
        `"${criteriaStr}"`,
        `"${(f.comment || '').replace(/"/g, '""')}"`,
        `"${f.language || 'pt'}"`,
      ]
    })

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `relatorio_feedbacks_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Relatório de feedbacks exportado com sucesso!')
  }

  const getNpsBadge = (score: number) => {
    if (score === 5) {
      return (
        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 text-[10.5px] font-bold">
          <ThumbsUp className="h-3 w-3 mr-1" />
          Promotor
        </Badge>
      )
    }
    if (score === 4) {
      return (
        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300 border border-blue-300 dark:border-blue-500/30 text-[10.5px] font-bold">
          <Meh className="h-3 w-3 mr-1" />
          Neutro
        </Badge>
      )
    }
    return (
      <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30 text-[10.5px] font-bold">
        <ThumbsDown className="h-3 w-3 mr-1" />
        Detrator
      </Badge>
    )
  }

  const totalReviewsCount = summary ? summary.totalReviews : feedbacks.length
  const isZeroState = totalReviewsCount === 0

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8 space-y-6">
      {/* 1. CABEÇALHO DA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Feedbacks
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-purple-200/70 mt-0.5">
            Monitore as avaliações e comentários dos clientes
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* BOTÃO ATUALIZAR */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadFeedbacks}
            disabled={loading}
            className="h-10 rounded-xl text-xs font-bold border-purple-200 dark:border-white/15 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </Button>

          {/* BOTÃO EXPORTAR RELATÓRIO */}
          <Button
            type="button"
            size="sm"
            onClick={handleExportCSV}
            className="h-10 rounded-xl text-xs font-bold bg-purple-900 hover:bg-purple-800 text-white cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Exportar relatório</span>
          </Button>

          {/* BOTÃO PESQUISA DE SATISFAÇÃO */}
          <Button
            type="button"
            size="sm"
            onClick={() => setSurveyModalOpen(true)}
            className="h-10 rounded-xl text-xs font-bold bg-purple-950 hover:bg-purple-900 text-white cursor-pointer shadow-xs flex items-center gap-1.5 border border-purple-700/40"
          >
            <FileText className="h-3.5 w-3.5 text-pink-400" />
            <span>Pesquisa de Satisfação</span>
          </Button>
        </div>
      </div>

      {/* 2. CARD "MÉDIA DE AVALIAÇÕES" (ESTADO ZERADO RIGOROSO OU COM DADOS) */}
      <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-gradient-to-br dark:from-[#200336] dark:to-[#160226] border border-purple-100 dark:border-white/10 shadow-sm space-y-5">
        <div className="text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-pink-300">
          Média de avaliações
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Coluna Esquerda: Nota Geral Grande + Estrelas + Total */}
          <div className="lg:col-span-4 flex flex-col items-center sm:items-start space-y-2 border-b lg:border-b-0 lg:border-r border-purple-100 dark:border-white/10 pb-6 lg:pb-0 lg:pr-6">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl sm:text-6xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                {!isZeroState && summary ? summary.averageScore.toFixed(1) : '0.0'}
              </span>
              <span className="text-sm font-bold text-slate-400 dark:text-purple-300/60">/ 5.0</span>
            </div>

            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => {
                const avg = !isZeroState && summary ? summary.averageScore : 0
                const isFilled = avg > 0 && star <= Math.round(avg)
                return (
                  <Star
                    key={star}
                    className={`h-5 w-5 transition-colors ${
                      isFilled
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-200 dark:text-white/20 fill-transparent'
                    }`}
                  />
                )
              })}
            </div>

            <div className="text-xs font-medium text-slate-500 dark:text-purple-300">
              Baseado em <strong>{totalReviewsCount}</strong> avaliações de clientes
            </div>
          </div>

          {/* Coluna Direita: Métricas de NPS e Médias por Critério */}
          <div className="lg:col-span-8 space-y-4">
            {/* Barra de Distribuição de NPS */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-purple-200">
                <span>
                  Distribuição de Clientes (NPS:{' '}
                  {!isZeroState && summary
                    ? summary.npsScore > 0
                      ? `+${summary.npsScore}`
                      : summary.npsScore
                    : '0'}
                  )
                </span>
                <span className={`font-mono text-[11px] font-bold ${!isZeroState ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                  {!isZeroState && summary
                    ? `${summary.promotersPercent}% Promotores`
                    : 'Sem avaliações'}
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden flex">
                {!isZeroState && summary ? (
                  <>
                    <div
                      style={{ width: `${summary.promotersPercent}%` }}
                      className="bg-emerald-500 h-full transition-all"
                      title="Promotores (Nota 5)"
                    />
                    <div
                      style={{ width: `${summary.passivesPercent}%` }}
                      className="bg-blue-400 h-full transition-all"
                      title="Neutros (Nota 4)"
                    />
                    <div
                      style={{ width: `${summary.detractorsPercent}%` }}
                      className="bg-rose-500 h-full transition-all"
                      title="Detratores (Nota 1 a 3)"
                    />
                  </>
                ) : (
                  <div className="w-full h-full bg-slate-200/80 dark:bg-white/5" />
                )}
              </div>
            </div>

            {/* Critérios Específicos Avaliados */}
            {!isZeroState && summary?.criteriaAverages && Object.keys(summary.criteriaAverages).length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                {Object.entries(summary.criteriaAverages).map(([criterion, avg]) => (
                  <div
                    key={criterion}
                    className="p-3 rounded-2xl bg-purple-50/70 dark:bg-white/5 border border-purple-100/70 dark:border-white/10 text-center"
                  >
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-purple-300/80 truncate">
                      {criterion}
                    </div>
                    <div className="text-lg font-bold text-purple-950 dark:text-pink-300 font-mono mt-0.5">
                      {avg.toFixed(1)} ★
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground pt-1 italic">
                {isZeroState
                  ? 'Aguardando as primeiras avaliações dos clientes para exibir médias por critério.'
                  : 'Nenhum critério específico avaliado ainda.'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. TOOLBAR DE FILTROS (Filial à esquerda, Filtros de dias e Buscar juntos no final) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        {/* Lado Esquerdo: SELETOR DE LOJAS / FILIAIS */}
        <div>
          {isMaster ? (
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white dark:bg-white/5 border border-purple-200 dark:border-white/15">
              <Building2 className="h-4 w-4 text-purple-700 dark:text-pink-400 ml-2" />
              <select
                value={selectedBranch}
                onChange={(e) => {
                  setSelectedBranch(e.target.value)
                  if (e.target.value !== 'ALL') {
                    const found = tenants.find((t) => t.id === e.target.value)
                    if (found) setCurrentTenant(found)
                  }
                }}
                className="text-xs font-bold bg-transparent text-slate-800 dark:text-white px-2 py-1.5 rounded-xl focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="text-black dark:text-white dark:bg-slate-900">
                  Todas as Unidades (Rede)
                </option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id} className="text-black dark:text-white dark:bg-slate-900">
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="text-xs font-bold text-slate-500">
              {feedbacks.length} avaliações registadas
            </div>
          )}
        </div>

        {/* Lado Direito (JUNTOS NO FINAL): FILTROS DE DIAS E BUSCAR */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* SELETOR DE PERÍODO / DATA */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-white dark:bg-white/5 border border-purple-200 dark:border-white/15 text-xs font-bold">
            <Calendar className="h-3.5 w-3.5 text-slate-400 ml-2 mr-1" />
            <button
              type="button"
              onClick={() => setDateFilter('all')}
              className={`px-2.5 py-1 rounded-xl transition cursor-pointer ${
                dateFilter === 'all'
                  ? 'bg-purple-900 text-white dark:bg-pink-600'
                  : 'text-slate-600 dark:text-purple-200 hover:text-slate-900'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('today')}
              className={`px-2.5 py-1 rounded-xl transition cursor-pointer ${
                dateFilter === 'today'
                  ? 'bg-purple-900 text-white dark:bg-pink-600'
                  : 'text-slate-600 dark:text-purple-200 hover:text-slate-900'
              }`}
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('7d')}
              className={`px-2.5 py-1 rounded-xl transition cursor-pointer ${
                dateFilter === '7d'
                  ? 'bg-purple-900 text-white dark:bg-pink-600'
                  : 'text-slate-600 dark:text-purple-200 hover:text-slate-900'
              }`}
            >
              7 Dias
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('30d')}
              className={`px-2.5 py-1 rounded-xl transition cursor-pointer ${
                dateFilter === '30d'
                  ? 'bg-purple-900 text-white dark:bg-pink-600'
                  : 'text-slate-600 dark:text-purple-200 hover:text-slate-900'
              }`}
            >
              30 Dias
            </button>
          </div>

          {/* BUSCA RÁPIDA */}
          <div className="relative w-56 sm:w-64">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar comentário..."
              className="w-full h-10 pl-8 pr-3 rounded-2xl text-xs bg-white dark:bg-white/5 border border-purple-200 dark:border-white/15 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* 4. LISTA DE FEEDBACKS OU EMPTY STATE */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-500">
          <RefreshCw className="h-6 w-6 mx-auto animate-spin mb-2 text-purple-600" />
          <span>A carregar avaliações dos clientes...</span>
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <div className="py-20 px-4 rounded-3xl bg-white dark:bg-white/5 border border-purple-100 dark:border-white/10 text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-full bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-pink-400 flex items-center justify-center">
            <MessageSquare className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Nenhuma avaliação registrada ainda
            </h3>
            <p className="text-xs text-slate-500 dark:text-purple-200/70 max-w-sm mx-auto">
              As notas e comentários enviados pelos clientes no menu digital ou pós-pedido aparecerão aqui em tempo real.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredFeedbacks.map((f) => {
            const flag = f.language === 'en' ? '🇺🇸' : f.language === 'es' ? '🇪🇸' : '🇵🇹'
            return (
              <div
                key={f.id}
                className="p-5 rounded-3xl bg-white dark:bg-white/5 border border-purple-100 dark:border-white/10 shadow-xs hover:border-purple-300 dark:hover:border-white/20 transition-all space-y-3"
              >
                {/* Linha Superior: Cliente, Data, Nota e Ações */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-purple-50 dark:border-white/5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-purple-700 dark:text-pink-400" />
                      {f.customerName || 'Cliente no Salão'}
                    </span>

                    {f.tableNumber && (
                      <Badge variant="outline" className="text-[10px] font-bold border-purple-200 dark:border-white/15 text-purple-900 dark:text-purple-200">
                        Mesa {f.tableNumber}
                      </Badge>
                    )}

                    {f.customerPhone && (
                      <span className="text-xs text-slate-500 dark:text-purple-300/70 font-mono flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {f.customerPhone}
                      </span>
                    )}

                    {isMaster && f.tenantName && (
                      <Badge className="bg-purple-100 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 text-[10px] font-bold">
                        {f.tenantName}
                      </Badge>
                    )}

                    <span className="text-xs" title={`Idioma do cliente: ${f.language || 'pt'}`}>
                      {flag}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 self-start sm:self-auto">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-4 w-4 ${s <= f.score ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-white/20'}`}
                        />
                      ))}
                    </div>
                    {getNpsBadge(f.score)}
                    <span className="text-[11px] text-slate-400 dark:text-purple-300/60 font-mono flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDateTime(f.createdAt)}
                    </span>

                    {/* BOTÃO ELIMINAR AVALIAÇÃO (COM MODAL DE SEGURANÇA) */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setFeedbackToDelete(f)
                        setDeleteModalOpen(true)
                      }}
                      className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg cursor-pointer ml-1"
                      title="Eliminar esta avaliação"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Critérios Específicos Avaliados neste Feedback */}
                {f.criteriaScores && Object.keys(f.criteriaScores).length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    {Object.entries(f.criteriaScores).map(([key, val]) => (
                      <span
                        key={key}
                        className="text-[11px] px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-white/5 border border-purple-100 dark:border-white/10 text-slate-700 dark:text-purple-200 font-medium"
                      >
                        <strong>{key}:</strong> {val} ★
                      </span>
                    ))}
                  </div>
                )}

                {/* Comentário do Cliente */}
                {f.comment && (
                  <div className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-white/5 text-xs text-slate-800 dark:text-purple-100 leading-relaxed font-normal italic">
                    &ldquo;{f.comment}&rdquo;
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}



      {/* MODAL DE SEGURANÇA: ELIMINAR 1 AVALIAÇÃO (SEM WINDOW NATIVO) */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md p-6 bg-white dark:bg-[#160228] text-slate-900 dark:text-white border border-rose-200 dark:border-rose-900/40 rounded-3xl shadow-2xl">
          <DialogHeader className="space-y-2 text-left">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-500/20 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Eliminar Avaliação do Cliente?
            </DialogTitle>
            <p className="text-xs text-slate-600 dark:text-purple-200/80 leading-relaxed">
              Tem a certeza que deseja eliminar permanentemente a avaliação de{' '}
              <strong className="text-slate-900 dark:text-white font-black">
                «{feedbackToDelete?.customerName || 'Cliente'}»
              </strong>
              ? Esta ação removerá a nota e recalculará as métricas de NPS da unidade.
            </p>
          </DialogHeader>

          <DialogFooter className="pt-4 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              disabled={deletingOne}
              onClick={() => {
                setDeleteModalOpen(false)
                setFeedbackToDelete(null)
              }}
              className="h-9 px-4 rounded-xl text-xs font-bold border-purple-200 dark:border-white/15 cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={deletingOne}
              onClick={handleConfirmDeleteOne}
              className="h-9 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer shadow-sm shadow-rose-600/20"
            >
              {deletingOne ? 'A eliminar...' : 'Eliminar Avaliação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



      {/* GESTOR DE PESQUISA DE SATISFAÇÃO 2.0 */}
      <SatisfactionSurveyManagerModal
        open={surveyModalOpen}
        onOpenChange={setSurveyModalOpen}
      />
    </div>
  )
}
