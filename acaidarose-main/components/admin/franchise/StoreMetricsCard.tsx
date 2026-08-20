'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StoreOverview } from '@/types'
import { formatCurrency } from '@/lib/i18n/formatters'
import { Store, Phone, MapPin, CheckCircle, ShieldCheck, Users, Eye, TrendingUp } from 'lucide-react'

interface StoreMetricsCardProps {
  storeOverview: StoreOverview
  isCurrent: boolean
  onSelectStore: (tenant: any) => void
  onViewDetails: (overview: StoreOverview) => void
}

export default function StoreMetricsCard({
  storeOverview,
  isCurrent,
  onSelectStore,
  onViewDetails,
}: StoreMetricsCardProps) {
  const { tenant, metrics, operators } = storeOverview

  return (
    <Card
      className={`p-5 transition-all duration-200 border-2 rounded-3xl flex flex-col justify-between ${
        isCurrent
          ? 'border-purple-600 bg-gradient-to-b from-purple-50/90 to-white shadow-xl ring-2 ring-purple-500/20 scale-[1.01]'
          : 'border-purple-100/80 hover:border-purple-300 hover:shadow-lg bg-white'
      }`}
    >
      <div>
        {/* Header do Card */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-2xl flex items-center justify-center ${
                tenant.isHeadquarters ? 'bg-purple-600 text-white shadow' : 'bg-purple-100 text-purple-700'
              }`}
            >
              {tenant.isHeadquarters ? <ShieldCheck className="h-5 w-5" /> : <Store className="h-5 w-5" />}
            </div>
            <div>
              <div className="font-extrabold text-sm text-foreground leading-tight">{tenant.name}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{tenant.slug}</div>
            </div>
          </div>
          {tenant.isHeadquarters ? (
            <Badge className="bg-purple-600 text-white text-[10px] font-bold">Matriz HQ</Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-300 bg-emerald-50 font-bold">
              Ativa
            </Badge>
          )}
        </div>

        {/* Métricas Rápidas da Unidade */}
        <div className="grid grid-cols-2 gap-2 my-3 p-3 bg-purple-50/50 rounded-2xl border border-purple-100 text-center">
          <div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase">Faturação Hoje</div>
            <div className="font-black text-sm text-purple-900 mt-0.5">{formatCurrency(metrics.todayRevenue)}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase">Comandas / MB Way</div>
            <div className="font-black text-sm text-purple-900 mt-0.5">
              {metrics.todayOrdersCount} <span className="text-[10px] text-muted-foreground font-semibold">({metrics.mbwaySharePercent}%)</span>
            </div>
          </div>
        </div>

        {/* Informações da Loja */}
        <div className="text-xs text-muted-foreground space-y-1.5 mb-4">
          {tenant.address && (
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="h-3.5 w-3.5 text-purple-600 flex-shrink-0" />
              <span className="truncate">{tenant.address}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="flex items-center gap-1.5 text-purple-900 font-semibold">
              <Users className="h-3.5 w-3.5 text-purple-600" />
              <span>Operadores de Caixa:</span>
            </span>
            <Badge variant="secondary" className="text-[10px] font-black bg-purple-100 text-purple-800">
              {operators.length} / {metrics.maxOperators}
            </Badge>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="pt-3 border-t border-purple-100 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onViewDetails(storeOverview)}
          className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 p-1 hover:underline"
        >
          <Eye className="h-3.5 w-3.5" />
          <span>Ver Raio-X</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectStore(tenant)}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
            isCurrent
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-purple-50 hover:bg-purple-100 text-purple-700'
          }`}
        >
          {isCurrent ? 'Loja Ativa' : 'Aceder Loja'}
        </button>
      </div>
    </Card>
  )
}
