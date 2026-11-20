'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { ManualArticle, ManualCategory, UserRole } from '@/types'
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
  Maximize2,
  X,
  Building2,
  Store,
  ShoppingBag,
  Layers,
  Compass,
  Clock,
  CheckCircle2,
  ChevronLeft,
  MessageSquarePlus,
  Send,
  Sparkles,
} from 'lucide-react'

// Escopos estruturais para separar Franqueadora Master e Franquias
type PortalScope = 'ALL' | 'FRANCHISOR' | 'FRANCHISEE' | 'POS'

interface ScopeMeta {
  id: PortalScope
  title: string
  subtitle: string
  badge: string
  icon: React.ElementType
}

const SCOPES: ScopeMeta[] = [
  {
    id: 'ALL',
    title: 'Todas as Telas',
    subtitle: 'Visão unificada das 29 telas e processos operacionais da rede',
    badge: 'Rede Completa',
    icon: Layers,
  },
  {
    id: 'FRANCHISOR',
    title: 'Franqueadora Master',
    subtitle: 'Governança da rede, contratos, armazém B2B, cardápio oficial e analytics global',
    badge: 'Matriz & Expansão',
    icon: Building2,
  },
  {
    id: 'FRANCHISEE',
    title: 'Franquias (Lojas)',
    subtitle: 'Administração da unidade, estoque local, reposição com matriz, qualidade e configurações',
    badge: 'Gestão da Loja',
    icon: Store,
  },
  {
    id: 'POS',
    title: 'Operação de Caixa',
    subtitle: 'Frente de caixa PDV, montagem de copos, comandas de mesas e fila KDS',
    badge: 'Caixa & Salão',
    icon: ShoppingBag,
  },
]

// Normalizador unificado de seções e componentes da tela
interface NormalizedSection {
  stepNumber: number
  title: string
  instruction: string
  routePath: string | null
  calloutType: string | null
  calloutMessage: string | null
  mediaSource: string | null
  mediaType: string | null
  mediaUrl: string | null
  youtubeId: string | null
}

function normalizeSection(raw: any, index: number): NormalizedSection {
  return {
    stepNumber: raw?.stepNumber ?? raw?.step_number ?? index + 1,
    title: raw?.title || `Seção ${index + 1}`,
    instruction: raw?.instruction ?? raw?.description ?? '',
    routePath: raw?.routePath ?? raw?.action_route ?? null,
    calloutType: raw?.calloutType ?? raw?.callout_type ?? null,
    calloutMessage: raw?.calloutMessage ?? raw?.callout_text ?? null,
    mediaSource: raw?.mediaSource ?? raw?.media_source ?? (raw?.youtube_id ? 'YOUTUBE' : null),
    mediaType: raw?.mediaType ?? raw?.media_type ?? (raw?.media_url?.endsWith?.('.mp4') ? 'VIDEO' : 'IMAGE'),
    mediaUrl: raw?.mediaUrl ?? raw?.media_url ?? (typeof raw?.media === 'string' ? raw.media : raw?.media?.url ?? null),
    youtubeId: raw?.youtubeId ?? raw?.youtube_id ?? null,
  }
}

// Identifica a qual escopo a categoria pertence de forma dinâmica
function getCategoryScope(cat: ManualCategory): 'FRANCHISOR' | 'FRANCHISEE' | 'POS' {
  const t = (cat.title || '').toLowerCase()
  const s = (cat.slug || '').toLowerCase()

  if (t.startsWith('franqueadora') || s.startsWith('franqueadora')) return 'FRANCHISOR'
  if (t.startsWith('franquia') || s.startsWith('franquia')) return 'FRANCHISEE'
  if (t.includes('caixa') || t.includes('operação') || s.includes('caixa') || s.includes('operacao')) return 'POS'

  if (cat.targetRoles.includes('FRANCHISOR_ADMIN') && !cat.targetRoles.includes('TENANT_ADMIN')) {
    return 'FRANCHISOR'
  }
  if (cat.targetRoles.includes('CASHIER') && !cat.targetRoles.includes('FRANCHISOR_ADMIN')) {
    return 'POS'
  }
  return 'FRANCHISEE'
}

