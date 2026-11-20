'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { ManualArticle, ManualCategory, ManualStep, UserRole } from '@/types'
import { useAuthStore } from '@/lib/stores/authStore'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  BookOpen,
  Search,
  ChevronRight,
  Printer,
  ThumbsUp,
  ThumbsDown,
  ArrowLeft,
  ExternalLink,
  Info,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ArrowRight,
  Maximize2,
  X,
} from 'lucide-react'

export default function AjudaPortalPage() {
  const { user, token, checkAuth } = useAuthStore()

  const [categories, setCategories] = useState<ManualCategory[]>([])
  const [articles, setArticles] = useState<ManualArticle[]>([])
  const [loading, setLoading] = useState(true)

  // Filtro de auditoria exclusivo para SUPER_ADMIN (Henrique)
  const [simulatedRole, setSimulatedRole] = useState<UserRole | 'ALL'>('ALL')

  // Navegação
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null)
  const [activeArticle, setActiveArticle] = useState<ManualArticle | null>(null)

  // Busca Instantânea
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchLoading, setSearchLoading] = useState(false)

  // Lightbox de Imagem
  const [lightboxImg, setLightboxImg] = useState<string | null>(null)

  // Feedback de voto
  const [votedArticleId, setVotedArticleId] = useState<string | null>(null)
  const [feedbackLoading, setFeedbackLoading] = useState(false)

  // Inicialização de Auth
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Carregar Categorias e Artigos
  const loadPortalData = useCallback(async () => {
    setLoading(true)
    try {
      const activeRole = simulatedRole === 'ALL' ? user?.role : simulatedRole
      const roleParam = activeRole ? `&role=${activeRole}` : ''

      const [catsRes, artsRes] = await Promise.all([
        fetch(`/api/manuals/categories?onlyPublished=true${roleParam}`),
        fetch(`/api/manuals?onlyPublished=true${roleParam}`),
      ])

      const catsData = await catsRes.json()
      const artsData = await artsRes.json()

      if (Array.isArray(catsData.categories)) {
        setCategories(catsData.categories)
        if (!selectedCatId && catsData.categories.length > 0) {
          setSelectedCatId(catsData.categories[0].id)
        }
      }
      if (Array.isArray(artsData.articles)) {
        setArticles(artsData.articles)
      }
    } catch {
      toast.error('Erro ao carregar manuais de ajuda.')
    } finally {
      setLoading(false)
    }
  }, [user, simulatedRole, selectedCatId])

  useEffect(() => {
    loadPortalData()
  }, [loadPortalData])

  // Busca com Debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const res = await fetch(`/api/manuals/search?q=${encodeURIComponent(searchQuery.trim())}`)
        const data = await res.json()
        if (Array.isArray(data.results)) {
          setSearchResults(data.results)
        }
      } catch {
        // Silencioso
      } finally {
        setSearchLoading(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Selecionar Artigo a partir da busca
  const handleSelectFromSearch = async (artId: string) => {
    setSearchQuery('')
    setSearchResults([])
    const found = articles.find((a) => a.id === artId)
    if (found) {
      setActiveArticle(found)
      setSelectedCatId(found.categoryId)
    } else {
      try {
        const res = await fetch(`/api/manuals/${artId}`)
        const data = await res.json()
        if (data.article) {
          setActiveArticle(data.article)
          setSelectedCatId(data.article.categoryId)
        }
      } catch {
        toast.error('Manual não encontrado')
      }
    }
  }

  // Registrar voto de utilidade
  const handleVote = async (articleId: string, isHelpful: boolean) => {
    if (votedArticleId === articleId) return
    setFeedbackLoading(true)
    try {
      const res = await fetch(`/api/manuals/${articleId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isHelpful }),
      })
      if (!res.ok) throw new Error()
      setVotedArticleId(articleId)
      toast.success('Obrigado pelo seu feedback!')
    } catch {
      toast.error('Não foi possível registrar o feedback.')
    } finally {
      setFeedbackLoading(false)
    }
  }

  const isSuperAdmin = user?.role === 'SUPER_ADMIN'

  // Filtragem dos artigos da categoria selecionada
  const activeCategory = categories.find((c) => c.id === selectedCatId)
  const categoryArticles = articles.filter((a) => {
    if (selectedCatId && a.categoryId !== selectedCatId) return false
    if (simulatedRole !== 'ALL' && !a.targetRoles.includes(simulatedRole)) return false
    return true
  })

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0b0612] text-foreground font-sans antialiased selection:bg-purple-600 selection:text-white">
      {/* 1. TOPO CORPORATIVO (HEADER) */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#120a1f]/95 backdrop-blur-md border-b border-border px-4 md:px-8 py-3.5 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Logo & Título */}
          <div className="flex items-center gap-3">
            <img
              src="/logo-oficial-1.png"
              alt="Açaí da Rose"
              className="h-9 w-auto object-contain drop-shadow-xs"
            />
            <div>
              <div className="text-sm font-black text-foreground tracking-tight leading-none">
                Açaí da Rose
              </div>
              <div className="text-[10px] text-purple-700 dark:text-purple-400 font-bold tracking-wider uppercase mt-0.5">
                Central de Manuais & Ajuda
              </div>
            </div>
          </div>

          {/* Barra de Pesquisa Instantânea */}
          <div className="relative flex-1 max-w-md mx-auto md:mx-6 w-full">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar em passos, regras e manuais..."
              className="pl-8 text-xs rounded-xl h-9 bg-card border-border"
            />

            {/* Dropdown de Resultados da Busca */}
            {searchQuery.trim().length > 0 && (
              <div className="absolute left-0 right-0 top-11 bg-card border border-border rounded-2xl shadow-xl z-50 p-2 text-xs space-y-1 max-h-80 overflow-y-auto">
                {searchLoading ? (
                  <div className="p-3 text-center text-muted-foreground text-[11px]">
                    Pesquisando...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-3 text-center text-muted-foreground text-[11px]">
                    Nenhum resultado encontrado para &quot;{searchQuery}&quot;.
                  </div>
                ) : (
                  searchResults.map((res: any) => (
                    <button
                      key={res.id}
                      type="button"
                      onClick={() => handleSelectFromSearch(res.id)}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-muted transition cursor-pointer flex flex-col gap-0.5"
                    >
                      <div className="font-bold text-foreground text-xs flex items-center justify-between">
                        <span>{res.title}</span>
                        <span className="text-[9.5px] font-semibold text-purple-700 dark:text-purple-400 uppercase">
                          {res.categoryTitle}
                        </span>
                      </div>
                      {res.matchType === 'STEP' && res.matchedStepTitle && (
                        <div className="text-[10.5px] text-muted-foreground">
                          No Passo {res.matchedStepNumber}: {res.matchedStepTitle}
                        </div>
                      )}
                      {res.summary && res.matchType !== 'STEP' && (
                        <div className="text-[10.5px] text-muted-foreground line-clamp-1">
                          {res.summary}
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Área do Usuário & Controles de Auditoria */}
          <div className="flex items-center gap-3 justify-end text-xs">
            {/* Seletor de Auditoria (Exclusivo Super Admin Henrique) */}
            {isSuperAdmin && (
              <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border border-border">
                <span className="text-[10px] text-muted-foreground font-bold pl-1.5">Visão:</span>
                <select
                  value={simulatedRole}
                  onChange={(e) => setSimulatedRole(e.target.value as any)}
                  className="bg-transparent text-[10.5px] font-bold text-foreground focus:outline-hidden cursor-pointer"
                >
                  <option value="ALL">Todas as Áreas (Super Admin)</option>
                  <option value="CASHIER">Caixa & Atendimento</option>
                  <option value="TENANT_ADMIN">Franqueado (Loja)</option>
                  <option value="FRANCHISOR_ADMIN">Franqueadora (Matriz)</option>
                </select>
              </div>
            )}

            {/* Identificação do Usuário */}
            {user ? (
              <div className="hidden sm:block text-right">
                <div className="font-bold text-foreground leading-none">{user.name}</div>
                <div className="text-[10px] text-muted-foreground uppercase font-semibold mt-0.5">
                  {user.role}
                </div>
              </div>
            ) : null}

            {/* Botão de Retorno à Plataforma */}
            <a
              href="https://app.acaidarose.pt"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <span>Plataforma</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </header>

      {/* 2. CORPO EM DUAS COLUNAS (LINEAR/STRIPE STYLE) */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* COLUNA ESQUERDA: NAVEGAÇÃO DE CATEGORIAS (md:col-span-3) */}
        <aside className="md:col-span-3 space-y-4 print:hidden">
          <div className="sticky top-20 space-y-4">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2">
              Categorias de Manuais
            </div>

            <nav className="space-y-1">
              {categories.map((cat) => {
                const isSelected = selectedCatId === cat.id && !activeArticle
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCatId(cat.id)
                      setActiveArticle(null)
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-purple-700 text-white shadow-xs'
                        : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    <span className="truncate">{cat.title}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                        isSelected
                          ? 'bg-purple-800 text-white'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {cat.articlesCount || 0}
                    </span>
                  </button>
                )
              })}
            </nav>
          </div>
        </aside>

        {/* COLUNA PRINCIPAL: ARTIGO ABERTO OU LISTAGEM (md:col-span-9) */}
        <main className="md:col-span-9">
          {loading ? (
            <div className="py-20 text-center text-xs text-muted-foreground">
              A carregar conteúdo dos manuais...
            </div>
          ) : activeArticle ? (
            /* ========================================================= */
            /* VISUALIZADOR DE ARTIGO / MANUAL COMPLETO                  */
            /* ========================================================= */
            <article className="space-y-8 max-w-3xl">
              {/* Topo do Artigo / Breadcrumb */}
              <div className="space-y-3 border-b border-border pb-5">
                <button
                  type="button"
                  onClick={() => setActiveArticle(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 dark:text-purple-400 hover:underline cursor-pointer print:hidden"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Voltar aos manuais de {activeArticle.categoryTitle || 'Categoria'}</span>
                </button>

                <div className="flex items-center gap-2 pt-1 print:hidden">
                  <Badge variant="outline" className="text-[10.5px] font-bold text-purple-700 border-purple-200">
                    {activeArticle.categoryTitle}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Tempo estimado: {activeArticle.readTimeMinutes || 3} min
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight leading-tight">
                  {activeArticle.title}
                </h1>

                {activeArticle.summary && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {activeArticle.summary}
                  </p>
                )}
              </div>

              {/* PASSOS SEQUENCIAIS (1, 2, 3...) */}
              <div className="space-y-8">
                {activeArticle.steps.map((step) => (
                  <section
                    key={step.step_number}
                    className="space-y-4 p-5 sm:p-6 rounded-2xl border border-border bg-card shadow-xs break-inside-avoid"
                  >
                    {/* Header do Passo */}
                    <div className="flex items-start gap-3">
                      <span className="h-7 w-7 rounded-full bg-purple-700 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                        {step.step_number}
                      </span>
                      <div className="space-y-1">
                        <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                          {step.title}
                        </h2>
                        {step.description && (
                          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                            {step.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* MÍDIA DO PASSO (IMAGEM, GIF OU VÍDEO) */}
                    {step.media_source === 'YOUTUBE' && step.youtube_id ? (
                      <div className="relative rounded-2xl overflow-hidden border border-border aspect-video max-w-2xl bg-black">
                        <iframe
                          src={`https://www.youtube-nocookie.com/embed/${step.youtube_id}?rel=0&modestbranding=1&controls=1&playsinline=1`}
                          title={step.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full border-0"
                        />
                      </div>
                    ) : step.media_url ? (
                      <div className="relative group rounded-2xl overflow-hidden border border-border bg-black/5 dark:bg-black/30 max-w-2xl">
                        {step.media_type === 'VIDEO' ? (
                          <video
                            src={step.media_url}
                            controls
                            muted
                            loop
                            playsInline
                            className="w-full h-auto max-h-[460px] object-contain rounded-xl"
                          />
                        ) : (
                          <div className="relative">
                            <img
                              src={step.media_url}
                              alt={step.title}
                              className="w-full h-auto max-h-[460px] object-contain rounded-xl cursor-zoom-in"
                              onClick={() => setLightboxImg(step.media_url || null)}
                            />
                            <button
                              type="button"
                              onClick={() => setLightboxImg(step.media_url || null)}
                              className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white text-xs opacity-0 group-hover:opacity-100 transition print:hidden cursor-pointer"
                              title="Ampliar imagem"
                            >
                              <Maximize2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    ) : null}

                    {/* CALLOUT (DICA / ATENÇÃO) */}
                    {step.callout_type && step.callout_text && (
                      <div
                        className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs leading-relaxed ${
                          step.callout_type === 'ALERT'
                            ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 text-amber-900 dark:text-amber-200'
                            : 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 text-purple-900 dark:text-purple-200'
                        }`}
                      >
                        {step.callout_type === 'ALERT' ? (
                          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                        ) : (
                          <Info className="h-4 w-4 shrink-0 text-purple-700 mt-0.5" />
                        )}
                        <span>{step.callout_text}</span>
                      </div>
                    )}

                    {/* BOTÃO DE AÇÃO RÁPIDA ("IR PARA A TELA") */}
                    {step.action_route && (
                      <div className="pt-1 print:hidden">
                        <a
                          href={`https://app.acaidarose.pt/?view=${step.action_route}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border hover:bg-muted text-xs font-bold text-foreground transition cursor-pointer"
                        >
                          <span>Aceder à tela no sistema</span>
                          <ExternalLink className="h-3 w-3 text-purple-600" />
                        </a>
                      </div>
                    )}
                  </section>
                ))}
              </div>

              {/* RODAPÉ DO ARTIGO: FEEDBACK & IMPRESSÃO A4 */}
              <div className="pt-8 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
                {/* Pergunta de Feedback */}
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-bold text-muted-foreground">
                    Este guia esclareceu a sua dúvida?
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={feedbackLoading || votedArticleId === activeArticle.id}
                      onClick={() => handleVote(activeArticle.id, true)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                        votedArticleId === activeArticle.id
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : 'bg-card border-border hover:bg-muted text-foreground'
                      }`}
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                      <span>Sim</span>
                    </button>
                    <button
                      type="button"
                      disabled={feedbackLoading || votedArticleId === activeArticle.id}
                      onClick={() => handleVote(activeArticle.id, false)}
                      className="px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                      <span>Não</span>
                    </button>
                  </div>
                </div>

                {/* Botão de Impressão A4 */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.print()}
                  className="text-xs font-bold rounded-xl cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5 mr-1.5" />
                  Imprimir Guia em A4
                </Button>
              </div>
            </article>
          ) : (
            /* ========================================================= */
            /* LISTAGEM DE MANUAIS DA CATEGORIA SELECIONADA              */
            /* ========================================================= */
            <div className="space-y-6">
              <div className="border-b border-border pb-4">
                <h2 className="text-xl font-black text-foreground tracking-tight">
                  {activeCategory?.title || 'Manuais de Operação'}
                </h2>
                {activeCategory?.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {activeCategory.description}
                  </p>
                )}
              </div>

              {categoryArticles.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-border rounded-2xl bg-card space-y-2">
                  <BookOpen className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                  <div className="text-xs font-bold text-foreground">
                    Nenhum manual cadastrado nesta categoria.
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    O administrador pode adicionar novos guias passo a passo a qualquer momento.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {categoryArticles.map((art) => (
                    <button
                      key={art.id}
                      type="button"
                      onClick={() => setActiveArticle(art)}
                      className="text-left bg-card border border-border hover:border-purple-400 dark:hover:border-purple-800 rounded-2xl p-5 flex flex-col justify-between transition-all shadow-xs hover:shadow-md space-y-3 cursor-pointer group"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold">
                          <span>{art.steps?.length || 0} passos</span>
                          <span>{art.readTimeMinutes || 3} min</span>
                        </div>

                        <h3 className="text-sm font-bold text-foreground group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors leading-snug">
                          {art.title}
                        </h3>

                        {art.summary && (
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {art.summary}
                          </p>
                        )}
                      </div>

                      <div className="pt-2 flex items-center justify-between text-xs text-purple-700 dark:text-purple-400 font-bold">
                        <span>Ver passo a passo</span>
                        <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* LIGHTBOX DE IMAGEM FULLSCREEN */}
      <Dialog open={Boolean(lightboxImg)} onOpenChange={(open) => !open && setLightboxImg(null)}>
        <DialogContent className="max-w-5xl p-2 bg-black/90 border-0 rounded-2xl text-center overflow-hidden">
          <div className="relative">
            <button
              type="button"
              onClick={() => setLightboxImg(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 cursor-pointer z-10"
            >
              <X className="h-5 w-5" />
            </button>
            {lightboxImg && (
              <img
                src={lightboxImg}
                alt=""
                className="w-full h-auto max-h-[85vh] object-contain rounded-xl"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
