'use client'

import React, { useState, useMemo } from 'react'
import { CatalogData, ProductContainer, ProductTopping, ProductBase } from '@/types'
import { formatCurrency } from '@/lib/i18n/formatters'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, X, Plus, Heart } from 'lucide-react'

interface CustomerMenuSearchProps {
  catalog: CatalogData
  onSelectContainer: (c: ProductContainer) => void
}

export default function CustomerMenuSearch({ catalog, onSelectContainer }: CustomerMenuSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const tags = [
    { id: 'all', label: 'Todos os Itens', count: (catalog.containers?.length || 5) + (catalog.bases?.length || 10) + (catalog.toppings?.length || 25) },
    { id: 'copos', label: 'Copos & Tamanhos', count: catalog.containers?.length || 5 },
    { id: 'bases', label: 'Cremes & Bases', count: catalog.bases?.length || 10 },
    { id: 'frutas', label: 'Frutas Frescas', count: 5 },
    { id: 'toppings', label: 'Toppings & Crocantes', count: 17 },
    { id: 'caldas', label: 'Caldas & Especiais', count: 3 },
  ]

  const containers = catalog.containers || []
  const bases = catalog.bases || []
  const toppings = catalog.toppings || []

  // Filtragem inteligente por termo e categoria
  const filteredContainers = useMemo(() => {
    return containers.filter((c) => {
      const matchText =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
      if (!matchText) return false
      if (activeCategory === 'all' || activeCategory === 'copos') return true
      return false
    })
  }, [containers, searchTerm, activeCategory])

  const filteredBases = useMemo(() => {
    return bases.filter((b) => {
      const matchText =
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.description && b.description.toLowerCase().includes(searchTerm.toLowerCase()))
      if (!matchText) return false
      if (activeCategory === 'all' || activeCategory === 'bases') return true
      return false
    })
  }, [bases, searchTerm, activeCategory])

  const filteredToppings = useMemo(() => {
    return toppings.filter((t) => {
      const matchText = t.name.toLowerCase().includes(searchTerm.toLowerCase())
      if (!matchText) return false

      if (activeCategory === 'all') return true
      if (activeCategory === 'frutas') {
        return t.category === 'Frutas' || ['banana', 'morango', 'kiwi', 'manga', 'uva'].some((f) => t.name.toLowerCase().includes(f))
      }
      if (activeCategory === 'toppings') {
        return !t.isPremium && t.category !== 'Frutas' && t.category !== 'Adicionais' && !['banana', 'morango', 'kiwi', 'manga', 'uva'].some((f) => t.name.toLowerCase().includes(f))
      }
      if (activeCategory === 'caldas') {
        return t.isPremium || t.category === 'Adicionais' || (t.precoExtra && t.precoExtra > 0)
      }
      return false
    })
  }, [toppings, searchTerm, activeCategory])

  const totalResults = filteredContainers.length + filteredBases.length + filteredToppings.length

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 space-y-6 pb-28">
      {/* 1. Barra de Busca Ampla e Fluida */}
      <div className="relative max-w-2xl mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-300 h-5 w-5 pointer-events-none" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="O que deseja saborear hoje? (ex: 500g, morango, nutella, ninho...)"
          className="h-14 pl-12 pr-12 rounded-3xl bg-[#1e0333]/90 border border-white/20 text-white placeholder:text-purple-300/50 text-sm focus:ring-2 focus:ring-fuchsia-500 shadow-xl"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs text-purple-200 hover:text-white transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* 2. Pílulas de Filtro Rápido */}
      <div className="flex flex-wrap items-center justify-center gap-2 select-none">
        {tags.map((tag) => {
          const isSelected = activeCategory === tag.id
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => setActiveCategory(tag.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 border ${
                isSelected
                  ? 'bg-gradient-to-r from-fuchsia-600 to-purple-700 text-white border-fuchsia-400/50 shadow-lg shadow-purple-950/40 scale-105'
                  : 'bg-[#1d0332]/90 text-purple-200/80 border-white/10 hover:bg-purple-900/40 hover:text-white'
              }`}
            >
              <span>{tag.label}</span>
              <Badge
                className={`text-[9px] py-0 px-1.5 font-bold ${
                  isSelected ? 'bg-white/20 text-white border-0' : 'bg-white/10 text-purple-200 border-0'
                }`}
              >
                {tag.count}
              </Badge>
            </button>
          )
        })}
      </div>

      {/* 3. Resultados em Grade Ampla */}
      <div className="space-y-6 pt-2">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <span className="text-xs font-black uppercase tracking-wider text-white">
            Resultados Encontrados ({totalResults})
          </span>
          {searchTerm && (
            <span className="text-xs text-purple-300">
              Buscando por: <b className="text-fuchsia-300">"{searchTerm}"</b>
            </span>
          )}
        </div>

        {totalResults === 0 ? (
          <div className="py-16 text-center text-xs text-purple-300/60 bg-white/5 rounded-3xl border border-white/10 flex flex-col items-center justify-center">
            <Search className="h-8 w-8 text-purple-400 mb-2 opacity-50" />
            Nenhum item encontrado para esta busca. Tente buscar por outro sabor ou tamanho!
          </div>
        ) : (
          <div className="space-y-6">
            {/* Copos Encontrados */}
            {filteredContainers.length > 0 && (
              <div className="space-y-3">
                <div className="text-xs font-black text-fuchsia-300 uppercase tracking-wider">
                  Copos & Tamanhos de Açaí
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredContainers.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => onSelectContainer(c)}
                      className="p-4 rounded-3xl bg-[#1e0333]/90 border border-white/10 hover:border-fuchsia-500/50 hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-between group shadow-md"
                    >
                      <div>
                        <div className="font-extrabold text-sm text-white group-hover:text-fuchsia-200">
                          {c.name}
                        </div>
                        <div className="text-[11px] text-purple-300/70">{c.description || 'Taça personalizável'}</div>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-sm text-emerald-400 font-mono">
                          {formatCurrency(c.precoBase || 6.50)}
                        </span>
                        <div className="text-[10px] text-purple-400 font-semibold">Montar →</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bases & Toppings Encontrados */}
            {(filteredBases.length > 0 || filteredToppings.length > 0) && (
              <div className="space-y-3">
                <div className="text-xs font-black text-purple-300 uppercase tracking-wider">
                  Ingredientes & Acompanhamentos
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {filteredBases.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => onSelectContainer(containers[0])}
                      className="p-3.5 rounded-3xl bg-[#1e0333]/90 border border-white/10 hover:border-purple-400/40 transition-all cursor-pointer flex flex-col items-center text-center group shadow-md"
                    >
                      <div className="font-bold text-xs text-white group-hover:text-purple-200 truncate w-full">
                        {b.name}
                      </div>
                      <div className="text-[9px] text-emerald-400 font-bold mt-0.5">Base Gelada</div>
                    </div>
                  ))}

                  {filteredToppings.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => onSelectContainer(containers[1] || containers[0])}
                      className="p-3.5 rounded-3xl bg-[#1e0333]/90 border border-white/10 hover:border-purple-400/40 transition-all cursor-pointer flex flex-col items-center text-center group shadow-md"
                    >
                      <div className="font-bold text-xs text-white group-hover:text-purple-200 truncate w-full">
                        {t.name}
                      </div>
                      <div className="text-[9px] text-purple-300 font-bold mt-0.5">
                        {t.isPremium ? `+${formatCurrency(t.priceTierLow || 1.0)}` : 'Incluso'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
