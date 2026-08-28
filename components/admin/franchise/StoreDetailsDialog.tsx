'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StoreOverview, User } from '@/types'
import { formatCurrency } from '@/lib/i18n/formatters'
import {
  Store,
  Users,
  MapPin,
  Phone,
  CreditCard,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  TrendingUp,
  Mail,
  Building2,
  Calendar,
  Plus,
} from 'lucide-react'

import EditRoyaltyDialog, { FranchiseContractData } from './EditRoyaltyDialog'

interface StoreDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  storeOverview: StoreOverview | null
  contract?: FranchiseContractData
  onSelectStore: (tenant: any) => void
  onAddUserForStore?: (tenantId: string) => void
  onEditUser?: (user: any) => void
  onDeleteUser?: (id: string) => void
  onEditContract?: (contract: FranchiseContractData) => void
}

export default function StoreDetailsDialog({
  open,
  onOpenChange,
  storeOverview,
  contract,
  onSelectStore,
  onAddUserForStore,
  onEditUser,
  onDeleteUser,
  onEditContract,
}: StoreDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'team' | 'contract' | 'metrics'>('info')

  if (!storeOverview) return null
  const { tenant, metrics, operators, manager } = storeOverview

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-3xl bg-white dark:bg-[#160228] border border-purple-100 dark:border-white/15 shadow-2xl text-slate-900 dark:text-white">
        {/* Header da Ficha 360 */}
        <DialogHeader className="pb-3 border-b border-purple-100 dark:border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-700 to-pink-600 text-white flex items-center justify-center shadow-md">
                {tenant.isHeadquarters ? <ShieldCheck className="h-6 w-6" /> : <Store className="h-6 w-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-lg font-black tracking-tight text-purple-950 dark:text-white">
                    {tenant.name}
                  </DialogTitle>
                  <Badge className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-[9px] font-black uppercase px-2">
                    {tenant.isHeadquarters ? 'Sede Matriz' : 'Franquia Ativa'}
                  </Badge>
                </div>
                <div className="text-xs text-purple-700/80 dark:text-purple-200/70">
                  Slug: <span className="font-mono font-bold text-purple-950 dark:text-pink-300">{tenant.slug}</span> · NIF: <span className="font-mono font-bold">{tenant.nif || '509123456'}</span>
                </div>
              </div>
            </div>

            {/* Alternador de Abas da Ficha */}
            <div className="flex flex-wrap items-center gap-1 bg-purple-50/70 dark:bg-white/5 p-1 rounded-2xl border border-purple-150 dark:border-white/10 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setActiveTab('info')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'info'
                    ? 'bg-purple-700 dark:bg-pink-600 text-white shadow-xs'
                    : 'text-purple-900 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white'
                }`}
              >
                Geral
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('team')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'team'
                    ? 'bg-purple-700 dark:bg-pink-600 text-white shadow-xs'
                    : 'text-purple-900 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white'
                }`}
              >
                Equipa ({operators.length + (manager ? 1 : 0)})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('contract')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'contract'
                    ? 'bg-purple-700 dark:bg-pink-600 text-white shadow-xs'
                    : 'text-purple-900 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white'
                }`}
              >
                Royalties
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('metrics')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'metrics'
                    ? 'bg-purple-700 dark:bg-pink-600 text-white shadow-xs'
                    : 'text-purple-900 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white'
                }`}
              >
                Vendas
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* Conteúdo Dinâmico por Aba */}
        <div className="py-2 space-y-4 min-h-[220px]">
          {/* 1. ABA VISÃO GERAL & DADOS CADASTRAIS */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-white/5 border border-purple-100 dark:border-white/10 space-y-2">
                  <div className="text-xs font-black uppercase text-purple-700 dark:text-pink-300 tracking-wider">
                    Dados Fiscais & Endereço
                  </div>
                  <div className="text-xs space-y-1.5 text-purple-950 dark:text-purple-100">
                    <div><b>Razão Social:</b> {tenant.companyName || 'Rose & Vavá Portugal Lda'}</div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-purple-600 dark:text-pink-400 shrink-0" />
                      <span>{tenant.address || 'Praça 5 de Outubro 12'}</span>
                    </div>
                    <div><b>Código Postal:</b> {tenant.postalCode || '2350-754'} {tenant.city || 'Torres Novas'}</div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-white/5 border border-purple-100 dark:border-white/10 space-y-2">
                  <div className="text-xs font-black uppercase text-purple-700 dark:text-pink-300 tracking-wider">
                    Contactos & MB WAY
                  </div>
                  <div className="text-xs space-y-1.5 text-purple-950 dark:text-purple-100">
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-purple-600 dark:text-pink-400 shrink-0" />
                      <span>Telemóvel: <b>{tenant.phone || '+351 911 050 264'}</b></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-purple-600 dark:text-pink-400 shrink-0" />
                      <span>MB WAY Loja: <b className="text-purple-700 dark:text-pink-300">{tenant.mbwayPhone || '+351 911 050 264'}</b></span>
                    </div>
                    <div><b>Wi-Fi Clientes:</b> {tenant.wifiNetwork || 'AcaiDaRose_Clientes'}</div>
                  </div>
                </div>
              </div>

              {/* Gerente Responsável */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-black">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-emerald-950 dark:text-emerald-200">
                      {manager?.name || 'Gerente da Unidade'}
                    </div>
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-300/80 font-mono">
                      {manager?.email || `gerente.${tenant.slug}@acairose.pt`}
                    </div>
                  </div>
                </div>
                <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                  Gerente Titular
                </Badge>
              </div>
            </div>
          )}

          {/* 2. ABA EQUIPA & UTILIZADORES */}
          {activeTab === 'team' && (
            <div className="space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-purple-100 dark:border-white/10">
                <div>
                  <div className="text-xs font-black text-purple-950 dark:text-white">
                    Colaboradores da Unidade ({operators.length + (manager ? 1 : 0)})
                  </div>
                  <div className="text-[10px] text-purple-700/80 dark:text-purple-200/70">
                    Acessos ao PDV e gestão desta filial
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge className="bg-purple-100 dark:bg-pink-500/20 text-purple-800 dark:text-pink-300 border border-purple-200 dark:border-pink-500/30 text-[10px] font-bold">
                    {operators.length} de {metrics.maxOperators} caixas
                  </Badge>

                  {onAddUserForStore && (
                    <Button
                      size="sm"
                      onClick={() => onAddUserForStore(tenant.id)}
                      className="h-7 px-2.5 bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 hover:from-purple-800 hover:to-pink-700 text-white font-bold text-[10px] rounded-lg shadow-xs cursor-pointer gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Adicionar</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Gerente */}
              {manager && (
                <div className="p-3 rounded-2xl bg-purple-50/50 dark:bg-white/5 border border-purple-150 dark:border-white/10 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-700 to-pink-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      <UserCheck className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-purple-950 dark:text-white flex items-center gap-1.5">
                        <span>{manager.name}</span>
                        <Badge className="bg-purple-100 dark:bg-pink-500/20 text-purple-800 dark:text-pink-300 text-[8px] font-bold py-0">
                          GERENTE
                        </Badge>
                      </div>
                      <div className="text-[10px] text-purple-700/80 dark:text-purple-200/70 font-mono">{manager.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {onEditUser && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEditUser({ ...manager, role: 'TENANT_ADMIN', tenantId: tenant.id })}
                        className="h-7 w-7 p-0 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-white/10 rounded-lg cursor-pointer"
                        title="Editar Gerente"
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Operadores de Caixa */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                  Operadores de Caixa ({operators.length})
                </div>

                {operators.length === 0 ? (
                  <div className="py-6 text-center text-xs text-purple-700/70 dark:text-purple-200/60 font-medium bg-purple-50/30 dark:bg-white/[0.02] rounded-2xl border border-dashed border-purple-200 dark:border-white/10">
                    Nenhum operador de caixa registado nesta unidade.
                  </div>
                ) : (
                  operators.map((op, idx) => (
                    <div key={op.id} className="p-2.5 rounded-2xl bg-white dark:bg-white/5 border border-purple-150 dark:border-white/10 flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-xl bg-purple-100 dark:bg-white/10 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-xs">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-purple-950 dark:text-white flex items-center gap-1.5">
                            <span>{op.name}</span>
                            <Badge className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-[8px] font-bold py-0">
                              CAIXA ATIVO
                            </Badge>
                          </div>
                          <div className="text-[10px] text-purple-700/80 dark:text-purple-200/70 font-mono">{op.email}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {onEditUser && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onEditUser({ ...op, role: 'CASHIER', tenantId: tenant.id })}
                            className="h-7 w-7 p-0 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-white/10 rounded-lg cursor-pointer"
                            title="Editar Utilizador"
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {onDeleteUser && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onDeleteUser(op.id)}
                            className="h-7 w-7 p-0 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg cursor-pointer"
                            title="Desativar Utilizador"
                          >
                            <ArrowRight className="h-3.5 w-3.5 rotate-45" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 3. ABA ROYALTIES & CONTRATO */}
          {activeTab === 'contract' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-purple-100 dark:border-white/10">
                <div>
                  <div className="text-xs font-black text-purple-950 dark:text-white">
                    Condições Financeiras & Royalties da Franquia
                  </div>
                  <div className="text-[10px] text-purple-700/80 dark:text-purple-200/70">
                    Alíquotas contratuais aplicadas sobre o faturamento
                  </div>
                </div>

                <div>
                  {contract?.paymentStatus === 'PAID' && (
                    <Badge className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-[9px] font-bold">
                      Liquidado
                    </Badge>
                  )}
                  {contract?.paymentStatus === 'PENDING' && (
                    <Badge className="bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 text-[9px] font-bold">
                      Fecho Dia 05
                    </Badge>
                  )}
                  {contract?.paymentStatus === 'GRACE' && (
                    <Badge className="bg-purple-100 dark:bg-pink-500/20 text-purple-800 dark:text-pink-300 border border-purple-200 dark:border-pink-500/30 text-[9px] font-bold">
                      Carência (0%)
                    </Badge>
                  )}
                </div>
              </div>

              {/* Informações Contratuais */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs p-3 rounded-2xl bg-purple-50/50 dark:bg-white/5 border border-purple-100 dark:border-white/10">
                <div>
                  <span className="text-purple-700/80 dark:text-purple-200/70">Data Início:</span> <b className="text-purple-950 dark:text-white">{contract?.startDate || '15/01/2024'}</b>
                </div>
                <div>
                  <span className="text-purple-700/80 dark:text-purple-200/70">Renovação:</span> <b className="text-purple-950 dark:text-white">{contract?.renewalDate || '15/01/2029'}</b>
                </div>
                <div>
                  <span className="text-purple-700/80 dark:text-purple-200/70">Royalties:</span> <b className="text-purple-700 dark:text-pink-300 font-bold">{contract?.royaltyPercent ?? 4}%</b>
                </div>
                <div>
                  <span className="text-purple-700/80 dark:text-purple-200/70">Marketing:</span> <b className="text-purple-950 dark:text-white">{contract?.marketingPercent ?? 2}%</b>
                </div>
                <div>
                  <span className="text-purple-700/80 dark:text-purple-200/70">Sistema / PDV:</span> <b className="text-purple-950 dark:text-white font-bold">{formatCurrency(contract?.systemFeeMonthly ?? 99)}/mês</b>
                </div>
                <div>
                  <span className="text-purple-700/80 dark:text-purple-200/70">Franquia Fee:</span> <b className="text-purple-950 dark:text-white">{formatCurrency(contract?.franchiseFee ?? 25000)}</b>
                </div>
              </div>

              {/* Demonstrativo Financeiro */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-white/5 border border-purple-150 dark:border-white/10 space-y-1.5 text-xs shadow-2xs">
                <div className="flex justify-between items-center">
                  <span className="text-purple-700/80 dark:text-purple-200/70">Faturamento Declarado / Mês:</span>
                  <span className="font-bold text-purple-950 dark:text-white font-mono">
                    {formatCurrency(contract?.monthlyRevenue || metrics.todayRevenue * 20)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-purple-700/80 dark:text-purple-200/70">Royalties ({contract?.royaltyPercent ?? 4}%):</span>
                  <span className="font-bold text-purple-700 dark:text-pink-300 font-mono">
                    {formatCurrency((contract?.monthlyRevenue || metrics.todayRevenue * 20) * ((contract?.royaltyPercent ?? 4) / 100))}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-purple-700/80 dark:text-purple-200/70">Fundo Marketing ({contract?.marketingPercent ?? 2}%):</span>
                  <span className="font-bold text-purple-950 dark:text-white font-mono">
                    {formatCurrency((contract?.monthlyRevenue || metrics.todayRevenue * 20) * ((contract?.marketingPercent ?? 2) / 100))}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-purple-700/80 dark:text-purple-200/70">Licença Sistema & PDV Cloud:</span>
                  <span className="font-bold text-purple-950 dark:text-white font-mono">
                    {formatCurrency(contract?.systemFeeMonthly ?? 99)}
                  </span>
                </div>
                <div className="pt-2 border-t border-purple-200 dark:border-white/10 flex justify-between items-center font-bold">
                  <span className="text-purple-950 dark:text-white">Total Devido à Holding:</span>
                  <span className="font-black text-sm text-emerald-600 dark:text-emerald-400 font-mono">
                    {formatCurrency(
                      (contract?.monthlyRevenue || metrics.todayRevenue * 20) *
                        (((contract?.royaltyPercent ?? 4) + (contract?.marketingPercent ?? 2)) / 100) +
                        (contract?.systemFeeMonthly ?? 99)
                    )}
                  </span>
                </div>
              </div>

              {/* Ação de Ajuste de Taxas */}
              <div className="pt-2 flex items-center justify-end gap-2">
                {contract && onEditContract && (
                  <Button
                    size="sm"
                    onClick={() => onEditContract(contract)}
                    className="h-8 bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 hover:from-purple-800 hover:to-pink-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer gap-1.5"
                  >
                    <span>Ajustar Taxas & Carência</span>
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* 4. ABA VENDAS & MÉTRICAS */}
          {activeTab === 'metrics' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-4 bg-purple-50/70 dark:bg-white/5 rounded-2xl border border-purple-100 dark:border-white/10">
                  <div className="text-[10px] font-bold text-purple-700/80 dark:text-purple-200/70 uppercase">Faturamento Hoje</div>
                  <div className="font-black text-lg text-purple-950 dark:text-pink-300 font-mono mt-1">
                    {formatCurrency(metrics.todayRevenue)}
                  </div>
                </div>

                <div className="p-4 bg-purple-50/70 dark:bg-white/5 rounded-2xl border border-purple-100 dark:border-white/10">
                  <div className="text-[10px] font-bold text-purple-700/80 dark:text-purple-200/70 uppercase">Comandas Pagas</div>
                  <div className="font-black text-lg text-purple-950 dark:text-white font-mono mt-1">
                    {metrics.todayOrdersCount}
                  </div>
                </div>

                <div className="p-4 bg-purple-50/70 dark:bg-white/5 rounded-2xl border border-purple-100 dark:border-white/10">
                  <div className="text-[10px] font-bold text-purple-700/80 dark:text-purple-200/70 uppercase">MB WAY Mix</div>
                  <div className="font-black text-lg text-purple-950 dark:text-pink-300 font-mono mt-1">
                    {metrics.mbwaySharePercent}%
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-purple-50/30 dark:bg-white/5 border border-purple-100 dark:border-white/10 text-xs text-purple-900 dark:text-purple-200 flex items-center justify-between">
                <span>Contrato de Franquia: <b>Ativo</b></span>
                <span>Taxa de Royalties: <b>{tenant.isHeadquarters ? 'Isento (Matriz)' : '4.0%'}</b></span>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé com Botão de Aceder */}
        <DialogFooter className="pt-3 border-t border-purple-100 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs font-bold rounded-xl border-purple-200 dark:border-white/15 cursor-pointer w-full sm:w-auto"
          >
            Fechar Ficha
          </Button>

          <Button
            size="sm"
            onClick={() => {
              onSelectStore(tenant)
              onOpenChange(false)
            }}
            className="bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 hover:from-purple-800 hover:to-pink-700 dark:hover:from-pink-500 dark:hover:to-purple-500 text-white text-xs font-bold gap-1.5 shadow-md shadow-purple-700/20 dark:shadow-pink-600/30 rounded-xl cursor-pointer w-full sm:w-auto px-4"
          >
            <span>Aceder ao Painel desta Loja</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
