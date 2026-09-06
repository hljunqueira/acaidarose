'use client'

import React, { useMemo, useState } from 'react'
import { CatalogData, ProductContainer } from '@/types'
import { formatCurrency } from '@/lib/i18n/formatters'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import CustomerPromoCarousel from '@/components/menu/CustomerPromoCarousel'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguageStore } from '@/lib/stores/languageStore'
import CustomerItemDetailModal from '@/components/menu/CustomerItemDetailModal'

interface CustomerMenuHomeProps {
  catalog: CatalogData
  tenantId?: string
  onSelectContainer: (c: ProductContainer) => void
  onAddToCart?: (item: any) => void
  isTable?: boolean
  isCatalogOnly?: boolean
}

const CUP_IMAGES: Record<number, string> = {
  250: '/images/official/acai_copo_250g.jpg',
  350: '/images/official/acai_copo_350g.jpg',
  500: '/images/official/acai_copo_500g.jpg',
  750: '/images/official/acai_tigela_750g.jpg',
  1000: '/images/official/acai_balde_1kg.jpg',
}

const CUP_VIDEOS: Record<number, string> = {
  250: '/videos/hero_revealing_cup.mp4',
  350: '/videos/hero_orbiting_cup.mp4',
  500: '/videos/hero_cup_rotation.mp4',
  750: '/videos/hero_gliding_texture.mp4',
  1000: '/videos/hero_cup_rotation.mp4',
}

export function isProductTimeAvailable(availableHours: any): boolean {
  if (!availableHours) return true
  try {
    const hours = typeof availableHours === 'string' ? JSON.parse(availableHours) : availableHours
    if (!hours) return true

    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Lisbon',
      hour: 'numeric',
      minute: 'numeric',
      weekday: 'short',
      hour12: false,
    })
    const parts = formatter.formatToParts(new Date())
    const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
    const weekdayPart = parts.find((p) => p.type === 'weekday')?.value || ''
    const currentDay = dayMap[weekdayPart] !== undefined ? dayMap[weekdayPart] : new Date().getDay()
    const hourPart = Number(parts.find((p) => p.type === 'hour')?.value) || 0
    const minutePart = Number(parts.find((p) => p.type === 'minute')?.value) || 0
    const currentMinutes = hourPart * 60 + minutePart

    if (hours.byDay && typeof hours.byDay === 'object') {
      const dayIntervals = hours.byDay[currentDay]
      if (Array.isArray(dayIntervals) && dayIntervals.length > 0) {
        return dayIntervals.some((interval: any) => {
          const [startH, startM] = (interval.start || '00:00').split(':').map(Number)
          const [endH, endM] = (interval.end || '23:59').split(':').map(Number)
          const startMinutes = startH * 60 + startM
          const endMinutes = endH * 60 + endM
          return currentMinutes >= startMinutes && currentMinutes <= endMinutes
        })
      }
      const hasAnyDayConfigured = Object.values(hours.byDay).some((arr: any) => Array.isArray(arr) && arr.length > 0)
      if (hasAnyDayConfigured) return false
      return true
    }

    if (Array.isArray(hours.days)) {
      if (hours.days.length === 0) return true
      if (!hours.days.includes(currentDay)) return false

      const [startH, startM] = (hours.startTime || '00:00').split(':').map(Number)
      const [endH, endM] = (hours.endTime || '23:59').split(':').map(Number)
      const startMinutes = startH * 60 + startM
      const endMinutes = endH * 60 + endM

      return currentMinutes >= startMinutes && currentMinutes <= endMinutes
    }

    return true
  } catch {
    return true
  }
}

