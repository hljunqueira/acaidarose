'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/i18n/formatters'
import {
  GripVertical,
  Eye,
  Trash2,
  HelpCircle,
  Camera,
  Layers,
  Plus,
  Search,
  Info,
} from 'lucide-react'

export interface OptionItem {
  id: string
  name: string
  code: string
  price: number
  description: string
  image?: string
  active?: boolean
}

export interface OptionModelData {
  id?: string
  name: string
  priceType: 'Gratis' | 'Individual'
  additionalPrice?: number
  minQty: number
  maxQty: number
  allowItemQuantity?: boolean
  isRequired: boolean
  showDetailed?: boolean
  options: OptionItem[]
}

interface OptionModelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialModel?: OptionModelData | null
  onSave?: (model: OptionModelData) => void
}

export default function OptionModelDialog({
  open,
  onOpenChange,
  initialModel,
  onSave,
}: OptionModelDialogProps) {
  const [name, setName] = useState('')
  const [priceType, setPriceType] = useState<'Gratis' | 'Individual'>('Individual')
  const [additionalPrice, setAdditionalPrice] = useState<number | string>(0.50)
  const [minQty, setMinQty] = useState<number>(1)
  const [maxQty, setMaxQty] = useState<number>(1)
  const [allowItemQuantity, setAllowItemQuantity] = useState<boolean>(true)
  const [isRequired, setIsRequired] = useState<boolean>(true)
  const [showDetailed, setShowDetailed] = useState<boolean>(false)
  const [options, setOptions] = useState<OptionItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (open) {
      setSearchTerm('')
      if (initialModel) {
        setName(initialModel.name || '')
        setPriceType(initialModel.priceType || 'Individual')
        setAdditionalPrice(initialModel.additionalPrice !== undefined ? initialModel.additionalPrice : (initialModel.priceType === 'Individual' ? 0.50 : 0.00))
        setMinQty(initialModel.minQty ?? 1)
        setMaxQty(initialModel.maxQty ?? 1)
        setAllowItemQuantity(initialModel.allowItemQuantity ?? true)
        setIsRequired(initialModel.isRequired ?? true)
        setShowDetailed(initialModel.showDetailed ?? false)
        setOptions(
          initialModel.options && initialModel.options.length > 0
            ? initialModel.options
            : [{ id: `opt-${Date.now()}`, name: '', code: '101', price: initialModel.additionalPrice || 0.0, description: '', active: true }]
        )
      } else {
        setName('')
        setPriceType('Individual')
        setAdditionalPrice(0.50)
        setMinQty(1)
        setMaxQty(1)
        setAllowItemQuantity(true)
        setIsRequired(true)
        setOptions([{ id: `opt-${Date.now()}`, name: '', code: 'TOP-001', price: 0.50, description: '', active: true }])
      }
    }
  }, [open, initialModel])

  const getNextCode = (currentList: typeof options) => {
    const lower = (name || '').toLowerCase()
    let prefix = 'TOP'
    if (lower.includes('base') || lower.includes('creme')) prefix = 'BAS'
    else if (lower.includes('fruta')) prefix = 'FRU'
    else if (lower.includes('calda') || lower.includes('adicional')) prefix = 'CAL'

    let maxNum = currentList.length
    for (const opt of currentList) {
      if (opt.code && opt.code.startsWith(prefix)) {
        const numPart = parseInt(opt.code.replace(`${prefix}-`, ''), 10)
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart
        }
      }
    }
    return `${prefix}-${String(maxNum + 1).padStart(3, '0')}`
  }

  const handleApplyAdditionalPriceToAll = () => {
    const priceNum = Number(additionalPrice) || 0
    setOptions((prev) => prev.map((opt) => ({ ...opt, price: priceNum })))
    toast.success(`Preço de ${priceNum.toFixed(2)}€ aplicado a todos os itens!`)
  }

  const handleAddOption = () => {
    const defaultPrice = Number(additionalPrice) || 0
    setOptions((prev) => [
      ...prev,
      {
        id: `opt-${Date.now()}-${prev.length}`,
        name: '',
        code: getNextCode(prev),
        price: defaultPrice,
        description: '',
        active: true,
      },
    ])
  }

  const handleQuickAdd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      e.preventDefault()
      const exists = options.some((o) => o.name.toLowerCase() === searchTerm.trim().toLowerCase())
      if (!exists) {
        const defaultPrice = Number(additionalPrice) || 0
        setOptions((prev) => [
          ...prev,
          {
            id: `opt-${Date.now()}-${prev.length}`,
            name: searchTerm.trim(),
            code: getNextCode(prev),
            price: defaultPrice,
            description: '',
            active: true,
          },
        ])
        setSearchTerm('')
      }
    }
  }

  const handleRemoveOption = (id: string) => {
    setOptions((prev) => prev.filter((o) => o.id !== id))
  }

  const handleUpdateOption = (id: string, field: keyof OptionItem, value: any) => {
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, [field]: value } : o)))
  }

  const [draggedOptionId, setDraggedOptionId] = useState<string | null>(null)

  const handleDragStartOption = (e: React.DragEvent, id: string) => {
    setDraggedOptionId(id)
    e.dataTransfer.setData('text/plain', id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDropOption = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggedOptionId || draggedOptionId === targetId) return

    const sourceIndex = options.findIndex((o) => o.id === draggedOptionId)
    const targetIndex = options.findIndex((o) => o.id === targetId)
    if (sourceIndex === -1 || targetIndex === -1) return

    const updated = [...options]
    const [moved] = updated.splice(sourceIndex, 1)
    updated.splice(targetIndex, 0, moved)
    setOptions(updated)
    setDraggedOptionId(null)
  }

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Informe o nome do modelo de opções.')
      return
    }

    const filteredOptions = options.filter((o) => o.name.trim() !== '')

    const savedModel: OptionModelData = {
      id: initialModel?.id || `model-${Date.now()}`,
      name: name.trim(),
      priceType,
      additionalPrice: Number(additionalPrice) || 0,
      minQty,
      maxQty,
      allowItemQuantity,
      isRequired,
      showDetailed,
      options: filteredOptions.length > 0 ? filteredOptions : options,
    }

    if (onSave) onSave(savedModel)
    toast.success(`Modelo de opções "${name}" salvo com sucesso!`)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full max-w-2xl sm:max-w-3xl p-0 bg-white dark:bg-[#160228] text-slate-900 dark:text-white rounded-3xl border border-purple-200 dark:border-white/15 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col [&>button]:hidden">
        {/* Header */}
        <div className="p-4 px-6 border-b border-purple-100 dark:border-white/10 bg-purple-50/50 dark:bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-purple-100 dark:bg-white/10 flex items-center justify-center text-purple-700 dark:text-pink-400">
              <Layers className="h-4 w-4" />
            </div>
            <DialogTitle className="text-sm sm:text-base font-black text-purple-950 dark:text-white tracking-tight">
              Modelo de Opções
            </DialogTitle>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-xs font-bold text-purple-700 dark:text-purple-300 hover:text-purple-950 dark:hover:text-white cursor-pointer px-2.5 py-1 rounded-lg hover:bg-purple-100/50 dark:hover:bg-white/10 transition"
          >
            Fechar
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* Nome */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4 items-center">
            <div className="flex items-center gap-1.5 sm:col-span-1">
              <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">
                Nome:
              </Label>
              <span title="Nome do grupo ou modelo de opções exibido no cardápio (ex: Escolha seu creme ou base gelada)." className="cursor-help">
                <Info className="h-3.5 w-3.5 text-purple-400 hover:text-purple-600 dark:hover:text-purple-200" />
              </span>
            </div>
            <div className="sm:col-span-3">
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Escolha os sabores da sua taça"
                className="h-10 text-xs rounded-xl bg-white dark:bg-white/10 border border-purple-200 dark:border-white/15 text-purple-950 dark:text-white font-bold"
              />
            </div>
          </div>

          {/* Forma de preço */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4 items-center">
            <div className="flex items-center gap-1.5 sm:col-span-1">
              <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">
                Forma de preço:
              </Label>
              <span title="Define se os itens são inclusos gratuitamente no produto ou cobrados individualmente por adicional." className="cursor-help">
                <Info className="h-3.5 w-3.5 text-purple-400 hover:text-purple-600 dark:hover:text-purple-200" />
              </span>
            </div>
            <div className="sm:col-span-3">
              <select
                value={priceType}
                onChange={(e) => setPriceType(e.target.value as any)}
                className="w-full h-10 px-3 text-xs border border-purple-200 dark:border-white/15 rounded-xl bg-white dark:bg-[#1a0530] text-purple-950 dark:text-white focus:outline-none font-bold cursor-pointer"
              >
                <option value="Individual">Individual (Cobrança por Adicional €)</option>
                <option value="Gratis">Incluso no Copo (Grátis)</option>
              </select>
            </div>
          </div>

          {/* Valor do Adicional / Excedente (€) */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4 items-center">
            <div className="flex items-center gap-1.5 sm:col-span-1 flex-wrap">
              <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">
                {priceType === 'Gratis' ? 'Valor por escolha excedente (€):' : 'Valor do Adicional (€):'}
              </Label>
              <span title={priceType === 'Gratis' ? "Valor cobrado por cada item que o cliente escolher além da cota grátis." : "Valor padrão cobrado por cada item selecionado."} className="cursor-help">
                <Info className="h-3.5 w-3.5 text-purple-400 hover:text-purple-600 dark:hover:text-purple-200" />
              </span>
              <Badge className={`text-[8px] py-0 px-1 font-bold ${
                priceType === 'Gratis'
                  ? 'bg-purple-100 text-purple-800 dark:bg-pink-950/50 dark:text-pink-300 border border-purple-200 dark:border-pink-500/30'
                  : 'bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-300'
              }`}>
                {priceType === 'Gratis' ? '+ Extra' : 'Por item'}
              </Badge>
            </div>
            <div className="sm:col-span-3 flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-purple-400">€</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={additionalPrice}
                  onChange={(e) => setAdditionalPrice(e.target.value)}
                  placeholder="0.50"
                  className="h-10 pl-7 text-xs font-mono font-bold rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/10 text-purple-950 dark:text-white w-full"
                />
              </div>
              {priceType === 'Individual' && (
                <button
                  type="button"
                  onClick={handleApplyAdditionalPriceToAll}
                  className="px-3 py-2 text-[11px] font-extrabold text-purple-700 dark:text-pink-300 bg-purple-100/70 hover:bg-purple-200 dark:bg-white/10 dark:hover:bg-white/15 rounded-xl border border-purple-200 dark:border-white/15 cursor-pointer whitespace-nowrap transition shadow-xs"
                  title="Aplica este valor no preço de todos os itens da lista abaixo"
                >
                  Aplicar a todos
                </button>
              )}
            </div>
          </div>

          {/* Qtd. escolha mínima */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4 items-center">
            <div className="flex items-center gap-1.5 sm:col-span-1">
              <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">
                Qtd. escolha mínima:
              </Label>
              <span title="Quantidade mínima de escolhas obrigatórias que o cliente deve selecionar antes de confirmar." className="cursor-help">
                <Info className="h-3.5 w-3.5 text-purple-400 hover:text-purple-600 dark:hover:text-purple-200" />
              </span>
            </div>
            <div className="sm:col-span-3">
              <Input
                type="number"
                min={0}
                value={minQty}
                onChange={(e) => setMinQty(Number(e.target.value))}
                className="h-10 text-xs rounded-xl bg-white dark:bg-white/10 border border-purple-200 dark:border-white/15 text-purple-950 dark:text-white font-mono font-bold"
              />
            </div>
          </div>

          {/* Qtd. escolha máxima / Cota Grátis */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4 items-center">
            <div className="flex items-center gap-1.5 sm:col-span-1 flex-wrap">
              <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">
                {priceType === 'Gratis' ? 'Qtd. escolhas grátis incluídas:' : 'Qtd. escolha máxima:'}
              </Label>
              <span title={priceType === 'Gratis' ? "Quantidade máxima de escolhas inclusas gratuitamente no copo." : "Limite máximo total de escolhas permitidas para este grupo."} className="cursor-help">
                <Info className="h-3.5 w-3.5 text-purple-400 hover:text-purple-600 dark:hover:text-purple-200" />
              </span>
              <Badge className={`text-[8px] py-0 px-1 font-bold ${
                priceType === 'Gratis'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                  : 'bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-300'
              }`}>
                {priceType === 'Gratis' ? 'Grátis' : 'Limite'}
              </Badge>
            </div>
            <div className="sm:col-span-3">
              <Input
                type="number"
                min={0}
                value={maxQty}
                onChange={(e) => setMaxQty(Number(e.target.value))}
                className="h-10 text-xs rounded-xl bg-white dark:bg-white/10 border border-purple-200 dark:border-white/15 text-purple-950 dark:text-white font-mono font-bold"
              />
            </div>
          </div>

          {/* Regras Booleanas Genéricas */}
          <div className="space-y-3 pt-2 border-t border-purple-100 dark:border-white/10">
            {/* Quantidade de opcionais */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4 items-center">
              <div className="flex items-center gap-1.5 sm:col-span-2">
                <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">
                  Quantidade de opcionais:
                </Label>
                <span title="Permite ao cliente escolher múltiplos do mesmo item usando seletores de quantidade [-] [+]." className="cursor-help">
                  <Info className="h-3.5 w-3.5 text-purple-400 hover:text-purple-600 dark:hover:text-purple-200" />
                </span>
              </div>
              <div className="flex items-center gap-6 sm:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-purple-950 dark:text-white select-none">
                  <input
                    type="radio"
                    name="allowItemQty"
                    checked={allowItemQuantity}
                    onChange={() => setAllowItemQuantity(true)}
                    className="text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                  <span>Sim</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-purple-950 dark:text-white select-none">
                  <input
                    type="radio"
                    name="allowItemQty"
                    checked={!allowItemQuantity}
                    onChange={() => setAllowItemQuantity(false)}
                    className="text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                  <span>Não</span>
                </label>
              </div>
            </div>

            {/* Escolha Obrigatória */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4 items-center">
              <div className="flex items-center gap-1.5 sm:col-span-2">
                <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">
                  Escolha Obrigatória:
                </Label>
                <span title="Exige que o cliente faça pelo menos uma escolha neste grupo antes de poder concluir o pedido." className="cursor-help">
                  <Info className="h-3.5 w-3.5 text-purple-400 hover:text-purple-600 dark:hover:text-purple-200" />
                </span>
              </div>
              <div className="flex items-center gap-6 sm:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-purple-950 dark:text-white select-none">
                  <input
                    type="radio"
                    name="reqRule"
                    checked={isRequired}
                    onChange={() => setIsRequired(true)}
                    className="text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                  <span>Sim</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-purple-950 dark:text-white select-none">
                  <input
                    type="radio"
                    name="reqRule"
                    checked={!isRequired}
                    onChange={() => setIsRequired(false)}
                    className="text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                  <span>Não</span>
                </label>
              </div>
            </div>

            {/* Mostra opcional detalhado */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4 items-center">
              <div className="flex items-center gap-1.5 sm:col-span-2">
                <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">
                  Mostra opcional detalhado:
                </Label>
                <span title="Exibe as opções em cards visuais maiores com foto e descrição destacada no menu do cliente." className="cursor-help">
                  <Info className="h-3.5 w-3.5 text-purple-400 hover:text-purple-600 dark:hover:text-purple-200" />
                </span>
              </div>
              <div className="flex items-center gap-6 sm:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-purple-950 dark:text-white select-none">
                  <input
                    type="radio"
                    name="detailed"
                    checked={showDetailed}
                    onChange={() => setShowDetailed(true)}
                    className="text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                  <span>Sim</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-purple-950 dark:text-white select-none">
                  <input
                    type="radio"
                    name="detailed"
                    checked={!showDetailed}
                    onChange={() => setShowDetailed(false)}
                    className="text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                  <span>Não</span>
                </label>
              </div>
            </div>
          </div>

          {/* Card de Live Preview do Cardápio */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-50/90 via-pink-50/40 to-purple-50/90 dark:from-[#240538] dark:via-[#1e0333] dark:to-[#170228] border border-purple-200/80 dark:border-white/15 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between border-b border-purple-200/60 dark:border-white/10 pb-1.5">
              <div className="flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-purple-700 dark:text-purple-300" />
                <span className="text-[11px] font-black uppercase text-purple-950 dark:text-white tracking-wider">
                  Pré-visualização Dinâmica no Cardápio
                </span>
              </div>
              <span className="text-[9px] font-bold text-purple-700 dark:text-pink-300 bg-purple-100 dark:bg-pink-950/60 px-2 py-0.5 rounded-full border border-purple-200/60 dark:border-pink-500/20">
                Live Preview
              </span>
            </div>

            {/* Simulação do Cabeçalho do Cardápio */}
            <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-purple-150 dark:border-white/10 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-1.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-black uppercase text-slate-900 dark:text-white">
                    {name.trim() || 'Escolha seu creme ou base gelada'}
                  </span>
                  <span className="text-purple-700 dark:text-purple-300 font-bold text-xs">
                    (0/{maxQty})
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {isRequired || minQty > 0 ? (
                    <Badge className="bg-purple-700 text-white font-bold text-[9px] py-0 px-1.5">
                      Obrigatório {minQty > 0 ? `(Mín: ${minQty})` : ''}
                    </Badge>
                  ) : (
                    <Badge className="bg-purple-100 text-purple-900 border border-purple-200 dark:bg-white/10 dark:text-purple-200 font-bold text-[9px] py-0 px-1.5">
                      Opcional
                    </Badge>
                  )}
                  <span className="text-[11px] text-purple-700 dark:text-purple-300 font-bold">
                    {priceType === 'Individual'
                      ? (Number(additionalPrice) > 0 ? `+${formatCurrency(Number(additionalPrice))}/un.` : 'Valor por item')
                      : (Number(additionalPrice) > 0 ? `Até ${maxQty || 1} grátis (extra +${formatCurrency(Number(additionalPrice))})` : 'Incluso no Copo (Grátis)')}
                  </span>
                </div>
              </div>

              {/* Simulação visual dos itens */}
              <div className="pt-1">
                {showDetailed ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(options.length > 0 ? options.slice(0, 2) : [{ id: 'mock1', name: 'Opção 1', price: 0 }]).map((opt: any, idx: number) => (
                      <div key={opt.id || idx} className="p-2 rounded-xl border border-purple-150 dark:border-white/10 bg-purple-50/40 dark:bg-white/5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-7 w-7 rounded-lg bg-purple-200/50 dark:bg-white/10 flex items-center justify-center text-purple-500 text-[10px] flex-shrink-0">
                            📷
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-purple-950 dark:text-white truncate">
                              {opt.name || `Opção ${idx + 1}`}
                            </div>
                            {priceType === 'Individual' && Number(opt.price || additionalPrice) > 0 && (
                              <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                                +{formatCurrency(Number(opt.price || additionalPrice))}
                              </div>
                            )}
                          </div>
                        </div>
                        {allowItemQuantity ? (
                          <div className="flex items-center gap-1 bg-white dark:bg-white/10 px-1.5 py-0.5 rounded-lg border border-purple-200 dark:border-white/10 text-xs flex-shrink-0">
                            <span className="text-purple-400 font-bold">−</span>
                            <span className="font-mono font-bold w-3 text-center">0</span>
                            <span className="text-purple-700 dark:text-pink-400 font-bold">+</span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-purple-700 dark:text-pink-300 bg-purple-100 dark:bg-white/10 px-2 py-0.5 rounded-md flex-shrink-0">
                            Escolher
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {(options.length > 0 ? options.slice(0, 3) : [{ id: 'mock1', name: 'Opção 1' }, { id: 'mock2', name: 'Opção 2' }]).map((opt: any, idx: number) => (
                      <div key={opt.id || idx} className="p-2 rounded-lg border border-purple-150 dark:border-white/10 bg-white dark:bg-white/5 flex items-center justify-between text-xs">
                        <span className="truncate font-semibold text-slate-800 dark:text-purple-200">
                          {opt.name || `Opção ${idx + 1}`}
                        </span>
                        {allowItemQuantity ? (
                          <span className="text-[10px] font-mono text-purple-500 font-bold">0</span>
                        ) : (
                          <span className="text-[10px] text-purple-400">○</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Frase explicativa da regra em linguagem natural */}
            <div className="text-[11px] text-purple-900/90 dark:text-purple-200/90 leading-relaxed font-medium bg-purple-100/50 dark:bg-white/5 p-2 rounded-xl border border-purple-200/60 dark:border-white/10">
              {priceType === 'Gratis' ? (
                <>
                  💡 <strong>Regra ativa:</strong> O cliente escolhe até <strong>{maxQty} {maxQty === 1 ? 'item grátis' : 'itens grátis'}</strong> incluso(s) no copo.
                  {Number(additionalPrice) > 0 ? (
                    <> A partir do <strong>{maxQty + 1}º item</strong>, cada escolha extra somará <strong>+{formatCurrency(Number(additionalPrice))}</strong> ao total do pedido.</>
                  ) : (
                    <> As escolhas são limitadas estritamente a {maxQty} {maxQty === 1 ? 'item' : 'itens'} sem cobrança extra.</>
                  )}
                  {minQty > 0 ? <> Escolha obrigatória de no mínimo <strong>{minQty} {minQty === 1 ? 'item' : 'itens'}</strong>.</> : <> Grupo opcional.</>}
                </>
              ) : (
                <>
                  💡 <strong>Regra ativa:</strong> Nenhuma escolha é gratuita. Cada item selecionado somará <strong>+{formatCurrency(Number(additionalPrice))}</strong> ao pedido (ou o valor individual configurado no item), com limite de até <strong>{maxQty} {maxQty === 1 ? 'escolha' : 'escolhas'}</strong>.
                  {minQty > 0 ? <> Escolha obrigatória de no mínimo <strong>{minQty} {minQty === 1 ? 'item' : 'itens'}</strong>.</> : <> Grupo opcional.</>}
                </>
              )}
            </div>
          </div>

          {/* Opções */}
          <div className="space-y-3 pt-3 border-t border-purple-100 dark:border-white/10">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-950 dark:text-white text-xs">
                Opções:
              </span>
              <button
                type="button"
                onClick={handleAddOption}
                className="text-purple-700 dark:text-pink-400 hover:underline font-bold text-xs cursor-pointer"
              >
                + Adicionar Item
              </button>
            </div>

            {/* Buscador de Itens Contratados */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400 dark:text-purple-300 pointer-events-none" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleQuickAdd}
                className="h-10 pl-10 pr-8 text-xs rounded-xl bg-white dark:bg-white/10 border border-purple-200 dark:border-white/15 text-purple-950 dark:text-white"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-purple-400 hover:text-purple-700 dark:hover:text-white cursor-pointer"
                  title="Limpar busca"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Cabeçalho das Colunas */}
            <div className="flex items-center gap-2 px-3 pt-1 text-[11px] font-bold text-purple-900/70 dark:text-purple-300/70 uppercase tracking-wider select-none">
              <div className="w-6 flex-shrink-0" /> {/* Alinhamento Grip */}
              <div className="w-8 flex-shrink-0" /> {/* Alinhamento Foto */}
              <div className="flex-1 min-w-[140px]">Nome</div>
              <div className="w-24 flex-shrink-0">Código</div>
              <div className="w-20 flex-shrink-0 text-right">Valor (€)</div>
              <div className="w-8 flex-shrink-0" /> {/* Alinhamento Lixeira */}
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {options
                .filter((opt) => {
                  if (!searchTerm.trim()) return true
                  const q = searchTerm.trim().toLowerCase()
                  return (
                    (opt.name && opt.name.toLowerCase().includes(q)) ||
                    (opt.code && opt.code.toLowerCase().includes(q)) ||
                    (opt.description && opt.description.toLowerCase().includes(q))
                  )
                })
                .map((opt, idx) => {
                const isDragging = draggedOptionId === opt.id
                return (
                  <div
                    key={opt.id}
                    draggable
                    onDragStart={(e) => handleDragStartOption(e, opt.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDropOption(e, opt.id)}
                    className={`p-2 border rounded-xl bg-white dark:bg-white/5 transition flex items-center gap-2 shadow-xs ${
                      isDragging ? 'opacity-40 border-purple-500 border-dashed' : 'border-purple-150 dark:border-white/10 hover:border-purple-300 dark:hover:border-white/20'
                    }`}
                  >
                    <div className="cursor-grab active:cursor-grabbing p-1 text-purple-400 hover:text-purple-700 dark:hover:text-white transition flex-shrink-0" title="Arrastar para reordenar">
                      <GripVertical className="h-4 w-4" />
                    </div>

                    {/* Botão [+] Foto */}
                    <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-white/5 border border-dashed border-purple-200 dark:border-white/20 flex items-center justify-center text-purple-400 hover:text-purple-700 dark:hover:text-white flex-shrink-0 cursor-pointer" title="Adicionar Foto">
                      <Camera className="h-4 w-4" />
                    </div>

                    {/* Nome do Item */}
                    <div className="flex-1 min-w-[140px]">
                      <Input
                        value={opt.name}
                        onChange={(e) => handleUpdateOption(opt.id, 'name', e.target.value)}
                        placeholder={`Nome da opção ${idx + 1}`}
                        className="h-8 text-xs rounded-lg border-purple-200 dark:border-white/15 font-bold bg-white dark:bg-white/10 text-purple-950 dark:text-white placeholder:text-purple-300 dark:placeholder:text-white/40 w-full"
                      />
                    </div>

                    {/* Código ERP */}
                    <div className="w-24 flex-shrink-0">
                      <Input
                        value={opt.code}
                        onChange={(e) => handleUpdateOption(opt.id, 'code', e.target.value)}
                        className="h-8 text-xs rounded-lg border-purple-200 dark:border-white/15 font-mono font-bold bg-white dark:bg-white/10 text-purple-950 dark:text-white w-full"
                      />
                    </div>

                    {/* Preço */}
                    <div className="w-20 flex-shrink-0">
                      <Input
                        type="number"
                        step="0.01"
                        value={opt.price}
                        onChange={(e) => handleUpdateOption(opt.id, 'price', Number(e.target.value))}
                        className="h-8 text-xs rounded-lg border-purple-200 dark:border-white/15 font-mono font-bold bg-white dark:bg-white/10 text-purple-950 dark:text-white w-full text-right"
                      />
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(opt.id)}
                        className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md cursor-pointer transition"
                        title="Excluir Opção"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Botão Adicionar Item no final da lista */}
            <button
              type="button"
              onClick={handleAddOption}
              className="w-full py-2.5 border-2 border-dashed border-purple-200 dark:border-white/15 rounded-xl text-xs font-bold text-purple-700 dark:text-pink-300 hover:bg-purple-50/70 dark:hover:bg-white/5 hover:border-purple-300 dark:hover:border-white/30 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs mt-2"
            >
              <Plus className="h-4 w-4" />
              <span>Adicionar Item</span>
            </button>
          </div>
        </div>

        {/* Rodapé */}
        <div className="p-4 px-6 bg-purple-50/50 dark:bg-white/5 border-t border-purple-100 dark:border-white/10 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border border-purple-200 dark:border-white/15 bg-purple-50 dark:bg-white/5 hover:bg-purple-100 dark:hover:bg-white/10 text-purple-950 dark:text-white rounded-xl h-10 px-5 text-xs font-bold cursor-pointer"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl h-10 px-6 text-xs shadow-lg shadow-pink-600/30 cursor-pointer"
          >
            Salvar Modelo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
