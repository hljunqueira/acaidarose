'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/i18n/formatters'
import { Sliders, Percent, Building, Calendar, Info, Check, ShieldCheck, DollarSign, Laptop } from 'lucide-react'

export interface FranchiseContractData {
  id: string
  tenantId?: string
  storeName: string
  franchiseeName: string
  nif: string
  startDate: string
  renewalDate: string
  franchiseFee: number
  monthsActive: number
  royaltyPercent: number
  marketingPercent: number
  systemFeeMonthly?: number
  status: string
  monthlyRevenue: number
  paymentStatus?: 'PAID' | 'PENDING' | 'GRACE'
  gracePeriodNotes?: string
}

interface EditRoyaltyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contract: FranchiseContractData | null
  onSave: (updatedContract: FranchiseContractData) => void
}

export default function EditRoyaltyDialog({
  open,
  onOpenChange,
  contract,
  onSave,
}: EditRoyaltyDialogProps) {
  const [royaltyPercent, setRoyaltyPercent] = useState<number>(5.0)
  const [marketingPercent, setMarketingPercent] = useState<number>(1.0)
  const [systemFeeMonthly, setSystemFeeMonthly] = useState<number>(49.0)
  const [modelType, setModelType] = useState<'STANDARD' | 'GRACE_0' | 'GROWTH_2' | 'CUSTOM'>('STANDARD')
  const [notes, setNotes] = useState<string>('')
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'PENDING' | 'GRACE'>('PENDING')

  useEffect(() => {
    if (contract) {
      setRoyaltyPercent(contract.royaltyPercent)
      setMarketingPercent(contract.marketingPercent)
      setSystemFeeMonthly(contract.systemFeeMonthly !== undefined ? contract.systemFeeMonthly : 49.0)
      setNotes(contract.gracePeriodNotes || '')
      setPaymentStatus(contract.paymentStatus || (contract.royaltyPercent === 0 ? 'GRACE' : 'PENDING'))

      if (contract.royaltyPercent === 5.0 && contract.marketingPercent === 1.0) {
        setModelType('STANDARD')
      } else if (contract.royaltyPercent === 0.0) {
        setModelType('GRACE_0')
      } else if (contract.royaltyPercent === 2.0) {
        setModelType('GROWTH_2')
      } else {
        setModelType('CUSTOM')
      }
    }
  }, [contract, open])

  const handleSelectModel = (type: 'STANDARD' | 'GRACE_0' | 'GROWTH_2' | 'CUSTOM') => {
    setModelType(type)
    if (type === 'STANDARD') {
      setRoyaltyPercent(5.0)
      setMarketingPercent(1.0)
      setSystemFeeMonthly(49.0)
      setPaymentStatus('PENDING')
    } else if (type === 'GRACE_0') {
      setRoyaltyPercent(0.0)
      setMarketingPercent(1.0)
      setSystemFeeMonthly(0.0)
      setPaymentStatus('GRACE')
    } else if (type === 'GROWTH_2') {
      setRoyaltyPercent(2.0)
      setMarketingPercent(1.0)
      setSystemFeeMonthly(49.0)
      setPaymentStatus('PENDING')
    }
  }

  if (!contract) return null

  const monthlyRev = contract.monthlyRevenue || 15000
  const calculatedRoyalty = monthlyRev * (royaltyPercent / 100)
  const calculatedMarketing = monthlyRev * (marketingPercent / 100)
  const feeSystem = Number(systemFeeMonthly || 0)
  const totalDue = calculatedRoyalty + calculatedMarketing + feeSystem

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...contract,
      royaltyPercent: Number(royaltyPercent),
      marketingPercent: Number(marketingPercent),
      systemFeeMonthly: Number(systemFeeMonthly),
      paymentStatus,
      gracePeriodNotes: notes,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-5 md:p-6 bg-white dark:bg-[#160228] text-slate-900 dark:text-white border border-purple-150 dark:border-white/20 rounded-3xl shadow-2xl">
        {/* Header Compacto */}
        <DialogHeader className="text-left pb-2.5 border-b border-purple-100 dark:border-white/10 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-base font-black text-purple-950 dark:text-white flex items-center gap-2">
              <Sliders className="h-4 w-4 text-purple-700 dark:text-pink-400" />
              <span>Ajuste de Royalties & Sistema da Unidade</span>
            </DialogTitle>
            <div className="text-xs text-purple-700/80 dark:text-purple-200/70 mt-0.5">
              {contract.storeName} · NIF: <span className="font-mono font-bold">{contract.nif}</span>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="pt-2 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            {/* Coluna Esquerda: Controles e Modelos (7 Colunas) */}
            <div className="md:col-span-7 space-y-3">
              {/* Seletor de Modelos Predefinidos (4 Grids Lado a Lado) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">
                  Regra / Modelo Contratual:
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectModel('STANDARD')}
                    className={`p-2 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                      modelType === 'STANDARD'
                        ? 'border-purple-600 dark:border-pink-500 bg-purple-50 dark:bg-pink-500/10 font-bold ring-2 ring-purple-600/30'
                        : 'border-purple-150 dark:border-white/10 bg-purple-50/40 dark:bg-white/5 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[11px] font-black text-purple-950 dark:text-white">
                      <span>Padrão 5%</span>
                      {modelType === 'STANDARD' && <Check className="h-3 w-3 text-purple-700 dark:text-pink-400" />}
                    </div>
                    <div className="text-[9px] text-purple-700/80 dark:text-purple-200/60 mt-0.5">&gt; 12 meses</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectModel('GRACE_0')}
                    className={`p-2 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                      modelType === 'GRACE_0'
                        ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 font-bold ring-2 ring-emerald-600/30'
                        : 'border-purple-150 dark:border-white/10 bg-purple-50/40 dark:bg-white/5 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[11px] font-black text-emerald-800 dark:text-emerald-300">
                      <span>Carência 0%</span>
                      {modelType === 'GRACE_0' && <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />}
                    </div>
                    <div className="text-[9px] text-purple-700/80 dark:text-purple-200/60 mt-0.5">0 a 6 meses</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectModel('GROWTH_2')}
                    className={`p-2 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                      modelType === 'GROWTH_2'
                        ? 'border-purple-600 dark:border-pink-500 bg-purple-50 dark:bg-pink-500/10 font-bold ring-2 ring-purple-600/30'
                        : 'border-purple-150 dark:border-white/10 bg-purple-50/40 dark:bg-white/5 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[11px] font-black text-purple-950 dark:text-white">
                      <span>Cresc. 2%</span>
                      {modelType === 'GROWTH_2' && <Check className="h-3 w-3 text-purple-700 dark:text-pink-400" />}
                    </div>
                    <div className="text-[9px] text-purple-700/80 dark:text-purple-200/60 mt-0.5">7º ao 12º m.</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModelType('CUSTOM')}
                    className={`p-2 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                      modelType === 'CUSTOM'
                        ? 'border-purple-600 dark:border-pink-500 bg-purple-50 dark:bg-pink-500/10 font-bold ring-2 ring-purple-600/30'
                        : 'border-purple-150 dark:border-white/10 bg-purple-50/40 dark:bg-white/5 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[11px] font-black text-purple-950 dark:text-white">
                      <span>Personaliz.</span>
                      {modelType === 'CUSTOM' && <Check className="h-3 w-3 text-purple-700 dark:text-pink-400" />}
                    </div>
                    <div className="text-[9px] text-purple-700/80 dark:text-purple-200/60 mt-0.5">Livre</div>
                  </button>
                </div>
              </div>

              {/* 3 Inputs das Taxas: Royalties, Marketing e Sistema */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-purple-950 dark:text-purple-200">
                    Royalties (%):
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="20"
                      value={royaltyPercent}
                      onChange={(e) => {
                        setRoyaltyPercent(Number(e.target.value))
                        setModelType('CUSTOM')
                      }}
                      className="h-8 text-xs rounded-xl bg-purple-50/50 dark:bg-white/5 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white font-mono font-bold pl-2.5 pr-6"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 font-bold text-purple-600 dark:text-pink-400 text-[10px]">%</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-purple-950 dark:text-purple-200">
                    Marketing (%):
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={marketingPercent}
                      onChange={(e) => {
                        setMarketingPercent(Number(e.target.value))
                        setModelType('CUSTOM')
                      }}
                      className="h-8 text-xs rounded-xl bg-purple-50/50 dark:bg-white/5 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white font-mono font-bold pl-2.5 pr-6"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 font-bold text-purple-600 dark:text-pink-400 text-[10px]">%</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-purple-950 dark:text-purple-200">
                    Sistema / PDV (€):
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      value={systemFeeMonthly}
                      onChange={(e) => {
                        setSystemFeeMonthly(Number(e.target.value))
                        setModelType('CUSTOM')
                      }}
                      className="h-8 text-xs rounded-xl bg-purple-50/50 dark:bg-white/5 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white font-mono font-bold pl-2.5 pr-6"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 font-bold text-purple-600 dark:text-pink-400 text-[10px]">€</span>
                  </div>
                </div>
              </div>

              {/* Status do Repasse e Observação Lado a Lado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-purple-950 dark:text-purple-200">
                    Status do Mês:
                  </Label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as any)}
                    className="w-full h-8 px-2.5 rounded-xl border border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-white/5 text-[11px] font-bold text-purple-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-pink-500 [&>option]:bg-white dark:[&>option]:bg-[#160228]"
                  >
                    <option value="PAID">Liquidado</option>
                    <option value="PENDING">Fecho Dia 10</option>
                    <option value="GRACE">Carência</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-purple-950 dark:text-purple-200">
                    Observação / Termo:
                  </Label>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Licença com carência..."
                    className="h-8 text-xs rounded-xl bg-purple-50/50 dark:bg-white/5 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Coluna Direita: Simulação Financeira & Ações (5 Colunas) */}
            <div className="md:col-span-5 p-4 rounded-2xl bg-purple-50/70 dark:bg-white/5 border border-purple-150 dark:border-white/10 space-y-2.5">
              <div className="text-[10px] font-black uppercase text-purple-700 dark:text-pink-300 tracking-wider">
                Simulação em Tempo Real
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-purple-700/80 dark:text-purple-200/70">Faturamento Declarado:</span>
                  <span className="font-bold text-purple-950 dark:text-white font-mono">{formatCurrency(monthlyRev)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-purple-700/80 dark:text-purple-200/70">Royalties ({royaltyPercent}%):</span>
                  <span className="font-bold text-purple-700 dark:text-pink-300 font-mono">{formatCurrency(calculatedRoyalty)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-purple-700/80 dark:text-purple-200/70">Fundo Mkt ({marketingPercent}%):</span>
                  <span className="font-bold text-purple-950 dark:text-white font-mono">{formatCurrency(calculatedMarketing)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-purple-700/80 dark:text-purple-200/70">Licença Sistema & PDV:</span>
                  <span className="font-bold text-purple-950 dark:text-white font-mono">
                    {feeSystem === 0 ? <Badge className="bg-emerald-100 text-emerald-800 text-[8px] py-0">ISENTO</Badge> : formatCurrency(feeSystem)}
                  </span>
                </div>
                <div className="pt-2 border-t border-purple-200 dark:border-white/10 flex items-center justify-between font-bold">
                  <span className="text-xs text-purple-950 dark:text-white">Total à Holding:</span>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {formatCurrency(totalDue)}
                  </span>
                </div>
              </div>

              {/* Botões de Ação na Base da Coluna Direita */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-purple-200 dark:border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="h-8 text-xs font-bold rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 text-purple-950 dark:text-white hover:bg-purple-50 dark:hover:bg-white/10 cursor-pointer"
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  size="sm"
                  className="h-8 bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 hover:from-purple-800 hover:to-pink-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Salvar Alterações
                </Button>
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
