'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { User, DayReportSummary, Order } from '@/types'
import { formatCurrency } from '@/lib/i18n/formatters'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { getMockStore } from '@/lib/supabase/mockStore'

interface ReportsModuleViewProps {
  tenantId: string
  currentUser: User
}

export default function ReportsModuleView({ tenantId, currentUser }: ReportsModuleViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'invisible' | 'audit' | 'orders'>('overview')
  const [report, setReport] = useState<DayReportSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN'

  const fetchReport = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports/day?tenantId=${encodeURIComponent(tenantId)}`)
      const data = await res.json()
      setReport(data)
    } catch {
      toast.error('Erro ao carregar relatórios')
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const store = getMockStore()
  const auditLogs = (store.auditLogs || []).filter((l) => l.tenantId === tenantId || isSuperAdmin)
  const orders = report?.orders || []
  const invisibleProducts = [
    ...(store.containers || []).filter((c) => c.active === false || c.isAvailableInStore === false).map((c) => ({ ...c, type: 'Recipiente / Tamanho' })),
    ...(store.bases || []).filter((b) => b.active === false || b.isAvailableInStore === false).map((b) => ({ ...b, type: 'Creme Gelado' })),
    ...(store.toppings || []).filter((t) => t.active === false || t.isAvailableInStore === false).map((t) => ({ ...t, type: 'Topping' })),
  ]

  return (
    <div className="space-y-4">
      {/* Header Minimalista */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-purple-100">
        <div>
          <h1 className="text-base sm:text-lg font-black text-foreground tracking-tight">
            Relatórios & Fecho de Caixa
          </h1>
          <p className="text-[11px] text-muted-foreground">
            Desempenho diário, vendas por método e auditoria
          </p>
        </div>

        {/* Sub-Abas dos 5 Relatórios Oficiais */}
        <div className="flex items-center gap-1.5 overflow-x-auto bg-purple-50/80 p-1 rounded-2xl">
          {[
            { id: 'overview', label: 'Visão Geral' },
            { id: 'sales', label: 'Relatório de Vendas' },
            { id: 'invisible', label: `Produtos Invisíveis (${invisibleProducts.length})` },
            { id: 'audit', label: 'Histórico de Alterações', isHqOnly: true },
            { id: 'orders', label: 'Histórico de Pedidos' },
          ].map((tab) => {
            const isTabActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isTabActive
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'text-purple-900 hover:bg-purple-100'
                }`}
              >
                <span>{tab.label}</span>
                {tab.isHqOnly && <span className="ml-1 text-[9px] font-black opacity-80">[HQ]</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. VISÃO GERAL                                            */}
      {/* ========================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white border border-purple-100 shadow-xs">
              <div className="text-[11px] font-bold text-muted-foreground uppercase">Faturamento do Dia</div>
              <div className="text-2xl font-black text-purple-950 mt-1">
                {formatCurrency(report?.total || 0)}
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                {report?.count || 0} comandas pagas
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-purple-100 shadow-xs">
              <div className="text-[11px] font-bold text-muted-foreground uppercase">Ticket Médio</div>
              <div className="text-2xl font-black text-purple-950 mt-1">
                {formatCurrency(report && report.count > 0 ? report.total / report.count : 0)}
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">Por atendimento</div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-purple-100 shadow-xs">
              <div className="text-[11px] font-bold text-muted-foreground uppercase">Cancelamentos / Anulações</div>
              <div className="text-2xl font-black text-red-600 mt-1">
                {formatCurrency(report?.cancelledTotal || 0)}
              </div>
              <div className="text-[11px] text-red-700 font-semibold mt-1">
                {report?.cancelledCount || 0} pedidos cancelados
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-purple-100 shadow-xs">
              <div className="text-[11px] font-bold text-muted-foreground uppercase">Itens Pausados / Ocultos</div>
              <div className="text-2xl font-black text-amber-600 mt-1">
                {invisibleProducts.length}
              </div>
              <div className="text-[11px] text-amber-700 font-semibold mt-1">
                Itens fora do cardápio
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. RELATÓRIO DE VENDAS & MÉTODOS DE PAGAMENTO             */}
      {/* ========================================================= */}
      {activeTab === 'sales' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-xs">
            <h2 className="text-sm font-black text-foreground uppercase tracking-wider mb-4">
              Vendas por Método de Pagamento
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {['MBWAY', 'NUMERARIO', 'CARTAO'].map((method) => {
                const data = (report?.byMethod || {})[method] || { count: 0, total: 0 }
                const label = method === 'MBWAY' ? 'MB Way' : method === 'NUMERARIO' ? 'Numerário (Dinheiro)' : 'Multibanco / Cartão'
                return (
                  <div key={method} className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100">
                    <div className="text-xs font-bold text-purple-950">{label}</div>
                    <div className="text-xl font-black text-foreground mt-1">{formatCurrency(data.total)}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{data.count} pagamentos registados</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. RELATÓRIO DE PRODUTOS INVISÍVEIS                       */}
      {/* ========================================================= */}
      {activeTab === 'invisible' && (
        <div className="bg-white rounded-3xl border border-purple-100 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-purple-100 bg-purple-50/40">
            <h2 className="text-xs font-black uppercase text-purple-950">
              Produtos Atualmente Ocultos ou Pausados no Cardápio
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-purple-50/70 border-b border-purple-100 text-purple-950 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Situação</th>
                  <th className="py-3 px-4">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50">
                {invisibleProducts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      Todos os produtos estão ativos e visíveis no cardápio desta loja.
                    </td>
                  </tr>
                ) : (
                  invisibleProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-purple-50/30">
                      <td className="py-3 px-4 font-bold text-foreground">{p.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{p.type}</td>
                      <td className="py-3 px-4">
                        <Badge className="bg-amber-100 text-amber-900 border-amber-200 text-[10px]">
                          Pausado / Esgotado
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">Ruptura temporária de estoque na unidade</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. HISTÓRICO DE ALTERAÇÕES (EXCLUSIVO FRANQUEADORA)       */}
      {/* ========================================================= */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          {!isSuperAdmin ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-red-200">
              <div className="text-sm font-black text-red-600">Acesso Restrito à Franqueadora</div>
              <p className="text-xs text-muted-foreground mt-1">
                O log de auditoria corporativo e histórico de alterações master é de acesso exclusivo para SUPER_ADMIN.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-purple-100 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-purple-100 bg-purple-50/40 flex justify-between items-center">
                <h2 className="text-xs font-black uppercase text-purple-950">
                  Histórico Corporativo de Alterações & Sincronizações (Audit Log)
                </h2>
                <Badge className="bg-purple-700 text-white text-[9px] font-black uppercase">
                  Exclusivo Franqueadora
                </Badge>
              </div>

              <div className="divide-y divide-purple-50 text-xs">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-purple-50/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-foreground">{log.details}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        Executado por: <span className="font-mono text-purple-900 font-semibold">{log.user}</span>
                      </div>
                    </div>
                    <div className="text-[11px] font-mono text-purple-700 flex-shrink-0">
                      {new Date(log.timestamp).toLocaleString('pt-PT')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. HISTÓRICO DE PEDIDOS                                   */}
      {/* ========================================================= */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl border border-purple-100 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-purple-100 bg-purple-50/40">
            <h2 className="text-xs font-black uppercase text-purple-950">
              Comandas e Pedidos Realizados no Turno
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-purple-50/70 border-b border-purple-100 text-purple-950 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Comanda</th>
                  <th className="py-3 px-4">Mesa / Balcão</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Hora</th>
                  <th className="py-3 px-4">Método</th>
                  <th className="py-3 px-4">Valor</th>
                  <th className="py-3 px-4">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      Nenhum pedido registado no turno atual.
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o.id} className="hover:bg-purple-50/30">
                      <td className="py-3 px-4 font-mono font-bold text-purple-950">#{o.orderNumber || o.id.slice(-4)}</td>
                      <td className="py-3 px-4 font-semibold text-foreground">{o.tableNumber || (o.isTableOrder ? 'Mesa' : 'Balcão')}</td>
                      <td className="py-3 px-4 text-muted-foreground">{o.customerName || 'Cliente Balcão'}</td>
                      <td className="py-3 px-4 font-mono text-[11px]">{new Date(o.createdAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="py-3 px-4 font-semibold">{o.paymentMethod || 'Numerário'}</td>
                      <td className="py-3 px-4 font-mono font-bold text-purple-900">{formatCurrency(o.total || o.totalAmount || 0)}</td>
                      <td className="py-3 px-4">
                        <Badge
                          className={`text-[10px] py-0 px-2 font-bold ${
                            o.status === 'CANCELLED'
                              ? 'bg-red-100 text-red-800 border-red-200'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {o.status === 'CANCELLED' ? 'Cancelado' : 'Pago'}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
