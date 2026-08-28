'use client'

import React, { useState, useMemo } from 'react'
import { OrderStatus, PaymentMethodCode, ProductContainer, ProductBase, ProductTopping } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingBag, Check, Star, AlertCircle, Utensils, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/i18n/formatters'
import { CONTAINERS, BASES, TOPPINGS } from '@/lib/catalog'

interface NewOrderManualModalProps {
  tenantId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateOrder: (orderPayload: any) => Promise<void>
}

export default function NewOrderManualModal({
  tenantId,
  open,
  onOpenChange,
  onCreateOrder,
}: NewOrderManualModalProps) {
  // Configurações do Atendimento
  const [isTableOrder, setIsTableOrder] = useState(true)
  const [tableNumber, setTableNumber] = useState('Mesa 01')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<OrderStatus>('NEW')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodCode>('NUMERARIO')
  const [loading, setLoading] = useState(false)

  // Seleções do Açaí
  const [selectedContainer, setSelectedContainer] = useState<ProductContainer>(CONTAINERS[1] || CONTAINERS[0])
  const [selectedBases, setSelectedBases] = useState<ProductBase[]>([BASES[0]])
  const [selectedToppings, setSelectedToppings] = useState<ProductTopping[]>([
    TOPPINGS.find((t) => t.name === 'Banana') || TOPPINGS[0],
    TOPPINGS.find((t) => t.name === 'Granola') || TOPPINGS[1],
  ])

  // Separação de Toppings por categoria
  const fruits = useMemo(() => TOPPINGS.filter((t) => t.category === 'Frutas' && !t.isPremium), [])
  const regularToppings = useMemo(() => TOPPINGS.filter((t) => t.category === 'Toppings' && !t.isPremium), [])
  const premiumToppings = useMemo(() => TOPPINGS.filter((t) => t.isPremium || t.category === 'Adicionais'), [])

  // Alternar Base
  const toggleBase = (base: ProductBase) => {
    if (selectedBases.some((b) => b.id === base.id)) {
      if (selectedBases.length > 1) {
        setSelectedBases(selectedBases.filter((b) => b.id !== base.id))
      }
    } else {
      setSelectedBases([...selectedBases, base])
    }
  }

  // Alternar Topping
  const toggleTopping = (topping: ProductTopping) => {
    if (selectedToppings.some((t) => t.id === topping.id)) {
      setSelectedToppings(selectedToppings.filter((t) => t.id !== topping.id))
    } else {
      setSelectedToppings([...selectedToppings, topping])
    }
  }

  // Cálculo de Preço Total
  const totalAmount = useMemo(() => {
    const basePrice = selectedContainer.precoBase || 0
    const premiumExtras = selectedToppings
      .filter((t) => t.isPremium)
      .reduce((sum, t) => sum + (t.precoExtra || 1.0), 0)
    return +(basePrice + premiumExtras).toFixed(2)
  }, [selectedContainer, selectedToppings])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        tenantId,
        isTableOrder,
        tableNumber: isTableOrder ? (tableNumber.trim() || 'Mesa 01') : null,
        customerName: customerName.trim() || (isTableOrder ? `Cliente ${tableNumber}` : 'Cliente Balcão'),
        customerPhone: customerPhone.trim() || null,
        status,
        paymentStatus: status === 'PAID' ? 'PAID' : 'PENDING',
        paymentMethod,
        notes: notes.trim() || null,
        total: totalAmount,
        subtotal: totalAmount,
        items: [
          {
            containerId: selectedContainer.id,
            containerName: selectedContainer.name,
            containerEmoji: selectedContainer.emoji,
            containerPrice: selectedContainer.precoBase,
            bases: selectedBases.map((b) => ({ id: b.id, name: b.name })),
            toppings: selectedToppings.map((t) => ({
              id: t.id,
              name: t.name,
              emoji: t.emoji,
              isPremium: !!t.isPremium,
              precoCobrado: t.isPremium ? (t.precoExtra || 1.0) : 0,
            })),
            lineTotal: totalAmount,
          },
        ],
      }

      await onCreateOrder(payload)
      toast.success(`Comanda registada com sucesso! Total: ${formatCurrency(totalAmount)}`)
      onOpenChange(false)
      // Reset campos rápidos
      setCustomerName('')
      setCustomerPhone('')
      setNotes('')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar comanda manual')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full max-w-5xl max-h-[90vh] overflow-y-auto p-3 sm:p-6 bg-white dark:bg-[#160228] text-slate-900 dark:text-white border border-purple-100 dark:border-white/15 rounded-3xl shadow-2xl">
        {/* Topo do Modal */}
        <DialogHeader className="pb-3 border-b border-purple-100 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-purple-100 text-purple-900 rounded-xl">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-foreground">
                  Abertura de Comanda Manual
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  Monte a comanda personalizada escolhendo o tamanho, bases, frutas e complementos.
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <Badge className="bg-purple-700 text-white font-extrabold text-xs px-2.5 py-1">
                Total: {formatCurrency(totalAmount)}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-2">
          {/* LADO ESQUERDO: Grade de Produtos e Ingredientes (7 colunas) */}
          <div className="lg:col-span-7 space-y-5">
            {/* 1. Grade de Tamanhos / Copos */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-black uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
                  <span>1. Tamanho do Açaí</span>
                  <span className="text-purple-600 font-normal">({CONTAINERS.length} opções)</span>
                </Label>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {selectedContainer.name} · {formatCurrency(selectedContainer.precoBase)}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {CONTAINERS.map((c) => {
                  const isSelected = selectedContainer.id === c.id
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedContainer(c)}
                      className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50/80 ring-2 ring-purple-600/20 shadow-xs'
                          : 'border-purple-100 hover:border-purple-200 bg-white hover:bg-purple-50/30'
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute top-2 right-2 h-4 w-4 bg-purple-700 text-white rounded-full flex items-center justify-center text-[10px]">
                          ✓
                        </span>
                      )}
                      <div className="text-xl mb-1">{c.emoji}</div>
                      <div>
                        <div className="text-xs font-black text-foreground truncate">{c.name}</div>
                        <div className="text-xs font-extrabold text-purple-700 mt-0.5">
                          {formatCurrency(c.precoBase)}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 2. Grade de Bases & Cremes */}
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-wider text-purple-950 flex items-center justify-between">
                <span>2. Bases & Cremes</span>
                <span className="text-[10px] text-purple-700 font-bold lowercase">
                  ({selectedBases.length} selecionada(s))
                </span>
              </Label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {BASES.map((base) => {
                  const isSelected = selectedBases.some((b) => b.id === base.id)
                  return (
                    <button
                      key={base.id}
                      type="button"
                      onClick={() => toggleBase(base)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer ${
                        isSelected
                          ? 'bg-purple-700 text-white border-purple-700 shadow-2xs font-bold'
                          : 'bg-white text-foreground border-purple-100 hover:bg-purple-50/50 text-xs'
                      }`}
                    >
                      <span className="text-sm flex-shrink-0">{base.emoji}</span>
                      <span className="text-[11px] font-semibold truncate leading-tight">
                        {base.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 3. Grade de Frutas & Toppings Gratuitos */}
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-wider text-purple-950 flex items-center justify-between">
                <span>3. Frutas & Toppings Tradicionais</span>
                <span className="text-[10px] text-muted-foreground font-medium">Inclusos no copo</span>
              </Label>

              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-purple-50/30 rounded-2xl border border-purple-100">
                {[...fruits, ...regularToppings].map((top) => {
                  const isSelected = selectedToppings.some((t) => t.id === top.id)
                  return (
                    <button
                      key={top.id}
                      type="button"
                      onClick={() => toggleTopping(top)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                        isSelected
                          ? 'bg-purple-700 text-white border-purple-700 shadow-2xs'
                          : 'bg-white text-muted-foreground border-purple-100 hover:bg-purple-50 hover:text-foreground'
                      }`}
                    >
                      <span>{top.emoji}</span>
                      <span>{top.name}</span>
                      {isSelected && <Check className="h-3 w-3" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 4. Grade de Especiais & Caldas Premium */}
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
                <span>4. Especiais & Caldas Premium</span>
              </Label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {premiumToppings.map((top) => {
                  const isSelected = selectedToppings.some((t) => t.id === top.id)
                  return (
                    <button
                      key={top.id}
                      type="button"
                      onClick={() => toggleTopping(top)}
                      className={`p-2.5 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                          : 'bg-white border-amber-200/80 hover:bg-amber-50/50 text-foreground'
                      }`}
                    >
                      <div className="min-w-0 pr-1">
                        <div className="text-[11px] font-black truncate">{top.emoji} {top.name}</div>
                        <div className={`text-[10px] font-extrabold ${isSelected ? 'text-white' : 'text-amber-700'}`}>
                          +{formatCurrency(top.precoExtra || 1.0)}
                        </div>
                      </div>
                      {isSelected ? (
                        <Check className="h-4 w-4 flex-shrink-0" />
                      ) : (
                        <div className="h-3.5 w-3.5 rounded-full border border-amber-600/40 flex-shrink-0" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* LADO DIREITO: Resumo do Atendimento & Abertura da Comanda (5 colunas) */}
          <div className="lg:col-span-5 bg-purple-50/40 p-4 sm:p-5 rounded-3xl border border-purple-100 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="text-xs font-black uppercase tracking-wider text-purple-950 pb-2 border-b border-purple-200/60 flex items-center justify-between">
                <span>Resumo da Comanda</span>
                <Badge className="bg-purple-200 text-purple-950 text-[10px] font-bold">
                  {isTableOrder ? tableNumber : 'Balcão'}
                </Badge>
              </div>

              {/* Tipo de Atendimento */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Local do Consumo</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsTableOrder(true)}
                    className={`py-2 text-xs font-black rounded-xl border transition cursor-pointer ${
                      isTableOrder
                        ? 'bg-purple-700 text-white border-purple-700 shadow-2xs'
                        : 'bg-white text-purple-900 border-purple-200 hover:bg-purple-100/60'
                    }`}
                  >
                    Na Mesa
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsTableOrder(false)}
                    className={`py-2 text-xs font-black rounded-xl border transition cursor-pointer ${
                      !isTableOrder
                        ? 'bg-purple-700 text-white border-purple-700 shadow-2xs'
                        : 'bg-white text-purple-900 border-purple-200 hover:bg-purple-100/60'
                    }`}
                  >
                    Balcão
                  </button>
                </div>
              </div>

              {/* Se for mesa, campo da mesa */}
              {isTableOrder && (
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-foreground">Mesa / Posição</Label>
                  <Input
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="Ex: Mesa 04"
                    className="rounded-xl h-9 text-xs border-purple-200 bg-white font-bold"
                    required
                  />
                </div>
              )}

              {/* Dados do Cliente */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-foreground">Nome (Opcional)</Label>
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ex: Tiago"
                    className="rounded-xl h-9 text-xs border-purple-200 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-foreground">Contacto</Label>
                  <Input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="912..."
                    className="rounded-xl h-9 text-xs border-purple-200 bg-white"
                  />
                </div>
              </div>

              {/* Estado e Forma de Pagamento */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-foreground">Estado Inicial</Label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as OrderStatus)}
                    className="w-full h-9 rounded-xl border border-purple-200 bg-white px-2.5 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    <option value="NEW">Novo Pedido</option>
                    <option value="PREPARING">Em Preparação</option>
                    <option value="READY">Pronto</option>
                    <option value="PAID">Pago</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-foreground">Pagamento</Label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodCode)}
                    className="w-full h-9 rounded-xl border border-purple-200 bg-white px-2.5 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    <option value="NUMERARIO">Numerário</option>
                    <option value="MULTIBANCO">Multibanco</option>
                    <option value="MB_WAY">MB Way</option>
                  </select>
                </div>
              </div>

              {/* Observações da Cozinha */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-foreground">Notas / Observações</Label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Caprichar no morango, sem granola..."
                  rows={2}
                  className="w-full p-2 rounded-xl border border-purple-200 bg-white text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
            </div>

            {/* Total e Botões de Submissão */}
            <div className="pt-3 border-t border-purple-200/60 space-y-3">
              <div className="p-3 bg-white rounded-2xl border border-purple-200 flex items-center justify-between shadow-2xs">
                <div>
                  <span className="text-[11px] text-muted-foreground block font-medium">Total Calculado</span>
                  <span className="text-[10px] text-purple-700 font-bold">Base + Adicionais</span>
                </div>
                <span className="text-2xl font-black text-purple-900">
                  {formatCurrency(totalAmount)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                  className="rounded-xl border-purple-200 text-xs font-bold h-10 px-4"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-10 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs gap-1.5 shadow-sm cursor-pointer"
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span>{loading ? 'A registar...' : 'Abrir Comanda'}</span>
                </Button>
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
