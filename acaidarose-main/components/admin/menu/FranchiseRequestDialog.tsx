'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Building2, Send, AlertCircle, ShieldAlert } from 'lucide-react'
import { useMenuConfigStore } from '@/lib/stores/menuConfigStore'

interface FranchiseRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
  tenantName?: string
  initialItem?: any
  initialType?: 'NEW_PRODUCT' | 'PRICE_CHANGE'
}

export default function FranchiseRequestDialog({
  open,
  onOpenChange,
  tenantId,
  tenantName = 'Loja Franqueada',
  initialItem,
  initialType = 'PRICE_CHANGE',
}: FranchiseRequestDialogProps) {
  const { addChangeRequest } = useMenuConfigStore()
  const [requestType, setRequestType] = useState<'NEW_PRODUCT' | 'PRICE_CHANGE'>(initialType)
  const [itemName, setItemName] = useState(initialItem?.name || '')
  const [targetCollection, setTargetCollection] = useState<'containers' | 'bases' | 'toppings'>('containers')
  const [currentPrice, setCurrentPrice] = useState<number>(initialItem?.precoBase || initialItem?.price || 0)
  const [proposedPrice, setProposedPrice] = useState<number>(initialItem?.precoBase || initialItem?.price || 0)
  const [justification, setJustification] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!itemName.trim()) {
      toast.error('Informe o nome do produto')
      return
    }
    if (!justification.trim() || justification.trim().length < 10) {
      toast.error('Informe uma justificativa detalhada para a franqueadora (mínimo 10 caracteres)')
      return
    }

    setSubmitting(true)
    try {
      addChangeRequest({
        tenantId,
        tenantName,
        requestType,
        itemName: itemName.trim(),
        targetCollection,
        currentPrice: requestType === 'PRICE_CHANGE' ? currentPrice : undefined,
        proposedPrice: Number(proposedPrice) || 0,
        justification: justification.trim(),
      })

      toast.success('Solicitação enviada com sucesso para a Franqueadora Master!')
      onOpenChange(false)
      setJustification('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 bg-white rounded-3xl border border-purple-100 shadow-2xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-700">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-black text-zinc-900">
                Solicitação à Franqueadora
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Novos produtos ou alterações de preço base exigem aprovação da Holding.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 my-2">
          {/* Tipo de Solicitação */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRequestType('PRICE_CHANGE')}
              className={`p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer text-left ${
                requestType === 'PRICE_CHANGE'
                  ? 'border-purple-600 bg-purple-50 text-purple-950 shadow-xs'
                  : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              💶 Alterar Preço Base
            </button>
            <button
              type="button"
              onClick={() => setRequestType('NEW_PRODUCT')}
              className={`p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer text-left ${
                requestType === 'NEW_PRODUCT'
                  ? 'border-purple-600 bg-purple-50 text-purple-950 shadow-xs'
                  : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              ➕ Novo Produto
            </button>
          </div>

          {/* Nome do Produto */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-zinc-700">Nome do Produto / Item</Label>
            <Input
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="Ex: Açaí 500g ou Barca Especial"
              required
              className="h-10 rounded-xl text-xs"
            />
          </div>

          {/* Valores (€) */}
          <div className="grid grid-cols-2 gap-3">
            {requestType === 'PRICE_CHANGE' && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-700">Preço Atual (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  disabled
                  value={currentPrice}
                  className="h-10 rounded-xl text-xs bg-zinc-100 font-mono"
                />
              </div>
            )}
            <div className={requestType === 'PRICE_CHANGE' ? 'space-y-1.5' : 'col-span-2 space-y-1.5'}>
              <Label className="text-xs font-bold text-zinc-700">Preço Sugerido (€)</Label>
              <Input
                type="number"
                step="0.01"
                required
                value={proposedPrice}
                onChange={(e) => setProposedPrice(Number(e.target.value))}
                className="h-10 rounded-xl text-xs font-mono font-bold text-purple-900"
              />
            </div>
          </div>

          {/* Justificativa Comercial */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-zinc-700 flex items-center justify-between">
              <span>Justificativa para a Franqueadora</span>
              <span className="text-[10px] text-muted-foreground font-normal">Obrigatório</span>
            </Label>
            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Explique o motivo do reajuste ou a demanda de clientes para este novo produto..."
              rows={3}
              required
              className="w-full p-2.5 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-tight flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-700 flex-shrink-0" />
            <span>A solicitação será enviada ao Super Admin e notificada no painel corporativo.</span>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => onOpenChange(false)}
              className="h-10 rounded-xl text-xs font-bold"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="h-10 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs px-5 shadow-md flex items-center gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{submitting ? 'A enviar...' : 'Enviar para Aprovação'}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
