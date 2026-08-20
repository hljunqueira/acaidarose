'use client'

import React, { useMemo } from 'react'
import { CatalogData, ProductContainer } from '@/types'
import { formatCurrency } from '@/lib/i18n/formatters'
import { Badge } from '@/components/ui/badge'
import CustomerPromoCarousel from './CustomerPromoCarousel'
import { Plus, Sparkles, Heart, ShieldCheck, Leaf } from 'lucide-react'

interface CustomerMenuHomeProps {
  catalog: CatalogData
  onSelectContainer: (c: ProductContainer) => void
}

const CUP_IMAGES: Record<number, string> = {
  250: '/images/acai_250g.jpg',
  350: '/images/acai_350g.jpg',
  500: '/images/acai_500g.jpg',
  750: '/images/acai_750g.jpg',
  1000: '/images/acai_1kg.jpg',
}

export default function CustomerMenuHome({ catalog, onSelectContainer }: CustomerMenuHomeProps) {
  // Filtra estritamente itens visíveis no QR Code
  const containers = useMemo(() => {
    return (catalog.containers || [])
      .filter((c) => c.active !== false && c.isAvailableInStore !== false)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
  }, [catalog.containers])

  return (
    <div className="space-y-6 pb-28 select-none">
      {/* 1. Frase de Impacto Oficial do Banner */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-2">
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/80 via-fuchsia-950/70 to-purple-950/80 border border-fuchsia-500/30 text-center shadow-lg backdrop-blur-md">
          <p className="text-xs sm:text-sm font-black uppercase tracking-wider text-fuchsia-200">
            Açaí não se explica: se experimenta, se apaixona e repete.
          </p>
          <p className="text-[11px] text-purple-300/80 font-semibold mt-0.5 flex items-center justify-center gap-1.5">
            <Heart className="h-3 w-3 text-pink-400 fill-pink-400" />
            <span>O sabor que abraça a alma</span>
            <span className="text-white/40">•</span>
            <span>Autêntico Açaí Artesanal Brasileiro</span>
          </p>
        </div>
      </div>

      {/* 2. Carrossel de Banners Promocionais */}
      <CustomerPromoCarousel
        onSelectPromo={() => {
          if (containers.length > 0) {
            onSelectContainer(containers[2] || containers[0])
          }
        }}
      />

      {/* 3. Selos de Qualidade do Rótulo Oficial da Rose */}
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-2.5 rounded-2xl bg-[#1d0332]/80 border border-white/10 flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Leaf className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-black text-white">100% VEGAN</div>
              <div className="text-[10px] text-purple-200/70">Fruit Rich & Omegas</div>
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-[#1d0332]/80 border border-white/10 flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-black text-white">Sem Glúten & Lactose</div>
              <div className="text-[10px] text-purple-200/70">Dairy Free Natural</div>
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-[#1d0332]/80 border border-white/10 flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-pink-500/20 text-pink-300 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-black text-white">Sem Conservantes</div>
              <div className="text-[10px] text-purple-200/70">Polpa Pura Selecionada</div>
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-[#1d0332]/80 border border-white/10 flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center flex-shrink-0">
              <Heart className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-black text-white">Feito com Amor</div>
              <div className="text-[10px] text-purple-200/70">Frutas Frescas na Hora</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Grade Oficial dos Tamanhos de Açaí */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span>🍧</span>
              <span>Escolha o seu Tamanho de Açaí</span>
            </h3>
            <p className="text-xs text-purple-200/70">
              Selecione o tamanho para personalizar cremes, frutas frescas e acompanhamentos
            </p>
          </div>
          <span className="text-[11px] text-fuchsia-300 font-bold hidden sm:inline-block">
            {containers.length} tamanhos disponíveis
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {containers.map((c) => {
            const isFree = c.weightGrams >= 500
            const img = c.image || CUP_IMAGES[c.weightGrams] || CUP_IMAGES[500]

            return (
              <div
                key={c.id}
                onClick={() => onSelectContainer(c)}
                className="p-4 rounded-3xl bg-[#1e0333]/90 border border-white/10 hover:border-fuchsia-500/50 transition-all cursor-pointer flex flex-col justify-between group shadow-xl hover:-translate-y-1 duration-200"
              >
                <div>
                  <div className="relative h-44 w-full rounded-2xl overflow-hidden bg-purple-900/30 mb-3 border border-white/10">
                    <img
                      src={img}
                      alt={c.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {isFree ? (
                      <Badge className="absolute top-2 right-2 bg-emerald-500 text-white font-black text-[9px] py-0.5 px-2 rounded-full border-0 shadow-md">
                        Frutas & Toppings Livres
                      </Badge>
                    ) : (
                      <Badge className="absolute top-2 right-2 bg-purple-800 text-purple-200 font-black text-[9px] py-0.5 px-2 rounded-full border-0">
                        Até {c.limiteFrutas || 2} Frutas
                      </Badge>
                    )}
                  </div>

                  <div className="font-black text-base text-white group-hover:text-fuchsia-200 transition-colors uppercase tracking-tight">
                    {c.name}
                  </div>
                  <p className="text-[11px] text-purple-200/70 mt-1 line-clamp-2 leading-relaxed">
                    {isFree
                      ? 'Açaí cremoso batido na hora com frutas frescas e acompanhamentos livres.'
                      : `Inclui 1 base gelada, até ${c.limiteFrutas || 2} frutas e ${c.limiteToppings || 3} toppings.`}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
                  <div>
                    <div className="text-[10px] text-purple-300 font-bold">Preço</div>
                    <div className="text-base font-black text-fuchsia-300 font-mono">
                      {formatCurrency(c.precoBase)}
                    </div>
                  </div>
                  <span className="h-9 px-3.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-700 text-white font-black text-xs flex items-center justify-center gap-1 group-hover:shadow-md group-hover:shadow-fuchsia-600/30 transition">
                    <Plus className="h-3.5 w-3.5" />
                    <span>Montar</span>
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
