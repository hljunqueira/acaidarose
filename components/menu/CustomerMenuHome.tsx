'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { CatalogData, ProductContainer } from '@/types'
import { formatCurrency } from '@/lib/i18n/formatters'
import { motion, AnimatePresence } from 'framer-motion'
import CustomerPromoCarousel from '@/components/menu/CustomerPromoCarousel'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguageStore } from '@/lib/stores/languageStore'
import { getLocalizedField } from '@/lib/i18n/localization'
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
  const isEs = language === 'es'

  // 1. Menus Dinâmicos do Catálogo (100% do Banco de Dados)
  const menus = useMemo(() => {
    return (catalog.menus || [])
      .filter((m) => m.active !== false)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
  }, [catalog.menus])

  // Aba de Menu selecionada (inicia dinamicamente com o primeiro menu ativo)
  const [selectedMenuId, setSelectedMenuId] = useState<string>('')

  useEffect(() => {
    if (menus.length > 0 && !menus.some((m) => m.id === selectedMenuId)) {
      setSelectedMenuId(menus[0].id)
    }
  }, [menus, selectedMenuId])

  // Categoria ativa dentro do menu selecionado
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all')

  // Modal para item unitário
  const [activeItemForDetail, setActiveItemForDetail] = useState<ProductContainer | null>(null)

  // Filtra itens ativos e visíveis
  const allContainers = useMemo(() => {
    return (catalog.containers || [])
      .filter((c) => c.active !== false && !c.isCategoryPaused)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
  }, [catalog.containers])

  // Categorias pertencentes ao menu selecionado
  const activeMenuCategories = useMemo(() => {
    return (catalog.categories || []).filter(
      (cat) => cat.menuId === selectedMenuId && cat.active !== false
    )
  }, [catalog.categories, selectedMenuId])

  // Produtos pertencentes ao menu selecionado (100% Dinâmico do PostgreSQL)
  const currentMenuProducts = useMemo(() => {
    const catOrderMap = new Map<string, number>()
    activeMenuCategories.forEach((cat, idx) => {
      catOrderMap.set(cat.id, cat.displayOrder !== undefined ? Number(cat.displayOrder) : idx + 1)
    })

    return allContainers
      .filter((c) => c.menuId === selectedMenuId)
      .sort((a, b) => {
        const orderA = a.categoryId ? (catOrderMap.get(a.categoryId) ?? 999) : 999
        const orderB = b.categoryId ? (catOrderMap.get(b.categoryId) ?? 999) : 999
        if (orderA !== orderB) return orderA - orderB
        return (a.displayOrder || 0) - (b.displayOrder || 0)
      })
  }, [allContainers, selectedMenuId, activeMenuCategories])

  // Produtos filtrados pela categoria selecionada (100% Dinâmico do PostgreSQL)
  const displayedProducts = useMemo(() => {
    if (selectedCategoryId === 'all') return currentMenuProducts
    return currentMenuProducts.filter((p) => p.categoryId === selectedCategoryId)
  }, [currentMenuProducts, selectedCategoryId])

  const selectedMenu = menus.find((m) => m.id === selectedMenuId) || menus[0]
  const currentMenuTitle = selectedMenu ? (getLocalizedField(selectedMenu, 'name', language) || selectedMenu.name) : 'Cardápio'

  const handleProductClick = (c: ProductContainer) => {
    const isAvailableInStore = c.isAvailableInStore !== false
    const isTimeAvailable = isProductTimeAvailable(c.availableHours)

    if (!isAvailableInStore) {
      toast.error(
        isEn
          ? 'This item is currently unavailable today.'
          : isEs
          ? 'Este producto no está disponible hoy en nuestra tienda.'
          : 'Este produto está indisponível hoje na nossa loja.'
      )
      return
    }
    if (!isTimeAvailable) {
      toast.error(
        isEn
          ? 'This item is not available at this hour.'
          : isEs
          ? '¡Este producto no está disponible a esta hora!'
          : 'Este produto não está disponível neste horário!'
      )
      return
    }

    // Se for ITEM unitário ou tiver modificadores/optionGroups configurados, abre o modal de detalhe
    const hasOptions = Array.isArray(c.optionGroups) && c.optionGroups.length > 0
    if (c.productType === 'ITEM' || hasOptions) {
      if (isCatalogOnly) {
        toast.info(getLocalizedField(c, 'name', language) || c.name)
        return
      }
      setActiveItemForDetail(c)
    } else {
      // Abre o fluxo clássico de personalização de Açaí (Taça / Pote com bases e acompanhamentos)
      onSelectContainer(c)
    }
  }

  const handleSelectPromo = (_promoId: string) => {
    const el = document.getElementById('catalogo-produtos')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="w-full space-y-6 sm:space-y-8 pb-8">
      {/* 1. CARROSSEL DE STORIES & PROMOÇÕES DA UNIDADE (Full-Width Responsivo) */}
      <CustomerPromoCarousel tenantId={tenantId} onSelectPromo={handleSelectPromo} />

      {/* 2. CATÁLOGO OFICIAL COM BARRA DINÂMICA DE MENUS (Clean, Corporativo, Sem Emojis) */}
      <section id="catalogo-produtos" className="w-full max-w-[1440px] mx-auto px-4 md:px-8 space-y-5 pt-2">
        
        {/* Cabeçalho do Catálogo */}
        <div className="space-y-4 border-b border-purple-100 dark:border-white/10 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-pink-600 dark:text-pink-400 text-[11px] font-bold uppercase tracking-wider">
                {isEn ? 'Official Menu' : isEs ? 'Carta Oficial' : 'Ementa Oficial'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
                {currentMenuTitle}
              </h2>
            </div>

            {/* Contagem Limpa de Itens */}
            <div className="text-xs font-bold text-purple-900 bg-purple-100/80 dark:text-purple-300 dark:bg-white/10 px-3 py-1.5 rounded-xl border border-purple-200/70 dark:border-white/10 self-start sm:self-auto">
              {displayedProducts.length} {isEn ? 'items available' : isEs ? 'productos disponibles' : 'produtos disponíveis'}
            </div>
          </div>

          {/* BARRA DE ABAS DE MENUS (Dinâmico: 5 Menus em Scroll Horizontal Limpo) */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-purple-100/60 dark:bg-white/5 border border-purple-200/70 dark:border-white/10 overflow-x-auto no-scrollbar">
            {menus.map((m) => {
              const localizedMenuName = getLocalizedField(m, 'name', language) || m.name
              const isSelected = selectedMenuId === m.id

              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setSelectedMenuId(m.id)
                    setSelectedCategoryId('all')
                  }}
                  className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap text-center cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-white dark:bg-purple-950 text-purple-950 dark:text-white shadow-sm border border-purple-200/50 dark:border-white/15'
                      : 'text-slate-600 dark:text-purple-300/70 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {localizedMenuName}
                </button>
              )
            })}
          </div>

          {/* SUB-ABAS DE CATEGORIAS (Filtro Interno do Menu) */}
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
              {isEn ? 'All' : isEs ? 'Todos' : 'Todos'}
            </button>

            {/* Categorias Dinâmicas registradas para o Menu */}
            {activeMenuCategories.map((cat) => {
              const localizedCatName = getLocalizedField(cat, 'name', language) || cat.name
              return (
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
                  {localizedCatName}
                </button>
              )
            })}
          </div>
        </div>

        {/* GRADE DE PRODUTOS */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${selectedMenuId}-${selectedCategoryId}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5"
          >
            {displayedProducts.map((c) => {
              const displayName = getLocalizedField(c, 'name', language) || c.name
              const displayDesc = getLocalizedField(c, 'description', language) || c.description
              const isAvailableInStore = c.isAvailableInStore !== false
              const isTimeAvailable = isProductTimeAvailable(c.availableHours)
              const isContainer = c.productType !== 'ITEM'
              const weight = c.weightGrams || null

              const hasImage = Boolean(c.image)
              const hasCupImage = weight && CUP_IMAGES[weight]
              const hasVideo = Boolean(c.videoUrl || (weight && CUP_VIDEOS[weight]))
              const videoSrc = c.videoUrl || (weight ? CUP_VIDEOS[weight] : undefined)

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
                    {hasVideo || hasImage || hasCupImage ? (
                      <div className="relative h-44 sm:h-40 md:h-44 w-full rounded-2xl overflow-hidden bg-purple-50 dark:bg-purple-950/40 mb-3 border border-purple-100 dark:border-white/10">
                        {hasVideo ? (
                          <video
                            src={videoSrc}
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
                              {isEn ? 'Unavailable today' : isEs ? 'No disponible hoy' : 'Indisponível hoje'}
                            </span>
                          </div>
                        ) : !isTimeAvailable ? (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-2 text-center">
                            <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
                              {isEn ? 'Outside hours' : isEs ? 'Fuera de horario' : 'Fora de Horário'}
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
                          {c.categoryName || (isEn ? 'Item' : isEs ? 'Producto' : 'Item')}
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
                        {isEn ? 'Price' : isEs ? 'Precio' : 'Preço'}
                      </div>
                      <div className="text-base sm:text-lg font-bold text-fuchsia-600 dark:text-pink-300 font-mono whitespace-nowrap">
                        {formatCurrency(c.precoBase)}
                      </div>
                    </div>

                    {isCatalogOnly ? (
                      <span className="h-9 px-3.5 rounded-xl bg-purple-100 text-purple-900 dark:bg-white/10 dark:text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {isEn ? 'Details' : isEs ? 'Detalles' : 'Detalhes'}
                      </span>
                    ) : !isAvailableInStore ? (
                      <span className="h-9 px-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-bold text-xs flex items-center justify-center shrink-0 cursor-not-allowed select-none">
                        {isEn ? 'Unavailable' : isEs ? 'No disponible' : 'Indisponível'}
                      </span>
                    ) : (
                      <span
                        className={`h-9 px-3.5 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-1 shrink-0 whitespace-nowrap transition-all ${
                          isTimeAvailable
                            ? 'bg-gradient-to-r from-pink-600 to-purple-600 shadow-xs hover:scale-102 active:scale-95'
                            : 'bg-slate-200 text-slate-400 dark:bg-white/10 dark:text-white/50 cursor-not-allowed'
                        }`}
                      >
                        <Plus className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          {isContainer
                            ? isTable
                              ? isEn ? 'Order' : isEs ? 'Pedir' : 'Pedir'
                              : isEn ? 'Customize' : isEs ? 'Personalizar' : 'Personalizar'
                            : isEn ? 'Order' : isEs ? 'Pedir' : 'Pedir'}
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

      {/* MODAL DE PRODUTO UNITÁRIO / MODIFICADORES */}
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
