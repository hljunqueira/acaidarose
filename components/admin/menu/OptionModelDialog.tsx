'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  GripVertical,
  Eye,
  Trash2,
  HelpCircle,
  Camera,
  Layers,
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
  minQty: number
  maxQty: number
  isRequired: boolean
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
  // Quando for NOVO (initialModel null/undefined), inicia 100% LIMPO
  const [name, setName] = useState('')
  const [priceType, setPriceType] = useState<'Gratis' | 'Individual'>('Gratis')
  const [minQty, setMinQty] = useState<number>(0)
  const [maxQty, setMaxQty] = useState<number>(1)
  const [isRequired, setIsRequired] = useState(false)
  const [options, setOptions] = useState<OptionItem[]>([])

  useEffect(() => {
    if (open) {
      if (initialModel) {
        // Carrega dados existentes para edição
        setName(initialModel.name || '')
        setPriceType(initialModel.priceType || 'Gratis')
        setMinQty(initialModel.minQty ?? 0)
        setMaxQty(initialModel.maxQty ?? 1)
        setIsRequired(initialModel.isRequired ?? false)
        setOptions(
          initialModel.options && initialModel.options.length > 0
            ? initialModel.options
            : [{ id: `opt-${Date.now()}`, name: '', code: '101', price: 0.0, description: '', active: true }]
        )
      } else {
        // NOVO MODELO: Limpo em branco para preenchimento do zero
        setName('')
        setPriceType('Gratis')
        setMinQty(0)
        setMaxQty(1)
        setIsRequired(false)
        setOptions([{ id: `opt-${Date.now()}`, name: '', code: '101', price: 0.0, description: '', active: true }])
      }
    }
  }, [open, initialModel])

  const handleAddOption = () => {
    setOptions((prev) => [
      ...prev,
      {
        id: `opt-${Date.now()}-${prev.length}`,
        name: '',
        code: `${prev.length + 101}`,
        price: 0.0,
        description: '',
        active: true,
      },
    ])
  }

  const handleRemoveOption = (id: string) => {
    setOptions((prev) => prev.filter((o) => o.id !== id))
  }

  const handleUpdateOption = (id: string, field: keyof OptionItem, val: any) => {
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, [field]: val } : o)))
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

    const currentIndex = options.findIndex((o) => o.id === draggedOptionId)
    const targetIndex = options.findIndex((o) => o.id === targetId)
    if (currentIndex === -1 || targetIndex === -1) return

    const reordered = [...options]
    const [moved] = reordered.splice(currentIndex, 1)
    reordered.splice(targetIndex, 0, moved)

    setOptions(reordered)
    setDraggedOptionId(null)
  }

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Informe o nome do modelo de opções')
      return
    }

    const filteredOptions = options.filter((o) => o.name.trim() !== '')

    const savedModel: OptionModelData = {
      id: initialModel?.id || `model-${Date.now()}`,
      name: name.trim(),
      priceType,
      minQty,
      maxQty,
      isRequired,
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
              {initialModel ? 'Editar Modelo de Opções' : 'Novo Modelo de Opções'}
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
          {/* Nome do Grupo */}
          <div className="space-y-1">
            <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">Nome do Grupo:</Label>
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Escolha seu creme/base preferido (10 Sabores)"
              className="h-10 text-xs rounded-xl bg-white dark:bg-white/10 border border-purple-200 dark:border-white/15 text-purple-950 dark:text-white font-bold placeholder:text-purple-300 dark:placeholder:text-white/40"
            />
          </div>

          {/* Qtd. Mínima, Qtd. Máxima & Tipo de Preço */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">Qtd. Mínima:</Label>
              <Input
                type="number"
                min={0}
                value={minQty}
                onChange={(e) => setMinQty(Number(e.target.value))}
                className="h-10 text-xs rounded-xl bg-white dark:bg-white/10 border border-purple-200 dark:border-white/15 text-purple-950 dark:text-white font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">Qtd. Máxima:</Label>
              <Input
                type="number"
                min={1}
                value={maxQty}
                onChange={(e) => setMaxQty(Number(e.target.value))}
                className="h-10 text-xs rounded-xl bg-white dark:bg-white/10 border border-purple-200 dark:border-white/15 text-purple-950 dark:text-white font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">Cobrança:</Label>
              <select
                value={priceType}
                onChange={(e) => setPriceType(e.target.value as any)}
                className="w-full h-10 px-3 text-xs border border-purple-200 dark:border-white/15 rounded-xl bg-white dark:bg-[#1a0530] text-purple-950 dark:text-white focus:outline-none font-bold cursor-pointer"
              >
                <option value="Gratis">Incluso no Copo (Grátis)</option>
                <option value="Individual">Adicional Pago (€)</option>
              </select>
            </div>
          </div>

          {/* Escolha Obrigatória */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-purple-50/70 dark:bg-white/5 border border-purple-100 dark:border-white/10">
            <div className="flex items-center gap-2 font-bold text-purple-950 dark:text-white">
              <span>Escolha Obrigatória no Pedido?</span>
              <HelpCircle className="h-4 w-4 text-purple-400" />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer font-bold text-purple-950 dark:text-white select-none">
                <input
                  type="radio"
                  name="req"
                  checked={isRequired}
                  onChange={() => setIsRequired(true)}
                  className="text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
                <span>Sim</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer font-bold text-purple-950 dark:text-white select-none">
                <input
                  type="radio"
                  name="req"
                  checked={!isRequired}
                  onChange={() => setIsRequired(false)}
                  className="text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
                <span>Não</span>
              </label>
            </div>
          </div>

          {/* LISTA DE ITENS DO GRUPO */}
          <div className="space-y-2.5 pt-2 border-t border-purple-100 dark:border-white/10">
            <div className="flex items-center justify-between">
              <span className="font-black text-purple-950 dark:text-white text-xs uppercase tracking-wider">
                Itens & Complementos do Grupo:
              </span>
              <button
                type="button"
                onClick={handleAddOption}
                className="text-purple-700 dark:text-pink-400 hover:underline font-black text-xs cursor-pointer"
              >
                + Adicionar Item
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {options.map((opt, idx) => {
                const isDragging = draggedOptionId === opt.id
                return (
                  <div
                    key={opt.id}
                    draggable
                    onDragStart={(e) => handleDragStartOption(e, opt.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDropOption(e, opt.id)}
                    className={`p-2.5 border rounded-xl bg-white dark:bg-white/5 transition flex items-center gap-2.5 shadow-xs ${
                      isDragging ? 'opacity-40 border-purple-500 border-dashed' : 'border-purple-150 dark:border-white/10 hover:border-purple-300 dark:hover:border-white/20'
                    }`}
                  >
                    <div className="cursor-grab active:cursor-grabbing p-1 text-purple-400 hover:text-purple-700 dark:hover:text-white transition flex-shrink-0" title="Arrastar para reordenar">
                      <GripVertical className="h-4 w-4" />
                    </div>

                    {/* Mini Foto */}
                    <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-white/5 border border-purple-200 dark:border-white/10 flex items-center justify-center text-purple-400 flex-shrink-0">
                      <Camera className="h-4 w-4" />
                    </div>

                    {/* Nome do Item */}
                    <div className="flex-1 min-w-[160px]">
                      <Input
                        value={opt.name}
                        onChange={(e) => handleUpdateOption(opt.id, 'name', e.target.value)}
                        placeholder={`Nome do item ${idx + 1} (ex: Açaí Tradicional, Morango)`}
                        className="h-8 text-xs rounded-lg border-purple-200 dark:border-white/15 font-bold bg-white dark:bg-white/10 text-purple-950 dark:text-white placeholder:text-purple-300 dark:placeholder:text-white/40 w-full"
                      />
                    </div>

                    {/* Código ERP (COMPACTO) */}
                    <div
                      className="flex items-center border border-purple-200 dark:border-white/15 rounded-lg bg-white dark:bg-white/10 px-2 h-8 w-24 flex-shrink-0"
                      title="Código ERP / SKU"
                    >
                      <span className="text-[10px] text-purple-400 font-bold mr-1 select-none">Cód:</span>
                      <input
                        value={opt.code}
                        onChange={(e) => handleUpdateOption(opt.id, 'code', e.target.value)}
                        placeholder="101"
                        className="w-full text-xs font-mono font-bold text-purple-950 dark:text-white bg-transparent focus:outline-none"
                      />
                    </div>

                    {/* Preço Adicional (COMPACTO) */}
                    <div
                      className="flex items-center border border-purple-200 dark:border-white/15 rounded-lg bg-white dark:bg-white/10 px-2 h-8 w-24 flex-shrink-0"
                      title="Preço Adicional (€)"
                    >
                      <span className="text-[10px] text-purple-400 font-bold mr-1 select-none">€</span>
                      <input
                        type="number"
                        step="0.01"
                        value={opt.price}
                        onChange={(e) => handleUpdateOption(opt.id, 'price', Number(e.target.value))}
                        className="w-full text-xs font-mono font-bold text-purple-950 dark:text-white bg-transparent focus:outline-none"
                      />
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(opt.id)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md cursor-pointer transition"
                        title="Excluir Item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
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
