'use client'

import React, { useState, useMemo } from 'react'
import { CatalogData, ProductContainer } from '@/types'
import { formatCurrency } from '@/lib/i18n/formatters'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, X } from 'lucide-react'

interface CustomerMenuSearchProps {
  catalog: CatalogData
  onSelectContainer: (c: ProductContainer) => void
}

export default function CustomerMenuSearch({ catalog, onSelectContainer }: CustomerMenuSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const containers = useMemo(() => {
    return (catalog.containers || []).filter(
      (c) => c.active !== false && c.isAvailableInStore !== false
    )
  }, [catalog.containers])

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const cat of catalog.categories || []) {
      if (cat?.id && cat?.name) {
        map.set(cat.id, cat.name)
      }
    }
    return map
  }, [catalog.categories])

  const getProductCategoryLabel = (c: ProductContainer): string => {
    const fromMap = c.categoryId ? categoryMap.get(c.categoryId) : undefined
    const explicit = (c as any).categoryName || fromMap
    return explicit ? String(explicit).trim() : 'Produtos'
  }

  const categoryTags = useMemo(() => {
    const counts = new Map<string, number>()
    for (const c of containers) {
      const label = getProductCategoryLabel(c)
      counts.set(label, (counts.get(label) || 0) + 1)
    }
    const list: Array<{ id: string; label: string; count: number }> = [
      { id: 'all', label: 'Todos os Produtos', count: containers.length },
    ]
    for (const [label, count] of counts.entries()) {
      list.push({ id: label, label, count })
    }
    return list
  }, [containers, categoryMap])

  const filteredContainers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    return containers.filter((c) => {
      if (activeCategory !== 'all' && getProductCategoryLabel(c) !== activeCategory) {
        return false
      }
      if (!q) return true
      const catLabel = getProductCategoryLabel(c).toLowerCase()
      return (
        c.name.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q)) ||
        catLabel.includes(q)
      )
    })
  }, [containers, searchTerm, activeCategory, categoryMap])

  const totalResults = filteredContainers.length

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 space-y-6 pb-4 text-slate-900 dark:text-white transition-colors duration-200">
      {/* 1. Barra de Busca de Produtos */}
      <div className="relative max-w-2xl mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 dark:text-purple-300 h-5 w-5 pointer-events-none" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Pesquisar produto... (ex: Copo 500g, Tapioca, Pão de Queijo...)"
          className="h-14 pl-12 pr-12 rounded-3xl bg-white border border-purple-200 text-slate-900 placeholder:text-slate-400 dark:bg-[#1e0333]/90 dark:border-white/20 dark:text-white dark:placeholder:text-purple-300/50 text-sm focus:ring-2 focus:ring-fuchsia-500 shadow-md dark:shadow-xl"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-purple-100 dark:bg-white/10 hover:bg-purple-200 dark:hover:bg-white/20 flex items-center justify-center text-xs text-purple-800 dark:text-purple-200 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* 2. Pílulas Dinâmicas por Categoria de Produto */}
      {categoryTags.length > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2 select-none">
          {categoryTags.map((tag) => {
            const isSelected = activeCategory === tag.id
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => setActiveCategory(tag.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-gradient-to-r from-fuchsia-600 to-purple-700 text-white border-fuchsia-400/50 shadow-md scale-102'
                    : 'bg-white text-slate-700 border-purple-100 hover:bg-purple-50 dark:bg-[#1d0332]/90 dark:text-purple-200/80 dark:border-white/10 dark:hover:bg-purple-900/40 dark:hover:text-white'
                }`}
              >
                <span>{tag.label}</span>
                <Badge
                  className={`text-[9px] py-0 px-1.5 font-bold ${
                    isSelected
                      ? 'bg-white/20 text-white border-0'
                      : 'bg-purple-100 text-purple-900 dark:bg-white/10 dark:text-purple-200 border-0'
                  }`}
                >
                  {tag.count}
                </Badge>
              </button>
            )
          })}
        </div>
      )}

      {/* 3. Resultados de Produtos */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b border-purple-100 dark:border-white/10 pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            {activeCategory === 'all' ? 'Produtos' : activeCategory} ({totalResults})
          </span>
          {searchTerm && (
            <span className="text-xs text-slate-500 dark:text-purple-300">
              A pesquisar por: <b className="text-fuchsia-600 dark:text-fuchsia-300">&quot;{searchTerm}&quot;</b>
            </span>
          )}
        </div>

        {totalResults === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500 dark:text-purple-300/60 bg-white dark:bg-white/5 rounded-3xl border border-purple-100 dark:border-white/10 flex flex-col items-center justify-center shadow-sm">
            <Search className="h-8 w-8 text-purple-400 mb-2 opacity-50" />
            Nenhum produto encontrado para esta pesquisa.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredContainers.map((c) => {
              const thumb =
                (c as any).image ||
                (c as any).imageUrl ||
                (c as any).image_url ||
                (c as any).videoPoster ||
                null
              return (
              <div
                key={c.id}
                onClick={() => onSelectContainer(c)}
                className="p-4 rounded-3xl bg-white border border-purple-100 hover:border-fuchsia-500/50 hover:scale-[1.01] dark:bg-[#1e0333]/90 dark:border-white/10 dark:hover:border-fuchsia-500/50 transition-all cursor-pointer flex items-center justify-between gap-3 group shadow-sm dark:shadow-md"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={c.name}
                      className="w-12 h-12 rounded-2xl object-cover border border-purple-100 dark:border-white/10 shrink-0"
                    />
                  ) : null}
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-fuchsia-600 dark:group-hover:text-fuchsia-200 truncate">
                      {c.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-purple-300/70 line-clamp-1">
                      {c.description || getProductCategoryLabel(c)}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400 font-mono">
                    {formatCurrency(c.precoBase ?? 0)}
                  </span>
                  <div className="text-[10px] text-fuchsia-600 dark:text-purple-400 font-medium">
                    Pedir →
                  </div>
                </div>
              </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
