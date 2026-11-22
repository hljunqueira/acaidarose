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
  HelpCircle,
} from 'lucide-react'

// Escopos estruturais para segmentação por perfil
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
function getCategoryScope(cat: ManualCategory): 'FRANCHISOR' | 'FRANCHISEE' | 'POS' | 'SHARED' {
  const s = (cat.slug || '').toLowerCase()
  if (s.includes('franqueadora-master')) return 'FRANCHISOR'
  if (s.includes('operacao-e-atendimento')) return 'POS'
  return 'SHARED'
}

// Moldura de Janela de Navegador / SO com Reprodução em HTML da Tela & Botões
interface ScreenWindowFrameProps {
  title: string
  routePath: string | null
  mediaUrl: string | null
  mediaType: string | null
  youtubeId: string | null
  instruction: string
  onOpenLightbox?: (url: string) => void
}

function ScreenWindowFrame({
  title,
  routePath,
  mediaUrl,
  mediaType,
  youtubeId,
  instruction,
  onOpenLightbox,
}: ScreenWindowFrameProps) {
  // Extrai botões descritos na instrução (linhas no formato • [ Nome do Botão ]: ...)
  const buttonMatches: string[] = []
  if (instruction) {
    const lines = instruction.split('\n')
    for (const line of lines) {
      const match = line.match(/^\s*•\s*\[\s*([^\]]+)\s*\]\s*:/)
      if (match && match[1]) {
        buttonMatches.push(match[1].trim())
      }
    }
  }

  const hasRealMedia = Boolean(youtubeId || mediaUrl)

  return (
    <div className="rounded-2xl border border-slate-300/80 dark:border-white/10 shadow-md overflow-hidden bg-slate-900 text-slate-100 my-4">
      {/* Moldura Superior (Barra de Janela de Navegador / SO) */}
      <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-3">
        {/* Controles de Janela Mac-Style */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]" />
          <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]" />
        </div>

        {/* Barra de Endereço / Título da Rota */}
        <div className="px-3.5 py-1 rounded-full bg-slate-900 border border-slate-700/60 text-[11px] font-mono text-purple-300 flex items-center gap-1.5 shadow-inner max-w-sm sm:max-w-md truncate">
          <span className="text-emerald-400 font-bold">🔒</span>
          <span className="text-slate-400">app.acaidarose.pt</span>
          {routePath && <span className="text-purple-300 font-bold">{routePath}</span>}
        </div>

        {/* Badge da Interface */}
        <div className="shrink-0 text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:block">
          {hasRealMedia ? 'Captura Oficial' : 'Mockup da Tela'}
        </div>
      </div>

      {/* Conteúdo da Janela */}
      <div className="p-4 sm:p-5 bg-gradient-to-b from-slate-900 via-slate-900 to-[#170c26]">
        {youtubeId ? (
          <div className="relative rounded-xl overflow-hidden aspect-video bg-black">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1&controls=1&playsinline=1`}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>
        ) : mediaUrl ? (
          <div className="relative group rounded-xl overflow-hidden bg-black/40">
            {mediaType === 'VIDEO' ? (
              <video
                src={mediaUrl}
                controls
                muted
                loop
                playsInline
                className="w-full h-auto max-h-[460px] object-contain rounded-lg"
              />
            ) : (
              <div className="relative">
                <img
                  src={mediaUrl}
                  alt={title}
                  className="w-full h-auto max-h-[460px] object-contain rounded-lg cursor-zoom-in"
                  onClick={() => onOpenLightbox?.(mediaUrl)}
                />
                <button
                  type="button"
                  onClick={() => onOpenLightbox?.(mediaUrl)}
                  className="absolute top-3 right-3 p-2 rounded-xl bg-black/70 hover:bg-black/90 text-white text-xs opacity-0 group-hover:opacity-100 transition cursor-pointer"
                  title="Ampliar imagem"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          /* MOCKUP INTERATIVO EM HTML NATIVO DA TELA */
          <div className="space-y-4">
            {/* Barra de Ações Simulada com os Botões Reais */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-purple-500 animate-pulse" />
                <span className="text-xs font-bold text-white tracking-tight">{title}</span>
              </div>

              {/* Botões Mapeados na Barra da Tela */}
              {buttonMatches.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {buttonMatches.map((btn, bIdx) => {
                    const isPrimary =
                      btn.toLowerCase().includes('nova') ||
                      btn.toLowerCase().includes('novo') ||
                      btn.toLowerCase().includes('criar') ||
                      btn.toLowerCase().includes('guardar') ||
                      btn.toLowerCase().includes('adicionar') ||
                      btn.toLowerCase().includes('confirmar')

                    return (
                      <span
                        key={bIdx}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black shadow-xs tracking-tight transition ${
                          isPrimary
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white ring-1 ring-white/20'
                            : 'bg-slate-800/90 text-purple-200 border border-purple-500/30'
                        }`}
                      >
                        <span className="h-4 w-4 rounded-full bg-black/40 text-white text-[10px] font-mono flex items-center justify-center font-bold">
                          {bIdx + 1}
                        </span>
                        <span>[ {btn} ]</span>
                      </span>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Simulação Visual do Ecrã */}
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-semibold">Área de Visualização do Sistema</span>
                <span className="text-emerald-400 font-mono">Status: Operacional</span>
              </div>

              {/* Grid de simulação visual (3 cards rápidos de pré-visualização) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-left space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Estrutura Canónica</div>
                  <div className="text-xs font-bold text-white">PostgreSQL 16 Multi-Tenant</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-left space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Segurança & RBAC</div>
                  <div className="text-xs font-bold text-emerald-400">Permissão Verificada</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-left space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Padrão da Rede</div>
                  <div className="text-xs font-bold text-purple-300">Açaí da Rose • Portugal</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Renderizador visual estilo Goomer para botões, cards, passos e explicações
function FormattedInstruction({ text }: { text: string }) {
  if (!text) return null

  const paragraphs = text.split('\n\n')
  let buttonCount = 0

  return (
    <div className="space-y-4 text-xs sm:text-sm text-foreground/85 leading-relaxed">
      {paragraphs.map((para, pIdx) => {
        const lines = para.split('\n')

        // 1. Detecta itens de botão: • [ Nome do Botão ]: Explicação
        const hasButtonItems = lines.some((l) => /^\s*•\s*\[\s*([^\]]+)\s*\]\s*:\s*(.+)/.test(l))

        if (hasButtonItems) {
          return (
            <div key={pIdx} className="space-y-2.5 my-2">
              {lines.map((line, lIdx) => {
                const matchBtn = line.match(/^\s*•\s*\[\s*([^\]]+)\s*\]\s*:\s*(.+)/)
                if (matchBtn) {
                  buttonCount++
                  const currentBtnIndex = buttonCount
                  const [, btnLabel, btnDesc] = matchBtn
                  return (
                    <div
                      key={lIdx}
                      className="p-3.5 rounded-xl border border-border/80 bg-background/80 hover:border-purple-300 dark:hover:border-purple-800 transition flex flex-col sm:flex-row sm:items-start gap-3 shadow-2xs"
                    >
                      <div className="shrink-0 pt-0.5 flex items-center gap-2">
                        <span className="h-5 w-5 rounded-full bg-purple-700 text-white text-[10px] font-black flex items-center justify-center shrink-0 shadow-2xs">
                          {currentBtnIndex}
                        </span>
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-100 dark:bg-purple-950/70 border border-purple-300 dark:border-purple-800 text-purple-900 dark:text-purple-200 text-xs font-black shadow-xs tracking-tight">
                          <span>[ {btnLabel} ]</span>
                        </span>
                      </div>
                      <div className="text-xs sm:text-[13px] text-foreground/90 leading-relaxed pt-0.5">
                        {btnDesc}
                      </div>
                    </div>
                  )
                }

                if (line.trim().startsWith('•')) {
                  return (
                    <div key={lIdx} className="flex items-start gap-2 text-xs sm:text-[13px] text-foreground/90 pl-1">
                      <span className="text-purple-600 font-bold shrink-0 mt-0.5">•</span>
                      <span>{line.replace(/^\s*•\s*/, '')}</span>
                    </div>
                  )
                }

                return (
                  <p key={lIdx} className="text-xs sm:text-[13px] text-foreground/90 font-medium">
                    {line}
                  </p>
                )
              })}
            </div>
          )
        }

        // 2. Detecta passos numerados (1. ... 2. ...)
        const hasNumberedSteps = lines.some((l) => /^\s*\d+\.\s*(.+)/.test(l))
        if (hasNumberedSteps) {
          return (
            <div key={pIdx} className="space-y-3 my-2">
              {lines.map((line, lIdx) => {
                const matchNum = line.match(/^\s*(\d+)\.\s*(.+)/)
                if (matchNum) {
                  const [, stepNum, stepContent] = matchNum
                  return (
                    <div
                      key={lIdx}
                      className="p-3.5 rounded-xl border border-border/70 bg-background/60 flex items-start gap-3 shadow-2xs"
                    >
                      <span className="h-6 w-6 rounded-full bg-purple-700 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                        {stepNum}
                      </span>
                      <div className="text-xs sm:text-[13px] text-foreground/90 leading-relaxed pt-0.5">
                        {stepContent}
                      </div>
                    </div>
                  )
                }

                if (line.trim().startsWith('•')) {
                  return (
                    <div key={lIdx} className="flex items-start gap-2 text-xs sm:text-[13px] text-foreground/90 pl-4">
                      <span className="text-purple-600 font-bold shrink-0 mt-0.5">•</span>
                      <span>{line.replace(/^\s*•\s*/, '')}</span>
                    </div>
                  )
                }

                return (
                  <p key={lIdx} className="text-xs sm:text-[13px] text-foreground/90 font-medium">
                    {line}
                  </p>
                )
              })}
            </div>
          )
        }

        // 3. Parágrafo padrão com suporte a marcadores
        return (
          <div key={pIdx} className="space-y-1.5">
            {lines.map((line, lIdx) => {
              if (line.trim().startsWith('•')) {
                return (
                  <div key={lIdx} className="flex items-start gap-2 text-xs sm:text-[13px] text-foreground/90 pl-1">
                    <span className="text-purple-600 font-bold shrink-0 mt-0.5">•</span>
                    <span>{line.replace(/^\s*•\s*/, '')}</span>
                  </div>
                )
              }
              return (
                <p key={lIdx} className="text-xs sm:text-[13px] text-foreground/90 leading-relaxed">
                  {line}
                </p>
              )
            })}
          </div>
        )
      })}
    </div>
  )
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

  // Inicialização de Auth com resiliência a subdomínio: URL toma SEMPRE precedência sobre token antigo
  useEffect(() => {
    let cand: string | null = null
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const urlToken = urlParams.get('token')
      if (urlToken) {
        cand = urlToken
      }
    }
    if (!cand) {
      cand = token
    }
    if (!cand && typeof window !== 'undefined') {
      const match = document.cookie.match(/(?:^|;\s*)x-auth-token=([^;]+)/)
      if (match) cand = match[1]
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
      }
      if (Array.isArray(artsData.articles)) {
        setArticles(artsData.articles)
      }
    } catch {
      toast.error('Erro ao carregar manuais de ajuda.')
    } finally {
      setLoading(false)
    }
  }, [user?.role, simulatedRole, effectiveToken])

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
        }
      } catch {
        toast.error('Erro ao abrir tela selecionada.')
      }
    }
  }

  // Voto de Feedback (Sim / Não)
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
        toast.success('Obrigado! O seu voto foi registrado.')
      } catch {
        toast.error('Não foi possível registrar o feedback.')
      } finally {
        setFeedbackLoading(false)
      }
    } else {
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
      toast.success('Sugestão enviada com sucesso!')
    } catch {
      toast.error('Erro ao enviar a sugestão.')
    } finally {
      setFeedbackLoading(false)
    }
  }

  const isSuperAdmin = user?.role === 'SUPER_ADMIN'

  // Perfil efetivo com suporte a simulação de papéis pelo Super Admin
  const currentEffectiveRole: UserRole =
    isSuperAdmin && simulatedRole !== 'ALL'
      ? simulatedRole
      : user?.role || 'CASHIER'

  // 1. Filtro estrito de permissões (RBAC): Gerentes e Caixas NUNCA veem Franqueadora Master
  const roleAllowedCategories = useMemo(() => {
    return categories.filter((c) => {
      if (currentEffectiveRole === 'SUPER_ADMIN' || currentEffectiveRole === 'FRANCHISOR_ADMIN') {
        return true
      }
      if (currentEffectiveRole === 'TENANT_ADMIN') {
        if (c.slug.includes('franqueadora-master')) return false
        return c.targetRoles.includes('TENANT_ADMIN')
      }
      if (currentEffectiveRole === 'CASHIER') {
        return c.targetRoles.includes('CASHIER')
      }
      return false
    })
  }, [categories, currentEffectiveRole])

  // 2. Filtro adicional pelo seletor de escopo (Todas as Telas vs Franqueadora vs Franquias vs Caixa)
  const scopedCategories = useMemo(() => {
    if (activeScope === 'ALL') return roleAllowedCategories
    if (activeScope === 'FRANCHISOR') {
      return roleAllowedCategories.filter((c) => c.slug.includes('franqueadora-master'))
    }
    if (activeScope === 'FRANCHISEE') {
      return roleAllowedCategories.filter((c) => !c.slug.includes('franqueadora-master'))
    }
    if (activeScope === 'POS') {
      return roleAllowedCategories.filter((c) => c.slug.includes('operacao') || c.slug.includes('estoque'))
    }
    return roleAllowedCategories
  }, [roleAllowedCategories, activeScope])

  // Mantém categorias recolhidas por padrão, abrindo apenas sob clique do usuário
  useEffect(() => {
    if (scopedCategories.length > 0 && selectedCatId) {
      const exists = scopedCategories.some((c) => c.id === selectedCatId)
      if (!exists && !activeArticle) {
        setSelectedCatId(null)
      }
    }
  }, [scopedCategories, selectedCatId, activeArticle])

  // Categoria ativa atual (apenas se o usuário tiver clicado e aberto)
  const activeCategory = useMemo(() => {
    return selectedCatId ? scopedCategories.find((c) => c.id === selectedCatId) || null : null
  }, [scopedCategories, selectedCatId])

  // Artigos pertencentes à categoria ativa (respeitando o papel efetivo do usuário)
  const categoryArticles = useMemo(() => {
    if (!activeCategory) return []
    return articles.filter((a) => {
      if (a.categoryId !== activeCategory.id) return false
      if (currentEffectiveRole !== 'SUPER_ADMIN') {
        if (!a.targetRoles.includes(currentEffectiveRole)) return false
      }
      return true
    })
  }, [articles, activeCategory, currentEffectiveRole])

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
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0b0612] text-foreground font-sans antialiased selection:bg-purple-600 selection:text-white flex flex-col justify-between">
      <div>
        {/* 1. TOPO CORPORATIVO (HEADER ESTILO GOOMER) */}
        <header className="sticky top-0 z-30 bg-white dark:bg-[#120a1f] border-b border-border px-4 md:px-8 py-3.5 print:hidden">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            {/* Logo Oficial & Identidade Canónica */}
            <button
              type="button"
              onClick={() => {
                setActiveArticle(null)
                setSearchQuery('')
              }}
              className="flex items-center gap-3 text-left cursor-pointer group"
            >
              <img
                src="/logo-oficial-1.png"
                onError={(e) => {
                  e.currentTarget.src = 'https://app.acaidarose.pt/logo-oficial-1.png'
                }}
                alt="Açaí da Rose"
                className="h-9 md:h-10 w-auto object-contain drop-shadow-xs group-hover:opacity-90 transition-opacity"
              />
              <div className="notranslate" translate="no">
                <div className="text-base font-black text-foreground tracking-tight leading-none">
                  Açaí da Rose
                </div>
                <div className="text-[10px] text-purple-700 dark:text-purple-400 font-bold tracking-wider uppercase mt-1">
                  Central de Ajuda
                </div>
              </div>
            </button>

            {/* Ações da Direita: Seletor de Perfil, Usuário e Botão Plataforma */}
            <div className="flex items-center gap-3 text-xs">
              {/* Seletor de Visão de Perfil (Franqueadora vs Franquias vs Caixa) */}
              <div className="hidden sm:flex items-center gap-1.5 bg-muted/60 px-2 py-1.5 rounded-xl border border-border">
                <span className="text-[10.5px] text-muted-foreground font-bold">Visão:</span>
                <select
                  value={activeScope}
                  onChange={(e) => {
                    setActiveScope(e.target.value as any)
                    setActiveArticle(null)
                  }}
                  className="bg-transparent text-[11px] font-bold text-foreground focus:outline-hidden cursor-pointer"
                >
                  <option value="ALL">Todas as Telas</option>
                  <option value="FRANCHISOR">Franqueadora Master</option>
                  <option value="FRANCHISEE">Franquias (Lojas)</option>
                  <option value="POS">Operação de Caixa</option>
                </select>
              </div>

              {/* Auditoria Super Admin */}
              {isSuperAdmin && (
                <div className="hidden lg:flex items-center gap-1.5 bg-purple-50 dark:bg-purple-950/40 px-2 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800">
                  <span className="text-[10px] text-purple-700 dark:text-purple-300 font-bold">Auditar como:</span>
                  <select
                    value={simulatedRole}
                    onChange={(e) => setSimulatedRole(e.target.value as any)}
                    className="bg-transparent text-[10.5px] font-bold text-purple-900 dark:text-purple-200 focus:outline-hidden cursor-pointer"
                  >
                    <option value="ALL">Super Admin (Tudo)</option>
                    <option value="FRANCHISOR_ADMIN">Franqueadora</option>
                    <option value="TENANT_ADMIN">Franqueados</option>
                    <option value="CASHIER">Caixas</option>
                  </select>
                </div>
              )}

              {/* Identificação do Usuário */}
              {user && (
                <div className="hidden md:block text-right">
                  <div className="font-bold text-foreground leading-none">{user.name}</div>
                  <div className="text-[10px] text-muted-foreground uppercase font-semibold mt-0.5">
                    {user.role}
                  </div>
                </div>
              )}

              {/* Botão Plataforma */}
              <a
                href="https://app.acaidarose.pt"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <span>Plataforma</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </header>

        {/* 2. HERO SEARCH BANNER (GRADIENTE VIBRANTE ESTILO GOOMER) */}
        <section className="bg-gradient-to-r from-[#20053B] via-[#4A154B] to-[#5C1675] text-white py-12 px-4 md:px-8 shadow-md print:hidden">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Como podemos ajudá-lo?
            </h1>
            <p className="text-xs sm:text-sm text-purple-200/90 max-w-xl mx-auto leading-relaxed">
              Consulte o funcionamento de cada tela, botão, regra de recipientes e processo operacional da rede Açaí da Rose.
            </p>

            {/* Barra de Pesquisa Centralizada no Hero */}
            <div className="relative max-w-xl mx-auto pt-2">
              <div className="relative">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Procurar por respostas, telas, botões ou rotas (/pos, /menu)..."
                  className="w-full h-12 pl-5 pr-12 text-sm bg-white text-slate-900 placeholder:text-slate-400 rounded-full border-0 shadow-lg focus-visible:ring-2 focus-visible:ring-purple-400"
                />
                <div className="absolute right-4 top-3.5 text-slate-500">
                  <Search className="h-5 w-5" />
                </div>
              </div>

              {/* Dropdown de Resultados da Busca Instantânea */}
              {searchQuery.trim().length > 0 && (
                <div className="absolute left-0 right-0 top-16 bg-white dark:bg-[#180d29] border border-border rounded-2xl shadow-2xl z-50 p-2 text-xs space-y-1 max-h-80 overflow-y-auto text-left">
                  {searchLoading ? (
                    <div className="p-4 text-center text-muted-foreground text-xs">
                      Pesquisando respostas...
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-xs">
                      Nenhum resultado encontrado para &quot;{searchQuery}&quot;.
                    </div>
                  ) : (
                    searchResults.map((res: any) => (
                      <button
                        key={res.id}
                        type="button"
                        onClick={() => handleSelectFromSearch(res.id)}
                        className="w-full text-left p-3 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/40 transition cursor-pointer flex flex-col gap-0.5 border-b border-border/40 last:border-b-0"
                      >
                        <div className="font-bold text-foreground text-xs sm:text-sm flex items-center justify-between">
                          <span>{res.title}</span>
                          <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase">
                            {res.categoryTitle}
                          </span>
                        </div>
                        {res.summary && (
                          <div className="text-[11px] text-muted-foreground line-clamp-1">
                            {res.summary}
                          </div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 3. BREADCRUMBS BAR (ESTILO GOOMER) */}
        <div className="bg-slate-50 dark:bg-[#120a1f]/60 border-b border-border/70 py-2.5 px-4 md:px-8 text-xs text-muted-foreground print:hidden">
          <div className="max-w-7xl mx-auto flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setActiveArticle(null)
                setSearchQuery('')
              }}
              className="hover:text-purple-700 dark:hover:text-purple-400 font-semibold cursor-pointer transition"
            >
              Central de Ajuda
            </button>

            {activeCategory && (
              <>
                <span>&gt;</span>
                <button
                  type="button"
                  onClick={() => setActiveArticle(null)}
                  className={`hover:text-purple-700 dark:hover:text-purple-400 font-semibold cursor-pointer transition ${
                    !activeArticle ? 'text-foreground font-bold' : ''
                  }`}
                >
                  {activeCategory.title}
                </button>
              </>
            )}

            {activeArticle && (
              <>
                <span>&gt;</span>
                <span className="text-foreground font-bold truncate max-w-xs sm:max-w-md">
                  {activeArticle.title}
                </span>
              </>
            )}
          </div>
        </div>

        {/* 4. CORPO PRINCIPAL EM 2 COLUNAS (SIDEBAR ACCORDION + CONTEÚDO GOOMER) */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* COLUNA ESQUERDA: NAVEGAÇÃO DE CATEGORIAS COM SUB-ITENS EXPANDIDOS (ACCORDION GOOMER) */}
          <aside className="md:col-span-4 lg:col-span-3 space-y-4 print:hidden">
            <div className="sticky top-24 space-y-1 bg-white dark:bg-[#120a1f] p-3 rounded-2xl border border-border shadow-xs">
              <div className="text-[11px] font-black uppercase tracking-wider text-muted-foreground px-3 py-2 border-b border-border/60 mb-2">
                Categorias de Ajuda
              </div>

              {scopedCategories.map((cat) => {
                const isCatActive = selectedCatId === cat.id
                const catArticles = articles.filter((a) => a.categoryId === cat.id)

                return (
                  <div key={cat.id} className="rounded-xl overflow-hidden transition-all">
                    {/* Botão da Categoria (Toggle Expande/Recolhe) */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCatId((prev) => (prev === cat.id ? null : cat.id))
                        if (activeArticle?.categoryId !== cat.id) {
                          setActiveArticle(null)
                        }
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                        isCatActive
                          ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 border-l-4 border-purple-700 font-black'
                          : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      <span className="truncate pr-2 font-bold">
                        {cat.title}
                      </span>
                      <ChevronRight
                        className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                          isCatActive ? 'transform rotate-90 text-purple-700' : 'text-muted-foreground'
                        }`}
                      />
                    </button>

                    {/* Sub-itens da Categoria Ativa (Accordion Aberto Estilo Goomer) */}
                    {isCatActive && catArticles.length > 0 && (
                      <div className="pl-3 pr-1 py-1.5 space-y-1 bg-purple-50/40 dark:bg-purple-950/20 border-l-2 border-purple-200 dark:border-purple-800 ml-3 my-1 rounded-r-lg">
                        {catArticles.map((art) => {
                          const isArtActive = activeArticle?.id === art.id
                          return (
                            <button
                              key={art.id}
                              type="button"
                              onClick={() => setActiveArticle(art)}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11.5px] transition flex items-center gap-2 cursor-pointer ${
                                isArtActive
                                  ? 'font-black text-purple-800 dark:text-purple-300 bg-purple-100/70 dark:bg-purple-900/40'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                                  isArtActive ? 'bg-purple-700' : 'bg-muted-foreground/40'
                                }`}
                              />
                              <span className="truncate">{art.title}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </aside>

          {/* COLUNA DIREITA: CONTEÚDO PRINCIPAL (ARTIGO OU VISÃO GERAL DA CATEGORIA) */}
          <main className="md:col-span-8 lg:col-span-9">
            {loading ? (
              <div className="py-24 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                <BookOpen className="h-6 w-6 text-purple-600 animate-pulse" />
                <span>A carregar conteúdos da Central de Ajuda...</span>
              </div>
            ) : activeArticle ? (
              /* ========================================================= */
              /* VISUALIZAÇÃO DE ARTIGO / MANUAL (ESTILO GOOMER)          */
              /* ========================================================= */
              <article className="space-y-8 max-w-3xl">
                {/* Header do Artigo */}
                <div className="space-y-3.5 border-b border-border pb-6">
                  <button
                    type="button"
                    onClick={() => setActiveArticle(null)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 dark:text-purple-400 hover:underline cursor-pointer print:hidden"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Voltar à categoria {activeArticle.categoryTitle || ''}</span>
                  </button>

                  <div className="flex flex-wrap items-center gap-2 pt-1 print:hidden">
                    <Badge variant="outline" className="text-[10.5px] font-bold text-purple-700 border-purple-200">
                      {activeArticle.categoryTitle}
                    </Badge>

                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Leitura: {activeArticle.readTimeMinutes || 4} min
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight leading-tight">
                    {activeArticle.title}
                  </h1>

                  {activeArticle.summary && (
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-normal">
                      {activeArticle.summary}
                    </p>
                  )}
                </div>

                {/* Seções do Artigo (Renderização Visual Estilo Goomer) */}
                <div className="space-y-8">
                  {activeArticle.steps.map((rawStep, idx) => {
                    const section = normalizeSection(rawStep, idx)

                    return (
                      <section
                        key={section.stepNumber}
                        className="space-y-4 p-5 sm:p-6 rounded-2xl border border-border bg-card shadow-xs break-inside-avoid"
                      >
                        {/* Título da Seção */}
                        <div className="space-y-1.5">
                          <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                            {section.title}
                          </h2>
                        </div>

                        {/* Callout / Dica / Alerta no Topo da Seção se Houver */}
                        {section.calloutMessage && (
                          <div
                            className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs sm:text-[13px] leading-relaxed ${
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

                        {/* Moldura de Janela de Navegador / SO (Mockup HTML dos Botões & Tela ou Mídia) */}
                        <ScreenWindowFrame
                          title={section.title}
                          routePath={section.routePath || activeScreenRoute}
                          mediaUrl={section.mediaUrl}
                          mediaType={section.mediaType}
                          youtubeId={section.youtubeId}
                          instruction={section.instruction}
                          onOpenLightbox={(url) => setLightboxImg(url)}
                        />

                        {/* Raio-X Detalhado de Botões & Instruções da Seção */}
                        {section.instruction && (
                          <div className="pt-2">
                            <FormattedInstruction text={section.instruction} />
                          </div>
                        )}
                      </section>
                    )
                  })}
                </div>

                {/* Navegação Entre Telas (Anterior / Próximo) */}
                <div className="pt-6 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-4 print:hidden">
                  {prevArticle ? (
                    <button
                      type="button"
                      onClick={() => setActiveArticle(prevArticle)}
                      className="p-4 rounded-xl border border-border bg-card hover:bg-muted text-left transition flex items-center gap-3 cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4 text-purple-700 shrink-0" />
                      <div className="truncate">
                        <div className="text-[10px] text-muted-foreground uppercase font-bold">Guia Anterior</div>
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
                        <div className="text-[10px] text-muted-foreground uppercase font-bold">Próximo Guia</div>
                        <div className="text-xs font-bold text-foreground truncate">{nextArticle.title}</div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-purple-700 shrink-0" />
                    </button>
                  ) : null}
                </div>

                {/* FEEDBACK WIDGET (ESTILO GOOMER: "ESSE ARTIGO FOI ÚTIL?") */}
                <div className="pt-6 border-t border-border space-y-4 print:hidden">
                  <div className="p-5 rounded-2xl border border-border bg-card space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-foreground">
                          Esse artigo foi útil?
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          O seu feedback ajuda a aprimorar as instruções operacionais da rede.
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={feedbackLoading || (votedArticleId === activeArticle.id && voteChoice === 'YES')}
                          onClick={() => handleVote(activeArticle.id, true)}
                          className={`px-4 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
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
                          className={`px-4 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
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

                    {/* Caixa de Sugestão Expandida ao Clicar em "Não" */}
                    {showSuggestionBox && !suggestionSubmitted && (
                      <div className="pt-3 border-t border-border space-y-2.5 animate-in fade-in duration-200">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                          <MessageSquarePlus className="h-3.5 w-3.5 text-purple-600" />
                          <span>O que podemos melhorar neste guia?</span>
                        </div>

                        <textarea
                          value={suggestionText}
                          onChange={(e) => setSuggestionText(e.target.value)}
                          placeholder="Conte-nos o que ficou confuso ou qual botão/processo precisa de uma explicação mais detalhada..."
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

                    {suggestionSubmitted && (
                      <div className="pt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Sugestão enviada com sucesso! A equipa irá enriquecer este guia.</span>
                      </div>
                    )}
                  </div>

                  {/* Botão de Impressão A4 */}
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
            ) : !activeCategory ? (
              /* ESTADO INICIAL RECOLHIDO: CONVITE PARA SELECIONAR UMA CATEGORIA */
              <div className="py-20 px-6 text-center border border-dashed border-border rounded-3xl bg-card/50 space-y-3 max-w-lg mx-auto my-8">
                <div className="h-12 w-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center mx-auto">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h3 className="text-base font-black text-foreground tracking-tight">
                  Selecione uma categoria de ajuda ao lado
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Clique em qualquer categoria no menu lateral para expandir os tópicos e consultar os manuais e o funcionamento detalhado de cada tela.
                </p>
              </div>
            ) : (
              /* ========================================================= */
              /* LISTAGEM DE TELAS DA CATEGORIA SELECIONADA (VISÃO GERAL) */
              /* ========================================================= */
              <div className="space-y-6">
                {/* Header da Categoria */}
                <div className="border-b border-border pb-4 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300">
                      {activeCategory ? activeCategory.title : 'Ajuda'}
                    </span>
                    <span className="text-xs text-muted-foreground font-semibold">
                      {categoryArticles.length} guias disponíveis
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                    {activeCategory?.title || 'Guias Operacionais'}
                  </h2>

                  {activeCategory?.description && (
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
                      {activeCategory.description}
                    </p>
                  )}
                </div>

                {/* Grid de Guias da Categoria */}
                {categoryArticles.length === 0 ? (
                  <div className="p-12 text-center border border-dashed border-border rounded-2xl bg-card space-y-2">
                    <BookOpen className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                    <div className="text-xs font-bold text-foreground">
                      Nenhum guia cadastrado nesta categoria.
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
                                  Guia Geral
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
                            <span>Ver passo a passo</span>
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
      </div>

      {/* 5. RODAPÉ INSTITUCIONAL (ESTILO GOOMER) */}
      <footer className="bg-white dark:bg-[#120a1f] border-t border-border py-8 px-4 md:px-8 mt-16 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo-oficial-1.png"
              onError={(e) => {
                e.currentTarget.src = 'https://app.acaidarose.pt/logo-oficial-1.png'
              }}
              alt="Açaí da Rose"
              className="h-6 w-auto object-contain"
            />
            <span className="font-bold text-foreground">Açaí da Rose</span>
            <span>— Central de Manuais & Ajuda</span>
          </div>

          <div className="flex items-center gap-4">
            <a href="https://app.acaidarose.pt" className="hover:text-purple-700 dark:hover:text-purple-400 transition font-medium">
              Plataforma
            </a>
            <a href="https://acaidarose.pt" target="_blank" rel="noopener noreferrer" className="hover:text-purple-700 dark:hover:text-purple-400 transition font-medium">
              Site Oficial
            </a>
            <span>•</span>
            <span>© 2026 Todos os direitos reservados.</span>
          </div>
        </div>
      </footer>

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
