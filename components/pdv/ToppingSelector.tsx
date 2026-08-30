import React, { useState } from 'react'
import { ProductContainer, ProductTopping } from '@/types'
import { formatCurrency } from '@/lib/i18n/formatters'
import { getPremiumToppingPrice } from '@/lib/stores/cartStore'
import { Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ToppingSelectorProps {
  toppings: ProductTopping[]
  container: ProductContainer
  selectedToppings: ProductTopping[]
  onToggleTopping: (topping: ProductTopping) => void
}

const CATEGORIES = [
  { key: 'Todos', label: 'Todos' },
  { key: 'Frutas', label: 'Frutas' },
  { key: 'Toppings', label: 'Toppings' },
  { key: 'Adicionais', label: 'Especiais' },
]

export default function ToppingSelector({
  toppings,
  container,
  selectedToppings,
  onToggleTopping,
}: ToppingSelectorProps) {
  const [activeCategory, setActiveCategory] = useState('Todos')

  const isUnlimited = container.weightGrams >= 500
  const frutaLimit = container.limiteFrutas || (isUnlimited ? 999 : container.weightGrams === 250 ? 2 : 3)
  const toppingLimit = container.limiteToppings || (isUnlimited ? 999 : 3)

  const selectedFrutas = selectedToppings.filter((t) => t.category === 'Frutas' || ['banana', 'morango', 'kiwi', 'manga', 'uva', 'abacaxi'].some((f) => t.name.toLowerCase().includes(f)))
  const selectedAdicionais = selectedToppings.filter((t) => t.category === 'Adicionais' || t.isSpecialAddon || t.isPremium || (t.precoExtra && t.precoExtra > 0))
  const selectedToppingsList = selectedToppings.filter((t) => !selectedFrutas.includes(t) && !selectedAdicionais.includes(t))

  const isOver500g = container.weightGrams > 500

  const getAddonPrice = (t: ProductTopping) => {
    return getPremiumToppingPrice(t.name, container.weightGrams, t.precoExtra)
  }

  const filtered = toppings.filter((t) => {
    if (t.active === false) return false
    if (activeCategory === 'Todos') return true
    if (activeCategory === 'Frutas') return t.category === 'Frutas'
    if (activeCategory === 'Toppings') return t.category === 'Toppings' || t.category === 'Cereais' || t.category === 'Doces'
    if (activeCategory === 'Adicionais') return t.category === 'Adicionais' || t.isSpecialAddon
    return true
  })

  return (
    <div className="space-y-4">
      {/* Header com contadores e filtros de categoria */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-purple-50/70 p-3.5 rounded-2xl border border-purple-100">
        <div>
          <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight">
            Frutas, Toppings & Adicionais
          </h2>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
            {isUnlimited ? (
              <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                <span>Frutas & Toppings Livres</span>
              </span>
            ) : (
              <>
                <span className="bg-purple-100 text-purple-900 font-bold px-2 py-0.5 rounded-md">
                  Frutas: {selectedFrutas.length}/{frutaLimit}
                </span>
                <span className="bg-fuchsia-100 text-fuchsia-900 font-bold px-2 py-0.5 rounded-md">
                  Toppings: {selectedToppingsList.length}/{toppingLimit}
                </span>
              </>
            )}
            {selectedAdicionais.length > 0 && (
              <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-md">
                Especiais: {selectedAdicionais.length}
              </span>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setActiveCategory(cat.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all duration-150 whitespace-nowrap cursor-pointer ${activeCategory === cat.key
                  ? 'bg-purple-700 text-white shadow-md shadow-purple-600/25 ring-2 ring-purple-400/40'
                  : 'bg-white hover:bg-purple-100 text-muted-foreground hover:text-purple-900 border border-purple-100'
                }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Toppings em Cards Modernos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
        {filtered.map((t) => {
          const isSelected = selectedToppings.some((x) => x.id === t.id)
          const isAvailable = t.isAvailableInStore !== false
          const isSpecial = t.isSpecialAddon || t.category === 'Adicionais'
          const addonPrice = getAddonPrice(t)

          return (
            <button
              key={t.id}
              type="button"
              disabled={!isAvailable}
              onClick={() => isAvailable && onToggleTopping(t)}
              className={`relative p-3 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center justify-between text-center min-h-[120px] ${!isAvailable
                  ? 'border-border/60 bg-muted/40 opacity-60 cursor-not-allowed'
                  : isSelected
                    ? isSpecial
                      ? 'border-amber-500 bg-amber-50/90 shadow-lg shadow-amber-500/15 ring-2 ring-amber-400/30 scale-[1.02] cursor-pointer'
                      : 'border-purple-600 bg-purple-50/90 shadow-lg shadow-purple-600/15 ring-2 ring-purple-400/30 scale-[1.02] cursor-pointer'
                    : 'border-purple-100/80 hover:border-purple-300 hover:shadow-md bg-white hover:scale-[1.01] cursor-pointer'
                }`}
            >
              {/* Status / Checkmark no canto */}
              {!isAvailable ? (
                <div className="absolute top-1.5 right-1.5">
                  <Badge variant="destructive" className="text-[8px] py-0 px-1 font-bold">
                    Esgotado
                  </Badge>
                </div>
              ) : (
                <div
                  className={`absolute top-2 right-2 h-5 w-5 rounded-full flex items-center justify-center transition-all ${isSelected
                      ? isSpecial
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-purple-600 text-white shadow-xs'
                      : 'border border-muted-foreground/20 bg-muted/20 text-transparent opacity-40'
                    }`}
                >
                  <Check className={`h-3 w-3 stroke-[3] ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                </div>
              )}

              {/* Emoji Backdrop */}
              <div
                className={`h-10 w-10 rounded-2xl flex items-center justify-center text-2xl transition-transform ${isSpecial ? 'bg-amber-100 shadow-inner' : 'bg-purple-100 shadow-inner'
                  }`}
              >
                {t.emoji || '🫐'}
              </div>

              {/* Nome */}
              <div className="font-black text-xs text-foreground mt-1.5 leading-tight line-clamp-1">
                {t.name}
              </div>

              {/* Preço / Tag */}
              <div className="mt-1">
                {isSpecial ? (
                  <span className="text-[10px] font-black text-amber-900 bg-amber-200/90 px-2 py-0.5 rounded-md">
                    +{formatCurrency(addonPrice)}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                    Incluso
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
