'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StoreOverview } from '@/types'
import { formatCurrency } from '@/lib/i18n/formatters'
import { Store, Users, MapPin, Phone, CreditCard, ShieldCheck, UserCheck, ArrowRight } from 'lucide-react'

interface StoreDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  storeOverview: StoreOverview | null
  onSelectStore: (tenant: any) => void
}

export default function StoreDetailsDialog({
  open,
  onOpenChange,
  storeOverview,
  onSelectStore,
}: StoreDetailsDialogProps) {
  if (!storeOverview) return null
  const { tenant, metrics, operators, manager } = storeOverview

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
              {tenant.isHeadquarters ? <ShieldCheck className="h-6 w-6" /> : <Store className="h-6 w-6" />}
            </div>
            <div>
              <DialogTitle className="text-lg font-black tracking-tight">{tenant.name}</DialogTitle>
              <div className="text-xs text-muted-foreground">{tenant.slug} · NIF: {tenant.nif || 'Não informado'}</div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {/* Métricas da Loja */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100">
              <div className="text-[10px] font-bold text-muted-foreground uppercase">Faturação Hoje</div>
              <div className="font-black text-base text-purple-900 mt-0.5">{formatCurrency(metrics.todayRevenue)}</div>
            </div>
            <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100">
              <div className="text-[10px] font-bold text-muted-foreground uppercase">Comandas</div>
              <div className="font-black text-base text-purple-900 mt-0.5">{metrics.todayOrdersCount}</div>
            </div>
            <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100">
              <div className="text-[10px] font-bold text-muted-foreground uppercase">MB Way Mix</div>
              <div className="font-black text-base text-purple-900 mt-0.5">{metrics.mbwaySharePercent}%</div>
            </div>
          </div>

          {/* Dados Cadastrais */}
          <div className="p-3.5 bg-muted/40 rounded-2xl border space-y-1.5 text-xs text-muted-foreground">
            {tenant.address && (
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-purple-600 flex-shrink-0" />
                <span className="truncate">{tenant.address}</span>
              </div>
            )}
            {tenant.mbwayPhone && (
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-purple-600 flex-shrink-0" />
                <span>Telefone MB Way: <b>{tenant.mbwayPhone}</b></span>
              </div>
            )}
            {manager && (
              <div className="flex items-center gap-2">
                <UserCheck className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                <span>Gerente da Loja: <b>{manager.name}</b> ({manager.email})</span>
              </div>
            )}
          </div>

          {/* Equipa de Operadores de Caixa (Limite 3) */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold mb-2">
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-purple-600" />
                <span>Operadores de Caixa da Unidade</span>
              </span>
              <Badge variant="secondary" className="text-[10px] font-extrabold bg-purple-100 text-purple-800">
                {operators.length} de {metrics.maxOperators} autorizados
              </Badge>
            </div>

            <div className="space-y-1.5">
              {operators.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-2">Nenhum operador de caixa registado nesta loja.</div>
              ) : (
                operators.map((op, idx) => (
                  <div key={op.id} className="p-2.5 bg-white rounded-xl border flex justify-between items-center text-xs shadow-2xs">
                    <div>
                      <span className="font-extrabold text-foreground">{idx + 1}. {op.name}</span>
                      <span className="text-[10px] text-muted-foreground ml-2">({op.email})</span>
                    </div>
                    <Badge className="bg-emerald-500 text-white text-[9px] py-0 font-bold">Ativo</Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2 flex items-center justify-between sm:justify-between">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs font-bold">
            Fechar
          </Button>

          <Button
            size="sm"
            onClick={() => {
              onSelectStore(tenant)
              onOpenChange(false)
            }}
            className="bg-purple-600 hover:bg-purple-700 text-xs font-black gap-1.5"
          >
            <span>Aceder como esta Loja</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
