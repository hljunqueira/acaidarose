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

export function isProductTimeAvailable(availableHours: any): boolean {
  if (!availableHours) return true
  try {
    const hours = typeof availableHours === 'string' ? JSON.parse(availableHours) : availableHours
    if (!hours || !Array.isArray(hours.days)) return true
    
    // Pegar o dia da semana local (0 = Domingo, 1 = Segunda, etc.)
    const now = new Date()
    const currentDay = now.getDay()
    if (!hours.days.includes(currentDay)) return false

    const [startH, startM] = hours.startTime.split(':').map(Number)
    const [endH, endM] = hours.endTime.split(':').map(Number)

    const currentMinutes = now.getHours() * 60 + now.getMinutes()
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
  // Filtra itens visíveis e ordenados
  const containers = useMemo(() => {
    return (catalog.containers || [])
      .filter((c) => c.active !== false && c.isAvailableInStore !== false)
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
    <div className="w-full space-y-8 pb-12">
      {/* 1. CARROSSEL DE STORIES & PROMOÇÕES DA UNIDADE */}
      <CustomerPromoCarousel onSelectPromo={handleSelectPromo} />

      {/* 2. CATÁLOGO DOS AÇAÍS */}
      <section id="cardapio-acai" className="max-w-6xl mx-auto px-4 md:px-8 space-y-6 pt-2">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2 text-pink-400 text-xs font-bold uppercase tracking-wider">
              <span>Catálogo Oficial</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              Tamanhos de Açaí
            </h2>
            <p className="text-xs sm:text-sm text-purple-200/70 mt-1 max-w-xl">
              {isCatalogOnly
                ? 'Consulte os tamanhos e bases disponíveis na nossa unidade.'
                : 'Selecione o tamanho para personalizar as suas bases, frutas frescas e acompanhamentos.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-fuchsia-300 bg-fuchsia-950/60 px-3 py-1.5 rounded-xl border border-fuchsia-500/30">
              {containers.length} tamanhos disponíveis
            </span>
          </div>
        </div>

        {/* Grade de Cards Minimalistas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5">
          {containers.map((c, index) => {
            const isFree = c.weightGrams >= 500
            const img = CUP_IMAGES[c.weightGrams] || c.image || '/images/official/acai_copo_500g.jpg'
            const isTimeAvailable = isProductTimeAvailable(c.availableHours)

            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                onClick={() => {
                  if (!isTimeAvailable) {
                    toast.error('Este produto não está disponível neste horário!')
                    return
                  }
                  onSelectContainer(c)
                }}
                className={`p-4 rounded-3xl bg-gradient-to-b from-[#24043b]/90 to-[#160226]/90 border border-white/15 hover:border-pink-500/60 transition-all cursor-pointer flex flex-col justify-between group shadow-xl hover:shadow-2xl hover:shadow-pink-600/20 ${
                  !isTimeAvailable ? 'opacity-40 cursor-not-allowed border-red-500/30' : ''
                }`}
              >
                <div>
                  <div className="relative h-48 w-full rounded-2xl overflow-hidden bg-purple-950/50 mb-3 border border-white/10">
                    {c.videoUrl ? (
                      <video
                        src={c.videoUrl}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <img
                        src={img}
                        alt={c.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}

                    {!isTimeAvailable && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 text-center">
                        <span className="text-[10px] font-black text-red-400 uppercase tracking-wider">
                          Fora de Horário
                        </span>
                      </div>
                    )}

                    {isTimeAvailable && (
                      isFree ? (
                        <Badge className="absolute top-2.5 right-2.5 bg-emerald-600 text-white font-black text-[9px] py-0.5 px-2.5 rounded-full border-0">
                          Frutas & Complementos Livres
                        </Badge>
                      ) : (
                        <Badge className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md text-pink-300 font-black text-[9px] py-0.5 px-2 rounded-full border border-pink-500/30">
                          Até {c.limiteFrutas || 2} Frutas
                        </Badge>
                      )
                    )}

                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-[10px] font-bold text-white">
                      {c.weightGrams}g
                    </div>
                  </div>

                  <div className="font-black text-lg text-white group-hover:text-pink-300 transition-colors uppercase tracking-tight">
                    {c.name}
                  </div>

                  <p className="text-[11px] text-purple-200/70 mt-1 line-clamp-2 leading-relaxed">
                    {isFree
                      ? 'Açaí cremoso batido na hora com frutas frescas e complementos.'
                      : `Inclui 1 base gelada, até ${c.limiteFrutas || 2} frutas e ${c.limiteToppings || 3} complementos.`}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
                  <div>
                    <div className="text-[10px] text-purple-300 font-bold">Preço</div>
                    <div className="text-lg font-black text-pink-300 font-mono">
                      {formatCurrency(c.precoBase)}
                    </div>
                  </div>

                  {isCatalogOnly ? (
                    <span className="h-9 px-3 rounded-xl bg-white/10 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all">
                      <Info className="h-3.5 w-3.5" />
                      <span>Detalhes</span>
                    </span>
                  ) : (
                    <span className={`h-10 px-4 rounded-xl text-white font-black text-xs flex items-center justify-center gap-1.5 transition-all ${
                      isTimeAvailable 
                        ? 'bg-gradient-to-r from-pink-600 to-purple-600 shadow-lg shadow-pink-600/30' 
                        : 'bg-white/10 text-white/50 cursor-not-allowed'
                    }`}>
                      <Plus className="h-4 w-4" />
                      <span>{isTable ? 'Pedir na Mesa' : 'Personalizar'}</span>
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
