'use client'

import React, { useMemo } from 'react'
import { CatalogData, ProductContainer } from '@/types'
import { formatCurrency } from '@/lib/i18n/formatters'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import CustomerPromoCarousel from '@/components/menu/CustomerPromoCarousel'
import { Plus, Heart, Info } from 'lucide-react'
import { toast } from 'sonner'

interface CustomerMenuHomeProps {
  catalog: CatalogData
  tenantId?: string
  onSelectContainer: (c: ProductContainer) => void
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
    if (!hours || !Array.isArray(hours.days)) return true

    // Obtém dia e hora exatos no fuso horário oficial de Portugal (Europe/Lisbon)
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

    if (!hours.days.includes(currentDay)) return false

    const hourPart = Number(parts.find((p) => p.type === 'hour')?.value) || 0
    const minutePart = Number(parts.find((p) => p.type === 'minute')?.value) || 0

    const [startH, startM] = (hours.startTime || '00:00').split(':').map(Number)
    const [endH, endM] = (hours.endTime || '23:59').split(':').map(Number)

    const currentMinutes = hourPart * 60 + minutePart
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes
  } catch {
    return true
  }
}

export default function CustomerMenuHome({
  catalog,
  tenantId = '11111111-1111-1111-1111-111111111111',
  onSelectContainer,
  isTable = false,
  isCatalogOnly = false,
}: CustomerMenuHomeProps) {
  // Filtra itens visíveis e ordenados (itens invisíveis ou com categoria pausada são ocultados)
  const containers = useMemo(() => {
    return (catalog.containers || [])
      .filter((c) => c.active !== false && !c.isCategoryPaused)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
  }, [catalog.containers])

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleSelectPromo = (promoId: string) => {
    if (promoId === 'hl-4') {
      scrollToSection('especiais-rose')
    } else {
      scrollToSection('cardapio-acai')
    }
  }

  return (
    <div className="w-full space-y-6 sm:space-y-8 pb-4">
      {/* 1. CARROSSEL DE STORIES & PROMOÇÕES DA UNIDADE */}
      <CustomerPromoCarousel tenantId={tenantId} onSelectPromo={handleSelectPromo} />

      {/* 2. CATÁLOGO DOS AÇAÍS */}
      <section id="cardapio-acai" className="max-w-6xl mx-auto px-4 md:px-8 space-y-5 pt-2">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 border-b border-purple-100 dark:border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2 text-pink-600 dark:text-pink-400 text-xs font-bold uppercase tracking-wider">
              <span>Catálogo Oficial</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
              Tamanhos de Açaí
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-purple-200/70 mt-1 max-w-xl">
              {isCatalogOnly
                ? 'Consulte os tamanhos e bases disponíveis na nossa unidade.'
                : 'Selecione o tamanho para personalizar as suas bases, frutas frescas e toppings.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-purple-900 bg-purple-100 dark:text-fuchsia-300 dark:bg-fuchsia-950/60 px-3 py-1.5 rounded-xl border border-purple-200 dark:border-fuchsia-500/30">
              {containers.length} tamanhos disponíveis
            </span>
          </div>
        </div>

        {/* Grade de Cards Minimalistas Otimizada para Mobile e Desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5">
          {containers.map((c, index) => {
            const isFree = c.weightGrams >= 500
            const img = CUP_IMAGES[c.weightGrams] || c.image || '/images/official/acai_copo_500g.jpg'
            const video = c.videoUrl || CUP_VIDEOS[c.weightGrams]
            const isAvailableInStore = c.isAvailableInStore !== false
            const isTimeAvailable = isProductTimeAvailable(c.availableHours)

            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.04 }}
                onClick={() => {
                  if (!isAvailableInStore) {
                    toast.error('Este produto está indisponível hoje na nossa loja.')
                    return
                  }
                  if (!isTimeAvailable) {
                    toast.error('Este produto não está disponível neste horário!')
                    return
                  }
                  onSelectContainer(c)
                }}
                className={`p-4 rounded-3xl bg-white border border-purple-100 shadow-md hover:border-pink-500/50 hover:shadow-xl dark:bg-gradient-to-b dark:from-[#24043b]/90 dark:to-[#160226]/90 dark:border-white/15 dark:hover:border-pink-500/60 dark:shadow-xl transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.99] ${
                  !isAvailableInStore || !isTimeAvailable ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                <div>
                  <div className="relative h-48 sm:h-44 md:h-48 w-full rounded-2xl overflow-hidden bg-purple-50 dark:bg-purple-950/50 mb-3 border border-purple-100 dark:border-white/10">
                    {video ? (
                      <video
                        src={video}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="auto"
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <img
                        src={img}
                        alt={c.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}

                    {!isAvailableInStore ? (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 text-center">
                        <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider bg-black/75 px-3 py-1 rounded-full border border-amber-400/30 shadow-sm">
                          Indisponível hoje
                        </span>
                      </div>
                    ) : !isTimeAvailable ? (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 text-center">
                        <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
                          Fora de Horário
                        </span>
                      </div>
                    ) : null}

                    {isAvailableInStore && isTimeAvailable && (
                      isFree ? (
                        <Badge className="absolute top-2.5 right-2.5 bg-emerald-600 text-white font-bold text-[9px] py-0.5 px-2.5 rounded-full border-0 shadow-md">
                          Frutas & Toppings Livres
                        </Badge>
                      ) : (
                        <Badge className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md text-pink-300 font-bold text-[9px] py-0.5 px-2 rounded-full border border-pink-500/30">
                          Até {c.limiteFrutas || 2} Frutas
                        </Badge>
                      )
                    )}

                    <div className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-lg bg-black/65 backdrop-blur-md text-[11px] font-bold text-white shadow-sm">
                      {c.weightGrams}g
                    </div>
                  </div>

                  <div className="font-bold text-base text-slate-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-300 transition-colors uppercase tracking-tight">
                    {c.name}
                  </div>

                  {c.description && c.description.trim() ? (
                    <p className="text-xs text-slate-600 dark:text-purple-200/70 mt-1 line-clamp-2 leading-relaxed">
                      {c.description.trim()}
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-purple-100 dark:border-white/10 gap-2">
                  <div className="min-w-0 shrink-0">
                    <div className="text-[10px] text-slate-500 dark:text-purple-300 font-bold">Preço</div>
                    <div className="text-base sm:text-lg font-bold text-fuchsia-600 dark:text-pink-300 font-mono whitespace-nowrap">
                      {formatCurrency(c.precoBase)}
                    </div>
                  </div>

                  {isCatalogOnly ? (
                    <span className="h-9 sm:h-10 px-3.5 rounded-xl bg-purple-100 text-purple-900 dark:bg-white/10 dark:text-white font-bold text-xs flex items-center justify-center shrink-0 transition-all">
                      <span>Detalhes</span>
                    </span>
                  ) : !isAvailableInStore ? (
                    <span className="h-9 sm:h-10 px-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 font-bold text-xs flex items-center justify-center shrink-0 cursor-not-allowed select-none">
                      <span>Indisponível</span>
                    </span>
                  ) : (
                    <span className={`h-9 sm:h-10 px-3.5 sm:px-4 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-1 shrink-0 whitespace-nowrap transition-all ${
                      isTimeAvailable
                        ? 'bg-gradient-to-r from-pink-600 to-purple-600 shadow-md shadow-pink-600/20 hover:scale-102 active:scale-95'
                        : 'bg-slate-200 text-slate-400 dark:bg-white/10 dark:text-white/50 cursor-not-allowed'
                    }`}>
                      <Plus className="h-3.5 w-3.5 shrink-0" />
                      <span>{isTable ? 'Pedir' : 'Personalizar'}</span>
                    </span>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
