'use client'

import React, { useState, useEffect } from 'react'
import { DayReportSummary, Order, User } from '@/types'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/stores/authStore'
import DayMetricsCards from './DayMetricsCards'
import OrdersTable from './OrdersTable'
import CancelOrderDialog from './CancelOrderDialog'
import { ClipboardList, Calendar } from 'lucide-react'

interface DayReportProps {
  tenantId: string
  currentUser: User
}

export default function DayReport({ tenantId, currentUser }: DayReportProps) {
  const [summary, setSummary] = useState<DayReportSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null)
  const [cancelOpen, setCancelOpen] = useState(false)
  const { authFetch } = useAuthStore()

  const isAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'TENANT_ADMIN'

  const loadReport = async () => {
    setLoading(true)
    try {
      const res = await authFetch(`/api/reports/day?tenantId=${encodeURIComponent(tenantId)}&date=${selectedDate}`)
      const d = await res.json()
      setSummary(d)
    } catch {
      toast.error('Erro ao carregar fecho de caixa')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadReport() }, [tenantId, selectedDate])

  const handleConfirmCancel = async (orderId: string, reason: string) => {
    try {
      const res = await authFetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao cancelar')
      }
      toast.success('Comanda anulada com sucesso!')
      loadReport()
    } catch (e: any) {
      toast.error(e.message || 'Erro')
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b">
        <div>
          <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-purple-600" />
            <span>Fecho de Caixa e Relatório Diário</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Métricas de vendas diárias e conciliação por método de pagamento
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-8 text-xs w-36"
          />
        </div>
      </div>

      {loading || !summary ? (
        <div className="text-center py-12 text-muted-foreground text-sm">A carregar relatório...</div>
      ) : (
        <div className="space-y-6">
          <DayMetricsCards summary={summary} />

          <div>
            <h3 className="font-bold text-sm text-foreground mb-3">
              Histórico de Comandas do Dia ({summary.orders.length})
            </h3>
            <OrdersTable
              orders={summary.orders}
              isAdmin={isAdmin}
              onCancelClick={(o) => {
                setCancelTarget(o)
                setCancelOpen(true)
              }}
            />
          </div>
        </div>
      )}

      <CancelOrderDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        order={cancelTarget}
        onConfirmCancel={handleConfirmCancel}
      />
    </div>
  )
}