export default function AjudaPortalPage() {
  const { user, token, checkAuth, login } = useAuthStore()
  const [effectiveToken, setEffectiveToken] = useState<string | null>(token)

  const [categories, setCategories] = useState<ManualCategory[]>([])
  const [articles, setArticles] = useState<ManualArticle[]>([])
  const [loading, setLoading] = useState(true)

  // Escopo ativo (Segmented Control): Franqueadora Master vs Franquias vs Operação
  const [activeScope, setActiveScope] = useState<PortalScope>('ALL')

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

  // Feedback Inteligente: Voto & Caixa de Sugestão
  const [votedArticleId, setVotedArticleId] = useState<string | null>(null)
  const [voteChoice, setVoteChoice] = useState<'YES' | 'NO' | null>(null)
  const [showSuggestionBox, setShowSuggestionBox] = useState(false)
  const [suggestionText, setSuggestionText] = useState('')
  const [suggestionSubmitted, setSuggestionSubmitted] = useState(false)
  const [feedbackLoading, setFeedbackLoading] = useState(false)

  // Reseta estado de feedback ao trocar de artigo
  useEffect(() => {
    setVotedArticleId(null)
    setVoteChoice(null)
    setShowSuggestionBox(false)
    setSuggestionText('')
    setSuggestionSubmitted(false)
  }, [activeArticle?.id])

  // Inicialização de Auth com resiliência a subdomínio
  useEffect(() => {
    let cand = token
    if (!cand && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      cand = urlParams.get('token')
      if (!cand) {
        const match = document.cookie.match(/(?:^|;\s*)x-auth-token=([^;]+)/)
        if (match) cand = match[1]
      }
    }

    if (cand) {
      setEffectiveToken(cand)
      if (typeof document !== 'undefined') {
        const isProd = window.location.hostname.includes('acaidarose.pt')
        const domainStr = isProd ? '; domain=.acaidarose.pt' : ''
        document.cookie = `x-auth-token=${cand}; path=/${domainStr}; max-age=2592000; SameSite=Lax`
      }
      fetch('/api/auth/me', { headers: { 'x-auth-token': cand } })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.user) {
            login(cand!, d.user)
          }
        })
        .catch(() => {})
    } else {
      checkAuth()
    }
  }, [token, checkAuth, login])

  // Carregar Categorias e Artigos
  const loadPortalData = useCallback(async () => {
    setLoading(true)
    try {
      const activeToken =
        effectiveToken ||
        useAuthStore.getState().token ||
        (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('token') : null)

      const activeRole = simulatedRole === 'ALL' ? user?.role : simulatedRole
      const roleParam = activeRole ? `&role=${activeRole}` : ''
      const tokenParam = activeToken ? `&token=${encodeURIComponent(activeToken)}` : ''

      const headers: Record<string, string> = {}
      if (activeToken) {
        headers['x-auth-token'] = activeToken
      }

      const [catsRes, artsRes] = await Promise.all([
        fetch(`/api/manuals/categories?onlyPublished=true${roleParam}${tokenParam}`, { headers }),
        fetch(`/api/manuals?onlyPublished=true${roleParam}${tokenParam}`, { headers }),
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
  }, [user, simulatedRole, selectedCatId, effectiveToken])

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
        const activeToken = effectiveToken || useAuthStore.getState().token
        const headers: Record<string, string> = activeToken ? { 'x-auth-token': activeToken } : {}
        const tokenParam = activeToken ? `&token=${encodeURIComponent(activeToken)}` : ''
        const res = await fetch(`/api/manuals/search?q=${encodeURIComponent(searchQuery.trim())}${tokenParam}`, { headers })
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
  }, [searchQuery, effectiveToken])

  // Selecionar Artigo a partir da busca
  const handleSelectFromSearch = async (artId: string) => {
    setSearchQuery('')
    setSearchResults([])
    const found = articles.find((a) => a.id === artId)
    if (found) {
      setActiveArticle(found)
      setSelectedCatId(found.categoryId)
      const foundCat = categories.find((c) => c.id === found.categoryId)
      if (foundCat) {
        setActiveScope(getCategoryScope(foundCat))
      }
    } else {
      try {
        const activeToken = effectiveToken || useAuthStore.getState().token
        const headers: Record<string, string> = activeToken ? { 'x-auth-token': activeToken } : {}
        const tokenParam = activeToken ? `?token=${encodeURIComponent(activeToken)}` : ''
        const res = await fetch(`/api/manuals/${artId}${tokenParam}`, { headers })
        const data = await res.json()
        if (data.article) {
          setActiveArticle(data.article)
          setSelectedCatId(data.article.categoryId)
          const foundCat = categories.find((c) => c.id === data.article.categoryId)
          if (foundCat) {
            setActiveScope(getCategoryScope(foundCat))
          }
        }
      } catch {
        toast.error('Manual não encontrado')
      }
    }
  }

  // Registrar voto Sim / Não
  const handleVote = async (articleId: string, isHelpful: boolean) => {
    if (votedArticleId === articleId && !showSuggestionBox) return

    if (isHelpful) {
      setFeedbackLoading(true)
      try {
        const activeToken = effectiveToken || useAuthStore.getState().token
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...(activeToken ? { 'x-auth-token': activeToken } : {}),
        }
        const tokenParam = activeToken ? `?token=${encodeURIComponent(activeToken)}` : ''
        const res = await fetch(`/api/manuals/${articleId}/feedback${tokenParam}`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ isHelpful: true }),
        })
        if (!res.ok) throw new Error()
        setVotedArticleId(articleId)
        setVoteChoice('YES')
        setShowSuggestionBox(false)
        toast.success('Obrigado! O seu voto positivo foi registrado com sucesso.')
      } catch {
        toast.error('Não foi possível registrar o feedback.')
      } finally {
        setFeedbackLoading(false)
      }
    } else {
      // Quando clica em NÃO: abre imediatamente a caixa de sugestão
      setVotedArticleId(articleId)
      setVoteChoice('NO')
      setShowSuggestionBox(true)
    }
  }

  // Enviar sugestão de melhoria quando votou NÃO
  const handleSendSuggestion = async (articleId: string) => {
    if (!suggestionText.trim()) {
      toast.error('Por favor, escreva o que gostaria que fosse explicado.')
      return
    }

    setFeedbackLoading(true)
    try {
      const activeToken = effectiveToken || useAuthStore.getState().token
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(activeToken ? { 'x-auth-token': activeToken } : {}),
      }
      const tokenParam = activeToken ? `?token=${encodeURIComponent(activeToken)}` : ''
      const res = await fetch(`/api/manuals/${articleId}/feedback${tokenParam}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ isHelpful: false, suggestionText: suggestionText.trim() }),
      })
      if (!res.ok) throw new Error()
      setSuggestionSubmitted(true)
      setShowSuggestionBox(false)
      toast.success('Sugestão enviada ao Super Admin! Agradecemos a sua colaboração.')
    } catch {
      toast.error('Erro ao enviar a sugestão.')
    } finally {
      setFeedbackLoading(false)
    }
  }

  const isSuperAdmin = user?.role === 'SUPER_ADMIN'

  // Categorias filtradas pelo escopo selecionado (Franqueadora vs Franquia vs Caixa)
  const scopedCategories = useMemo(() => {
    if (activeScope === 'ALL') return categories
    return categories.filter((c) => getCategoryScope(c) === activeScope)
  }, [categories, activeScope])

  // Ajusta automaticamente a categoria selecionada se a atual sair do escopo
  useEffect(() => {
    if (scopedCategories.length > 0) {
      const exists = scopedCategories.some((c) => c.id === selectedCatId)
      if (!exists && !activeArticle) {
        setSelectedCatId(scopedCategories[0].id)
      }
    }
  }, [scopedCategories, selectedCatId, activeArticle])

  // Categoria ativa atual
  const activeCategory = useMemo(() => {
    return categories.find((c) => c.id === selectedCatId) || scopedCategories[0] || null
  }, [categories, selectedCatId, scopedCategories])

  // Artigos pertencentes à categoria ativa
  const categoryArticles = useMemo(() => {
    if (!activeCategory) return []
    return articles.filter((a) => {
      if (a.categoryId !== activeCategory.id) return false
      if (simulatedRole !== 'ALL' && !a.targetRoles.includes(simulatedRole)) return false
      return true
    })
  }, [articles, activeCategory, simulatedRole])

  // Agrupamento de categorias por seção para a barra lateral
  const groupedCategories = useMemo(() => {
    return {
      franchisor: categories.filter((c) => getCategoryScope(c) === 'FRANCHISOR'),
      franchisee: categories.filter((c) => getCategoryScope(c) === 'FRANCHISEE'),
      pos: categories.filter((c) => getCategoryScope(c) === 'POS'),
    }
  }, [categories])

  // Contagens para badges dos botões de escopo
  const scopeCounts = useMemo(() => {
    return {
      ALL: articles.length,
      FRANCHISOR: articles.filter((a) => {
        const cat = categories.find((c) => c.id === a.categoryId)
        return cat && getCategoryScope(cat) === 'FRANCHISOR'
      }).length,
      FRANCHISEE: articles.filter((a) => {
        const cat = categories.find((c) => c.id === a.categoryId)
        return cat && getCategoryScope(cat) === 'FRANCHISEE'
      }).length,
      POS: articles.filter((a) => {
        const cat = categories.find((c) => c.id === a.categoryId)
        return cat && getCategoryScope(cat) === 'POS'
      }).length,
    }
  }, [articles, categories])

  // Navegação entre manuais (Anterior / Próximo)
  const currentArticleIndex = useMemo(() => {
    if (!activeArticle) return -1
    return categoryArticles.findIndex((a) => a.id === activeArticle.id)
  }, [activeArticle, categoryArticles])

  const prevArticle = currentArticleIndex > 0 ? categoryArticles[currentArticleIndex - 1] : null
  const nextArticle =
    currentArticleIndex >= 0 && currentArticleIndex < categoryArticles.length - 1
      ? categoryArticles[currentArticleIndex + 1]
      : null

  // Rota principal da tela atual
  const activeScreenRoute = useMemo(() => {
    if (!activeArticle) return null
    const firstStep = activeArticle.steps?.find((s: any) => s.routePath || s.action_route)
    return firstStep ? (firstStep as any).routePath || (firstStep as any).action_route : null
  }, [activeArticle])

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0b0612] text-foreground font-sans antialiased selection:bg-purple-600 selection:text-white">
      {/* 1. TOPO CORPORATIVO (HEADER) */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#120a1f]/95 backdrop-blur-md border-b border-border px-4 md:px-8 py-3.5 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Logo Oficial & Identidade Canónica (notranslate para evitar 'Açaí da Rosa') */}
          <div className="flex items-center gap-3">
            <img
              src="https://app.acaidarose.pt/logo-oficial-1.png"
              onError={(e) => {
                e.currentTarget.src = '/logo-oficial-1.png'
              }}
              alt="Açaí da Rose"
              className="h-10 w-auto object-contain drop-shadow-xs"
            />
            <div className="notranslate" translate="no">
              <div className="text-base font-black text-foreground tracking-tight leading-none">
                Açaí da Rose
              </div>
              <div className="text-[10.5px] text-purple-700 dark:text-purple-400 font-bold tracking-wider uppercase mt-1">
                Central de Manuais & Ajuda
              </div>
            </div>
          </div>

          {/* Barra de Pesquisa Instantânea em Botões, Cards e Rotas */}
          <div className="relative flex-1 max-w-md mx-auto md:mx-6 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar botões, cards, modais e rotas (/franchise, /pos)..."
              className="pl-9 text-xs rounded-xl h-9 bg-card border-border shadow-2xs"
            />

            {/* Dropdown de Resultados da Busca */}
            {searchQuery.trim().length > 0 && (
              <div className="absolute left-0 right-0 top-11 bg-card border border-border rounded-2xl shadow-xl z-50 p-2 text-xs space-y-1 max-h-80 overflow-y-auto">
                {searchLoading ? (
                  <div className="p-3 text-center text-muted-foreground text-[11px]">
                    Pesquisando nas 29 telas documentadas...
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
                          Em {res.matchedStepTitle}
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
                  <option value="ALL">Todas as Telas (Super Admin)</option>
                  <option value="FRANCHISOR_ADMIN">Franqueadora (Matriz)</option>
                  <option value="TENANT_ADMIN">Franqueados (Lojas)</option>
                  <option value="CASHIER">Caixa & Atendimento</option>
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

            {/* Botão de Retorno à Plataforma Principal */}
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

      {/* 2. SELETOR DE ESCOPO HORIZONTAL (SEGMENTED TABS: FRANQUEADORA vs FRANQUIAS vs CAIXA) */}
      <div className="bg-white dark:bg-[#120a1f] border-b border-border print:hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            {SCOPES.map((scope) => {
              const Icon = scope.icon
              const isSelected = activeScope === scope.id
              const count = scopeCounts[scope.id] || 0

              return (
                <button
                  key={scope.id}
                  type="button"
                  onClick={() => {
                    setActiveScope(scope.id)
                    setActiveArticle(null)
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'bg-muted/40 hover:bg-muted text-foreground border border-border/60'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isSelected ? 'text-white' : 'text-purple-600 dark:text-purple-400'}`} />
                  <span>{scope.title}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                      isSelected
                        ? 'bg-purple-800 text-white'
                        : 'bg-muted text-muted-foreground font-semibold'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* 3. CORPO EM DUAS COLUNAS COM ALTA LEGIbILIDADE (md:col-span-4 + md:col-span-8) */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* COLUNA ESQUERDA: NAVEGAÇÃO HIERÁRQUICA DE CATEGORIAS */}
        <aside className="md:col-span-4 lg:col-span-3 space-y-6 print:hidden">
          <div className="sticky top-32 space-y-5">
            {/* Bloco 1: FRANQUEADORA MASTER */}
            {(activeScope === 'ALL' || activeScope === 'FRANCHISOR') && groupedCategories.franchisor.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-2 text-[11px] font-black tracking-wider text-purple-900 dark:text-purple-300 uppercase">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-purple-700" />
                    <span>Franqueadora Master</span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {groupedCategories.franchisor.reduce((acc, c) => acc + (c.articlesCount || 0), 0)} telas
                  </span>
                </div>

                <nav className="space-y-1">
                  {groupedCategories.franchisor.map((cat) => {
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
                        <span className="truncate pr-1">
                          {cat.title.replace(/^Franqueadora:\s*/i, '')}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md shrink-0 ${
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
            )}

            {/* Bloco 2: FRANQUIAS (LOJAS) */}
            {(activeScope === 'ALL' || activeScope === 'FRANCHISEE') && groupedCategories.franchisee.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-2 text-[11px] font-black tracking-wider text-purple-900 dark:text-purple-300 uppercase">
                  <div className="flex items-center gap-1.5">
                    <Store className="h-3.5 w-3.5 text-purple-700" />
                    <span>Franquias (Lojas)</span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {groupedCategories.franchisee.reduce((acc, c) => acc + (c.articlesCount || 0), 0)} telas
                  </span>
                </div>

                <nav className="space-y-1">
                  {groupedCategories.franchisee.map((cat) => {
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
                        <span className="truncate pr-1">
                          {cat.title.replace(/^Franquias:\s*/i, '')}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md shrink-0 ${
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
            )}

            {/* Bloco 3: OPERAÇÃO & CAIXA */}
            {(activeScope === 'ALL' || activeScope === 'POS') && groupedCategories.pos.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-2 text-[11px] font-black tracking-wider text-purple-900 dark:text-purple-300 uppercase">
                  <div className="flex items-center gap-1.5">
                    <ShoppingBag className="h-3.5 w-3.5 text-purple-700" />
                    <span>Operação & Caixa</span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {groupedCategories.pos.reduce((acc, c) => acc + (c.articlesCount || 0), 0)} telas
                  </span>
                </div>

                <nav className="space-y-1">
                  {groupedCategories.pos.map((cat) => {
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
                        <span className="truncate pr-1">{cat.title}</span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md shrink-0 ${
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
            )}
          </div>
        </aside>

        {/* COLUNA PRINCIPAL: GUIA DA TELA OU LISTAGEM (md:col-span-8 lg:md:col-span-9) */}
        <main className="md:col-span-8 lg:col-span-9">
          {loading ? (
            <div className="py-24 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
              <BookOpen className="h-6 w-6 text-purple-600 animate-pulse" />
              <span>A carregar dicionário de telas e componentes...</span>
            </div>
          ) : activeArticle ? (
            /* ========================================================= */
            /* GUIA COMPLETO DA TELA (SCREEN ANATOMY)                    */
            /* ========================================================= */
            <article className="space-y-8 max-w-3xl">
              {/* Header do Guia da Tela */}
              <div className="space-y-3.5 border-b border-border pb-6">
                <button
                  type="button"
                  onClick={() => setActiveArticle(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 dark:text-purple-400 hover:underline cursor-pointer print:hidden"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Voltar às telas de {activeArticle.categoryTitle || 'Categoria'}</span>
                </button>

                <div className="flex flex-wrap items-center gap-2 pt-1 print:hidden">
                  <Badge variant="outline" className="text-[10.5px] font-bold text-purple-700 border-purple-200">
                    {activeArticle.categoryTitle}
                  </Badge>

                  {activeScreenRoute && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 text-purple-800 dark:text-purple-300 text-[10.5px] font-mono font-bold">
                      <Compass className="h-3 w-3" />
                      Rota: {activeScreenRoute}
                    </span>
                  )}

                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Leitura: {activeArticle.readTimeMinutes || 4} min
                  </span>

                  {activeScreenRoute && (
                    <a
                      href={`https://app.acaidarose.pt/?view=${encodeURIComponent(activeScreenRoute)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-card border border-border hover:bg-muted text-xs font-bold text-foreground transition shadow-2xs cursor-pointer"
                    >
                      <span>Abrir tela no sistema</span>
                      <ExternalLink className="h-3 w-3 text-purple-600" />
                    </a>
                  )}
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

              {/* COMPONENTES MAPEADOS DA TELA (BOTÕES, CARDS, FILTROS, MODAIS, REGRAS) */}
              <div className="space-y-6">
                {activeArticle.steps.map((rawStep, idx) => {
                  const section = normalizeSection(rawStep, idx)

                  return (
                    <section
                      key={section.stepNumber}
                      className="space-y-4 p-5 sm:p-6 rounded-2xl border border-border bg-card shadow-xs break-inside-avoid"
                    >
                      {/* Header da Seção do Componente */}
                      <div className="flex items-start gap-3.5">
                        <div className="space-y-1.5 flex-1">
                          <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
                            <span>{section.title}</span>
                          </h2>

                          {/* Rota Específica caso declarada no bloco */}
                          {section.routePath && section.routePath !== activeScreenRoute && (
                            <div className="flex flex-wrap items-center gap-2 pt-0.5 print:hidden">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 text-purple-800 dark:text-purple-300 text-[10.5px] font-mono font-bold">
                                <Compass className="h-3 w-3" />
                                Rota: {section.routePath}
                              </span>
                            </div>
                          )}

                          {/* Texto Explicativo Detalhado de Cada Elemento da Tela */}
                          {section.instruction && (
                            <div className="text-xs sm:text-sm text-foreground/80 leading-relaxed whitespace-pre-line pt-1">
                              {section.instruction}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* MÍDIA DO COMPONENTE (VÍDEO / GIF / PRINT) */}
                      {section.mediaSource === 'YOUTUBE' && section.youtubeId ? (
                        <div className="relative rounded-2xl overflow-hidden border border-border aspect-video max-w-2xl bg-black">
                          <iframe
                            src={`https://www.youtube-nocookie.com/embed/${section.youtubeId}?rel=0&modestbranding=1&controls=1&playsinline=1`}
                            title={section.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full border-0"
                          />
                        </div>
                      ) : section.mediaUrl ? (
                        <div className="relative group rounded-2xl overflow-hidden border border-border bg-black/5 dark:bg-black/30 max-w-2xl">
                          {section.mediaType === 'VIDEO' ? (
                            <video
                              src={section.mediaUrl}
                              controls
                              muted
                              loop
                              playsInline
                              className="w-full h-auto max-h-[460px] object-contain rounded-xl"
                            />
                          ) : (
                            <div className="relative">
                              <img
                                src={section.mediaUrl}
                                alt={section.title}
                                className="w-full h-auto max-h-[460px] object-contain rounded-xl cursor-zoom-in"
                                onClick={() => setLightboxImg(section.mediaUrl || null)}
                              />
                              <button
                                type="button"
                                onClick={() => setLightboxImg(section.mediaUrl || null)}
                                className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white text-xs opacity-0 group-hover:opacity-100 transition print:hidden cursor-pointer"
                                title="Ampliar imagem"
                              >
                                <Maximize2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      ) : null}

                      {/* CALLOUT (DICA / ATENÇÃO FISCAL / REGRA DA MARCA) */}
                      {section.calloutMessage && (
                        <div
                          className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs leading-relaxed ${
                            section.calloutType === 'ALERT'
                              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 text-amber-900 dark:text-amber-200'
                              : 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 text-purple-900 dark:text-purple-200'
                          }`}
                        >
                          {section.calloutType === 'ALERT' ? (
                            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                          ) : (
                            <Info className="h-4 w-4 shrink-0 text-purple-700 mt-0.5" />
                          )}
                          <span>{section.calloutMessage}</span>
                        </div>
                      )}
                    </section>
                  )
                })}
              </div>

              {/* NAVEGAÇÃO ENTRE TELAS (ANTERIOR / PRÓXIMO) */}
              <div className="pt-6 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-4 print:hidden">
                {prevArticle ? (
                  <button
                    type="button"
                    onClick={() => setActiveArticle(prevArticle)}
                    className="p-4 rounded-xl border border-border bg-card hover:bg-muted text-left transition flex items-center gap-3 cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4 text-purple-700 shrink-0" />
                    <div className="truncate">
                      <div className="text-[10px] text-muted-foreground uppercase font-bold">Tela Anterior</div>
                      <div className="text-xs font-bold text-foreground truncate">{prevArticle.title}</div>
                    </div>
                  </button>
                ) : <div />}

                {nextArticle ? (
                  <button
                    type="button"
                    onClick={() => setActiveArticle(nextArticle)}
                    className="p-4 rounded-xl border border-border bg-card hover:bg-muted text-right transition flex items-center justify-end gap-3 cursor-pointer ml-auto w-full sm:w-auto"
                  >
                    <div className="truncate text-right">
                      <div className="text-[10px] text-muted-foreground uppercase font-bold">Próxima Tela</div>
                      <div className="text-xs font-bold text-foreground truncate">{nextArticle.title}</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-purple-700 shrink-0" />
                  </button>
                ) : null}
              </div>

              {/* RODAPÉ DO GUIA: FEEDBACK INTELIGENTE (SIM / NÃO COM CAIXA DE SUGESTÃO) */}
              <div className="pt-6 border-t border-border space-y-4 print:hidden">
                <div className="p-5 rounded-2xl border border-border bg-card space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-xs text-foreground">
                        Este guia foi útil para compreender todos os recursos desta tela?
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        O seu voto orienta melhorias e gravações de novos vídeos pela Franqueadora.
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={feedbackLoading || (votedArticleId === activeArticle.id && voteChoice === 'YES')}
                        onClick={() => handleVote(activeArticle.id, true)}
                        className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          voteChoice === 'YES'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40'
                            : 'bg-card border-border hover:bg-muted text-foreground'
                        }`}
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                        <span>Sim</span>
                      </button>

                      <button
                        type="button"
                        disabled={feedbackLoading}
                        onClick={() => handleVote(activeArticle.id, false)}
                        className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          voteChoice === 'NO'
                            ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40'
                            : 'bg-card border-border hover:bg-muted text-foreground'
                        }`}
                      >
                        <ThumbsDown className="h-3.5 w-3.5" />
                        <span>Não</span>
                      </button>
                    </div>
                  </div>

                  {/* CAIXA DE SUGESTÃO AUTOMÁTICA AO CLICAR EM "NÃO" */}
                  {showSuggestionBox && !suggestionSubmitted && (
                    <div className="pt-3 border-t border-border space-y-2.5 animate-in fade-in duration-200">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                        <MessageSquarePlus className="h-3.5 w-3.5 text-purple-600" />
                        <span>O que faltou neste guia? Qual botão, card ou processo gostaria de ver explicado?</span>
                      </div>

                      <textarea
                        value={suggestionText}
                        onChange={(e) => setSuggestionText(e.target.value)}
                        placeholder="Ex.: Não ficou claro como o Fundo de Marketing é calculado, ou gostaria de ver um vídeo demonstrando o modal de Nova Franquia..."
                        className="w-full text-xs rounded-xl bg-background border border-border p-3 focus:outline-hidden resize-none h-20 text-foreground"
                      />

                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowSuggestionBox(false)}
                          className="text-xs font-bold rounded-xl h-8 cursor-pointer"
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          disabled={feedbackLoading || !suggestionText.trim()}
                          onClick={() => handleSendSuggestion(activeArticle.id)}
                          className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl h-8 cursor-pointer flex items-center gap-1"
                        >
                          <Send className="h-3 w-3" />
                          <span>Enviar Sugestão</span>
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* MENSAGEM DE AGRADECIMENTO PELA SUGESTÃO */}
                  {suggestionSubmitted && (
                    <div className="pt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Sugestão enviada com sucesso! A Franqueadora irá enriquecer este guia.</span>
                    </div>
                  )}
                </div>

                {/* BOTÃO DE IMPRESSÃO A4 */}
                <div className="flex justify-end">
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
              </div>
            </article>
          ) : (
            /* ========================================================= */
            /* LISTAGEM DE TELAS DA CATEGORIA SELECIONADA                */
            /* ========================================================= */
            <div className="space-y-6">
              {/* Header da Categoria com Distinção de Escopo */}
              <div className="border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300">
                      {activeCategory ? getCategoryScope(activeCategory) === 'FRANCHISOR' ? 'Franqueadora Master' : getCategoryScope(activeCategory) === 'FRANCHISEE' ? 'Franquia (Loja)' : 'Operação de Caixa' : 'Telas do Sistema'}
                    </span>
                    <span className="text-xs text-muted-foreground font-semibold">
                      {categoryArticles.length} telas documentadas
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight mt-1">
                    {activeCategory?.title || 'Telas de Operação'}
                  </h2>
                  {activeCategory?.description && (
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-2xl">
                      {activeCategory.description}
                    </p>
                  )}
                </div>
              </div>

              {categoryArticles.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-border rounded-2xl bg-card space-y-2">
                  <BookOpen className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                  <div className="text-xs font-bold text-foreground">
                    Nenhuma tela cadastrada nesta categoria.
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    O administrador pode adicionar novos guias passo a passo a qualquer momento.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {categoryArticles.map((art) => {
                    const firstStepWithRoute = art.steps?.find((s: any) => s.routePath || s.action_route)
                    const routeBadge = firstStepWithRoute ? (firstStepWithRoute as any).routePath || (firstStepWithRoute as any).action_route : null

                    return (
                      <button
                        key={art.id}
                        type="button"
                        onClick={() => setActiveArticle(art)}
                        className="text-left bg-card border border-border hover:border-purple-400 dark:hover:border-purple-800 rounded-2xl p-5 flex flex-col justify-between transition-all shadow-xs hover:shadow-md space-y-3 cursor-pointer group"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground font-semibold">
                            {routeBadge ? (
                              <span className="text-purple-700 dark:text-purple-400 font-mono font-bold bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800/60 truncate max-w-[150px]">
                                {routeBadge}
                              </span>
                            ) : (
                              <span className="font-mono bg-muted px-2 py-0.5 rounded-md">
                                Guia Completo
                              </span>
                            )}
                            <span>{art.readTimeMinutes || 4} min</span>
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

                        <div className="pt-2 flex items-center justify-between text-xs text-purple-700 dark:text-purple-400 font-bold border-t border-border/40">
                          <span>Ver anatomia da tela</span>
                          <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                        </div>
                      </button>
                    )
                  })}
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
