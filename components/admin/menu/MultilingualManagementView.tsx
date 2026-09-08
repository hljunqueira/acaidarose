'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Globe,
  Save,
  Search,
  Check,
  AlertCircle,
  RefreshCw,
  SlidersHorizontal,
  Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/stores/authStore'
import SurveyTranslationsTab from './SurveyTranslationsTab'

type SectionTab =
  | 'menus'
  | 'categories'
  | 'tacas'
  | 'milkshakes'
  | 'sumos'
  | 'cafes'
  | 'bebidas'
  | 'chocolates'
  | 'snacks'
  | 'highlights'
  | 'surveys'

const SECTION_TABS: { id: SectionTab; label: string }[] = [
  { id: 'menus', label: 'Menus Principais' },
  { id: 'categories', label: 'Categorias' },
  { id: 'tacas', label: 'Taças & Potes Açaí' },
  { id: 'milkshakes', label: 'Milk Shakes' },
  { id: 'sumos', label: 'Sumos de Polpa' },
  { id: 'cafes', label: 'Cafetaria & Quentes' },
  { id: 'bebidas', label: 'Águas & Bebidas' },
  { id: 'chocolates', label: 'Chocolates & Doces' },
  { id: 'snacks', label: 'Lanches & Salgados' },
  { id: 'highlights', label: 'Destaques Oficiais' },
  { id: 'surveys', label: 'Pesquisa de Satisfação' },
]

