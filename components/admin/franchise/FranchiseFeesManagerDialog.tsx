'use client'

import React, { useState } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/i18n/formatters'
import { toast } from 'sonner'
import {
  Sliders,
  DollarSign,
  Percent,
  Layers,
  Edit2,
  Trash2,
  CheckCircle,
  Building,
  Tag,
  Calendar,
  CreditCard,
  Laptop,
} from 'lucide-react'

export interface FranchiseFeeCharge {
  id: string
  storeId: string
  storeName: string
  title: string
  category: 'ROYALTIES' | 'MARKETING' | 'SISTEMA' | 'OUTROS'
  chargeType: 'PERCENTAGE' | 'FIXED_AMOUNT'
  value: number
  frequency: 'MENSAL' | 'ANUAL' | 'PONTUAL'
  status: 'ATIVO' | 'ISENTO' | 'SUSPENSO'
  description?: string
}

interface FranchiseFeesManagerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fees: FranchiseFeeCharge[]
  onSaveFees: (updatedFees: FranchiseFeeCharge[]) => void
  stores: { id: string; name: string }[]
}

export default function FranchiseFeesManagerDialog({
  open,
  onOpenChange,
  fees,
  onSaveFees,
  stores,
}: FranchiseFeesManagerDialogProps) {
  const [feeList, setFeeList] = useState<FranchiseFeeCharge[]>(fees)
  const [editingFee, setEditingFee] = useState<FranchiseFeeCharge | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // Form states
  const [formStoreId, setFormStoreId] = useState<string>(stores[0]?.id || 'ALL')
  const [formTitle, setFormTitle] = useState<string>('')
  const [formCategory, setFormCategory] = useState<'ROYALTIES' | 'MARKETING' | 'SISTEMA' | 'OUTROS'>('SISTEMA')
  const [formChargeType, setFormChargeType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('FIXED_AMOUNT')
  const [formValue, setFormValue] = useState<number>(49.0)
  const [formFrequency, setFormFrequency] = useState<'MENSAL' | 'ANUAL' | 'PONTUAL'>('MENSAL')
  const [formStatus, setFormStatus] = useState<'ATIVO' | 'ISENTO' | 'SUSPENSO'>('ATIVO')
  const [formDescription, setFormDescription] = useState<string>('')

  const handleOpenCreate = () => {
    setEditingFee(null)
    setFormStoreId(stores[0]?.id || 'ALL')
    setFormTitle('Licença do Sistema & PDV')
    setFormCategory('SISTEMA')
    setFormChargeType('FIXED_AMOUNT')
    setFormValue(49.0)
    setFormFrequency('MENSAL')
    setFormStatus('ATIVO')
    setFormDescription('Cobrança mensal de licença de software por unidade')
    setIsCreating(true)
  }

  const handleOpenEdit = (fee: FranchiseFeeCharge) => {
    setEditingFee(fee)
    setFormStoreId(fee.storeId)
    setFormTitle(fee.title)
    setFormCategory(fee.category)
    setFormChargeType(fee.chargeType)
    setFormValue(fee.value)
    setFormFrequency(fee.frequency)
    setFormStatus(fee.status)
    setFormDescription(fee.description || '')
    setIsCreating(true)
  }

  const handleDeleteFee = (id: string) => {
    const updated = feeList.filter((f) => f.id !== id)
    setFeeList(updated)
    onSaveFees(updated)
    toast.success('Cobrança removida com sucesso')
  }

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle) {
      toast.error('Informe o nome da cobrança')
      return
    }

    const targetStore = stores.find((s) => s.id === formStoreId)
    const storeName = formStoreId === 'ALL' ? 'Todas as Unidades da Rede' : targetStore?.name || 'Unidade'

    let updated: FranchiseFeeCharge[]

    if (editingFee) {
      updated = feeList.map((f) =>
        f.id === editingFee.id
          ? {
              ...f,
              storeId: formStoreId,
              storeName,
              title: formTitle,
              category: formCategory,
              chargeType: formChargeType,
              value: Number(formValue),
              frequency: formFrequency,
              status: formStatus,
              description: formDescription,
            }
          : f
      )
      toast.success('Cobrança atualizada com sucesso')
    } else {
      const newFee: FranchiseFeeCharge = {
        id: `fee-${Date.now()}`,
        storeId: formStoreId,
        storeName,
        title: formTitle,
        category: formCategory,
        chargeType: formChargeType,
        value: Number(formValue),
        frequency: formFrequency,
        status: formStatus,
        description: formDescription,
      }
      updated = [newFee, ...feeList]
      toast.success('Nova cobrança vinculada com sucesso')
    }

    setFeeList(updated)
    onSaveFees(updated)
    setIsCreating(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 bg-white dark:bg-[#160228] text-purple-950 dark:text-white border border-purple-150 dark:border-white/15 rounded-3xl shadow-2xl">
        <DialogHeader className="text-left pb-3 border-b border-purple-150 dark:border-white/10 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-base sm:text-lg font-black text-purple-950 dark:text-white flex items-center gap-2">
              <Sliders className="h-5 w-5 text-purple-700 dark:text-pink-400" />
              <span>Gestão de Taxas, Royalties & Cobranças da Franqueadora</span>
            </DialogTitle>
            <p className="text-xs text-purple-700/80 dark:text-purple-200/70 font-medium mt-0.5">
              Defina cobranças de Royalties, Marketing, Sistema (49€) ou taxas personalizadas por loja
            </p>
          </div>

          {!isCreating && (
            <Button
              type="button"
              onClick={handleOpenCreate}
              className="bg-gradient-to-r from-purple-700 to-pink-600 hover:from-purple-800 hover:to-pink-700 text-white font-bold text-xs rounded-xl shadow-md h-9 px-3.5 cursor-pointer"
            >
              <span>Nova Cobrança</span>
            </Button>
          )}
        </DialogHeader>

        {isCreating ? (
          /* Formulário de Criação / Edição */
          <form onSubmit={handleSaveForm} className="space-y-4 py-2 text-xs">
            <div className="p-3 rounded-2xl bg-purple-50/70 dark:bg-white/5 border border-purple-150 dark:border-white/10 font-bold text-xs text-purple-950 dark:text-white">
              {editingFee ? 'Editar Cobrança Vinculada' : 'Cadastrar Nova Cobrança para a Loja'}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">
                  Unidade / Loja Vinculada:
                </Label>
                <select
                  value={formStoreId}
                  onChange={(e) => setFormStoreId(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 text-xs font-bold text-purple-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600 [&>option]:bg-white dark:[&>option]:bg-[#160228]"
                >
                  <option value="ALL">Todas as Lojas (Regra Geral da Rede)</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">
                  Nome / Título da Cobrança:
                </Label>
                <Input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ex: Licença Sistema & PDV, Royalties, Auditoria..."
                  className="h-9 text-xs rounded-xl bg-white dark:bg-white/5 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">
                  Categoria da Cobrança:
                </Label>
                <select
                  value={formCategory}
                  onChange={(e) => {
                    const cat = e.target.value as any
                    setFormCategory(cat)
                    if (cat === 'SISTEMA') {
                      setFormChargeType('FIXED_AMOUNT')
                      setFormValue(49.0)
                    } else if (cat === 'ROYALTIES') {
                      setFormChargeType('PERCENTAGE')
                      setFormValue(5.0)
                    } else if (cat === 'MARKETING') {
                      setFormChargeType('PERCENTAGE')
                      setFormValue(1.0)
                    }
                  }}
                  className="w-full h-9 px-3 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 text-xs font-bold text-purple-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600 [&>option]:bg-white dark:[&>option]:bg-[#160228]"
                >
                  <option value="SISTEMA">Licença Sistema & PDV (49€)</option>
                  <option value="ROYALTIES">Royalties Operacionais (%)</option>
                  <option value="MARKETING">Fundo de Marketing / Publicidade</option>
                  <option value="OUTROS">Outras Cobranças / Taxas Customizadas</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">
                  Tipo de Cálculo:
                </Label>
                <select
                  value={formChargeType}
                  onChange={(e) => setFormChargeType(e.target.value as any)}
                  className="w-full h-9 px-3 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 text-xs font-bold text-purple-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600 [&>option]:bg-white dark:[&>option]:bg-[#160228]"
                >
                  <option value="FIXED_AMOUNT">Valor Fixo em Euros (€)</option>
                  <option value="PERCENTAGE">% sobre Faturamento Mensal</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">
                  Valor / Percentual:
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    step={formChargeType === 'PERCENTAGE' ? '0.1' : '1'}
                    min="0"
                    value={formValue}
                    onChange={(e) => setFormValue(Number(e.target.value))}
                    className="h-9 text-xs rounded-xl bg-white dark:bg-white/5 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white font-mono font-black pl-3 pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-purple-700 dark:text-pink-400 text-xs">
                    {formChargeType === 'PERCENTAGE' ? '%' : '€'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">
                  Periodicidade / Frequência:
                </Label>
                <select
                  value={formFrequency}
                  onChange={(e) => setFormFrequency(e.target.value as any)}
                  className="w-full h-9 px-3 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 text-xs font-bold text-purple-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600 [&>option]:bg-white dark:[&>option]:bg-[#160228]"
                >
                  <option value="MENSAL">Mensal (Cobrança no Fecho do Mês)</option>
                  <option value="ANUAL">Anual (Taxa de Renovação / Anuidade)</option>
                  <option value="PONTUAL">Pontual / Avulsa (Taxa Única / Serviço)</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">
                  Estado da Cobrança:
                </Label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full h-9 px-3 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 text-xs font-bold text-purple-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600 [&>option]:bg-white dark:[&>option]:bg-[#160228]"
                >
                  <option value="ATIVO">Ativo (Cobrar Normalmente)</option>
                  <option value="ISENTO">Isento (Carência / Cortesia Franqueadora)</option>
                  <option value="SUSPENSO">Suspenso (Temporariamente Inativo)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">
                Observações / Termo Contratual:
              </Label>
              <textarea
                rows={2}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Ex: Valor padrão de licença de sistema para terminais PDV e KDS..."
                className="w-full rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 p-2.5 text-xs text-purple-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-purple-150 dark:border-white/10">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreating(false)}
                className="rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 text-xs font-bold text-purple-950 dark:text-white cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-purple-700 to-pink-600 hover:from-purple-800 hover:to-pink-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
              >
                {editingFee ? 'Atualizar Cobrança' : 'Salvar e Vincular Cobrança'}
              </Button>
            </div>
          </form>
        ) : (
          /* Listagem de Todas as Cobranças Cadastradas */
          <div className="space-y-4 py-2">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-purple-50/70 dark:bg-white/5 border-b border-purple-150 dark:border-white/10 text-[11px] font-black uppercase text-purple-900/80 dark:text-purple-300/70">
                  <tr>
                    <th className="py-3 px-4">Loja Vinculada</th>
                    <th className="py-3 px-4">Cobrança / Finalidade</th>
                    <th className="py-3 px-4">Categoria</th>
                    <th className="py-3 px-4">Valor / Regra</th>
                    <th className="py-3 px-4">Frequência</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100 dark:divide-white/5">
                  {feeList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-purple-700/80 dark:text-purple-300/70 text-xs font-medium">
                        Nenhuma taxa cadastrada. Clique em &quot;Nova Cobrança&quot; para adicionar.
                      </td>
                    </tr>
                  ) : (
                    feeList.map((fee) => (
                      <tr key={fee.id} className="hover:bg-purple-50/50 dark:hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-purple-950 dark:text-white">
                          {fee.storeName}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-purple-900 dark:text-purple-200">
                          <div>{fee.title}</div>
                          {fee.description && (
                            <div className="text-[10px] text-purple-700/70 dark:text-purple-300/60">{fee.description}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant="outline" className="text-[10px] font-bold border-purple-200 dark:border-white/15">
                            {fee.category}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-black text-purple-950 dark:text-pink-300 text-sm">
                          {fee.chargeType === 'PERCENTAGE' ? `${fee.value}% s/ vendas` : formatCurrency(fee.value)}
                        </td>
                        <td className="py-3.5 px-4 text-purple-700/80 dark:text-purple-300/70 font-semibold text-[11px]">
                          {fee.frequency}
                        </td>
                        <td className="py-3.5 px-4">
                          {fee.status === 'ATIVO' && (
                            <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                              Ativo
                            </Badge>
                          )}
                          {fee.status === 'ISENTO' && (
                            <Badge className="bg-purple-500/20 text-purple-700 dark:text-pink-300 border border-purple-500/40 text-[10px] font-bold">
                              Isento
                            </Badge>
                          )}
                          {fee.status === 'SUSPENSO' && (
                            <Badge className="bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                              Suspenso
                            </Badge>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenEdit(fee)}
                              className="h-7 w-7 p-0 rounded-lg text-purple-700 dark:text-pink-400 hover:bg-purple-100 dark:hover:bg-white/10 cursor-pointer"
                              title="Editar Cobrança"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteFee(fee.id)}
                              className="h-7 w-7 p-0 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer"
                              title="Excluir Cobrança"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 text-xs font-bold text-purple-950 dark:text-white cursor-pointer"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
