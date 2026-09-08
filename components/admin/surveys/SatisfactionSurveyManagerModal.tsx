'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  MessageSquare,
  BarChart3,
  Settings,
  Plus,
  Edit2,
  Copy,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Building2,
  Calendar,
  Download,
  ThumbsUp,
  Meh,
  ThumbsDown,
  User,
  Phone,
  Mail,
  Gift,
  X,
  Eye,
} from 'lucide-react'
import { toast } from 'sonner'
import { useFranchiseStore } from '@/lib/stores/franchiseStore'
import { useAuthStore } from '@/lib/stores/authStore'
import SurveyEditorView, { SurveyModel } from './SurveyEditorView'

interface SatisfactionSurveyManagerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type TabType = 'models' | 'responses' | 'analytics' | 'settings'

function getSurveyFormatBadge(sv: SurveyModel) {
  const qs = sv.questions || []
  if (sv.survey_type === 'NPS_ONLY' || (qs.length === 1 && qs[0]?.type === 'nps')) {
    return 'Somente NPS'
  }
  if (sv.survey_type === 'LEADS_ONLY' || (qs.length === 1 && qs[0]?.type === 'customer_data')) {
    return 'Dados do Cliente'
  }
  if (
    sv.survey_type === 'NPS_LEADS' ||
    (qs.length === 2 && qs.some((q) => q.type === 'nps') && qs.some((q) => q.type === 'customer_data'))
  ) {
    return 'NPS + Dados'
  }
  if (
    sv.survey_type === 'FULL' ||
    (qs.length >= 4 && qs.some((q) => q.type === 'nps') && qs.some((q) => q.type === 'metrics'))
  ) {
    return 'Pesquisa Completa'
  }
  return 'Personalizada'
}