export default function MultilingualManagementView() {
  const { user, token, authFetch } = useAuthStore()
  const isMaster = user?.role === 'SUPER_ADMIN' || user?.role === 'FRANCHISOR_ADMIN'
  const [catalog, setCatalog] = useState<{ menus: any[]; categories: any[]; containers: any[] }>({
    menus: [],
    categories: [],
    containers: [],
  })

  const [activeTab, setActiveTab] = useState<SectionTab>('menus')
  const [searchTerm, setSearchTerm] = useState('')
  const [highlights, setHighlights] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [languagesConfig, setLanguagesConfig] = useState<any[]>([])
  const [updatingLang, setUpdatingLang] = useState<string | null>(null)

  const fetchLanguagesConfig = async () => {
    try {
      const res = await fetch('/api/translations/languages')
      const data = await res.json()
      if (res.ok && Array.isArray(data.languages)) {
        setLanguagesConfig(data.languages)
      }
    } catch {}
  }

  const toggleLanguageNetwork = async (languageCode: string, currentActive: boolean) => {
    setUpdatingLang(languageCode)
    try {
      const authToken = token || user?.id || ''
      const res = await fetch('/api/translations/languages', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': authToken,
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({
          languageCode,
          isActive: !currentActive,
          applyToAllStores: true,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao alterar ativação do idioma')

      toast.success(
        !currentActive
          ? `Idioma ${languageCode.toUpperCase()} ativado na rede!`
          : `Idioma ${languageCode.toUpperCase()} desativado na rede!`
      )
      await fetchLanguagesConfig()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar idioma')
    } finally {
      setUpdatingLang(null)
    }
  }

  const fetchCatalog = async (storeId = '11111111-1111-1111-1111-111111111111') => {
    setLoading(true)
    try {
      const res = await fetch(`/api/products?tenantId=${encodeURIComponent(storeId)}`)
      if (res.ok) {
        const data = await res.json()
        setCatalog(data)
      }
    } catch {}
    finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCatalog()
    fetchLanguagesConfig()
  }, [])
  const [savingId, setSavingId] = useState<string | null>(null)

  // Buffer de edições locais: { [id]: { nameEn, nameEs, descriptionEn, descriptionEs } }
  const [drafts, setDrafts] = useState<
    Record<
      string,
      {
        nameEn: string
        nameEs: string
        descriptionEn?: string
        descriptionEs?: string
      }
    >
  >({})

  // Carrega destaques caso selecione a aba
  useEffect(() => {
    if (activeTab === 'highlights') {
      fetch('/api/highlights?loja=11111111-1111-1111-1111-111111111111')
        .then((r) => r.json())
        .then((d) => {
          if (Array.isArray(d.highlights)) setHighlights(d.highlights)
        })
        .catch(() => setHighlights([]))
    }
  }, [activeTab])

  // Itens da aba ativa
  const currentItems = useMemo(() => {
    let list: any[] = []

    if (activeTab === 'menus') {
      list = catalog?.menus || []
    } else if (activeTab === 'categories') {
      list = catalog?.categories || []
    } else if (activeTab === 'highlights') {
      list = highlights
    } else {
      const all = catalog?.containers || []
      if (activeTab === 'tacas') {
        list = all.filter((c: any) => c.productType !== 'ITEM' || c.name.toLowerCase().includes('taça') || c.name.toLowerCase().includes('pote'))
      } else if (activeTab === 'milkshakes') {
        list = all.filter((c: any) => c.name.toLowerCase().includes('shake') || c.categoryId === 'cat-milkshakes')
      } else if (activeTab === 'sumos') {
        list = all.filter((c: any) => c.name.toLowerCase().includes('sumo') || c.categoryId === 'cat-sumos-naturais')
      } else if (activeTab === 'cafes') {
        list = all.filter(
          (c: any) =>
            c.name.toLowerCase().includes('café') ||
            c.name.toLowerCase().includes('chá') ||
            c.name.toLowerCase().includes('cappuccino') ||
            c.categoryId === 'cat-cafetaria'
        )
      } else if (activeTab === 'bebidas') {
        list = all.filter(
          (c: any) =>
            c.name.toLowerCase().includes('água') ||
            c.name.toLowerCase().includes('coca') ||
            c.name.toLowerCase().includes('guaraná') ||
            c.categoryId === 'cat-bebidas'
        )
      } else if (activeTab === 'chocolates') {
        list = all.filter(
          (c: any) =>
            c.name.toLowerCase().includes('ouro branco') ||
            c.name.toLowerCase().includes('sonho de valsa') ||
            c.name.toLowerCase().includes('kit kat') ||
            c.categoryId === 'cat-chocolates'
        )
      } else if (activeTab === 'snacks') {
        list = all.filter(
          (c: any) =>
            c.productType === 'ITEM' &&
            !c.name.toLowerCase().includes('shake') &&
            !c.name.toLowerCase().includes('sumo') &&
            !c.name.toLowerCase().includes('café') &&
            !c.name.toLowerCase().includes('água') &&
            !c.name.toLowerCase().includes('coca')
        )
      }
    }

    if (!searchTerm.trim()) return list
    const term = searchTerm.toLowerCase()
    return list.filter((it) => {
      const name = (it.name || it.title || '').toLowerCase()
      const desc = (it.description || it.subtitle || '').toLowerCase()
      return name.includes(term) || desc.includes(term)
    })
  }, [activeTab, catalog, highlights, searchTerm])

  const handleFieldChange = (
    id: string,
    field: 'nameEn' | 'nameEs' | 'descriptionEn' | 'descriptionEs',
    val: string,
    originalItem: any
  ) => {
    setDrafts((prev) => {
      const curr = prev[id] || {
        nameEn: originalItem.nameEn || originalItem.titleEn || '',
        nameEs: originalItem.nameEs || originalItem.titleEs || '',
        descriptionEn: originalItem.descriptionEn || originalItem.subtitleEn || '',
        descriptionEs: originalItem.descriptionEs || originalItem.subtitleEs || '',
      }
      return {
        ...prev,
        [id]: {
          ...curr,
          [field]: val,
        },
      }
    })
  }

  const handleSaveItem = async (item: any) => {
    const draft = drafts[item.id]
    if (!draft) {
      toast.info('Nenhuma alteração pendente neste item.')
      return
    }

    setSavingId(item.id)
    try {
      const entityType =
        activeTab === 'menus'
          ? 'menu'
          : activeTab === 'categories'
          ? 'category'
          : activeTab === 'highlights'
          ? 'story'
          : 'product'

      const res = await fetch('/api/translations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token || user?.id || '',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({
          entityType,
          entityId: item.id,
          nameEn: draft.nameEn,
          nameEs: draft.nameEs,
          descriptionEn: draft.descriptionEn,
          descriptionEs: draft.descriptionEs,
        }),
      })

      if (!res.ok) throw new Error('Falha ao guardar tradução')

      toast.success(`Traduções guardadas com sucesso para "${item.name || item.title}"!`)
      fetchCatalog('11111111-1111-1111-1111-111111111111')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao guardar')
    } finally {
      setSavingId(null)
    }
  }

  if (!isMaster) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 text-center space-y-4 py-20">
        <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Gestão Centralizada de Idiomas
        </h2>
        <p className="text-xs text-slate-500 dark:text-purple-200/70 max-w-md mx-auto">
          As traduções oficiais em Inglês e Espanhol são administradas e replicadas globalmente pela Franqueadora Master para manter o padrão institucional em toda a rede de lojas.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8 space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="h-6 w-6 text-purple-700 dark:text-pink-400" />
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Gestão de Idiomas & Multilinguagem
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-purple-200/70 mt-0.5">
            Governança Master de termos e traduções em Português 🇵🇹, Inglês 🇺🇸 e Espanhol 🇪🇸
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              fetchCatalog('11111111-1111-1111-1111-111111111111')
              fetchLanguagesConfig()
            }}
            className="h-10 rounded-xl text-xs font-bold border-purple-200 dark:border-white/15"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            <span>Atualizar Catálogo</span>
          </Button>
        </div>
      </div>

      {/* PAINEL DE GOVERNANÇA DE IDIOMAS DA REDE (FRANQUEADORA MASTER) */}
      <div className="p-4 rounded-3xl bg-white dark:bg-white/5 border border-purple-100 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-purple-900 dark:text-pink-300">
            Disponibilidade de Idiomas no Menu dos Clientes (Rede)
          </div>
          <p className="text-xs text-slate-500 dark:text-purple-300/80 mt-0.5">
            Ative ou desative seletivamente a opção de tradução em tempo real para os menus de mesa e QR Codes
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* PORTUGUÊS */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-white">
            <span>🇵🇹 Português</span>
            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border-none text-[9px] font-bold">
              Padrão Ativo
            </Badge>
          </div>

          {/* INGLÊS */}
          {(() => {
            const enConfig = languagesConfig.find((l) => l.language_code === 'en')
            const isEnActive = enConfig ? enConfig.is_active : true
            return (
              <button
                type="button"
                onClick={() => toggleLanguageNetwork('en', isEnActive)}
                disabled={updatingLang === 'en'}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border text-xs font-bold cursor-pointer transition ${
                  isEnActive
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700'
                    : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-white/5 dark:text-slate-500 dark:border-white/10'
                }`}
                title={isEnActive ? 'Clique para desativar Inglês na rede' : 'Clique para ativar Inglês na rede'}
              >
                <span>🇺🇸 English</span>
                <span
                  className={`h-2 w-2 rounded-full ${
                    isEnActive ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                />
                <span className="text-[10px] font-medium">
                  {isEnActive ? 'Ativo' : 'Desativado'}
                </span>
              </button>
            )
          })()}

          {/* ESPANHOL */}
          {(() => {
            const esConfig = languagesConfig.find((l) => l.language_code === 'es')
            const isEsActive = esConfig ? esConfig.is_active : true
            return (
              <button
                type="button"
                onClick={() => toggleLanguageNetwork('es', isEsActive)}
                disabled={updatingLang === 'es'}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border text-xs font-bold cursor-pointer transition ${
                  isEsActive
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700'
                    : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-white/5 dark:text-slate-500 dark:border-white/10'
                }`}
                title={isEsActive ? 'Clique para desativar Espanhol na rede' : 'Clique para ativar Espanhol na rede'}
              >
                <span>🇪🇸 Español</span>
                <span
                  className={`h-2 w-2 rounded-full ${
                    isEsActive ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                />
                <span className="text-[10px] font-medium">
                  {isEsActive ? 'Ativo' : 'Desativado'}
                </span>
              </button>
            )
          })()}
        </div>
      </div>

      {/* 11 PILLS DE NAVEGAÇÃO ENTRE SEÇÕES */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar p-1.5 rounded-2xl bg-purple-100/60 dark:bg-white/5 border border-purple-200/70 dark:border-white/10">
        {SECTION_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id)
              setSearchTerm('')
            }}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === tab.id
                ? 'bg-white dark:bg-purple-950 text-purple-950 dark:text-white shadow-sm border border-purple-200/50 dark:border-white/15'
                : 'text-slate-600 dark:text-purple-300/70 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* RENDERIZAÇÃO CONDICIONAL: SEÇÃO DE PESQUISA DE SATISFAÇÃO VS ITENS DO CATÁLOGO */}
      {activeTab === 'surveys' ? (
        <SurveyTranslationsTab />
      ) : (
        <>
          {/* Barra de Busca */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrar por nome em português..."
                className="w-full h-10 pl-8 pr-3 rounded-2xl text-xs bg-white dark:bg-white/5 border border-purple-200 dark:border-white/15 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="text-xs font-bold text-slate-500 dark:text-purple-300">
              {currentItems.length} itens listados
            </div>
          </div>

      {/* Grade de Edição de Traduções */}
      <div className="space-y-3.5">
        {currentItems.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 rounded-3xl bg-white dark:bg-white/5 border border-purple-100 dark:border-white/10">
            Nenhum item encontrado nesta seção.
          </div>
        ) : (
          currentItems.map((item) => {
            const originalName = item.name || item.title || ''
            const originalDesc = item.description || item.subtitle || ''
            const draft = drafts[item.id]

            const valNameEn = draft !== undefined ? draft.nameEn : item.nameEn || item.titleEn || ''
            const valNameEs = draft !== undefined ? draft.nameEs : item.nameEs || item.titleEs || ''
            const valDescEn = draft !== undefined ? draft.descriptionEn ?? '' : item.descriptionEn || item.subtitleEn || ''
            const valDescEs = draft !== undefined ? draft.descriptionEs ?? '' : item.descriptionEs || item.subtitleEs || ''

            const isSaving = savingId === item.id
            const hasChanges = draft !== undefined

            return (
              <div
                key={item.id}
                className="p-5 rounded-3xl bg-white dark:bg-white/5 border border-purple-100 dark:border-white/10 shadow-xs space-y-4"
              >
                {/* Cabeçalho do Item */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-purple-50 dark:border-white/5">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-pink-600 dark:text-pink-400">
                      Item Original (PT) 🇵🇹
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {originalName}
                    </h3>
                    {originalDesc && (
                      <p className="text-xs text-slate-500 dark:text-purple-200/70 mt-0.5 line-clamp-1">
                        {originalDesc}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {hasChanges && (
                      <Badge variant="outline" className="text-[10px] font-bold text-amber-600 border-amber-300">
                        Alteração pendente
                      </Badge>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      disabled={isSaving}
                      onClick={() => handleSaveItem(item)}
                      className="h-9 px-4 rounded-xl text-xs font-bold bg-purple-900 hover:bg-purple-800 text-white flex items-center gap-1.5 shadow-xs"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>{isSaving ? 'A guardar...' : 'Gravar'}</span>
                    </Button>
                  </div>
                </div>

                {/* Linha de Inputs Traduzidos: EN e ES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Bloco Inglês */}
                  <div className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-white/5 border border-purple-100/80 dark:border-white/5 space-y-2">
                    <div className="text-[11px] font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                      <span>🇺🇸</span>
                      <span>Tradução em Inglês (EN)</span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 dark:text-purple-300">Nome:</label>
                      <input
                        type="text"
                        value={valNameEn}
                        onChange={(e) => handleFieldChange(item.id, 'nameEn', e.target.value, item)}
                        placeholder="English name..."
                        className="w-full text-xs px-3 py-2 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-black/30 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 dark:text-purple-300">Descrição:</label>
                      <input
                        type="text"
                        value={valDescEn}
                        onChange={(e) => handleFieldChange(item.id, 'descriptionEn', e.target.value, item)}
                        placeholder="English description..."
                        className="w-full text-xs px-3 py-2 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-black/30 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  {/* Bloco Espanhol */}
                  <div className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-white/5 border border-purple-100/80 dark:border-white/5 space-y-2">
                    <div className="text-[11px] font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                      <span>🇪🇸</span>
                      <span>Tradução em Espanhol (ES)</span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 dark:text-purple-300">Nome:</label>
                      <input
                        type="text"
                        value={valNameEs}
                        onChange={(e) => handleFieldChange(item.id, 'nameEs', e.target.value, item)}
                        placeholder="Nombre en español..."
                        className="w-full text-xs px-3 py-2 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-black/30 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 dark:text-purple-300">Descrição:</label>
                      <input
                        type="text"
                        value={valDescEs}
                        onChange={(e) => handleFieldChange(item.id, 'descriptionEs', e.target.value, item)}
                        placeholder="Descripción en español..."
                        className="w-full text-xs px-3 py-2 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-black/30 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
      </>
      )}
    </div>
  )
}
