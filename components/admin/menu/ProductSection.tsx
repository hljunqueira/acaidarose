'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { formatCurrency } from '@/lib/i18n/formatters'
import { Pencil, Trash2, CheckCircle2, PauseCircle } from 'lucide-react'

interface ProductSectionProps {
  title: string
  items: any[]
  collection: 'containers' | 'bases' | 'toppings'
  isSuperAdmin: boolean
  onNew: (collection: any) => void
  onEdit: (collection: any, item: any) => void
  onDelete: (collection: any, id: string) => void
  onToggleAvailability: (collection: any, id: string, currentAvailable: boolean) => void
}

export default function ProductSection({
  title,
  items,
  collection,
  isSuperAdmin,
  onNew,
  onEdit,
  onDelete,
  onToggleAvailability,
}: ProductSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
            <span>{title}</span>
            <Badge variant="secondary" className="text-[10px] font-bold">
              {items.length} {items.length === 1 ? 'item' : 'itens'}
            </Badge>
          </h3>
        </div>

        {isSuperAdmin && (
          <Button size="sm" variant="outline" onClick={() => onNew(collection)} className="text-xs h-8 px-3 rounded-xl font-bold border-purple-200 hover:bg-purple-50">
            <span>Adicionar Item Master</span>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item) => {
          const isAvailable = item.isAvailableInStore !== false
          const hasImage = Boolean(item.image)

          return (
            <Card
              key={item.id}
              className={`p-3.5 flex flex-col justify-between border-2 rounded-2xl transition-all duration-200 ${
                isAvailable
                  ? 'bg-white border-purple-100 hover:border-purple-300 shadow-xs'
                  : 'bg-amber-50/40 border-amber-200 opacity-80'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Foto Real de Alta Qualidade */}
                  <div className="h-12 w-12 rounded-xl overflow-hidden bg-purple-50 border border-purple-100 flex-shrink-0 flex items-center justify-center">
                    {hasImage ? (
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="text-xs font-black text-purple-700">{item.name.slice(0, 3)}</div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="font-extrabold text-xs text-foreground truncate leading-tight flex items-center gap-1.5">
                      <span>{item.name}</span>
                      {item.isSpecialAddon && (
                        <Badge className="bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white text-[8px] py-0 px-1 font-black">
                          Especial
                        </Badge>
                      )}
                    </div>

                    <div className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                      {collection === 'containers' && (
                        <span>
                          <strong className="text-purple-900">{formatCurrency(item.precoBase)}</strong>
                          {' · '}
                          {item.weightGrams <= 350
                            ? `${item.limiteFrutas} frutas + ${item.limiteToppings} toppings`
                            : 'Frutas e Toppings Livres'}
                        </span>
                      )}

                      {collection === 'bases' && (
                        <span>{item.description || '1 creme opcional incluso'}</span>
                      )}

                      {collection === 'toppings' && (
                        <span>
                          {item.isSpecialAddon ? (
                            <span className="text-fuchsia-800 font-bold">
                              +{formatCurrency(item.priceTierLow || 1)} (até 500g) / +{formatCurrency(item.priceTierHigh || 2)} (acima 500g)
                            </span>
                          ) : (
                            <span>{item.category || 'Topping'} · Incluso no açaí</span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {isSuperAdmin && (
                  <div className="flex items-center gap-0.5">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(collection, item)} className="h-7 w-7 rounded-lg text-muted-foreground hover:text-purple-900">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(collection, item.id)} className="h-7 w-7 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Linha Inferior: Switch de Disponibilidade Local */}
              <div className="mt-3 pt-2.5 border-t border-purple-50 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] font-bold">
                  {isAvailable ? (
                    <span className="text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Disponível no Balcão
                    </span>
                  ) : (
                    <span className="text-amber-700 flex items-center gap-1">
                      <PauseCircle className="h-3 w-3" /> Pausado / Esgotado
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {isAvailable ? 'Ativo' : 'Pausado'}
                  </span>
                  <Switch
                    checked={isAvailable}
                    onCheckedChange={() => onToggleAvailability(collection, item.id, isAvailable)}
                    className="data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-amber-400"
                  />
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