export default function SatisfactionSurveyManagerModal({
  open,
  onOpenChange,
}: SatisfactionSurveyManagerModalProps) {
  const { user, token } = useAuthStore()
  const { tenants } = useFranchiseStore()

  const [currentTab, setCurrentTab] = useState<TabType>('models')
  const [surveys, setSurveys] = useState<SurveyModel[]>([])
  const [loadingSurveys, setLoadingSurveys] = useState(false)

  // Estado do Editor
  const [editingSurvey, setEditingSurvey] = useState<SurveyModel | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)

  // Estado de Respostas e Análises
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>('')
  const [selectedStore, setSelectedStore] = useState<string>('all')
  const [dateRange, setDateRange] = useState<'all' | 'today' | '7d' | '30d'>('all')
  const [surveyResponses, setSurveyResponses] = useState<any[]>([])
  const [surveyAnalytics, setSurveyAnalytics] = useState<any>(null)
  const [loadingResponses, setLoadingResponses] = useState(false)

  // Modal para ver detalhes de uma resposta específica
  const [inspectResponse, setInspectResponse] = useState<any | null>(null)

  // Carregar lista de modelos de pesquisa
  const loadSurveys = async () => {
    setLoadingSurveys(true)
    try {
      const res = await fetch('/api/surveys')
      const data = await res.json()
      if (res.ok && Array.isArray(data.surveys)) {
        setSurveys(data.surveys)
        if (!selectedSurveyId && data.surveys.length > 0) {
          setSelectedSurveyId(data.surveys[0].id)
        }
      }
    } catch {
      toast.error('Erro ao carregar modelos de pesquisa.')
    } finally {
      setLoadingSurveys(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadSurveys()
    }
  }, [open])

  // Carregar respostas e analytics para a pesquisa selecionada
  const loadResponsesAndAnalytics = async () => {
    if (!selectedSurveyId) return
    setLoadingResponses(true)
    try {
      const params = new URLSearchParams()
      if (selectedStore && selectedStore !== 'all') {
        params.set('loja', selectedStore)
      }
      if (dateRange !== 'all') {
        const now = new Date()
        if (dateRange === 'today') {
          const start = new Date(now.setHours(0, 0, 0, 0)).toISOString()
          params.set('startDate', start)
        } else if (dateRange === '7d') {
          const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
          params.set('startDate', past)
        } else if (dateRange === '30d') {
          const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
          params.set('startDate', past)
        }
      }

      const res = await fetch(`/api/surveys/${selectedSurveyId}/responses?${params.toString()}`)
      const data = await res.json()
      if (res.ok) {
        setSurveyResponses(data.responses || [])
        setSurveyAnalytics(data.analytics || null)
      } else {
        toast.error(data.error || 'Erro ao carregar dados da pesquisa')
      }
    } catch {
      toast.error('Erro de conexão ao carregar respostas')
    } finally {
      setLoadingResponses(false)
    }
  }

  useEffect(() => {
    if (open && (currentTab === 'responses' || currentTab === 'analytics') && selectedSurveyId) {
      loadResponsesAndAnalytics()
    }
  }, [open, currentTab, selectedSurveyId, selectedStore, dateRange])

  // Toggle de ativação para uma loja
  const handleToggleStore = async (surveyId: string, tenantId: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/surveys/${surveyId}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token || user?.id || '',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({ tenantId, active: !currentActive }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao atualizar ativação')

      toast.success(data.message || 'Status atualizado com sucesso!')
      await loadSurveys()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao alterar ativação')
    }
  }

  // Duplicar modelo
  const handleDuplicate = async (survey: SurveyModel) => {
    try {
      const res = await fetch('/api/surveys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token || user?.id || '',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({
          title: `${survey.title} (Cópia)`,
          description: survey.description || '',
          questions: survey.questions || [],
          active_stores: [],
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao duplicar')

      toast.success('Modelo duplicado com sucesso!')
      await loadSurveys()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao duplicar modelo')
    }
  }

  // Excluir modelo
  const handleDelete = async (surveyId: string, title: string) => {
    if (!confirm(`Tem certeza que deseja excluir o modelo "${title}"?`)) return

    try {
      const res = await fetch(`/api/surveys/${surveyId}`, {
        method: 'DELETE',
        headers: {
          'x-auth-token': token || user?.id || '',
          'x-user-id': user?.id || '',
        },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao excluir')

      toast.success('Modelo excluído com sucesso!')
      await loadSurveys()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir modelo')
    }
  }

  // Exportar respostas da pesquisa em CSV
  const handleExportCSV = () => {
    if (surveyResponses.length === 0) {
      toast.error('Nenhuma resposta disponível para exportar.')
      return
    }

    const headers = [
      'ID',
      'Data/Hora',
      'Loja',
      'Mesa',
      'Cliente',
      'Telemóvel',
      'E-mail',
      'Aniversário',
      'NPS Score',
      'Idioma',
      'Respostas Detalhadas',
    ]

    const rows = surveyResponses.map((r) => [
      `"${r.id}"`,
      `"${new Date(r.created_at).toLocaleString('pt-PT')}"`,
      `"${r.store_name || r.tenant_id}"`,
      `"${r.table_number || 'Balcão'}"`,
      `"${r.customer_name || 'Anónimo'}"`,
      `"${r.customer_phone || ''}"`,
      `"${r.customer_email || ''}"`,
      `"${r.customer_birthday || ''}"`,
      r.nps_score !== null && r.nps_score !== undefined ? r.nps_score : '',
      `"${r.language || 'pt'}"`,
      `"${JSON.stringify(r.answers || []).replace(/"/g, '""')}"`,
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((row) => row.join(';'))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `pesquisa_respostas_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Respostas exportadas com sucesso!')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[96vw] max-h-[92vh] h-[92vh] p-0 rounded-3xl bg-slate-50 dark:bg-[#1a022b] border border-purple-200 dark:border-white/15 overflow-hidden flex flex-col shadow-2xl">
        {/* Cabeçalho do Modal */}
        <div className="p-5 sm:p-6 bg-white dark:bg-[#200336] border-b border-purple-100 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Pesquisa de Satisfação 2.0
              </span>
              <Badge className="bg-purple-100 text-purple-900 dark:bg-pink-500/20 dark:text-pink-300 border-none text-[10px] font-bold">
                Oficial
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-purple-300/80 mt-0.5">
              Crie modelos, configure perguntas e analise feedbacks dos clientes no menu
            </p>
          </div>

          {/* Abas Superiores Oficiais (apenas quando não estiver no editor) */}
          {!isEditorOpen && (
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-white/5 border border-purple-100 dark:border-white/10 text-xs font-bold">
              <button
                type="button"
                onClick={() => setCurrentTab('models')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  currentTab === 'models'
                    ? 'bg-purple-900 text-white dark:bg-pink-600'
                    : 'text-slate-600 dark:text-purple-200 hover:text-slate-900'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Modelos de pesquisa</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentTab('responses')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  currentTab === 'responses'
                    ? 'bg-purple-900 text-white dark:bg-pink-600'
                    : 'text-slate-600 dark:text-purple-200 hover:text-slate-900'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Respostas</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentTab('analytics')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  currentTab === 'analytics'
                    ? 'bg-purple-900 text-white dark:bg-pink-600'
                    : 'text-slate-600 dark:text-purple-200 hover:text-slate-900'
                }`}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span>Análises</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentTab('settings')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  currentTab === 'settings'
                    ? 'bg-purple-900 text-white dark:bg-pink-600'
                    : 'text-slate-600 dark:text-purple-200 hover:text-slate-900'
                }`}
              >
                <Settings className="h-3.5 w-3.5" />
                <span>Configurações</span>
              </button>
            </div>
          )}
        </div>

        {/* Corpo do Modal */}
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto">
          {/* MODO EDITOR ABERTO */}
          {isEditorOpen ? (
            <SurveyEditorView
              initialSurvey={editingSurvey}
              onBack={() => {
                setIsEditorOpen(false)
                setEditingSurvey(null)
              }}
              onSaveSuccess={() => {
                setIsEditorOpen(false)
                setEditingSurvey(null)
                loadSurveys()
              }}
            />
          ) : (
            <>
              {/* ABA 1: MODELOS DE PESQUISA */}
              {currentTab === 'models' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Modelos Cadastrados ({surveys.length})
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-purple-300">
                        Cada loja pode ter no máximo 1 pesquisa ativa por vez no seu menu
                      </p>
                    </div>

                    <Button
                      type="button"
                      onClick={() => {
                        setEditingSurvey(null)
                        setIsEditorOpen(true)
                      }}
                      className="h-9 px-4 rounded-xl text-xs font-bold bg-purple-900 hover:bg-purple-800 text-white cursor-pointer shadow-xs flex items-center gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Novo Modelo</span>
                    </Button>
                  </div>

                  {loadingSurveys ? (
                    <div className="py-20 text-center text-xs text-slate-500">
                      <RefreshCw className="h-6 w-6 mx-auto animate-spin mb-2 text-purple-600" />
                      <span>A carregar modelos de pesquisa...</span>
                    </div>
                  ) : surveys.length === 0 ? (
                    <div className="py-16 text-center rounded-3xl bg-white dark:bg-white/5 border border-dashed border-purple-200 dark:border-white/10 p-8 space-y-3">
                      <FileText className="h-10 w-10 mx-auto text-purple-300 dark:text-purple-600" />
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                        Nenhum modelo de pesquisa criado
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-purple-300/80 max-w-sm mx-auto">
                        Crie o seu primeiro modelo com perguntas de NPS, métricas operacionais ou campos de fidelização.
                      </p>
                      <Button
                        type="button"
                        onClick={() => {
                          setEditingSurvey(null)
                          setIsEditorOpen(true)
                        }}
                        className="h-9 px-4 rounded-xl text-xs font-bold bg-purple-900 text-white"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        <span>Criar Modelo Agora</span>
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {surveys.map((sv) => {
                        const activeStores = Array.isArray(sv.active_stores) ? sv.active_stores : []
                        const totalResponses = (sv as any).total_responses || 0

                        return (
                          <div
                            key={sv.id}
                            className="p-5 rounded-3xl bg-white dark:bg-white/5 border border-purple-100 dark:border-white/10 shadow-xs flex flex-col justify-between space-y-4 hover:border-purple-300 transition"
                          >
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                                    {sv.title}
                                  </h4>
                                  {sv.description && (
                                    <p className="text-xs text-slate-500 dark:text-purple-300/80 mt-1 line-clamp-2">
                                      {sv.description}
                                    </p>
                                  )}
                                </div>
                                <div className="flex flex-col items-end gap-1 shrink-0">
                                  <Badge className="bg-purple-100 text-purple-900 dark:bg-pink-500/20 dark:text-pink-300 border border-purple-200 dark:border-white/15 text-[10px] font-bold">
                                    {getSurveyFormatBadge(sv)}
                                  </Badge>
                                  <span className="text-[10px] text-slate-400 font-bold">
                                    {sv.questions?.length || 0} {sv.questions?.length === 1 ? 'pergunta' : 'perguntas'}
                                  </span>
                                </div>
                              </div>

                              <div className="text-[11px] text-slate-500 dark:text-purple-300/70 pt-1">
                                Total de avaliações colhidas:{' '}
                                <strong className="text-purple-900 dark:text-pink-400 font-mono text-xs">
                                  {totalResponses}
                                </strong>
                              </div>
                            </div>

                            {/* Status de Ativação por Loja (Pills de 1-Clique com Regra de Exclusividade) */}
                            <div className="pt-3 border-t border-purple-100 dark:border-white/10 space-y-1.5">
                              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-purple-300/60">
                                Ativação no Menu das Lojas:
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                {tenants.map((t) => {
                                  const isActive = activeStores.includes(t.id)
                                  return (
                                    <button
                                      key={t.id}
                                      type="button"
                                      onClick={() => handleToggleStore(sv.id!, t.id, isActive)}
                                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition cursor-pointer flex items-center gap-1 ${
                                        isActive
                                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700'
                                          : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10 hover:border-purple-300'
                                      }`}
                                      title={isActive ? `Ativa na loja ${t.name}. Clique para pausar.` : `Inativa na loja ${t.name}. Clique para ativar.`}
                                    >
                                      <span
                                        className={`h-2 w-2 rounded-full ${
                                          isActive ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'
                                        }`}
                                      />
                                      <span>{t.name}</span>
                                    </button>
                                  )
                                })}
                              </div>
                            </div>

                            {/* Ações do Card */}
                            <div className="pt-3 border-t border-purple-100 dark:border-white/10 flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingSurvey(sv)
                                    setIsEditorOpen(true)
                                  }}
                                  className="h-8 px-2.5 rounded-xl text-xs font-bold border-purple-200 dark:border-white/15 hover:bg-purple-50 dark:hover:bg-white/10"
                                >
                                  <Edit2 className="h-3 w-3 mr-1 text-purple-700 dark:text-pink-400" />
                                  <span>Editar</span>
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDuplicate(sv)}
                                  className="h-8 px-2 rounded-xl text-xs font-bold text-slate-600 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-white/10"
                                  title="Duplicar modelo"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(sv.id!, sv.title)}
                                  className="h-8 px-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                  title="Excluir modelo"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedSurveyId(sv.id!)
                                  setCurrentTab('responses')
                                }}
                                className="h-8 text-xs font-bold text-purple-900 dark:text-pink-300 hover:underline"
                              >
                                <span>Ver Respostas &gt;</span>
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ABA 2: RESPOSTAS */}
              {currentTab === 'responses' && (
                <div className="space-y-4">
                  {/* Toolbar de Filtros de Respostas */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-white/5 border border-purple-100 dark:border-white/10">
                    <div className="flex flex-wrap items-center gap-2.5">
                      {/* Seletor de Modelo */}
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        <span className="text-slate-500">Modelo:</span>
                        <select
                          value={selectedSurveyId}
                          onChange={(e) => setSelectedSurveyId(e.target.value)}
                          className="h-9 px-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-purple-200 dark:border-white/15 text-slate-900 dark:text-white font-bold"
                        >
                          {surveys.map((sv) => (
                            <option key={sv.id} value={sv.id} className="text-black dark:text-white dark:bg-slate-900">
                              {sv.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Seletor de Loja */}
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        <span className="text-slate-500">Loja:</span>
                        <select
                          value={selectedStore}
                          onChange={(e) => setSelectedStore(e.target.value)}
                          className="h-9 px-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-purple-200 dark:border-white/15 text-slate-900 dark:text-white font-bold"
                        >
                          <option value="all" className="text-black dark:text-white dark:bg-slate-900">
                            Todas as Lojas
                          </option>
                          {tenants.map((t) => (
                            <option key={t.id} value={t.id} className="text-black dark:text-white dark:bg-slate-900">
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Seletor de Período */}
                      <div className="flex items-center gap-1 text-xs font-bold p-0.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-purple-200 dark:border-white/15">
                        <button
                          type="button"
                          onClick={() => setDateRange('all')}
                          className={`px-2 py-1 rounded-lg ${dateRange === 'all' ? 'bg-purple-900 text-white' : 'text-slate-600 dark:text-purple-200'}`}
                        >
                          Tudo
                        </button>
                        <button
                          type="button"
                          onClick={() => setDateRange('today')}
                          className={`px-2 py-1 rounded-lg ${dateRange === 'today' ? 'bg-purple-900 text-white' : 'text-slate-600 dark:text-purple-200'}`}
                        >
                          Hoje
                        </button>
                        <button
                          type="button"
                          onClick={() => setDateRange('7d')}
                          className={`px-2 py-1 rounded-lg ${dateRange === '7d' ? 'bg-purple-900 text-white' : 'text-slate-600 dark:text-purple-200'}`}
                        >
                          7 Dias
                        </button>
                        <button
                          type="button"
                          onClick={() => setDateRange('30d')}
                          className={`px-2 py-1 rounded-lg ${dateRange === '30d' ? 'bg-purple-900 text-white' : 'text-slate-600 dark:text-purple-200'}`}
                        >
                          30 Dias
                        </button>
                      </div>
                    </div>

                    {/* Botão Exportar CSV */}
                    <Button
                      type="button"
                      onClick={handleExportCSV}
                      disabled={surveyResponses.length === 0}
                      className="h-9 px-3.5 rounded-xl text-xs font-bold bg-purple-900 hover:bg-purple-800 text-white cursor-pointer shadow-xs flex items-center gap-1.5"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Exportar CSV</span>
                    </Button>
                  </div>

                  {/* Cards de Métricas Rápidas */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-purple-100 dark:border-white/10">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-purple-300/70">
                        Total de Respostas
                      </div>
                      <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                        {surveyResponses.length}
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-purple-100 dark:border-white/10">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-purple-300/70">
                        NPS Médio
                      </div>
                      <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                        {surveyAnalytics?.nps?.average_rating ? `${surveyAnalytics.nps.average_rating} / 10` : '—'}
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-purple-100 dark:border-white/10">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-purple-300/70">
                        Leads de Clientes Captados
                      </div>
                      <div className="text-2xl font-bold text-purple-900 dark:text-pink-300 font-mono mt-0.5">
                        {surveyAnalytics?.leads_count || 0}
                      </div>
                    </div>
                  </div>

                  {/* Tabela de Respostas */}
                  {loadingResponses ? (
                    <div className="py-20 text-center text-xs text-slate-500">
                      <RefreshCw className="h-6 w-6 mx-auto animate-spin mb-2 text-purple-600" />
                      <span>A carregar respostas...</span>
                    </div>
                  ) : surveyResponses.length === 0 ? (
                    <div className="py-16 text-center rounded-3xl bg-white dark:bg-white/5 border border-dashed border-purple-200 dark:border-white/10 p-8 space-y-2">
                      <MessageSquare className="h-8 w-8 mx-auto text-purple-300 dark:text-purple-600" />
                      <div className="text-xs font-bold text-slate-700 dark:text-white">
                        Nenhuma resposta encontrada para os filtros selecionados
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-white dark:bg-white/5 border border-purple-100 dark:border-white/10 overflow-hidden shadow-xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-purple-50/50 dark:bg-white/5 text-[11px] font-bold text-slate-700 dark:text-purple-200 uppercase tracking-wider border-b border-purple-100 dark:border-white/10">
                            <tr>
                              <th className="p-3">Data/Hora</th>
                              <th className="p-3">Loja / Mesa</th>
                              <th className="p-3">Cliente / Contato</th>
                              <th className="p-3 text-center">NPS</th>
                              <th className="p-3 text-right">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-purple-100/60 dark:divide-white/5">
                            {surveyResponses.map((r) => (
                              <tr key={r.id} className="hover:bg-purple-50/30 dark:hover:bg-white/5 transition">
                                <td className="p-3 text-slate-500 dark:text-purple-300/80 font-mono whitespace-nowrap">
                                  {new Date(r.created_at).toLocaleString('pt-PT', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </td>
                                <td className="p-3 whitespace-nowrap">
                                  <div className="font-bold text-slate-900 dark:text-white">
                                    {r.store_name || 'Loja'}
                                  </div>
                                  <div className="text-[11px] text-slate-400">
                                    {r.table_number ? `Mesa ${r.table_number}` : 'Balcão'}
                                  </div>
                                </td>
                                <td className="p-3">
                                  <div className="font-bold text-slate-800 dark:text-white">
                                    {r.customer_name || 'Cliente Anónimo'}
                                  </div>
                                  <div className="text-[11px] text-slate-500 dark:text-purple-300/80 flex items-center gap-2">
                                    {r.customer_phone && <span>{r.customer_phone}</span>}
                                    {r.customer_email && <span>{r.customer_email}</span>}
                                  </div>
                                </td>
                                <td className="p-3 text-center">
                                  {r.nps_score !== null && r.nps_score !== undefined ? (
                                    <span
                                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                                        r.nps_score >= 9
                                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                                          : r.nps_score >= 7
                                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300'
                                          : 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300'
                                      }`}
                                    >
                                      {r.nps_score} / 10
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">—</span>
                                  )}
                                </td>
                                <td className="p-3 text-right">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setInspectResponse(r)}
                                    className="h-7 px-2.5 rounded-lg text-xs font-bold border-purple-200 dark:border-white/15 hover:bg-purple-50 dark:hover:bg-white/10"
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    <span>Ver Respostas</span>
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ABA 3: ANÁLISES */}
              {currentTab === 'analytics' && (
                <div className="space-y-5">
                  {/* Seletor de Modelo para Análises */}
                  <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-white dark:bg-white/5 border border-purple-100 dark:border-white/10">
                    <span className="text-xs font-bold text-slate-500">Modelo Analisado:</span>
                    <select
                      value={selectedSurveyId}
                      onChange={(e) => setSelectedSurveyId(e.target.value)}
                      className="h-9 px-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-purple-200 dark:border-white/15 text-slate-900 dark:text-white font-bold text-xs"
                    >
                      {surveys.map((sv) => (
                        <option key={sv.id} value={sv.id} className="text-black dark:text-white dark:bg-slate-900">
                          {sv.title}
                        </option>
                      ))}
                    </select>

                    <span className="text-xs font-bold text-slate-500 ml-2">Loja:</span>
                    <select
                      value={selectedStore}
                      onChange={(e) => setSelectedStore(e.target.value)}
                      className="h-9 px-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-purple-200 dark:border-white/15 text-slate-900 dark:text-white font-bold text-xs"
                    >
                      <option value="all" className="text-black dark:text-white dark:bg-slate-900">
                        Todas as Lojas
                      </option>
                      {tenants.map((t) => (
                        <option key={t.id} value={t.id} className="text-black dark:text-white dark:bg-slate-900">
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* NPS SCORE CARD EXECUTIVO */}
                  {surveyAnalytics?.nps && (
                    <div className="p-6 rounded-3xl bg-white dark:bg-gradient-to-br dark:from-[#200336] dark:to-[#160226] border border-purple-100 dark:border-white/10 shadow-xs space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="text-[11px] font-bold uppercase tracking-wider text-purple-900 dark:text-pink-300">
                            Net Promoter Score (NPS)
                          </div>
                          <div className="text-xs text-slate-500 dark:text-purple-200/70 mt-0.5">
                            Cálculo: % Promotores (9-10) menos % Detratores (0-6)
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-3xl font-bold font-mono text-purple-950 dark:text-white">
                            {surveyAnalytics.nps.score > 0 ? `+${surveyAnalytics.nps.score}` : surveyAnalytics.nps.score}
                          </span>
                          <span className="text-xs font-semibold text-slate-400 ml-1">Pontos</span>
                        </div>
                      </div>

                      {/* Barra de Distribuição */}
                      <div className="space-y-2">
                        <div className="h-4 w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden flex">
                          <div
                            style={{ width: `${surveyAnalytics.nps.promoters_percent}%` }}
                            className="bg-emerald-500 h-full transition-all"
                            title="Promotores"
                          />
                          <div
                            style={{ width: `${surveyAnalytics.nps.passives_percent}%` }}
                            className="bg-blue-400 h-full transition-all"
                            title="Neutros"
                          />
                          <div
                            style={{ width: `${surveyAnalytics.nps.detractors_percent}%` }}
                            className="bg-rose-500 h-full transition-all"
                            title="Detratores"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs font-bold">
                          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300">
                            <div>Promotores (9-10)</div>
                            <div className="text-base font-mono mt-0.5">
                              {surveyAnalytics.nps.promoters_count} ({surveyAnalytics.nps.promoters_percent}%)
                            </div>
                          </div>
                          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300">
                            <div>Neutros (7-8)</div>
                            <div className="text-base font-mono mt-0.5">
                              {surveyAnalytics.nps.passives_count} ({surveyAnalytics.nps.passives_percent}%)
                            </div>
                          </div>
                          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300">
                            <div>Detratores (0-6)</div>
                            <div className="text-base font-mono mt-0.5">
                              {surveyAnalytics.nps.detractors_count} ({surveyAnalytics.nps.detractors_percent}%)
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* MÉTRICAS OPERACIONAIS (MÉDIAS) */}
                  {surveyAnalytics?.metrics && Object.keys(surveyAnalytics.metrics).length > 0 && (
                    <div className="space-y-3">
                      <div className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                        Médias das Métricas Operacionais
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.values(surveyAnalytics.metrics).map((mGroup: any, gIdx) =>
                          (mGroup.items || []).map((item: any, iIdx: number) => (
                            <div
                              key={`${gIdx}-${iIdx}`}
                              className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-purple-100 dark:border-white/10 space-y-2"
                            >
                              <div className="text-xs font-bold text-slate-700 dark:text-purple-200 truncate">
                                {item.name}
                              </div>
                              <div className="flex items-baseline justify-between">
                                <span className="text-2xl font-bold font-mono text-purple-900 dark:text-pink-400">
                                  {item.average} ★
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  {item.totalRatings} votos
                                </span>
                              </div>
                              <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                                <div
                                  style={{ width: `${(item.average / 5) * 100}%` }}
                                  className="h-full bg-purple-900 dark:bg-pink-500"
                                />
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* MÚLTIPLA ESCOLHA RESULTADOS */}
                  {surveyAnalytics?.multiple_choice && Object.keys(surveyAnalytics.multiple_choice).length > 0 && (
                    <div className="space-y-3">
                      <div className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                        Perguntas de Múltipla Escolha
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(surveyAnalytics.multiple_choice).map(([qId, data]: [string, any]) => (
                          <div
                            key={qId}
                            className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-purple-100 dark:border-white/10 space-y-3"
                          >
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                              {data.title}
                            </h4>
                            <div className="space-y-2">
                              {Object.entries(data.choices || {}).map(([choice, count]: [string, any]) => (
                                <div key={choice} className="space-y-1">
                                  <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-purple-200">
                                    <span className="truncate">{choice}</span>
                                    <span className="font-mono font-bold text-purple-900 dark:text-pink-300 ml-2">
                                      {count} votos
                                    </span>
                                  </div>
                                  <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                                    <div
                                      style={{
                                        width: `${surveyResponses.length > 0 ? (count / surveyResponses.length) * 100 : 0}%`,
                                      }}
                                      className="h-full bg-purple-900 dark:bg-pink-500"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* COMENTÁRIOS E RESPOSTAS ABERTAS */}
                  {surveyAnalytics?.open_answers && surveyAnalytics.open_answers.length > 0 && (
                    <div className="space-y-3">
                      <div className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                        Comentários &amp; Respostas Abertas ({surveyAnalytics.open_answers.length})
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                        {surveyAnalytics.open_answers.map((ans: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-2xl bg-white dark:bg-white/5 border border-purple-100 dark:border-white/10 space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                              <span>{ans.customerName || 'Cliente Anónimo'}</span>
                              <span>{new Date(ans.date).toLocaleDateString('pt-PT')}</span>
                            </div>
                            <div className="text-xs font-semibold text-purple-900 dark:text-pink-300">
                              {ans.questionText}
                            </div>
                            <p className="text-xs text-slate-700 dark:text-purple-100 italic">
                              &ldquo;{ans.answer}&rdquo;
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ABA 4: CONFIGURAÇÕES */}
              {currentTab === 'settings' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Configuração de Pesquisas por Loja
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-purple-300">
                      Defina qual pesquisa de satisfação é exibida no menu de cada unidade da rede
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white dark:bg-white/5 border border-purple-100 dark:border-white/10 overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-purple-50/50 dark:bg-white/5 text-[11px] font-bold text-slate-700 dark:text-purple-200 uppercase tracking-wider border-b border-purple-100 dark:border-white/10">
                        <tr>
                          <th className="p-3.5">Unidade / Loja</th>
                          <th className="p-3.5">Pesquisa Ativa no Menu</th>
                          <th className="p-3.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-purple-100/60 dark:divide-white/5">
                        {tenants.map((t) => {
                          const activeModel = surveys.find((s) => (s.active_stores || []).includes(t.id))

                          return (
                            <tr key={t.id} className="hover:bg-purple-50/30 dark:hover:bg-white/5 transition">
                              <td className="p-3.5">
                                <div className="font-bold text-slate-900 dark:text-white">{t.name}</div>
                                <div className="text-[11px] text-slate-400">{t.slug}</div>
                              </td>
                              <td className="p-3.5">
                                <select
                                  value={activeModel?.id || 'none'}
                                  onChange={async (e) => {
                                    const newModelId = e.target.value
                                    if (newModelId === 'none') {
                                      if (activeModel?.id) {
                                        await handleToggleStore(activeModel.id, t.id, true)
                                      }
                                    } else {
                                      await handleToggleStore(newModelId, t.id, false)
                                    }
                                  }}
                                  className="h-9 px-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-purple-200 dark:border-white/15 text-slate-900 dark:text-white text-xs font-bold cursor-pointer"
                                >
                                  <option value="none" className="text-black dark:text-white dark:bg-slate-900">
                                    — Nenhuma pesquisa ativa —
                                  </option>
                                  {surveys.map((s) => (
                                    <option key={s.id} value={s.id} className="text-black dark:text-white dark:bg-slate-900">
                                      {s.title}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="p-3.5 text-center">
                                {activeModel ? (
                                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border-none text-[10.5px] font-bold">
                                    Ativa no Menu
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-slate-400 text-[10.5px]">
                                    Sem Pesquisa
                                  </Badge>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* MODAL INSPECIONAR RESPOSTA COMPLETA */}
        {inspectResponse && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="max-w-lg w-full rounded-3xl bg-white dark:bg-[#200336] border border-purple-200 dark:border-white/15 p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-purple-100 dark:border-white/10">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Detalhes da Avaliação
                  </h3>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {new Date(inspectResponse.created_at).toLocaleString('pt-PT')}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectResponse(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Dados do Cliente */}
              <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-white/5 border border-purple-100 dark:border-white/10 space-y-1.5 text-xs">
                <div className="font-bold text-purple-950 dark:text-pink-300 uppercase tracking-wider text-[10px]">
                  Identificação do Cliente
                </div>
                <div>
                  <strong>Nome:</strong> {inspectResponse.customer_name || 'Anónimo'}
                </div>
                {inspectResponse.customer_phone && (
                  <div>
                    <strong>Telemóvel:</strong> {inspectResponse.customer_phone}
                  </div>
                )}
                {inspectResponse.customer_email && (
                  <div>
                    <strong>E-mail:</strong> {inspectResponse.customer_email}
                  </div>
                )}
                {inspectResponse.customer_birthday && (
                  <div>
                    <strong>Aniversário:</strong> {inspectResponse.customer_birthday}
                  </div>
                )}
              </div>

              {/* Respostas Individuais */}
              <div className="space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Respostas Registadas:
                </div>
                {(inspectResponse.answers || []).map((ans: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-purple-100 dark:border-white/10 text-xs space-y-1"
                  >
                    <div className="font-semibold text-slate-700 dark:text-purple-200">
                      {ans.type === 'nps'
                        ? 'Avaliação NPS'
                        : ans.type === 'metrics'
                        ? 'Avaliação de Métricas'
                        : ans.type === 'multiple_choice'
                        ? 'Múltipla Escolha'
                        : ans.type === 'customer_data'
                        ? 'Dados Fornecidos'
                        : 'Resposta Aberta'}
                    </div>

                    {ans.type === 'nps' && (
                      <div className="text-slate-800 dark:text-white">
                        Nota: <strong className="font-mono text-purple-900 dark:text-pink-300">{ans.score} / 10</strong>
                        {ans.comment && (
                          <p className="mt-1 italic text-slate-600 dark:text-slate-300">
                            &ldquo;{ans.comment}&rdquo;
                          </p>
                        )}
                      </div>
                    )}

                    {ans.type === 'metrics' && ans.metrics && (
                      <div className="space-y-1 pt-1">
                        {Object.entries(ans.metrics).map(([mName, val]: [string, any]) => (
                          <div key={mName} className="flex items-center justify-between text-slate-800 dark:text-white">
                            <span>{mName}</span>
                            <span className="font-bold font-mono text-purple-900 dark:text-pink-300">{val} ★</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {ans.type === 'multiple_choice' && (
                      <div className="text-slate-800 dark:text-white">
                        {ans.isOther ? `Outro: ${ans.otherText}` : ans.choice}
                      </div>
                    )}

                    {ans.type === 'open' && (
                      <div className="italic text-slate-700 dark:text-purple-100">
                        &ldquo;{ans.answer}&rdquo;
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
