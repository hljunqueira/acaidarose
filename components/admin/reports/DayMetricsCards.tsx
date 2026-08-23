'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { DayReportSummary } from '@/types'
import { formatCurrency } from '@/lib/i18n/formatters'
import { DollarSign, ShoppingBag, XCircle, TrendingUp, Smartphone, CreditCard, Coins, Truck } from 'lucide-react'

interface DayMetricsCardsProps {
  summary: DayReportSummary
}

export default function DayMetricsCards({ summary }: DayMetricsCardsProps) {
  const avgTicket = summary.count > 0 ? summary.total / summary.count : 0

  return (
    <div className="space-y-3">
      {/* Top 3 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4 bg-white border-2 border-emerald-100 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Faturamento do Dia</div>
            <div className="text-lg font-black text-emerald-700">{formatCurrency(summary.total)}</div>
          </div>
        </Card>

        <Card className="p-4 bg-white border-2 border-purple-100 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Comandas Pagas</div>
            <div className="text-lg font-black text-purple-700">{summary.count} pedidos</div>
          </div>
        </Card>

        <Card className="p-4 bg-white border-2 border-blue-100 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Ticket Médio</div>
            <div className="text-lg font-black text-blue-700">{formatCurrency(avgTicket)}</div>
          </div>
        </Card>

        <Card className="p-4 bg-white border-2 border-red-100 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Anuladas / Canceladas</div>
            <div className="text-lg font-black text-red-600">{summary.cancelledCount} ({formatCurrency(summary.cancelledTotal)})</div>
          </div>
        </Card>
      </div>

      {/* Breakdown de Pagamento */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        <div className="p-2.5 bg-purple-50 rounded-lg border border-purple-200 flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 font-semibold text-purple-900"><Smartphone className="h-3.5 w-3.5" /> MB Way</span>
          <span className="font-bold text-purple-950">{formatCurrency(summary.byMethod?.MB_WAY?.total || 0)}</span>
        </div>
        <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-200 flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 font-semibold text-blue-900"><CreditCard className="h-3.5 w-3.5" /> Multibanco</span>
          <span className="font-bold text-blue-950">{formatCurrency(summary.byMethod?.MULTIBANCO?.total || 0)}</span>
        </div>
        <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 font-semibold text-amber-900"><Coins className="h-3.5 w-3.5" /> Numerário</span>
          <span className="font-bold text-amber-950">{formatCurrency(summary.byMethod?.NUMERARIO?.total || 0)}</span>
        </div>
        <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 font-semibold text-gray-900"><Truck className="h-3.5 w-3.5" /> Plataforma</span>
          <span className="font-bold text-gray-950">{formatCurrency(summary.byMethod?.PLATAFORMA?.total || 0)}</span>
        </div>
      </div>
    </div>
  )
}
