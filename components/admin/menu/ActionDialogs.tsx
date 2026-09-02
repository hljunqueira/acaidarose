'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/i18n/formatters'
import { Trash2 } from 'lucide-react'

interface ActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: any
  tenantId: string
  onSuccess?: () => void
}

// 1. MODAL: "Atualizar esse produto nas filiais" (Screenshot 1)
export function ReplicateStoreDialog({ open, onOpenChange, product }: ActionDialogProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectAll, setSelectAll] = useState(true)
  const [selectedStores, setSelectedStores] = useState<Record<string, boolean>>({
    'loja-1': true,
    'loja-2': true,
    'loja-3': true,
  })
  const [loading, setLoading] = useState(false)

  const STORES = [
    { id: 'loja-1', name: 'Açaí da Rose - Matriz (Torres Novas)' },
    { id: 'loja-2', name: 'Açaí da Rose - Filial Aveiro' },
    { id: 'loja-3', name: 'Açaí da Rose - Filial Porto' },
  ]

  const toggleSelectAll = () => {
    const next = !selectAll
    setSelectAll(next)
    setSelectedStores({
      'loja-1': next,
      'loja-2': next,
      'loja-3': next,
    })
  }

  const toggleStore = (id: string) => {
    setSelectedStores((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      toast.success(`"${product?.name}" atualizado e sincronizado com as filiais selecionadas!`)
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  if (!product) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full max-w-lg max-h-[90vh] overflow-y-auto p-0 bg-white dark:bg-[#160228] text-slate-900 dark:text-white rounded-2xl border border-zinc-200 dark:border-white/15 shadow-2xl flex flex-col">
        <div className="p-5 border-b border-zinc-100">
          <DialogTitle className="text-lg font-bold text-zinc-800">
            Atualizar esse produto nas filiais
          </DialogTitle>
        </div>

        <div className="p-5 space-y-4">
          {/* Busca */}
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Digite o nome do Restaurante"
            className="h-10 text-xs rounded-sm border-zinc-300"
          />

          {/* Lista de Checkboxes */}
          <div className="space-y-0 text-xs border border-zinc-200 rounded-sm divide-y divide-zinc-200">
            {/* Selecionar todas as lojas */}
            <label className="flex items-center gap-3 p-3 bg-zinc-50/70 hover:bg-zinc-100/70 cursor-pointer">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span className="font-medium text-zinc-700">Selecionar todas as lojas</span>
            </label>

            {STORES.filter((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map((store, idx) => (
              <label
                key={store.id}
                className={`flex items-center gap-3 p-3 cursor-pointer transition ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-zinc-50/50'
                } hover:bg-blue-50/40`}
              >
                <input
                  type="checkbox"
                  checked={!!selectedStores[store.id]}
                  onChange={() => toggleStore(store.id)}
                  className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-zinc-800">{store.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="p-4 bg-zinc-50/60 border-t border-zinc-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-300 rounded-sm hover:bg-zinc-100 cursor-pointer uppercase shadow-2xs"
          >
            FECHAR
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold text-white bg-[#00a86b] hover:bg-[#00925d] rounded-sm cursor-pointer uppercase shadow-xs"
          >
            {loading ? 'SALVANDO...' : 'SALVAR'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// 2. MODAL: "Duplicar Item" (Screenshot 3)
export function DuplicateItemDialog({ open, onOpenChange, product }: ActionDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleDuplicate = async () => {
    setLoading(true)
    try {
      toast.success(`"${product?.name}" duplicado com sucesso no cardápio!`)
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  if (!product) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full max-w-md max-h-[90vh] overflow-y-auto p-0 bg-white dark:bg-[#160228] text-slate-900 dark:text-white rounded-2xl border border-zinc-200 dark:border-white/15 shadow-2xl flex flex-col">
        <div className="p-4 border-b border-zinc-100">
          <DialogTitle className="text-base font-bold text-zinc-800">
            Duplicar Item
          </DialogTitle>
        </div>

        <div className="p-6 space-y-5 text-center">
          <h3 className="text-base font-bold text-zinc-800">
            Tem certeza que deseja Duplicar o seguinte item?
          </h3>

          <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-lg flex items-center gap-4 text-left">
            <div className="h-16 w-16 rounded-md overflow-hidden bg-zinc-200 flex-shrink-0 border border-zinc-200">
              <img
                src={product.image || 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600&auto=format&fit=crop&q=80'}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="space-y-1">
              <div className="text-xs">
                <span className="font-bold text-zinc-500 mr-2">Nome</span>
                <span className="font-bold text-zinc-800">{product.name}</span>
              </div>
              <div className="text-xs">
                <span className="font-bold text-zinc-500 mr-2">Descrição</span>
                <span className="text-zinc-600 line-clamp-2">
                  {product.description && product.description.trim() ? product.description.trim() : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-zinc-50/60 border-t border-zinc-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-300 rounded-sm hover:bg-zinc-100 cursor-pointer uppercase shadow-2xs"
          >
            FECHAR
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleDuplicate}
            className="px-5 py-2 text-xs font-bold text-white bg-[#d92534] hover:bg-[#c21e2c] rounded-sm cursor-pointer uppercase shadow-xs"
          >
            {loading ? 'DUPLICANDO...' : 'DUPLICAR'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// 2.5. MODAL: "Excluir Item" (Screenshot 6)
export function DeleteItemDialog({ open, onOpenChange, product, onSuccess }: ActionDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      if (onSuccess) onSuccess()
      toast.success(`"${product?.name}" excluído com sucesso do cardápio!`)
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  if (!product) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full max-w-md max-h-[90vh] overflow-y-auto p-0 bg-white dark:bg-[#160228] text-slate-900 dark:text-white rounded-2xl border border-zinc-200 dark:border-white/15 shadow-2xl flex flex-col">
        <div className="p-4 border-b border-zinc-100">
          <DialogTitle className="text-base font-bold text-zinc-800">
            Excluir Item
          </DialogTitle>
        </div>

        <div className="p-6 space-y-5 text-center">
          <h3 className="text-base font-bold text-zinc-800">
            Tem certeza que deseja excluir o seguinte item?
          </h3>

          <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-lg flex items-center gap-4 text-left">
            <div className="h-16 w-16 rounded-md overflow-hidden bg-zinc-200 flex-shrink-0 border border-zinc-200">
              <img
                src={product.image || 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600&auto=format&fit=crop&q=80'}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="space-y-1">
              <div className="text-xs">
                <span className="font-bold text-zinc-500 mr-2">Nome</span>
                <span className="font-bold text-zinc-800">{product.name}</span>
              </div>
              <div className="text-xs">
                <span className="font-bold text-zinc-500 mr-2">Descrição</span>
                <span className="text-zinc-600 line-clamp-2">
                  {product.description && product.description.trim() ? product.description.trim() : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-zinc-50/60 border-t border-zinc-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-300 rounded-sm hover:bg-zinc-100 cursor-pointer uppercase shadow-2xs"
          >
            FECHAR
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleDelete}
            className="px-5 py-2 text-xs font-bold text-white bg-[#d92534] hover:bg-[#c21e2c] rounded-sm cursor-pointer uppercase shadow-xs"
          >
            {loading ? 'EXCLUINDO...' : 'EXCLUIR'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// 3. MODAL: "Horários ativos do produto" (Screenshot 4)
export function ActiveHoursDialog({ open, onOpenChange, product }: ActionDialogProps) {
  const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
  const [dayHours, setDayHours] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const handleAddHour = (day: string) => {
    setDayHours((prev) => ({
      ...prev,
      [day]: prev[day] ? '' : '13:00 - 22:00',
    }))
  }

  const handleSave = () => {
    toast.success(`Horários de funcionamento salvos para "${product?.name}"!`)
    onOpenChange(false)
  }

  if (!product) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full max-w-md max-h-[90vh] overflow-y-auto p-0 bg-white dark:bg-[#160228] text-slate-900 dark:text-white rounded-2xl border border-zinc-200 dark:border-white/15 shadow-2xl flex flex-col">
        <div className="p-4 border-b border-zinc-100">
          <DialogTitle className="text-base font-bold text-zinc-800">
            Horários ativos do produto
          </DialogTitle>
        </div>

        <div className="p-5 space-y-4">
          {/* Caixa Informativa Azul Claro */}
          <div className="p-3.5 rounded-sm bg-[#e6f4fb] text-[#006699] text-xs leading-relaxed">
            <div><b>Sem</b> horário definido, estará <b>sempre</b> ativo.</div>
            <div><b>Com</b> horário definido, estará ativo <b>apenas</b> no período.</div>
          </div>

          {/* Tabela de Dias da Semana */}
          <div className="border-t border-zinc-200 divide-y divide-zinc-200 text-xs">
            <div className="py-2.5 flex items-center justify-between font-bold text-zinc-700 tracking-wider">
              <span>DIAS DA SEMANA</span>
              <span>HORÁRIOS</span>
            </div>

            {DAYS.map((day) => (
              <div key={day} className="py-2.5 flex items-center justify-between text-zinc-800">
                <span>{day}</span>
                <div className="flex items-center gap-2">
                  {dayHours[day] && (
                    <span className="text-[11px] font-mono bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                      {dayHours[day]}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleAddHour(day)}
                    className="h-6 w-6 rounded flex items-center justify-center text-emerald-600 hover:bg-emerald-50 text-base font-bold cursor-pointer transition"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-zinc-50/60 border-t border-zinc-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-300 rounded-sm hover:bg-zinc-100 cursor-pointer uppercase shadow-2xs"
          >
            FECHAR
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold text-white bg-[#1976d2] hover:bg-[#1565c0] rounded-sm cursor-pointer uppercase shadow-xs"
          >
            SALVAR
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// 4. MODAL: "Harmoniza com" (Screenshot 5)
export function PairingDialog({ open, onOpenChange, product }: ActionDialogProps) {
  const [items, setItems] = useState<string[]>(['Água Mineral 500ml'])

  const handleAddItem = () => {
    setItems((prev) => [...prev, ''])
  }

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    toast.success(`Harmonização configurada com sucesso para "${product?.name}"!`)
    onOpenChange(false)
  }

  if (!product) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full max-w-lg max-h-[90vh] overflow-y-auto p-0 bg-white dark:bg-[#160228] text-slate-900 dark:text-white rounded-2xl border border-zinc-200 dark:border-white/15 shadow-2xl flex flex-col">
        <div className="p-4 border-b border-zinc-100">
          <DialogTitle className="text-base font-bold text-zinc-800">
            Harmoniza com
          </DialogTitle>
        </div>

        <div className="p-5 space-y-4">
          {/* Card do Produto */}
          <div className="p-3 bg-zinc-50/70 border border-zinc-100 rounded-lg flex items-center gap-3.5 text-left">
            <div className="h-14 w-14 rounded-md overflow-hidden bg-zinc-200 flex-shrink-0 border border-zinc-200">
              <img
                src={product.image || 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600&auto=format&fit=crop&q=80'}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="space-y-0.5">
              <div className="text-xs">
                <span className="font-bold text-zinc-500 mr-2">Nome</span>
                <span className="font-bold text-zinc-800">{product.name}</span>
              </div>
              <div className="text-xs">
                <span className="font-bold text-zinc-500 mr-2">Descrição</span>
                <span className="text-zinc-600 line-clamp-1">
                  {product.description || (product.weightGrams ? `${product.weightGrams}g com regras de personalização` : 'Item do cardápio')}
                </span>
              </div>
            </div>
          </div>

          {/* Inputs de Harmonização */}
          <div className="space-y-2 pt-1">
            {items.map((itemVal, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  value={itemVal}
                  onChange={(e) => {
                    const next = [...items]
                    next[idx] = e.target.value
                    setItems(next)
                  }}
                  placeholder="Selecione um Item"
                  className="h-9 text-xs rounded-sm border-zinc-300 flex-1"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveItem(idx)}
                  className="p-2 text-zinc-500 hover:text-red-600 transition cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddItem}
              className="px-3 py-1.5 rounded-sm bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs cursor-pointer shadow-xs mt-2"
            >
              <span>Adicionar outro item</span>
            </button>
          </div>
        </div>

        <div className="p-4 bg-zinc-50/60 border-t border-zinc-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-300 rounded-sm hover:bg-zinc-100 cursor-pointer uppercase shadow-2xs"
          >
            FECHAR
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold text-white bg-[#1976d2] hover:bg-[#1565c0] rounded-sm cursor-pointer uppercase shadow-xs"
          >
            SALVAR
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// 5. MODAL: "Horário Promocional" (ActionDialogs)
export function PromoHoursDialog({ open, onOpenChange, product }: ActionDialogProps) {
  const [promoPrice, setPromoPrice] = useState(product?.precoBase ? (product.precoBase * 0.9).toFixed(2) : '10.00')

  const handleSave = () => {
    toast.success(`Promoção configurada para "${product?.name}"!`)
    onOpenChange(false)
  }

  if (!product) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full max-w-md max-h-[90vh] overflow-y-auto p-0 bg-white dark:bg-[#160228] text-slate-900 dark:text-white rounded-2xl border border-zinc-200 dark:border-white/15 shadow-2xl flex flex-col">
        <div className="p-4 border-b border-zinc-100">
          <DialogTitle className="text-base font-bold text-zinc-800">
            Horário Promocional / Happy Hour
          </DialogTitle>
        </div>

        <div className="p-5 space-y-3 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-zinc-700">Preço Promocional (€)</label>
            <Input
              type="number"
              step="0.01"
              value={promoPrice}
              onChange={(e) => setPromoPrice(e.target.value)}
              className="h-9 text-xs font-mono font-bold"
            />
          </div>
        </div>

        <div className="p-4 bg-zinc-50/60 border-t border-zinc-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-300 rounded-sm hover:bg-zinc-100 cursor-pointer uppercase shadow-2xs"
          >
            FECHAR
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold text-white bg-[#1976d2] hover:bg-[#1565c0] rounded-sm cursor-pointer uppercase shadow-xs"
          >
            SALVAR
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
