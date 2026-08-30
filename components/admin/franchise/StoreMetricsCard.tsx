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
      className={`p-5 transition-all duration-200 rounded-3xl flex flex-col justify-between text-slate-900 dark:text-white shadow-xs dark:shadow-xl ${
        isCurrent
          ? 'border-purple-600 dark:border-pink-500 bg-purple-50/70 dark:bg-gradient-to-b dark:from-[#24043d] dark:to-[#160228] ring-2 ring-purple-600/30 dark:ring-pink-500/30 scale-[1.01]'
          : 'border-purple-150 dark:border-white/15 hover:border-purple-400 dark:hover:border-pink-500/50 bg-white dark:bg-[#160228]/95'
      }`}
    >
      <div>
        {/* Header do Card */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-2xl flex items-center justify-center ${
                tenant.isHeadquarters ? 'bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 text-white shadow-md' : 'bg-purple-50 dark:bg-white/5 text-purple-700 dark:text-pink-400 border border-purple-150 dark:border-white/10'
              }`}
            >
              {tenant.isHeadquarters ? <ShieldCheck className="h-5 w-5" /> : <Store className="h-5 w-5" />}
            </div>
            <div>
              <div className="font-black text-sm text-purple-950 dark:text-white leading-tight">{tenant.name}</div>
              <div className="text-[11px] text-purple-600/70 dark:text-purple-200/60 mt-0.5 font-mono">{tenant.slug}</div>
            </div>
          </div>
          {tenant.isHeadquarters ? (
            <Badge className="bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 text-white text-[10px] font-bold border-0">Matriz HQ</Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30 bg-emerald-100 dark:bg-emerald-500/20 font-bold">
              Ativa
            </Badge>
          )}
        </div>

        {/* Métricas Rápidas da Unidade */}
        <div className="grid grid-cols-2 gap-2 my-3 p-3 bg-purple-50/50 dark:bg-white/5 rounded-2xl border border-purple-150 dark:border-white/10 text-center">
          <div>
            <div className="text-[10px] font-bold text-purple-700/80 dark:text-purple-200/70 uppercase">Faturação Hoje</div>
            <div className="font-black text-sm text-purple-950 dark:text-pink-300 font-mono mt-0.5">{formatCurrency(metrics.todayRevenue)}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-purple-700/80 dark:text-purple-200/70 uppercase">Comandas / MB Way</div>
            <div className="font-black text-sm text-purple-950 dark:text-white font-mono mt-0.5">
              {metrics.todayOrdersCount} <span className="text-[10px] text-purple-600/80 dark:text-purple-200/60 font-semibold">{metrics.mbwaySharePercent}%</span>
            </div>
          </div>
        </div>

        {/* Informações da Loja */}
        <div className="text-xs text-purple-700/80 dark:text-purple-200/70 space-y-1.5 mb-4">
          {tenant.address && (
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="h-3.5 w-3.5 text-purple-700 dark:text-pink-400 flex-shrink-0" />
              <span className="truncate">{tenant.address}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="flex items-center gap-1.5 text-purple-900 dark:text-purple-200 font-semibold">
              <Users className="h-3.5 w-3.5 text-purple-700 dark:text-pink-400" />
              <span>Operadores de Caixa:</span>
            </span>
            <Badge variant="secondary" className="text-[10px] font-black bg-purple-100 dark:bg-white/10 text-purple-950 dark:text-pink-300 border border-purple-200 dark:border-white/10">
              {operators.length} / {metrics.maxOperators}
            </Badge>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="pt-3 border-t border-purple-150 dark:border-white/10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onViewDetails(storeOverview)}
            className="text-xs font-bold text-purple-700 dark:text-pink-400 hover:text-purple-950 dark:hover:text-pink-300 flex items-center gap-1 p-1 hover:underline cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Ver Raio-X</span>
          </button>

          <a
            href={`/menu?tenantId=${encodeURIComponent(tenant.id)}&loja=${encodeURIComponent(tenant.slug || 'torres-novas')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300 hover:underline inline-flex items-center gap-1"
            title="Abrir o Cardápio QR Code desta Loja"
          >
            <span>Cardápio</span>
            <span>↗</span>
          </a>
        </div>

        <button
          type="button"
          onClick={() => onSelectStore(tenant)}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
            isCurrent
              ? 'bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 text-white shadow-xs'
              : 'bg-purple-50 dark:bg-white/5 hover:bg-purple-100 dark:hover:bg-white/10 text-purple-950 dark:text-white border border-purple-200 dark:border-white/15'
          }`}
        >
          {isCurrent ? 'Loja Ativa' : 'Aceder Loja'}
        </button>
      </div>
    </Card>
  )
}
