'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { ManualArticle, ManualCategory, ManualStep, UserRole } from '@/types'
import { useAuthStore } from '@/lib/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Eye,
  ArrowUp,
  ArrowDown,
  Upload,
  Video,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Info,
  ExternalLink,
  Search,
  FolderPlus,
  Layers,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  BarChart3,
  MessageSquare,
  Clock,
} from 'lucide-react'

type FilterRole = 'ALL' | 'FRANCHISOR_ADMIN' | 'TENANT_ADMIN' | 'CASHIER'

function extractYoutubeId(url: string): string | null {
  if (!url) return null
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[2].length === 11 ? match[2] : null
}

export default function ManualsAdminView() {
  const { authFetch } = useAuthStore()

  const [categories, setCategories] = useState<ManualCategory[]>([])
  const [articles, setArticles] = useState<ManualArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<FilterRole>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Aba ativa: Gestão de Manuais vs Métricas de Feedback
  const [activeAdminTab, setActiveAdminTab] = useState<'MANUALS' | 'METRICS'>('MANUALS')
  const [metricsData, setMetricsData] = useState<{
    totalVotes: number
    helpfulVotes: number
    unhelpfulVotes: number
    helpfulPercentage: number
    pendingSuggestionsCount: number
    suggestions: any[]
    lowestRatedArticles: any[]
  } | null>(null)
  const [metricsLoading, setMetricsLoading] = useState(false)
  const [suggestionStatusFilter, setSuggestionStatusFilter] = useState<'ALL' | 'PENDING' | 'IMPLEMENTED'>('ALL')

  // Modais
  const [editArticleOpen, setEditArticleOpen] = useState(false)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState<ManualArticle | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<ManualCategory | null>(null)

  // Formulário do Artigo
  const [formData, setFormData] = useState<{
    id?: string
    categoryId: string
    title: string
    slug: string
    summary: string
    readTimeMinutes: number
    targetRoles: UserRole[]
    orderIndex: number
    published: boolean
    steps: ManualStep[]
  }>({
    categoryId: '',
    title: '',
    slug: '',
    summary: '',
    readTimeMinutes: 3,
    targetRoles: ['CASHIER', 'TENANT_ADMIN', 'FRANCHISOR_ADMIN', 'SUPER_ADMIN'],
    orderIndex: 0,
    published: true,
    steps: [],
  })

  // Formulário de Categoria
  const [categoryForm, setCategoryForm] = useState<{
    id?: string
    title: string
    slug: string
    description: string
    orderIndex: number
    targetRoles: UserRole[]
  }>({
    title: '',
    slug: '',
    description: '',
    orderIndex: 0,
    targetRoles: ['CASHIER', 'TENANT_ADMIN', 'FRANCHISOR_ADMIN', 'SUPER_ADMIN'],
  })

  const [saving, setSaving] = useState(false)
  const [uploadingStepIdx, setUploadingStepIdx] = useState<number | null>(null)

  // Carregar dados
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [catsRes, artsRes] = await Promise.all([
        authFetch('/api/manuals/categories'),
        authFetch('/api/manuals?onlyPublished=false'),
      ])

      const catsData = await catsRes.json()
      const artsData = await artsRes.json()

      if (Array.isArray(catsData.categories)) {
        setCategories(catsData.categories)
      }
      if (Array.isArray(artsData.articles)) {
        setArticles(artsData.articles)
      }
    } catch (err: any) {
      toast.error('Erro ao carregar dados dos manuais')
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Carregar métricas e sugestões
  const loadMetrics = useCallback(async () => {
    setMetricsLoading(true)
    try {
      const res = await authFetch('/api/manuals/feedback/metrics')
      const json = await res.json()
      if (res.ok) {
        setMetricsData(json)
      }
    } catch {
      toast.error('Erro ao carregar métricas de feedback')
    } finally {
      setMetricsLoading(false)
    }
  }, [authFetch])

  useEffect(() => {
    loadMetrics()
  }, [loadMetrics])

  const handleUpdateSuggestionStatus = async (id: string, status: string) => {
    try {
      const res = await authFetch('/api/manuals/feedback/metrics', {
        method: 'PATCH',
        body: JSON.stringify({ id, status }),
      })
      if (res.ok) {
        toast.success(status === 'IMPLEMENTED' ? 'Sugestão marcada como atendida!' : 'Status atualizado!')
        loadMetrics()
      } else {
        throw new Error()
      }
    } catch {
      toast.error('Erro ao atualizar status da sugestão')
    }
  }

  // Abertura de Edição de Manual
  const handleOpenArticleDialog = (article?: ManualArticle) => {
    if (article) {
      setSelectedArticle(article)
      setFormData({
        id: article.id,
        categoryId: article.categoryId,
        title: article.title,
        slug: article.slug,
        summary: article.summary || '',
        readTimeMinutes: article.readTimeMinutes || 3,
        targetRoles: article.targetRoles || ['CASHIER', 'TENANT_ADMIN', 'FRANCHISOR_ADMIN', 'SUPER_ADMIN'],
        orderIndex: article.orderIndex || 0,
        published: article.published,
        steps: article.steps || [],
      })
    } else {
      setSelectedArticle(null)
      setFormData({
        categoryId: categories[0]?.id || '',
        title: '',
        slug: '',
        summary: '',
        readTimeMinutes: 3,
        targetRoles: ['CASHIER', 'TENANT_ADMIN', 'FRANCHISOR_ADMIN', 'SUPER_ADMIN'],
        orderIndex: articles.length,
        published: true,
        steps: [
          {
            step_number: 1,
            title: '',
            description: '',
            media_source: 'UPLOAD',
            media_type: 'IMAGE',
            media_url: null,
            youtube_id: null,
            callout_type: null,
            callout_text: '',
            action_route: '',
          },
        ],
      })
    }
    setEditArticleOpen(true)
  }

  // Abertura de Categoria
  const handleOpenCategoryDialog = (cat?: ManualCategory) => {
    if (cat) {
      setSelectedCategory(cat)
      setCategoryForm({
        id: cat.id,
        title: cat.title,
        slug: cat.slug,
        description: cat.description || '',
        orderIndex: cat.orderIndex || 0,
        targetRoles: cat.targetRoles || ['CASHIER', 'TENANT_ADMIN', 'FRANCHISOR_ADMIN', 'SUPER_ADMIN'],
      })
    } else {
      setSelectedCategory(null)
      setCategoryForm({
        title: '',
        slug: '',
        description: '',
        orderIndex: categories.length,
        targetRoles: ['CASHIER', 'TENANT_ADMIN', 'FRANCHISOR_ADMIN', 'SUPER_ADMIN'],
      })
    }
    setCategoryModalOpen(true)
  }

  // Salvar Categoria
  const handleSaveCategory = async () => {
    if (!categoryForm.title.trim()) {
      toast.error('Informe o título da categoria')
      return
    }

    setSaving(true)
    try {
      const isEdit = Boolean(categoryForm.id)
      const url = isEdit ? `/api/manuals/categories/${categoryForm.id}` : '/api/manuals/categories'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await authFetch(url, {
        method,
        body: JSON.stringify(categoryForm),
      })

      if (!res.ok) throw new Error('Falha ao salvar categoria')

      toast.success(isEdit ? 'Categoria atualizada' : 'Categoria criada com sucesso')
      setCategoryModalOpen(false)
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao persistir categoria')
    } finally {
      setSaving(false)
    }
  }

  // Deletar Categoria
  const handleDeleteCategory = async (id: string, title: string) => {
    if (!confirm(`Tem certeza que deseja excluir a categoria "${title}"? Todos os manuais associados serão removidos.`)) {
      return
    }

    try {
      const res = await authFetch(`/api/manuals/categories/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao excluir')
      toast.success('Categoria excluída')
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir categoria')
    }
  }

  // Manipulação de Passos no Artigo
  const handleAddStep = () => {
    const nextNum = formData.steps.length + 1
    setFormData((prev) => ({
      ...prev,
      steps: [
        ...prev.steps,
        {
          step_number: nextNum,
          title: '',
          description: '',
          media_source: 'UPLOAD',
          media_type: 'IMAGE',
          media_url: null,
          youtube_id: null,
          callout_type: null,
          callout_text: '',
          action_route: '',
        },
      ],
    }))
  }

  const handleRemoveStep = (idx: number) => {
    if (formData.steps.length <= 1) {
      toast.error('O manual deve ter pelo menos 1 passo.')
      return
    }
    const updated = formData.steps
      .filter((_, i) => i !== idx)
      .map((step, i) => ({ ...step, step_number: i + 1 }))
    setFormData((prev) => ({ ...prev, steps: updated }))
  }

  const handleMoveStep = (idx: number, direction: 'UP' | 'DOWN') => {
    const targetIdx = direction === 'UP' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= formData.steps.length) return

    const updated = [...formData.steps]
    const temp = updated[idx]
    updated[idx] = updated[targetIdx]
    updated[targetIdx] = temp

    const renumbered = updated.map((step, i) => ({ ...step, step_number: i + 1 }))
    setFormData((prev) => ({ ...prev, steps: renumbered }))
  }

  const handleUpdateStep = (idx: number, patch: Partial<ManualStep>) => {
    setFormData((prev) => {
      const updated = [...prev.steps]
      updated[idx] = { ...updated[idx], ...patch }
      return { ...prev, steps: updated }
    })
  }

  // Upload de Mídia (Arquivo ou Ctrl+V)
  const handleFileUpload = async (stepIdx: number, file: File) => {
    setUploadingStepIdx(stepIdx)
    try {
      const data = new FormData()
      data.append('file', file)

      const res = await authFetch('/api/upload', {
        method: 'POST',
        body: data,
      })

      const json = await res.json()
      if (!res.ok || !json.url) throw new Error(json.error || 'Erro no upload')

      const isVideo = file.type.startsWith('video/')
      const isGif = file.type === 'image/gif'

      handleUpdateStep(stepIdx, {
        media_source: 'UPLOAD',
        media_type: isVideo ? 'VIDEO' : isGif ? 'GIF' : 'IMAGE',
        media_url: json.url,
        youtube_id: null,
      })

      toast.success('Mídia carregada com sucesso')
    } catch (err: any) {
      toast.error(err.message || 'Falha ao processar ficheiro')
    } finally {
      setUploadingStepIdx(null)
    }
  }

  // Handler de Paste (Ctrl+V) no Passo
  const handlePasteOnStep = (e: React.ClipboardEvent, stepIdx: number) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile()
        if (file) {
          e.preventDefault()
          handleFileUpload(stepIdx, file)
          return
        }
      }
    }
  }

  // Salvar Manual
  const handleSaveArticle = async () => {
    if (!formData.title.trim()) {
      toast.error('Informe o título do manual')
      return
    }
    if (!formData.categoryId) {
      toast.error('Selecione uma categoria')
      return
    }
    if (formData.steps.length === 0) {
      toast.error('Adicione ao menos um passo')
      return
    }

    setSaving(true)
    try {
      const isEdit = Boolean(formData.id)
      const url = isEdit ? `/api/manuals/${formData.id}` : '/api/manuals'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await authFetch(url, {
        method,
        body: JSON.stringify(formData),
      })

      if (!res.ok) throw new Error('Falha ao salvar manual')

      toast.success(isEdit ? 'Manual atualizado com sucesso' : 'Manual publicado com sucesso')
      setEditArticleOpen(false)
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao persistir manual')
    } finally {
      setSaving(false)
    }
  }

  // Deletar Manual
  const handleDeleteArticle = async (id: string, title: string) => {
    if (!confirm(`Deseja realmente excluir o manual "${title}"?`)) return

    try {
      const res = await authFetch(`/api/manuals/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao excluir')
      toast.success('Manual removido')
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir')
    }
  }

  // Filtragem dos Artigos na Tela
  const filteredArticles = articles.filter((art) => {
    if (selectedRoleFilter !== 'ALL' && !art.targetRoles.includes(selectedRoleFilter)) {
      return false
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchTitle = art.title.toLowerCase().includes(q)
      const matchSummary = art.summary?.toLowerCase().includes(q)
      const matchCat = art.categoryTitle?.toLowerCase().includes(q)
      return matchTitle || matchSummary || matchCat
    }
    return true
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Cabeçalho da Central */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <BookOpen className="h-6 w-6 text-purple-700 dark:text-purple-400" />
            <span>Gestão da Central de Ajuda & Manuais</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Painel exclusivo do Super Admin para alimentar passos operacionais, fotos e vídeos para lojas e caixas.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenCategoryDialog()}
            className="text-xs font-bold rounded-xl cursor-pointer"
          >
            <FolderPlus className="h-4 w-4 mr-1.5" />
            Nova Categoria
          </Button>

          <Button
            type="button"
            onClick={() => handleOpenArticleDialog()}
            className="text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white rounded-xl cursor-pointer shadow-xs"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Novo Manual
          </Button>
        </div>
      </div>

      {/* Abas Super Admin: Manuais e Telas vs Métricas & Sugestões */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setActiveAdminTab('MANUALS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeAdminTab === 'MANUALS'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'bg-card hover:bg-muted text-foreground border border-border'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Manuais & Telas ({articles.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveAdminTab('METRICS')
            loadMetrics()
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeAdminTab === 'METRICS'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'bg-card hover:bg-muted text-foreground border border-border'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Métricas & Sugestões de Utilizadores</span>
          {metricsData && metricsData.pendingSuggestionsCount > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-amber-500 text-white font-black">
              {metricsData.pendingSuggestionsCount} pendentes
            </span>
          )}
        </button>
      </div>

      {activeAdminTab === 'METRICS' ? (
        /* ========================================================= */
        /* PAINEL DE MÉTRICAS & FEED DE SUGESTÕES DOS UTILIZADORES   */
        /* ========================================================= */
        <div className="space-y-6">
          {metricsLoading && !metricsData ? (
            <div className="text-center py-16 text-xs text-muted-foreground">
              Carregando indicadores analíticos e sugestões...
            </div>
          ) : metricsData ? (
            <>
              {/* 1. CARDS DE INDICADORES GLOBAIS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-2xl p-4 space-y-1 shadow-2xs">
                  <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Total de Avaliações
                  </div>
                  <div className="text-2xl font-black text-foreground">
                    {metricsData.totalVotes}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Votos registrados em todos os manuais
                  </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-4 space-y-1 shadow-2xs">
                  <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                    <span>Taxa de Aprovação</span>
                    <Badge variant="outline" className={`text-[10px] font-bold ${
                      metricsData.helpfulPercentage >= 80
                        ? 'text-emerald-700 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30'
                        : 'text-amber-700 border-amber-300 bg-amber-50 dark:bg-amber-950/30'
                    }`}>
                      {metricsData.helpfulPercentage}% Útil
                    </Badge>
                  </div>
                  <div className="text-2xl font-black text-foreground">
                    {metricsData.helpfulVotes} <span className="text-xs text-muted-foreground font-normal">votos Sim</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${metricsData.helpfulPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-4 space-y-1 shadow-2xs">
                  <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Dúvidas / Votos Não
                  </div>
                  <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                    {metricsData.unhelpfulVotes}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Usuários que precisavam de mais detalhes
                  </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-4 space-y-1 shadow-2xs">
                  <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                    <span>Sugestões Enviadas</span>
                    {metricsData.pendingSuggestionsCount > 0 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-amber-500 text-white font-bold">
                        {metricsData.pendingSuggestionsCount} pendentes
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-black text-purple-700 dark:text-purple-400">
                    {metricsData.suggestions.length}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Contribuições para enriquecer os guias
                  </div>
                </div>
              </div>

              {/* 2. TELAS COM MAIOR ÍNDICE DE DÚVIDAS (PRIORIDADE DE VÍDEO/PRINT) */}
              {metricsData.lowestRatedArticles.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <span>Telas com Maior Índice de Dúvidas (Prioridade para Vídeos/Prints)</span>
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Estas páginas receberam votos negativos e devem receber mídias ou explicações adicionais primeiro.
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground text-[11px]">
                          <th className="py-2.5 font-bold">Tela / Manual</th>
                          <th className="py-2.5 font-bold">Categoria</th>
                          <th className="py-2.5 font-bold text-center">Votos Sim (👍)</th>
                          <th className="py-2.5 font-bold text-center">Votos Não (👎)</th>
                          <th className="py-2.5 font-bold text-center">Aprovação</th>
                          <th className="py-2.5 font-bold text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metricsData.lowestRatedArticles.map((art: any) => (
                          <tr key={art.id} className="border-b border-border/50 hover:bg-muted/40 transition">
                            <td className="py-2.5 font-bold text-foreground">{art.title}</td>
                            <td className="py-2.5 text-muted-foreground">{art.category_title || '-'}</td>
                            <td className="py-2.5 text-center text-emerald-600 font-bold">{art.helpful_votes}</td>
                            <td className="py-2.5 text-center text-rose-600 font-bold">{art.unhelpful_votes}</td>
                            <td className="py-2.5 text-center">
                              <Badge variant="outline" className="text-[10px] font-bold">
                                {art.approval_rate || 0}%
                              </Badge>
                            </td>
                            <td className="py-2.5 text-right">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const found = articles.find((a) => a.id === art.id)
                                  if (found) handleOpenArticleDialog(found)
                                }}
                                className="text-xs font-bold rounded-lg h-7 cursor-pointer"
                              >
                                Editar Tela
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 3. FEED DE SUGESTÕES DOS UTILIZADORES */}
              <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-purple-600" />
                      <span>Feed de Sugestões Enviadas pelos Utilizadores</span>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Comentários detalhados enviados quando o usuário respondeu &quot;Não&quot; no guia da tela.
                    </p>
                  </div>

                  {/* Filtro de Status das Sugestões */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSuggestionStatusFilter('ALL')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        suggestionStatusFilter === 'ALL'
                          ? 'bg-purple-700 text-white'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Todas ({metricsData.suggestions.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSuggestionStatusFilter('PENDING')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        suggestionStatusFilter === 'PENDING'
                          ? 'bg-purple-700 text-white'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Pendentes ({metricsData.suggestions.filter((s: any) => s.status === 'PENDING').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSuggestionStatusFilter('IMPLEMENTED')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        suggestionStatusFilter === 'IMPLEMENTED'
                          ? 'bg-purple-700 text-white'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Atendidas ({metricsData.suggestions.filter((s: any) => s.status === 'IMPLEMENTED').length})
                    </button>
                  </div>
                </div>

                {metricsData.suggestions.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    Nenhuma sugestão registrada até ao momento.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {metricsData.suggestions
                      .filter((s: any) => {
                        if (suggestionStatusFilter === 'PENDING') return s.status === 'PENDING'
                        if (suggestionStatusFilter === 'IMPLEMENTED') return s.status === 'IMPLEMENTED'
                        return true
                      })
                      .map((sug: any) => (
                        <div
                          key={sug.id}
                          className="p-4 rounded-xl border border-border bg-background space-y-2.5 hover:border-purple-300 transition"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-foreground">
                                {sug.user_name || 'Usuário Anônimo'}
                              </span>
                              {sug.user_role && (
                                <Badge variant="outline" className="text-[9.5px] font-bold text-muted-foreground">
                                  {sug.user_role}
                                </Badge>
                              )}
                              <span className="text-[10px] text-muted-foreground">
                                • {new Date(sug.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px] font-bold text-purple-700 border-purple-200">
                                {sug.article_title}
                              </Badge>

                              <Badge className={`text-[10px] font-bold ${
                                sug.status === 'IMPLEMENTED'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60'
                              }`}>
                                {sug.status === 'IMPLEMENTED' ? 'Atendida' : 'Pendente'}
                              </Badge>
                            </div>
                          </div>

                          <div className="text-xs text-foreground/90 bg-muted/30 p-3 rounded-lg border border-border/40 whitespace-pre-line leading-relaxed">
                            &quot;{sug.suggestion_text}&quot;
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-1">
                            {sug.status === 'PENDING' ? (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleUpdateSuggestionStatus(sug.id, 'IMPLEMENTED')}
                                className="bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold rounded-lg h-7 cursor-pointer"
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Marcar como Atendida
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateSuggestionStatus(sug.id, 'PENDING')}
                                className="text-[11px] font-bold rounded-lg h-7 cursor-pointer"
                              >
                                Reabrir Sugestão
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      ) : (
        /* ========================================================= */
        /* GESTÃO DE MANUAIS & TELAS (VISUALIZAÇÃO DE CARDS)         */
        /* ========================================================= */
        <>
        {/* Barra de Filtros por Perfil & Busca */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border">
          {/* Abas de Perfil */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setSelectedRoleFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedRoleFilter === 'ALL'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            Todos ({articles.length})
          </button>

          <button
            type="button"
            onClick={() => setSelectedRoleFilter('CASHIER')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedRoleFilter === 'CASHIER'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            Caixa & Atendimento ({articles.filter((a) => a.targetRoles.includes('CASHIER')).length})
          </button>

          <button
            type="button"
            onClick={() => setSelectedRoleFilter('TENANT_ADMIN')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedRoleFilter === 'TENANT_ADMIN'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            Franqueados ({articles.filter((a) => a.targetRoles.includes('TENANT_ADMIN')).length})
          </button>

          <button
            type="button"
            onClick={() => setSelectedRoleFilter('FRANCHISOR_ADMIN')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedRoleFilter === 'FRANCHISOR_ADMIN'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            Franqueadora ({articles.filter((a) => a.targetRoles.includes('FRANCHISOR_ADMIN')).length})
          </button>
        </div>

        {/* Busca */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar manuais..."
            className="pl-8 text-xs rounded-xl h-9 bg-background"
          />
        </div>
      </div>

      {/* Grid de Manuais */}
      {loading ? (
        <div className="text-center py-16 text-xs text-muted-foreground">
          Carregando central de manuais...
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-border rounded-2xl bg-card space-y-3">
          <BookOpen className="h-10 w-10 text-muted-foreground/40 mx-auto" />
          <div className="text-sm font-bold text-foreground">Nenhum manual cadastrado nesta visualização</div>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Utilize o botão acima para cadastrar o primeiro guia passo a passo para os operadores e franqueados.
          </p>
          <Button
            type="button"
            onClick={() => handleOpenArticleDialog()}
            className="text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white rounded-xl"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Cadastrar Manual
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredArticles.map((art) => (
            <div
              key={art.id}
              className="bg-card border border-border hover:border-purple-300 dark:hover:border-purple-800 rounded-2xl p-4 flex flex-col justify-between transition-shadow shadow-xs hover:shadow-md space-y-4"
            >
              <div className="space-y-2.5">
                {/* Cabeçalho do Card */}
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="text-[10px] font-bold text-purple-700 bg-purple-50 dark:bg-purple-950/40 border-purple-200">
                    {art.categoryTitle || 'Sem categoria'}
                  </Badge>

                  <Badge
                    variant="outline"
                    className={`text-[9.5px] font-bold ${
                      art.published
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30'
                        : 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/30'
                    }`}
                  >
                    {art.published ? 'Publicado' : 'Rascunho'}
                  </Badge>
                </div>

                {/* Título & Resumo */}
                <div>
                  <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2">
                    {art.title}
                  </h3>
                  {art.summary && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                      {art.summary}
                    </p>
                  )}
                </div>

                {/* Tags de Perfis com Acesso */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {art.targetRoles.includes('CASHIER') && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-800 dark:bg-purple-900/40 font-semibold">
                      Caixa
                    </span>
                  )}
                  {art.targetRoles.includes('TENANT_ADMIN') && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900/40 font-semibold">
                      Franqueado
                    </span>
                  )}
                  {art.targetRoles.includes('FRANCHISOR_ADMIN') && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-900/40 font-semibold">
                      Franqueadora
                    </span>
                  )}
                </div>
              </div>

              {/* Rodapé com Métricas & Ações */}
              <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2 text-[10.5px]">
                  <span>{art.steps?.length || 0} passos</span>
                  <span>•</span>
                  <span>{art.readTimeMinutes || 3} min</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenArticleDialog(art)}
                    className="p-1.5 rounded-lg hover:bg-muted text-foreground transition cursor-pointer"
                    title="Editar manual"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteArticle(art.id, art.title)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition cursor-pointer"
                    title="Excluir manual"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </>
      )}

      {/* DIÁLOGO: CRIAÇÃO / EDIÇÃO DE MANUAL */}
      <Dialog open={editArticleOpen} onOpenChange={setEditArticleOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl p-6">
          <DialogHeader className="border-b border-border pb-3">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-700" />
              <span>{formData.id ? 'Editar Manual' : 'Novo Manual Passo a Passo'}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* 1. DADOS BÁSICOS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Título do Guia *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Ex: Como Montar Copos de Açaí no PDV"
                  className="text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Categoria *</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData((p) => ({ ...p, categoryId: e.target.value }))}
                  className="w-full text-xs rounded-xl border border-input bg-background px-3 py-2 text-foreground focus:outline-hidden"
                >
                  <option value="">Selecione uma categoria...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-foreground">Resumo do Objetivo (1 linha)</label>
                <Input
                  value={formData.summary}
                  onChange={(e) => setFormData((p) => ({ ...p, summary: e.target.value }))}
                  placeholder="Ex: Instrução de montagem, cotas de acompanhamentos e cobrança de cremes extras."
                  className="text-xs rounded-xl"
                />
              </div>

              {/* Perfis com Acesso */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-foreground">Quem pode visualizar este manual?</label>
                <div className="flex flex-wrap gap-4 pt-1">
                  {[
                    { id: 'CASHIER' as UserRole, label: 'Operadores de Caixa & Atendimento' },
                    { id: 'TENANT_ADMIN' as UserRole, label: 'Gerentes de Franquia (Lojas)' },
                    { id: 'FRANCHISOR_ADMIN' as UserRole, label: 'Franqueadora Master (Matriz)' },
                  ].map((roleItem) => {
                    const checked = formData.targetRoles.includes(roleItem.id)
                    return (
                      <label key={roleItem.id} className="flex items-center gap-2 text-xs cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData((p) => ({ ...p, targetRoles: [...p.targetRoles, roleItem.id] }))
                            } else {
                              setFormData((p) => ({
                                ...p,
                                targetRoles: p.targetRoles.filter((r) => r !== roleItem.id),
                              }))
                            }
                          }}
                          className="rounded border-input text-purple-700"
                        />
                        <span>{roleItem.label}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Publicado & Tempo de Leitura */}
              <div className="flex items-center gap-4">
                <div className="space-y-1.5 flex-1">
                  <label className="text-xs font-bold text-foreground">Tempo Estimado (min)</label>
                  <Input
                    type="number"
                    min={1}
                    max={60}
                    value={formData.readTimeMinutes}
                    onChange={(e) => setFormData((p) => ({ ...p, readTimeMinutes: Number(e.target.value) || 1 }))}
                    className="text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1.5 flex-1">
                  <label className="text-xs font-bold text-foreground">Estado de Publicação</label>
                  <div className="pt-2">
                    <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.published}
                        onChange={(e) => setFormData((p) => ({ ...p, published: e.target.checked }))}
                        className="rounded border-input text-purple-700"
                      />
                      <span className="font-bold">{formData.published ? 'Publicado' : 'Salvar como Rascunho'}</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. PASSOS SEQUENCIAIS */}
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Passos Sequenciais ({formData.steps.length})</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Monte o fluxo passo a passo. Pode colar prints diretamente com Ctrl+V na área da mídia.
                  </p>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddStep}
                  className="text-xs font-bold rounded-xl"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Adicionar Passo
                </Button>
              </div>

              <div className="space-y-4">
                {formData.steps.map((step, idx) => (
                  <div
                    key={idx}
                    onPaste={(e) => handlePasteOnStep(e, idx)}
                    className="p-4 rounded-2xl border border-border bg-muted/20 space-y-3 relative group"
                  >
                    {/* Header do Passo */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-6 w-6 rounded-full bg-purple-700 text-white flex items-center justify-center text-xs font-black">
                          {step.step_number}
                        </span>
                        <span className="text-xs font-bold text-foreground">Passo {step.step_number}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveStep(idx, 'UP')}
                          disabled={idx === 0}
                          className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                          title="Mover para cima"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveStep(idx, 'DOWN')}
                          disabled={idx === formData.steps.length - 1}
                          className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                          title="Mover para baixo"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveStep(idx)}
                          className="p-1 rounded text-red-600 hover:bg-red-50 cursor-pointer ml-2"
                          title="Remover passo"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Título & Texto */}
                    <div className="space-y-2">
                      <Input
                        value={step.title}
                        onChange={(e) => handleUpdateStep(idx, { title: e.target.value })}
                        placeholder={`Título do Passo ${step.step_number} (ex: Aceder à Tela de Fecho)`}
                        className="text-xs font-bold rounded-xl"
                      />

                      <textarea
                        value={step.description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleUpdateStep(idx, { description: e.target.value })}
                        placeholder="Descreva exatamente o que o utilizador deve fazer neste passo..."
                        rows={2}
                        className="w-full text-xs rounded-xl border border-input bg-background p-2.5 text-foreground focus:outline-hidden"
                      />
                    </div>

                    {/* MÍDIA DO PASSO (SEM CAMPO GENÉRICO DE URL) */}
                    <div className="p-3 rounded-xl border border-border/80 bg-background space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-muted-foreground">Mídia do Passo</span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateStep(idx, { media_source: 'UPLOAD' })}
                            className={`px-2 py-1 rounded-lg text-[10.5px] font-bold cursor-pointer transition ${
                              step.media_source !== 'YOUTUBE'
                                ? 'bg-purple-100 text-purple-900 dark:bg-purple-900/50'
                                : 'text-muted-foreground hover:bg-muted'
                            }`}
                          >
                            Upload / Ctrl+V
                          </button>

                          <button
                            type="button"
                            onClick={() => handleUpdateStep(idx, { media_source: 'YOUTUBE' })}
                            className={`px-2 py-1 rounded-lg text-[10.5px] font-bold cursor-pointer transition ${
                              step.media_source === 'YOUTUBE'
                                ? 'bg-purple-100 text-purple-900 dark:bg-purple-900/50'
                                : 'text-muted-foreground hover:bg-muted'
                            }`}
                          >
                            Vídeo do YouTube
                          </button>
                        </div>
                      </div>

                      {/* Caso A: Upload / Colar Ctrl+V */}
                      {step.media_source !== 'YOUTUBE' ? (
                        <div className="space-y-2">
                          {step.media_url ? (
                            <div className="relative rounded-xl border border-border overflow-hidden bg-black/5 dark:bg-black/40 p-2 flex items-center justify-between gap-3">
                              {step.media_type === 'VIDEO' ? (
                                <video
                                  src={step.media_url}
                                  muted
                                  playsInline
                                  loop
                                  autoPlay
                                  className="h-20 w-32 object-cover rounded-lg border border-border"
                                />
                              ) : (
                                <img
                                  src={step.media_url}
                                  alt=""
                                  className="h-20 w-32 object-cover rounded-lg border border-border"
                                />
                              )}

                              <div className="flex-1 min-w-0 text-xs">
                                <div className="font-mono text-[10px] text-muted-foreground truncate">
                                  {step.media_url}
                                </div>
                                <div className="text-[10px] text-emerald-600 font-bold mt-1">
                                  {step.media_type === 'VIDEO' ? 'Vídeo Carregado' : 'Imagem / Print Carregado'}
                                </div>
                              </div>

                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateStep(idx, { media_url: null })}
                                className="text-xs text-red-600 hover:bg-red-50"
                              >
                                Remover
                              </Button>
                            </div>
                          ) : (
                            <div className="border border-dashed border-border rounded-xl p-4 text-center space-y-2 bg-muted/10">
                              <p className="text-xs text-muted-foreground">
                                Cole um print com <kbd className="px-1.5 py-0.5 rounded bg-muted border font-mono">Ctrl + V</kbd> ou selecione um ficheiro:
                              </p>

                              <label className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-card border border-border hover:bg-muted cursor-pointer transition">
                                <Upload className="h-3.5 w-3.5" />
                                <span>{uploadingStepIdx === idx ? 'A carregar...' : 'Selecionar Imagem, GIF ou Vídeo MP4'}</span>
                                <input
                                  type="file"
                                  accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm"
                                  className="hidden"
                                  disabled={uploadingStepIdx === idx}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) handleFileUpload(idx, file)
                                  }}
                                />
                              </label>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Caso B: Link Específico do YouTube */
                        <div className="space-y-2">
                          <Input
                            value={step.media_url || ''}
                            onChange={(e) => {
                              const url = e.target.value
                              const ytid = extractYoutubeId(url)
                              handleUpdateStep(idx, {
                                media_source: 'YOUTUBE',
                                media_type: 'VIDEO',
                                media_url: url,
                                youtube_id: ytid,
                              })
                            }}
                            placeholder="Cole o link do YouTube (ex: https://www.youtube.com/watch?v=... ou https://youtu.be/...)"
                            className="text-xs rounded-xl"
                          />

                          {step.youtube_id && (
                            <div className="relative rounded-xl overflow-hidden border border-border aspect-video max-w-sm">
                              <iframe
                                src={`https://www.youtube-nocookie.com/embed/${step.youtube_id}?modestbranding=1&rel=0`}
                                title="Pré-visualização do YouTube"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                className="w-full h-full border-0"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* DICA / ATENÇÃO (CALLOUT OPCIONAL) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                      <div>
                        <select
                          value={step.callout_type || ''}
                          onChange={(e) =>
                            handleUpdateStep(idx, {
                              callout_type: (e.target.value as any) || null,
                            })
                          }
                          className="w-full text-xs rounded-xl border border-input bg-background px-2.5 py-1.5 text-foreground"
                        >
                          <option value="">Sem nota de destaque</option>
                          <option value="INFO">Dica Informativa (Azul)</option>
                          <option value="ALERT">Atenção Crítica (Âmbar)</option>
                        </select>
                      </div>

                      {step.callout_type && (
                        <div className="sm:col-span-2">
                          <Input
                            value={step.callout_text || ''}
                            onChange={(e) => handleUpdateStep(idx, { callout_text: e.target.value })}
                            placeholder="Texto da nota / dica para este passo..."
                            className="text-xs rounded-xl"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-border pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditArticleOpen(false)}
              className="text-xs font-bold rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={saving}
              onClick={handleSaveArticle}
              className="text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white rounded-xl shadow-xs"
            >
              {saving ? 'A salvar...' : 'Salvar Manual'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO: CRIAÇÃO / EDIÇÃO DE CATEGORIA */}
      <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader className="border-b border-border pb-3">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <FolderPlus className="h-5 w-5 text-purple-700" />
              <span>{categoryForm.id ? 'Editar Categoria' : 'Nova Categoria de Manuais'}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Título da Categoria *</label>
              <Input
                value={categoryForm.title}
                onChange={(e) => setCategoryForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Ex: Operação de Caixa"
                className="text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Descrição</label>
              <textarea
                value={categoryForm.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCategoryForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Breve explicação dos manuais desta categoria..."
                rows={2}
                className="w-full text-xs rounded-xl border border-input bg-background p-2.5 text-foreground focus:outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Ordem de Exibição</label>
              <Input
                type="number"
                value={categoryForm.orderIndex}
                onChange={(e) => setCategoryForm((p) => ({ ...p, orderIndex: Number(e.target.value) || 0 }))}
                className="text-xs rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="border-t border-border pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCategoryModalOpen(false)}
              className="text-xs font-bold rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={saving}
              onClick={handleSaveCategory}
              className="text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white rounded-xl shadow-xs"
            >
              {saving ? 'A salvar...' : 'Salvar Categoria'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
