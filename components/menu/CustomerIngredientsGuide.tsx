'use client'

import React, { useState, useMemo } from 'react'
import { CatalogData } from '@/types'
import { formatCurrency } from '@/lib/i18n/formatters'
import { Check, AlertCircle } from 'lucide-react'

interface CustomerIngredientsGuideProps {
  catalog: CatalogData
}

type CategoryFilter = 'ALL' | 'BASES' | 'FRUTAS' | 'TOPPINGS' | 'PREMIUM'

export interface IngredientItem {
  id: string
  name: string
  category: CategoryFilter
  categoryLabel: string
  emoji: string
  isPremium: boolean
  price?: number
  active: boolean
  description: string
}

export default function CustomerIngredientsGuide({ catalog }: CustomerIngredientsGuideProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('ALL')

  const bases: IngredientItem[] = useMemo(() => {
    return (catalog.bases || []).map((b) => ({
      id: b.id,
      name: b.name,
      category: 'BASES',
      categoryLabel: 'Base Gelada',
      emoji: b.emoji || '🍨',
      isPremium: false,
      active: b.active !== false,
      description: 'Polpa cremosa especial batida artesanalmente',
    }))
  }, [catalog.bases])

  const frutas: IngredientItem[] = useMemo(() => {
    return (catalog.toppings || [])
      .filter((t) => (t.category || '').toLowerCase().includes('fruta'))
      .map((t) => ({
        id: t.id,
        name: t.name,
        category: 'FRUTAS',
        categoryLabel: 'Fruta Fresca',
        emoji: t.emoji || '🍓',
        isPremium: false,
        active: t.active !== false,
        description: 'Frutas selecionadas e cortadas no dia',
      }))
  }, [catalog.toppings])

  const toppings: IngredientItem[] = useMemo(() => {
    return (catalog.toppings || [])
      .filter((t) => {
        const cat = (t.category || '').toLowerCase()
        return !cat.includes('fruta') && !t.isPremium && !cat.includes('premium')
      })
      .map((t) => ({
        id: t.id,
        name: t.name,
        category: 'TOPPINGS',
        categoryLabel: 'Topping & Crocante',
        emoji: t.emoji || '🥣',
        isPremium: false,
        active: t.active !== false,
        description: 'Acompanhamento crocante e saboroso',
      }))
  }, [catalog.toppings])

  const caldasPremium: IngredientItem[] = useMemo(() => {
    return (catalog.toppings || [])
      .filter((t) => {
        const cat = (t.category || '').toLowerCase()
        return t.isPremium || cat.includes('premium') || Boolean(t.priceTierLow && t.priceTierLow > 0)
      })
      .map((t) => ({
        id: t.id,
        name: t.name,
        category: 'PREMIUM',
        categoryLabel: 'Especial Premium',
        emoji: t.emoji || '🍯',
        isPremium: true,
        price: t.priceTierLow || t.precoExtra || t.price || 1.0,
        active: t.active !== false,
        description: 'Caldas nobres e cremes gourmet',
      }))
  }, [catalog.toppings])

  const allItems: IngredientItem[] = useMemo(() => {
    if (activeCategory === 'BASES') return bases
    if (activeCategory === 'FRUTAS') return frutas
    if (activeCategory === 'TOPPINGS') return toppings
    if (activeCategory === 'PREMIUM') return caldasPremium
    return [...bases, ...frutas, ...toppings, ...caldasPremium]
  }, [activeCategory, bases, frutas, toppings, caldasPremium])

  return (
    <section id="guia-ingredientes" className="max-w-6xl mx-auto px-4 md:px-8 space-y-6">
      
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-4 text-left">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-pink-400 font-['Outfit']">
              Guia Completo do Cardápio
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 font-['Outfit']">
            Bases, Frutas Frescas & Acompanhamentos
          </h2>
          <p className="text-xs sm:text-sm text-purple-200/70 mt-1">
            Conheça todos os ingredientes selecionados que pode combinar no seu Açaí da Rose.
          </p>
        </div>

        {/* Filtros de Categoria */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
              activeCategory === 'ALL'
                ? 'bg-pink-600 text-white shadow-md'
                : 'bg-white/5 text-purple-300/80 hover:bg-white/10'
            }`}
          >
            Todos ({bases.length + frutas.length + toppings.length + caldasPremium.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('BASES')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
              activeCategory === 'BASES'
                ? 'bg-pink-600 text-white shadow-md'
                : 'bg-white/5 text-purple-300/80 hover:bg-white/10'
            }`}
          >
            🍨 Bases ({bases.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('FRUTAS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
              activeCategory === 'FRUTAS'
                ? 'bg-pink-600 text-white shadow-md'
                : 'bg-white/5 text-purple-300/80 hover:bg-white/10'
            }`}
          >
            🍓 Frutas ({frutas.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('TOPPINGS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
              activeCategory === 'TOPPINGS'
                ? 'bg-pink-600 text-white shadow-md'
                : 'bg-white/5 text-purple-300/80 hover:bg-white/10'
            }`}
          >
            🥣 Toppings ({toppings.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('PREMIUM')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
              activeCategory === 'PREMIUM'
                ? 'bg-amber-400 text-purple-950 shadow-md font-bold'
                : 'bg-white/5 text-amber-300/80 hover:bg-white/10'
            }`}
          >
            ⭐ Caldas Premium ({caldasPremium.length})
          </button>
        </div>
      </div>

      {/* Grade Visual de Ingredientes */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {allItems.map((item) => {
          return (
            <div
              key={`${item.category}-${item.id}`}
              className={`p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between ${
                item.active
                  ? item.isPremium
                    ? 'bg-gradient-to-b from-[#2d0545] to-[#1a022b] border-amber-400/40 shadow-md'
                    : 'bg-gradient-to-b from-[#230438] to-[#140124] border-white/10 hover:border-pink-500/40'
                  : 'bg-white/5 border-white/5 opacity-50'
              }`}
            >
              <div>
                {/* Emoji e Badge de Categoria */}
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-2xl">{item.emoji}</span>
                  {item.active ? (
                    item.isPremium ? (
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-400 text-purple-950">
                        +{formatCurrency(item.price || 1.0)}
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-0.5">
                        <Check className="h-2.5 w-2.5" />
                        <span>Disponível</span>
                      </span>
                    )
                  ) : (
                    <span className="text-[9px] font-bold text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/30 flex items-center gap-0.5">
                      <AlertCircle className="h-2.5 w-2.5" />
                      <span>Esgotado</span>
                    </span>
                  )}
                </div>

                {/* Nome do Ingrediente */}
                <div className="font-bold text-xs sm:text-sm text-white leading-tight">
                  {item.name}
                </div>

                {/* Categoria */}
                <div className="text-[10px] text-purple-300/60 mt-0.5">
                  {item.categoryLabel}
                </div>
              </div>

              {/* Status footer */}
              <div className="pt-2 mt-2 border-t border-white/5 text-[9px] text-purple-200/50">
                {item.active ? 'Incluso no cardápio' : 'Temporariamente indisponível'}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