export default function CustomerMenuHome({
  catalog,
  tenantId = '11111111-1111-1111-1111-111111111111',
  onSelectContainer,
  onAddToCart,
  isTable = false,
  isCatalogOnly = false,
}: CustomerMenuHomeProps) {
  const { language } = useLanguageStore()
  const isEn = language === 'en'

  // Identificadores canônicos de Menus
  const MASTER_ACAI_MENU_ID = '1c8ff060-3048-47c3-a5ec-efb60a56d0c1'
  const MASTER_LANCHES_MENU_ID = '2c8ff060-3048-47c3-a5ec-efb60a56d0c2'

  // Aba de Menu selecionada (padrão: Açaí da Rose)
  const [selectedMenuTab, setSelectedMenuTab] = useState<'acai' | 'lanches'>('acai')

  // Categoria de filtro ativa dentro do menu
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all')

  // Modal para produto unitário de lanches
  const [activeItemForDetail, setActiveItemForDetail] = useState<ProductContainer | null>(null)

  // Filtra itens ativos e visíveis
  const allContainers = useMemo(() => {
    return (catalog.containers || [])
      .filter((c) => c.active !== false && !c.isCategoryPaused)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
  }, [catalog.containers])

  // Produtos do Menu Açaí da Rose
  const acaiProducts = useMemo(() => {
    return allContainers.filter((c) => {
      if (c.menuId) return c.menuId === MASTER_ACAI_MENU_ID
      return c.productType !== 'ITEM'
    })
  }, [allContainers])

  // Produtos do Menu Lanches
  const lanchesProducts = useMemo(() => {
    return allContainers.filter((c) => {
      if (c.menuId) return c.menuId === MASTER_LANCHES_MENU_ID
      return c.productType === 'ITEM'
    })
  }, [allContainers])

  // Categorias disponíveis para o menu de lanches
  const lanchesCategories = useMemo(() => {
    return (catalog.categories || []).filter((cat) => cat.menuId === MASTER_LANCHES_MENU_ID && cat.active !== false)
  }, [catalog.categories])

  // Produtos visíveis com base na aba de menu e na subcategoria
  const displayedProducts = useMemo(() => {
    if (selectedMenuTab === 'acai') {
      if (selectedCategoryId === 'all') return acaiProducts
      if (selectedCategoryId === 'acai-tradicional') {
        return acaiProducts.filter((p) => p.categoryId !== 'cat-somente-creme' && !p.name.toLowerCase().includes('somente creme'))
      }
      if (selectedCategoryId === 'cat-somente-creme') {
        return acaiProducts.filter((p) => p.categoryId === 'cat-somente-creme' || p.name.toLowerCase().includes('somente creme'))
      }
      return acaiProducts
    } else {
      if (selectedCategoryId === 'all') return lanchesProducts
      return lanchesProducts.filter((p) => p.categoryId === selectedCategoryId)
    }
  }, [selectedMenuTab, selectedCategoryId, acaiProducts, lanchesProducts])

  const handleProductClick = (c: ProductContainer) => {
    const isAvailableInStore = c.isAvailableInStore !== false
    const isTimeAvailable = isProductTimeAvailable(c.availableHours)

    if (!isAvailableInStore) {
      toast.error(isEn ? 'This item is currently unavailable today.' : 'Este produto está indisponível hoje na nossa loja.')
      return
    }
    if (!isTimeAvailable) {
      toast.error(isEn ? 'This item is not available at this hour.' : 'Este produto não está disponível neste horário!')
      return
    }

    if (c.productType === 'ITEM') {
      if (isCatalogOnly) {
        toast.info(c.name)
        return
      }
      setActiveItemForDetail(c)
    } else {
      onSelectContainer(c)
    }
  }

  const handleSelectPromo = (promoId: string) => {
    const el = document.getElementById('catalogo-produtos')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="w-full space-y-6 sm:space-y-8 pb-8">
      {/* 1. CARROSSEL DE STORIES & PROMOÇÕES DA UNIDADE */}
      <CustomerPromoCarousel tenantId={tenantId} onSelectPromo={handleSelectPromo} />

      {/* 2. CATÁLOGO OFICIAL COM BARRA DE ABAS CANÔNICA (Açaí da Rose / Lanches) */}
      <section id="catalogo-produtos" className="max-w-6xl mx-auto px-4 md:px-8 space-y-5 pt-2">
        
        {/* Cabeçalho do Catálogo & Barra de Menus Canônica */}
        <div className="space-y-4 border-b border-purple-100 dark:border-white/10 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-pink-600 dark:text-pink-400 text-[11px] font-bold uppercase tracking-wider">
                {isEn ? 'Official Menu' : 'Catálogo Oficial'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
                {selectedMenuTab === 'acai'
                  ? (isEn ? 'Açaí da Rose' : 'Açaí da Rose')
                  : (isEn ? 'Snacks' : 'Lanches')}
              </h2>
            </div>

            {/* Contagem Limpa de Itens */}
            <div className="text-xs font-bold text-purple-900 bg-purple-100/80 dark:text-purple-300 dark:bg-white/10 px-3 py-1.5 rounded-xl border border-purple-200/70 dark:border-white/10 self-start sm:self-auto">
              {displayedProducts.length} {isEn ? 'items available' : 'produtos disponíveis'}
            </div>
          </div>

          {/* BARRA DE ABAS DE MENUS CANÔNICOS: Açaí da Rose / Lanches (Sem ícones, design clean, corporativo) */}
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-purple-100/60 dark:bg-white/5 border border-purple-200/70 dark:border-white/10 max-w-md">
            <button
              type="button"
              onClick={() => {
                setSelectedMenuTab('acai')
                setSelectedCategoryId('all')
              }}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all text-center cursor-pointer ${
                selectedMenuTab === 'acai'
                  ? 'bg-white dark:bg-purple-950 text-purple-950 dark:text-white shadow-sm border border-purple-200/50 dark:border-white/15'
                  : 'text-slate-600 dark:text-purple-300/70 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isEn ? 'Açaí da Rose' : 'Açaí da Rose'}
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedMenuTab('lanches')
                setSelectedCategoryId('all')
              }}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all text-center cursor-pointer ${
                selectedMenuTab === 'lanches'
                  ? 'bg-white dark:bg-purple-950 text-purple-950 dark:text-white shadow-sm border border-purple-200/50 dark:border-white/15'
                  : 'text-slate-600 dark:text-purple-300/70 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isEn ? 'Snacks' : 'Lanches'}
            </button>
          </div>

          {/* SUB-ABAS DE CATEGORIAS (Clean, minimalista e sem emojis decorativos) */}
          {selectedMenuTab === 'acai' ? (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
              <button
                type="button"
                onClick={() => setSelectedCategoryId('all')}
                className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
                  selectedCategoryId === 'all'
                    ? 'bg-purple-900 text-white dark:bg-pink-600'
                    : 'bg-purple-50 dark:bg-white/5 text-slate-700 dark:text-purple-200 border border-purple-200/70 dark:border-white/10 hover:bg-purple-100 dark:hover:bg-white/10'
                }`}
              >
                {isEn ? 'All Cups' : 'Todas as Taças'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategoryId('acai-tradicional')}
                className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
                  selectedCategoryId === 'acai-tradicional'
                    ? 'bg-purple-900 text-white dark:bg-pink-600'
                    : 'bg-purple-50 dark:bg-white/5 text-slate-700 dark:text-purple-200 border border-purple-200/70 dark:border-white/10 hover:bg-purple-100 dark:hover:bg-white/10'
                }`}
              >
                {isEn ? 'Açaí Bowls' : 'Açaí Tradicional'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategoryId('cat-somente-creme')}
                className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
                  selectedCategoryId === 'cat-somente-creme'
                    ? 'bg-purple-900 text-white dark:bg-pink-600'
                    : 'bg-purple-50 dark:bg-white/5 text-slate-700 dark:text-purple-200 border border-purple-200/70 dark:border-white/10 hover:bg-purple-100 dark:hover:bg-white/10'
                }`}
              >
                {isEn ? 'Ice Cream Only' : 'Somente Creme'}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
              <button
                type="button"
                onClick={() => setSelectedCategoryId('all')}
                className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
                  selectedCategoryId === 'all'
                    ? 'bg-purple-900 text-white dark:bg-pink-600'
                    : 'bg-purple-50 dark:bg-white/5 text-slate-700 dark:text-purple-200 border border-purple-200/70 dark:border-white/10 hover:bg-purple-100 dark:hover:bg-white/10'
                }`}
              >
                {isEn ? 'All Snacks' : 'Todos os Lanches'}
              </button>
              {lanchesCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
                    selectedCategoryId === cat.id
                      ? 'bg-purple-900 text-white dark:bg-pink-600'
                      : 'bg-purple-50 dark:bg-white/5 text-slate-700 dark:text-purple-200 border border-purple-200/70 dark:border-white/10 hover:bg-purple-100 dark:hover:bg-white/10'
                  }`}
                >
                  {(isEn && cat.nameEn) ? cat.nameEn : cat.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* GRADE DE PRODUTOS */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${selectedMenuTab}-${selectedCategoryId}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5"
          >
            {displayedProducts.map((c, index) => {
              const displayName = (isEn && c.nameEn) ? c.nameEn : c.name
              const displayDesc = (isEn && c.descriptionEn) ? c.descriptionEn : c.description
              const isAvailableInStore = c.isAvailableInStore !== false
              const isTimeAvailable = isProductTimeAvailable(c.availableHours)
              const isContainer = c.productType !== 'ITEM'
              const weight = c.weightGrams || null

              const hasImage = Boolean(c.image)
              const hasCupImage = weight && CUP_IMAGES[weight]
              const hasVideo = c.videoUrl || (weight && CUP_VIDEOS[weight])

              return (
                <div
                  key={c.id}
                  onClick={() => handleProductClick(c)}
                  className={`p-4 rounded-3xl bg-white border border-purple-100 shadow-sm hover:border-pink-500/50 hover:shadow-lg dark:bg-gradient-to-b dark:from-[#24043b]/90 dark:to-[#160226]/90 dark:border-white/10 dark:hover:border-pink-500/50 transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.99] ${
                    !isAvailableInStore || !isTimeAvailable ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
                  <div>
                    {/* Imagem / Vídeo ou Bloco Tipográfico Clean */}
                    {(hasVideo || hasImage || hasCupImage) ? (
                      <div className="relative h-44 sm:h-40 md:h-44 w-full rounded-2xl overflow-hidden bg-purple-50 dark:bg-purple-950/40 mb-3 border border-purple-100 dark:border-white/10">
                        {hasVideo ? (
                          <video
                            src={c.videoUrl || (weight ? CUP_VIDEOS[weight] : undefined)}
                            autoPlay
                            muted
                            loop
                            playsInline
                            preload="auto"
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <img
                            src={c.image || (weight ? CUP_IMAGES[weight] : '')}
                            alt={displayName}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        )}

                        {!isAvailableInStore ? (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-2 text-center">
                            <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider bg-black/80 px-2.5 py-1 rounded-full border border-amber-400/30">
                              {isEn ? 'Unavailable today' : 'Indisponível hoje'}
                            </span>
                          </div>
                        ) : !isTimeAvailable ? (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-2 text-center">
                            <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
                              {isEn ? 'Outside hours' : 'Fora de Horário'}
                            </span>
                          </div>
                        ) : null}

                        {weight && (
                          <div className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-lg bg-black/70 backdrop-blur-xs text-[11px] font-bold text-white shadow-xs">
                            {weight}g
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 mb-3 rounded-2xl bg-purple-50/60 dark:bg-white/5 border border-purple-100 dark:border-white/5 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-pink-400">
                          {c.categoryName || (isEn ? 'Snack' : 'Lanche')}
                        </span>
                        {weight ? (
                          <span className="text-[11px] font-bold text-slate-700 dark:text-purple-200">
                            {weight}g
                          </span>
                        ) : null}
                      </div>
                    )}

                    <div className="font-bold text-base text-slate-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-300 transition-colors uppercase tracking-tight">
                      {displayName}
                    </div>

                    {displayDesc && displayDesc.trim() ? (
                      <p className="text-xs text-slate-600 dark:text-purple-200/70 mt-1 line-clamp-2 leading-relaxed">
                        {displayDesc.trim()}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-purple-100 dark:border-white/10 gap-2">
                    <div className="min-w-0 shrink-0">
                      <div className="text-[10px] text-slate-500 dark:text-purple-300 font-bold">
                        {isEn ? 'Price' : 'Preço'}
                      </div>
                      <div className="text-base sm:text-lg font-bold text-fuchsia-600 dark:text-pink-300 font-mono whitespace-nowrap">
                        {formatCurrency(c.precoBase)}
                      </div>
                    </div>

                    {isCatalogOnly ? (
                      <span className="h-9 px-3.5 rounded-xl bg-purple-100 text-purple-900 dark:bg-white/10 dark:text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {isEn ? 'Details' : 'Detalhes'}
                      </span>
                    ) : !isAvailableInStore ? (
                      <span className="h-9 px-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-bold text-xs flex items-center justify-center shrink-0 cursor-not-allowed select-none">
                        {isEn ? 'Unavailable' : 'Indisponível'}
                      </span>
                    ) : (
                      <span className={`h-9 px-3.5 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-1 shrink-0 whitespace-nowrap transition-all ${
                        isTimeAvailable
                          ? 'bg-gradient-to-r from-pink-600 to-purple-600 shadow-xs hover:scale-102 active:scale-95'
                          : 'bg-slate-200 text-slate-400 dark:bg-white/10 dark:text-white/50 cursor-not-allowed'
                      }`}>
                        <Plus className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          {isContainer
                            ? (isTable ? (isEn ? 'Order' : 'Pedir') : (isEn ? 'Customize' : 'Personalizar'))
                            : (isEn ? 'Order' : 'Pedir')}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </motion.div>
        </AnimatePresence>
      </section>

      {/* MODAL DE PRODUTO UNITÁRIO DE LANCHES */}
      {activeItemForDetail && (
        <CustomerItemDetailModal
          product={activeItemForDetail}
          onClose={() => setActiveItemForDetail(null)}
          onAddToCart={(item) => {
            if (onAddToCart) {
              onAddToCart(item)
            }
            setActiveItemForDetail(null)
          }}
        />
      )}
    </div>
  )
}
