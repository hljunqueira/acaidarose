'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/i18n/formatters'
import { Trash2 } from 'lucide-react'

export interface InventoryItemFormData {
  id?: string
  name: string
  category: string
  supplyCode?: string
  unit: string
  marketPrice: number
  supplyPrice: number
  centralStock?: number
  lastCostPrice?: number
  taxRate?: number
  netWeightKg?: number
  pricePerKg?: number
  minAlertQuantity?: number
  isCriticalChecklist?: boolean
}

interface InventoryItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: InventoryItemFormData | null
  onSave: (data: InventoryItemFormData) => Promise<void> | void
  onDelete?: (id: string) => Promise<void> | void
  isMaster?: boolean
}

export default function InventoryItemDialog({
  open,
  onOpenChange,
  item,
  onSave,
  onDelete,
  isMaster = false,
}: InventoryItemDialogProps) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('BASE')
  const [supplyCode, setSupplyCode] = useState('')
  const [unit, setUnit] = useState('Baldes')
  const [marketPrice, setMarketPrice] = useState(0)
  const [supplyPrice, setSupplyPrice] = useState(0)
  const [centralStock, setCentralStock] = useState(0)
  const [lastCostPrice, setLastCostPrice] = useState(0)
  const [taxRate, setTaxRate] = useState(23)
  const [netWeightKg, setNetWeightKg] = useState<number | ''>('')
  const [pricePerKg, setPricePerKg] = useState<number | ''>('')
  const [minAlertQuantity, setMinAlertQuantity] = useState(2)
  const [isCriticalChecklist, setIsCriticalChecklist] = useState(false)
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<{ id: string; name: string; code: string }[]>([
    { id: 'cat-base', name: 'Bases & Cremes', code: 'BASE' },
    { id: 'cat-calda', name: 'Caldas Nobres', code: 'CALDA' },
    { id: 'cat-fruta', name: 'Frutas Frescas', code: 'FRUTA' },
    { id: 'cat-topping', name: 'Acompanhamentos & Crocantes', code: 'TOPPING' },
    { id: 'cat-embalagem', name: 'Copos & Embalagens', code: 'EMBALAGEM' },
    { id: 'cat-descartavel', name: 'Descartáveis', code: 'DESCARTAVEL' },
    { id: 'cat-limpeza', name: 'Higiene & Limpeza', code: 'LIMPEZA' },
  ])

  // Carregar categorias dinâmicas do banco
  useEffect(() => {
    if (open) {
      fetch('/api/inventory/categories')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data.categories) && data.categories.length > 0) {
            setCategories(data.categories)
          }
        })
        .catch(() => {})
    }
  }, [open])

  useEffect(() => {
    if (item) {
      setName(item.name || '')
      setCategory(item.category || 'BASE')
      setSupplyCode(item.supplyCode || '')
      setUnit(item.unit || 'Baldes')
      setMarketPrice(item.marketPrice || 0)
      setSupplyPrice(item.supplyPrice || 0)
      setCentralStock(item.centralStock || 0)
      setLastCostPrice(item.lastCostPrice || 0)
      setTaxRate(item.taxRate !== undefined ? Number(item.taxRate) : 23)
      setNetWeightKg(item.netWeightKg !== undefined ? Number(item.netWeightKg) : '')
      setPricePerKg(item.pricePerKg !== undefined ? Number(item.pricePerKg) : '')
      setMinAlertQuantity(item.minAlertQuantity ?? 2)
      setIsCriticalChecklist(item.isCriticalChecklist ?? false)
    } else {
      setName('')
      setCategory('BASE')
      setSupplyCode('')
      setUnit('Baldes')
      setMarketPrice(0)
      setSupplyPrice(0)
      setCentralStock(0)
      setLastCostPrice(0)
      setTaxRate(23)
      setNetWeightKg('')
      setPricePerKg('')
      setMinAlertQuantity(2)
      setIsCriticalChecklist(false)
    }
  }, [item, open])

  // Auto-cálculo de preço sugerido se peso e preço por kg forem preenchidos
  const handleCalculateFromKg = () => {
    if (netWeightKg !== '' && pricePerKg !== '' && Number(netWeightKg) > 0 && Number(pricePerKg) > 0) {
      const calculated = Number((Number(netWeightKg) * Number(pricePerKg)).toFixed(2))
      setSupplyPrice(calculated)
    }
  }

  const costWithTax = Number((lastCostPrice * (1 + taxRate / 100)).toFixed(2))
  const supplyWithTax = Number((supplyPrice * (1 + taxRate / 100)).toFixed(2))
  const netMargin = Math.max(0, supplyPrice - lastCostPrice)
  const marginPercent = supplyPrice > 0 ? ((netMargin / supplyPrice) * 100).toFixed(1) : '0.0'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      await onSave({
        id: item?.id,
        name: name.trim(),
        category,
        supplyCode: supplyCode.trim() || undefined,
        unit,
        marketPrice: Number(marketPrice) || 0,
        supplyPrice: Number(supplyPrice) || 0,
        centralStock: Number(centralStock) || 0,
        lastCostPrice: Number(lastCostPrice) || 0,
        taxRate: Number(taxRate) || 23,
        netWeightKg: netWeightKg !== '' ? Number(netWeightKg) : undefined,
        pricePerKg: pricePerKg !== '' ? Number(pricePerKg) : undefined,
        minAlertQuantity: Number(minAlertQuantity) || 2,
        isCriticalChecklist,
      })
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] p-6 sm:p-7 bg-white dark:bg-[#160228] border border-purple-150 dark:border-white/15 text-purple-950 dark:text-white rounded-3xl shadow-2xl">
        <DialogHeader className="text-left border-b border-purple-100 dark:border-white/10 pb-3">
          <DialogTitle className="text-lg font-black text-purple-950 dark:text-white">
            {item?.id ? 'Editar Insumo de Estoque' : 'Cadastrar Novo Insumo'}
          </DialogTitle>
          <p className="text-xs text-purple-700/80 dark:text-purple-200/70 font-medium">
            {isMaster
              ? 'Configuração corporativa de insumo homologado com regime fiscal de Portugal (Preço Líquido + IVA)'
              : 'Definição do insumo e limites de alerta para esta unidade'}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* GRID PADRÃO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Nome do Insumo (2 colunas) */}
            <div className="col-span-1 sm:col-span-2 lg:col-span-2 space-y-1.5">
              <Label className="text-xs font-bold text-purple-950 dark:text-white">Nome do Insumo / Artigo</Label>
              <Input
                required
                placeholder="Ex: Açaí Tradicional Especial (Balde 4,5kg)..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 rounded-xl border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-white/5 text-xs text-purple-950 dark:text-white"
              />
            </div>

            {/* Código de Suprimento (1 coluna) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-purple-950 dark:text-white">Cód. Suprimento (SKU)</Label>
              <Input
                placeholder="SUP-ACA-4.5KG"
                value={supplyCode}
                onChange={(e) => setSupplyCode(e.target.value.toUpperCase())}
                className="h-10 rounded-xl border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-white/5 text-xs text-purple-950 dark:text-white font-mono uppercase"
              />
            </div>

            {/* Categoria (1 coluna) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-purple-950 dark:text-white">Categoria</Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 rounded-xl border border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-[#1f0338] px-3 text-xs font-bold text-purple-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600 cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat.id || cat.code} value={cat.code}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Unidade de Medida (1 coluna) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-purple-950 dark:text-white">Unidade de Medida</Label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full h-10 rounded-xl border border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-[#1f0338] px-3 text-xs font-bold text-purple-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600 cursor-pointer"
              >
                <option value="Baldes">Baldes</option>
                <option value="Sacos">Sacos</option>
                <option value="Kg">Quilos (Kg)</option>
                <option value="Latas">Latas</option>
                <option value="Centenas">Centenas</option>
                <option value="Caixas">Caixas</option>
                <option value="Unidades">Unidades</option>
              </select>
            </div>

            {/* Peso Líquido da Embalagem (1 coluna) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-purple-950 dark:text-white">Peso Líquido (Kg)</Label>
              <Input
                type="number"
                step="0.001"
                min="0"
                placeholder="Ex: 4.5 ou 10"
                value={netWeightKg}
                onChange={(e) => setNetWeightKg(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                className="h-10 rounded-xl border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-white/5 text-xs text-purple-950 dark:text-white font-mono"
              />
            </div>

            {/* Preço por Kg Líquido (1 coluna) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-purple-950 dark:text-white">Preço / Kg (€ s/ IVA)</Label>
                {netWeightKg !== '' && pricePerKg !== '' && Number(netWeightKg) > 0 && Number(pricePerKg) > 0 && (
                  <button
                    type="button"
                    onClick={handleCalculateFromKg}
                    className="text-[10px] text-purple-600 dark:text-pink-400 font-bold hover:underline cursor-pointer"
                    title="Preenche o preço da embalagem multiplicando peso × preço/kg"
                  >
                    Calcular = {formatCurrency(Number(netWeightKg) * Number(pricePerKg))}
                  </button>
                )}
              </div>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Ex: 7.90"
                value={pricePerKg}
                onChange={(e) => setPricePerKg(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                className="h-10 rounded-xl border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-white/5 text-xs text-purple-950 dark:text-white font-mono"
              />
            </div>

            {/* Alíquota de IVA (%) 100% Configurável (1 coluna) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-purple-950 dark:text-white">Classe de IVA (PT)</Label>
              <div className="flex items-center gap-1">
                {[
                  { label: '6%', val: 6, desc: 'Reduzido (Leite, Água)' },
                  { label: '13%', val: 13, desc: 'Intermédio (Prontos)' },
                  { label: '23%', val: 23, desc: 'Normal (B2B)' },
                ].map((b) => (
                  <button
                    key={b.val}
                    type="button"
                    onClick={() => setTaxRate(b.val)}
                    title={b.desc}
                    className={`flex-1 h-10 rounded-xl text-[11px] font-bold transition cursor-pointer border ${
                      taxRate === b.val
                        ? 'bg-purple-800 text-white border-purple-800 shadow-xs'
                        : 'bg-purple-50/50 dark:bg-white/5 text-purple-900 dark:text-purple-200 border-purple-200 dark:border-white/10 hover:bg-purple-100'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
                <div className="w-16 shrink-0 relative">
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="h-10 rounded-xl border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-white/5 text-[11px] text-purple-950 dark:text-white font-mono text-center px-1"
                    title="Alíquota de IVA personalizada"
                  />
                  <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-purple-500 font-bold pointer-events-none">%</span>
                </div>
              </div>
            </div>

            {/* Preço de Custo Fornecedor Líquido (€ s/ IVA) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-purple-950 dark:text-white">Custo Fornec. (€ s/ IVA)</Label>
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono">
                  {formatCurrency(costWithTax)} c/ IVA
                </span>
              </div>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={lastCostPrice}
                onChange={(e) => setLastCostPrice(parseFloat(e.target.value) || 0)}
                className="h-10 rounded-xl border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-white/5 text-xs text-purple-950 dark:text-white font-mono"
              />
            </div>

            {/* Preço de Venda Franquia Líquido (€ s/ IVA) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-purple-950 dark:text-white">Venda Franquia (€ s/ IVA)</Label>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                  {formatCurrency(supplyWithTax)} c/ IVA
                </span>
              </div>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={supplyPrice}
                onChange={(e) => setSupplyPrice(parseFloat(e.target.value) || 0)}
                className="h-10 rounded-xl border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-white/5 text-xs text-purple-950 dark:text-white font-mono"
              />
            </div>

            {/* Preço Mercado Externo (€) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-purple-950 dark:text-white">Mercado Externo (€)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={marketPrice}
                onChange={(e) => setMarketPrice(parseFloat(e.target.value) || 0)}
                className="h-10 rounded-xl border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-white/5 text-xs text-purple-950 dark:text-white font-mono"
              />
            </div>

            {/* Estoque Mínimo de Alerta */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-purple-950 dark:text-white">Estoque Mínimo ({unit})</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={minAlertQuantity}
                onChange={(e) => setMinAlertQuantity(parseFloat(e.target.value) || 0)}
                className="h-10 rounded-xl border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-white/5 text-xs text-purple-950 dark:text-white font-mono"
              />
            </div>

            {/* Se for Master (Matriz): Estoque Central e Card de Margem Líquida */}
            {isMaster && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-purple-950 dark:text-white">Estoque Central Matriz ({unit})</Label>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    value={centralStock}
                    onChange={(e) => setCentralStock(parseFloat(e.target.value) || 0)}
                    className="h-10 rounded-xl border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-white/5 text-xs text-purple-950 dark:text-white font-mono"
                  />
                </div>

                <div className="col-span-1 sm:col-span-2 lg:col-span-3 p-3.5 rounded-2xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/40 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-purple-900 dark:text-purple-200 block">
                      Margem Líquida da Matriz (Sem Impostos)
                    </span>
                    <span className="text-[10px] text-purple-700/80 dark:text-purple-300/70">
                      Venda s/ IVA ({formatCurrency(supplyPrice)}) - Custo s/ IVA ({formatCurrency(lastCostPrice)})
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-base font-black text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(netMargin)} / {unit}
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                      +{marginPercent}% margem líquida
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Checklist de Fechamento (Linha inteira) */}
            <div className="col-span-full flex items-center space-x-2 pt-2 border-t border-purple-100 dark:border-white/10">
              <input
                type="checkbox"
                id="isCritical"
                checked={isCriticalChecklist}
                onChange={(e) => setIsCriticalChecklist(e.target.checked)}
                className="h-4 w-4 rounded border-purple-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
              <label
                htmlFor="isCritical"
                className="text-xs text-purple-900 dark:text-purple-200 font-medium cursor-pointer"
              >
                Item Crítico de Fechamento (Aparece no Checklist Rápido de Turno)
              </label>
            </div>
          </div>

          <DialogFooter className="pt-3 gap-2 border-t border-purple-100 dark:border-white/10 flex items-center justify-between">
            {item?.id && onDelete ? (
              <Button
                type="button"
                variant="ghost"
                disabled={loading}
                onClick={async () => {
                  if (confirm(`Tem certeza que deseja excluir o insumo "${item.name}" da rede?`)) {
                    await onDelete(item.id!)
                    onOpenChange(false)
                  }
                }}
                className="rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-bold gap-1.5 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                <span>Excluir Insumo</span>
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 text-xs font-bold text-purple-950 dark:text-white cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 text-white font-bold text-xs shadow-xs cursor-pointer px-5"
              >
                {loading ? 'A gravar...' : item?.id ? 'Salvar Alterações' : 'Cadastrar Insumo'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
