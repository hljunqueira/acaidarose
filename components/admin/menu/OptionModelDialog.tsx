'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
      <DialogContent className="w-[95vw] sm:w-full max-w-2xl sm:max-w-3xl p-0 bg-white dark:bg-[#160228] text-slate-900 dark:text-white rounded-2xl border border-zinc-200 dark:border-white/15 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 flex items-center gap-2">
          <Layers className="h-4 w-4 text-purple-700" />
          <DialogTitle className="text-sm sm:text-base font-bold text-zinc-800">
            {initialModel ? 'Editar Modelo de Opções' : 'Novo Modelo de Opções'}
          </DialogTitle>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* Nome do Grupo */}
          <div className="space-y-1">
            <Label className="text-[11px] font-bold text-zinc-700">Nome do Grupo:</Label>
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Escolha seu creme/base preferido (10 Sabores)"
              className="h-9 text-xs border-zinc-300 rounded-sm font-bold"
            />
          </div>

          {/* Qtd. Mínima, Qtd. Máxima & Tipo de Preço */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px] font-bold text-zinc-700">Qtd. Mínima:</Label>
              <Input
                type="number"
                min={0}
                value={minQty}
                onChange={(e) => setMinQty(Number(e.target.value))}
                className="h-8 text-xs border-zinc-300 rounded-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-bold text-zinc-700">Qtd. Máxima:</Label>
              <Input
                type="number"
                min={1}
                value={maxQty}
                onChange={(e) => setMaxQty(Number(e.target.value))}
                className="h-8 text-xs border-zinc-300 rounded-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-bold text-zinc-700">Cobrança:</Label>
              <select
                value={priceType}
                onChange={(e) => setPriceType(e.target.value as any)}
                className="w-full h-8 px-2 text-xs border border-zinc-300 rounded-sm bg-white focus:outline-none font-medium"
              >
                <option value="Gratis">Incluso no Copo</option>
                <option value="Individual">Adicional Pago (€)</option>
              </select>
            </div>
          </div>

          {/* Escolha Obrigatória */}
          <div className="flex items-center justify-between p-2.5 rounded-sm bg-zinc-50 border border-zinc-200">
            <div className="flex items-center gap-1.5 font-bold text-zinc-700">
              <span>Escolha Obrigatória no Pedido?</span>
              <HelpCircle className="h-3.5 w-3.5 text-zinc-400" />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-zinc-800">
                <input
                  type="radio"
                  name="req"
                  checked={isRequired}
                  onChange={() => setIsRequired(true)}
                  className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span>Sim</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-zinc-800">
                <input
                  type="radio"
                  name="req"
                  checked={!isRequired}
                  onChange={() => setIsRequired(false)}
                  className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span>Não</span>
              </label>
            </div>
          </div>

          {/* LISTA DE ITENS DO GRUPO (ESPAÇAMENTO PERFEITO PARA O NOME) */}
          <div className="space-y-2.5 pt-2 border-t border-zinc-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-800 text-[11px] uppercase tracking-wider">
                Itens & Complementos do Grupo:
              </span>
              <button
                type="button"
                onClick={handleAddOption}
                className="text-purple-600 dark:text-pink-400 hover:underline font-bold text-xs cursor-pointer"
              >
                <span>Adicionar Item</span>
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {options.map((opt, idx) => (
                <div
                  key={opt.id}
                  className="p-2.5 border border-zinc-200 rounded-sm bg-white hover:bg-zinc-50 transition flex items-center gap-2.5 shadow-2xs"
                >
                  <GripVertical className="h-3.5 w-3.5 text-zinc-400 cursor-grab flex-shrink-0" />

                  {/* Mini Foto */}
                  <div className="h-8 w-8 rounded bg-zinc-100 border border-zinc-300 flex items-center justify-center text-zinc-400 flex-shrink-0">
                    <Camera className="h-4 w-4" />
                  </div>

                  {/* Nome do Item (AMPLO, VISÍVEL E SEM ESPREMIMENTO) */}
                  <div className="flex-1 min-w-[180px]">
                    <Input
                      value={opt.name}
                      onChange={(e) => handleUpdateOption(opt.id, 'name', e.target.value)}
                      placeholder={`Nome do item ${idx + 1} (ex: Açaí Tradicional, Morango)`}
                      className="h-8 text-xs border-zinc-300 rounded-sm font-medium bg-white w-full"
                    />
                  </div>

                  {/* Código ERP (COMPACTO) */}
                  <div
                    className="flex items-center border border-zinc-300 rounded-sm bg-white px-2 h-8 w-24 flex-shrink-0"
                    title="Código ERP / SKU"
                  >
                    <span className="text-[10px] text-zinc-400 font-bold mr-1 select-none">Cód:</span>
                    <input
                      value={opt.code}
                      onChange={(e) => handleUpdateOption(opt.id, 'code', e.target.value)}
                      placeholder="101"
                      className="w-full text-xs font-mono font-bold text-zinc-800 bg-transparent focus:outline-none"
                    />
                  </div>

                  {/* Preço Adicional (COMPACTO) */}
                  <div
                    className="flex items-center border border-zinc-300 rounded-sm bg-white px-2 h-8 w-24 flex-shrink-0"
                    title="Preço Adicional (€)"
                  >
                    <span className="text-[10px] text-zinc-400 font-bold mr-1 select-none">€</span>
                    <input
                      type="number"
                      step="0.01"
                      value={opt.price}
                      onChange={(e) => handleUpdateOption(opt.id, 'price', Number(e.target.value))}
                      className="w-full text-xs font-mono font-bold text-zinc-800 bg-transparent focus:outline-none"
                    />
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      className="p-1 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                      title="Visualizar"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(opt.id)}
                      className="p-1 text-zinc-400 hover:text-red-500 cursor-pointer"
                      title="Excluir Item"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="p-3.5 bg-zinc-50 border-t border-zinc-200 flex items-center justify-end gap-2">
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
            className="px-6 py-2 text-xs font-bold text-white bg-[#0066ff] hover:bg-[#0052cc] rounded-sm cursor-pointer uppercase shadow-xs"
          >
            SALVAR
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
